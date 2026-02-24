# Farmera V2 — Improved Architecture & Workflow Design

## Synthesized from Blockchain Trustworthiness Analysis, Verification Flow, Transparency Scoring Redesign, and Multi-Package Trust Model Analysis

**Date**: February 10, 2026
**Scope**: Full-stack architectural redesign — smart contracts, backend services, database, API, scoring algorithms

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture — What Exists and What's Wrong](#2-current-architecture)
3. [Target Architecture — High-Level Design](#3-target-architecture)
4. [Smart Contract Layer — Redesign](#4-smart-contract-layer)
5. [Backend Service Layer — New and Modified Modules](#5-backend-service-layer)
6. [Database Layer — New Entities and Migrations](#6-database-layer)
7. [Scoring Algorithm — FTES v2 Framework](#7-scoring-algorithm)
8. [API Design — New Endpoints](#8-api-design)
9. [Complete Workflow — End-to-End Flow](#9-complete-workflow)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Academic Framing](#11-academic-framing)

---

## 1. Executive Summary

### What's Being Improved

The Farmera V2 system currently suffers from a **centralized trust model disguised as decentralized infrastructure**. The blockchain stores data hashes and computes trust scores, but all inputs originate from a single backend wallet, and the scoring formulas operate on unverifiable boolean flags. The system has a fully implemented `AuditorRegistry` smart contract that is completely disconnected from the backend.

### What the Redesign Achieves

| Dimension | Current | Redesigned |
|-----------|---------|------------|
| Trust authority | Backend (single party) | Auditor consensus (multi-party, staked) |
| Score inputs | Backend-supplied booleans | On-chain consensus signals (55%) + backend metrics (45%) |
| Blockchain writers | 1 wallet (backend) | N+1 wallets (backend + auditor wallets) |
| Scoring model | Ad-hoc weighted averages, binary thresholds | Bayesian aggregation, geometric means, sigmoid functions |
| Uncertainty | Not modeled | Beta posterior with confidence intervals |
| Image verification | AI-only (centralized oracle) | Hybrid AI pre-filter + auditor consensus |
| AuditorRegistry | Deployed but disconnected | Fully integrated into scoring pipeline |
| Paper's model | Inputs undermine the architecture | Inputs replaced with on-chain signals; pattern preserved |

### Key Design Decisions

1. **Keep** the paper's MetricSelection + TrustComputation + TrustPackage architecture (Option A from multi-package analysis)
2. **Replace** TrustPackage inputs: backend booleans -> auditor consensus signals
3. **Keep** AI image verification as a fast pre-filter; add auditor verification as authoritative layer
4. **Separate** transparency score from customer satisfaction score
5. **Introduce** Bayesian Beta aggregation at farm level for uncertainty-aware scoring
6. **Use** geometric mean at season level to prevent single-dimension failure masking

---

## 2. Current Architecture

### 2.1 System Diagram — What Exists Today

```
FARMER (Mobile App)
    │
    ▼
BACKEND (NestJS) ──── Single WALLET_PRIVATE_KEY ────┐
    │                                                 │
    ├── Save log to PostgreSQL                        │
    ├── ImageVerificationService (AI)                 │
    │   ├── Google Vision (relevance, originality)    │
    │   └── Perceptual hash (cross-farm duplicate)    │
    │                                                 │
    ├── ProcessTrackingService ───────────────────────►│ ProcessTracking.sol
    │   └── addLog(hash), addStep(hash)               │   └── Stores SHA-256 hashes
    │                                                 │
    ├── TrustworthinessService ──────────────────────►│ TrustComputation.sol
    │   └── processData(verified, imageVerified,      │   ├── MetricSelection.sol (registry)
    │        imageCount, location...)                  │   ├── LogDefaultTrustPackage.sol
    │                                                 │   └── StepTransparencyPackage.sol
    │                                                 │
    ├── TransparencyService (cron 3AM daily)          │ AuditorRegistry.sol
    │   └── Season → Plot → Farm scoring              │   └── DEPLOYED BUT NOT CONNECTED
    │                                                 │
    └── [AuditorService] ─── BROKEN ─────────────────►│   (uses wrong env var,
        └── Not exported from module                      not exported from module)


SMART CONTRACTS (Deployed):
    ✅ ProcessTracking.sol      — Working, integrated
    ✅ TrustComputation.sol     — Working, but inputs are unverifiable
    ✅ MetricSelection.sol      — Working
    ✅ LogDefaultTrustPackage   — Working, but 50% score from backend booleans
    ✅ StepTransparencyPackage  — Working
    ✅ AuditorRegistry.sol      — Fully implemented, ZERO integration
    ✅ PriceFeedConsumer.sol     — Working (Chainlink ETH/USD)
```

### 2.2 Known Issues

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | Single wallet writes all blockchain data | `process-tracking.service.ts`, `trustworthiness.service.ts` | Negates decentralization |
| 2 | `verified` and `imageVerified` booleans control 50% of trust score | `LogDefaultTrustPackage.sol` | On-chain scores from unverifiable inputs |
| 3 | AuditorService uses wrong env var | `auditor.service.ts` — uses `PROCESS_TRACKING_CONTRACT_ADDRESS` | Service cannot connect to contract |
| 4 | AuditorService not exported from BlockchainModule | `blockchain.module.ts` — in providers but not exports | Cannot be injected elsewhere |
| 5 | No AUDITOR role | `role.enum.ts` — only BUYER, FARMER, ADMIN | Cannot authorize auditor actions |
| 6 | Customer ratings in transparency score | `transparency.service.ts` — 40% weight | Conflates two orthogonal constructs |
| 7 | Binary 80/100 threshold destroys information | `transparency.service.ts` | Log scoring 79 = Log scoring 10 |
| 8 | Season/Farm scoring entirely off-chain | `transparency.service.ts`, `weight.constant.ts` | Weights modifiable without governance |
| 9 | No uncertainty modeling | Farm score calculation | 1 season = 50 seasons in confidence |
| 10 | Linear cliff temporal function | `calcSeasonScheduleAdherence` | 15 days late = 6 months late |

---

## 3. Target Architecture

### 3.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FARMERA V2 — REDESIGNED                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FARMER (Mobile App)                      AUDITOR (Web/Mobile)              │
│      │                                        │                             │
│      ▼                                        ▼                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  BACKEND (NestJS)                                                    │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────────┐    │   │
│  │  │ CropMgmt    │  │ Verification     │  │ FTES                 │    │   │
│  │  │ Module      │  │ Module (NEW)     │  │ Module               │    │   │
│  │  │             │  │                  │  │                      │    │   │
│  │  │ • addLog    │  │ • selectAuditors │  │ • TransparencyService│    │   │
│  │  │ • addStep   │  │ • assignTask     │  │   (REDESIGNED)       │    │   │
│  │  │ • finishSsn │  │ • submitVote     │  │ • ImageVerification  │    │   │
│  │  │             │  │ • eventListener  │  │   (KEPT as pre-filt.)│    │   │
│  │  └──────┬──────┘  └────────┬─────────┘  └──────────┬───────────┘    │   │
│  │         │                  │                        │                │   │
│  │  ┌──────┴──────────────────┴────────────────────────┴───────────┐    │   │
│  │  │  Blockchain Module                                           │    │   │
│  │  │                                                              │    │   │
│  │  │  ProcessTrackingService  TrustworthinessService  AuditorSvc  │    │   │
│  │  │  (Backend wallet)        (Backend wallet)         (FIX bugs) │    │   │
│  │  └──────┬───────────────────┬───────────────────────┬───────────┘    │   │
│  └─────────┼───────────────────┼───────────────────────┼────────────────┘   │
│            │                   │                       │                    │
│            ▼                   ▼                       ▼                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SMART CONTRACTS (zkSync / Ethereum)                                │    │
│  │                                                                     │    │
│  │  ProcessTracking.sol          TrustComputation.sol                  │    │
│  │  └── Hash storage             ├── MetricSelection.sol (registry)   │    │
│  │      (UNCHANGED)              ├── LogAuditorTrustPackage (NEW)     │    │
│  │                               └── StepAuditorTrustPackage (NEW)    │    │
│  │                                                                     │    │
│  │  AuditorRegistry.sol (MODIFIED — add assignment + deadlines)        │    │
│  │  └── Staking, voting, consensus, slashing, assignment               │    │
│  │                                                                     │    │
│  │  WRITERS:                                                           │    │
│  │    Backend wallet ──► ProcessTracking, TrustComputation             │    │
│  │    Auditor wallets ─► AuditorRegistry.verify()  ← MULTI-WRITER     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  DATABASE (PostgreSQL)                                              │    │
│  │                                                                     │    │
│  │  EXISTING: users, farms, plots, seasons, steps, logs, products...   │    │
│  │  NEW:      auditor_profiles, verification_requests,                 │    │
│  │            verification_assignments                                 │    │
│  │  MODIFIED: logs (add verification_status column)                    │    │
│  │            users (AUDITOR role support)                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Trust Authority Transformation

```
BEFORE:
    Data Validity = Backend says so
    Score Integrity = Backend-supplied inputs → on-chain formula
    Accountability = None

AFTER:
    Data Validity = Auditor consensus (staked, reputation-weighted)
    Score Integrity = On-chain consensus signals (55%) + backend metrics (45%) → on-chain formula
    Accountability = Stake slashing + reputation loss for dishonest votes
```

---

## 4. Smart Contract Layer

### 4.1 Contracts Overview

| Contract | Status | Changes |
|----------|--------|---------|
| `ProcessTracking.sol` | KEEP | No changes |
| `MetricSelection.sol` | KEEP | No changes — register new TrustPackages |
| `TrustComputation.sol` | KEEP | No changes — orchestration engine |
| `LogDefaultTrustPackage.sol` | REPLACE | → `LogAuditorTrustPackage.sol` |
| `StepTransparencyPackage.sol` | REPLACE | → `StepAuditorTrustPackage.sol` |
| `AuditorRegistry.sol` | MODIFY | Add assignment, deadlines, expiry handling |
| `PriceFeedConsumer.sol` | KEEP | No changes |

### 4.2 New: LogAuditorTrustPackage.sol

Replaces `LogDefaultTrustPackage.sol`. Dominant inputs (55%) from on-chain auditor consensus.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TrustPackage} from "../interfaces/TrustPackage.sol";

contract LogAuditorTrustPackage is TrustPackage {
    uint128 constant SCALE = 100;

    // On-chain inputs: 55% weight
    uint128 constant W_CONSENSUS = 40;           // Auditor consensus quality
    uint128 constant W_CONSENSUS_STRENGTH = 15;  // Number of auditors involved

    // Backend inputs: 45% weight
    uint128 constant W_SPATIAL = 25;             // GPS distance (mathematically verifiable)
    uint128 constant W_EVIDENCE = 20;            // Evidence completeness (low impact)

    struct LogData {
        uint128 consensusWeight;    // Reputation-weighted consensus [0-100]
        uint128 auditorCount;       // Auditors who voted
        uint128 minAuditors;        // Expected minimum auditors
        uint128 spatialDistance;    // Distance log↔plot (× 1e6 for precision)
        uint128 maxDistance;        // Maximum acceptable distance
        uint128 evidenceScore;     // Evidence completeness [0-100]
    }

    function computeTrustScore(bytes calldata payload) external pure returns (uint128) {
        LogData memory d = abi.decode(payload, (LogData));

        uint128 Tc = d.consensusWeight;
        uint128 Tcs = _min((d.auditorCount * SCALE) / d.minAuditors, SCALE);

        uint128 Tsp = 0;
        if (d.spatialDistance <= d.maxDistance) {
            uint128 ratio = (d.spatialDistance * d.spatialDistance * SCALE)
                          / (d.maxDistance * d.maxDistance);
            Tsp = SCALE - _min(ratio, SCALE);
        }

        uint128 Te = _min(d.evidenceScore, SCALE);

        return (W_CONSENSUS * Tc
              + W_CONSENSUS_STRENGTH * Tcs
              + W_SPATIAL * Tsp
              + W_EVIDENCE * Te) / SCALE;
    }

    function _min(uint128 a, uint128 b) internal pure returns (uint128) {
        return a < b ? a : b;
    }
}
```

### 4.3 New: StepAuditorTrustPackage.sol

Replaces `StepTransparencyPackage.sol`. Uses auditor consensus outcomes (verifiedLogs, rejectedLogs) instead of backend-counted valid/invalid.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TrustPackage} from "../interfaces/TrustPackage.sol";

contract StepAuditorTrustPackage is TrustPackage {
    uint128 constant SCALE = 100;
    uint128 constant W_COVERAGE = 35;
    uint128 constant W_VERIFICATION_RATE = 35;
    uint128 constant W_ACTIVITY = 15;
    uint128 constant W_CONSENSUS_QUALITY = 15;

    struct StepData {
        uint128 totalLogs;
        uint128 verifiedLogs;       // Consensus = VALID
        uint128 rejectedLogs;       // Consensus = INVALID
        uint128 unverifiedLogs;     // Not sent to auditors
        uint128 activeDays;
        uint128 totalDays;
        uint128 minLogs;
        uint128 avgConsensusWeight; // Average consensus weight [0-100]
    }

    function computeTrustScore(bytes calldata payload) external pure returns (uint128) {
        StepData memory d = abi.decode(payload, (StepData));

        uint128 Lc = _min((d.totalLogs * SCALE) / d.minLogs, SCALE);

        uint128 Vr = 70; // Default discount for unreviewed
        uint128 reviewed = d.verifiedLogs + d.rejectedLogs;
        if (reviewed > 0) {
            Vr = (d.verifiedLogs * SCALE) / reviewed;
        }

        uint128 Ar = d.totalDays > 0
            ? (d.activeDays * SCALE) / d.totalDays
            : 0;

        uint128 Cq = d.avgConsensusWeight;

        // 4x penalty amplification for rejected logs
        uint128 penaltyFactor = SCALE;
        if (d.rejectedLogs > 0 && d.totalLogs > 0) {
            uint128 rejectionRatio = (d.rejectedLogs * SCALE) / d.totalLogs;
            penaltyFactor = SCALE - _min(rejectionRatio * 4, SCALE);
        }

        uint128 raw = (W_COVERAGE * Lc
                     + W_VERIFICATION_RATE * Vr
                     + W_ACTIVITY * Ar
                     + W_CONSENSUS_QUALITY * Cq) / SCALE;

        return (raw * penaltyFactor) / SCALE;
    }

    function _min(uint128 a, uint128 b) internal pure returns (uint128) {
        return a < b ? a : b;
    }
}
```

### 4.4 Modified: AuditorRegistry.sol — Additions

```solidity
// ADD to existing AuditorRegistry.sol:

// --- New state variables ---
mapping(bytes32 => mapping(uint64 => mapping(address => bool))) public assignedAuditors;
mapping(bytes32 => mapping(uint64 => uint256)) public verificationDeadlines;

// --- New events ---
event VerificationRequested(
    bytes32 indexed identifier,
    uint64 indexed id,
    address[] auditors,
    uint256 deadline
);

// --- New functions ---

/// @notice Called by backend to create a verification task with assigned auditors
function requestVerification(
    bytes32 identifier,
    uint64 id,
    address[] calldata selectedAuditors,
    uint256 deadline
) external {
    for (uint i = 0; i < selectedAuditors.length; i++) {
        require(auditors[selectedAuditors[i]].isActive, "Auditor not active");
        assignedAuditors[identifier][id][selectedAuditors[i]] = true;
    }
    verificationDeadlines[identifier][id] = deadline;
    emit VerificationRequested(identifier, id, selectedAuditors, deadline);
}

/// @notice Modified verify() — add assignment and deadline checks
function verify(bytes32 identifier, uint64 id, bool isValid) external {
    require(assignedAuditors[identifier][id][msg.sender], "Not assigned");
    require(block.timestamp <= verificationDeadlines[identifier][id], "Deadline passed");
    // ... existing voting logic ...
}

/// @notice Finalize expired verifications (called by backend or anyone)
function finalizeExpired(bytes32 identifier, uint64 id) external {
    require(block.timestamp > verificationDeadlines[identifier][id], "Not expired");
    require(verifications[identifier][id].length > 0, "No votes");
    bool consensus = calculateConsensus(identifier, id);
    finalizeVerification(identifier, id, consensus);
}
```

### 4.5 MetricSelection Registration

After deploying new TrustPackages, register them:

```
// Replace old registrations:
MetricSelection.registerTrustPackage("log", "auditor", LogAuditorTrustPackage.address)
MetricSelection.registerTrustPackage("step", "auditor", StepAuditorTrustPackage.address)

// Keep old for backward compatibility (existing scored data):
// ("log", "default") → LogDefaultTrustPackage  [old scores remain immutable]
// ("step", "default") → StepTransparencyPackage [old scores remain immutable]
```

---

## 5. Backend Service Layer

### 5.1 New Module: Verification

```
src/modules/verification/
├── verification.module.ts
├── verification.controller.ts              ← API endpoints for auditors + admin
├── verification.service.ts                 ← Core orchestration logic
├── auditor-selection.service.ts            ← Auditor selection algorithm
├── verification-listener.service.ts        ← Blockchain event listener (polls/WebSocket)
├── entities/
│   ├── verification-request.entity.ts
│   ├── verification-assignment.entity.ts
│   └── auditor-profile.entity.ts
├── dtos/
│   ├── submit-vote.dto.ts
│   ├── register-auditor.dto.ts
│   ├── verification-package-response.dto.ts
│   └── create-verification-request.dto.ts
└── enums/
    └── verification-status.enum.ts
```

### 5.2 Module Dependencies

```
VerificationModule
    imports: [
        TypeOrmModule.forFeature([VerificationRequest, VerificationAssignment, AuditorProfile]),
        BlockchainModule,          // AuditorService (FIXED)
        NotificationModule,        // Push notifications to auditors
        FtesModule,                // TransparencyService (for score recalculation)
    ]
    providers: [
        VerificationService,
        AuditorSelectionService,
        VerificationListenerService,
    ]
    exports: [VerificationService]
    controllers: [VerificationController]
```

### 5.3 Fix Existing: BlockchainModule

```typescript
// blockchain.module.ts — CHANGES:

@Module({
    providers: [ProcessTrackingService, TrustworthinessService, AuditorService],
    exports: [ProcessTrackingService, TrustworthinessService, AuditorService],
    //                                                        ^^^^^^^^^^^^^^
    //                                                        ADD to exports
})
export class BlockchainModule {}
```

### 5.4 Fix Existing: AuditorService

```typescript
// auditor.service.ts — FIX wrong env var:

// BEFORE (BUG):
const contractAddress = this.configService.get<string>('PROCESS_TRACKING_CONTRACT_ADDRESS');

// AFTER (FIX):
const contractAddress = this.configService.get<string>('AUDITOR_REGISTRY_CONTRACT_ADDRESS');
```

Add new methods:

```typescript
// auditor.service.ts — ADD methods:

async requestVerification(identifier: string, id: number, auditorAddresses: string[], deadline: number): Promise<TransactionReceipt> {
    // Call AuditorRegistry.requestVerification()
}

async getVerifications(identifier: string, id: number): Promise<Verification[]> {
    // Call AuditorRegistry.getVerifications()
}

async getAuditor(address: string): Promise<AuditorInfo> {
    // Call AuditorRegistry.getAuditor()
}

async finalizeExpired(identifier: string, id: number): Promise<TransactionReceipt> {
    // Call AuditorRegistry.finalizeExpired()
}
```

### 5.5 Core Service: VerificationService

```typescript
// verification.service.ts — key methods:

@Injectable()
export class VerificationService {

    /**
     * Called after log submission. Determines if log needs auditor verification.
     */
    async evaluateForVerification(log: Log, automatedTrustScore: number): Promise<void> {
        // Decision criteria:
        // ALWAYS verify: automatedTrustScore < 60
        // RANDOM 20%:    60 <= automatedTrustScore < 90
        // SKIP:          automatedTrustScore >= 90 AND no duplicate flags

        if (shouldVerify) {
            const auditors = await this.auditorSelectionService.selectAuditors(
                MIN_AUDITORS,
                log.step.season.plot.farm.id  // exclude same-farm auditors
            );

            // Create DB records
            const request = await this.createVerificationRequest(log, auditors);

            // On-chain: register the assignment
            await this.auditorService.requestVerification(
                identifier, logId, auditorAddresses, deadline
            );

            // Notify auditors
            await this.notificationService.notifyAuditors(auditors, request);

            // Update log status
            log.verification_status = VerificationStatus.PENDING;
        } else {
            log.verification_status = VerificationStatus.SKIPPED;
        }
    }

    /**
     * Called when auditor submits a vote via API.
     * The auditor signs the verify() tx with their OWN wallet.
     */
    async recordVote(requestId: number, auditorProfileId: number, isValid: boolean, txHash: string): Promise<void> {
        // 1. Verify the txHash corresponds to a real on-chain verify() call
        // 2. Update VerificationAssignment
        // 3. Check if consensus reached (listen for VerificationFinalized event)
    }

    /**
     * Called by VerificationListenerService when consensus is finalized on-chain.
     */
    async handleConsensusFinalized(identifier: string, id: number, consensus: boolean): Promise<void> {
        // 1. Update VerificationRequest status → FINALIZED
        // 2. Update Log verification_status → VERIFIED or REJECTED
        // 3. If REJECTED: deactivate log, flag farm, notify admin
        // 4. Trigger transparency score recalculation for affected step
    }
}
```

### 5.6 Auditor Selection Strategy

```typescript
// auditor-selection.service.ts

@Injectable()
export class AuditorSelectionService {

    async selectAuditors(count: number, excludeFarmId: number): Promise<AuditorProfile[]> {
        // 1. Get all active auditors
        const auditors = await this.auditorProfileRepo.find({
            where: { is_active: true },
            relations: ['user'],
        });

        // 2. Exclude same-farm auditors (conflict of interest)
        const eligible = auditors.filter(a => a.user.farm_id !== excludeFarmId);

        // 3. Fetch on-chain reputation
        const withReputation = await Promise.all(
            eligible.map(async (a) => ({
                ...a,
                reputation: (await this.auditorService.getAuditor(a.wallet_address)).reputationScore,
            }))
        );

        // 4. Sort by reputation, take top 2×count, randomly select count
        withReputation.sort((a, b) => b.reputation - a.reputation);
        const pool = withReputation.slice(0, count * 2);
        return this.shuffleAndTake(pool, count);
    }
}
```

### 5.7 Blockchain Event Listener

```typescript
// verification-listener.service.ts

@Injectable()
export class VerificationListenerService implements OnModuleInit {

    // Polls for VerificationFinalized events every 30 seconds
    @Cron('*/30 * * * * *')
    async pollConsensusEvents(): Promise<void> {
        const events = await this.auditorService.getRecentVerificationFinalizedEvents(this.lastProcessedBlock);

        for (const event of events) {
            await this.verificationService.handleConsensusFinalized(
                event.identifier,
                event.id,
                event.consensus
            );
        }

        this.lastProcessedBlock = latestBlock;
    }

    // Also handles expired verifications
    @Cron('0 */15 * * * *')  // Every 15 minutes
    async checkExpiredVerifications(): Promise<void> {
        const expired = await this.verificationRequestRepo.find({
            where: {
                status: VerificationStatus.PENDING,
                deadline: LessThan(new Date()),
            },
        });

        for (const request of expired) {
            await this.auditorService.finalizeExpired(request.identifier, request.blockchain_log_id);
        }
    }
}
```

### 5.8 Modified: TransparencyService (FTES v2)

The existing `TransparencyService` is redesigned with the formal scoring framework. Key changes:

| Method | Current | Redesigned |
|--------|---------|------------|
| `calcStepTransparencyScore` | Binary valid/invalid counting | Continuous Sl scores, verification ratio, temporal regularity |
| `calcSeasonTransparencyScore` | Arithmetic weighted average | Geometric mean: PT^0.65 x SA^0.20 x OC^0.15 |
| `calcSeasonScheduleAdherence` | Linear cliff (0 after 14 days) | Sigmoid: 1/(1+exp(k*(d-d0))) |
| `calcFarmTransparencyScore` | Weighted avg with customer trust (40%) | Bayesian Beta aggregation, customer trust separated |
| NEW: `calcLogEvidenceScore` | N/A | Continuous evidence scoring per log |
| NEW: `calcBayesianFarmScore` | N/A | Beta posterior with uncertainty |

---

## 6. Database Layer

### 6.1 New Enum: UserRole

```typescript
// src/common/enums/role.enum.ts
export enum UserRole {
    BUYER = 'BUYER',
    FARMER = 'FARMER',
    ADMIN = 'ADMIN',
    AUDITOR = 'AUDITOR',    // NEW
}
```

### 6.2 New Enum: VerificationStatus

```typescript
// src/modules/verification/enums/verification-status.enum.ts
export enum VerificationStatus {
    SKIPPED = 'SKIPPED',       // Not selected for verification (uses automated score only)
    PENDING = 'PENDING',       // Awaiting auditor votes
    VERIFIED = 'VERIFIED',     // Consensus = VALID
    REJECTED = 'REJECTED',    // Consensus = INVALID
}
```

### 6.3 New Entity: AuditorProfile

```typescript
@Entity('auditor_profiles')
export class AuditorProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true, default: () => 'uuid_generate_v4()' })
    public_id: string;

    @Column()
    user_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 42, unique: true })
    wallet_address: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ type: 'int', default: 0 })
    total_verifications: number;

    @Column({ type: 'int', default: 0 })
    correct_verifications: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
```

### 6.4 New Entity: VerificationRequest

```typescript
@Entity('verification_requests')
export class VerificationRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', unique: true, default: () => 'uuid_generate_v4()' })
    public_id: string;

    @Column()
    log_id: number;

    @ManyToOne(() => Log)
    @JoinColumn({ name: 'log_id' })
    log: Log;

    @Column({ type: 'varchar', length: 66 })
    identifier: string;                // bytes32 keccak256(farm.public_id)

    @Column()
    blockchain_log_id: number;

    @Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.PENDING })
    status: VerificationStatus;

    @Column({ type: 'boolean', nullable: true })
    consensus_result: boolean | null;

    @Column({ type: 'timestamp' })
    deadline: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
```

### 6.5 New Entity: VerificationAssignment

```typescript
@Entity('verification_assignments')
export class VerificationAssignment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    verification_request_id: number;

    @ManyToOne(() => VerificationRequest)
    @JoinColumn({ name: 'verification_request_id' })
    verification_request: VerificationRequest;

    @Column()
    auditor_profile_id: number;

    @ManyToOne(() => AuditorProfile)
    @JoinColumn({ name: 'auditor_profile_id' })
    auditor_profile: AuditorProfile;

    @Column({ type: 'boolean', nullable: true })
    vote: boolean | null;

    @Column({ type: 'varchar', length: 66, nullable: true })
    vote_transaction_hash: string | null;

    @CreateDateColumn()
    assigned_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    voted_at: Date | null;
}
```

### 6.6 Modified Entity: Log

```typescript
// ADD to existing Log entity:
@Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.SKIPPED })
verification_status: VerificationStatus;
```

### 6.7 Migration

```
npm run migration:create-linux -- src/migrations/AddVerificationSystem
```

Migration should:
1. Add `verification_status` column to `logs` table
2. Create `auditor_profiles` table
3. Create `verification_requests` table
4. Create `verification_assignments` table
5. Add `AUDITOR` to the user role enum type in PostgreSQL

---

## 7. Scoring Algorithm — FTES v2 Framework

### 7.1 Overview

```
Level 1: LOG EVIDENCE SCORE
    Evidence Score (El) = automated metrics [0-1]
    Verification Score (Vl) = auditor consensus [0-1]
    Composite: Sl = El × Vl (multiplicative — both must be reasonable)

Level 2: STEP TRANSPARENCY INDEX
    Is = 0.50 × DC + 0.35 × VR + 0.15 × TR
    DC = Documentation Completeness (log count × quality)
    VR = Verification Ratio (auditor-verified / total reviewed)
    TR = Temporal Regularity (coefficient of variation of log gaps)

Level 3: SEASON TRANSPARENCY SCORE
    Tsn = PT^0.65 × SA^0.20 × OC^0.15 (weighted geometric mean)
    PT = Process Transparency (weighted step aggregation)
    SA = Schedule Adherence (sigmoid function)
    OC = Outcome Consistency (Gaussian deviation from expected yield)

Level 4: FARM TRANSPARENCY SCORE
    Bayesian Beta aggregation:
    Prior: θ ~ Beta(2, 2)
    Update: α += wi × si × n_eff, β += wi × (1-si) × n_eff
    Score = α / (α + β) with confidence interval

SEPARATE: Customer Satisfaction (NOT part of transparency)
    Score = avg_rating / 5
    Reported alongside but not mixed into transparency
```

### 7.2 Mathematical Details

#### Sigmoid for Schedule Adherence (replaces linear cliff)

```
SA = 1 / (1 + exp(0.3 × (d - 14)))

Behavior:
    d = 0 days  → SA ≈ 0.985
    d = 7 days  → SA ≈ 0.891
    d = 14 days → SA ≈ 0.500
    d = 21 days → SA ≈ 0.109
    d = 30 days → SA ≈ 0.007
```

#### Geometric Mean for Season (replaces arithmetic weighted average)

```
Tsn = max(PT, 0.01)^0.65 × max(SA, 0.01)^0.20 × max(OC, 0.01)^0.15

Why: Arithmetic mean hides single-dimension failure.
    Arithmetic: 0.60(1.0) + 0.20(0.0) + 0.20(1.0) = 0.80 ← too generous
    Geometric:  1.0^0.65 × 0.01^0.20 × 1.0^0.15 = 0.398  ← appropriately strict
```

#### Bayesian Beta for Farm (replaces weighted average with decay)

```
Prior: α₀ = 2, β₀ = 2 (weak uniform prior)
Per season: α += exp(-λt) × s × 5, β += exp(-λt) × (1-s) × 5
    where λ = ln(2)/6 (half-life 6 months), s = season score, t = months ago

Farm Score = α / (α + β)
Confidence = 1 - (αβ / ((α+β)² × (α+β+1))) / 0.25

Example:
    Farm with 1 season at 0.90: Score = 0.722, Confidence = LOW
    Farm with 10 seasons avg 0.90: Score = 0.866, Confidence = HIGH
```

### 7.3 Separated Scorecard

```typescript
interface FarmScorecard {
    transparency: {
        score: number;              // Bayesian posterior mean
        confidence: number;         // [0-1] based on posterior variance
        seasons_evaluated: number;
        last_updated: Date;
    };
    customer_satisfaction: {
        score: number;              // avg_rating / 5
        review_count: number;
    };
    verification_summary: {
        total_logs_verified: number;
        consensus_valid_rate: number;
        active_auditors: number;
    };
}
```

---

## 8. API Design

### 8.1 Auditor Registration

```
POST /api/verification/auditors/register
    Auth: ADMIN only
    Body: { user_id: number, wallet_address: string }
    Flow: Creates AuditorProfile in DB. Auditor then stakes ETH
          by calling AuditorRegistry.registerAuditor() from THEIR wallet.
    Response: { auditor_profile_id, wallet_address, status }
```

### 8.2 Auditor Verification Workflow

```
GET /api/verification/pending
    Auth: AUDITOR
    Description: List assigned verification tasks for this auditor
    Response: VerificationRequest[] with log metadata

GET /api/verification/:requestId/package
    Auth: AUDITOR (must be assigned)
    Description: Full verification data package
    Response: {
        log: { description, images, videos, location, created_at },
        plot: { name, location, size, crop_type },
        season: { crop_name, current_step, start_date },
        blockchain: { on_chain_hash, automated_trust_score, tx_hash },
        ai_analysis: { relevance_score, originality_score, duplicate_flags }
    }

POST /api/verification/:requestId/vote
    Auth: AUDITOR
    Body: { is_valid: boolean, transaction_hash: string }
    Description: Record vote. Auditor signs verify() tx with OWN wallet,
                 then submits tx hash here for backend tracking.
    Response: { vote_recorded: true, consensus_reached: boolean }
```

### 8.3 Admin Oversight

```
GET /api/admin/verifications
    Auth: ADMIN
    Query: status, farm_id, date_from, date_to
    Response: Paginated VerificationRequest[]

GET /api/admin/verifications/:requestId
    Auth: ADMIN
    Response: Detailed view with all auditor votes, consensus, on-chain data

GET /api/admin/auditors
    Auth: ADMIN
    Response: AuditorProfile[] with on-chain reputation and stake info
```

### 8.4 Public Transparency

```
GET /api/verification/log/:logId/status
    Auth: @Public()
    Response: { verification_status, consensus_result, auditor_count }
    Purpose: Buyers/consumers can verify how a log was validated

GET /api/farms/:farmId/scorecard
    Auth: @Public()
    Response: FarmScorecard (transparency + satisfaction, separated)
```

### 8.5 Route Registration

```typescript
// app.module.ts — add to RouterModule:
RouterModule.register([
    // ... existing routes ...
    {
        path: 'verification',
        module: VerificationModule,
    },
]),
```

---

## 9. Complete Workflow

### 9.1 Phase 1: Log Submission (Existing — Minimal Changes)

```
1. Farmer submits AddLogDto via mobile app
        ↓
2. Backend validates step status, saves Log to DB
        ↓
3. ImageVerificationService.verifyLogImages()
   ├── Perceptual hash → cross-farm duplicate detection
   ├── Google Vision API → agricultural relevance, originality
   └── Returns: imageVerified (bool), ai_score (0-1)
        ↓
4. ProcessTrackingService.addLog(seasonDetailId, logId, hash)
   └── SHA-256 hash stored on-chain immutably
        ↓
5. Backend computes Evidence Score (El):
   El = 0.30 × SpatialPlausibility(Gaussian)
      + 0.20 × EvidenceCompleteness
      + 0.30 × AIVerificationScore
      + 0.20 × DuplicateScore
        ↓
6. VerificationService.evaluateForVerification(log, automatedScore)
   ├── Score < 60 → ALWAYS verify
   ├── Score 60-90 → 20% random sample
   └── Score > 90 + no flags → SKIP verification
        ↓
7. IF verification needed:
   ├── Select auditors (reputation-weighted, exclude same-farm)
   ├── AuditorRegistry.requestVerification(identifier, id, auditors, deadline)
   ├── Create VerificationRequest + Assignments in DB
   ├── Notify auditors (Firebase push)
   └── Log.verification_status = PENDING

   IF verification skipped:
   ├── Log.verification_status = SKIPPED
   ├── Vl = 0.7 (default discount)
   ├── Sl = El × 0.7
   └── TrustworthinessService.processData(LogAuditorTrustPackage inputs)
```

### 9.2 Phase 2: Auditor Verification (New)

```
8. Auditor receives notification → opens app/dashboard
        ↓
9. GET /api/verification/pending → sees assigned tasks
        ↓
10. GET /api/verification/:id/package → receives full data:
    ├── Log content (description, images, videos, GPS)
    ├── Plot/Season context
    ├── On-chain hash (can verify data integrity)
    ├── AI analysis results (flags, scores)
    └── Historical context (previous logs count, farm score)
        ↓
11. Auditor reviews evidence:
    ├── Are images genuine agricultural activity?
    ├── Does GPS match the declared plot?
    ├── Is description consistent with season/step?
    ├── Does on-chain hash match the shown data?
    └── Signs of fabrication, staging, or reuse?
        ↓
12. Auditor calls AuditorRegistry.verify(identifier, logId, isValid)
    └── SIGNED WITH AUDITOR'S OWN WALLET (not backend wallet)
        ↓
13. POST /api/verification/:id/vote { is_valid, transaction_hash }
    └── Backend records the vote for tracking
        ↓
14. When MIN_AUDITORS (2) have voted:
    ├── AuditorRegistry.calculateConsensus() — reputation-weighted majority
    ├── AuditorRegistry.finalizeVerification()
    │   ├── Correct voters: +2 reputation
    │   └── Incorrect voters: -5 reputation, -0.1 ETH stake
    └── Emit VerificationFinalized(identifier, id, consensus)
```

### 9.3 Phase 3: Consensus Integration (New)

```
15. VerificationListenerService detects VerificationFinalized event
        ↓
16. VerificationService.handleConsensusFinalized():
    │
    ├── IF consensus = VALID:
    │   ├── Log.verification_status = VERIFIED
    │   ├── Vl = consensus_weight (reputation-weighted ratio, 0-1)
    │   ├── Sl = El × Vl
    │   ├── TrustworthinessService.processData(LogAuditorTrustPackage inputs)
    │   └── Notify farmer: "Log verified by auditors"
    │
    └── IF consensus = INVALID:
        ├── Log.verification_status = REJECTED
        ├── Log.is_active = false (excluded from future calculations)
        ├── Notify farmer: "Log flagged by auditors"
        ├── Notify admin: "Review required"
        ├── Flag farm for increased verification sampling
        └── Recalculate step transparency if step already scored
```

### 9.4 Phase 4: Step Completion (Modified)

```
17. Farmer requests step completion
        ↓
18. Backend checks:
    ├── All active logs have verification_status ≠ PENDING
    │   (must be VERIFIED, REJECTED, or SKIPPED)
    └── If any PENDING → reject: "Verification in progress"
        ↓
19. Aggregate step data:
    ├── totalLogs = count(active logs)
    ├── verifiedLogs = count(verification_status = VERIFIED)
    ├── rejectedLogs = count(verification_status = REJECTED)
    ├── unverifiedLogs = count(verification_status = SKIPPED)
    ├── avgConsensusWeight = mean(consensus weights of verified logs)
    ├── activeDays, totalDays from step date range
    └── minLogs from step type requirements
        ↓
20. TrustworthinessService.processData(StepAuditorTrustPackage inputs)
    └── On-chain: StepAuditorTrustPackage.computeTrustScore()
        ↓
21. ProcessTrackingService.addStep(hash)
    └── Step data hash stored on-chain
```

### 9.5 Phase 5: Season/Farm Scoring (Redesigned)

```
22. Season completion → TransparencyService.calcSeasonTransparencyScore()
    │
    ├── PT = Σ(step_weight × step_trust_score)  for each step type
    │
    ├── SA = 1 / (1 + exp(0.3 × (deviation_days - 14)))  ← sigmoid
    │
    ├── OC = exp(-|actual_yield - expected|² / (2 × expected²))  ← Gaussian
    │
    └── Tsn = max(PT, 0.01)^0.65 × max(SA, 0.01)^0.20 × max(OC, 0.01)^0.15
              └── Geometric mean
        ↓
23. TransparencyService.calcFarmTransparencyScore()
    │
    ├── Prior: α = 2, β = 2
    │
    ├── For each completed season:
    │   wi = exp(-ln(2)/6 × months_ago)
    │   α += wi × season_score × 5
    │   β += wi × (1 - season_score) × 5
    │
    ├── Farm Score = α / (α + β)
    │
    └── Confidence = f(posterior variance)
        ↓
24. Build FarmScorecard:
    {
        transparency: { score, confidence, seasons_evaluated },
        customer_satisfaction: { score: avg_rating/5, review_count },
        verification_summary: { verified_logs, valid_rate, active_auditors }
    }
```

### 9.6 Complete Sequence Diagram

```
    Farmer              Backend              ProcessTracking     TrustComputation    AuditorRegistry       Auditors
      │                    │                       │                    │                   │                  │
      │  Submit Log        │                       │                    │                   │                  │
      │───────────────────>│                       │                    │                   │                  │
      │                    │  Save + AI verify     │                    │                   │                  │
      │                    │  Compute El           │                    │                   │                  │
      │                    │                       │                    │                   │                  │
      │                    │  addLog(hash)         │                    │                   │                  │
      │                    │──────────────────────>│                    │                   │                  │
      │                    │                       │                    │                   │                  │
      │                    │  Needs verification?  │                    │                   │                  │
      │                    │  YES: score < 90      │                    │                   │                  │
      │                    │                       │                    │                   │                  │
      │                    │  requestVerification(auditors, deadline)   │                   │                  │
      │                    │──────────────────────────────────────────────────────────────>│                  │
      │                    │  Notify auditors       │                    │                   │                  │
      │                    │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─>│
      │                    │                       │                    │                   │                  │
      │  "Log pending      │                       │                    │                   │                  │
      │   review"          │                       │                    │                   │                  │
      │<───────────────────│                       │                    │                   │                  │
      │                    │                       │                    │                   │                  │
      │                    │                       │                    │                   │ GET /package     │
      │                    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
      │                    │  return data package    │                    │                   │                  │
      │                    │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─>│
      │                    │                       │                    │                   │                  │
      │                    │                       │                    │  verify(id, true)  │  Auditor 1      │
      │                    │                       │                    │                   │<─────────────────│
      │                    │                       │                    │  verify(id, true)  │  Auditor 2      │
      │                    │                       │                    │                   │<─────────────────│
      │                    │                       │                    │                   │                  │
      │                    │                       │                    │  Consensus = VALID │                  │
      │                    │                       │                    │  Reward auditors   │                  │
      │                    │                       │                    │                   │                  │
      │                    │  Event: VerificationFinalized(VALID)       │                   │                  │
      │                    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤                  │
      │                    │                       │                    │                   │                  │
      │                    │  Compute Sl = El × Vl │                    │                   │                  │
      │                    │  processData(inputs)  │                    │                   │                  │
      │                    │──────────────────────────────────────────>│                   │                  │
      │                    │                       │    score stored   │                   │                  │
      │                    │                       │                    │                   │                  │
      │  "Log verified"    │                       │                    │                   │                  │
      │<───────────────────│                       │                    │                   │                  │
```

---

## 10. Implementation Roadmap

### Phase 0: Bug Fixes (Day 1)

| Task | File | Effort |
|------|------|--------|
| Fix AuditorService env var | `auditor.service.ts` | 15 min |
| Export AuditorService from BlockchainModule | `blockchain.module.ts` | 15 min |
| Add AUDITOR to UserRole enum | `role.enum.ts` | 15 min |
| Add AUDITOR to PostgreSQL enum type | Migration | 30 min |

### Phase 1: Database Foundation (Days 2-3)

| Task | Effort |
|------|--------|
| Create VerificationStatus enum | 15 min |
| Create AuditorProfile entity | 1 hour |
| Create VerificationRequest entity | 1 hour |
| Create VerificationAssignment entity | 1 hour |
| Add verification_status to Log entity | 30 min |
| Create migration | 2 hours |
| Run migration, verify schema | 1 hour |

### Phase 2: Smart Contracts (Days 4-6)

| Task | Effort |
|------|--------|
| Write LogAuditorTrustPackage.sol | 1 day |
| Write StepAuditorTrustPackage.sol | 1 day |
| Add assignment/deadline to AuditorRegistry.sol | 0.5 day |
| Write tests (Foundry) | 1 day |
| Deploy contracts | 0.5 day |
| Register new TrustPackages in MetricSelection | 30 min |
| Update ABIs in backend (`src/contracts/`) | 1 hour |

### Phase 3: Verification Module (Days 7-11)

| Task | Effort |
|------|--------|
| Create VerificationModule scaffold | 1 hour |
| Implement AuditorSelectionService | 0.5 day |
| Implement VerificationService core | 2 days |
| Implement VerificationListenerService | 1 day |
| Implement VerificationController | 1 day |
| Add to AppModule route registration | 30 min |
| Add methods to AuditorService | 1 day |

### Phase 4: Scoring Redesign (Days 12-14)

| Task | Effort |
|------|--------|
| Implement FTES v2 formulas in TransparencyService | 1.5 days |
| Implement Bayesian Beta farm scoring | 0.5 day |
| Separate customer satisfaction from transparency | 0.5 day |
| Create FarmScorecard response DTO | 0.5 day |
| Update weight constants | 0.5 day |

### Phase 5: Integration & Modify Existing Flows (Days 15-17)

| Task | Effort |
|------|--------|
| Modify CropManagement addLog flow → call VerificationService | 0.5 day |
| Modify finishStep → check verification_status | 0.5 day |
| Modify TrustworthinessService inputs for new TrustPackages | 0.5 day |
| Add admin verification endpoints | 0.5 day |
| Add public scorecard endpoint | 0.5 day |
| Notification integration for auditors | 0.5 day |

### Phase 6: Testing (Days 18-20)

| Task | Effort |
|------|--------|
| Unit tests for VerificationService | 1 day |
| Unit tests for TransparencyService (FTES v2) | 1 day |
| Integration tests (end-to-end flow) | 1 day |

### Total Estimated Effort: ~20 working days

---

## 11. Academic Framing

### 11.1 Research Contribution

> We propose an improved Farm Transparency and Evaluation System (FTES v2) that addresses three fundamental limitations in blockchain-based agricultural supply chain trust systems:
>
> 1. **The single-oracle problem**: We replace centralized backend attestation with decentralized auditor consensus using reputation-weighted voting and economic staking, transforming the trust model from institutional dependence to cryptographic-economic security.
>
> 2. **The IoT assumption gap**: We adapt the multi-package trust model (Leteane & Ayalew, 2024) — originally designed for IoT device attestation — to human-submitted data by replacing device-level cryptographic proof with auditor consensus signals as the primary trust input.
>
> 3. **Statistical rigor in transparency scoring**: We introduce Bayesian Beta aggregation for uncertainty-aware farm scoring, geometric mean composition for dimension-interdependent season scoring, and sigmoid temporal functions to replace mathematically problematic cliff thresholds.

### 11.2 How This Builds on the Paper

```
Paper (Leteane & Ayalew):
    MetricSelection + TrustComputation + TrustPackage = extensible trust architecture
    Assumes: IoT device attestation as input source

This Work:
    KEEPS: MetricSelection + TrustComputation + TrustPackage architecture
    IDENTIFIES: IoT assumption breaks down for human-submitted data
    ADAPTS: Replaces device attestation with auditor consensus
    EXTENDS: Adds Bayesian aggregation, geometric mean, sigmoid functions
    PRESERVES: Extensibility for future domain-specific TrustPackages
```

### 11.3 Thesis Defense Points

1. **Why blockchain is now justified**: Auditors sign verification transactions with their own wallets. The backend cannot forge votes, manipulate reputations, or suppress consensus. This is impossible to replicate in a centralized system without reintroducing trust assumptions.

2. **Game-theoretic security**: Dishonest voting has negative expected value:
   - Correct vote: +2 reputation
   - Incorrect vote: -5 reputation, -0.1 ETH
   - Expected value of random voting: 0.5(+2) + 0.5(-5) = -1.5 reputation per vote
   - Rational strategy: vote honestly

3. **Trust model transformation**:
   - Before: T(system) = T(blockchain) ∩ T(backend) ≈ T(backend)
   - After: T(system) = T(blockchain) ∩ T(auditor consensus) ≈ T(economic rationality)

4. **Practical trade-off**: Not every log needs full verification. AI pre-filter provides speed (instant), auditor consensus provides trust (authoritative). The hybrid model balances scalability with rigor.

5. **Uncertainty quantification**: A farm with 1 good season scores lower than a farm with 10 good seasons (Bayesian shrinkage toward prior). This is statistically principled and prevents gaming through single-season performance.

### 11.4 Comparison with Existing Systems

| System | Trust Model | Verification | Scoring |
|--------|------------|--------------|---------|
| IBM Food Trust | Centralized authority | Single auditor | Proprietary |
| TE-FOOD | Centralized authority | Single auditor | Not disclosed |
| OriginTrail | Decentralized knowledge graph | Node consensus | Graph-based |
| VeChain ToolChain | IoT + Centralized | Device attestation | Rule-based |
| **Farmera FTES v2** | **Decentralized consensus** | **Multi-party staked** | **Bayesian + geometric mean** |

---

## Appendix A: Environment Variables

```bash
# NEW — add to .env:
AUDITOR_REGISTRY_CONTRACT_ADDRESS=0x...
VERIFICATION_DEADLINE_DAYS=7
MIN_AUDITORS_PER_VERIFICATION=2
VERIFICATION_SAMPLING_RATE=0.20          # 20% of mid-score logs
VERIFICATION_AUTO_THRESHOLD=60           # Below this → always verify
VERIFICATION_SKIP_THRESHOLD=90           # Above this → skip verification
BAYESIAN_PRIOR_ALPHA=2
BAYESIAN_PRIOR_BETA=2
BAYESIAN_N_EFF=5
DECAY_HALF_LIFE_MONTHS=6
```

## Appendix B: File Change Summary

### New Files

| File | Purpose |
|------|---------|
| `src/modules/verification/verification.module.ts` | Module definition |
| `src/modules/verification/verification.controller.ts` | API endpoints |
| `src/modules/verification/verification.service.ts` | Core orchestration |
| `src/modules/verification/auditor-selection.service.ts` | Auditor selection |
| `src/modules/verification/verification-listener.service.ts` | Event listener |
| `src/modules/verification/entities/verification-request.entity.ts` | Entity |
| `src/modules/verification/entities/verification-assignment.entity.ts` | Entity |
| `src/modules/verification/entities/auditor-profile.entity.ts` | Entity |
| `src/modules/verification/dtos/*.ts` | DTOs |
| `src/modules/verification/enums/verification-status.enum.ts` | Enum |
| `src/migrations/XXXX-AddVerificationSystem.ts` | Migration |
| Smart contract: `LogAuditorTrustPackage.sol` | New TrustPackage |
| Smart contract: `StepAuditorTrustPackage.sol` | New TrustPackage |

### Modified Files

| File | Change |
|------|--------|
| `src/common/enums/role.enum.ts` | Add AUDITOR role |
| `src/modules/blockchain/auditor/auditor.service.ts` | Fix env var, add methods |
| `src/modules/blockchain/blockchain.module.ts` | Export AuditorService |
| `src/modules/ftes/transparency/transparency.service.ts` | FTES v2 scoring algorithms |
| `src/modules/ftes/constants/weight.constant.ts` | Updated weights |
| `src/modules/crop-management/*/` | Call VerificationService after log submission |
| `src/modules/crop-management/*/` | Check verification_status before step completion |
| `src/app.module.ts` | Register VerificationModule route |
| Smart contract: `AuditorRegistry.sol` | Add assignment, deadline, expiry |
| Smart contract: `MetricSelection.sol` state | Register new TrustPackages |

### Unchanged Files

| File | Reason |
|------|--------|
| `ProcessTracking.sol` | Immutable hash storage — already correct |
| `TrustComputation.sol` | Orchestration engine — architecture preserved |
| `MetricSelection.sol` (code) | Registry pattern — architecture preserved |
| `TrustPackage.sol` (interface) | Interface unchanged |
| `PriceFeedConsumer.sol` | Chainlink integration — already correct |
| `ImageVerificationService` | Kept as AI pre-filter |

---

**References**:
- [BLOCKCHAIN_TRUSTWORTHINESS_ANALYSIS.md](./BLOCKCHAIN_TRUSTWORTHINESS_ANALYSIS.md) — Root cause analysis of current architecture
- [PROPOSED_VERIFICATION_FLOW.md](./PROPOSED_VERIFICATION_FLOW.md) — Detailed verification flow design
- [TRANSPARENCY_SCORING_REDESIGN.md](./TRANSPARENCY_SCORING_REDESIGN.md) — FTES v2 scoring framework
- [MULTI_METRICS_TRUST_PACKAGE_ANALYSIS.md](./MULTI_METRICS_TRUST_PACKAGE_ANALYSIS.md) — Paper model applicability analysis
- Leteane & Ayalew (2024) — Multi-Package Trust Model for blockchain-based food supply chains
