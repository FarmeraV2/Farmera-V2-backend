import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseCode } from 'src/common/constants/response-code.const';
import { AuditorProfileService } from '../auditor-profile/auditor-profile.service';
import { VerificationAssignment } from '../entities/verification-assignment.entity';
import { ImageVerificationService } from '../image-verification/image-verification.service';
import { ProcessTrackingService } from 'src/modules/blockchain/process-tracking/process-tracking.service';
import { AuditorRegistryService } from 'src/modules/blockchain/auditor/auditor-registry.service';
import Web3 from 'web3';
import { LogImageVerificationResult } from '../entities/log-image-verification-result.entity';
import { LogVerificationPackage } from '../dtos/verification/log-verification-package.dto';
import { plainToInstance } from 'class-transformer';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { LogAddedEvent } from 'src/common/events/log-added.event';
import { HashedLog } from '../dtos/log/hashed-log.dto';
import { AuditorRegistryEvent } from 'src/modules/blockchain/enums/auditor-registry.enum';
import { LogVerified } from 'src/common/events/log-verified.event';
import { LogSkipReviewEvent } from 'src/common/events/log-skip-review.event';
import { Cron } from '@nestjs/schedule';
import { VerificationRequested } from 'src/modules/blockchain/interfaces/auditor-event.interface';
import { VerificationIdentifier } from '../enums/verification-identifier.enum';
import { LogVerificationIdentifier } from '../enums/log-verification-identifier';

const AUTO_VERIFY_THRESHOLD = 0.6;
const SKIP_VERIFY_THRESHOLD = 0.8;
const SAMPLING_RATE = 0.2;
const VERIFICATION_DEADLINE_DAYS = 7;

@Injectable()
export class VerificationService {
    private readonly logger = new Logger(VerificationService.name);

    constructor(
        @InjectRepository(VerificationAssignment) private readonly assignmentRepo: Repository<VerificationAssignment>,
        private readonly auditorProfileService: AuditorProfileService,
        private readonly imageVerificationService: ImageVerificationService,
        // Blockchain contract
        private readonly processTrackingService: ProcessTrackingService,
        private readonly auditorRegistryService: AuditorRegistryService,
        private readonly emitter: EventEmitter2,
    ) { }

    async getPendingVerificationsByUser(userId: number): Promise<VerificationAssignment[]> {
        try {
            const profileId = await this.auditorProfileService.validateAuditor(userId);
            return this.assignmentRepo.find({
                where: {
                    auditor_profile_id: profileId,
                    vote_transaction_hash: undefined
                },
            });
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            this.logger.error(`Failed to get pending verification: ${error.message}`);
            throw new InternalServerErrorException({
                message: "Failed to get pending verificaton",
                code: ResponseCode.INTERNAL_ERROR
            })
        }
    }

    async getVerificationPackage(id: number, userId: number): Promise<LogVerificationPackage> {
        try {
            const profileId = await this.auditorProfileService.validateAuditor(userId);
            const assignment = await this.assignmentRepo.findOne({
                where: {
                    id: id,
                    auditor_profile_id: profileId,
                },
                relations: ['log', 'log.farm'],
            });

            if (!assignment) {
                throw new NotFoundException({
                    message: 'Verification assignment not found or not assigned to you',
                    code: ResponseCode.AUDITOR_NOT_ASSIGNED,
                });
            }

            const { farm, ...log } = assignment.log;

            // Get on-chain hash for integrity verification
            let onChainHash: string | undefined = undefined;
            try {
                onChainHash = await this.processTrackingService.getTempHashedLog(log.id);
            } catch { /* non-critical */ }

            // Get AI verification result
            let aiAnalysis: LogImageVerificationResult | null = null;
            try {
                aiAnalysis = await this.imageVerificationService.getLogVerificationResultByLogId(log.id);
            } catch { /* non-critical */ }

            const currentHashed = this.processTrackingService.hashData(HashedLog, log);

            return plainToInstance(LogVerificationPackage, {
                id: assignment.id,
                log: log,
                farm: farm,
                hash: {
                    on_chainHash: onChainHash,
                    current_hash: currentHashed,
                },
                ai_analysis: aiAnalysis ? aiAnalysis : undefined,
                deadline: assignment.deadline,
            });
        }
        catch (error) {
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException({
                message: "Failed to get verification package",
                code: ResponseCode.FAILED_TO_GET_VERIFICATION_PACKAGE
            })
        }
    }

    @OnEvent(LogAddedEvent.name)
    async evaluateForVerification(payload: LogAddedEvent): Promise<void> {
        try {
            const log = payload.log;

            let shouldVerify = false;

            const imageVerified = await this.imageVerificationService.verifyLogImages(log);
            const aiScore = imageVerified?.overall_score ?? 0;

            if (aiScore < AUTO_VERIFY_THRESHOLD) {
                shouldVerify = true;
            } else if (aiScore < SKIP_VERIFY_THRESHOLD) {
                shouldVerify = Math.random() < SAMPLING_RATE;
            }

            if (!shouldVerify) {
                this.logger.debug("Auditor verify skipped");
                this.emitter.emit(LogSkipReviewEvent.name, new LogSkipReviewEvent(log));
                return;
            }


            // temp log for verify immutability
            await this.processTrackingService.addTempLog(log);

            // Blockchain request verification
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + VERIFICATION_DEADLINE_DAYS);

            try {
                await this.auditorRegistryService.requestVerfication(VerificationIdentifier.LOG, log.id, deadline);
            } catch (error) {
                this.logger.error("Failed to request verification");
            }

        } catch (error) {
            this.logger.error(`Failed to evaluate for verification: ${error.message}`);
        }
    }

    // @OnEvent(LogInactiveEvent.name)
    // async requestInactiveLog(payload: LogInactiveEvent): Promise<void> {
    //     try {
    //         const log = payload.log;
    //         // Blockchain request verification
    //         const deadline = new Date();
    //         deadline.setDate(deadline.getDate() + VERIFICATION_DEADLINE_DAYS);

    //         try {
    //             await this.auditorRegistryService.requestVerfication(VerificationIdentifier.LOG_INACTIVE, log.id, deadline);
    //         } catch (error) {
    //             this.logger.error("Failed to request verification");
    //         }

    //     } catch (error) {
    //         this.logger.error(`Failed to evaluate for verification: ${error.message}`);
    //     }
    // }

    @Cron("0 * * * * *")
    async handleRequestEvents() {
        await this.auditorRegistryService.handleEvent(
            AuditorRegistryEvent.VERIFICATION_REQUESTED,
            async (from, to) => await this.auditorRegistryService.getRecentVerificationRequestEvents(from, to),
            async (events) => {
                this.logger.log(`Running handle verification request event cron job - event count: ${events.length}`);
                const addLogEvents: VerificationRequested[] = [];
                const inactiveLogEvents: VerificationRequested[] = [];

                for (const e of events) {
                    switch (e.identifier) {
                        case Web3.utils.keccak256(VerificationIdentifier.LOG):
                            addLogEvents.push(e);
                            break;
                        case Web3.utils.keccak256(VerificationIdentifier.LOG_INACTIVE):
                            inactiveLogEvents.push(e);
                            break;
                    }
                }

                const addLogResults = await Promise.all(
                    addLogEvents.map(async (e) => {
                        const auditorIds =
                            await this.auditorProfileService.getAuditorIdsByAddresses(
                                e.assignedAuditors,
                            );

                        return auditorIds.map((id) =>
                            this.assignmentRepo.create({
                                auditor_profile_id: id,
                                log_id: e.id,
                                deadline: new Date(e.deadline * 1000),
                                type: LogVerificationIdentifier.LOG
                            }),
                        );
                    }),
                );

                const inactiveLogResults = await Promise.all(
                    addLogEvents.map(async (e) => {
                        const auditorIds =
                            await this.auditorProfileService.getAuditorIdsByAddresses(
                                e.assignedAuditors,
                            );

                        return auditorIds.map((id) =>
                            this.assignmentRepo.create({
                                auditor_profile_id: id,
                                log_id: e.id,
                                deadline: new Date(e.deadline * 1000),
                                type: LogVerificationIdentifier.LOG_INACTIVE
                            }),
                        );
                    }),
                );

                const assignments = [...addLogResults.flat(), ...inactiveLogResults.flat()];
                await this.assignmentRepo.save(assignments);
            });
    }


    @Cron("0 * * * * *")
    async handleFinalizedEvents() {
        await this.auditorRegistryService.handleEvent(
            AuditorRegistryEvent.VERIFICATION_FINALIZED,
            async (from, to) => await this.auditorRegistryService.getRecentVerificationFinalizedEvents(from, to),
            async (events) => {
                this.logger.log(`Running handle finalized verification event cron job - event count: ${events.length}`);
                const filteredEvents = events.filter(
                    (e) =>
                        Web3.utils.keccak256(VerificationIdentifier.LOG) === e.identifier,
                );
                filteredEvents.forEach((e) => {
                    this.emitter.emit(LogVerified.name, new LogVerified(e.id, e.consensus, e.totalVote));
                })
            });
    }

    //     async recordVote(requestId: number, userId: number, isValid: boolean, txHash: string): Promise<{ vote_recorded: boolean; consensus_reached: boolean }> {
    //         const profile = await this.auditorProfileRepo.findOne({
    //             select: ["id"],
    //             where: { user_id: userId }
    //         })
    //         if (!profile) {
    //             throw new NotFoundException({
    //                 message: 'Auditor profile not found',
    //                 code: ResponseCode.AUDITOR_NOT_FOUND,
    //             });
    //         }

    //         const assignment = await this.assignmentRepo.findOne({
    //             where: {
    //                 verification_request_id: requestId,
    //                 auditor_profile_id: profile.id,
    //             },
    //         });

    //         if (!assignment) {
    //             throw new NotFoundException({
    //                 message: 'Assignment not found',
    //                 code: ResponseCode.AUDITOR_NOT_ASSIGNED,
    //             });
    //         }

    //         if (assignment.vote !== null) {
    //             throw new BadRequestException({
    //                 message: 'Vote already submitted',
    //                 code: ResponseCode.VOTE_ALREADY_SUBMITTED,
    //             });
    //         }

    //         const request = await this.requestRepo.findOne({ where: { id: requestId } });
    //         if (!request || request.status !== VerificationStatus.PENDING) {
    //             throw new BadRequestException({
    //                 message: 'Verification request is not pending',
    //                 code: ResponseCode.VERIFICATION_REQUEST_NOT_FOUND,
    //             });
    //         }

    //         if (new Date() > request.deadline) {
    //             throw new BadRequestException({
    //                 message: 'Verification deadline has passed',
    //                 code: ResponseCode.VERIFICATION_EXPIRED,
    //             });
    //         }

    //         // Record the vote
    //         assignment.vote = isValid;
    //         assignment.vote_transaction_hash = txHash;
    //         assignment.voted_at = new Date();
    //         await this.assignmentRepo.save(assignment);

    //         // Check if all assigned auditors have voted
    //         const allAssignments = await this.assignmentRepo.find({
    //             where: { verification_request_id: requestId },
    //         });

    //         const votedCount = allAssignments.filter((a) => a.vote !== null).length;
    //         const consensusReached = votedCount >= MIN_AUDITORS;

    //         if (consensusReached) {
    //             // Calculate simple majority for consensus
    //             const validVotes = allAssignments.filter((a) => a.vote === true).length;
    //             const consensus = validVotes > allAssignments.filter((a) => a.vote !== null).length / 2;

    //             await this.handleConsensusFinalized(requestId, consensus);
    //         }

    //         return { vote_recorded: true, consensus_reached: consensusReached };
    //     }

    //     async handleConsensusFinalized(requestId: number, consensus: boolean): Promise<void> {
    //         const request = await this.requestRepo.findOne({
    //             where: { id: requestId },
    //             relations: ['log'],
    //         });

    //         if (!request) return;

    //         request.status = consensus ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED;
    //         request.consensus_result = consensus;
    //         await this.requestRepo.save(request);

    //         // Update on-chain verification status
    //         const onChainStatus = consensus ? OnChainLogStatus.Verified : OnChainLogStatus.Rejected;
    //         try {
    //             await this.processTrackingService.verifyLog(request.id, onChainStatus);
    //         } catch (error) {
    //             this.logger.error(`Failed to update on-chain verification status: ${error.message}`);
    //         }

    //         // If consensus = VALID, compute trust score on-chain
    //         if (consensus) {
    //             try {
    //                 await this.computeLogTrustScore(request);
    //             } catch (error) {
    //                 this.logger.error(`Failed to compute log trust score: ${error.message}`);
    //             }
    //         }

    //         // If REJECTED, deactivate the log
    //         if (!consensus) {
    //             try {
    //                 // await this.logService.unactiveLogById(request.log_id);
    //                 this.logger.log(`Log #${request.log_id} deactivated due to REJECTED consensus`);
    //             } catch (error) {
    //                 this.logger.error(`Failed to deactivate rejected log: ${error.message}`);
    //             }
    //         }

    //         // Update auditor stats
    //         const assignments = await this.assignmentRepo.find({
    //             where: { verification_request_id: requestId },
    //         });

    //         for (const assignment of assignments) {
    //             if (assignment.vote === null) continue;
    //             const isCorrect = assignment.vote === consensus;
    //             await this.auditorProfileRepo.increment(
    //                 { id: assignment.auditor_profile_id },
    //                 'total_verifications',
    //                 1,
    //             );
    //             if (isCorrect) {
    //                 await this.auditorProfileRepo.increment(
    //                     { id: assignment.auditor_profile_id },
    //                     'correct_verifications',
    //                     1,
    //                 );
    //             }
    //         }
    //     }

    //     private async computeLogTrustScore(request: VerificationRequest): Promise<void> {
    //         // const log = await this.logService.getLogById(request.log_id);
    //         // if (!log) return;

    //         // const plotLocation = await this.stepService.getPlotLocation(log.season_detail_id);

    //         // // Get on-chain verification data for consensus weight
    //         // const verifications = await this.auditorService.getVerifications(request.identifier, request.blockchain_log_id);

    //         // let totalRepWeight = 0;
    //         // let validRepWeight = 0;

    //         // for (const v of verifications) {
    //         //     try {
    //         //         const auditor = await this.auditorService.getAuditor(v.auditor);
    //         //         totalRepWeight += auditor.reputationScore;
    //         //         if (v.isValid) validRepWeight += auditor.reputationScore;
    //         //     } catch { /* skip */ }
    //         // }

    //         // const consensusWeight = totalRepWeight > 0 ? Math.round((validRepWeight / totalRepWeight) * 100) : 70;
    //         // const auditorCount = verifications.length;

    //         // // Spatial distance calculation (same as existing processData pattern)
    //         // const logLat = log.location.lat * 1000000;
    //         // const logLng = log.location.lng * 1000000;
    //         // const plotLat = plotLocation.lat * 1000000;
    //         // const plotLng = plotLocation.lng * 1000000;

    //         // const dLat = Math.abs(Math.round(logLat) - Math.round(plotLat));
    //         // const dLng = Math.abs(Math.round(logLng) - Math.round(plotLng));
    //         // const spatialDistance = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));

    //         // const evidenceScore = Math.min(
    //         //     Math.round(((log.image_urls?.length > 0 ? 50 : 0) + (log.video_urls?.length > 0 ? 30 : 0) + (log.location ? 20 : 0))),
    //         //     100,
    //         // );

    //         // // Call TrustComputation with LogAuditorTrustPackage inputs
    //         // await this.trustworthinessService.processData(
    //         //     'log', log.id, 'log', 'auditor',
    //         //     {
    //         //         consensusWeight,
    //         //         auditorCount,
    //         //         minAuditors: MIN_AUDITORS,
    //         //         spatialDistance,
    //         //         maxDistance: 100000, // ~100m in 1e6 scale
    //         //         evidenceScore,
    //         //     },
    //         //     {
    //         //         abiType: 'tuple(uint128,uint128,uint128,uint128,uint128,uint128)',
    //         //         map: (data: any) => [
    //         //             data.consensusWeight,
    //         //             data.auditorCount,
    //         //             data.minAuditors,
    //         //             data.spatialDistance,
    //         //             data.maxDistance,
    //         //             data.evidenceScore,
    //         //         ],
    //         //     },
    //         // );
    //     }

    //     async getVerificationStatus(logId: number) {
    //         const request = await this.requestRepo.findOne({
    //             where: { log_id: logId },
    //             order: { created: 'DESC' },
    //         });

    //         if (!request) {
    //             return { status: VerificationStatus.SKIPPED, consensus_result: null, auditor_count: 0 };
    //         }

    //         const assignmentCount = await this.assignmentRepo.count({
    //             where: { verification_request_id: request.id },
    //         });

    //         return {
    //             status: request.status,
    //             consensus_result: request.consensus_result,
    //             auditor_count: assignmentCount,
    //         };
    //     }

    //     async hasStepPendingVerification(seasonStepId: number): Promise<boolean> {
    //         const logs = await this.logService.getLogs(seasonStepId);
    //         const activeLogIds = logs.filter((l) => l.is_active).map((l) => l.id);

    //         if (activeLogIds.length === 0) return false;

    //         const pendingCount = await this.requestRepo
    //             .createQueryBuilder('vr')
    //             .where('vr.log_id IN (:...logIds)', { logIds: activeLogIds })
    //             .andWhere('vr.status = :status', { status: VerificationStatus.PENDING })
    //             .getCount();

    //         return pendingCount > 0;
    //     }

    //     /**
    //      * Get verification stats for a set of log IDs (used in step transparency scoring).
    //      * Returns counts of verified, rejected, and total reviewed logs.
    //      */
    //     async getLogVerificationStats(logIds: number[]): Promise<{ verified: number; rejected: number; reviewed: number }> {
    //         if (logIds.length === 0) return { verified: 0, rejected: 0, reviewed: 0 };

    //         const requests = await this.requestRepo
    //             .createQueryBuilder('vr')
    //             .where('vr.log_id IN (:...logIds)', { logIds })
    //             .andWhere('vr.status IN (:...statuses)', {
    //                 statuses: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED],
    //             })
    //             .getMany();

    //         const verified = requests.filter((r) => r.status === VerificationStatus.VERIFIED).length;
    //         const rejected = requests.filter((r) => r.status === VerificationStatus.REJECTED).length;

    //         return { verified, rejected, reviewed: verified + rejected };
    //     }


}
