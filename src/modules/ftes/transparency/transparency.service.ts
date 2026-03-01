import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { GM_EPSILON, TEMPORAL_LAMBDA_OVER, TEMPORAL_LAMBDA_UNDER, W_FARM_AI, W_FARM_OFR, W_FARM_MV } from '../constants/weight.constant';
import { SeasonService } from 'src/modules/crop-management/season/season.service';
import { FarmService } from 'src/modules/farm/farm/farm.service';
import { AuditService } from 'src/core/audit/audit.service';
import { ActorType } from 'src/core/audit/enums/actor-type';
import { AuditEventID } from 'src/core/audit/enums/audit_event_id';
import { AuditResult } from 'src/core/audit/enums/audit-result';
import { FarmOverallScore, FarmTransparencyScore } from '../interfaces/farm-transparency.interface';
import { OrderService } from 'src/modules/order/order/order.service';

const MS_PER_DAY = 86_400_000;

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
    // Computes the Audit Integrity (AI) component using a temporally-penalized
    // hierarchical geometric mean over (season → step) pairs.
    //
    // ── Formula ────────────────────────────────────────────────────────────────
    //
    //   For step j in season k, with on-chain step score s_j ∈ [0, 1]:
    //
    //     Temporal penalty (between consecutive steps in the same season):
    //       P_j = 1                                      if lo ≤ Δt_j ≤ hi
    //       P_j = exp(−λ_u × (lo − Δt_j) / lo)         if Δt_j < lo  [rushed]
    //       P_j = exp(−λ_o × (Δt_j − hi) / hi)         if Δt_j > hi  [overdue]
    //       P_j = 1  (no penalty)                        if j = 0 or no duration bounds
    //
    //     Penalized step score:  s̃_j = max(s_j × P_j, ε)
    //
    //     Season AI:   AI_k = exp( (1/M_k) × Σ_j ln(s̃_j) )
    //
    //     Farm AI (steps-weighted GM, equivalent to flat GM over all steps):
    //       AI_farm = exp( (1/M_total) × Σ_k Σ_j ln(s̃_j^(k)) )
    //
    // ── Why This Formula ────────────────────────────────────────────────────
    //
    // [1] Step-level aggregation (not log-level): each step's quality is its
    //     last on-chain trust score. Averaging over all logs conflates within-step
    //     retry attempts with between-step performance (Tier 1 → Tier 2 mapping).
    //
    // [2] Temporal penalty is season-scoped — cross-season gaps (fallow periods)
    //     are never penalised. λ_u > λ_o: rushing is a stronger omission signal
    //     than delay, which is common in agriculture (Cui et al. 2024 [P2]).
    //
    // [3] Multiplicative penalty preserves GM structure: ln(s̃_j) = ln(s_j) + ln(P_j)
    //     — the penalty is additive in log-space, equivalent to a lower step score.
    //
    // [4] Steps-weighted farm GM: seasons with more evidence steps carry more
    //     weight (Jøsang & Ismail 2002 — Beta Reputation; Saaty 1980 — GM).

    private async calcFarmTransparencyScore(farmId: number): Promise<FarmTransparencyScore | null> {
        try {
            const seasons = await this.seasonService.getFarmSeasonStepsForScoring(farmId);
            const scoredSeasons = seasons.filter((s) => s.steps.length > 0);

            if (scoredSeasons.length === 0) return null;

            const M_total = scoredSeasons.reduce((sum, s) => sum + s.steps.length, 0);

            // Flat weighted GM: Σ_k Σ_j ln(s̃_j) / M_total
            let logSum = 0;
            for (const { steps } of scoredSeasons) {
                for (let j = 0; j < steps.length; j++) {
                    const { transparencyScore, startedAt, minDayDuration, maxDayDuration } = steps[j];

                    const penalty = j === 0
                        ? 1
                        : this.calcTemporalPenalty(
                            (startedAt.getTime() - steps[j - 1].startedAt.getTime()) / MS_PER_DAY,
                            minDayDuration,
                            maxDayDuration,
                        );

                    logSum += Math.log(Math.max(transparencyScore * penalty, GM_EPSILON));
                }
            }

            const score = Math.exp(logSum / M_total);
            this.logger.debug(`Farm #${farmId}: M_total=${M_total}, T_farm=${score.toFixed(3)}`);

            return { score, total_evidence: M_total };
        } catch (error) {
            this.logger.error(`Failed to calculate farm transparency score: ${error.message}`);
            throw new InternalServerErrorException({
                message: 'Failed to calculate farm transparency score',
                code: ResponseCode.INTERNAL_ERROR,
            });
        }
    }

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

    private calcTemporalPenalty(deltaDays: number, minDays: number | null, maxDays: number | null): number {
        if (minDays === null || maxDays === null) return 1;
        if (deltaDays >= minDays && deltaDays <= maxDays) return 1;
        if (deltaDays < minDays) return Math.exp(-TEMPORAL_LAMBDA_UNDER * (minDays - deltaDays) / minDays);
        return Math.exp(-TEMPORAL_LAMBDA_OVER * (deltaDays - maxDays) / maxDays);
    }
}
