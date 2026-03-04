# Proposed Flow: Decentralized Verification Integration

## Resolving Problems Identified in BLOCKCHAIN_TRUSTWORTHINESS_ANALYSIS.md

---

## Problems Addressed

| # | Problem | Root Cause | Section |
|---|---------|-----------|---------|
| P1 | Single-writer pattern negates decentralization | Backend is sole blockchain writer | 1.4, 3.1 |
| P2 | Trust scores computed from unverifiable backend inputs | `verified`, `imageVerified` set by backend alone | 2.2, 3.1 |
| P3 | No on-chain decision-making | Scores stored but never trigger consequences | 2.3 |
| P4 | AuditorRegistry exists but disconnected | No backend integration | 1.4 |
| P5 | No game-theoretic security | No economic cost for false data | 3.1 |
| P6 | Backend remains ultimate authority | No independent verification path | 2.2 |

---

## Current Flow (Single-Authority Model)

```
Farmer submits log
    ↓
Backend saves to DB
    ↓
Backend runs image verification (AI — Google Vision)
    ↓
Backend sets: verified = true, imageVerified = AI_result
    ↓
Backend calls ProcessTracking.addLog(hash)           ← single writer
    ↓
Backend calls TrustComputation.processData(inputs)    ← backend-supplied inputs
    ↓
Score stored on-chain ← immutable but potentially false
    ↓
Done. No further verification.
```

**Trust authority**: Backend (single party, unaccountable)

---

## Proposed Flow (Dual-Authority Model)

The new flow introduces a **two-phase trust computation**: an initial automated assessment (Phase 1) followed by decentralized human verification (Phase 2). The final trust score is a composite of both.

### Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 1: AUTOMATED ASSESSMENT (existing — unchanged)               │
│                                                                     │
│  Farmer → Backend → Image Verification (AI)                         │
│                   → ProcessTracking.addLog(hash)                    │
│                   → TrustComputation.processData() → initial score  │
│                                                                     │
│  Trust source: Algorithmic (AI + spatial + evidence metrics)        │
│  Resolves: Nothing new — this is the current system                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 2: DECENTRALIZED VERIFICATION (new)                          │
│                                                                     │
│  Backend → Create VerificationRequest in DB                         │
│          → Notify assigned auditors                                 │
│                                                                     │
│  Auditor → Fetch verification package (log data + images + GPS)     │
│          → Compare on-chain hash with off-chain data                │
│          → Submit vote: AuditorRegistry.verify(identifier, id, T/F) │
│                                                                     │
│  Contract → Collect votes until MIN_AUDITORS reached                │
│           → Calculate reputation-weighted consensus                 │
│           → Finalize: reward correct voters, slash incorrect voters  │
│           → Emit VerificationFinalized event                        │
│                                                                     │
│  Backend → Listen for VerificationFinalized event                   │
│          → Update log verification_status based on consensus        │
│          → Recalculate trust score if consensus = INVALID           │
│                                                                     │
│  Trust source: Economic consensus (staked, reputation-weighted)     │
│  Resolves: P1, P2, P4, P5, P6                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 3: COMPOSITE SCORING (new)                                   │
│                                                                     │
│  Final log trust = f(automated_score, consensus_outcome)            │
│                                                                     │
│  If consensus = VALID:   final_score = automated_score              │
│  If consensus = INVALID: final_score = penalized (automated × 0.3) │
│  If consensus = PENDING: final_score = automated_score × 0.7       │
│                                                                     │
│  Resolves: P3 (consensus outcome has concrete consequence)          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Flow

### Phase 1: Log Submission (Existing — No Changes)

```
1. Farmer submits AddLogDto
       ↓
2. Backend validates step status
       ↓
3. Backend saves Log to database
       ↓
4. ImageVerificationService.verifyLogImages()
   ├─ Perceptual hash (aHash) → duplicate detection
   ├─ Google Vision API → agricultural relevance, originality
   └─ Returns: imageVerified (bool), score (0-1)
       ↓
5. ProcessTrackingService.addLog(seasonDetailId, logId, hash)
   └─ Immutable record on-chain
       ↓
6. TrustworthinessService.processData(TrustedLog)
   ├─ Inputs: verified, imageVerified, location, media counts
   └─ Returns: automated_trust_score (0-100)
       ↓
7. Update Log entity:
   ├─ transaction_hash = tx.hash
   ├─ verified = true
   ├─ image_verified = AI_result
   └─ trust_score = automated_trust_score
```

**What changes**: Nothing in Phase 1. The automated assessment remains as the first layer. This preserves backward compatibility and provides immediate feedback to farmers.

---

### Phase 2: Verification Request (New)

```
8. Backend evaluates whether log requires decentralized verification
   ├─ ALWAYS verify: logs with automated_trust_score < 60
   ├─ RANDOM verify: 20% of logs with score 60-90 (sampling)
   └─ SKIP verify: logs with score > 90 AND no duplicate flags
       ↓
9. If verification required:
   ├─ Create VerificationRequest entity in database:
   │   {
   │     log_id: number
   │     identifier: bytes32 (keccak256 of farm public_id)
   │     blockchain_log_id: number
   │     status: PENDING | IN_PROGRESS | FINALIZED
   │     consensus_result: null | VALID | INVALID
   │     created_at: timestamp
   │     deadline: timestamp (created_at + 7 days)
   │   }
   │
   ├─ Select auditors (see Section: Auditor Selection)
   │
   └─ Notify selected auditors via:
       ├─ Push notification (Firebase — existing infrastructure)
       └─ In-app notification (NotificationService)
```

---

### Phase 3: Auditor Verification (New)

```
10. Auditor retrieves pending verifications
    ├─ GET /api/verification/pending
    └─ Returns: list of VerificationRequests assigned to this auditor
        ↓
11. Auditor fetches verification package for a specific log
    ├─ GET /api/verification/:requestId/package
    └─ Returns:
        {
          log: {
            description, notes, type,
            image_urls: [...],       ← actual images to inspect
            video_urls: [...],
            location: { lat, lng },
            created_at: timestamp
          },
          plot: {
            name, location, size, crop_type
          },
          season: {
            crop_name, current_step, start_date
          },
          blockchain: {
            on_chain_hash: "0xabc...",     ← from ProcessTracking
            automated_trust_score: 75,      ← from TrustComputation
            transaction_hash: "0xdef..."
          },
          verification_context: {
            previous_logs_count: 12,
            farm_transparency_score: 0.72,
            ai_image_analysis: { ... }      ← Google Vision results
          }
        }
        ↓
12. Auditor reviews the evidence:
    ├─ Are the images genuine agricultural activity?
    ├─ Does the GPS location match the declared plot?
    ├─ Is the description consistent with the season's crop/step?
    ├─ Does the on-chain hash match the data shown?
    └─ Are there signs of fabrication or reuse?
        ↓
13. Auditor submits verification vote
    ├─ POST /api/verification/:requestId/vote
    │   Body: { is_valid: boolean }
    │
    ├─ Backend calls:
    │   AuditorRegistry.verify(identifier, logId, isValid)
    │   ├─ Auditor signs this transaction with THEIR OWN wallet  ← P1 resolved
    │   ├─ Contract checks: auditor is active, hasn't voted yet
    │   ├─ Appends vote to on-chain verification array
    │   └─ If votes >= MIN_AUDITORS:
    │       ├─ calculateConsensus() — reputation-weighted majority
    │       └─ finalizeVerification() — rewards/slashing
    │
    └─ Emits events:
        ├─ VerificationSubmitted(identifier, id, auditor, isValid)
        └─ VerificationFinalized(identifier, id, consensus) — if threshold met
```

**Key design decision**: Auditors sign their own transactions using their personal wallets. This means the `verify()` call is NOT routed through the backend's single wallet. The backend provides the data package, but the **on-chain vote is independently signed by the auditor**. This resolves P1 (single-writer pattern) for the verification layer.

---

### Phase 4: Consensus Integration (New)

```
14. Backend listens for VerificationFinalized events
    ├─ Event listener / polling job watches AuditorRegistry contract
    └─ On VerificationFinalized(identifier, id, consensus):
        ↓
15. Update VerificationRequest entity:
    ├─ status = FINALIZED
    └─ consensus_result = consensus ? VALID : INVALID
        ↓
16. Apply consensus outcome to trust score:
    │
    ├─ IF consensus = VALID:
    │   ├─ Log retains its automated_trust_score
    │   ├─ Log.verification_status = VERIFIED
    │   └─ No further action needed
    │
    ├─ IF consensus = INVALID:
    │   ├─ Log.verification_status = REJECTED
    │   ├─ Log.is_active = false (excluded from future calculations)
    │   ├─ Notify farmer: "Log #X was flagged by auditors"
    │   ├─ Notify admin: "Log #X consensus = INVALID, review required"
    │   └─ Flag farm for increased verification sampling rate
    │
    └─ Update step/season transparency scores if affected
        ├─ Recalculate: transparencyService.calcStepTransparencyScore()
        └─ Cascade: season → plot → farm (if step was last)
```

---

### Phase 5: Step Completion (Modified)

```
17. Farmer requests step completion (existing finishStep flow)
        ↓
18. Backend checks:
    ├─ All active logs have verification_status ≠ PENDING
    │   (i.e., either VERIFIED, REJECTED, or SKIPPED)
    └─ If any log still PENDING verification:
        └─ Return: "Cannot complete step — verification in progress"
        ↓
19. Existing flow continues:
    ├─ ProcessTracking.addStep(hash)
    ├─ Calculate step transparency score
    │   ├─ validLogs now = logs with verification_status = VERIFIED
    │   │   OR logs with SKIPPED status AND trust_score >= 80
    │   ├─ invalidLogs = logs with verification_status = REJECTED
    │   │   OR logs with trust_score < 80
    │   └─ Penalty factor amplified for REJECTED logs (3× weight)
    └─ Update step transparency score
```

**What changes in step completion**: The step cannot be completed while verification is pending. This ensures that consensus outcomes are factored into the transparency score, resolving P3 (no on-chain consequences).

---

## New Entities

### VerificationRequest (Database)

```typescript
@Entity('verification_requests')
export class VerificationRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    log_id: number;

    @ManyToOne(() => Log)
    log: Log;

    @Column({ type: 'varchar', length: 66 })
    identifier: string;             // bytes32 keccak256(farm.public_id)

    @Column()
    blockchain_log_id: number;      // log.id used in smart contract

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

### AuditorProfile (Database)

```typescript
@Entity('auditor_profiles')
export class AuditorProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @ManyToOne(() => User)
    user: User;

    @Column({ type: 'varchar', length: 42 })
    wallet_address: string;         // Auditor's own Ethereum address

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ type: 'int', default: 0 })
    total_verifications: number;

    @Column({ type: 'int', default: 0 })
    correct_verifications: number;

    @CreateDateColumn()
    created_at: Date;
}
```

### VerificationAssignment (Database)

```typescript
@Entity('verification_assignments')
export class VerificationAssignment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    verification_request_id: number;

    @ManyToOne(() => VerificationRequest)
    verification_request: VerificationRequest;

    @Column()
    auditor_profile_id: number;

    @ManyToOne(() => AuditorProfile)
    auditor_profile: AuditorProfile;

    @Column({ type: 'boolean', nullable: true })
    vote: boolean | null;           // null = not voted, true/false = voted

    @Column({ type: 'varchar', length: 66, nullable: true })
    vote_transaction_hash: string;  // on-chain tx hash of the vote

    @CreateDateColumn()
    assigned_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    voted_at: Date;
}
```

### Log Entity Changes

```typescript
// Add to existing Log entity:

@Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.SKIPPED })
verification_status: VerificationStatus;
// SKIPPED = not selected for verification (uses automated score only)
// PENDING = awaiting auditor verification
// VERIFIED = auditor consensus = VALID
// REJECTED = auditor consensus = INVALID
```

### New Enums

```typescript
export enum VerificationStatus {
    SKIPPED = 'SKIPPED',
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    REJECTED = 'REJECTED',
}
```

---

## New API Endpoints

### Auditor Registration

```
POST /api/verification/auditors/register
    Role: ADMIN (only admin can approve auditor registrations)
    Body: RegisterAuditorDto { wallet_address: string, name: string }
    Flow:
        1. Create AuditorProfile in database
        2. Auditor calls AuditorRegistry.registerAuditor() themselves
           (staking ETH from their own wallet)
        3. Backend verifies on-chain registration matches DB record
    Response: { auditor_profile_id, wallet_address, status }
```

### Auditor Tasks

```
GET /api/verification/pending
    Role: AUDITOR
    Returns: Assigned VerificationRequests with status=PENDING for this auditor
    Query: Filter by deadline, status

GET /api/verification/:requestId/package
    Role: AUDITOR (must be assigned to this request)
    Returns: Full verification package (log data, images, GPS, context)

POST /api/verification/:requestId/vote
    Role: AUDITOR
    Body: { is_valid: boolean, transaction_hash: string }
    Flow:
        1. Verify auditor is assigned to this request
        2. Verify transaction_hash corresponds to a real verify() call on-chain
        3. Update VerificationAssignment with vote + tx hash
        4. Check if consensus reached (listen for VerificationFinalized event)
    Response: { vote_recorded: true, consensus_reached: boolean }
```

### Admin Oversight

```
GET /api/admin/verifications
    Role: ADMIN
    Returns: All verification requests with filters (status, date range, farm)

GET /api/admin/verifications/:requestId
    Role: ADMIN
    Returns: Detailed view including all auditor votes, consensus, on-chain data

GET /api/admin/auditors
    Role: ADMIN
    Returns: All auditor profiles with on-chain reputation and stake info
```

### Public Transparency

```
GET /api/verification/log/:logId/status
    Role: PUBLIC (@Public decorator)
    Returns: { verification_status, consensus_result, auditor_count, on_chain_verifications }
    Purpose: Anyone (buyers, consumers) can verify how a log was validated
```

---

## Auditor Selection Strategy

When a log requires verification, the backend selects auditors using this algorithm:

```typescript
async selectAuditors(count: number, excludeFarmId: number): Promise<AuditorProfile[]> {
    // 1. Get all active auditors from database
    const auditors = await this.auditorProfileRepo.find({
        where: { is_active: true },
    });

    // 2. Exclude auditors associated with the same farm (conflict of interest)
    const eligible = auditors.filter(a => a.user.farm_id !== excludeFarmId);

    // 3. Fetch on-chain reputation for each
    const withReputation = await Promise.all(
        eligible.map(async (a) => ({
            ...a,
            reputation: (await this.auditorService.getAuditor(a.wallet_address)).reputationScore,
        }))
    );

    // 4. Sort by reputation (higher reputation = higher priority)
    withReputation.sort((a, b) => b.reputation - a.reputation);

    // 5. Select top N, but add randomness to prevent always-same-auditor patterns
    //    Take top 2× candidates, then randomly select N from that pool
    const pool = withReputation.slice(0, count * 2);
    const selected = shuffleAndTake(pool, count);

    return selected;
}
```

**Why not purely on-chain selection**: On-chain randomness is expensive and complex (requires Chainlink VRF or commit-reveal). For a thesis-level project, off-chain selection with on-chain enforcement (only assigned auditors can vote) is a reasonable trade-off. Document this as a limitation.

---

## Auditor Wallet Architecture

### The Key Design Decision

Auditors interact with the blockchain **directly from their own wallets**, not through the backend's wallet. This is what resolves P1 (single-writer pattern):

```
CURRENT (single writer):
    All txns: Backend wallet → Contract

PROPOSED (multi-writer):
    Log/Step hashing: Backend wallet → ProcessTracking (unchanged)
    Trust scoring:    Backend wallet → TrustComputation (unchanged)
    Verification:     Auditor wallet → AuditorRegistry  ← NEW: independent signers
```

### How This Works in Practice

```
1. Auditor registers on the platform (creates user account with AUDITOR role)
2. Auditor provides their Ethereum wallet address (MetaMask, etc.)
3. Auditor stakes ETH by calling registerAuditor() from THEIR wallet
4. When assigned a verification:
   a. Auditor reviews data via the backend API
   b. Auditor submits vote by calling verify() from THEIR wallet
   c. Backend records the transaction hash for tracking
5. The backend CANNOT vote on behalf of auditors
6. The backend CANNOT modify auditor reputations
7. The backend CANNOT prevent consensus finalization
```

### What the Backend Still Controls

The backend retains authority over:
- **Data presentation**: Which data the auditor sees in the verification package
- **Auditor assignment**: Which auditors are selected for a given log
- **Verification triggering**: Which logs get sent to verification

These are acknowledged limitations. The backend could theoretically show incomplete data to auditors, but auditors can independently verify the on-chain hash against the data they receive, detecting any tampering.

---

## Smart Contract Changes Required

### AuditorRegistry.sol — Additions

```solidity
// 1. Auditor assignment mapping (prevents unauthorized voting)
mapping(bytes32 => mapping(uint64 => mapping(address => bool))) public assignedAuditors;

// 2. Verification deadlines
mapping(bytes32 => mapping(uint64 => uint256)) public verificationDeadlines;

// 3. New function: request verification (called by backend)
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

// 4. Modify verify() to check assignment
function verify(bytes32 identifier, uint64 id, bool isValid) external {
    require(assignedAuditors[identifier][id][msg.sender], "Not assigned");
    require(block.timestamp <= verificationDeadlines[identifier][id], "Deadline passed");
    // ... existing logic
}

// 5. New function: finalize expired verifications
function finalizeExpired(bytes32 identifier, uint64 id) external {
    require(block.timestamp > verificationDeadlines[identifier][id], "Not expired");
    Verification[] storage v = verifications[identifier][id];
    require(v.length > 0, "No votes");
    bool consensus = calculateConsensus(identifier, id);
    finalizeVerification(identifier, id, consensus);
    // Slash non-voters (assigned but didn't vote)
}

// 6. New event
event VerificationRequested(
    bytes32 indexed identifier,
    uint64 indexed id,
    address[] auditors,
    uint256 deadline
);
```

---

## Module Structure

```
src/modules/verification/
├── verification.module.ts
├── verification.controller.ts          ← API endpoints
├── verification.service.ts             ← Core flow orchestration
├── auditor-selection.service.ts        ← Auditor selection logic
├── verification-listener.service.ts    ← Blockchain event listener
├── entities/
│   ├── verification-request.entity.ts
│   ├── verification-assignment.entity.ts
│   └── auditor-profile.entity.ts
├── dtos/
│   ├── submit-vote.dto.ts
│   ├── verification-package.dto.ts
│   └── create-verification-request.dto.ts
└── enums/
    └── verification-status.enum.ts

src/modules/blockchain/
├── auditor/
│   └── auditor.service.ts              ← AuditorRegistry contract calls (fix existing)
├── ...existing files...
```

---

## How Each Problem Is Resolved

### P1: Single-writer pattern → Multi-writer for verification

**Before**: `Backend wallet` → all contracts
**After**: `Backend wallet` → ProcessTracking, TrustComputation
         `Auditor wallets` → AuditorRegistry (independently signed)

The verification layer now has multiple independent writers. The backend cannot forge auditor votes because each vote requires the auditor's private key signature.

### P2: Backend-supplied inputs → Independent verification

**Before**: Backend sets `verified = true` → score computed from this unverifiable claim
**After**: Backend provides initial automated assessment → auditors independently verify → consensus determines final validity

The `verified` boolean is no longer the sole determinant of trust. Auditor consensus provides an independent signal that the backend cannot fabricate.

### P3: No on-chain consequences → Consensus blocks step completion

**Before**: Trust score stored on-chain but never affects system behavior
**After**: Negative consensus → log deactivated → step transparency score decreases → farm score decreases. Steps cannot be completed while verification is pending.

Consensus outcomes have concrete, measurable impact on the transparency scoring pipeline.

### P4: AuditorRegistry disconnected → Fully integrated

**Before**: Smart contract deployed but no backend service, no endpoints, no data flow
**After**: `AuditorService` connects to contract, `VerificationService` orchestrates the flow, `VerificationController` exposes endpoints, event listener processes consensus outcomes

### P5: No game-theoretic security → Staking + slashing + reputation

**Before**: No economic consequence for any participant
**After**: Auditors stake ETH to participate. Dishonest votes cost 0.1 ETH + 5 reputation points. Progressive deactivation removes persistent bad actors. The asymmetric 5:2 penalty/reward ratio makes dishonesty a negative-expected-value strategy.

### P6: Backend as ultimate authority → Distributed authority

**Before**: Backend decides validity, computes scores, controls all writes
**After**: Backend handles data ingestion and automated analysis (Phase 1). Auditors handle validity determination (Phase 2). Smart contract handles consensus and incentives (autonomous). No single party can unilaterally determine a log's final trust status.

---

## Sequence Diagram: Complete New Flow

```
    Farmer              Backend              ProcessTracking     TrustComputation    AuditorRegistry       Auditors
      │                    │                       │                    │                   │                  │
      │  Submit Log        │                       │                    │                   │                  │
      │───────────────────>│                       │                    │                   │                  │
      │                    │                       │                    │                   │                  │
      │                    │  Save to DB           │                    │                   │                  │
      │                    │  Image Verification   │                    │                   │                  │
      │                    │                       │                    │                   │                  │
      │                    │  addLog(hash)         │                    │                   │                  │
      │                    │──────────────────────>│                    │                   │                  │
      │                    │                       │                    │                   │                  │
      │                    │  processData(inputs)  │                    │                   │                  │
      │                    │──────────────────────────────────────────>│                   │                  │
      │                    │                       │      score = 65   │                   │                  │
      │                    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤                   │                  │
      │                    │                       │                    │                   │                  │
      │                    │  Score < 90 → needs verification          │                   │                  │
      │                    │  Select auditors      │                    │                   │                  │
      │                    │                       │                    │                   │                  │
      │                    │  requestVerification(id, auditors, deadline)                   │                  │
      │                    │──────────────────────────────────────────────────────────────>│                  │
      │                    │                       │                    │                   │                  │
      │                    │  Notify auditors      │                    │                   │                  │
      │                    │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─>│
      │                    │                       │                    │                   │                  │
      │  Log submitted     │                       │                    │                   │                  │
      │  (pending review)  │                       │                    │                   │                  │
      │<───────────────────│                       │                    │                   │                  │
      │                    │                       │                    │                   │                  │
      │                    │                       │                    │                   │  GET /pending    │
      │                    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
      │                    │  return pending list   │                    │                   │                  │
      │                    │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─>│
      │                    │                       │                    │                   │                  │
      │                    │                       │                    │                   │  GET /package    │
      │                    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
      │                    │  return log + images + GPS + hash          │                   │                  │
      │                    │─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─>│
      │                    │                       │                    │                   │                  │
      │                    │                       │                    │                   │                  │
      │                    │                       │                    │   verify(id,true)  │   Auditor 1     │
      │                    │                       │                    │                   │<─────────────────│
      │                    │                       │                    │                   │                  │
      │                    │                       │                    │   verify(id,true)  │   Auditor 2     │
      │                    │                       │                    │                   │<─────────────────│
      │                    │                       │                    │                   │                  │
      │                    │                       │                    │  MIN_AUDITORS met  │                  │
      │                    │                       │                    │  consensus = VALID │                  │
      │                    │                       │                    │  reward auditors   │                  │
      │                    │                       │                    │                   │                  │
      │                    │  Event: VerificationFinalized(id, true)    │                   │                  │
      │                    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤                  │
      │                    │                       │                    │                   │                  │
      │                    │  Update log:           │                    │                   │                  │
      │                    │  verification_status   │                    │                   │                  │
      │                    │  = VERIFIED            │                    │                   │                  │
      │                    │                       │                    │                   │                  │
      │  Notification:     │                       │                    │                   │                  │
      │  "Log verified"    │                       │                    │                   │                  │
      │<───────────────────│                       │                    │                   │                  │
```

---

## Trust Score Impact Matrix

| Scenario | Automated Score | Consensus | Final Effective Score | Step Impact |
|----------|----------------|-----------|----------------------|-------------|
| High AI score, consensus VALID | 95 | VALID | 95 (unchanged) | Counts as valid log |
| High AI score, consensus INVALID | 92 | INVALID | Log deactivated | Excluded from step calculation |
| Low AI score, consensus VALID | 55 | VALID | 55 (unchanged, but verified) | Counts as valid if ≥ threshold |
| Low AI score, consensus INVALID | 40 | INVALID | Log deactivated | Excluded + farm flagged |
| Any score, verification SKIPPED | 95 | N/A | 95 | Normal flow (automated only) |
| Any score, verification PENDING | 70 | N/A | 70 (provisional) | Step cannot be completed |

---

## Implementation Priority

| Priority | Component | Effort | Impact |
|----------|-----------|--------|--------|
| 1 | Fix `AuditorService` (wrong contract address env var) | 1 hour | Unblocks everything |
| 2 | Add AUDITOR role to UserRole enum | 30 min | Enables auditor auth |
| 3 | Create verification entities + migration | 1 day | Database foundation |
| 4 | Create `VerificationModule` with core service | 2-3 days | Core flow |
| 5 | Add verification endpoints (controller) | 1 day | API layer |
| 6 | Modify `AuditorRegistry.sol` (assignment + deadline) | 1-2 days | Smart contract |
| 7 | Event listener for `VerificationFinalized` | 1 day | Closes the loop |
| 8 | Modify `finishStep()` to check verification status | 0.5 day | Enforcement |
| 9 | Notification integration | 0.5 day | UX |
| 10 | Admin dashboard endpoints | 1 day | Oversight |

**Total estimated effort**: ~8-10 days for a working implementation.

---

## Academic Defense Points

When presenting this flow, emphasize:

1. **The trust model transformation**: From "the operator says it's valid" → "multiple independent staked parties agree it's valid"
2. **Why blockchain is necessary HERE**: The `verify()` call is signed by the auditor's own wallet — no centralized system can guarantee that a vote was independently submitted without trusting the operator
3. **The game theory**: Dishonest voting has negative expected value (lose 0.1 ETH + 5 reputation, gain only 2 reputation if correct). Show the payoff matrix
4. **The practical trade-off**: Phase 1 (automated) provides speed, Phase 2 (decentralized) provides trust. Not every log needs full verification — only suspicious or sampled ones
5. **The closed loop**: Consensus → score impact → farm ranking → market visibility. Dishonest farming behavior has economic consequences through the entire pipeline
