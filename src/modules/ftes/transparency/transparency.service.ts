import { forwardRef, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { TrustworthinessService } from 'src/modules/blockchain/trustworthiness/trustworthiness.service';
import { LogService } from 'src/modules/crop-management/log/log.service';
import { StepService } from 'src/modules/crop-management/step/step.service';
import { W_SS_OUT_COME, W_SS_PROCESS, W_ST_TYPE_CARE, W_ST_TYPE_HARVEST, W_ST_TYPE_PLANTING, W_ST_TYPE_POST_HARVEST, W_ST_TYPE_PREPARE, W_SS_TEMPORAL, W_FARM_PROCESS, W_FARM_CUSTOMER_TRUST } from '../constants/weight.constant';
import { SeasonService } from 'src/modules/crop-management/season/season.service';
import { StepType } from 'src/modules/crop-management/enums/step-type.enum';
import { PlotService } from 'src/modules/crop-management/plot/plot.service';
import { CropType } from 'src/modules/crop-management/enums/crop-type.enum';
import { FarmService } from 'src/modules/farm/farm/farm.service';
import { Cron } from '@nestjs/schedule';
import { AuditService } from 'src/core/audit/audit.service';
import { ActorType } from 'src/core/audit/enums/actor-type';
import { AuditEventID } from 'src/core/audit/enums/audit_event_id';
import { AuditResult } from 'src/core/audit/enums/audit-result';
import { SeasonDetailDto } from 'src/modules/crop-management/dtos/season/season.dto';
import { FarmTransparencyMetrics } from '../interfaces/farm-transparency.interface';
import { StepTransparency } from 'src/modules/blockchain/interfaces/step-transparency.interface';

@Injectable()
export class TransparencyService {
    private readonly logger = new Logger(TransparencyService.name);

    constructor(
        private readonly logService: LogService,
        private readonly stepService: StepService,
        @Inject(forwardRef(() => SeasonService)) private readonly seasonService: SeasonService,
        private readonly plotService: PlotService,
        private readonly farmService: FarmService,
        private readonly trustworthinessService: TrustworthinessService,
        private readonly auditService: AuditService
    ) { }


    async onModuleInit() {
        // this.logger.debug('Running farm transparency job on server start');
        // await this.handleCalcFarmTSCron();
    }

    async calcStepTransparencyScore(seasonStepId: number): Promise<number> {
        try {
            const { active, unactive } = await this.logService.countActiveLogs(seasonStepId);
            const seasonDetail = await this.stepService.getFullSeasonStep(seasonStepId);

            const verifiedLog = await this.logService.getLogs(seasonStepId)
            const activeLogIds = verifiedLog.filter((log) => log.is_active == true && log.verified == true && log.image_verified == true).map((log) => log.id);

            const trustScoreRecords = await this.trustworthinessService.getTrustRecords('log', activeLogIds);

            // filter valid log ids based on trust score
            let validLogCount = 0;
            let invalidCount = 0;

            for (const logId of activeLogIds) {
                const record = trustScoreRecords.find(r => r.id === logId);
                if (!record) continue;

                const trust = record.trustScore / 100;
                if (trust >= 0.8) {
                    validLogCount += 1;
                } else {
                    invalidCount += 1;
                }
            }

            const result = await this.trustworthinessService.processData<StepTransparency>(
                'step', seasonStepId, 'step', 'default',
                {
                    validLogs: validLogCount,
                    invalidLogs: invalidCount,
                    active: active,
                    unactive: unactive,
                    minLogs: seasonDetail.step.min_logs,
                },
                {
                    abiType: 'tuple(uint128,uint128,uint128,uint128,uint128)',
                    map: (data) => [
                        data.validLogs,
                        data.invalidLogs,
                        data.active,
                        data.unactive,
                        data.minLogs
                    ]
                }
            );

            const score = result.events?.TrustProcessed.returnValues?.trustScore;

            return Number(score) / 100;

        } catch (error) {
            this.logger.error(`Failed to calculate step transparency score: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to calculate step transparency score",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    async calcSeasonTransparencyScore(seasonId: number): Promise<number> {
        try {
            // score = w1 * ProcessTransparency + w2 * TemporalTransparency + w3 * OutcomeConsistency + w4 * DataQuality
            // ProcessTransparency = Σ (StepWeightᵢ × StepTransparencyᵢ)
            const season = await this.seasonService.getSeasonDetail(seasonId);
            const steps = await this.stepService.getSeasonStepForScoreCalc(seasonId);

            const stepIds = steps.map((s) => s.id);
            const stepTpScoreRecords = await this.trustworthinessService.getTrustRecords('step', stepIds);

            const stepMap: Record<StepType, number[]> = {
                [StepType.PREPARE]: [],
                [StepType.PLANTING]: [],
                [StepType.CARE]: [],
                [StepType.HARVEST]: [],
                [StepType.POST_HARVEST]: [],
            };

            steps.forEach(step => {
                const record = stepTpScoreRecords.find(s => s.id === step.id);
                if (record) {
                    stepMap[step.step_type].push(record.trustScore ?? 0);
                }
            });

            const weight = (arr: number[], w: number) =>
                arr.length === 0 ? 0 : arr.reduce((prev, cur) => prev + cur * w, 0) / arr.length;

            const processTransparency =
                weight(stepMap[StepType.PREPARE], W_ST_TYPE_PREPARE) +
                weight(stepMap[StepType.PLANTING], W_ST_TYPE_PLANTING) +
                weight(stepMap[StepType.CARE], W_ST_TYPE_CARE) +
                weight(stepMap[StepType.HARVEST], W_ST_TYPE_HARVEST) +
                weight(stepMap[StepType.POST_HARVEST], W_ST_TYPE_POST_HARVEST);

            // Calculate temporal transparency
            const temporalTransparency = this.calcTemporalTransparency(season);

            // Calculate outcome consistency (yield expectations)
            const outcomeConsistency = 1 - Math.min(Math.abs((season.actual_yield ?? 0) - season.expected_yield) / season.expected_yield, 1);

            // Calculate weighted transparency score
            const result =
                W_SS_PROCESS * processTransparency +
                W_SS_TEMPORAL * temporalTransparency +
                W_SS_OUT_COME * outcomeConsistency;

            this.logger.debug(`Season transparency score breakdown - 
                ProcessTransparency: ${processTransparency}, 
                TemporalTransparency: ${temporalTransparency}, 
                OutcomeConsistency: ${outcomeConsistency}, 
                Total: ${result}`
            );

            return Math.min(result, 1);

        } catch (error) {
            this.logger.error(`Failed to calculate season transparency score: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to calculate season transparency score",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    async calcPlotTransparencyScore(plotId: number): Promise<number> {
        try {
            // score = (Σ SeasonWeightᵢ × TransparencySeasonᵢ)
            const plot = await this.plotService.getPlotCrop(plotId);
            const seasonScores = await this.seasonService.getSeasonsScores(plotId);
            if (seasonScores.length === 0) return 0;
            if (plot.crop.crop_type === CropType.SHORT_TERM) {
                // SeasonWeightᵢ = 1 => score = TransparencySeason
                if (seasonScores.length > 1) throw Error("Failed to get season score");
                return seasonScores[0].score;
            }

            // using Exponential decay
            const now = new Date();
            const LAMBDA = Math.log(2) / 6; // half-life = 6 months

            let weightedSum = 0;
            let weightTotal = 0;

            for (const season of seasonScores) {
                if (!season.endDate) continue;
                const ageInMonths =
                    (now.getTime() - new Date(season.endDate).getTime()) /
                    (1000 * 60 * 60 * 24 * 30);

                const recencyWeight = Math.exp(-LAMBDA * ageInMonths);

                weightedSum += recencyWeight * season.score;
                weightTotal += recencyWeight;
            }

            if (weightTotal === 0) {
                throw new Error("Invalid season weights (all zero)");
            }

            const result = weightedSum / weightTotal;

            this.logger.debug(`Plot transparency score: ${result}`);

            return result;

        } catch (error) {
            this.logger.error(`Failed to calculate plot transparency score: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to calculate plot transparency score",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    async calcFarmTransparencyScore(farmId: number): Promise<FarmTransparencyMetrics> {
        try {
            const procesTransparency = await this.calcProcessTransparencyScore(farmId);
            const customerTrustScore = await this.calcCustomerTrustScore(farmId);

            // Weighted calculation (all weights sum to 1.0)
            const totalTransparencyScore = Math.min(
                (procesTransparency * W_FARM_PROCESS) + (customerTrustScore * W_FARM_CUSTOMER_TRUST),
                1
            );

            return {
                process_transparency: procesTransparency,
                customer_trust_score: customerTrustScore,
                total: totalTransparencyScore
            };
        } catch (error) {
            this.logger.error(`Failed to calculate farm transparency score: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to calculate farm transparency score",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    private async calcProcessTransparencyScore(farmId: number): Promise<number> {
        const seasonScores = await this.seasonService.getFarmAllAssignedSeasonsScores(farmId);
        if (seasonScores.length === 0) return 0;

        const now = new Date();
        const LAMBDA = Math.log(2) / 6; // half-life = 6 months

        let weightedSum = 0;
        let weightTotal = 0;

        for (const season of seasonScores) {
            if (!season.endDate) continue;
            const ageInMonths =
                (now.getTime() - new Date(season.endDate).getTime()) /
                (1000 * 60 * 60 * 24 * 30);

            const recencyWeight = Math.exp(-LAMBDA * ageInMonths);
            weightedSum += recencyWeight * (season.score || 0);
            weightTotal += recencyWeight;
        }

        if (weightTotal === 0) return 0;
        return weightedSum / weightTotal;
    }

    private async calcCustomerTrustScore(farmId: number): Promise<number> {
        const ratings = await this.farmService.getFarmProductRating(farmId);
        if (ratings.length === 0) return 0;

        const avgRating = ratings.reduce((prev, cur) => prev + cur, 0) / ratings.length;

        const score = avgRating / 5;
        return score;
    }

    @Cron('0 3 * * *')
    async handleCalcFarmTSCron() {
        this.logger.log('Running daily farm transparency score calculation cron job');
        try {

            await this.auditService.log({
                actor_type: ActorType.SYSTEM,
                audit_event_id: AuditEventID.FTS001,
                result: AuditResult.SUCCESS,
                metadata: {
                    executed_at: new Date(),
                },
            });

            const farmIds = await this.farmService.getAllFarmIds();
            let success = 0;
            for (const id of farmIds) {
                try {
                    const score = await this.calcFarmTransparencyScore(id);
                    this.logger.debug(`Farm ${id} transparency metrics calculated:
                        ProcessTransparency: ${score.process_transparency}
                        CustomerTrust: ${score.customer_trust_score}
                        TOTAL SCORE: ${score.total}`
                    );
                    await this.farmService.updateTransparencyScore(id, score);
                    success += 1;
                }
                catch (error) {
                    this.logger.error(`Failed to run farm ${id}'s transparency cron job`, error.message);
                    await this.auditService.log({
                        actor_type: ActorType.SYSTEM,
                        audit_event_id: AuditEventID.FTS002,
                        result: AuditResult.FAILED,
                        metadata: {
                            farm_id: id,
                            error: error.message,
                        },
                    });
                }
            }

            await this.auditService.log({
                actor_type: ActorType.SYSTEM,
                audit_event_id: AuditEventID.FTS003,
                result: AuditResult.FAILED,
                metadata: {
                    total_farms: farmIds.length,
                    success: success,
                    failed: farmIds.length - success
                },
            });
        } catch (error) {
            await this.auditService.log({
                actor_type: ActorType.SYSTEM,
                audit_event_id: AuditEventID.FTS004,
                result: AuditResult.FAILED,
                metadata: {
                    error: error.message,
                },
            });
            this.logger.error('Failed to run farm transparency cron job', error.message);
        }
    }

    private async calcDataQualityScore(seasonDetailId: number): Promise<number> {
        const logs = await this.logService.getLogs(seasonDetailId);
        if (logs.length === 0) return 0;

        let qualityScore = 0;
        logs.forEach(log => {
            let logScore = 0;
            // Description check (required, should be meaningful)
            if (log.description && log.description.trim().length > 10) logScore += 0.4;
            // Notes check (optional, bonus if present and comprehensive)
            if (log.notes && log.notes.trim().length > 5) logScore += 0.3;
            // Documentation completeness (images, videos, location)
            const hasImages = log.image_urls && log.image_urls.length > 0;
            const hasVideos = log.video_urls && log.video_urls.length > 0;
            const hasLocation = log.location && (log.location.lat !== null && log.location.lng !== null);
            const mediaScore = (hasImages ? 0.15 : 0) + (hasVideos ? 0.1 : 0) + (hasLocation ? 0.05 : 0);
            logScore += mediaScore;
            qualityScore += Math.min(logScore, 1);
        });

        return qualityScore / logs.length;
    }

    /**
     * Calculate timeliness score based on log creation frequency and regularity
     * Measures how promptly activities are logged within step duration
     */
    private async calcTimelinessScore(seasonDetailId: number): Promise<number> {
        const logs = await this.logService.getLogs(seasonDetailId);
        if (logs.length === 0) return 0;

        // Calculate average time between logs
        const timestamps = logs
            .map(log => new Date(log.created).getTime())
            .sort((a, b) => a - b);

        if (timestamps.length <= 1) return 0.5; // Minimal logs, partial credit

        let totalGaps = 0;
        for (let i = 1; i < timestamps.length; i++) {
            const gap = (timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60); // Convert to hours
            totalGaps += gap;
        }

        const avgGapHours = totalGaps / (timestamps.length - 1);
        const expectedGapHours = 24; // Expected to log daily

        // Score based on how close to ideal interval (higher gaps = lower score)
        const timelinessScore = Math.exp(-Math.abs(avgGapHours - expectedGapHours) / expectedGapHours);

        return Math.min(timelinessScore, 1);
    }

    /**
     * Calculate documentation completeness score
     * Measures percentage of logs with complete documentation (images, videos, location)
     */
    private async calcDocumentationCompletenessScore(seasonDetailId: number): Promise<number> {
        const logs = await this.logService.getLogs(seasonDetailId);
        if (logs.length === 0) return 0;

        let completeCount = 0;
        logs.forEach(log => {
            const hasImages = log.image_urls && log.image_urls.length > 0;
            const hasVideos = log.video_urls && log.video_urls.length > 0;
            const hasLocation = log.location && (log.location.lat !== null && log.location.lng !== null);
            // A log is considered complete if it has all three types of documentation
            if (hasImages && hasVideos && hasLocation) {
                completeCount++;
            }
        });

        return completeCount / logs.length;
    }

    /**
     * Calculate temporal transparency based on schedule adherence
     * Measures how well actual timeline matches expected timeline
     */
    private calcTemporalTransparency(season: SeasonDetailDto): number {
        const expectedEnd = new Date(season.expected_end_date).getTime();
        const actualEnd = season.actual_end_date ? new Date(season.actual_end_date).getTime() : new Date().getTime();

        // Calculate deviation in days
        const deviationMs = Math.abs(actualEnd - expectedEnd);
        const deviationDays = deviationMs / (1000 * 60 * 60 * 24);

        // Expected timeline is usually 30-120 days, penalize deviation
        const maxAcceptableDeviation = 14; // 2 weeks tolerance
        const temporalScore = Math.max(1 - (deviationDays / maxAcceptableDeviation), 0);

        return temporalScore;
    }
}
