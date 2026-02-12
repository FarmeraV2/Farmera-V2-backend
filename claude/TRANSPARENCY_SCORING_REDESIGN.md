# Transparency Scoring Redesign: Academic Evaluation and Formal Framework

---

## Part 1: Is TrustComputation Redundant?

### What TrustComputation Currently Does

The `TrustComputation` contract performs two functions:

**Function A — Log-level scoring** (`LogDefaultTrustPackage`):
```
Score = 0.20 × Provenance(verified)
      + 0.30 × ImageProvenance(imageVerified)
      + 0.30 × SpatialPlausibility(distance)
      + 0.20 × EvidenceCompleteness(imageCount, videoCount)
```

**Function B — Step-level scoring** (`StepTransparencyPackage`):
```
Score = (0.60 × LogCoverage + 0.40 × ActivityRatio) × PenaltyFactor
```

### Why It Is Redundant

**Problem 1: The contract computes from backend-supplied booleans.**

The two highest-weighted inputs to Function A — `verified` (20%) and `imageVerified` (30%) — are **booleans set by the backend**. The contract has no way to verify them. It is a deterministic calculator applied to inputs it cannot validate. The same formula could run in TypeScript with identical results.

**Problem 2: If auditors verify logs, the contract's inputs become obsolete.**

With decentralized verification, the auditor consensus replaces the role of `verified` and `imageVerified`. The auditors **are** the verification. A separate smart contract to "compute trust" from those booleans becomes a redundant intermediary.

**Problem 3: Step-level scoring (Function B) is already partially off-chain.**

The backend (`TransparencyService.calcStepTransparencyScore`) queries log trust scores from the blockchain, then counts valid/invalid logs, then sends those counts back to the blockchain for the step formula. The data round-trips: DB → blockchain → backend → blockchain. The backend is already doing the aggregation work.

**Problem 4: Season, plot, and farm scoring are entirely off-chain.**

Layers 3-4 already run in TypeScript with weights defined in `weight.constant.ts`. There is no architectural consistency in having Layer 1-2 on-chain and Layer 3-4 off-chain when the backend controls all inputs regardless.

### Verdict: Partially Redundant

- **Function A (LogDefaultTrustPackage)** becomes redundant if auditor consensus replaces backend-supplied `verified`/`imageVerified`. The spatial and evidence metrics are useful but could be computed by auditors or off-chain.
- **Function B (StepTransparencyPackage)** is useful as an on-chain record of step-level aggregation, but the backend already does the prerequisite aggregation. It adds on-chain auditability of the step score, which has some value.

**Recommendation**: Replace `TrustComputation` with a simpler on-chain structure that stores the **consensus outcome** and a **composite transparency score** rather than computing scores from backend-supplied inputs. The AuditorRegistry consensus IS the trust signal — there is no need for a separate "trust computation" contract to derive trust from it.

---

## Part 2: Moving Image Verification to Auditors

### Current Image Verification Pipeline

The `ImageVerificationService` performs three automated checks:

| Check | Method | Weight | What It Detects |
|-------|--------|--------|-----------------|
| Agricultural relevance | Google Vision API label detection | 35% | Non-farming images (cats, screenshots, etc.) |
| Originality | Google Vision API web detection | 35% | Stock photos, web-sourced images |
| Cross-farm duplication | Perceptual hash (aHash) + Hamming distance | 30% | Same image reused across farms |

### Analysis: Should Auditors Replace This?

**What auditors can do better than AI:**
- Contextual judgment: Is this photo consistent with the described activity? (AI only checks "is it agricultural")
- Temporal consistency: Does this planting photo match the season's current step?
- Geospatial common sense: Does the image match what you'd expect at this GPS location?
- Intentional fraud: Detecting staging, out-of-season crops, borrowed equipment

**What AI does better than auditors:**
- Cross-farm duplicate detection at scale (comparing perceptual hashes across thousands of images)
- Speed (instant vs. days)
- Consistency (no auditor fatigue or bias)
- Cost (nearly free vs. auditor compensation)

### Recommendation: Hybrid Model — AI Pre-filter + Auditor Verification

```
Layer 1 (Automated — keep existing):
    ImageVerificationService runs instantly on log submission
    ├─ Perceptual hashing + duplicate detection (keep — auditors cannot do this at scale)
    ├─ Google Vision agricultural relevance (keep — cheap, fast pre-filter)
    └─ Output: ai_verification_score (0-1), flags[]

Layer 2 (Decentralized — new):
    Auditors review logs flagged by AI OR sampled randomly
    ├─ Auditors see: images + AI analysis results + flags + GPS + description
    ├─ Auditors judge: authenticity, context, consistency
    └─ Output: consensus (VALID/INVALID) via AuditorRegistry

Composite:
    If auditor consensus exists → use it (overrides AI)
    If no auditor review (skipped) → use AI score as fallback
```

**Why not fully replace AI with auditors:**
1. **Latency**: Auditor consensus takes hours/days. Farmers need immediate feedback.
2. **Scale**: If every log needs 2-3 auditors, verification costs grow linearly. AI scales for free.
3. **Duplicate detection**: Auditors cannot manually compare an image against thousands of stored perceptual hashes. This must remain automated.

**Why not keep AI alone:**
1. **AI cannot detect intentional, sophisticated fraud** (real farming photos from a different farm, staged photos)
2. **AI is a centralized oracle** — it creates the same single-authority problem as the backend
3. **No economic accountability** — if AI is wrong, there are no consequences

---

## Part 3: Critical Evaluation of the Current Transparency Algorithm

### Current Architecture

```
Log Trust Score (on-chain, LogDefaultTrustPackage)
    ↓ threshold ≥ 0.8 → valid
Step Transparency (on-chain, StepTransparencyPackage)
    = f(validLogs, invalidLogs, active, unactive, minLogs) × penaltyFactor
        ↓
Season Transparency (off-chain, TransparencyService)
    = 0.60 × ProcessTP + 0.20 × TemporalTP + 0.20 × OutcomeConsistency
        ↓
Plot Transparency (off-chain, TransparencyService)
    = Σ(e^(-λt) × seasonScore) / Σ(e^(-λt))   [exponential decay, λ = ln(2)/6]
        ↓
Farm Transparency (off-chain, TransparencyService)
    = 0.60 × ProcessTP + 0.40 × CustomerTrust
```

### Problems with the Current Algorithm

**Problem 1: Hard threshold at log level destroys information.**

The current system classifies logs as valid (≥ 80/100) or invalid (< 80/100). A log scoring 79 is treated identically to a log scoring 10 — both are "invalid." This binary classification discards the magnitude of the trust score. A log scoring 79 is fundamentally different from a log scoring 20, but both contribute equally to the `invalidLogs` count in `StepTransparencyPackage`.

**Problem 2: Weights are unjustified.**

The constants `W_ST_TYPE_CARE = 0.50` and `W_ST_TYPE_PREPARE = 0.10` assert that the "care" step is 5× more important than "preparation" for transparency. No empirical data or theoretical model supports this ratio. Similarly, `W_FARM_CUSTOMER_TRUST = 0.40` means customer ratings (a subjective social signal) constitute 40% of the farm's transparency score. This conflates transparency (disclosure of process) with reputation (customer satisfaction).

**Problem 3: CustomerTrustScore ≠ Transparency.**

`calcCustomerTrustScore` computes `avgRating / 5` from product reviews. A farm could have perfect process transparency but poor product quality (low ratings), or excellent ratings but zero process documentation. These measure different constructs. Including customer ratings in a "transparency" score conflates two orthogonal dimensions.

**Problem 4: Temporal transparency is a cliff function.**

```typescript
const temporalScore = Math.max(1 - (deviationDays / maxAcceptableDeviation), 0);
// maxAcceptableDeviation = 14 days
```

This drops linearly to zero at 14 days deviation, then remains at zero forever. A season that finishes 15 days late gets the same temporal score (0) as one that finishes 6 months late. This does not model agricultural reality, where moderate delays are common and acceptable while extreme delays may indicate fraud.

**Problem 5: Exponential decay at plot level conflates recency with reliability.**

The 6-month half-life means a season completed 12 months ago has only 25% weight. This assumes that old transparency data is less reliable, which is not necessarily true. A farm that was rigorously transparent 2 years ago and has had no seasons since is penalized for inactivity, not for poor transparency.

**Problem 6: No uncertainty modeling.**

A farm with 1 season scoring 0.95 gets the same transparency score as a farm with 50 seasons averaging 0.95. The former should have much higher uncertainty. The current algorithm treats a single observation as equally reliable as a large sample — a violation of basic statistical reasoning.

---

## Part 4: Proposed Academic Framework — FTES v2

### Design Principles

1. **Separation of concerns**: Transparency, verification quality, and customer satisfaction are distinct dimensions, not collapsed into one number
2. **Continuous scoring**: No hard thresholds — use the full range of evidence
3. **Uncertainty-aware**: Fewer observations → wider confidence intervals → conservative scoring
4. **Formally grounded**: Each component has a mathematical justification
5. **Auditor-integrated**: Decentralized verification is a first-class input, not a bolt-on

### Proposed Scoring Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  LEVEL 1: LOG EVIDENCE SCORE                                    │
│                                                                 │
│  Evidence Score (Eₗ) — automated, per-log                       │
│  Verification Score (Vₗ) — auditor consensus, per-log           │
│  Composite Log Score: Sₗ = Eₗ × Vₗ                             │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│  LEVEL 2: STEP TRANSPARENCY INDEX                               │
│                                                                 │
│  Documentation Completeness (DC)                                │
│  Verification Ratio (VR)                                        │
│  Temporal Regularity (TR)                                       │
│  Step Index: Iₛ = f(DC, VR, TR)                                │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│  LEVEL 3: SEASON TRANSPARENCY SCORE                             │
│                                                                 │
│  Process Transparency (PT) — weighted step aggregation          │
│  Schedule Adherence (SA) — sigmoid-based temporal model         │
│  Outcome Consistency (OC) — yield deviation analysis            │
│  Season Score: Tₛₙ = weighted geometric mean(PT, SA, OC)       │
└─────────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────────┐
│  LEVEL 4: FARM TRANSPARENCY SCORE                               │
│                                                                 │
│  Bayesian aggregation with uncertainty                          │
│  Prior: Beta(α₀, β₀)                                           │
│  Update: Each season observation updates posterior              │
│  Farm Score: E[Beta(α, β)] with confidence interval             │
└─────────────────────────────────────────────────────────────────┘
```

---

### Level 1: Log Evidence Score

#### 1a. Evidence Score (Automated)

Replace the binary `verified`/`imageVerified` booleans with continuous metrics:

```
Eₗ = w₁ × SpatialPlausibility + w₂ × EvidenceCompleteness
     + w₃ × AIVerificationScore + w₄ × DuplicateScore

where:
    SpatialPlausibility = exp(-d² / 2σ²)     [Gaussian decay, σ = 50m]
    EvidenceCompleteness = (hasImage × 0.5 + hasVideo × 0.3 + hasLocation × 0.2)
    AIVerificationScore = ImageVerificationService.overallScore  [0-1, from existing]
    DuplicateScore = isDuplicate ? 0 : 1

Weights: w₁ = 0.30, w₂ = 0.20, w₃ = 0.30, w₄ = 0.20
```

**Why Gaussian for spatial plausibility**: The current linear decay `(MAX_DISTANCE - dist) / MAX_DISTANCE` penalizes proportionally, but in practice GPS accuracy follows a Gaussian error distribution. A Gaussian decay naturally models the probability that the activity occurred at the declared location given GPS measurement noise.

#### 1b. Verification Score (Auditor Consensus)

```
Vₗ = { consensus_weight,   if auditor consensus exists
     { η,                   if verification skipped (no auditors reviewed)

where:
    consensus_weight = Σ(rᵢ × voteᵢ) / Σ(rᵢ)
        rᵢ = reputation of auditor i
        voteᵢ = 1 if voted VALID, 0 if voted INVALID

    η = 0.7 (default discount for unverified logs — conservative assumption)
```

**Why reputation-weighted instead of simple majority**: An auditor with reputation 80 (proven track record) should carry more weight than one with reputation 50 (new). This is already implemented in `AuditorRegistry.calculateConsensus()`.

#### 1c. Composite Log Score

```
Sₗ = Eₗ × Vₗ

Range: [0, 1]
```

This is a **multiplicative** composition rather than additive. If either evidence is poor (Eₗ → 0) OR verification fails (Vₗ → 0), the composite score approaches zero. This prevents a high automated score from compensating for a negative consensus, or vice versa.

---

### Level 2: Step Transparency Index

Replace the binary valid/invalid counting with continuous aggregation:

```
Iₛ = w₁ × DC + w₂ × VR + w₃ × TR

where:
    DC = Documentation Completeness
    VR = Verification Ratio
    TR = Temporal Regularity
```

#### Documentation Completeness (DC)

```
DC = min(n / n_min, 1) × (1/n) × Σ(Sₗᵢ)

where:
    n = number of active logs
    n_min = minimum required logs for step
    Sₗᵢ = composite log score for log i
```

This combines log count sufficiency with log quality. A step with 10 high-quality logs scores higher than one with 3 mediocre logs, even if both meet minimum requirements.

#### Verification Ratio (VR)

```
VR = n_verified / max(n_total, 1)

where:
    n_verified = logs with auditor consensus = VALID
    n_total = logs submitted for auditor verification
```

If no logs were sent for verification: `VR = η` (default discount).

#### Temporal Regularity (TR)

Replace the current simple gap average with coefficient of variation:

```
TR = 1 - min(CV / CV_max, 1)

where:
    CV = σ(gaps) / μ(gaps)     [coefficient of variation of inter-log time gaps]
    CV_max = 2.0               [maximum acceptable irregularity]
```

**Why coefficient of variation**: The current `calcTimelinessScore` uses absolute gap comparison to a fixed 24-hour expected interval. This fails for steps with different expected frequencies. CV measures regularity relative to the farmer's own logging pattern, which is more robust.

**Weights**: `w₁ = 0.50, w₂ = 0.35, w₃ = 0.15`

---

### Level 3: Season Transparency Score

#### Process Transparency (PT)

```
PT = Σ(wⱼ × Iₛⱼ)    for each step type j

Step type weights (unchanged — these are domain-appropriate):
    PREPARE:      0.10
    PLANTING:     0.10
    CARE:         0.50
    HARVEST:      0.20
    POST_HARVEST: 0.10
```

#### Schedule Adherence (SA)

Replace the cliff function with a **sigmoid**:

```
SA = 1 / (1 + exp(k × (d - d₀)))

where:
    d = actual deviation in days from expected end date
    d₀ = tolerance center (14 days — acceptable deviation)
    k = steepness parameter (0.3 — gradual transition)
```

**Why sigmoid instead of linear cliff**: A sigmoid provides:
- Near 1.0 for small deviations (< 7 days)
- Gradual decline around the tolerance point (7-21 days)
- Asymptotically approaches 0 for extreme deviations (> 30 days)
- Never exactly 0, acknowledging that even very late seasons have some value

```
Sigmoid behavior:
    d = 0 days  → SA ≈ 0.985
    d = 7 days  → SA ≈ 0.891
    d = 14 days → SA ≈ 0.500
    d = 21 days → SA ≈ 0.109
    d = 30 days → SA ≈ 0.007
```

#### Outcome Consistency (OC)

```
OC = exp(-|actual_yield - expected_yield|² / (2 × expected_yield²))

[Gaussian decay — penalizes large deviations quadratically]
```

**Why Gaussian instead of linear**: Linear `1 - |diff|/expected` has the same cliff problem as the temporal score. Gaussian decay penalizes large deviations exponentially more than small ones, matching the intuition that a 5% yield difference is fine but a 50% difference is highly suspicious.

#### Season Composite — Weighted Geometric Mean

```
Tₛₙ = PT^w₁ × SA^w₂ × OC^w₃

where w₁ = 0.65, w₂ = 0.20, w₃ = 0.15
```

**Why geometric mean instead of arithmetic**: The current formula `0.60 × PT + 0.20 × SA + 0.20 × OC` allows a perfect PT (1.0) to compensate for a terrible SA (0.0), yielding 0.60 — arguably too generous. The geometric mean ensures that **all dimensions must be reasonable** for the overall score to be high. If any single dimension is near zero, the composite score drops sharply.

```
Arithmetic: 0.60(1.0) + 0.20(0.0) + 0.20(1.0) = 0.80   ← hides failure
Geometric:  1.0^0.65 × 0.0^0.20 × 1.0^0.15 = 0.00       ← too harsh

Adjusted geometric (with floor of 0.01):
            1.0^0.65 × 0.01^0.20 × 1.0^0.15 = 0.398      ← appropriately strict
```

Use `max(value, 0.01)` before geometric mean to avoid zero-domination while still penalizing severely.

---

### Level 4: Farm Transparency Score — Bayesian Aggregation

This is the most significant academic improvement. Replace the weighted average with **Bayesian updating using a Beta distribution**.

#### Why Bayesian?

The current approach `Σ(e^(-λt) × score) / Σ(e^(-λt))` has these flaws:
1. A farm with 1 season at 0.95 scores identically to one with 50 seasons at 0.95
2. No way to express uncertainty
3. The exponential decay has no theoretical basis for the specific half-life chosen

A Bayesian approach naturally handles all three:

#### Mathematical Framework

Model each farm's transparency as a latent probability `θ ∈ [0, 1]`, drawn from a Beta distribution:

```
Prior:      θ ~ Beta(α₀, β₀)           where α₀ = β₀ = 2 (weak uniform prior)

Likelihood: Each season score sᵢ ∈ [0,1] is treated as a Bernoulli-like observation
            weighted by recency

Posterior:  θ | s₁...sₙ ~ Beta(α₀ + Σ(wᵢ × sᵢ), β₀ + Σ(wᵢ × (1 - sᵢ)))
```

#### Update Rule

For each completed season with score `sᵢ` and recency weight `wᵢ`:

```
α ← α + wᵢ × sᵢ × n_eff
β ← β + wᵢ × (1 - sᵢ) × n_eff

where:
    wᵢ = exp(-λ × tᵢ)         [recency weight, same decay as current]
    n_eff = effective sample size per season (e.g., 5)
    λ = ln(2) / 6              [half-life = 6 months]
```

#### Farm Transparency Score

```
FarmScore = E[θ] = α / (α + β)

Confidence = 1 - Var[θ] / Var_max
           = 1 - (α × β) / ((α + β)² × (α + β + 1)) / 0.25

Display: FarmScore ± confidence_interval
```

#### Concrete Example

```
Farm A: 1 season, score = 0.90
    α = 2 + 1.0 × 0.90 × 5 = 6.50
    β = 2 + 1.0 × 0.10 × 5 = 2.50
    FarmScore = 6.50 / 9.00 = 0.722
    Confidence: LOW (wide interval)

Farm B: 10 seasons, avg score = 0.90
    α = 2 + Σ(wᵢ × 0.90 × 5) ≈ 2 + 38.7 = 40.7
    β = 2 + Σ(wᵢ × 0.10 × 5) ≈ 2 + 4.3 = 6.3
    FarmScore = 40.7 / 47.0 = 0.866
    Confidence: HIGH (narrow interval)

Farm C: 10 seasons, avg score = 0.90, but oldest 8 seasons (recent 2 score 0.5)
    Recency decay reduces old seasons' weight
    FarmScore ≈ 0.65 (dragged down by recent poor performance)
    Confidence: MODERATE
```

**Key insight**: Farm A gets a **lower** score than Farm B despite both having 0.90 season scores. This is the **shrinkage toward the prior** — with limited evidence, the Bayesian model is appropriately conservative. This is academically well-justified (cf. empirical Bayes methods, James-Stein estimation).

---

### What About Customer Trust?

**Remove customer ratings from the transparency score entirely.**

Customer satisfaction and process transparency are orthogonal constructs:

| Concept | Measures | Source |
|---------|----------|--------|
| **Transparency** | How much of the production process is documented and verified | Process logs, auditor verification |
| **Customer Trust** | How satisfied customers are with the product | Product ratings, reviews |

A farm can be fully transparent about producing a mediocre product (high transparency, low ratings) or opaque but produce excellent goods (low transparency, high ratings).

**Proposed**: Report them as **separate scores**:

```typescript
interface FarmScorecard {
    transparency: {
        score: number;          // Bayesian posterior mean
        confidence: number;     // Based on posterior variance
        seasons_evaluated: number;
    };
    customer_satisfaction: {
        score: number;          // avg_rating / 5
        review_count: number;
    };
    // Optional composite for ranking:
    overall_reputation: number; // 0.70 × transparency + 0.30 × satisfaction
}
```

This separation:
1. Prevents gaming (inflating transparency by getting good reviews)
2. Provides clearer signals to consumers
3. Is more academically defensible (measuring distinct constructs separately)

---

## Part 5: Revised Smart Contract Architecture

### What Changes On-Chain

**Remove**: `TrustComputation.sol`, `MetricSelection.sol`, `LogDefaultTrustPackage.sol`, `StepTransparencyPackage.sol`

**Keep**: `ProcessTracking.sol` (immutable data hashing), `AuditorRegistry.sol` (decentralized verification)

**Add**: `TransparencyRecord.sol` — minimal on-chain record of computed scores

```solidity
contract TransparencyRecord {
    struct Score {
        uint64 entityId;
        uint8 entityType;      // 0=log, 1=step, 2=season
        uint64 score;           // Score × 10000 (4 decimal precision)
        uint256 timestamp;
    }

    mapping(bytes32 => mapping(uint64 => Score)) public scores;

    event ScoreRecorded(
        bytes32 indexed identifier,
        uint64 indexed entityId,
        uint8 entityType,
        uint64 score
    );

    function recordScore(
        bytes32 identifier,
        uint64 entityId,
        uint8 entityType,
        uint64 score
    ) external {
        scores[identifier][entityId] = Score({
            entityId: entityId,
            entityType: entityType,
            score: score,
            timestamp: block.timestamp
        });
        emit ScoreRecorded(identifier, entityId, entityType, score);
    }
}
```

### Why This Is Better

| Aspect | Current (TrustComputation) | Proposed (TransparencyRecord) |
|--------|---------------------------|-------------------------------|
| Purpose | Compute scores from backend inputs | Record computed scores for auditability |
| On-chain logic | Complex formula (gas-expensive) | Simple storage (gas-cheap) |
| Trust source | Backend-supplied booleans | Auditor consensus (AuditorRegistry) |
| Score computation | On-chain (unnecessary) | Off-chain (where the data lives) |
| Transparency | Formula auditable, inputs not | Scores auditable, inputs verifiable via ProcessTracking hashes |

The computation moves to the backend where all the data already exists. The blockchain records the **result** alongside the auditor consensus, creating an auditable chain:

```
ProcessTracking: "Log #42 has hash 0xabc..."
AuditorRegistry: "Log #42 consensus = VALID (3 auditors, reputation-weighted)"
TransparencyRecord: "Log #42 evidence score = 0.85, step #7 index = 0.78"
```

Any third party can verify: the data matches the hash, the consensus is legitimate, and the scores follow from the inputs.

---

## Part 6: Complete Revised Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: DATA INGESTION (Backend)                                     │
│                                                                        │
│  Farmer → Log submission → DB storage                                  │
│        → ProcessTracking.addLog(hash)    [immutable on-chain record]   │
│        → AI pre-filter (image verification, duplicate detection)       │
│        → Evidence score Eₗ computed                                    │
└────────────────────────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: DECENTRALIZED VERIFICATION (Auditors + Smart Contract)       │
│                                                                        │
│  Backend → requestVerification (AuditorRegistry)                       │
│  Auditors → review data package → verify() with own wallet             │
│  AuditorRegistry → consensus → rewards/slashing                        │
│  Verification score Vₗ derived from consensus weight                   │
└────────────────────────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: TRANSPARENCY COMPUTATION (Backend — off-chain)               │
│                                                                        │
│  Log:    Sₗ = Eₗ × Vₗ                                                 │
│  Step:   Iₛ = 0.50×DC + 0.35×VR + 0.15×TR                            │
│  Season: Tₛₙ = PT^0.65 × SA^0.20 × OC^0.15  (geometric mean)        │
│  Farm:   Beta posterior update → E[θ] ± confidence                     │
│                                                                        │
│  → TransparencyRecord.recordScore() [on-chain audit trail]            │
└────────────────────────────────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: PUBLIC API                                                   │
│                                                                        │
│  Farm scorecard: {                                                     │
│    transparency: { score, confidence, seasons_evaluated }              │
│    customer_satisfaction: { score, review_count }                       │
│    verification_summary: { verified_logs, consensus_outcomes }         │
│  }                                                                     │
│                                                                        │
│  All verifiable on-chain:                                              │
│    ProcessTracking → data integrity                                    │
│    AuditorRegistry → verification authenticity                         │
│    TransparencyRecord → score auditability                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Part 7: Summary of Changes

### What to Remove
- `TrustComputation.sol` — replaced by off-chain computation + `TransparencyRecord`
- `MetricSelection.sol` — no longer needed (plugin registry for removed contract)
- `LogDefaultTrustPackage.sol` — log scoring moves off-chain, uses auditor consensus
- `StepTransparencyPackage.sol` — step scoring moves off-chain
- `CustomerTrustScore` from transparency calculation — separate construct

### What to Keep
- `ProcessTracking.sol` — still provides immutable hash storage
- `AuditorRegistry.sol` — becomes the primary trust mechanism
- `ImageVerificationService` — AI pre-filter remains (fast, scalable)
- Exponential decay for recency weighting — well-motivated

### What to Add
- `TransparencyRecord.sol` — simple on-chain score recording
- Bayesian aggregation at farm level — uncertainty-aware scoring
- Geometric mean at season level — prevents single-dimension failure hiding
- Sigmoid for temporal score — removes cliff behavior
- Separated scorecard — transparency vs. customer satisfaction

### Academic Contributions

| Current System | Proposed System |
|---------------|----------------|
| Ad-hoc weighted averages | Formally grounded: Bayesian updating, geometric means, sigmoid functions |
| Binary log classification (valid/invalid) | Continuous evidence scoring with auditor consensus integration |
| Transparency = process + customer ratings (conflated) | Transparency and satisfaction as separate, well-defined constructs |
| No uncertainty modeling | Beta posterior with confidence intervals |
| Linear/cliff decay functions | Gaussian and sigmoid decay with theoretical justification |
| All trust from single backend | Hybrid: automated pre-filter + decentralized verification |

### Thesis Framing

The research contribution becomes:

> *"We propose FTES (Farm Transparency and Evaluation System), a hybrid trust framework for agricultural supply chains that combines automated evidence assessment with decentralized consensus verification. The framework uses Bayesian aggregation to model farm-level transparency with explicit uncertainty quantification, geometric mean composition to prevent dimension-masking at the season level, and reputation-weighted auditor consensus to establish data validity without centralized trust. We demonstrate that this approach transforms the trust model from institutional dependence to cryptographic-economic security while maintaining practical scalability through AI-based pre-filtering."*
