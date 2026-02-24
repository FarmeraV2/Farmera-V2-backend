# Can the Multi-Package Trust Model Be Applied in the Redesigned System?

## Analysis of the Paper's Model, Its Current Implementation, and Applicability with Decentralized Verification

---

## 1. What the Paper Proposes (Reconstructed from Implementation)

The paper by Leteane and Ayalew proposes a **multi-package trust model** with three architectural components:

### 1a. MetricSelection — Dynamic Package Registry

A registry that maps `(dataType, context)` → `TrustPackage address`. This enables:
- Different data types to be evaluated by different scoring algorithms
- New trust packages to be deployed and registered without modifying core contracts
- Context-sensitive evaluation (same data type, different scoring in different contexts)

```
Registry state:
    keccak256("log", "default")  → LogDefaultTrustPackage address
    keccak256("step", "default") → StepTransparencyPackage address
    keccak256("log", "organic")  → [future: organic-specific package]
    keccak256("log", "livestock") → [future: livestock-specific package]
```

This is the paper's **core architectural contribution**: the extensibility pattern.

### 1b. TrustComputation — Orchestration Engine

Routes data to the correct TrustPackage via MetricSelection, then stores the computed score with a timestamp. It enforces:
- Each (identifier, id) pair can only be scored once (immutability)
- Empty data is rejected
- Unregistered data types are rejected

### 1c. TrustPackages — Pluggable Scoring Algorithms

Each package implements `computeTrustScore(bytes payload) → uint128`:

**LogDefaultTrustPackage** (individual activity assessment):
```
Score = 0.20 × Provenance(verified)
      + 0.30 × ImageProvenance(imageVerified)
      + 0.30 × SpatialPlausibility(distance)
      + 0.20 × EvidenceCompleteness(imageCount, videoCount)
```

**StepTransparencyPackage** (phase-level aggregation):
```
Score = (0.60 × LogCoverage + 0.40 × ActivityRatio) × PenaltyFactor
```

### 1d. The Paper's Assumption: IoT Data Sources

The paper was designed for supply chains where data originates from **IoT devices** — sensors, GPS trackers, RFID tags. These devices produce structured, machine-generated data with properties that ARE objectively verifiable:

- **Provenance**: Was this data signed by a registered IoT device? (cryptographic verification)
- **Spatial plausibility**: Does the GPS coordinate match the registered facility? (mathematical comparison)
- **Evidence completeness**: Does the data package include all required sensor readings? (structural check)

These metrics work because IoT inputs have **cryptographic attestation** — the device itself signs the data. The trust question is: "Did the data come from a legitimate device at the right location?"

---

## 2. Why the Model Breaks Down in Farmera

### The Critical Difference: Human Data vs. IoT Data

Farmera's data comes from **farmers using a mobile app**, not IoT devices. This changes the trust model fundamentally:

| Property | IoT (Paper's Assumption) | Farmera (Reality) |
|----------|--------------------------|-------------------|
| Data origin | Device with cryptographic identity | Human with app login |
| Provenance verification | Device signature → on-chain verifiable | Backend sets `verified = true` → unverifiable |
| Image provenance | Device attestation of camera capture | Backend runs AI analysis → `imageVerified` boolean |
| Spatial plausibility | GPS sensor reading from registered device | GPS from phone → spoofable, no device attestation |
| Manipulation resistance | Hardware security module in IoT device | None — user controls the phone |

**The paper's formulas assume trustworthy inputs from hardware-attested sources.** When applied to human-submitted data mediated by a centralized backend, the inputs lose their trustworthiness, and the on-chain computation becomes a deterministic function applied to unverifiable claims.

### What Happens Concretely

```
Paper's intent:
    IoT device signs data → on-chain verification of device signature → provenance = TRUE/FALSE
    (The contract CAN verify this independently)

Farmera's implementation:
    Farmer submits data → Backend decides verified = true → sends boolean to contract
    (The contract CANNOT verify this — it trusts the backend)
```

The `verified` and `imageVerified` booleans, which control 50% of the log trust score, are **assertions by the backend, not cryptographic proofs**. The on-chain computation is mathematically correct but epistemologically hollow — it computes trust from untrustworthy inputs.

---

## 3. Can the Multi-Package Pattern Be Applied with Auditor Verification?

### Yes — But With Fundamentally Different Inputs

The multi-package architecture (MetricSelection + TrustPackage interface + TrustComputation orchestrator) is a **sound software engineering pattern** (strategy pattern on-chain). It CAN be repurposed if the inputs change from "backend-supplied booleans" to "on-chain verifiable signals."

### The Key Insight: Redefine What the Packages Evaluate

**Current packages evaluate**: "Did the backend say this data is trustworthy?"
**Redesigned packages should evaluate**: "What does the on-chain evidence say about this data?"

The on-chain evidence available after auditor integration:

| Signal | Source | On-Chain? | Trust Level |
|--------|--------|-----------|-------------|
| Auditor consensus (VALID/INVALID) | AuditorRegistry.calculateConsensus() | Yes | High — multi-party, staked |
| Consensus weight (reputation-weighted ratio) | AuditorRegistry.verifications[] | Yes | High — tamper-proof |
| Number of auditors who voted | AuditorRegistry.verifications[].length | Yes | High |
| Data hash exists | ProcessTracking.getLog(id) | Yes | High — proves data was committed |
| Evidence completeness (image/video count) | Backend-supplied | No | Low — but low impact |
| Spatial plausibility (GPS distance) | Backend-supplied | No | Low — but mathematically verifiable |

### Redesigned LogTrustPackage

```solidity
contract LogAuditorTrustPackage is TrustPackage {
    uint128 constant SCALE = 100;

    // Weight distribution: high-trust on-chain signals dominate
    uint128 constant W_CONSENSUS = 40;          // From AuditorRegistry (on-chain, high trust)
    uint128 constant W_CONSENSUS_STRENGTH = 15; // How many auditors agreed (on-chain)
    uint128 constant W_SPATIAL = 25;            // GPS distance (backend, but mathematically verifiable)
    uint128 constant W_EVIDENCE = 20;           // Evidence completeness (backend, low impact)

    struct LogData {
        uint128 consensusWeight;    // Reputation-weighted consensus score [0-100]
        uint128 auditorCount;       // Number of auditors who voted
        uint128 minAuditors;        // Minimum expected auditors
        uint128 spatialDistance;    // Distance between log and plot (× 1e6)
        uint128 maxDistance;        // Maximum acceptable distance
        uint128 evidenceScore;     // Evidence completeness [0-100]
    }

    function computeTrustScore(bytes calldata payload) external pure returns (uint128) {
        LogData memory d = abi.decode(payload, (LogData));

        // Consensus quality: How strongly did auditors agree?
        uint128 Tc = d.consensusWeight; // Already 0-100 from AuditorRegistry

        // Consensus strength: Were enough auditors involved?
        uint128 Tcs = _min((d.auditorCount * SCALE) / d.minAuditors, SCALE);

        // Spatial plausibility: Gaussian decay
        uint128 Tsp = 0;
        if (d.spatialDistance <= d.maxDistance) {
            // Approximate Gaussian: (1 - d²/max²) clamped to [0, SCALE]
            uint128 ratio = (d.spatialDistance * d.spatialDistance * SCALE)
                          / (d.maxDistance * d.maxDistance);
            Tsp = SCALE - _min(ratio, SCALE);
        }

        // Evidence completeness
        uint128 Te = _min(d.evidenceScore, SCALE);

        return (W_CONSENSUS * Tc
              + W_CONSENSUS_STRENGTH * Tcs
              + W_SPATIAL * Tsp
              + W_EVIDENCE * Te) / SCALE;
    }
}
```

**What changed**: The dominant inputs (55% weight) now come from **on-chain, multi-party, staked sources** (AuditorRegistry). The backend-supplied inputs (45% weight) are either mathematically verifiable (spatial) or low-impact (evidence completeness).

### Redesigned StepTrustPackage

```solidity
contract StepAuditorTrustPackage is TrustPackage {
    uint128 constant SCALE = 100;
    uint128 constant W_COVERAGE = 35;
    uint128 constant W_VERIFICATION_RATE = 35;
    uint128 constant W_ACTIVITY = 15;
    uint128 constant W_CONSENSUS_QUALITY = 15;

    struct StepData {
        uint128 totalLogs;
        uint128 verifiedLogs;       // Logs with consensus = VALID
        uint128 rejectedLogs;       // Logs with consensus = INVALID
        uint128 unverifiedLogs;     // Logs not sent to auditors
        uint128 activeDays;
        uint128 totalDays;
        uint128 minLogs;
        uint128 avgConsensusWeight; // Average consensus weight across verified logs
    }

    function computeTrustScore(bytes calldata payload) external pure returns (uint128) {
        StepData memory d = abi.decode(payload, (StepData));

        // Log coverage: did the farmer document enough?
        uint128 Lc = _min((d.totalLogs * SCALE) / d.minLogs, SCALE);

        // Verification rate: what proportion passed auditor verification?
        uint128 Vr = 0;
        uint128 reviewed = d.verifiedLogs + d.rejectedLogs;
        if (reviewed > 0) {
            Vr = (d.verifiedLogs * SCALE) / reviewed;
        } else {
            Vr = 70; // Default discount for unreviewed steps
        }

        // Activity ratio
        uint128 Ar = (d.activeDays * SCALE) / d.totalDays;

        // Consensus quality: how strong was auditor agreement?
        uint128 Cq = d.avgConsensusWeight;

        // Penalty for rejected logs (amplified)
        uint128 penaltyFactor = SCALE;
        if (d.rejectedLogs > 0) {
            uint128 rejectionRatio = (d.rejectedLogs * SCALE) / (d.totalLogs);
            penaltyFactor = SCALE - _min(rejectionRatio * 4, SCALE); // 4× amplification
        }

        uint128 raw = (W_COVERAGE * Lc
                     + W_VERIFICATION_RATE * Vr
                     + W_ACTIVITY * Ar
                     + W_CONSENSUS_QUALITY * Cq) / SCALE;

        return (raw * penaltyFactor) / SCALE;
    }
}
```

**What changed**: `validLogs`/`invalidLogs` (backend-counted) are replaced by `verifiedLogs`/`rejectedLogs` (auditor consensus outcomes, on-chain verifiable). The `avgConsensusWeight` metric captures HOW strongly the auditors agreed, not just whether they did.

---

## 4. The Critical Question: Does This NEED to Be On-Chain?

### Arguments For Keeping TrustPackages On-Chain

**1. Formula Transparency and Immutability**

The scoring formula is publicly auditable. Anyone can inspect the deployed `LogAuditorTrustPackage` bytecode and verify exactly how scores are calculated. Weights cannot be changed without deploying a new contract and registering it in MetricSelection — which is publicly visible.

Compare with the current system where `weight.constant.ts` can be changed by anyone with server access, invisibly.

**2. End-to-End On-Chain Verifiability**

With auditor inputs coming from AuditorRegistry (on-chain) and the formula running on-chain:

```
ProcessTracking.getLog(id) → proves data was committed (hash)
AuditorRegistry.getVerifications(id) → proves consensus outcome (votes)
TrustComputation.getTrustRecord(id) → proves score follows from inputs (formula)
```

A third party can independently verify the entire chain: data hash → auditor votes → score. No trust in the backend required for verification.

**3. The MetricSelection Pattern Enables Governance**

If scoring weights need to change (e.g., research shows spatial plausibility should weigh more), the process is:
1. Deploy new TrustPackage with updated weights
2. Register it in MetricSelection (public, auditable transaction)
3. Old scores remain computed with old weights (immutable)
4. New scores use new weights (transparent transition)

This provides **on-chain governance of the scoring methodology** — a meaningful property for a system claiming transparency.

### Arguments Against (Why It Might Be Unnecessary)

**1. Gas Cost**

Each `processData()` call costs gas. If the backend already has all the inputs (it queries AuditorRegistry for consensus, then encodes and sends to TrustComputation), the computation is redundant — it's paying gas for a calculation the backend has already implicitly performed.

**2. The Inputs Are Partially Backend-Supplied**

Spatial distance and evidence completeness still come from the backend. The contract cannot verify these. A dishonest backend could feed false spatial data. The on-chain computation gives a false sense of full on-chain verifiability when 45% of inputs are still backend-controlled.

**3. Read-After-Write Overhead**

The current flow already does this wasteful pattern:
```
Backend reads data from DB
    → encodes it for the blockchain
    → pays gas for on-chain computation
    → reads the result from the blockchain event
    → uses the result in TypeScript
```

The computation adds no information the backend doesn't already have.

---

## 5. Verdict: Can It Be Applied?

### Yes, with a specific architectural change

The multi-package pattern CAN be meaningfully applied **if and only if** the dominant inputs come from on-chain sources that the contract can independently reference.

The redesigned `LogAuditorTrustPackage` achieves this by deriving 55% of the score from auditor consensus data (on-chain, verifiable, multi-party). The remaining 45% from backend-supplied metrics is a compromise, but the HIGH-WEIGHT inputs are now trustworthy.

**This inverts the current problem**: Currently, the HIGH-weight inputs (50%) are backend-supplied booleans. In the redesign, the HIGH-weight inputs (55%) are on-chain consensus signals.

### The Multi-Package Pattern's Real Value: Extensibility

The paper's architectural contribution — MetricSelection as a registry for pluggable scoring algorithms — remains valuable regardless of the trust model:

```
Current registrations:
    ("log", "default") → LogAuditorTrustPackage   (general farming logs)
    ("step", "default") → StepAuditorTrustPackage  (general step aggregation)

Future extensibility (paper's vision):
    ("log", "organic")    → OrganicLogTrustPackage    (stricter evidence requirements for organic certification)
    ("log", "livestock")  → LivestockLogTrustPackage  (different spatial tolerances for livestock)
    ("step", "cold-chain") → ColdChainStepPackage     (temperature continuity requirements)
```

Different agricultural contexts legitimately need different evaluation criteria. The MetricSelection pattern handles this cleanly. **This is the paper's strongest contribution and it should be preserved.**

---

## 6. How to Apply It: Concrete Architecture

### Option A: Full On-Chain (Recommended for Thesis)

Keep the `MetricSelection → TrustComputation → TrustPackage` architecture, but modify the TrustPackages to accept auditor consensus data as primary inputs.

```
┌─────────────────────────────────────────────────────────┐
│  AuditorRegistry                                        │
│    verify() → consensus → on-chain record               │
└──────────────────┬──────────────────────────────────────┘
                   │ consensus data (on-chain, queryable)
                   ↓
┌─────────────────────────────────────────────────────────┐
│  TrustComputation                                       │
│    processData(identifier, id, "log", "default", data)  │
│         ↓                                               │
│    MetricSelection.getTrustPackage("log", "default")    │
│         ↓                                               │
│    LogAuditorTrustPackage.computeTrustScore(data)       │
│         ↓                                               │
│    Store score + emit TrustProcessed event              │
└─────────────────────────────────────────────────────────┘

Data payload includes:
    - consensusWeight (from AuditorRegistry — on-chain verifiable)
    - auditorCount (from AuditorRegistry — on-chain verifiable)
    - spatialDistance (from backend — mathematically checkable)
    - evidenceScore (from backend — low impact)
```

**Advantage**: Preserves the paper's architecture. Creates end-to-end on-chain auditability. The TrustPackage pattern enables extensibility for different farming contexts.

**Disadvantage**: Still pays gas for computation. Backend still supplies spatial/evidence inputs.

### Option B: TrustPackage as Cross-Contract Compositor

A more advanced approach: the TrustPackage directly reads from AuditorRegistry on-chain, eliminating the backend as intermediary for consensus data.

```solidity
contract LogAuditorTrustPackageV2 is TrustPackage {
    AuditorRegistry immutable auditorRegistry;

    constructor(address _auditorRegistry) {
        auditorRegistry = AuditorRegistry(_auditorRegistry);
    }

    function computeTrustScore(bytes calldata payload) external view returns (uint128) {
        // Decode only the backend-supplied fields + identifier
        (bytes32 identifier, uint64 logId, uint128 spatialDistance,
         uint128 maxDistance, uint128 evidenceScore) = abi.decode(
            payload,
            (bytes32, uint64, uint128, uint128, uint128)
        );

        // READ DIRECTLY from AuditorRegistry (no backend intermediary)
        AuditorRegistry.Verification[] memory v =
            auditorRegistry.getVerifications(identifier, logId);

        // Compute consensus weight directly
        uint128 validWeight = 0;
        uint128 totalWeight = 0;
        for (uint i = 0; i < v.length; i++) {
            AuditorRegistry.Auditor memory a =
                auditorRegistry.getAuditor(v[i].auditor);
            totalWeight += uint128(a.reputationScore);
            if (v[i].isValid) {
                validWeight += uint128(a.reputationScore);
            }
        }

        uint128 consensusWeight = totalWeight > 0
            ? (validWeight * SCALE) / totalWeight
            : 70; // Default if no verification

        uint128 auditorCount = uint128(v.length);

        // ... rest of scoring formula using these on-chain-derived values
    }
}
```

**Advantage**: The TrustPackage becomes truly self-verifying — it reads consensus data directly from the AuditorRegistry contract. The backend cannot supply fake consensus data because the package reads it independently.

**Disadvantage**: Higher gas cost (cross-contract reads). More complex. Couples TrustPackage to AuditorRegistry (reduces modularity).

### Option C: Off-Chain Computation, On-Chain Record Only

Remove TrustComputation. Compute scores off-chain. Record results using a simple `TransparencyRecord` contract.

**Advantage**: Cheapest, simplest.

**Disadvantage**: Loses the paper's architectural contribution entirely. Cannot cite the paper's model as implemented.

---

## 7. Impact on Previous Evaluation

### What Changes in the Analysis

If you apply Option A or B, the previous evaluation in `BLOCKCHAIN_TRUSTWORTHINESS_ANALYSIS.md` changes:

| Previous Critique | Status After Redesign |
|-------------------|----------------------|
| "Smart contracts compute from backend-supplied booleans" | **Resolved** — dominant inputs come from AuditorRegistry consensus |
| "The contract is a calculator, not a decision-maker" | **Partially resolved** — the contract still computes, but from on-chain evidence rather than backend assertions |
| "Trust scores are trustworthy only if the backend is already trusted" | **Resolved** — 55% of score derives from multi-party, staked, on-chain signals |
| "TrustComputation is redundant" | **Revised** — with auditor consensus as input, the contract provides verifiable composition of multi-source trust signals |
| "Same functionality achievable with a database" | **Weakened** — the cross-contract read pattern (Option B) cannot be replicated centrally without reintroducing trust in the operator |

### What Remains Unchanged

| Critique | Status |
|----------|--------|
| "Backend controls data ingestion" | Still true — farmers submit through the backend |
| "Spatial/evidence inputs are backend-supplied" | Still true — but now only 45% weight instead of 50% |
| "Season/Farm scoring is off-chain" | Still true — higher-level aggregation remains in TypeScript |

### Revised Thesis Framing

Instead of removing TrustComputation, the thesis can now argue:

> *"We adapt the multi-package trust model proposed by Leteane and Ayalew (2024) by replacing backend-supplied attestation booleans with on-chain auditor consensus signals as the primary trust inputs. The MetricSelection pattern is preserved to enable context-specific evaluation — different agricultural products and certification standards can register domain-specific TrustPackages without modifying the core computation engine. This adaptation addresses the original model's limitation when applied to human-submitted (non-IoT) data sources, where device-level cryptographic attestation is unavailable."*

This positions your work as:
1. **Building on** the paper (not discarding it)
2. **Identifying a limitation** (the IoT assumption)
3. **Proposing an adaptation** (auditor consensus replaces device attestation)
4. **Preserving the contribution** (extensible multi-package architecture)

---

## 8. Recommendation

**Use Option A** for the thesis implementation. It:

- Preserves the paper's multi-package architecture (MetricSelection + TrustPackage + TrustComputation)
- Changes the INPUTS, not the ARCHITECTURE
- Is implementable within thesis scope
- Creates a clean story: "Paper → limitation identified → adaptation proposed → implementation validated"

**Present Option B as future work** — it's the ideal architecture but significantly more complex (cross-contract reads, gas optimization, coupling concerns).

**Do NOT use Option C** — it discards the paper's contribution entirely, making it harder to argue that your work builds on established research.

The multi-package pattern is not redundant. **The inputs were wrong, not the pattern.** Fix the inputs (auditor consensus instead of backend booleans), and the architecture becomes meaningful.

---

Sources:
- [Leteane & Ayalew — Improving the Trustworthiness of Traceability Data in Food Supply Chain Using Blockchain and Trust Model (JBBA, 2024)](https://jbba.scholasticahq.com/article/94100-improving-the-trustworthiness-of-traceability-data-in-food-supply-chain-using-blockchain-and-trust-model)
- [Leteane & Ayalew — A Multi-Package Trust Model for Improving the Trustworthiness of Traceability Data in Blockchain-Based Beef Supply Chain (IEEE, 2024)](https://ieeexplore.ieee.org/document/10763673/)
