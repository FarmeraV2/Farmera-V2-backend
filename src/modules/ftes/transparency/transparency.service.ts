import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { GM_EPSILON, W_FARM_AI, W_FARM_OFR, W_FARM_MV } from '../../crop-management/constants/weight.constant';
import { SeasonService } from 'src/modules/crop-management/season/season.service';
import { FarmService } from 'src/modules/farm/farm/farm.service';
import { AuditService } from 'src/core/audit/audit.service';
import { ActorType } from 'src/core/audit/enums/actor-type';
import { AuditEventID } from 'src/core/audit/enums/audit_event_id';
import { AuditResult } from 'src/core/audit/enums/audit-result';
import { FarmOverallScore, FarmTransparencyScore } from '../interfaces/farm-transparency.interface';
import { OrderService } from 'src/modules/order/order/order.service';

@Injectable()
export class TransparencyService {
    private readonly logger = new Logger(TransparencyService.name);

    constructor(
        private readonly seasonService: SeasonService,
        private readonly farmService: FarmService,
        private readonly auditService: AuditService,
        private readonly orderService: OrderService,
    ) { }

    async onModuleInit() {
        // await this.handleCalcFarmTSCron();
    }

    // ─── Farm Transparency Score (AI dimension) ────────────────────────────────
    //
    // This function computes the Audit Integrity (AI) component of a farm's
    // transparency profile. It is one input to FarmOverallScore, not the
    // composite score itself.
    //
    // ── Formula ────────────────────────────────────────────────────────────────
    //
    //   T_farm = exp( (1/N) × Σ ln(max(sᵢ, ε)) )     [Geometric mean]
    //
    //   where:
    //     sᵢ = trust_score_i / 100  ∈ [0, 1]   (on-chain score, normalized)
    //     ε  = GM_EPSILON = 0.01                (floor to prevent ln(0))
    //     N  = total logs with trust_score IS NOT NULL
    //
    // ── Why Geometric Mean ───────────────────────────────────────────────────
    //
    // [1] AM-GM inequality: GM ≤ AM — geometric mean is inherently more
    //     conservative; appropriate for trust/risk assessment.
    //
    // [2] Outlier sensitivity: one low-scoring log (sᵢ → ε) pulls T_farm
    //     down sharply. Arithmetic mean dilutes it by factor 1/N.
    //     Example: 9 logs at 1.0, 1 log at 0.01 →
    //       AM = 0.901,  GM = 0.631  (GM penalises the anomaly)
    //
    // [3] Ordinal robustness: geometric mean rankings are stable under
    //     monotone rescaling of the on-chain score formula (counterexample
    //     proof in academic framework). Arithmetic mean rankings are not.
    //
    // [4] UNDP HDI (2010) Technical Note 1:
    //     "The geometric mean reduces the level of substitutability between
    //     dimensions … a 1% decline in any index has the same impact."
    //     Applied here: a weak log cannot be offset by strong logs.
    //     UNDP (2010). Human Development Report 2010. UN Dev. Programme.
    //     https://hdr.undp.org/content/human-development-report-2010

    private async calcFarmTransparencyScore(farmId: number): Promise<FarmTransparencyScore | null> {
        try {
            const trustScores = await this.seasonService.getFarmLogScores(farmId);
            const N = trustScores.length;

            // No on-chain evidence yet — score is undefined, not 0.5.
            // Geometric mean of an empty set is undefined; returning null
            // prevents writing a spurious score to the farm record.
            if (N === 0) return null;

            // ── [1–4] Geometric mean of normalized on-chain trust scores ──────
            // sᵢ = trust_score / 100 ∈ [0,1]; floor at ε to avoid ln(0)
            const logSum = trustScores.reduce((acc, s) => acc + Math.log(Math.max(s / 100, GM_EPSILON)), 0);
            const score = Math.exp(logSum / N);

            this.logger.debug(`Farm #${farmId}: N=${N}, T_farm=${score.toFixed(3)}`);

            return { score, total_evidence: N };
        } catch (error) {
            this.logger.error(`Failed to calculate farm transparency score: ${error.message}`);
            throw new InternalServerErrorException({
                message: 'Failed to calculate farm transparency score',
                code: ResponseCode.INTERNAL_ERROR,
            });
        }
    }

    // ─── Daily Cron: Recalculate Farm Scores ─────────────────────────────────

    @Cron('0 3 * * *')
    async handleCalcFarmTSCron() {
        this.logger.log('Running daily farm transparency score calculation cron job');
        try {
            await this.auditService.log({
                actor_type: ActorType.SYSTEM,
                audit_event_id: AuditEventID.FTS001,
                result: AuditResult.SUCCESS,
                metadata: { executed_at: new Date() },
            });

            const farmIds = await this.farmService.getAllFarmIds();
            let success = 0;
            for (const id of farmIds) {
                try {
                    const score = await this.calcFarmOverallScore(id);
                    if (score === null) {
                        this.logger.debug(`Farm ${id}: no on-chain evidence yet, skipping`);
                        continue;
                    }
                    this.logger.debug(`Farm ${id}: S_farm=${score.total.toFixed(3)}, AI=${score.transparency.toFixed(3)}, OFR=${score.order_fulfillment?.toFixed(3) ?? 'N/A'}, MV=${score.market_validation?.toFixed(3) ?? 'N/A'}`);
                    await this.farmService.updateTransparencyScore(id, score);
                    success += 1;
                } catch (error) {
                    this.logger.error(`Failed to run farm ${id}'s transparency cron job`, error.message);
                    await this.auditService.log({
                        actor_type: ActorType.SYSTEM,
                        audit_event_id: AuditEventID.FTS002,
                        result: AuditResult.FAILED,
                        metadata: { farm_id: id, error: error.message },
                    });
                }
            }

            await this.auditService.log({
                actor_type: ActorType.SYSTEM,
                audit_event_id: AuditEventID.FTS003,
                result: AuditResult.SUCCESS,
                metadata: { total_farms: farmIds.length, success, failed: farmIds.length - success },
            });
        } catch (error) {
            await this.auditService.log({
                actor_type: ActorType.SYSTEM,
                audit_event_id: AuditEventID.FTS004,
                result: AuditResult.FAILED,
                metadata: { error: error.message },
            });
            this.logger.error('Failed to run farm transparency cron job', error.message);
        }
    }

    // ─── Farm Overall Score (Tier 4 composite) ───────────────────────────────
    //
    //   S_farm = AI^w_AI × OFR^w_OFR × MV^w_MV   (weights renormalize if dim absent)
    //
    //   AI  — Audit Integrity (T_farm from geometric mean of on-chain log scores)
    //   OFR — Order Fulfillment Rate (fulfilled / (fulfilled + cancelled))
    //   MV  — Market Validation (avg review rating / 5)
    //
    //   Criterion selection: Golan et al. (2004); Dickson (1966); Parasuraman et al. (1988)
    //   Aggregation: weighted geometric mean (Saaty 1980) — weights renormalize when
    //   a dimension has no data so the composite remains in [0, 1].

    async calcFarmOverallScore(farmId: number): Promise<FarmOverallScore | null> {
        const ai = await this.calcFarmTransparencyScore(farmId);
        if (ai === null) return null; // No on-chain evidence — cannot compute composite

        const ofrRate = await this.orderService.getOrderFulfillmentRate(farmId);
        const mv = await this.calcCustomerSatisfaction(farmId);

        // Build active dimensions for WGM renormalization
        type Dim = { value: number; weight: number };

        const dims: Dim[] = [{ value: Math.max(ai.score, GM_EPSILON), weight: W_FARM_AI }];
        if (ofrRate !== null) dims.push({ value: Math.max(ofrRate, GM_EPSILON), weight: W_FARM_OFR });
        if (mv.count > 0) dims.push({ value: Math.max(mv.score, GM_EPSILON), weight: W_FARM_MV });

        const wTotal = dims.reduce((sum, d) => sum + d.weight, 0);
        const logSum = dims.reduce((sum, d) => sum + (d.weight / wTotal) * Math.log(d.value), 0);
        const total = Math.exp(logSum);

        return {
            total,
            transparency: ai.score,
            order_fulfillment: ofrRate,
            market_validation: mv.count > 0 ? mv.score : null,
        };
    }

    private async calcCustomerSatisfaction(farmId: number): Promise<{ score: number; count: number }> {
        const ratings = await this.farmService.getFarmProductRating(farmId);
        if (ratings.length === 0) return { score: 0, count: 0 };
        const avgRating = ratings.reduce((prev, cur) => prev + cur, 0) / ratings.length;
        return { score: avgRating / 5, count: ratings.length };
    }
}
