import { forwardRef, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { TrustworthinessService } from 'src/modules/blockchain/trustworthiness/trustworthiness.service';
import { LogService } from 'src/modules/crop-management/log/log.service';
import { StepService } from 'src/modules/crop-management/step/step.service';
import { W_SS_OUT_COME, W_SS_PROCESS, W_ST_ACTIVITY_RATIO, W_ST_LOG_COVERAGE, W_ST_TYPE_CARE, W_ST_TYPE_HARVEST, W_ST_TYPE_PLANTING, W_ST_TYPE_POST_HARVEST, W_ST_TYPE_PREPARE } from '../constants/weight.constant';
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
        this.logger.debug('Running farm transparency job on server start');
        await this.handleCalcFarmTSCron();
    }

    async calcStepTransparencyScore(seasonStepId: number): Promise<number> {
        try {
            // score = w1 * LogCoverage + w2 * ActivityRatio

            const { active, unactive } = await this.logService.countActiveLogs(seasonStepId);
            const seasonDetail = await this.stepService.getFullSeasonStep(seasonStepId);
            const activeLogIds = await this.logService.getActiveLogIds(seasonStepId);

            const trustScoreRecords = await this.trustworthinessService.getTrustRecords(activeLogIds);

            // filter valid log ids
            const trustFilter = activeLogIds.filter((logId) => {
                const record = trustScoreRecords.find((record) =>
                    record.id === logId
                );
                return record && (record.trustScore / 100 >= 0.8)
            });

            const validLogCount = trustFilter.length;

            // LogCoverage
            const Lc = Math.min(validLogCount / seasonDetail.step.min_logs, 1);

            // ActivityRatio
            const Tar = active / (active + unactive);

            const result = W_ST_LOG_COVERAGE * Lc + W_ST_ACTIVITY_RATIO * Tar;

            this.logger.debug(`Step transparency score: ${result}`);

            return result;

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
            // score = w1 * ProcessTransparency + w2 * TemporalTransparency + w3 * OutcomeConsistency
            // ProcessTransparency = Σ (StepWeightᵢ × StepTransparencyᵢ)
            const season = await this.seasonService.getSeasonDetail(seasonId);
            const steps = await this.stepService.getSeasonStepForScoreCalc(seasonId);

            const stepMap: Record<StepType, number[]> = {
                [StepType.PREPARE]: [],
                [StepType.PLANTING]: [],
                [StepType.CARE]: [],
                [StepType.HARVEST]: [],
                [StepType.POST_HARVEST]: [],
            };

            steps.forEach(step => {
                stepMap[step.step_type].push(step.transparency_score);
            });

            const weight = (arr: number[], w: number) =>
                arr.length === 0 ? 0 : arr.reduce((prev, cur) => prev + cur * w, 0) / arr.length;

            const processTransparency =
                weight(stepMap[StepType.PREPARE], W_ST_TYPE_PREPARE) +
                weight(stepMap[StepType.PLANTING], W_ST_TYPE_PLANTING) +
                weight(stepMap[StepType.CARE], W_ST_TYPE_CARE) +
                weight(stepMap[StepType.HARVEST], W_ST_TYPE_HARVEST) +
                weight(stepMap[StepType.POST_HARVEST], W_ST_TYPE_POST_HARVEST);

            // todo: calc temporalTransparency
            // const temporalTransparency = 1 - Math.min(Math.abs(season.actual_end_date?.getTime() - season.expected_end_date.getTime()))
            const outcomeConsistency = 1 - Math.min(Math.abs(season.actual_yield ?? 0 - season.expected_yield) / season.expected_yield, 1);

            // console.log(`processTransparency: ${processTransparency}`)
            // console.log(`outcomeConsistency: ${outcomeConsistency}`)

            const result = W_SS_PROCESS * processTransparency
                // + W_SS_TEMPORAL * temporalTransparency 
                + W_SS_OUT_COME * outcomeConsistency;

            this.logger.debug(`Season transparency score: ${result}`);

            return result;

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

    async calcFarmTransparencyScore(farmId: number): Promise<number> {
        try {
            const seasonScores = await this.seasonService.getFarmAllAssignedSeasonsScores(farmId);
            if (seasonScores.length === 0) return 0;

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

            return weightedSum / weightTotal;
        } catch (error) {
            this.logger.error(`Failed to calculate farm transparency score: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to calculate farm transparency score",
                code: ResponseCode.INTERNAL_ERROR
            })
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
                metadata: {
                    executed_at: new Date(),
                },
            });

            const farmIds = await this.farmService.getAllFarmIds();
            let success = 0;
            for (const id of farmIds) {
                try {
                    const score = await this.calcFarmTransparencyScore(id);
                    this.logger.debug(`Farm ${id} transparency score: ${score}`);
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
}
