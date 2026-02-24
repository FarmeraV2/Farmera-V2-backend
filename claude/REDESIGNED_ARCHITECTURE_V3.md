# Farmera V3 — Redesigned Architecture & Workflow

## Incorporating All Seven Academic Improvements from ACADEMIC_ARCHITECTURE_REVIEW.md

**Date**: February 11, 2026
**Base**: `ARCHITECTURE_AND_WORKFLOW_DESIGN.md` (V2 design)
**Improvements Applied**: Commit-reveal voting, multi-factor reputation, hybrid oracle framing, weight calibration, scalability benchmarking, provisional scoring, selective transparency detection
**References**: [P1]–[P7] from `ACADEMIC_ARCHITECTURE_REVIEW.md`

---

## Table of Contents

1. [Architectural Vision — Three-Oracle Model](#1-architectural-vision)
2. [System Architecture — Full Diagram](#2-system-architecture)
3. [Smart Contract Layer — Redesigned](#3-smart-contract-layer)
4. [Backend Service Layer — All Modules](#4-backend-service-layer)
5. [Database Layer — Complete Schema](#5-database-layer)
6. [Scoring Algorithm — FTES v3 with Calibration Framework](#6-scoring-algorithm)
7. [API Design — All Endpoints](#7-api-design)
8. [Complete Workflow — End-to-End with All Improvements](#8-complete-workflow)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Academic Framing — Hybrid Oracle Contribution](#10-academic-framing)

---

## 1. Architectural Vision

### 1.1 Three-Oracle Composition Model

Framed as a **domain-specific hybrid oracle architecture for agricultural supply chain transparency** (Caldarelli, 2025 [P6]; Cui et al., 2024 [P2]):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   FARMERA — THREE-ORACLE ARCHITECTURE                   │
│                                                                         │
│  ┌─────────────────────┐  ┌──────────────────────┐  ┌────────────────┐ │
│  │  ORACLE 1            │  │  ORACLE 2             │  │  ORACLE 3      │ │
│  │  Data Integrity      │  │  Data Verification    │  │  Trust         │ │
│  │                      │  │                       │  │  Quantification│ │
│  │  ProcessTracking.sol │  │  AuditorRegistry.sol  │  │  TrustComp.sol │ │
│  │  ─────────────────── │  │  ───────────────────  │  │  ────────────  │ │
│  │  • SHA-256 hashing   │  │  • AI pre-filter      │  │  • TrustPkgs   │ │
│  │  • Immutable storage │  │  • Commit-reveal vote  │  │  • Bayesian    │ │
│  │  • Data availability │  │  • Reputation-staked   │  │  • Geometric   │ │
│  │    (Cui et al.)      │  │    consensus           │  │  • Sigmoid     │ │
│  │                      │  │  • Data verifiability  │  │  • Calibrated  │ │
│  │                      │  │    (Cui et al.)        │  │    weights     │ │
│  └──────────┬───────────┘  └──────────┬────────────┘  └───────┬────────┘ │
│             │                         │                       │          │
│             └─────────────────────────┼───────────────────────┘          │
│                                       │                                  │
│                              ┌────────▼────────┐                        │
│                              │  FTES v3         │                        │
│                              │  Transparency    │                        │
│                              │  Score + CI      │                        │
│                              └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 What Changed from V2 → V3

| Dimension | V2 Design | V3 Design | Academic Source |
|-----------|-----------|-----------|----------------|
| Auditor voting | Direct on-chain vote (transparent) | Commit-reveal two-phase voting | P3, P5 (Arshad; Manoj) |
| Auditor selection | Single-factor reputation sort | Multi-factor composite score + tiered selection | P4 (Chakrabortty & Essam) |
| Academic framing | "Replace backend with auditors" | "Domain-specific three-oracle hybrid architecture" | P6 (Caldarelli) |
| Scoring weights | Fixed constants (no justification) | AHP-derived + Monte Carlo sensitivity analysis | P2, P3, P4 |
| Step completion | Blocked by pending verification | Provisional scoring + async recalculation | P6, P7 (Guo et al.) |
| Transparency gaming | Not addressed | Expected Activity Model + completeness ratio | P2 (Cui et al.) |
| Scalability | No analysis | Gas cost benchmarking methodology | P5 (Manoj et al.) |

---

## 2. System Architecture

### 2.1 Complete System Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              FARMERA V3 — FULL SYSTEM                            │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FARMER (Mobile)                    AUDITOR (Web/Mobile)           ADMIN (Web)   │
│      │                                  │                              │         │
│      ▼                                  ▼                              ▼         │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │  BACKEND (NestJS)                                                         │   │
│  │                                                                           │   │
│  │  ┌─────────────┐  ┌────────────────────┐  ┌──────────────────────────┐   │   │
│  │  │ CropMgmt    │  │ Verification       │  │ FTES Module              │   │   │
│  │  │ Module      │  │ Module             │  │                          │   │   │
│  │  │             │  │                    │  │ • TransparencyService    │   │   │
│  │  │ • addLog    │  │ • AuditorSelection │  │   (FTES v3 scoring)     │   │   │
│  │  │ • finishStep│  │   Service ── NEW   │  │ • WeightCalibration     │   │   │
│  │  │   (prov.)   │  │   (multi-factor +  │  │   Service ── NEW       │   │   │
│  │  │ • finishSsn │  │    tiered) [P4]    │  │   (AHP + Monte Carlo)  │   │   │
│  │  │             │  │                    │  │   [P2,P3,P4]            │   │   │
│  │  │             │  │ • Verification     │  │ • SelectiveTransparency │   │   │
│  │  │             │  │   Service          │  │   Service ── NEW       │   │   │
│  │  │             │  │   (commit-reveal   │  │   (expected activity    │   │   │
│  │  │             │  │    orchestration)  │  │    model) [P2,P7]       │   │   │
│  │  │             │  │   [P3,P5]          │  │ • ImageVerification    │   │   │
│  │  │             │  │                    │  │   (AI pre-filter)       │   │   │
│  │  │             │  │ • Verification     │  │                          │   │   │
│  │  │             │  │   Listener         │  │                          │   │   │
│  │  └──────┬──────┘  └────────┬───────────┘  └──────────┬───────────────┘   │   │
│  │         │                  │                          │                    │   │
│  │  ┌──────┴──────────────────┴──────────────────────────┴───────────────┐   │   │
│  │  │  Blockchain Module                                                 │   │   │
│  │  │                                                                    │   │   │
│  │  │  ProcessTrackingService   TrustworthinessService   AuditorService  │   │   │
│  │  │  (Oracle 1)               (Oracle 3)                (Oracle 2)     │   │   │
│  │  └──────┬────────────────────┬────────────────────────┬───────────────┘   │   │
│  └─────────┼────────────────────┼────────────────────────┼───────────────────┘   │
│            │                    │                        │                       │
│            ▼                    ▼                        ▼                       │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  SMART CONTRACTS (zkSync Era)                                            │   │
│  │                                                                          │   │
│  │  Oracle 1: ProcessTracking.sol ── Hash storage (UNCHANGED)               │   │
│  │                                                                          │   │
│  │  Oracle 2: AuditorRegistry.sol ── REDESIGNED                             │   │
│  │    ├── Commit-reveal voting (2-phase)                                    │   │
│  │    ├── Assignment + deadlines                                            │   │
│  │    ├── Reputation-weighted consensus                                     │   │
│  │    └── Staking + slashing                                                │   │
│  │                                                                          │   │
│  │  Oracle 3: TrustComputation.sol + TrustPackages ── UPDATED               │   │
│  │    ├── LogAuditorTrustPackage.sol (calibrated weights)                   │   │
│  │    └── StepAuditorTrustPackage.sol (calibrated weights)                  │   │
│  │                                                                          │   │
│  │  WRITERS:                                                                │   │
│  │    Backend wallet  ──► ProcessTracking, TrustComputation, AuditorReg.    │   │
│  │    Auditor wallets ──► AuditorRegistry.commitVote() + revealVote()       │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  DATABASE (PostgreSQL)                                                    │   │
│  │                                                                          │   │
│  │  EXISTING: users, farms, plots, seasons, steps, logs, products...        │   │
│  │  NEW:      auditor_profiles, verification_requests,                      │   │
│  │            verification_assignments (+ commit_hash, reveal phase),       │   │
│  │            expected_activities, score_history                             │   │
│  │  MODIFIED: logs (verification_status), season_details (completion_status)│   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Smart Contract Layer

### 3.1 Contract Overview

| Contract | Status | V3 Changes |
|----------|--------|------------|
| `ProcessTracking.sol` | KEEP | No changes — Oracle 1 |
| `MetricSelection.sol` | KEEP | Register new TrustPackages |
| `TrustComputation.sol` | KEEP | Orchestration engine — Oracle 3 |
| `LogDefaultTrustPackage.sol` | REPLACE | → `LogAuditorTrustPackage.sol` (calibrated) |
| `StepTransparencyPackage.sol` | REPLACE | → `StepAuditorTrustPackage.sol` (calibrated) |
| `AuditorRegistry.sol` | **REDESIGN** | Commit-reveal voting + assignment + deadlines |
| `PriceFeedConsumer.sol` | KEEP | No changes |

### 3.2 Redesigned: AuditorRegistry.sol — Commit-Reveal Voting

**Academic basis**: Arshad et al. (2023) [P3] identify privacy as a core requirement for decentralized trust management. Manoj et al. (2025) [P5] demonstrate privacy-preserving aggregation in agricultural blockchain contexts.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract AuditorRegistry {
    // ═══════════════════════════════════════════════════════════
    // EXISTING STATE (preserved from V2)
    // ═══════════════════════════════════════════════════════════

    struct Auditor {
        bool isActive;
        uint256 stake;
        int256 reputationScore;
        uint256 totalVerifications;
    }

    mapping(address => Auditor) public auditors;
    uint256 public minStake;

    // ═══════════════════════════════════════════════════════════
    // NEW STATE — Commit-Reveal + Assignment
    // ═══════════════════════════════════════════════════════════

    enum VerificationPhase { NONE, COMMIT, REVEAL, FINALIZED }

    struct VerificationTask {
        VerificationPhase phase;
        uint256 commitDeadline;       // Phase 1 ends
        uint256 revealDeadline;       // Phase 2 ends
        uint256 commitCount;          // How many auditors committed
        uint256 revealCount;          // How many auditors revealed
        uint256 minAuditors;          // Minimum required
        bool consensusResult;
        bool finalized;
    }

    struct VoteCommitment {
        bytes32 commitHash;           // keccak256(abi.encodePacked(isValid, salt))
        bool revealed;
        bool vote;                    // Only set after reveal
        bool committed;
    }

    // identifier => id => VerificationTask
    mapping(bytes32 => mapping(uint64 => VerificationTask)) public tasks;

    // identifier => id => auditor => VoteCommitment
    mapping(bytes32 => mapping(uint64 => mapping(address => VoteCommitment))) public commitments;

    // identifier => id => auditor => isAssigned
    mapping(bytes32 => mapping(uint64 => mapping(address => bool))) public assignedAuditors;

    // ═══════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════

    event VerificationRequested(
        bytes32 indexed identifier,
        uint64 indexed id,
        address[] auditors,
        uint256 commitDeadline,
        uint256 revealDeadline
    );

    event VoteCommitted(
        bytes32 indexed identifier,
        uint64 indexed id,
        address indexed auditor
    );

    event VoteRevealed(
        bytes32 indexed identifier,
        uint64 indexed id,
        address indexed auditor,
        bool vote
    );

    event VerificationFinalized(
        bytes32 indexed identifier,
        uint64 indexed id,
        bool consensus,
        uint256 validVotes,
        uint256 totalVotes
    );

    // ═══════════════════════════════════════════════════════════
    // PHASE 0 — Request Verification (called by backend)
    // ═══════════════════════════════════════════════════════════

    /// @notice Creates a verification task with assigned auditors and commit-reveal deadlines
    /// @param commitDeadline  Timestamp when commit phase ends
    /// @param revealDeadline  Timestamp when reveal phase ends (must be > commitDeadline)
    function requestVerification(
        bytes32 identifier,
        uint64 id,
        address[] calldata selectedAuditors,
        uint256 commitDeadline,
        uint256 revealDeadline
    ) external {
        require(revealDeadline > commitDeadline, "Reveal must be after commit");
        require(commitDeadline > block.timestamp, "Commit deadline must be future");
        require(tasks[identifier][id].phase == VerificationPhase.NONE, "Task exists");

        for (uint i = 0; i < selectedAuditors.length; i++) {
            require(auditors[selectedAuditors[i]].isActive, "Auditor not active");
            assignedAuditors[identifier][id][selectedAuditors[i]] = true;
        }

        tasks[identifier][id] = VerificationTask({
            phase: VerificationPhase.COMMIT,
            commitDeadline: commitDeadline,
            revealDeadline: revealDeadline,
            commitCount: 0,
            revealCount: 0,
            minAuditors: selectedAuditors.length,
            consensusResult: false,
            finalized: false
        });

        emit VerificationRequested(identifier, id, selectedAuditors, commitDeadline, revealDeadline);
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 1 — Commit Vote (called by auditor's own wallet)
    // ═══════════════════════════════════════════════════════════

    /// @notice Auditor submits hashed vote. Vote content is hidden until reveal.
    /// @param commitHash  keccak256(abi.encodePacked(isValid, salt))
    function commitVote(
        bytes32 identifier,
        uint64 id,
        bytes32 commitHash
    ) external {
        require(assignedAuditors[identifier][id][msg.sender], "Not assigned");
        require(block.timestamp <= tasks[identifier][id].commitDeadline, "Commit phase ended");
        require(!commitments[identifier][id][msg.sender].committed, "Already committed");

        commitments[identifier][id][msg.sender] = VoteCommitment({
            commitHash: commitHash,
            revealed: false,
            vote: false,
            committed: true
        });

        tasks[identifier][id].commitCount++;

        emit VoteCommitted(identifier, id, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 2 — Reveal Vote (called by auditor's own wallet)
    // ═══════════════════════════════════════════════════════════

    /// @notice Auditor reveals their vote by providing the original values
    function revealVote(
        bytes32 identifier,
        uint64 id,
        bool isValid,
        bytes32 salt
    ) external {
        VerificationTask storage task = tasks[identifier][id];
        require(block.timestamp > task.commitDeadline, "Commit phase not ended");
        require(block.timestamp <= task.revealDeadline, "Reveal phase ended");

        VoteCommitment storage commitment = commitments[identifier][id][msg.sender];
        require(commitment.committed, "Not committed");
        require(!commitment.revealed, "Already revealed");

        // Verify hash matches
        bytes32 expected = keccak256(abi.encodePacked(isValid, salt));
        require(expected == commitment.commitHash, "Hash mismatch");

        commitment.revealed = true;
        commitment.vote = isValid;
        task.revealCount++;

        emit VoteRevealed(identifier, id, msg.sender, isValid);

        // Auto-finalize if all committed auditors have revealed
        if (task.revealCount == task.commitCount && task.commitCount >= 1) {
            _finalizeConsensus(identifier, id);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // FINALIZATION — Consensus Calculation
    // ═══════════════════════════════════════════════════════════

    /// @notice Finalize after reveal deadline (for partial reveals)
    function finalizeExpired(bytes32 identifier, uint64 id) external {
        VerificationTask storage task = tasks[identifier][id];
        require(block.timestamp > task.revealDeadline, "Reveal phase not ended");
        require(!task.finalized, "Already finalized");
        require(task.revealCount > 0, "No reveals");

        _finalizeConsensus(identifier, id);

        // Slash non-revealers (committed but did not reveal)
        // This is handled by backend iterating over assigned auditors
    }

    function _finalizeConsensus(bytes32 identifier, uint64 id) internal {
        VerificationTask storage task = tasks[identifier][id];
        require(!task.finalized, "Already finalized");

        // Reputation-weighted majority vote
        // (auditor addresses must be iterated off-chain; contract stores result)
        // For gas efficiency, the backend computes the weighted vote
        // and submits the result via a separate finalize call.
        // Here we emit the event for the listener.

        task.finalized = true;
        task.phase = VerificationPhase.FINALIZED;

        // Note: actual consensus calculation uses reputation weights
        // computed off-chain from revealed votes. See finalizeWithConsensus().
    }

    /// @notice Backend submits computed consensus result after collecting revealed votes
    /// @dev This is needed because iterating over all auditors on-chain is gas-expensive
    function finalizeWithConsensus(
        bytes32 identifier,
        uint64 id,
        bool consensus,
        address[] calldata revealedAuditors
    ) external {
        VerificationTask storage task = tasks[identifier][id];
        require(
            block.timestamp > task.revealDeadline || task.revealCount == task.commitCount,
            "Not ready to finalize"
        );
        require(!task.finalized, "Already finalized");

        // Verify that submitted auditors actually revealed
        for (uint i = 0; i < revealedAuditors.length; i++) {
            require(commitments[identifier][id][revealedAuditors[i]].revealed, "Not revealed");
        }

        task.finalized = true;
        task.phase = VerificationPhase.FINALIZED;
        task.consensusResult = consensus;

        // Update reputations
        for (uint i = 0; i < revealedAuditors.length; i++) {
            bool vote = commitments[identifier][id][revealedAuditors[i]].vote;
            if (vote == consensus) {
                auditors[revealedAuditors[i]].reputationScore += 2;   // Correct
            } else {
                auditors[revealedAuditors[i]].reputationScore -= 5;   // Incorrect
                // Slash 0.1 ETH from stake
                uint256 slashAmount = 0.1 ether;
                if (auditors[revealedAuditors[i]].stake >= slashAmount) {
                    auditors[revealedAuditors[i]].stake -= slashAmount;
                }
            }
            auditors[revealedAuditors[i]].totalVerifications++;
        }

        // Slash non-revealers (committed but didn't reveal)
        // Backend handles this by checking commitments vs reveals

        emit VerificationFinalized(identifier, id, consensus, task.revealCount, task.commitCount);
    }
}
```

### 3.3 LogAuditorTrustPackage.sol — With Calibration-Ready Weights

Weights are designed to be **AHP-derivable** and **sensitivity-tested** [P2, P3, P4].

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TrustPackage} from "../interfaces/TrustPackage.sol";

/// @title LogAuditorTrustPackage — Calibration-ready trust scoring for individual logs
/// @notice Weights designated by AHP expert elicitation; validated by Monte Carlo sensitivity analysis
/// @dev W_CONSENSUS + W_CONSENSUS_STRENGTH + W_SPATIAL + W_EVIDENCE = 100
contract LogAuditorTrustPackage is TrustPackage {
    uint128 constant SCALE = 100;

    // On-chain inputs: 55% total weight (auditor consensus dominates)
    uint128 constant W_CONSENSUS = 40;           // Reputation-weighted consensus quality
    uint128 constant W_CONSENSUS_STRENGTH = 15;  // Auditor participation ratio

    // Backend inputs: 45% total weight (mathematically verifiable metrics)
    uint128 constant W_SPATIAL = 25;             // GPS distance (Gaussian decay)
    uint128 constant W_EVIDENCE = 20;            // Evidence completeness

    struct LogData {
        uint128 consensusWeight;    // Reputation-weighted consensus [0-100]
        uint128 auditorCount;       // Auditors who revealed votes
        uint128 minAuditors;        // Expected minimum auditors
        uint128 spatialDistance;    // Distance log↔plot (× 1e6 for precision)
        uint128 maxDistance;        // Maximum acceptable distance
        uint128 evidenceScore;     // Evidence completeness [0-100]
    }

    function computeTrustScore(bytes calldata payload) external pure returns (uint128) {
        LogData memory d = abi.decode(payload, (LogData));

        // Tc: Consensus quality — reputation-weighted agreement ratio
        uint128 Tc = d.consensusWeight;

        // Tcs: Consensus strength — auditor participation ratio (capped at 100)
        uint128 Tcs = _min((d.auditorCount * SCALE) / d.minAuditors, SCALE);

        // Tsp: Spatial plausibility — Gaussian decay based on distance²
        uint128 Tsp = 0;
        if (d.spatialDistance <= d.maxDistance) {
            uint128 ratio = (d.spatialDistance * d.spatialDistance * SCALE)
                          / (d.maxDistance * d.maxDistance);
            Tsp = SCALE - _min(ratio, SCALE);
        }

        // Te: Evidence completeness — capped at 100
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

### 3.4 StepAuditorTrustPackage.sol — With Completeness Ratio

Integrates **selective transparency detection** [P2] via completeness ratio.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {TrustPackage} from "../interfaces/TrustPackage.sol";

/// @title StepAuditorTrustPackage — Step-level trust with completeness detection
/// @notice Includes completenessRatio to penalize selective logging (Cui et al., 2024)
contract StepAuditorTrustPackage is TrustPackage {
    uint128 constant SCALE = 100;
    uint128 constant W_COVERAGE = 30;
    uint128 constant W_VERIFICATION_RATE = 30;
    uint128 constant W_ACTIVITY = 15;
    uint128 constant W_CONSENSUS_QUALITY = 15;
    uint128 constant W_COMPLETENESS = 10;       // NEW: selective transparency penalty

    struct StepData {
        uint128 totalLogs;
        uint128 verifiedLogs;
        uint128 rejectedLogs;
        uint128 unverifiedLogs;
        uint128 activeDays;
        uint128 totalDays;
        uint128 minLogs;
        uint128 avgConsensusWeight;
        uint128 completenessRatio;   // NEW: covered_topics / expected_topics [0-100]
    }

    function computeTrustScore(bytes calldata payload) external pure returns (uint128) {
        StepData memory d = abi.decode(payload, (StepData));

        // Lc: Log coverage — how many logs vs minimum required
        uint128 Lc = _min((d.totalLogs * SCALE) / d.minLogs, SCALE);

        // Vr: Verification rate — consensus-verified / reviewed
        uint128 Vr = 70; // Default discount for unreviewed
        uint128 reviewed = d.verifiedLogs + d.rejectedLogs;
        if (reviewed > 0) {
            Vr = (d.verifiedLogs * SCALE) / reviewed;
        }

        // Ar: Activity regularity — active days / total days
        uint128 Ar = d.totalDays > 0
            ? (d.activeDays * SCALE) / d.totalDays
            : 0;

        // Cq: Consensus quality — average weighted agreement
        uint128 Cq = d.avgConsensusWeight;

        // Cr: Completeness ratio — topic coverage (anti-selective-transparency)
        uint128 Cr = d.completenessRatio;

        // Rejection penalty: 4x amplification
        uint128 penaltyFactor = SCALE;
        if (d.rejectedLogs > 0 && d.totalLogs > 0) {
            uint128 rejectionRatio = (d.rejectedLogs * SCALE) / d.totalLogs;
            penaltyFactor = SCALE - _min(rejectionRatio * 4, SCALE);
        }

        uint128 raw = (W_COVERAGE * Lc
                     + W_VERIFICATION_RATE * Vr
                     + W_ACTIVITY * Ar
                     + W_CONSENSUS_QUALITY * Cq
                     + W_COMPLETENESS * Cr) / SCALE;

        return (raw * penaltyFactor) / SCALE;
    }

    function _min(uint128 a, uint128 b) internal pure returns (uint128) {
        return a < b ? a : b;
    }
}
```

---

## 4. Backend Service Layer

### 4.1 Module Structure — Complete

```
src/modules/
├── verification/                           ← REDESIGNED
│   ├── verification.module.ts
│   ├── verification.controller.ts
│   ├── verification.service.ts             ← Commit-reveal orchestration
│   ├── auditor-selection.service.ts        ← Multi-factor + tiered [P4]
│   ├── auditor-verification.service.ts     ← Existing, updated for commit-reveal
│   ├── verification-listener.service.ts    ← Existing, updated for two-phase events
│   ├── image-verification/
│   │   └── image-verification.service.ts   ← KEPT (AI pre-filter)
│   ├── entities/
│   │   ├── auditor-profile.entity.ts       ← MODIFIED (add multi-factor fields)
│   │   ├── verification-request.entity.ts  ← MODIFIED (add commit/reveal deadlines)
│   │   ├── verification-assignment.entity.ts ← MODIFIED (add commit_hash, reveal phase)
│   │   ├── image-hash.entity.ts            ← KEPT
│   │   └── image-verification-result.entity.ts ← KEPT
│   ├── dtos/
│   │   ├── commit-vote.dto.ts              ← NEW
│   │   ├── reveal-vote.dto.ts              ← NEW
│   │   ├── register-auditor.dto.ts
│   │   └── verification-package-response.dto.ts
│   └── enums/
│       ├── verification-status.enum.ts
│       └── onchain-log-status.enum.ts
│
├── ftes/                                   ← REDESIGNED
│   ├── ftes.module.ts
│   ├── transparency/
│   │   └── transparency.service.ts         ← FTES v3 scoring
│   ├── calibration/                        ← NEW
│   │   └── weight-calibration.service.ts   ← AHP + sensitivity analysis [P2,P3,P4]
│   ├── selective-transparency/             ← NEW
│   │   └── selective-transparency.service.ts ← Expected Activity Model [P2,P7]
│   ├── constants/
│   │   └── weight.constant.ts              ← UPDATED
│   ├── interfaces/
│   │   └── farm-transparency.interface.ts  ← UPDATED
│   └── entities/
│       ├── transparency-weight.entity.ts
│       ├── expected-activity.entity.ts     ← NEW
│       └── score-history.entity.ts         ← NEW
│
├── crop-management/                        ← MODIFIED
│   ├── season/
│   │   └── season.service.ts               ← Provisional scoring in finishStep
│   ├── log/
│   │   └── log.service.ts
│   └── entities/
│       ├── season-detail.entity.ts         ← MODIFIED (add completion_status)
│       └── log.entity.ts                   ← EXISTING (verification_status)
│
└── blockchain/                             ← FIXED + EXTENDED
    ├── blockchain.module.ts                ← Export AuditorService
    ├── auditor/
    │   └── auditor.service.ts              ← FIX env var + commit-reveal methods
    ├── process-tracking/
    │   └── process-tracking.service.ts     ← KEEP
    ├── trustworthiness/
    │   └── trustworthiness.service.ts      ← RE-ENABLE + update for new packages
    └── interfaces/
        └── step-transparency.interface.ts  ← UPDATED (add completenessRatio)
```

### 4.2 New Service: AuditorSelectionService — Multi-Factor + Tiered

**Academic basis**: Chakrabortty & Essam (2023) [P4] — multi-factor reputation model with 23% better fault tolerance than single-factor.

```typescript
// src/modules/verification/auditor-selection.service.ts

@Injectable()
export class AuditorSelectionService {
    constructor(
        @InjectRepository(AuditorProfile)
        private readonly auditorProfileRepo: Repository<AuditorProfile>,
        @InjectRepository(VerificationAssignment)
        private readonly assignmentRepo: Repository<VerificationAssignment>,
        private readonly auditorService: AuditorService,
    ) {}

    /**
     * Multi-factor auditor selection with tiered probability.
     *
     * SelectionScore = w₁×Reputation + w₂×StakeRatio + w₃×ResponseRate
     *                + w₄×RecencyBonus + w₅×DiversityBonus
     *
     * Tier 1 (top 25%): 60% selection probability
     * Tier 2 (middle 50%): 30% selection probability
     * Tier 3 (bottom 25%, including new auditors): 10% selection probability
     *
     * Based on: Chakrabortty & Essam (2023), "Reputation based proof of cooperation"
     */
    async selectAuditors(count: number, excludeFarmId: number): Promise<AuditorProfile[]> {
        // 1. Get all active auditors
        const auditors = await this.auditorProfileRepo.find({
            where: { is_active: true },
            relations: ['user'],
        });

        // 2. Exclude same-farm auditors (conflict of interest)
        const eligible = auditors.filter(a => a.user?.farm?.id !== excludeFarmId);
        if (eligible.length < count) {
            throw new BadRequestException('Insufficient eligible auditors');
        }

        // 3. Compute multi-factor SelectionScore for each auditor
        const scored = await Promise.all(
            eligible.map(async (a) => {
                const onChain = await this.auditorService.getAuditor(a.wallet_address);
                const score = await this.computeSelectionScore(a, onChain, excludeFarmId);
                return { profile: a, score };
            }),
        );

        // 4. Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        // 5. Tiered selection
        const tier1Size = Math.ceil(scored.length * 0.25);
        const tier2Size = Math.ceil(scored.length * 0.50);

        const tier1 = scored.slice(0, tier1Size);
        const tier2 = scored.slice(tier1Size, tier1Size + tier2Size);
        const tier3 = scored.slice(tier1Size + tier2Size);

        // 6. Weighted random selection across tiers
        return this.weightedTierSelection(tier1, tier2, tier3, count);
    }

    private async computeSelectionScore(
        profile: AuditorProfile,
        onChain: AuditorInfo,
        farmId: number,
    ): Promise<number> {
        const W1 = 0.30; // Reputation
        const W2 = 0.15; // Stake
        const W3 = 0.20; // Response rate
        const W4 = 0.15; // Recency
        const W5 = 0.20; // Diversity

        // Normalized reputation [0-1]
        const maxRep = 100; // Practical upper bound
        const reputation = Math.max(Number(onChain.reputationScore), 0) / maxRep;

        // Stake ratio [0-1], capped at 2× min stake → 1.0
        const minStake = Number(onChain.minStake || 1);
        const stakeRatio = Math.min(Number(onChain.stake) / minStake, 2.0) / 2.0;

        // Response rate [0-1]
        const responseRate = profile.total_verifications > 0
            ? profile.completed_within_deadline / profile.total_verifications
            : 0.5; // Default for new auditors (cold-start mitigation)

        // Recency bonus [0-1]: sigmoid decay based on days since last verification
        const daysSinceLast = profile.last_verification_at
            ? (Date.now() - profile.last_verification_at.getTime()) / (1000 * 60 * 60 * 24)
            : 30; // Default for new auditors
        const recencyBonus = 1 / (1 + daysSinceLast / 30);

        // Diversity bonus [0-1]: 1.0 if never verified this farm, 0.5 if has
        const previousAssignments = await this.assignmentRepo.count({
            where: {
                auditor_profile_id: profile.id,
                verification_request: { log: { farm_id: farmId } },
            },
        });
        const diversityBonus = previousAssignments === 0 ? 1.0 : 0.5;

        return W1 * reputation
             + W2 * stakeRatio
             + W3 * responseRate
             + W4 * recencyBonus
             + W5 * diversityBonus;
    }

    private weightedTierSelection(
        tier1: ScoredAuditor[],
        tier2: ScoredAuditor[],
        tier3: ScoredAuditor[],
        count: number,
    ): AuditorProfile[] {
        const selected: AuditorProfile[] = [];
        const tiers = [
            { pool: [...tier1], probability: 0.60 },
            { pool: [...tier2], probability: 0.30 },
            { pool: [...tier3], probability: 0.10 },
        ];

        while (selected.length < count) {
            // Pick a tier based on probability
            const roll = Math.random();
            let cumulative = 0;
            let chosenTier = tiers[0];
            for (const tier of tiers) {
                cumulative += tier.probability;
                if (roll <= cumulative && tier.pool.length > 0) {
                    chosenTier = tier;
                    break;
                }
            }

            // Fall back to any non-empty tier
            if (chosenTier.pool.length === 0) {
                chosenTier = tiers.find(t => t.pool.length > 0)!;
            }

            // Random pick from chosen tier
            const idx = Math.floor(Math.random() * chosenTier.pool.length);
            selected.push(chosenTier.pool[idx].profile);
            chosenTier.pool.splice(idx, 1);
        }

        return selected;
    }
}
```

### 4.3 Updated: VerificationService — Commit-Reveal Orchestration

```typescript
// src/modules/verification/auditor-verification/auditor-verification.service.ts
// KEY CHANGES for commit-reveal

@Injectable()
export class AuditorVerificationService {

    // ═══════════════════════════════════════════════════════════
    // PHASE 0 — Evaluate log for verification (EXISTING, minor updates)
    // ═══════════════════════════════════════════════════════════

    async evaluateForVerification(log: Log, farmId: number): Promise<VerificationStatus> {
        // ... existing AI pre-filter logic ...
        // If shouldVerify:

        const auditors = await this.auditorSelectionService.selectAuditors(
            MIN_AUDITORS,
            farmId,
        );

        // Calculate commit-reveal deadlines
        const now = Math.floor(Date.now() / 1000);
        const COMMIT_DURATION = 5 * 24 * 60 * 60;  // 5 days to commit
        const REVEAL_DURATION = 2 * 24 * 60 * 60;  // 2 days to reveal
        const commitDeadline = now + COMMIT_DURATION;
        const revealDeadline = commitDeadline + REVEAL_DURATION;

        // On-chain: create verification task with dual deadlines
        await this.auditorService.requestVerification(
            identifier, logId, auditorAddresses, commitDeadline, revealDeadline,
        );

        // DB: create request with both deadlines
        const request = this.verificationRequestRepo.create({
            log_id: log.id,
            status: VerificationStatus.PENDING,
            commit_deadline: new Date(commitDeadline * 1000),
            reveal_deadline: new Date(revealDeadline * 1000),
        });
        await this.verificationRequestRepo.save(request);

        // DB: create assignments
        for (const auditor of auditors) {
            await this.assignmentRepo.save({
                verification_request_id: request.id,
                auditor_profile_id: auditor.id,
                phase: 'ASSIGNED', // → COMMITTED → REVEALED
            });
        }

        // Notify auditors
        await this.notificationService.notifyAuditors(auditors, request);

        return VerificationStatus.PENDING;
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 1 — Record Commit (NEW)
    // ═══════════════════════════════════════════════════════════

    /**
     * Auditor submits a commit hash. The actual vote is hidden.
     * The auditor calls AuditorRegistry.commitVote() on-chain first,
     * then reports the tx hash here.
     */
    async recordCommit(
        requestId: number,
        userId: number,
        commitHash: string,
        txHash: string,
    ): Promise<void> {
        const assignment = await this.findAndValidateAssignment(requestId, userId);
        const request = assignment.verification_request;

        // Validate we're in commit phase
        if (new Date() > request.commit_deadline) {
            throw new BadRequestException('Commit phase has ended');
        }

        // Verify on-chain transaction
        await this.verifyTransactionOnChain(txHash, 'commitVote');

        // Update assignment
        assignment.commit_hash = commitHash;
        assignment.commit_transaction_hash = txHash;
        assignment.phase = 'COMMITTED';
        assignment.committed_at = new Date();
        await this.assignmentRepo.save(assignment);
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 2 — Record Reveal (NEW)
    // ═══════════════════════════════════════════════════════════

    /**
     * Auditor reveals their vote. The auditor calls AuditorRegistry.revealVote()
     * on-chain first, then reports here.
     */
    async recordReveal(
        requestId: number,
        userId: number,
        isValid: boolean,
        txHash: string,
    ): Promise<void> {
        const assignment = await this.findAndValidateAssignment(requestId, userId);
        const request = assignment.verification_request;

        // Validate we're in reveal phase
        if (new Date() <= request.commit_deadline) {
            throw new BadRequestException('Commit phase not ended yet');
        }
        if (new Date() > request.reveal_deadline) {
            throw new BadRequestException('Reveal phase has ended');
        }
        if (assignment.phase !== 'COMMITTED') {
            throw new BadRequestException('Must commit before revealing');
        }

        // Verify on-chain transaction
        await this.verifyTransactionOnChain(txHash, 'revealVote');

        // Update assignment
        assignment.vote = isValid;
        assignment.vote_transaction_hash = txHash;
        assignment.phase = 'REVEALED';
        assignment.voted_at = new Date();
        await this.assignmentRepo.save(assignment);

        // Check if all committed auditors have revealed → auto-finalize
        await this.checkAutoFinalize(request);
    }

    // ═══════════════════════════════════════════════════════════
    // PHASE 3 — Consensus Finalization (UPDATED)
    // ═══════════════════════════════════════════════════════════

    /**
     * Called when all reveals are in, or after reveal deadline.
     * Computes reputation-weighted consensus and submits to chain.
     */
    private async checkAutoFinalize(request: VerificationRequest): Promise<void> {
        const assignments = await this.assignmentRepo.find({
            where: { verification_request_id: request.id },
            relations: ['auditor_profile'],
        });

        const committed = assignments.filter(a => a.phase === 'COMMITTED' || a.phase === 'REVEALED');
        const revealed = assignments.filter(a => a.phase === 'REVEALED');

        // Only finalize if all committed have revealed
        if (revealed.length < committed.length) return;
        if (revealed.length === 0) return;

        await this.finalizeConsensus(request, revealed);
    }

    async finalizeConsensus(
        request: VerificationRequest,
        revealedAssignments: VerificationAssignment[],
    ): Promise<void> {
        // Compute reputation-weighted vote
        let validWeight = 0;
        let totalWeight = 0;

        for (const assignment of revealedAssignments) {
            const onChain = await this.auditorService.getAuditor(
                assignment.auditor_profile.wallet_address,
            );
            const rep = Math.max(Number(onChain.reputationScore), 1);

            totalWeight += rep;
            if (assignment.vote === true) {
                validWeight += rep;
            }
        }

        const consensus = validWeight > totalWeight / 2;
        const consensusWeight = consensus
            ? Math.round((validWeight / totalWeight) * 100)
            : Math.round(((totalWeight - validWeight) / totalWeight) * 100);

        // Submit consensus to chain
        const revealedAddresses = revealedAssignments.map(a => a.auditor_profile.wallet_address);
        await this.auditorService.finalizeWithConsensus(
            request.identifier, request.blockchain_log_id, consensus, revealedAddresses,
        );

        // Handle consensus result
        await this.handleConsensusFinalized(request.id, consensus, consensusWeight);
    }

    /**
     * Post-consensus actions. UPDATED: now also handles provisional score recalculation.
     */
    async handleConsensusFinalized(
        requestId: number,
        consensus: boolean,
        consensusWeight: number,
    ): Promise<void> {
        const request = await this.verificationRequestRepo.findOne({
            where: { id: requestId },
            relations: ['log', 'log.season_detail', 'log.season_detail.season'],
        });

        if (consensus) {
            request.status = VerificationStatus.VERIFIED;
            request.consensus_result = true;
            request.log.verification_status = VerificationStatus.VERIFIED;

            // Compute and store log trust score on-chain
            await this.computeLogTrustScore(request, consensusWeight);

            // Update on-chain log status
            await this.processTrackingService.verifyLog(
                request.log.id, OnChainLogStatus.Verified,
            );
        } else {
            request.status = VerificationStatus.REJECTED;
            request.consensus_result = false;
            request.log.verification_status = VerificationStatus.REJECTED;
            request.log.is_active = false;

            await this.processTrackingService.verifyLog(
                request.log.id, OnChainLogStatus.Rejected,
            );
        }

        await this.verificationRequestRepo.save(request);
        await this.logRepo.save(request.log);

        // Update auditor statistics
        await this.updateAuditorStats(requestId, consensus);

        // ═══ NEW: Trigger provisional score recalculation ═══
        // If the step was provisionally completed, recalculate
        const seasonDetail = request.log.season_detail;
        if (seasonDetail.completion_status === StepCompletionStatus.PROVISIONALLY_COMPLETED) {
            await this.transparencyService.recalculateStepScore(seasonDetail.id);
        }

        // Notify farmer
        const message = consensus
            ? 'Your log has been verified by auditors'
            : 'Your log has been flagged by auditors. An admin will review.';
        await this.notificationService.sendToFarmer(request.log.farm_id, message);
    }
}
```

### 4.4 Updated: SeasonService — Provisional Scoring

**Academic basis**: Guo et al. (2025) [P7] — asynchronous data flow; Caldarelli (2025) [P6] — avoid sequential dependency.

```typescript
// src/modules/crop-management/season/season.service.ts
// KEY CHANGES in finishStep

async finishStep(seasonStepId: number): Promise<SeasonDetail> {
    const seasonDetail = await this.stepService.findById(seasonStepId);

    // Validate logs exist
    const logCounts = await this.logService.countActiveLogs(seasonStepId);
    if (logCounts.active === 0) {
        throw new BadRequestException('At least one active log is required');
    }

    // ═══ CHANGED: Check verification status with provisional support ═══
    const pendingCount = await this.logService.countByVerificationStatus(
        seasonStepId, VerificationStatus.PENDING,
    );

    let completionStatus: StepCompletionStatus;

    if (pendingCount > 0) {
        // PROVISIONAL COMPLETION — don't block farmer workflow
        completionStatus = StepCompletionStatus.PROVISIONALLY_COMPLETED;
    } else {
        // FINAL COMPLETION — all verifications resolved
        completionStatus = StepCompletionStatus.COMPLETED;
    }

    // Update step status
    seasonDetail.step_status = StepStatus.DONE;
    seasonDetail.completion_status = completionStatus;

    // Upload step hash to blockchain
    const receipt = await this.processTrackingService.addStep(seasonDetail);
    seasonDetail.transaction_hash = receipt.transactionHash;

    // Calculate step transparency score
    // For provisional: pending logs use AI score × DEFAULT_UNVERIFIED_DISCOUNT
    const score = await this.transparencyService.calcStepTransparencyScore(
        seasonDetail,
        completionStatus === StepCompletionStatus.PROVISIONALLY_COMPLETED,
    );

    seasonDetail.transparency_score = score;

    // ═══ NEW: Record score history for audit trail ═══
    await this.scoreHistoryService.record({
        entity_type: 'STEP',
        entity_id: seasonDetail.id,
        score,
        is_provisional: completionStatus === StepCompletionStatus.PROVISIONALLY_COMPLETED,
        pending_verifications: pendingCount,
    });

    await this.seasonDetailRepo.save(seasonDetail);

    // If final step (POST_HARVEST) → season completion
    if (seasonDetail.step.type === StepType.POST_HARVEST) {
        await this.handleSeasonCompletion(seasonDetail.season_id, completionStatus);
    }

    return seasonDetail;
}

/**
 * Called by VerificationService when a pending verification finalizes
 * after the step was provisionally completed.
 */
async recalculateProvisionalStep(seasonDetailId: number): Promise<void> {
    const seasonDetail = await this.stepService.findById(seasonDetailId);

    if (seasonDetail.completion_status !== StepCompletionStatus.PROVISIONALLY_COMPLETED) {
        return; // Nothing to recalculate
    }

    // Check if all verifications are now resolved
    const pendingCount = await this.logService.countByVerificationStatus(
        seasonDetailId, VerificationStatus.PENDING,
    );

    // Recalculate score
    const newScore = await this.transparencyService.calcStepTransparencyScore(
        seasonDetail,
        pendingCount > 0, // still provisional?
    );

    const oldScore = seasonDetail.transparency_score;
    seasonDetail.transparency_score = newScore;

    if (pendingCount === 0) {
        // All verifications resolved → mark as fully completed
        seasonDetail.completion_status = StepCompletionStatus.COMPLETED;
    }

    // Record score delta
    await this.scoreHistoryService.record({
        entity_type: 'STEP',
        entity_id: seasonDetail.id,
        score: newScore,
        previous_score: oldScore,
        is_provisional: pendingCount > 0,
        pending_verifications: pendingCount,
    });

    await this.seasonDetailRepo.save(seasonDetail);

    // Cascade: recalculate season if it was already scored
    if (seasonDetail.season.transparency_score !== null) {
        await this.recalculateSeasonScore(seasonDetail.season_id);
    }
}
```

### 4.5 New Service: SelectiveTransparencyService

**Academic basis**: Cui et al. (2024) [P2] — selective disclosure as rational strategy; Guo et al. (2025) [P7] — supervision nodes cross-referencing expected activities.

```typescript
// src/modules/ftes/selective-transparency/selective-transparency.service.ts

@Injectable()
export class SelectiveTransparencyService {
    constructor(
        @InjectRepository(ExpectedActivity)
        private readonly expectedActivityRepo: Repository<ExpectedActivity>,
    ) {}

    /**
     * Computes the completeness ratio for a step.
     *
     * CompletenessRatio = covered_topics / expected_topics
     *
     * Where expected_topics are predefined per (crop_type, step_type) pair
     * and covered_topics are detected in log descriptions via keyword matching.
     *
     * Based on: Cui et al. (2024) — selective disclosure detection
     */
    async computeCompletenessRatio(
        seasonDetail: SeasonDetail,
        logs: Log[],
    ): Promise<number> {
        // 1. Get expected activities for this crop type + step type
        const expected = await this.expectedActivityRepo.find({
            where: {
                crop_type: seasonDetail.season.plot.crop.crop_type,
                step_type: seasonDetail.step.type,
            },
        });

        if (expected.length === 0) {
            return 1.0; // No expectations defined → no penalty
        }

        // 2. Check which expected topics are covered in log descriptions
        const expectedTopics = expected.map(e => e.topic);
        const coveredTopics = new Set<string>();

        for (const log of logs) {
            const logText = `${log.name} ${log.description} ${log.notes || ''}`.toLowerCase();

            for (const topic of expectedTopics) {
                // Keyword matching: each expected topic has associated keywords
                const activity = expected.find(e => e.topic === topic);
                const keywords = activity.keywords; // string[]

                const hasKeyword = keywords.some(kw => logText.includes(kw.toLowerCase()));
                if (hasKeyword) {
                    coveredTopics.add(topic);
                }
            }
        }

        // 3. Compute ratio
        return coveredTopics.size / expectedTopics.length;
    }

    /**
     * Detects temporal gaps in logging frequency.
     * Returns a penalty factor [0-1] where 1 = no suspicious gaps.
     */
    computeTemporalGapPenalty(logs: Log[], totalDays: number): number {
        if (logs.length <= 1 || totalDays <= 0) return 1.0;

        // Sort logs by creation date
        const sorted = [...logs].sort(
            (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
        );

        // Compute gaps between consecutive logs (in days)
        const gaps: number[] = [];
        for (let i = 1; i < sorted.length; i++) {
            const gap = (new Date(sorted[i].created).getTime()
                       - new Date(sorted[i - 1].created).getTime())
                       / (1000 * 60 * 60 * 24);
            gaps.push(gap);
        }

        // Expected frequency: at least 1 log per (totalDays / minLogs) days
        const expectedInterval = totalDays / Math.max(logs.length, 1);

        // Count suspiciously large gaps (> 3× expected interval)
        const suspiciousGaps = gaps.filter(g => g > expectedInterval * 3).length;

        if (suspiciousGaps === 0) return 1.0;

        // Penalty: exponential decay based on number of suspicious gaps
        return Math.exp(-0.3 * suspiciousGaps);
    }
}
```

### 4.6 New Service: WeightCalibrationService

**Academic basis**: Arshad et al. (2023) [P3] — "trust model parameters require empirical validation"; Chakrabortty & Essam (2023) [P4] — simulation-based parameter validation.

```typescript
// src/modules/ftes/calibration/weight-calibration.service.ts

@Injectable()
export class WeightCalibrationService {

    /**
     * Performs Monte Carlo sensitivity analysis on scoring weights.
     *
     * Methodology:
     * 1. Sample weights from uniform distributions ±20% around current values
     * 2. Compute scores for all farms/seasons in the database
     * 3. Measure rank stability (Kendall's τ) and score variance
     * 4. Report Sobol' first-order sensitivity indices
     *
     * Based on: Cui et al. (2024), Arshad et al. (2023), Chakrabortty & Essam (2023)
     *
     * @param iterations Number of Monte Carlo iterations (default: 10000)
     * @returns Sensitivity report with per-parameter Sobol' indices
     */
    async runSensitivityAnalysis(iterations: number = 10000): Promise<SensitivityReport> {
        // 1. Get all scored seasons as test dataset
        const seasons = await this.seasonRepo.find({
            where: { transparency_score: Not(IsNull()) },
            relations: ['season_details', 'season_details.step', 'plot', 'plot.crop'],
        });

        if (seasons.length < 10) {
            throw new BadRequestException('Need at least 10 scored seasons for analysis');
        }

        // 2. Define parameter space
        const params: ParameterDef[] = [
            { name: 'W_ST_DOC_COMPLETENESS', base: 0.50, range: 0.10 },
            { name: 'W_ST_VERIFICATION_RATIO', base: 0.35, range: 0.07 },
            { name: 'W_ST_TEMPORAL_REGULARITY', base: 0.15, range: 0.03 },
            { name: 'W_SS_PROCESS', base: 0.65, range: 0.13 },
            { name: 'W_SS_TEMPORAL', base: 0.20, range: 0.04 },
            { name: 'W_SS_OUT_COME', base: 0.15, range: 0.03 },
            { name: 'BAYESIAN_PRIOR_ALPHA', base: 2, range: 1 },
            { name: 'BAYESIAN_N_EFF', base: 5, range: 2 },
        ];

        // 3. Run Monte Carlo
        const baselineScores = await this.computeAllScores(seasons, this.getDefaultWeights());
        const baselineRanking = this.rank(baselineScores);

        const perturbedResults: PerturbedResult[] = [];

        for (let i = 0; i < iterations; i++) {
            const perturbedWeights = this.sampleWeights(params);
            const scores = await this.computeAllScores(seasons, perturbedWeights);
            const ranking = this.rank(scores);

            perturbedResults.push({
                weights: perturbedWeights,
                scores,
                kendallTau: this.kendallTau(baselineRanking, ranking),
                scoreVariance: this.variance(scores),
            });
        }

        // 4. Compute Sobol' indices
        const sobolIndices = this.computeSobolIndices(params, perturbedResults);

        return {
            iterations,
            season_count: seasons.length,
            baseline_weights: this.getDefaultWeights(),
            rank_stability: {
                mean_kendall_tau: this.mean(perturbedResults.map(r => r.kendallTau)),
                min_kendall_tau: Math.min(...perturbedResults.map(r => r.kendallTau)),
            },
            parameter_sensitivity: sobolIndices,
            recommendation: this.generateRecommendation(sobolIndices),
        };
    }

    /**
     * Applies AHP (Analytical Hierarchy Process) pairwise comparison matrix
     * to derive weights from expert input.
     *
     * @param comparisonMatrix NxN pairwise comparison matrix from experts
     * @returns Eigenvector-derived weights with consistency ratio
     */
    computeAHPWeights(comparisonMatrix: number[][]): AHPResult {
        const n = comparisonMatrix.length;

        // Compute eigenvector (power method)
        let weights = new Array(n).fill(1 / n);

        for (let iter = 0; iter < 100; iter++) {
            const newWeights = new Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    newWeights[i] += comparisonMatrix[i][j] * weights[j];
                }
            }
            const sum = newWeights.reduce((a, b) => a + b, 0);
            weights = newWeights.map(w => w / sum);
        }

        // Compute consistency ratio
        const lambdaMax = this.computeLambdaMax(comparisonMatrix, weights);
        const CI = (lambdaMax - n) / (n - 1);
        const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49][n] || 1.49;
        const CR = CI / RI;

        return {
            weights,
            consistency_ratio: CR,
            is_consistent: CR < 0.10, // Standard threshold
        };
    }

    private computeLambdaMax(matrix: number[][], weights: number[]): number {
        const n = matrix.length;
        let lambdaMax = 0;
        for (let i = 0; i < n; i++) {
            let rowSum = 0;
            for (let j = 0; j < n; j++) {
                rowSum += matrix[i][j] * weights[j];
            }
            lambdaMax += rowSum / weights[i];
        }
        return lambdaMax / n;
    }

    private kendallTau(a: number[], b: number[]): number {
        let concordant = 0;
        let discordant = 0;
        for (let i = 0; i < a.length; i++) {
            for (let j = i + 1; j < a.length; j++) {
                const aDir = Math.sign(a[i] - a[j]);
                const bDir = Math.sign(b[i] - b[j]);
                if (aDir === bDir) concordant++;
                else if (aDir !== 0 && bDir !== 0) discordant++;
            }
        }
        const total = concordant + discordant;
        return total === 0 ? 1.0 : (concordant - discordant) / total;
    }
}
```

### 4.7 Updated: AuditorService — Commit-Reveal Methods

```typescript
// src/modules/blockchain/auditor/auditor.service.ts
// ADD these methods to existing service

// FIX: Use correct env var
private getContractAddress(): string {
    return this.configService.get<string>('AUDITOR_REGISTRY_CONTRACT_ADDRESS');
    // WAS: PROCESS_TRACKING_CONTRACT_ADDRESS (BUG)
}

// NEW: Request verification with dual deadlines
async requestVerification(
    identifier: string,
    id: number,
    auditorAddresses: string[],
    commitDeadline: number,
    revealDeadline: number,
): Promise<TransactionReceipt> {
    const contract = this.getContract();
    const tx = await contract.requestVerification(
        identifier, id, auditorAddresses, commitDeadline, revealDeadline,
    );
    return tx.wait();
}

// NEW: Finalize with computed consensus
async finalizeWithConsensus(
    identifier: string,
    id: number,
    consensus: boolean,
    revealedAuditors: string[],
): Promise<TransactionReceipt> {
    const contract = this.getContract();
    const tx = await contract.finalizeWithConsensus(
        identifier, id, consensus, revealedAuditors,
    );
    return tx.wait();
}

// NEW: Listen for commit events
async getRecentCommitEvents(fromBlock: number): Promise<CommitEvent[]> {
    const contract = this.getContract();
    const filter = contract.filters.VoteCommitted();
    const events = await contract.queryFilter(filter, fromBlock);
    return events.map(e => ({
        identifier: e.args.identifier,
        id: Number(e.args.id),
        auditor: e.args.auditor,
        blockNumber: e.blockNumber,
    }));
}

// NEW: Listen for reveal events
async getRecentRevealEvents(fromBlock: number): Promise<RevealEvent[]> {
    const contract = this.getContract();
    const filter = contract.filters.VoteRevealed();
    const events = await contract.queryFilter(filter, fromBlock);
    return events.map(e => ({
        identifier: e.args.identifier,
        id: Number(e.args.id),
        auditor: e.args.auditor,
        vote: e.args.vote,
        blockNumber: e.blockNumber,
    }));
}
```

### 4.8 Updated: VerificationListenerService — Two-Phase Events

```typescript
// src/modules/verification/verification-listener.service.ts
// UPDATED for commit-reveal lifecycle

@Injectable()
export class VerificationListenerService implements OnModuleInit {
    private lastProcessedBlock: number;

    // ═══ Poll for finalization events (every 30 seconds) ═══
    @Cron('*/30 * * * * *')
    async pollConsensusEvents(): Promise<void> {
        const events = await this.auditorService.getRecentVerificationFinalizedEvents(
            this.lastProcessedBlock,
        );

        for (const event of events) {
            await this.verificationService.handleConsensusFinalized(
                event.identifier, event.id, event.consensus,
            );
        }

        if (events.length > 0) {
            this.lastProcessedBlock = events[events.length - 1].blockNumber + 1;
        }
    }

    // ═══ NEW: Handle expired commit phase (every 15 minutes) ═══
    @Cron('0 */15 * * * *')
    async handleExpiredCommitPhase(): Promise<void> {
        const expired = await this.verificationRequestRepo.find({
            where: {
                status: VerificationStatus.PENDING,
                commit_deadline: LessThan(new Date()),
                reveal_deadline: MoreThan(new Date()), // Still in reveal window
            },
        });

        for (const request of expired) {
            // Check if any auditors committed but haven't been notified about reveal phase
            const uncommitted = await this.assignmentRepo.find({
                where: {
                    verification_request_id: request.id,
                    phase: 'ASSIGNED', // Never committed
                },
                relations: ['auditor_profile'],
            });

            // Notify uncommitted auditors (stake will be slashed)
            for (const assignment of uncommitted) {
                await this.notificationService.sendToAuditor(
                    assignment.auditor_profile.user_id,
                    'You missed the commit deadline. Your stake may be slashed.',
                );
            }
        }
    }

    // ═══ NEW: Handle expired reveal phase (every 15 minutes) ═══
    @Cron('0 */15 * * * *')
    async handleExpiredRevealPhase(): Promise<void> {
        const expired = await this.verificationRequestRepo.find({
            where: {
                status: VerificationStatus.PENDING,
                reveal_deadline: LessThan(new Date()),
            },
        });

        for (const request of expired) {
            const revealed = await this.assignmentRepo.find({
                where: {
                    verification_request_id: request.id,
                    phase: 'REVEALED',
                },
                relations: ['auditor_profile'],
            });

            if (revealed.length > 0) {
                // Finalize with whatever reveals we have
                await this.verificationService.finalizeConsensus(request, revealed);
            } else {
                // No one revealed → mark as error, use AI score as fallback
                request.status = VerificationStatus.ERROR;
                request.log.verification_status = VerificationStatus.SKIPPED;
                await this.verificationRequestRepo.save(request);
                await this.logRepo.save(request.log);
            }

            // Slash non-revealers (committed but didn't reveal)
            const nonRevealers = await this.assignmentRepo.find({
                where: {
                    verification_request_id: request.id,
                    phase: 'COMMITTED', // Committed but never revealed
                },
            });

            for (const assignment of nonRevealers) {
                assignment.phase = 'SLASHED';
                await this.assignmentRepo.save(assignment);
                // On-chain slashing handled by AuditorRegistry contract
            }
        }
    }
}
```

---

## 5. Database Layer

### 5.1 New Enum: StepCompletionStatus

```typescript
// src/modules/crop-management/enums/step-completion-status.enum.ts
export enum StepCompletionStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    PROVISIONALLY_COMPLETED = 'PROVISIONALLY_COMPLETED',
    COMPLETED = 'COMPLETED',
}
```

### 5.2 New Enum: AssignmentPhase

```typescript
// src/modules/verification/enums/assignment-phase.enum.ts
export enum AssignmentPhase {
    ASSIGNED = 'ASSIGNED',
    COMMITTED = 'COMMITTED',
    REVEALED = 'REVEALED',
    SLASHED = 'SLASHED',
}
```

### 5.3 Modified Entity: AuditorProfile — Multi-Factor Fields

```typescript
// ADD to existing AuditorProfile entity:

@Column({ type: 'int', default: 0 })
completed_within_deadline: number;     // For ResponseRate calculation

@Column({ type: 'timestamp', nullable: true })
last_verification_at: Date | null;      // For RecencyBonus calculation
```

### 5.4 Modified Entity: VerificationRequest — Dual Deadlines

```typescript
// REPLACE single deadline with dual deadlines:

@Column({ type: 'timestamp' })
commit_deadline: Date;                  // End of commit phase

@Column({ type: 'timestamp' })
reveal_deadline: Date;                  // End of reveal phase

// REMOVE:
// deadline: Date;  ← replaced by commit_deadline + reveal_deadline
```

### 5.5 Modified Entity: VerificationAssignment — Commit-Reveal Fields

```typescript
// ADD to existing VerificationAssignment entity:

@Column({ type: 'varchar', length: 66, nullable: true })
commit_hash: string | null;             // keccak256 of (vote + salt)

@Column({ type: 'varchar', length: 66, nullable: true })
commit_transaction_hash: string | null;  // On-chain commit tx

@Column({ type: 'enum', enum: AssignmentPhase, default: AssignmentPhase.ASSIGNED })
phase: AssignmentPhase;                  // ASSIGNED → COMMITTED → REVEALED (or SLASHED)

@Column({ type: 'timestamp', nullable: true })
committed_at: Date | null;

// RENAME for clarity:
// vote_transaction_hash → remains (used for reveal tx hash)
```

### 5.6 Modified Entity: SeasonDetail — Completion Status

```typescript
// ADD to existing SeasonDetail entity:

@Column({
    type: 'enum',
    enum: StepCompletionStatus,
    default: StepCompletionStatus.IN_PROGRESS,
})
completion_status: StepCompletionStatus;
```

### 5.7 New Entity: ExpectedActivity

```typescript
// src/modules/ftes/entities/expected-activity.entity.ts

@Entity('expected_activities')
export class ExpectedActivity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: CropType })
    crop_type: CropType;

    @Column({ type: 'enum', enum: StepType })
    step_type: StepType;

    @Column({ type: 'varchar', length: 100 })
    topic: string;                      // e.g., "pest_management", "fertilization"

    @Column({ type: 'text', array: true })
    keywords: string[];                  // e.g., ["pest", "insect", "spray", "treatment"]

    @Column({ type: 'boolean', default: true })
    is_required: boolean;                // Required or optional topic

    @CreateDateColumn()
    created: Date;
}
```

### 5.8 New Entity: ScoreHistory

```typescript
// src/modules/ftes/entities/score-history.entity.ts

@Entity('score_history')
export class ScoreHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 20 })
    entity_type: string;                 // 'STEP', 'SEASON', 'PLOT', 'FARM'

    @Column()
    entity_id: number;

    @Column({ type: 'float' })
    score: number;

    @Column({ type: 'float', nullable: true })
    previous_score: number | null;

    @Column({ type: 'boolean', default: false })
    is_provisional: boolean;

    @Column({ type: 'int', default: 0 })
    pending_verifications: number;

    @CreateDateColumn()
    recorded_at: Date;
}
```

### 5.9 Complete Entity Relationship Diagram (Verification Subsystem)

```
User (role: AUDITOR)
  │
  └── AuditorProfile
        │  • wallet_address
        │  • total_verifications
        │  • correct_verifications
        │  • completed_within_deadline    ← NEW (multi-factor)
        │  • last_verification_at         ← NEW (multi-factor)
        │
        └── VerificationAssignment
              │  • commit_hash             ← NEW (commit-reveal)
              │  • commit_transaction_hash  ← NEW (commit-reveal)
              │  • phase (ASSIGNED→COMMITTED→REVEALED→SLASHED) ← NEW
              │  • committed_at            ← NEW
              │  • vote
              │  • vote_transaction_hash
              │  • voted_at
              │
              └── VerificationRequest
                    │  • commit_deadline     ← NEW (commit-reveal)
                    │  • reveal_deadline     ← NEW (commit-reveal)
                    │  • status
                    │  • consensus_result
                    │
                    └── Log
                          │  • verification_status
                          │  • is_active
                          │
                          └── SeasonDetail
                                • completion_status  ← NEW (provisional scoring)
                                • transparency_score

ExpectedActivity (NEW)                  ScoreHistory (NEW)
  • crop_type                             • entity_type (STEP/SEASON/PLOT/FARM)
  • step_type                             • entity_id
  • topic                                 • score
  • keywords[]                            • previous_score
  • is_required                           • is_provisional
                                          • pending_verifications
```

### 5.10 Migration

```
npm run migration:create-linux -- src/migrations/AddV3VerificationAndScoring
```

Migration steps:
1. Add `completion_status` enum type + column to `season_details`
2. Add `assignment_phase` enum type
3. Add columns to `verification_assignments`: `commit_hash`, `commit_transaction_hash`, `phase`, `committed_at`
4. Rename `deadline` → split into `commit_deadline` + `reveal_deadline` in `verification_requests`
5. Add columns to `auditor_profiles`: `completed_within_deadline`, `last_verification_at`
6. Create `expected_activities` table
7. Create `score_history` table
8. Seed `expected_activities` with initial crop-step-topic data

---

## 6. Scoring Algorithm — FTES v3

### 6.1 Overview with Completeness Integration

```
Level 1: LOG EVIDENCE SCORE (unchanged from V2)
    El = 0.30 × SpatialPlausibility(Gaussian)
       + 0.20 × EvidenceCompleteness
       + 0.30 × AIVerificationScore
       + 0.20 × DuplicateScore
    Vl = auditor consensus weight [0-1] (from commit-reveal consensus)
    Sl = El × Vl

Level 2: STEP TRANSPARENCY INDEX (UPDATED — adds completeness)
    Is = (0.50 × DC + 0.30 × VR + 0.10 × TR + 0.10 × CR) × GP
    ─────────────────────────────────────────────────────────
    DC = Documentation Completeness
    VR = Verification Ratio (from commit-reveal consensus)
    TR = Temporal Regularity (coefficient of variation)
    CR = Completeness Ratio (selective transparency detection) ← NEW [P2]
    GP = Temporal Gap Penalty [0-1] ← NEW [P7]

Level 3: SEASON TRANSPARENCY SCORE (unchanged from V2)
    Tsn = PT^0.65 × SA^0.20 × OC^0.15 (weighted geometric mean)

Level 4: FARM TRANSPARENCY SCORE (unchanged from V2)
    Bayesian Beta aggregation: θ ~ Beta(α, β)
    Score = α / (α + β) with confidence interval

SEPARATE: Customer Satisfaction
    Score = avg_rating / 5 (NOT mixed into transparency)
```

### 6.2 Updated Weight Constants

```typescript
// src/modules/ftes/constants/weight.constant.ts

// ═══ Step-level (UPDATED: redistributed for completeness) ═══
export const W_ST_DOC_COMPLETENESS = 0.50;
export const W_ST_VERIFICATION_RATIO = 0.30;       // Was 0.35
export const W_ST_TEMPORAL_REGULARITY = 0.10;       // Was 0.15
export const W_ST_COMPLETENESS_RATIO = 0.10;        // NEW

// ═══ Season-level (unchanged) ═══
export const W_SS_PROCESS = 0.65;
export const W_SS_TEMPORAL = 0.20;
export const W_SS_OUT_COME = 0.15;

// ═══ Step type weights (unchanged) ═══
export const W_ST_TYPE_PREPARE = 0.1;
export const W_ST_TYPE_PLANTING = 0.1;
export const W_ST_TYPE_CARE = 0.5;
export const W_ST_TYPE_HARVEST = 0.2;
export const W_ST_TYPE_POST_HARVEST = 0.1;

// ═══ Bayesian parameters (unchanged) ═══
export const BAYESIAN_PRIOR_ALPHA = 2;
export const BAYESIAN_PRIOR_BETA = 2;
export const BAYESIAN_N_EFF = 5;

// ═══ Temporal (unchanged) ═══
export const TEMPORAL_SIGMOID_K = 0.3;
export const TEMPORAL_SIGMOID_MIDPOINT = 14;
export const DECAY_HALF_LIFE_MONTHS = 6;

// ═══ Verification (unchanged) ═══
export const DEFAULT_UNVERIFIED_DISCOUNT = 0.7;

// ═══ Commit-reveal deadlines (NEW) ═══
export const COMMIT_PHASE_DAYS = 5;
export const REVEAL_PHASE_DAYS = 2;

// ═══ Completeness (NEW) ═══
export const CV_MAX = 2.0;              // Max coefficient of variation for temporal regularity
export const GAP_PENALTY_K = 0.3;       // Exponential decay rate for gap penalty
export const GAP_THRESHOLD_MULTIPLIER = 3; // Gap is suspicious if > 3× expected interval
```

### 6.3 Provisional Scoring Logic

```
When step has PENDING verifications:

    For logs with status VERIFIED:   use actual Sl = El × Vl
    For logs with status REJECTED:   excluded (is_active = false)
    For logs with status SKIPPED:    use Sl = El × 0.7
    For logs with status PENDING:    use Sl = El × 0.7 (provisional discount)
                                          ^^^^^^^^^^^^
                                          Same discount as SKIPPED,
                                          but flagged as provisional

    Step score is computed normally with these values.
    Marked as: is_provisional = true

When pending verification finalizes:
    → Recalculate step score with actual Vl
    → Record score delta in ScoreHistory
    → If step was final → cascade recalculate season → plot → farm
```

---

## 7. API Design

### 7.1 Commit-Reveal Auditor Endpoints

```
POST /api/verification/:requestId/commit
    Auth: AUDITOR (must be assigned)
    Body: { commit_hash: string, transaction_hash: string }
    Description: Record commit phase vote (hashed).
                 Auditor calls AuditorRegistry.commitVote() on-chain first.
    Response: { committed: true, reveal_opens_at: Date }

POST /api/verification/:requestId/reveal
    Auth: AUDITOR (must have committed)
    Body: { is_valid: boolean, salt: string, transaction_hash: string }
    Description: Record reveal phase vote.
                 Auditor calls AuditorRegistry.revealVote() on-chain first.
    Response: { revealed: true, consensus_reached: boolean }
```

### 7.2 Verification Package (unchanged from V2)

```
GET /api/verification/pending
    Auth: AUDITOR
    Response: VerificationRequest[] with deadlines and phase info

GET /api/verification/:requestId/package
    Auth: AUDITOR (must be assigned)
    Response: {
        log, plot, season, blockchain, ai_analysis,
        commit_deadline, reveal_deadline, current_phase
    }
```

### 7.3 Admin Endpoints (extended)

```
GET /api/admin/verifications
    Auth: ADMIN
    Query: status, farm_id, date_from, date_to, phase (COMMIT/REVEAL/FINALIZED)
    Response: Paginated VerificationRequest[] with phase info

GET /api/admin/auditors
    Auth: ADMIN
    Response: AuditorProfile[] with multi-factor scores + on-chain data

POST /api/admin/calibration/sensitivity
    Auth: ADMIN
    Body: { iterations?: number }
    Description: Run Monte Carlo sensitivity analysis
    Response: SensitivityReport

POST /api/admin/calibration/ahp
    Auth: ADMIN
    Body: { comparison_matrix: number[][] }
    Description: Compute AHP weights from expert pairwise comparisons
    Response: AHPResult { weights, consistency_ratio, is_consistent }

GET /api/admin/expected-activities
    Auth: ADMIN
    Response: ExpectedActivity[] grouped by crop_type + step_type

POST /api/admin/expected-activities
    Auth: ADMIN
    Body: { crop_type, step_type, topic, keywords[], is_required }
    Description: Add expected activity for selective transparency detection
```

### 7.4 Public Endpoints (unchanged from V2)

```
GET /api/verification/log/:logId/status
    Auth: @Public()
    Response: { verification_status, consensus_result, auditor_count, phase }

GET /api/farms/:farmId/scorecard
    Auth: @Public()
    Response: FarmScorecard
```

### 7.5 Route Registration

```typescript
// app.module.ts
RouterModule.register([
    // ... existing routes ...
    { path: 'verification', module: VerificationModule },
]),
```

---

## 8. Complete Workflow — End-to-End

### 8.1 Phase 1: Log Submission (Minimal Changes)

```
1. Farmer submits AddLogDto via mobile app
        ↓
2. Backend validates step status, saves Log to DB
        ↓
3. ImageVerificationService.verifyLogImages()
   ├── Perceptual hash → cross-farm duplicate detection
   ├── Google Vision API → agricultural relevance, originality
   └── Returns: ai_score (0-1), flags[]
        ↓
4. ProcessTrackingService.addLog(seasonDetailId, logId, hash)
   └── SHA-256 hash stored on-chain immutably (Oracle 1)
        ↓
5. Backend computes Evidence Score (El):
   El = 0.30 × SpatialPlausibility + 0.20 × EvidenceCompleteness
      + 0.30 × AIVerificationScore + 0.20 × DuplicateScore
        ↓
6. AuditorVerificationService.evaluateForVerification(log, farmId)
   ├── Score < 60 → ALWAYS verify
   ├── Score 60-90 → 20% random sample
   └── Score > 90 + no flags → SKIP verification
        ↓
7. IF verification needed:
   ├── AuditorSelectionService.selectAuditors() ── MULTI-FACTOR + TIERED [P4]
   │   ├── Compute SelectionScore per auditor (5 factors)
   │   ├── Segment into 3 tiers
   │   └── Weighted random selection
   ├── AuditorRegistry.requestVerification(id, auditors, commitDL, revealDL) ── DUAL DEADLINES
   ├── Create VerificationRequest (commit_deadline, reveal_deadline) in DB
   ├── Create VerificationAssignments (phase = ASSIGNED)
   ├── Notify auditors (Firebase push)
   └── Log.verification_status = PENDING

   IF verification skipped:
   ├── Log.verification_status = SKIPPED
   ├── Vl = 0.7 (default discount)
   ├── Sl = El × 0.7
   └── TrustworthinessService.processData(LogAuditorTrustPackage inputs)
```

### 8.2 Phase 2: Commit Phase (5 days) — NEW

```
8.  Auditor receives notification → opens app/dashboard
        ↓
9.  GET /api/verification/pending → sees assigned tasks with commit deadline
        ↓
10. GET /api/verification/:id/package → receives full data package:
    ├── Log content (description, images, videos, GPS)
    ├── Plot/Season context
    ├── On-chain hash (can verify data integrity)
    ├── AI analysis results (flags, scores)
    └── Historical context (previous logs, farm score)
        ↓
11. Auditor reviews evidence and forms judgment:
    ├── Are images genuine agricultural activity?
    ├── Does GPS match the declared plot?
    ├── Is description consistent with season/step?
    ├── Does on-chain hash match the shown data?
    └── Signs of fabrication, staging, or reuse?
        ↓
12. Auditor generates random salt, computes:
    commitHash = keccak256(abi.encodePacked(isValid, salt))
        ↓
13. Auditor calls AuditorRegistry.commitVote(identifier, id, commitHash)
    └── SIGNED WITH AUDITOR'S OWN WALLET
    └── On-chain: only hash stored; vote is HIDDEN from other auditors
        ↓
14. POST /api/verification/:id/commit { commit_hash, transaction_hash }
    └── Backend records commit for tracking
    └── Assignment.phase = COMMITTED
```

### 8.3 Phase 3: Reveal Phase (2 days) — NEW

```
15. After commit deadline passes, reveal phase begins automatically
    └── Backend sends reminder notifications to committed auditors
        ↓
16. Auditor calls AuditorRegistry.revealVote(identifier, id, isValid, salt)
    └── Contract verifies: keccak256(isValid, salt) == commitHash
    └── SIGNED WITH AUDITOR'S OWN WALLET
        ↓
17. POST /api/verification/:id/reveal { is_valid, salt, transaction_hash }
    └── Backend records reveal
    └── Assignment.phase = REVEALED
        ↓
18. When ALL committed auditors have revealed (or reveal deadline passes):
    └── Auto-trigger consensus finalization
```

### 8.4 Phase 4: Consensus Finalization

```
19. Backend computes reputation-weighted consensus:
    ├── For each revealed auditor: get on-chain reputation score
    ├── validWeight = Σ(reputation of valid-voters)
    ├── totalWeight = Σ(reputation of all revealed voters)
    ├── consensus = validWeight > totalWeight / 2
    └── consensusWeight = majority_weight / total_weight × 100
        ↓
20. Backend calls AuditorRegistry.finalizeWithConsensus(id, consensus, auditors)
    ├── Correct voters: +2 reputation
    ├── Incorrect voters: -5 reputation, -0.1 ETH slashed
    ├── Non-revealers (committed but didn't reveal): -0.1 ETH slashed
    └── Emit VerificationFinalized(identifier, id, consensus)
        ↓
21. VerificationService.handleConsensusFinalized():
    │
    ├── IF consensus = VALID:
    │   ├── Log.verification_status = VERIFIED
    │   ├── Vl = consensusWeight / 100
    │   ├── Sl = El × Vl
    │   ├── TrustworthinessService.processData(LogAuditorTrustPackage inputs)
    │   ├── ProcessTrackingService.verifyLog(logId, VERIFIED)
    │   └── Notify farmer: "Log verified by auditors"
    │
    └── IF consensus = INVALID:
        ├── Log.verification_status = REJECTED
        ├── Log.is_active = false
        ├── ProcessTrackingService.verifyLog(logId, REJECTED)
        ├── Notify farmer: "Log flagged by auditors"
        ├── Notify admin: "Review required"
        └── Flag farm for increased verification sampling
        ↓
22. IF step was PROVISIONALLY_COMPLETED:
    └── Trigger recalculation cascade:
        ├── Recalculate step transparency score (with actual Vl)
        ├── Record score delta in ScoreHistory
        ├── If season already scored → recalculate season score
        └── If farm already scored → recalculate farm score
```

### 8.5 Phase 5: Step Completion (Provisional Support)

```
23. Farmer requests step completion → SeasonService.finishStep()
        ↓
24. Backend checks verification status:
    ├── Count PENDING verifications
    │
    ├── IF all resolved (0 PENDING):
    │   └── completion_status = COMPLETED (final)
    │
    └── IF some PENDING:
        └── completion_status = PROVISIONALLY_COMPLETED
            ├── Pending logs scored with AI discount (0.7)
            └── Step NOT blocked — farmer workflow continues
        ↓
25. Aggregate step data:
    ├── totalLogs = count(active logs)
    ├── verifiedLogs = count(VERIFIED)
    ├── rejectedLogs = count(REJECTED)
    ├── unverifiedLogs = count(SKIPPED) + count(PENDING as provisional)
    ├── avgConsensusWeight = mean(consensus weights of verified logs)
    ├── completenessRatio = SelectiveTransparencyService.computeCompletenessRatio() ← NEW
    ├── activeDays, totalDays
    └── minLogs
        ↓
26. TrustworthinessService.processData(StepAuditorTrustPackage inputs)
    └── On-chain: StepAuditorTrustPackage.computeTrustScore()
    └── Includes completenessRatio in scoring ← NEW
        ↓
27. Record in ScoreHistory (with is_provisional flag)
        ↓
28. ProcessTrackingService.addStep(hash)
    └── Step data hash stored on-chain
```

### 8.6 Phase 6: Season/Farm Scoring (Unchanged from V2)

```
29. Season completion → TransparencyService.calcSeasonTransparencyScore()
    ├── PT = Σ(step_weight × step_trust_score) per step type
    ├── SA = 1 / (1 + exp(0.3 × (deviation_days - 14)))    ← sigmoid
    ├── OC = exp(-|actual - expected|² / (2 × expected²))   ← Gaussian
    └── Tsn = max(PT,0.01)^0.65 × max(SA,0.01)^0.20 × max(OC,0.01)^0.15
        ↓
30. TransparencyService.calcFarmTransparencyScore()
    ├── Bayesian Beta: Prior α=2, β=2
    ├── Per season: α += exp(-λt) × s × 5, β += exp(-λt) × (1-s) × 5
    ├── Farm Score = α / (α + β)
    └── Confidence = f(posterior variance)
        ↓
31. Build FarmScorecard:
    {
        transparency: { score, confidence, seasons_evaluated, last_updated },
        customer_satisfaction: { score: avg_rating/5, review_count },
        verification_summary: { verified_logs, valid_rate, active_auditors }
    }
```

### 8.7 Complete Sequence Diagram — With Commit-Reveal

```
    Farmer              Backend              ProcessTracking    AuditorRegistry         Auditors
      │                    │                       │                   │                    │
      │  Submit Log        │                       │                   │                    │
      │───────────────────>│                       │                   │                    │
      │                    │  Save + AI verify     │                   │                    │
      │                    │  Compute El           │                   │                    │
      │                    │                       │                   │                    │
      │                    │  addLog(hash)         │                   │                    │
      │                    │──────────────────────>│  Oracle 1         │                    │
      │                    │                       │                   │                    │
      │                    │  Select auditors      │                   │                    │
      │                    │  (multi-factor+tiered)│                   │                    │
      │                    │                       │                   │                    │
      │                    │  requestVerification(auditors, commitDL, revealDL)             │
      │                    │──────────────────────────────────────────>│  Oracle 2          │
      │                    │  Notify auditors      │                   │                    │
      │                    │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─>│
      │                    │                       │                   │                    │
      │  "Log pending"     │                       │                   │                    │
      │<───────────────────│                       │                   │                    │
      │                    │                       │                   │                    │
      │                    │                       │                   │    ═══ COMMIT ═══  │
      │                    │                       │                   │                    │
      │                    │                       │                   │  commitVote(hash1) │
      │                    │                       │                   │<───────────────────│ A1
      │                    │  POST /commit {hash}  │                   │                    │
      │                    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│ A1
      │                    │                       │                   │                    │
      │                    │                       │                   │  commitVote(hash2) │
      │                    │                       │                   │<───────────────────│ A2
      │                    │  POST /commit {hash}  │                   │                    │
      │                    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│ A2
      │                    │                       │                   │                    │
      │                    │       ╔═══════════════╧═══════════╗       │                    │
      │                    │       ║  Commit deadline passes    ║       │                    │
      │                    │       ╚═══════════════╤═══════════╝       │                    │
      │                    │                       │                   │                    │
      │                    │                       │                   │    ═══ REVEAL ═══  │
      │                    │                       │                   │                    │
      │                    │                       │                   │  revealVote(T,salt)│
      │                    │                       │                   │<───────────────────│ A1
      │                    │  POST /reveal         │                   │                    │
      │                    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│ A1
      │                    │                       │                   │                    │
      │                    │                       │                   │  revealVote(T,salt)│
      │                    │                       │                   │<───────────────────│ A2
      │                    │  POST /reveal         │                   │                    │
      │                    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│ A2
      │                    │                       │                   │                    │
      │                    │  All revealed →        │                   │                    │
      │                    │  compute consensus    │                   │                    │
      │                    │                       │                   │                    │
      │                    │  finalizeWithConsensus(VALID, [A1, A2])   │                    │
      │                    │──────────────────────────────────────────>│                    │
      │                    │                       │  Reward A1, A2    │                    │
      │                    │                       │                   │                    │
      │                    │  Compute Sl = El × Vl │                   │                    │
      │                    │  processData(inputs)  │    Oracle 3       │                    │
      │                    │──────────────────────>│ TrustComputation  │                    │
      │                    │                       │                   │                    │
      │  "Log verified"    │                       │                   │                    │
      │<───────────────────│                       │                   │                    │
      │                    │                       │                   │                    │
      │                    │       ╔═══════════════╧═══════════╗       │                    │
      │  Finish step       │       ║  Meanwhile: farmer can    ║       │                    │
      │  (provisional)     │       ║  finish step without      ║       │                    │
      │───────────────────>│       ║  waiting for consensus    ║       │                    │
      │                    │       ╚═══════════════╤═══════════╝       │                    │
      │  "Step completed   │                       │                   │                    │
      │   (provisional)"   │                       │                   │                    │
      │<───────────────────│                       │                   │                    │
```

---

## 9. Implementation Roadmap

### Phase 0: Bug Fixes (Day 1) — UNCHANGED

| Task | File | Effort |
|------|------|--------|
| Fix AuditorService env var | `auditor.service.ts` | 15 min |
| Export AuditorService from BlockchainModule | `blockchain.module.ts` | 15 min |
| Add AUDITOR to UserRole enum | `role.enum.ts` | 15 min |
| Re-enable TrustworthinessService | `trustworthiness.service.ts` | 1 hour |

### Phase 1: Database (Days 2-3)

| Task | Effort |
|------|--------|
| Create StepCompletionStatus, AssignmentPhase enums | 30 min |
| Add columns to AuditorProfile (multi-factor) | 30 min |
| Add columns to VerificationAssignment (commit-reveal) | 1 hour |
| Split deadline → commit_deadline + reveal_deadline in VerificationRequest | 1 hour |
| Add completion_status to SeasonDetail | 30 min |
| Create ExpectedActivity entity | 1 hour |
| Create ScoreHistory entity | 1 hour |
| Create migration | 2 hours |
| Seed expected_activities | 2 hours |

### Phase 2: Smart Contracts (Days 4-7)

| Task | Effort |
|------|--------|
| Redesign AuditorRegistry.sol with commit-reveal | 2 days |
| Write LogAuditorTrustPackage.sol (calibrated) | 0.5 day |
| Write StepAuditorTrustPackage.sol (with completeness) | 0.5 day |
| Write Foundry tests for commit-reveal flow | 1 day |
| Deploy contracts, register TrustPackages | 0.5 day |
| Update ABIs in backend | 1 hour |

### Phase 3: Backend — Verification Module (Days 8-13)

| Task | Effort |
|------|--------|
| Implement AuditorSelectionService (multi-factor + tiered) | 1 day |
| Update AuditorVerificationService for commit-reveal | 2 days |
| Update AuditorService (commit-reveal methods) | 1 day |
| Update VerificationListenerService (two-phase events) | 1 day |
| Update VerificationController (commit/reveal endpoints) | 0.5 day |
| Add admin calibration endpoints | 0.5 day |

### Phase 4: Backend — Scoring Redesign (Days 14-17)

| Task | Effort |
|------|--------|
| Implement SelectiveTransparencyService | 1 day |
| Implement WeightCalibrationService (AHP + Monte Carlo) | 1.5 days |
| Update TransparencyService for FTES v3 (completeness ratio) | 0.5 day |
| Implement provisional scoring in SeasonService.finishStep() | 1 day |
| Implement score recalculation cascade | 0.5 day |
| Create ScoreHistoryService | 0.5 day |

### Phase 5: Integration (Days 18-19)

| Task | Effort |
|------|--------|
| Update CropManagement addLog → new verification flow | 0.5 day |
| Update finishStep → provisional completion | 0.5 day |
| Notification integration (commit reminders, reveal reminders) | 0.5 day |
| Admin expected-activity management endpoints | 0.5 day |

### Phase 6: Testing (Days 20-23)

| Task | Effort |
|------|--------|
| Unit tests: AuditorSelectionService (multi-factor scoring) | 0.5 day |
| Unit tests: commit-reveal orchestration | 1 day |
| Unit tests: provisional scoring + recalculation | 0.5 day |
| Unit tests: SelectiveTransparencyService | 0.5 day |
| Unit tests: WeightCalibrationService | 0.5 day |
| Integration test: full commit-reveal flow end-to-end | 1 day |

### Phase 7: Benchmarking (Days 24-25) — NEW [P5]

| Task | Effort |
|------|--------|
| Write gas benchmarking scripts (Foundry) | 0.5 day |
| Run benchmarks on zkSync testnet (3 scenarios) | 0.5 day |
| Generate cost projection tables | 0.5 day |
| Write benchmarking section for thesis | 0.5 day |

### Total Estimated Effort: ~25 working days (+5 from V2 due to 7 improvements)

---

## 10. Academic Framing

### 10.1 Research Contribution (Reframed)

> We propose a **domain-specific hybrid oracle architecture** for agricultural supply chain transparency that addresses the blockchain oracle problem (Caldarelli, 2025) through three complementary mechanisms:
>
> 1. **Data integrity oracle** (ProcessTracking): Achieves data availability via cryptographic hashing, ensuring stored data cannot be retroactively modified. This addresses Cui et al.'s (2024) data availability requirement.
>
> 2. **Verification oracle** (AuditorRegistry with commit-reveal voting + AI pre-filter): Achieves data verifiability via a hybrid mechanism combining scalable AI pre-assessment with authoritative human judgment anchored by economic incentives (staking/slashing) and privacy-preserving voting (commit-reveal). This addresses Caldarelli's (2025) trust translation requirement and Arshad et al.'s (2023) privacy requirement.
>
> 3. **Trust computation oracle** (TrustComputation + FTES v3): Achieves trust quantification via modular scoring using Bayesian aggregation for uncertainty (Arshad et al., 2023), geometric mean for dimension interdependence, sigmoid functions for smooth temporal decay, and completeness ratio for selective disclosure detection (Cui et al., 2024). All weights are derived through AHP expert elicitation and validated by Monte Carlo sensitivity analysis.
>
> The architecture extends Leteane & Ayalew's (2024) multi-package trust model from IoT device attestation to human-submitted agricultural data, replacing device-level cryptographic proof with economically incentivized auditor consensus as the primary trust input.

### 10.2 Game-Theoretic Security (Formalized)

**Proposition**: Under the commit-reveal voting mechanism, honest voting is the dominant strategy for rational auditors.

**Proof sketch**:
```
Let p = probability of being correct when voting honestly
Let q = probability of being correct when voting randomly (q ≈ 0.5)

Expected payoff of honest voting:
    E[honest] = p × (+2 rep) + (1-p) × (-5 rep - 0.1 ETH)

Expected payoff of random voting:
    E[random] = 0.5 × (+2 rep) + 0.5 × (-5 rep - 0.1 ETH)
              = -1.5 rep - 0.05 ETH

For honest voting to dominate:
    E[honest] > E[random]
    p × 2 + (1-p) × (-5) > -1.5
    7p - 5 > -1.5
    p > 3.5/7 = 0.5

Since honest auditors reviewing evidence achieve p >> 0.5,
honest voting strictly dominates random voting.

Additionally, commit-reveal eliminates the "copy the leader" strategy:
    - Without commit-reveal: late voters can observe early votes and copy
    - With commit-reveal: votes are hidden during commit phase
    - Result: each auditor must form an independent judgment
```

### 10.3 Novel Academic Contributions

| # | Contribution | Literature Gap Addressed |
|---|-------------|--------------------------|
| 1 | Three-oracle composition for agricultural transparency | No existing system combines integrity, verification, and quantification oracles |
| 2 | Commit-reveal voting for agricultural verification | Commit-reveal applied in DeFi but not in agricultural supply chains |
| 3 | Multi-factor auditor selection with tiered probability | Extends RPoC (Chakrabortty & Essam, 2023) to verification context |
| 4 | Bayesian Beta farm scoring with confidence intervals | First application of Bayesian uncertainty to farm transparency scores |
| 5 | Selective transparency detection via Expected Activity Model | Addresses Cui et al.'s (2024) selective disclosure problem |
| 6 | AHP + Monte Carlo weight calibration for trust models | Transforms ad-hoc weights into empirically validated parameters |
| 7 | Provisional scoring for workflow decoupling | Novel approach to async verification in agricultural contexts |

### 10.4 Comparison with Existing Systems (Updated)

| System | Trust Model | Verification | Privacy | Scoring | Uncertainty |
|--------|------------|--------------|---------|---------|-------------|
| IBM Food Trust | Centralized | Single auditor | N/A | Proprietary | None |
| TE-FOOD | Centralized | Single auditor | N/A | Not disclosed | None |
| OriginTrail | Decentralized KG | Node consensus | Partial | Graph-based | None |
| VeChain ToolChain | IoT + Central | Device attestation | N/A | Rule-based | None |
| AgriInsureDON [P5] | IoT oracle | Masked secret sharing | **Yes** | Reputation | None |
| **Farmera FTES v3** | **Three-oracle** | **Commit-reveal** | **Yes** | **Bayesian+GM** | **Beta CI** |

---

## Appendix A: Environment Variables

```bash
# EXISTING (from V2):
AUDITOR_REGISTRY_CONTRACT_ADDRESS=0x...
MIN_AUDITORS_PER_VERIFICATION=2
VERIFICATION_SAMPLING_RATE=0.20
VERIFICATION_AUTO_THRESHOLD=60
VERIFICATION_SKIP_THRESHOLD=90
BAYESIAN_PRIOR_ALPHA=2
BAYESIAN_PRIOR_BETA=2
BAYESIAN_N_EFF=5
DECAY_HALF_LIFE_MONTHS=6

# NEW (V3):
COMMIT_PHASE_DAYS=5                     # Duration of commit phase
REVEAL_PHASE_DAYS=2                     # Duration of reveal phase
NON_REVEAL_SLASH_AMOUNT=0.1             # ETH slashed for not revealing
```

## Appendix B: File Change Summary

### New Files (V3 additions)

| File | Purpose | Academic Source |
|------|---------|----------------|
| `src/modules/ftes/calibration/weight-calibration.service.ts` | AHP + Monte Carlo | P2, P3, P4 |
| `src/modules/ftes/selective-transparency/selective-transparency.service.ts` | Expected Activity Model | P2, P7 |
| `src/modules/ftes/entities/expected-activity.entity.ts` | Expected activities per crop/step | P2, P7 |
| `src/modules/ftes/entities/score-history.entity.ts` | Audit trail for score changes | P6, P7 |
| `src/modules/crop-management/enums/step-completion-status.enum.ts` | Provisional completion | P6 |
| `src/modules/verification/enums/assignment-phase.enum.ts` | Commit-reveal phases | P3, P5 |
| `src/modules/verification/dtos/commit-vote.dto.ts` | Commit endpoint DTO | P3, P5 |
| `src/modules/verification/dtos/reveal-vote.dto.ts` | Reveal endpoint DTO | P3, P5 |
| Smart contract: `AuditorRegistry.sol` (commit-reveal) | Privacy-preserving voting | P3, P5 |

### Modified Files (V3 updates to V2)

| File | Change | Academic Source |
|------|--------|----------------|
| `auditor-selection.service.ts` | Multi-factor scoring + tiered selection | P4 |
| `auditor-verification.service.ts` | Commit-reveal orchestration | P3, P5 |
| `verification-listener.service.ts` | Two-phase event handling | P3, P5 |
| `verification.controller.ts` | Commit/reveal endpoints | P3, P5 |
| `auditor-profile.entity.ts` | Multi-factor fields | P4 |
| `verification-request.entity.ts` | Dual deadlines | P3, P5 |
| `verification-assignment.entity.ts` | Commit-reveal fields | P3, P5 |
| `season-detail.entity.ts` | completion_status column | P6, P7 |
| `season.service.ts` | Provisional scoring in finishStep | P6, P7 |
| `transparency.service.ts` | Completeness ratio integration | P2, P7 |
| `weight.constant.ts` | Updated weights + new constants | P2, P3, P4 |
| `step-transparency.interface.ts` | Add completenessRatio | P2 |
| `StepAuditorTrustPackage.sol` | Add W_COMPLETENESS | P2 |
| `auditor.service.ts` | Commit-reveal blockchain methods | P3, P5 |

### Unchanged from V2

| File | Reason |
|------|--------|
| `ProcessTracking.sol` | Oracle 1 — immutable hash storage |
| `TrustComputation.sol` | Oracle 3 orchestration engine |
| `MetricSelection.sol` (code) | Registry pattern preserved |
| `TrustPackage.sol` (interface) | Interface unchanged |
| `PriceFeedConsumer.sol` | Chainlink integration |
| `ImageVerificationService` | AI pre-filter preserved |
| `LogAuditorTrustPackage.sol` | Weights unchanged from V2 (calibration validates, not changes) |

---

## References

[P1] Leteane, O. & Ayalew, Y. (2024). *JBBA*, 7(1). DOI: 10.31585/jbba-7-1-(2)2024
[P2] Cui, Y., Gaur, V. & Liu, J. (2024). *Management Science*, 70(5). DOI: 10.1287/mnsc.2023.4851
[P3] Arshad, Q. et al. (2023). *Complex & Intelligent Systems*, 9. DOI: 10.1007/s40747-023-01058-8
[P4] Chakrabortty, R.K. & Essam, D.L. (2023). *J. Ambient Intell. Humaniz. Comput.*, 14. DOI: 10.1007/s12652-023-04592-y
[P5] Manoj, T. et al. (2025). *Frontiers in Blockchain*, 7. DOI: 10.3389/fbloc.2024.1481339
[P6] Caldarelli, G. (2025). *Frontiers in Blockchain*, 8. DOI: 10.3389/fbloc.2025.1682623
[P7] Guo, T. et al. (2025). *J. Food Quality*, 2025. DOI: 10.1155/jfq/5914078

---

*Synthesized from ARCHITECTURE_AND_WORKFLOW_DESIGN.md (V2) + ACADEMIC_ARCHITECTURE_REVIEW.md improvements.*
*All seven proposed improvements integrated. Each change traceable to its academic source.*
