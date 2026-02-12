// import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
// import { OnEvent } from '@nestjs/event-emitter';
// import { ResponseCode } from 'src/common/constants/response-code.const';
// // import { TrustworthinessService } from 'src/modules/blockchain/trustworthiness/trustworthiness.service';
// import { LogService } from 'src/modules/crop-management/log/log.service';
// import { StepService } from 'src/modules/crop-management/step/step.service';
// import {
//     W_ST_DOC_COMPLETENESS, W_ST_VERIFICATION_RATIO, W_ST_TEMPORAL_REGULARITY,
//     W_SS_PROCESS, W_SS_TEMPORAL, W_SS_OUT_COME,
//     W_ST_TYPE_CARE, W_ST_TYPE_HARVEST, W_ST_TYPE_PLANTING, W_ST_TYPE_POST_HARVEST, W_ST_TYPE_PREPARE,
//     BAYESIAN_PRIOR_ALPHA, BAYESIAN_PRIOR_BETA, BAYESIAN_N_EFF,
//     DEFAULT_UNVERIFIED_DISCOUNT,
//     TEMPORAL_SIGMOID_K, TEMPORAL_SIGMOID_MIDPOINT,
// } from '../../crop-management/constants/weight.constant';
// import { SeasonService } from 'src/modules/crop-management/season/season.service';
// import { StepType } from 'src/modules/crop-management/enums/step-type.enum';
// import { PlotService } from 'src/modules/crop-management/plot/plot.service';
// import { CropType } from 'src/modules/crop-management/enums/crop-type.enum';
// import { FarmService } from 'src/modules/farm/farm/farm.service';
// import { AuditService } from 'src/core/audit/audit.service';
// import { ActorType } from 'src/core/audit/enums/actor-type';
// import { AuditEventID } from 'src/core/audit/enums/audit_event_id';
// import { AuditResult } from 'src/core/audit/enums/audit-result';
// import { SeasonDetailDto } from 'src/modules/crop-management/dtos/season/season.dto';
// import { FarmTransparencyMetrics } from '../interfaces/farm-transparency.interface';

// import { StepTransparency } from 'src/modules/blockchain/interfaces/step-transparency.interface';
// import { StepFinishedEvent } from 'src/common/events/step-finished.event';
// import { ConsensusFinalizedEvent } from 'src/common/events/consensus-finalized.event';

// @Injectable()
// export class TransparencyService {
//     private readonly logger = new Logger(TransparencyService.name);

//     constructor(
//         private readonly logService: LogService,
//         private readonly stepService: StepService,
//         private readonly seasonService: SeasonService,
//         private readonly plotService: PlotService,
//         private readonly farmService: FarmService,
//         // private readonly trustworthinessService: TrustworthinessService,
//         private readonly auditService: AuditService,
//         private readonly imageVerificationService: ImageVerificationService,
//     ) { }

//     /**
//      * Event listener: triggered when a step is finished in crop-management.
//      * Calculates and stores the step transparency score.
//      */
//     @OnEvent(StepFinishedEvent.eventName)
//     async handleStepFinished(event: StepFinishedEvent): Promise<void> {
//         this.logger.log(`Handling step.finished event for seasonDetail #${event.seasonDetailId}`);
//         // Will be implemented in V3: calculate step transparency score
//         // await this.calcStepTransparencyScore(event.seasonDetailId);
//     }

//     /**
//      * Event listener: triggered when auditor consensus is finalized.
//      * Recalculates provisional step scores if needed.
//      */
//     @OnEvent(ConsensusFinalizedEvent.eventName)
//     async handleConsensusFinalized(event: ConsensusFinalizedEvent): Promise<void> {
//         this.logger.log(`Handling consensus.finalized event for request #${event.requestId}`);
//         // Will be implemented in V3: recalculate provisional step score
//         // await this.recalculateStepScore(event.seasonDetailId);
//     }

//     // /**
//     //  * FTES v2 Step Transparency Score
//     //  * = 0.50 × DocumentationCompleteness + 0.35 × VerificationRatio + 0.15 × TemporalRegularity
//     //  */
//     // async calcStepTransparencyScore(seasonStepId: number): Promise<number> {
//     //     try {
//     //         const seasonDetail = await this.stepService.getFullSeasonStep(seasonStepId);
//     //         const minLogs = seasonDetail.step.min_logs;

//     //         const logs = await this.logService.getLogs(seasonStepId);
//     //         const activeLogs = logs.filter((log) => log.is_active);
//     //         const activeLogIds = activeLogs.map((log) => log.id);

//     //         // --- Documentation Completeness ---
//     //         // DC = min(n / n_min, 1) × (1/n) × Σ logScore_i
//     //         const logScores = await this.calcLogScores(activeLogIds);
//     //         const coverageRatio = Math.min(activeLogs.length / Math.max(minLogs, 1), 1);
//     //         const avgLogScore = logScores.length > 0
//     //             ? logScores.reduce((sum, s) => sum + s, 0) / logScores.length
//     //             : 0;
//     //         const docCompleteness = coverageRatio * avgLogScore;

//     //         // --- Verification Ratio ---
//     //         // VR = verifiedLogs / max(reviewedLogs, 1), or DEFAULT_UNVERIFIED_DISCOUNT if none reviewed
//     //         const verificationStats = await this.verificationService.getLogVerificationStats(activeLogIds);
//     //         const verificationRatio = verificationStats.reviewed > 0
//     //             ? verificationStats.verified / verificationStats.reviewed
//     //             : DEFAULT_UNVERIFIED_DISCOUNT;

//     //         // --- Temporal Regularity ---
//     //         // TR = 1 - min(CV / CV_max, 1) where CV = stddev/mean of time gaps
//     //         const temporalRegularity = this.calcTemporalRegularity(activeLogs);

//     //         const score =
//     //             W_ST_DOC_COMPLETENESS * docCompleteness +
//     //             W_ST_VERIFICATION_RATIO * verificationRatio +
//     //             W_ST_TEMPORAL_REGULARITY * temporalRegularity;

//     //         // Store on-chain step trust score
//     //         const result = await this.trustworthinessService.processData<StepTransparency>(
//     //             'step', seasonStepId, 'step', 'auditor',
//     //             {
//     //                 totalLogs: activeLogs.length,
//     //                 verifiedLogs: verificationStats.verified,
//     //                 rejectedLogs: verificationStats.rejected,
//     //                 unverifiedLogs: activeLogs.length - verificationStats.reviewed,
//     //                 activeDays: this.calcActiveDays(activeLogs),
//     //                 totalDays: this.calcTotalDays(activeLogs),
//     //                 minLogs: minLogs,
//     //                 avgConsensusWeight: Math.round(verificationRatio * 100),
//     //             },
//     //             {
//     //                 abiType: 'tuple(uint128,uint128,uint128,uint128,uint128,uint128,uint128,uint128)',
//     //                 map: (data: any) => [
//     //                     data.totalLogs,
//     //                     data.verifiedLogs,
//     //                     data.rejectedLogs,
//     //                     data.unverifiedLogs,
//     //                     data.activeDays,
//     //                     data.totalDays,
//     //                     data.minLogs,
//     //                     data.avgConsensusWeight,
//     //                 ],
//     //             },
//     //         );

//     //         const onChainScore = result.events?.TrustProcessed?.returnValues?.trustScore;
//     //         this.logger.debug(`Step #${seasonStepId} transparency: DC=${docCompleteness.toFixed(3)}, VR=${verificationRatio.toFixed(3)}, TR=${temporalRegularity.toFixed(3)}, total=${score.toFixed(3)}, onChain=${onChainScore}`);

//     //         return Math.min(score, 1);

//     //     } catch (error) {
//     //         this.logger.error(`Failed to calculate step transparency score: ${error.message}`);
//     //         throw new InternalServerErrorException({
//     //             message: "Failed to calculate step transparency score",
//     //             code: ResponseCode.INTERNAL_ERROR
//     //         });
//     //     }
//     // }

//     // /**
//     //  * FTES v2 Season Transparency Score — Weighted Geometric Mean
//     //  * Tsn = max(PT, 0.01)^0.65 × max(SA, 0.01)^0.20 × max(OC, 0.01)^0.15
//     //  */
//     // async calcSeasonTransparencyScore(seasonId: number): Promise<number> {
//     //     try {
//     //         const season = await this.seasonService.getSeasonDetail(seasonId);
//     //         const steps = await this.stepService.getSeasonStepForScoreCalc(seasonId);

//     //         const stepIds = steps.map((s) => s.id);
//     //         const stepTpScoreRecords = await this.trustworthinessService.getTrustRecords('step', stepIds);

//     //         const stepMap: Record<StepType, number[]> = {
//     //             [StepType.PREPARE]: [],
//     //             [StepType.PLANTING]: [],
//     //             [StepType.CARE]: [],
//     //             [StepType.HARVEST]: [],
//     //             [StepType.POST_HARVEST]: [],
//     //         };

//     //         steps.forEach(step => {
//     //             const record = stepTpScoreRecords.find(s => s.id === step.id);
//     //             if (record) {
//     //                 stepMap[step.step_type].push(record.trustScore ?? 0);
//     //             }
//     //         });

//     //         const weight = (arr: number[], w: number) =>
//     //             arr.length === 0 ? 0 : arr.reduce((prev, cur) => prev + cur * w, 0) / arr.length;

//     //         const processTransparency =
//     //             weight(stepMap[StepType.PREPARE], W_ST_TYPE_PREPARE) +
//     //             weight(stepMap[StepType.PLANTING], W_ST_TYPE_PLANTING) +
//     //             weight(stepMap[StepType.CARE], W_ST_TYPE_CARE) +
//     //             weight(stepMap[StepType.HARVEST], W_ST_TYPE_HARVEST) +
//     //             weight(stepMap[StepType.POST_HARVEST], W_ST_TYPE_POST_HARVEST);

//     //         // Sigmoid-based temporal transparency
//     //         const temporalTransparency = this.calcTemporalTransparency(season);

//     //         // Outcome consistency
//     //         const outcomeConsistency = 1 - Math.min(
//     //             Math.abs((season.actual_yield ?? 0) - season.expected_yield) / Math.max(season.expected_yield, 1),
//     //             1,
//     //         );

//     //         // Weighted geometric mean
//     //         const result =
//     //             Math.pow(Math.max(processTransparency, 0.01), W_SS_PROCESS) *
//     //             Math.pow(Math.max(temporalTransparency, 0.01), W_SS_TEMPORAL) *
//     //             Math.pow(Math.max(outcomeConsistency, 0.01), W_SS_OUT_COME);

//     //         this.logger.debug(`Season #${seasonId} transparency: PT=${processTransparency.toFixed(3)}, TT=${temporalTransparency.toFixed(3)}, OC=${outcomeConsistency.toFixed(3)}, Total=${result.toFixed(3)}`);

//     //         return Math.min(result, 1);

//     //     } catch (error) {
//     //         this.logger.error(`Failed to calculate season transparency score: ${error.message}`);
//     //         throw new InternalServerErrorException({
//     //             message: "Failed to calculate season transparency score",
//     //             code: ResponseCode.INTERNAL_ERROR
//     //         });
//     //     }
//     // }

//     // async calcPlotTransparencyScore(plotId: number): Promise<number> {
//     //     try {
//     //         const plot = await this.plotService.getPlotCrop(plotId);
//     //         const seasonScores = await this.seasonService.getSeasonsScores(plotId);
//     //         if (seasonScores.length === 0) return 0;
//     //         if (plot.crop.crop_type === CropType.SHORT_TERM) {
//     //             if (seasonScores.length > 1) throw Error("Failed to get season score");
//     //             return seasonScores[0].score;
//     //         }

//     //         // Exponential decay weighting
//     //         const now = new Date();
//     //         const LAMBDA = Math.log(2) / 6; // half-life = 6 months

//     //         let weightedSum = 0;
//     //         let weightTotal = 0;

//     //         for (const season of seasonScores) {
//     //             if (!season.endDate) continue;
//     //             const ageInMonths =
//     //                 (now.getTime() - new Date(season.endDate).getTime()) /
//     //                 (1000 * 60 * 60 * 24 * 30);

//     //             const recencyWeight = Math.exp(-LAMBDA * ageInMonths);
//     //             weightedSum += recencyWeight * season.score;
//     //             weightTotal += recencyWeight;
//     //         }

//     //         if (weightTotal === 0) throw new Error("Invalid season weights (all zero)");

//     //         return weightedSum / weightTotal;

//     //     } catch (error) {
//     //         this.logger.error(`Failed to calculate plot transparency score: ${error.message}`);
//     //         throw new InternalServerErrorException({
//     //             message: "Failed to calculate plot transparency score",
//     //             code: ResponseCode.INTERNAL_ERROR
//     //         });
//     //     }
//     // }

//     // /**
//     //  * FTES v2 Farm Transparency Score — Bayesian Beta Aggregation
//     //  * Prior: α₀ = 2, β₀ = 2
//     //  * For each season: α += w_i × score × n_eff, β += w_i × (1 - score) × n_eff
//     //  * Farm score = α / (α + β)
//     //  * Confidence = 1 - (α×β / ((α+β)² × (α+β+1))) / 0.25
//     //  */
//     // async calcFarmTransparencyScore(farmId: number): Promise<FarmTransparencyMetrics> {
//     //     try {
//     //         const seasonScores = await this.seasonService.getFarmAllAssignedSeasonsScores(farmId);

//     //         // Bayesian Beta aggregation for transparency
//     //         let alpha = BAYESIAN_PRIOR_ALPHA;
//     //         let beta = BAYESIAN_PRIOR_BETA;
//     //         let seasonsEvaluated = 0;

//     //         if (seasonScores.length > 0) {
//     //             const now = new Date();
//     //             const LAMBDA = Math.log(2) / 6;

//     //             let weightTotal = 0;
//     //             const weights: number[] = [];

//     //             for (const season of seasonScores) {
//     //                 if (!season.endDate) continue;
//     //                 const ageInMonths = (now.getTime() - new Date(season.endDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
//     //                 const w = Math.exp(-LAMBDA * ageInMonths);
//     //                 weights.push(w);
//     //                 weightTotal += w;
//     //             }

//     //             // Normalize weights and accumulate
//     //             let weightIdx = 0;
//     //             for (const season of seasonScores) {
//     //                 if (!season.endDate) continue;
//     //                 const w = weightTotal > 0 ? weights[weightIdx] / weightTotal : 0;
//     //                 const score = season.score || 0;

//     //                 alpha += w * score * BAYESIAN_N_EFF;
//     //                 beta += w * (1 - score) * BAYESIAN_N_EFF;
//     //                 seasonsEvaluated++;
//     //                 weightIdx++;
//     //             }
//     //         }

//     //         const transparencyScore = alpha / (alpha + beta);
//     //         const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
//     //         const confidence = Math.max(1 - variance / 0.25, 0);

//     //         // Customer satisfaction (separate, not mixed into transparency)
//     //         const { score: customerScore, count: reviewCount } = await this.calcCustomerSatisfaction(farmId);

//     //         // Total = transparency score only (customer satisfaction is informational)
//     //         const total = transparencyScore;

//     //         return {
//     //             transparency: {
//     //                 score: transparencyScore,
//     //                 confidence,
//     //                 seasons_evaluated: seasonsEvaluated,
//     //             },
//     //             customer_satisfaction: {
//     //                 score: customerScore,
//     //                 review_count: reviewCount,
//     //             },
//     //             total,
//     //         };
//     //     } catch (error) {
//     //         this.logger.error(`Failed to calculate farm transparency score: ${error.message}`);
//     //         throw new InternalServerErrorException({
//     //             message: "Failed to calculate farm transparency score",
//     //             code: ResponseCode.INTERNAL_ERROR
//     //         });
//     //     }
//     // }

//     // private async calcCustomerSatisfaction(farmId: number): Promise<{ score: number; count: number }> {
//     //     const ratings = await this.farmService.getFarmProductRating(farmId);
//     //     if (ratings.length === 0) return { score: 0, count: 0 };

//     //     const avgRating = ratings.reduce((prev, cur) => prev + cur, 0) / ratings.length;
//     //     return { score: avgRating / 5, count: ratings.length };
//     // }

//     // @Cron('0 3 * * *')
//     // async handleCalcFarmTSCron() {
//     //     this.logger.log('Running daily farm transparency score calculation cron job');
//     //     try {
//     //         await this.auditService.log({
//     //             actor_type: ActorType.SYSTEM,
//     //             audit_event_id: AuditEventID.FTS001,
//     //             result: AuditResult.SUCCESS,
//     //             metadata: { executed_at: new Date() },
//     //         });

//     //         const farmIds = await this.farmService.getAllFarmIds();
//     //         let success = 0;
//     //         for (const id of farmIds) {
//     //             try {
//     //                 const score = await this.calcFarmTransparencyScore(id);
//     //                 this.logger.debug(`Farm ${id} transparency: score=${score.transparency.score.toFixed(3)}, confidence=${score.transparency.confidence.toFixed(3)}, satisfaction=${score.customer_satisfaction.score.toFixed(3)}`);
//     //                 await this.farmService.updateTransparencyScore(id, score);
//     //                 success += 1;
//     //             } catch (error) {
//     //                 this.logger.error(`Failed to run farm ${id}'s transparency cron job`, error.message);
//     //                 await this.auditService.log({
//     //                     actor_type: ActorType.SYSTEM,
//     //                     audit_event_id: AuditEventID.FTS002,
//     //                     result: AuditResult.FAILED,
//     //                     metadata: { farm_id: id, error: error.message },
//     //                 });
//     //             }
//     //         }

//     //         await this.auditService.log({
//     //             actor_type: ActorType.SYSTEM,
//     //             audit_event_id: AuditEventID.FTS003,
//     //             result: AuditResult.SUCCESS,
//     //             metadata: { total_farms: farmIds.length, success, failed: farmIds.length - success },
//     //         });
//     //     } catch (error) {
//     //         await this.auditService.log({
//     //             actor_type: ActorType.SYSTEM,
//     //             audit_event_id: AuditEventID.FTS004,
//     //             result: AuditResult.FAILED,
//     //             metadata: { error: error.message },
//     //         });
//     //         this.logger.error('Failed to run farm transparency cron job', error.message);
//     //     }
//     // }

//     // /**
//     //  * Sigmoid-based temporal transparency
//     //  * Score = 1 / (1 + exp(k × (deviationDays - midpoint)))
//     //  */
//     // private calcTemporalTransparency(season: SeasonDetailDto): number {
//     //     const expectedEnd = new Date(season.expected_end_date).getTime();
//     //     const actualEnd = season.actual_end_date ? new Date(season.actual_end_date).getTime() : new Date().getTime();

//     //     const deviationMs = Math.abs(actualEnd - expectedEnd);
//     //     const deviationDays = deviationMs / (1000 * 60 * 60 * 24);

//     //     return 1 / (1 + Math.exp(TEMPORAL_SIGMOID_K * (deviationDays - TEMPORAL_SIGMOID_MIDPOINT)));
//     // }

//     // /**
//     //  * Calculate individual log scores based on AI image verification results.
//     //  */
//     // private async calcLogScores(logIds: number[]): Promise<number[]> {
//     //     if (logIds.length === 0) return [];

//     //     const verificationResults = await this.imageVerificationService.getVerificationResults(logIds);

//     //     return logIds.map((logId) => {
//     //         const result = verificationResults.find((r) => r.log_id === logId);
//     //         if (result) {
//     //             return Number(result.overall_score);
//     //         }
//     //         return DEFAULT_UNVERIFIED_DISCOUNT;
//     //     });
//     // }

//     // /**
//     //  * Temporal regularity = 1 - min(CV / CV_max, 1)
//     //  * CV = coefficient of variation of time gaps between logs
//     //  */
//     // private calcTemporalRegularity(logs: { created: Date }[]): number {
//     //     if (logs.length <= 1) return 0.5;

//     //     const timestamps = logs
//     //         .map((log) => new Date(log.created).getTime())
//     //         .sort((a, b) => a - b);

//     //     const gaps: number[] = [];
//     //     for (let i = 1; i < timestamps.length; i++) {
//     //         gaps.push((timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60)); // hours
//     //     }

//     //     const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
//     //     if (mean === 0) return 1;

//     //     const variance = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length;
//     //     const stddev = Math.sqrt(variance);
//     //     const cv = stddev / mean;

//     //     const CV_MAX = 2.0;
//     //     return 1 - Math.min(cv / CV_MAX, 1);
//     // }

//     // /**
//     //  * Count distinct active days from log timestamps
//     //  */
//     // private calcActiveDays(logs: { created: Date }[]): number {
//     //     const days = new Set(logs.map((l) => new Date(l.created).toISOString().split('T')[0]));
//     //     return days.size;
//     // }

//     // /**
//     //  * Calculate total days span from first to last log
//     //  */
//     // private calcTotalDays(logs: { created: Date }[]): number {
//     //     if (logs.length <= 1) return 1;
//     //     const timestamps = logs.map((l) => new Date(l.created).getTime());
//     //     const span = Math.max(...timestamps) - Math.min(...timestamps);
//     //     return Math.max(Math.ceil(span / (1000 * 60 * 60 * 24)), 1);
//     // }
// }
