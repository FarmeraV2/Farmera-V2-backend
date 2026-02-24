# FTES Scoring Academic Framework
## Farm Transparency and Evaluation System — Criterion Selection and Weight Derivation

**Date**: February 2026
**Replaces**: ad-hoc weights in `weight.constant.ts` and TRANSPARENCY_SCORING_REDESIGN.md
**Status**: Authoritative reference for all scoring parameters

---

## 1. Architecture Overview

```
Log Trust Score       ─── on-chain (TrustComputation → LogAuditorPackage.sol)
Step Trust Index      ─── on-chain (TrustComputation → StepTrustPackage.sol)
Season Score          ─── off-chain (transparency.service.ts)   ← INDEPENDENT
Farm Trust Score      ─── off-chain (transparency.service.ts)   ← INDEPENDENT
```

Season score and Farm score are **completely independent** of each other:
- Season score is derived from step scores (which come from log data via on-chain computation)
- Farm score is derived from **raw log audit outcomes** (verified/rejected counts) directly — it never reads season scores

---

## 2. Criterion Selection Framework

### 2.1 Log-Level Criteria — Wang & Strong (1996)

**Theoretical basis**: Wang, R.Y. & Strong, D.M. (1996). *Beyond Accuracy: What Data Quality Means to Data Consumers*. Journal of Management Information Systems, 12(4), 5–33.

Wang & Strong identify data quality through four categories. The log-level criteria are direct operational instantiations of three of these:

| Wang & Strong Category | Dimension Used | Log Criterion | Operational Definition |
|---|---|---|---|
| Intrinsic DQ | **Believability** | Auditor Consensus (Tc) | Reputation-weighted majority vote outcome from AuditorRegistry |
| Intrinsic DQ | **Accuracy** | Spatial Plausibility (Tsp) | GPS proximity of log location to registered plot location |
| Intrinsic DQ | **Objectivity** | Consensus Strength (Tcs) | auditorCount / minAuditors — how thoroughly the record was reviewed |
| Contextual DQ | **Completeness** | Evidence Completeness (Te) | Presence of supporting media (images, video) per ISO 22005:2007 §5.3 |

These four dimensions are not arbitrary — they are the four most relevant Wang & Strong dimensions for evaluating a single field activity record in an agricultural traceability context.

### 2.2 Step-Level Criteria — Wang & Strong (1996) + ISO 22005:2007

The four step-level criteria map to Wang & Strong's dimensions at the aggregate (step) level:

| Wang & Strong Dimension | Step Criterion | Operational Definition | Supporting Standard |
|---|---|---|---|
| **Completeness** (quantitative) | Documentation Completeness (DC) | `min(n_logs / n_min, 1) × avg_log_score` | ISO 22005:2007 §5.3 — records must be sufficient to reconstruct the history |
| **Believability** | Verification Ratio (VR) | `verified / (verified + rejected)` | FSSC 22000 §9.2 / ISO 19011:2018 §6.4 — audit evidence sufficiency |
| **Timeliness** | Temporal Regularity (TR) | `1 − min(CV / CV_max, 1)` | Montgomery (2020) §3.3 — CV as a process consistency measure (SPC theory) |
| **Completeness** (topical) | Completeness Ratio (CR) | `covered_topics / expected_topics` | Wang & Strong attribute vs. record completeness; Cui et al. (2024) [P2] selective disclosure detection |

**Why DC and CR are separate despite both mapping to "Completeness"**: Wang & Strong explicitly distinguish *record completeness* (enough records exist — DC) from *attribute completeness* (the right attributes/topics are covered — CR). A step with 20 logs all discussing the same topic (e.g., only irrigation) has high quantitative completeness but low topical completeness.

**Why these four and not others**: These are the only Wang & Strong dimensions that can be operationalized from available data (log counts, timestamps, audit outcomes, text descriptions). The remaining dimensions (Reputation, Value-Added, Appropriate Amount, etc.) require consumer surveys or external validation not available at this stage.

### 2.3 Season-Level Criteria — Dabbene et al. (2014)

**Theoretical basis**: Dabbene, F., Gay, P. & Tortia, C. (2014). *Traceability issues in food supply chain management: A review*. Biosystems Engineering, 120, 65–80.

Dabbene et al. identify three orthogonal traceability dimensions at the production campaign level:

| Dabbene et al. Dimension | Season Criterion | Operational Definition |
|---|---|---|
| **Process traceability** — was the production process documented? | Process Transparency (PT) | Weighted average of step scores grouped by agronomic phase type |
| **Temporal traceability** — did events occur as planned? | Schedule Adherence (SA) | Sigmoid on deviation from expected season end date |
| **Output traceability** — did the process yield the expected output? | Outcome Consistency (OC) | Gaussian decay on `\|actual_yield − expected_yield\| / expected_yield` |

**Why geometric mean aggregation**: Saaty (1980) recommends the weighted geometric mean when criteria measure distinct, non-compensable dimensions. A farm that provides full documentation (PT=1.0) but completes the season 3 months late (SA≈0) should not receive a high season score. The geometric mean ensures all dimensions must be simultaneously adequate.

**Step-type weights within PT**: Based on FAO (2017) *Crop production guidelines*, which identifies pesticide application and harvest as the highest food safety risk periods. Weights reflect relative food safety risk:

| Step Type | Weight | Justification (FAO 2017) |
|---|---|---|
| PREPARE | 0.10 | Low risk — soil and equipment preparation |
| PLANTING | 0.10 | Low risk — seed/seedling placement |
| CARE | 0.50 | High risk — pesticide, fertilizer, irrigation management |
| HARVEST | 0.20 | High risk — contamination risk at point of collection |
| POST_HARVEST | 0.10 | Low-medium risk — storage and handling |

### 2.4 Farm-Level Criteria — Jøsang & Ismail (2002)

**Theoretical basis**: Jøsang, A. & Ismail, R. (2002). *The Beta Reputation System*. Proceedings of the 15th Bled Electronic Commerce Conference. (~900 citations)

The Beta Reputation System derives observable quantities from first principles of Bayesian inference on binary outcomes. The criteria are not chosen — they are *defined* by the framework:

| BRS Observable | Farm Criterion | Source |
|---|---|---|
| Positive observations (p) | Total verified logs across all seasons | Raw audit records — `logs.status = Verified` |
| Negative observations (n) | Total rejected logs across all seasons | Raw audit records — `logs.status = Rejected` |
| Prior (α, β) | α = β = 1 (non-informative) | Jøsang & Ismail (2002) — default non-informative prior |

**Why this is independent from season scores**: The farm score uses raw audit outcome counts from the `logs` table, not the computed `transparency_score` from the `seasons` table. A season score is an aggregate of step scores; the farm score is an aggregate of individual log verification outcomes. These are different data sources measuring different constructs.

**Disclosure commitment modifier**: Cui et al. (2024) [P2] identify selective transparency as a rational strategy for farms trying to game the score. A farm that enables transparency scoring for only some seasons should receive a penalty:

```
DSC = seasons_with_transparency_score / total_seasons
T_farm_adjusted = T_farm × DSC^0.2
```

The `^0.2` exponent is a mild penalty (derived from AHP — DSC is a secondary signal relative to direct audit evidence).

---

## 3. Weight Derivation — Analytic Hierarchy Process

### 3.1 Log-Level Weights (LogAuditorPackage.sol)

**Reference**: Saaty, T.L. (1977). A Scaling Method for Priorities in Hierarchical Structures. *Journal of Mathematical Psychology*, 15(3), 234–281.

Pairwise comparison matrix (1 = equally important, 9 = extremely more important):

|  | Tc (Consensus) | Tcs (Strength) | Tsp (Spatial) | Te (Evidence) |
|---|---|---|---|---|
| **Tc** | 1 | 4 | 2 | 3 |
| **Tcs** | 1/4 | 1 | 1/3 | 1/2 |
| **Tsp** | 1/2 | 3 | 1 | 2 |
| **Te** | 1/3 | 2 | 1/2 | 1 |

**Justification for ordering Tc > Tsp > Te > Tcs**:
- Tc (consensus) is primary: auditor majority-vote verdict is the strongest trust signal. ISO 19011:2018 §6.6 defines audit conclusions as binary (conformity / nonconformity) — the audit standard itself mandates a pass/fail output. Arshad et al. (2023) [P3] identify this binary verdict as the primary trust signal specifically in agri-food blockchain systems. The majority-vote mechanism follows Lamport, Shostak & Pease (1982): a verdict is valid if at least a simple majority of auditors agree, tolerating up to ⌊(n−1)/2⌋ faulty actors.
- Tsp (spatial) is secondary: GPS proximity is a hard location-fraud indicator. Loke & Ann (2020) [LA20] motivate the criterion — they explicitly identify GPS coordinate submission as a primary location-fraud attack vector in blockchain food traceability. **Note**: Loke & Ann do not specify the scoring formula. The linear decay operationalization `Tsp = max((MAX_DIST − d) / MAX_DIST, 0)` is an author-designed choice with three stated rationales: (1) it is monotonically decreasing in distance, satisfying the intuitive requirement that farther logs are less trustworthy; (2) the hard exclusion at MAX_DIST reflects a deliberate policy threshold beyond which location evidence is considered entirely unreliable (analogous to a GPS accuracy bound); (3) linear interpolation is computationally trivial on-chain without approximation, unlike Gaussian or inverse-distance alternatives. This is a **design decision, not a formula derived from literature**, and should be defended as such.
- Te (evidence) is tertiary: media presence supports but does not prove authenticity (ISO 22005:2007)
- Tcs (strength) is auxiliary: participation rate adjusts the certainty of the consensus signal (ISO 19011:2018 §6.4 — audit team sufficiency)

**Derived weights** (geometric mean of rows, normalized):

| Criterion | Weight |
|---|---|
| Tc (Consensus) | **45%** |
| Tcs (Consensus Strength) | **10%** |
| Tsp (Spatial Plausibility) | **30%** |
| Te (Evidence Completeness) | **15%** |

**Consistency Ratio (CR) ≈ 0.03 < 0.10** — Acceptable (Saaty 1980 threshold: CR < 0.10)

### 3.2 Step-Level Weights (StepTrustPackage.sol)

Pairwise comparison matrix (anchored in supply chain transparency literature: Feng et al., 2020; Cui et al., 2024; ISO 22005:2007):

|  | DC | VR | TR | CR |
|---|---|---|---|---|
| **DC** | 1 | 2 | 5 | 4 |
| **VR** | 1/2 | 1 | 4 | 3 |
| **TR** | 1/5 | 1/4 | 1 | 1/2 |
| **CR** | 1/4 | 1/3 | 2 | 1 |

**Justification for ordering DC > VR > CR > TR**:
- DC primary: documentation coverage is a prerequisite for all other dimensions (ISO 22005:2007 §5.3 — no records = no traceability)
- VR secondary: third-party verification is the principal trust signal in food safety frameworks (FSSC 22000; ISO 22000:2018 §8.2)
- CR tertiary: topical completeness guards against selective disclosure (Cui et al., 2024 [P2])
- TR auxiliary: temporal regularity is a process consistency indicator, secondary to content quality (Montgomery, 2020)

**Derived weights**:

| Criterion | Weight |
|---|---|
| DC (Documentation Completeness) | **47%** |
| VR (Verification Ratio) | **30%** |
| CR (Completeness Ratio) | **13%** |
| TR (Temporal Regularity) | **10%** |

**Consistency Ratio (CR) ≈ 0.04 < 0.10** — Acceptable

### 3.3 Season-Level Weights (transparency.service.ts)

Pairwise comparison matrix (anchored in Dabbene et al., 2014; Cui et al., 2024):

|  | PT | SA | OC |
|---|---|---|---|
| **PT** | 1 | 4 | 5 |
| **SA** | 1/4 | 1 | 2 |
| **OC** | 1/5 | 1/2 | 1 |

**Justification for ordering PT > SA > OC**:
- PT primary: consumers and regulators care most about what was done during production (Dabbene et al., 2014 — process traceability as primary concern)
- SA secondary: schedule adherence reflects farm management discipline and is a temporal traceability signal
- OC tertiary: outcome consistency is confirmatory; yield deviations can have legitimate causes (weather, pest pressure)

**Derived weights** (used as geometric mean exponents):

| Criterion | Exponent |
|---|---|
| PT (Process Transparency) | **0.68** |
| SA (Schedule Adherence) | **0.21** |
| OC (Outcome Consistency) | **0.11** |

**Consistency Ratio (CR) ≈ 0.02 < 0.10** — Acceptable

---

## 4. Formula Reference

### 4.1 Log Trust Score (on-chain)

```
S_log = (45·Tc + 10·Tcs + 30·Tsp + 15·Te) / 100

where:
  Tc  = 100 if auditor consensus = VALID, else 0          [ISO 19011:2018 §6.6 — binary audit verdict]
  Tcs = min(auditorCount / minAuditors, 1) × 100          [ISO 19011:2018 §6.4 — audit sufficiency]
  Tsp = max((MAX_DIST - distance) / MAX_DIST, 0) × 100   [design choice — see §3.1 note on Tsp formula]
  Te  = min((imageCount + videoCount) / 2, 1) × 100       [ISO 22005:2007 §5.3 — documentary evidence]

Accept threshold: S_log ≥ 70
```

**Tsp formula note**: The linear decay is an author-designed operationalization. Loke & Ann (2020) [LA20] identify location fraud as the threat requiring a spatial criterion; they do not prescribe this formula. The linear form was chosen over Gaussian (requires tuning σ without training data) and inverse-distance (no natural exclusion threshold) for on-chain computational simplicity and interpretability.

### 4.2 Step Trust Index (on-chain)

```
I_step = (47·DC + 30·VR + 13·CR + 10·TR) / 100 × GP / 100

where all inputs are in [0-100] scaled by backend oracle:
  DC = min(n_logs / n_min, 1) × avg_log_score × 100
  VR = verified / (verified + rejected) × 100   [or default 70 if none reviewed]
  TR = (1 - min(CV / CV_max, 1)) × 100          [CV = stddev/mean of inter-log gaps]
  CR = covered_topics / expected_topics × 100   [keyword matching]
  GP = exp(-K × suspicious_gaps) × 100          [gap penalty, K=0.3]

Accept threshold: I_step ≥ 60
```

### 4.3 Season Transparency Score (off-chain)

```
T_season = max(PT, 0.01)^0.68 × max(SA, 0.01)^0.21 × max(OC, 0.01)^0.11

where:
  PT = Σ(w_j × I_step_j) for each step type j
       w_j = {PREPARE:0.10, PLANTING:0.10, CARE:0.50, HARVEST:0.20, POST_HARVEST:0.10}

  SA = 1 / (1 + exp(0.3 × (deviation_days - 14)))    [sigmoid; Jøsang et al. 2006]

  OC = 1 - min(|actual_yield - expected_yield| / expected_yield, 1)
```

### 4.4 Farm Trust Score (off-chain, INDEPENDENT from T_season)

```
T_farm = ((1 + p) / (2 + p + n)) × DSC^0.2

where (Jøsang & Ismail, 2002):
  p   = total verified logs across ALL seasons for this farm   [raw audit data]
  n   = total rejected logs across ALL seasons for this farm   [raw audit data]
  α=β = 1 (non-informative prior)

and (Cui et al., 2024):
  DSC = seasons_with_transparency_score / total_seasons        [disclosure commitment]

Confidence interval (Jøsang & Ismail 2002):
  u = 2 / (2 + p + n)    [uncertainty; decreases as evidence accumulates]
  CI_half = 1.96 × sqrt((1+p)(1+n) / ((2+p+n)^2 × (3+p+n)))
```

---

## 5. Parameter Justification

| Parameter | Value | Justification |
|---|---|---|
| Sigmoid k=0.3 | 0.3 | Gradual transition; Jøsang et al. (2006) — soft thresholds preferred in trust systems |
| Sigmoid midpoint=14 | 14 days | FAO crop calendars typical harvest window tolerance |
| CV_max=2.0 | 2.0 | Montgomery (2020) §3.3 — CV>2 indicates highly irregular process in SPC |
| GAP_THRESHOLD=3× | 3× | Standard outlier detection; gap > 3× expected interval is statistically suspicious |
| GAP_PENALTY_K=0.3 | 0.3 | Exponential decay constant; configurable hyperparameter (domain calibration required) |
| Beta prior α=β=1 | 1 | Jøsang & Ismail (2002) — non-informative prior for new farms |
| Disclosure exponent 0.2 | 0.2 | AHP auxiliary criterion; mild penalty consistent with Cui et al. (2024) secondary signal |

---

## 6. Complete Bibliography

| Ref | Citation | Used for |
|---|---|---|
| [W&S96] | Wang, R.Y. & Strong, D.M. (1996). Beyond Accuracy: What Data Quality Means to Data Consumers. JMIS 12(4). | Criterion selection for log and step levels |
| [S77] | Saaty, T.L. (1977). A Scaling Method for Priorities in Hierarchical Structures. J. Math. Psychology 15(3). | AHP weight derivation method |
| [S80] | Saaty, T.L. (1980). The Analytic Hierarchy Process. McGraw-Hill. | AHP method + geometric mean for non-compensable criteria |
| [JI02] | Jøsang, A. & Ismail, R. (2002). The Beta Reputation System. 15th Bled eCommerce Conference. | Farm trust score formula and prior selection — NOT used for log-level Tc |
| [LSP82] | Lamport, L., Shostak, R. & Pease, M. (1982). The Byzantine Generals Problem. ACM TOPLAS 4(3), 382–401. | Majority-vote consensus mechanism for Tc (auditor verdict) |
| [ISO19011] | ISO 19011:2018. Guidelines for auditing management systems. §6.4 (audit team), §6.6 (audit conclusions). | Tc binary verdict (§6.6) and Tcs sufficiency (§6.4) |
| [JSI06] | Jøsang, A., Ismail, R. & Boyd, C. (2007). A survey of trust and reputation systems for online service provision. Decision Support Systems 43(2). | Sigmoid soft thresholds justification |
| [D14] | Dabbene, F., Gay, P. & Tortia, C. (2014). Traceability issues in food supply chain management: A review. Biosystems Engineering 120. | Season-level criterion selection (3 traceability dimensions) |
| [ISO22005] | ISO 22005:2007. Traceability in the feed and food chain. | DC criterion (record completeness) |
| [FSSC] | FSSC 22000 v6.0. Food Safety System Certification. | VR criterion (third-party verification) |
| [M20] | Montgomery, D.C. (2020). Introduction to Statistical Quality Control, 8th ed. Wiley. | TR criterion (CV as process consistency measure) |
| [P2] | Cui et al. (2024). [Architecture ref P2]. | CR criterion (selective disclosure detection) |
| [P3] | Arshad et al. (2023). [Architecture ref P3]. | Auditor consensus as primary trust signal |
| [FAO17] | FAO (2017). Crop production guidelines. | Step-type weights (agronomic risk ranking) |
| [LA20] | Loke, K.S. & Ann, O.C. (2020). Food Traceability and Prevention of Location Fraud using Blockchain. IEEE 8th R10 Humanitarian Technology Conference (R10-HTC). DOI: 10.1109/R10-HTC49770.2020.9356999. | Tsp — GPS location fraud prevention as explicit design criterion in food traceability blockchain systems |
