# Academic Architecture Review: Farmera V2 — Scholarly Analysis, Comparative Evaluation, and Evidence-Based Improvement Proposals

**Date**: February 11, 2026
**Scope**: Critical academic review of `ARCHITECTURE_AND_WORKFLOW_DESIGN.md` with literature-grounded comparisons and formally structured improvement proposals

---

## Table of Contents

1. [Introduction and Methodology](#1-introduction-and-methodology)
2. [Architecture Summary and Critical Analysis](#2-architecture-summary-and-critical-analysis)
3. [Literature Review — Cited Academic Papers](#3-literature-review)
4. [Scholarly Comparison: Architecture vs. Literature](#4-scholarly-comparison)
5. [Proposed Architectural Improvements](#5-proposed-architectural-improvements)
6. [Conclusions and Recommendations](#6-conclusions-and-recommendations)
7. [Full References](#7-full-references)

---

## 1. Introduction and Methodology

### 1.1 Purpose

This document provides a critical academic review of the Farmera V2 architecture as described in `ARCHITECTURE_AND_WORKFLOW_DESIGN.md`. It evaluates the proposed redesign through the lens of recent peer-reviewed scholarship, identifies both strengths and gaps in the architectural design, and proposes evidence-based improvements grounded in published research.

### 1.2 Methodology

The review follows a structured approach:

1. **Descriptive analysis** of the architecture document, identifying core design patterns and decisions
2. **Systematic literature search** across IEEE Xplore, Springer, Wiley, Frontiers, INFORMS, and the British Blockchain Association for papers published 2023–2025 that address blockchain-based trust management, supply chain transparency, decentralized oracle mechanisms, reputation-based consensus, and scoring methodology
3. **Comparative evaluation** mapping each architectural dimension against the literature
4. **Improvement proposals** structured with: Problem → Scientific Reference → Solution → Benefits → Risks

### 1.3 Scope

The architecture under review encompasses four layers:
- **Smart contract layer** (ProcessTracking, TrustComputation, AuditorRegistry, TrustPackages)
- **Backend service layer** (NestJS modules for verification, scoring, blockchain interaction)
- **Database layer** (PostgreSQL entities for auditors, verification, logs)
- **Scoring algorithm layer** (FTES v2: Bayesian, geometric mean, sigmoid)

---

## 2. Architecture Summary and Critical Analysis

### 2.1 Strengths

The Farmera V2 redesign demonstrates several architecturally sound decisions:

| Strength | Description | Academic Relevance |
|----------|-------------|-------------------|
| **Multi-party trust authority** | Transition from single-wallet backend to auditor consensus with staking | Addresses the "single oracle problem" identified in blockchain oracle literature |
| **Hybrid AI + human verification** | AI serves as a fast pre-filter; auditor consensus provides authoritative verification | Mirrors hybrid oracle architectures in recent literature |
| **Bayesian uncertainty modeling** | Beta posterior for farm-level scoring with confidence intervals | Statistically principled; avoids overconfidence from limited data |
| **Geometric mean composition** | Season scoring prevents single-dimension failure masking | Mathematically superior to arithmetic weighted averages for interdependent dimensions |
| **Sigmoid temporal functions** | Smooth degradation replacing binary cliff thresholds | Eliminates information destruction at arbitrary boundaries |
| **Extensible TrustPackage pattern** | MetricSelection + TrustComputation + TrustPackage preserves domain extensibility | Directly implements Leteane & Ayalew's (2024) framework |
| **Game-theoretic incentive design** | Staking + slashing + reputation creates negative expected value for dishonest voting | Aligns with mechanism design principles from decentralized oracle networks |

### 2.2 Weaknesses and Gaps

| Weakness | Description | Severity |
|----------|-------------|----------|
| **W1: Cold-start problem for auditor pool** | Architecture assumes an active auditor pool but provides no bootstrapping mechanism for initial deployment | HIGH |
| **W2: No formal threat model** | Game-theoretic claims (§11.3) are informal; no Nash equilibrium analysis or formal security proof | MEDIUM |
| **W3: Polling-based event detection** | `VerificationListenerService` polls every 30 seconds instead of using WebSocket event subscriptions | LOW |
| **W4: Fixed verification thresholds** | The 60/90 thresholds for verification routing are static constants, not learned from data | MEDIUM |
| **W5: No data provenance beyond hash** | ProcessTracking stores SHA-256 hashes, but there is no mechanism for consumers to independently reconstruct and verify the hashed data | MEDIUM |
| **W6: Scoring weight justification** | Weights (e.g., W_CONSENSUS=40, W_SPATIAL=25) are stated without empirical derivation or sensitivity analysis | HIGH |
| **W7: No offline/degraded mode** | If the blockchain network is unavailable, the entire verification pipeline stalls | MEDIUM |
| **W8: Limited scalability analysis** | No discussion of gas costs, throughput limits, or performance under high auditor/log volumes | MEDIUM |

### 2.3 Risks

| Risk | Description | Likelihood |
|------|-------------|-----------|
| **R1: Auditor collusion** | Small auditor pool (MIN_AUDITORS=2) increases collusion risk | MEDIUM |
| **R2: Auditor fatigue** | Without rotation or load balancing, high-reputation auditors receive disproportionate tasks | HIGH |
| **R3: Sybil attack on auditor registration** | ADMIN-gated registration mitigates but does not eliminate Sybil risk | LOW |
| **R4: Temporal coupling** | Step completion is blocked by verification; delayed auditors stall farmer workflows | HIGH |
| **R5: Score manipulation via selective logging** | Farmers can choose which activities to log, biasing transparency scores upward | MEDIUM |

---

## 3. Literature Review

### Paper 1 (P1)

**Leteane, O. & Ayalew, Y.** (2024). "Improving the Trustworthiness of Traceability Data in Food Supply Chain Using Blockchain and Trust Model." *The Journal of The British Blockchain Association*, 7(1). DOI: [10.31585/jbba-7-1-(2)2024](https://doi.org/10.31585/jbba-7-1-(2)2024)

**Summary**: Proposes an extensible blockchain-based framework using a multi-trust-packages model (MetricSelection + TrustComputation + TrustPackage) to improve supply chain traceability data trustworthiness. The architecture is designed for IoT device attestation contexts, with modular TrustPackages that can be registered, replaced, or extended without modifying the core computation engine.

**Key Contribution**: The modular TrustPackage pattern that separates metric definition from computation orchestration — directly adopted by Farmera V2.

**Relevance to Farmera**: This is the foundational paper. Farmera V2 preserves the MetricSelection + TrustComputation + TrustPackage architecture but identifies a critical gap: the original model assumes IoT device attestation as input, which breaks down for human-submitted data. The redesign replaces device attestation with auditor consensus signals.

---

### Paper 2 (P2)

**Cui, Y., Gaur, V. & Liu, J.** (2024). "Supply Chain Transparency and Blockchain Design." *Management Science*, 70(5), 3245–3263. DOI: [10.1287/mnsc.2023.4851](https://doi.org/10.1287/mnsc.2023.4851)

**Summary**: Develops an analytical model studying how blockchain design (permissioned vs. permissionless, disclosure rules) affects supply chain transparency and firm behavior. The authors demonstrate that full transparency is not always optimal — firms may strategically withhold information if disclosure increases competitive pressure. The paper formalizes the distinction between *data availability* (storing information on-chain) and *data verifiability* (ensuring the stored information is truthful).

**Key Contribution**: The formal separation of data availability from data verifiability. Storing a hash on-chain guarantees availability and integrity but does NOT guarantee that the original data was truthful.

**Relevance to Farmera**: Directly validates the Farmera V2 diagnosis (§2.2, Issue #1–2): the current system achieves data availability (hashes on-chain) but lacks data verifiability (backend controls all inputs). The auditor consensus redesign addresses verifiability, aligning with Cui et al.'s theoretical framework. However, Farmera V2 does not address the game-theoretic insight that farmers may strategically choose *what* to log, a form of selective transparency.

---

### Paper 3 (P3)

**Arshad, Q., Khan, W.Z., Azam, F., Khan, M.K., Yu, H. & Zikria, Y.B.** (2023). "Blockchain-based decentralized trust management in IoT: systems, requirements and challenges." *Complex & Intelligent Systems*, 9, 6155–6176. DOI: [10.1007/s40747-023-01058-8](https://doi.org/10.1007/s40747-023-01058-8)

**Summary**: Comprehensive survey analyzing Blockchain-based Decentralized Trust Management Systems (BCDTMS) across IoT domains (IoMT, IoV, IIoT, SIoT). The paper identifies six core requirements for effective decentralized trust: (1) transparency, (2) immutability, (3) scalability, (4) privacy, (5) interoperability, and (6) trust evaluation accuracy. The authors review trust models that employ Bayesian inference, Beta distributions, and subjective logic for trust score computation.

**Key Contribution**: The taxonomy of trust management requirements and the identification of Bayesian Beta models as a preferred approach for trust aggregation under uncertainty — particularly when observation counts vary across entities.

**Relevance to Farmera**: Directly supports the Bayesian Beta aggregation model used for farm-level scoring (§7.2). The paper's requirement taxonomy reveals that Farmera V2 addresses transparency, immutability, and trust evaluation accuracy well, but underaddresses **privacy** (auditor votes are publicly visible on-chain, potentially enabling strategic voting based on other auditors' revealed votes) and **scalability** (no gas cost analysis or throughput benchmarking).

---

### Paper 4 (P4)

**Chakrabortty, R.K. & Essam, D.L.** (2023). "Reputation based proof of cooperation: an efficient and scalable consensus algorithm for supply chain applications." *Journal of Ambient Intelligence and Humanized Computing*, 14, 7515–7532. DOI: [10.1007/s12652-023-04592-y](https://doi.org/10.1007/s12652-023-04592-y)

**Summary**: Proposes a Reputation-based Proof of Cooperation (RPoC) consensus algorithm specifically designed for supply chain blockchain applications. RPoC introduces a layered node architecture where participants are segmented by reputation tier, reducing the consensus participant set while maintaining trust. The algorithm incorporates a multi-factor reputation score combining: stake amount, historical accuracy, activity frequency, and elapsed time since last participation.

**Key Contribution**: The multi-factor reputation model for consensus participation and the layered node segmentation strategy that balances inclusivity with efficiency.

**Relevance to Farmera**: The auditor selection algorithm (§5.6) in Farmera V2 uses a simplified version of reputation-weighted selection (sort by reputation, take top 2×count, randomly select count). RPoC's layered approach suggests a more sophisticated alternative: segment auditors into reputation tiers and apply different selection probabilities per tier, ensuring that new auditors (cold-start problem, W1) can still participate while high-reputation auditors are preferred. Additionally, RPoC's multi-factor reputation model (stake + accuracy + activity + time) is more comprehensive than Farmera's single-factor on-chain reputation score.

---

### Paper 5 (P5)

**Manoj, T., Makkithaya, K., Narendra, V.G. & Vijaya Murari, T.** (2025). "Blockchain oracles for decentralized agricultural insurance using trusted IoT data." *Frontiers in Blockchain*, 7, 1481339. DOI: [10.3389/fbloc.2024.1481339](https://doi.org/10.3389/fbloc.2024.1481339)

**Summary**: Introduces the AgriInsureDON framework combining blockchain with decentralized oracle mechanisms for agricultural insurance. The framework establishes a reputation scoring system for IoT device data quality, implements a privacy-preserving oracle using masked secret sharing and secure aggregation, and validates performance on Ganache and Sepolia test networks. The system achieves 82.3% reduction in false data injection exposure.

**Key Contribution**: The reputation-scored decentralized oracle architecture for agricultural data, with formal privacy preservation and performance benchmarking on actual test networks.

**Relevance to Farmera**: AgriInsureDON addresses the same fundamental problem as Farmera V2 — how to bridge off-chain agricultural data to on-chain smart contracts trustworthily — but uses IoT devices rather than human auditors as data sources. Three specific lessons apply: (1) the privacy-preserving oracle pattern (masked secret sharing) could address Farmera's auditor vote privacy gap (W in P3's taxonomy); (2) the performance benchmarking methodology provides a template for Farmera's missing scalability analysis (W8); and (3) the reputation scoring for data sources parallels Farmera's auditor reputation system but adds device-level data quality metrics that could inspire log quality scoring.

---

### Paper 6 (P6)

**Caldarelli, G.** (2025). "Can artificial intelligence solve the blockchain oracle problem? Unpacking the challenges and possibilities." *Frontiers in Blockchain*, 8, 1682623. DOI: [10.3389/fbloc.2025.1682623](https://doi.org/10.3389/fbloc.2025.1682623)

**Summary**: Examines whether AI can solve the blockchain oracle problem. The central conclusion is that AI alone cannot solve the oracle problem but can mitigate it. The paper analyzes hybrid architectures combining AI automation (speed, scalability) with human/economic verification mechanisms (accountability, fallback). It identifies that the oracle problem is fundamentally about *trust translation* — converting off-chain trust assumptions into on-chain guarantees — and argues that no purely technical solution eliminates the need for economic or social trust anchors.

**Key Contribution**: The theoretical framework for understanding hybrid AI + human oracle architectures, and the formal argument that trust translation requires economic incentive alignment, not just technical correctness.

**Relevance to Farmera**: Directly validates Farmera V2's hybrid AI pre-filter + auditor consensus architecture (§1, Key Decision #3). Caldarelli's framework positions Farmera's approach as a specific instantiation of the hybrid oracle pattern: AI provides speed and scalability (ImageVerificationService as pre-filter), while auditor consensus provides accountability and trust translation (staking + slashing as economic anchor). The paper suggests that Farmera should explicitly frame its contribution as a *domain-specific hybrid oracle architecture for agricultural supply chains*, which strengthens the academic positioning.

---

### Paper 7 (P7)

**Guo, T., Chen, Y., Ren, Q., Li, D., Bo, W. & Wang, X.** (2025). "Blockchain-Based Trusted Traceability Scheme for Food Quality and Safety." *Journal of Food Quality*, 2025, 5914078. DOI: [10.1155/jfq/5914078](https://doi.org/10.1155/jfq/5914078)

**Summary**: Proposes a three-layer trusted traceability architecture (physical layer, IoT layer, blockchain layer) encompassing five supply chain organizations (production, processing, distribution, sale, supervision). The system integrates IoT devices with blockchain to provide end-to-end food traceability with tamper-proof records and real-time monitoring.

**Key Contribution**: The multi-organizational, multi-layer traceability architecture with role-specific blockchain interactions, demonstrating how different supply chain participants contribute data through distinct trust pathways.

**Relevance to Farmera**: Guo et al.'s multi-organizational model highlights a gap in Farmera V2: the current architecture focuses exclusively on the production phase (farmer logging) and verification phase (auditor consensus), but does not extend trust propagation through downstream supply chain stages (processing, distribution, retail). While this is outside Farmera's current scope, it provides a roadmap for future extensibility that the TrustPackage pattern is designed to support.

---

## 4. Scholarly Comparison: Architecture vs. Literature

### 4.1 Comparison Matrix

| Architectural Dimension | Farmera V2 Design | Literature Best Practice | Gap Analysis |
|------------------------|-------------------|------------------------|--------------|
| **Trust model** | Multi-party auditor consensus with staking | Multi-factor reputation + layered consensus (P4) | Farmera uses single-factor reputation; lacks tiered selection |
| **Oracle architecture** | Hybrid AI pre-filter + human consensus | Hybrid AI + economic incentives (P6) | Well-aligned; should explicitly frame as hybrid oracle |
| **Data verifiability** | Auditor consensus validates farmer-submitted data | Formal separation of availability vs. verifiability (P2) | Aligned; does not address selective transparency |
| **Trust aggregation** | Bayesian Beta for farm-level | Bayesian inference recommended for varying observation counts (P3) | Well-aligned with literature recommendations |
| **Scoring methodology** | Geometric mean + sigmoid + weighted linear | Multi-criteria frameworks with sensitivity analysis (P2, P3) | Weights lack empirical derivation |
| **Privacy** | Auditor votes visible on-chain | Masked secret sharing, privacy-preserving aggregation (P5) | Significant gap — visible votes enable strategic behavior |
| **Scalability** | No analysis provided | Performance benchmarking on test networks (P5) | Major gap — no gas cost or throughput data |
| **Extensibility** | TrustPackage pattern from Leteane & Ayalew (P1) | Modular trust architecture (P1) | Strong alignment — architecture directly implements source paper |
| **Incentive mechanism** | +2 rep / -5 rep, -0.1 ETH slashing | Formal game-theoretic analysis, Nash equilibrium (P4, P6) | Informal reasoning; needs formal proof |
| **Supply chain scope** | Production + verification only | Multi-organizational, multi-stage (P7) | Limited scope — downstream stages not addressed |

### 4.2 Key Scholarly Observations

**Observation 1: The hybrid oracle framing is academically strong.** Caldarelli (2025, P6) establishes that hybrid AI + human/economic verification is the state-of-the-art approach to the oracle problem. Farmera V2's architecture is a domain-specific implementation of this pattern. This should be elevated in the thesis framing.

**Observation 2: The Bayesian scoring model is well-supported.** Arshad et al. (2023, P3) identify Bayesian Beta models as preferred for trust aggregation under observation-count uncertainty. Farmera V2's implementation (§7.2) directly instantiates this recommendation.

**Observation 3: Weight calibration is the weakest link.** Multiple papers (P2, P3, P4) emphasize that trust model parameters must be empirically derived or at minimum subjected to sensitivity analysis. Farmera V2's weights are presented without justification.

**Observation 4: Auditor vote privacy is a critical gap.** AgriInsureDON (P5) demonstrates that privacy-preserving aggregation is feasible in agricultural blockchain contexts. Farmera's transparent voting enables sequential voting strategy (waiting to see how others voted before committing), undermining consensus quality.

**Observation 5: The architecture lacks formal security analysis.** RPoC (P4) and the oracle literature (P6) both provide formal or semi-formal security arguments. Farmera's game-theoretic claims (§11.3) are intuitive but not proven.

---

## 5. Proposed Architectural Improvements

### Improvement 1: Commit-Reveal Voting Scheme for Auditor Privacy

**Problem Description**:
The current architecture allows auditors to observe each other's on-chain votes before submitting their own, since `AuditorRegistry.verify()` immediately records the vote's `isValid` boolean on-chain. This creates a sequential voting game where later voters can free-ride on earlier voters' judgments or strategically vote to maximize their reputation gain (voting with the emerging majority regardless of evidence). This undermines the independence assumption required for consensus quality.

**Scientific Reference**:
- Manoj et al. (2025, P5) implement masked secret sharing and secure aggregation for privacy-preserving oracle data, demonstrating that agricultural blockchain systems can maintain vote secrecy without sacrificing auditability.
- Arshad et al. (2023, P3) identify privacy as one of six core requirements for blockchain-based decentralized trust management systems, noting that "transparent voting mechanisms can be exploited through strategic behavior."

**Proposed Solution**:
Implement a two-phase commit-reveal voting scheme in `AuditorRegistry.sol`:

```
Phase 1 — COMMIT (within deadline):
    Auditor submits: keccak256(abi.encodePacked(isValid, salt))
    On-chain: only the hash is stored; vote is hidden

Phase 2 — REVEAL (after commit deadline, before reveal deadline):
    Auditor submits: (isValid, salt)
    Contract verifies: keccak256(abi.encodePacked(isValid, salt)) == commitment
    If match: vote recorded; if no reveal: stake penalty

Consensus calculated only after all reveals or reveal deadline.
```

**Specific Benefits**:
- Eliminates sequential voting strategy: auditors must commit before seeing others' votes
- Preserves on-chain auditability: all votes are eventually revealed and verifiable
- Increases consensus quality: independent judgments aggregate more informationally
- Adds academic contribution: domain-specific application of commit-reveal to agricultural verification

**Risks and Mitigation**:
- *Risk*: Increased transaction cost (2 txns per auditor instead of 1). *Mitigation*: Gas costs on zkSync are low (~$0.01-0.05 per tx); the security benefit outweighs cost.
- *Risk*: Auditors may forget to reveal. *Mitigation*: Penalize non-reveal with stake slashing; backend sends reminders.
- *Risk*: Implementation complexity increases. *Mitigation*: Commit-reveal is a well-documented Solidity pattern with established libraries.

---

### Improvement 2: Multi-Factor Reputation Model for Auditor Selection

**Problem Description**:
The current auditor selection algorithm (§5.6) uses a single factor — on-chain reputation score — to rank and select auditors. This creates several problems: (1) new auditors with no reputation history are perpetually excluded (cold-start, W1); (2) high-reputation auditors become overloaded (fatigue, R2); (3) a single metric is gameable by specializing in easy verifications.

**Scientific Reference**:
- Chakrabortty & Essam (2023, P4) propose a multi-factor reputation model for supply chain consensus that combines: stake amount (economic commitment), historical accuracy (competence), activity frequency (engagement), and elapsed time since last participation (recency). They demonstrate that multi-factor reputation produces 23% better fault tolerance than single-factor models in simulation.
- Arshad et al. (2023, P3) identify that effective trust evaluation requires combining "direct trust" (personal observation) with "indirect trust" (community reputation) using weighted aggregation.

**Proposed Solution**:
Replace the single-factor reputation sort with a composite auditor selection score:

```
SelectionScore(a) = w₁ × NormalizedReputation(a)
                  + w₂ × StakeRatio(a)
                  + w₃ × ResponseRate(a)
                  + w₄ × RecencyBonus(a)
                  + w₅ × DiversityBonus(a)

Where:
    NormalizedReputation = on-chain reputation / max(all reputations)
    StakeRatio = auditor_stake / min_required_stake (capped at 2.0)
    ResponseRate = completed_within_deadline / total_assigned
    RecencyBonus = 1 / (1 + days_since_last_verification / 30)
    DiversityBonus = 1.0 if auditor has NOT verified this farm before, else 0.5

Weights: w₁=0.30, w₂=0.15, w₃=0.20, w₄=0.15, w₅=0.20
```

Additionally, implement tiered selection (inspired by RPoC's layered architecture):
- **Tier 1** (top 25% by SelectionScore): 60% selection probability
- **Tier 2** (middle 50%): 30% selection probability
- **Tier 3** (bottom 25%, including new auditors): 10% selection probability

**Specific Benefits**:
- Solves cold-start (W1): new auditors enter Tier 3 with guaranteed 10% selection chance
- Reduces fatigue (R2): ResponseRate and RecencyBonus naturally distribute load
- Increases audit independence: DiversityBonus prevents repeated farm-auditor pairs
- Academically grounded: directly implements Chakrabortty & Essam's (2023) multi-factor model

**Risks and Mitigation**:
- *Risk*: Weight calibration for selection score. *Mitigation*: Conduct sensitivity analysis (see Improvement 4); start with literature-derived weights and tune based on deployment data.
- *Risk*: Gaming via creating multiple accounts. *Mitigation*: ADMIN-gated registration + minimum stake requirement serves as Sybil resistance.

---

### Improvement 3: Formal Framing as Domain-Specific Hybrid Oracle Architecture

**Problem Description**:
The architecture document (§11) frames the contribution primarily as "replacing backend attestation with auditor consensus." While accurate, this undersells the academic contribution. The hybrid AI + human verification architecture, the domain-specific TrustPackage adaptation, and the Bayesian scoring layer collectively constitute a more significant contribution when properly framed against the oracle problem literature.

**Scientific Reference**:
- Caldarelli (2025, P6) establishes that the oracle problem is fundamentally about *trust translation* — converting off-chain trust into on-chain guarantees — and that hybrid architectures (AI + economic/human verification) are the current frontier.
- Cui et al. (2024, P2) formalize the distinction between *data availability* and *data verifiability* in blockchain supply chain contexts, showing that blockchain alone guarantees only availability.

**Proposed Solution**:
Restructure the academic framing to position Farmera V2 as:

> **A domain-specific hybrid oracle architecture for agricultural supply chain transparency**, implementing trust translation through three complementary mechanisms:
>
> 1. **Data integrity oracle** (ProcessTracking): Achieves data availability via cryptographic hashing — ensures stored data cannot be retroactively modified (addresses Cui et al.'s availability requirement).
>
> 2. **Verification oracle** (AuditorRegistry + AI pre-filter): Achieves data verifiability via a hybrid mechanism — AI provides scalable preliminary assessment, auditor consensus provides authoritative human judgment anchored by economic incentives (addresses Caldarelli's trust translation requirement).
>
> 3. **Trust computation oracle** (TrustComputation + FTES v2): Achieves trust quantification via modular scoring — Bayesian aggregation handles uncertainty, geometric mean prevents dimension masking, sigmoid functions provide smooth temporal decay (extends Leteane & Ayalew's TrustPackage pattern).
>
> The architecture's contribution is the *composition* of these three oracle types into a coherent system where each layer feeds the next, producing a quantified transparency score with formal uncertainty bounds.

**Specific Benefits**:
- Positions the work within the well-established oracle problem literature (high-impact venue recognition)
- Elevates from "we added auditors" to "we designed a domain-specific hybrid oracle architecture"
- Creates clear distinction between Farmera's contribution and generic blockchain-for-supply-chain systems
- Enables formal comparison with Chainlink, Band Protocol, and other oracle networks

**Risks and Mitigation**:
- *Risk*: Overstatement of novelty. *Mitigation*: Clearly acknowledge that hybrid oracles exist; the novelty is the domain-specific adaptation and the three-layer composition.

---

### Improvement 4: Empirical Weight Calibration with Sensitivity Analysis

**Problem Description**:
Throughout the architecture, critical scoring weights are presented as fixed constants without empirical derivation:
- LogAuditorTrustPackage: W_CONSENSUS=40, W_CONSENSUS_STRENGTH=15, W_SPATIAL=25, W_EVIDENCE=20
- StepAuditorTrustPackage: W_COVERAGE=35, W_VERIFICATION_RATE=35, W_ACTIVITY=15, W_CONSENSUS_QUALITY=15
- Season geometric mean: PT^0.65 × SA^0.20 × OC^0.15
- Bayesian prior: α₀=2, β₀=2, n_eff=5, λ=ln(2)/6

These "arbitrary" weights are a commonly cited weakness in blockchain supply chain trust models (Arshad et al., 2023, P3) and invite the defense committee question: "Why these specific numbers?"

**Scientific Reference**:
- Cui et al. (2024, P2) emphasize that transparency mechanisms must be analyzed for strategic behavior and parameter sensitivity.
- Arshad et al. (2023, P3) explicitly call out that "trust model parameters require empirical validation to ensure robustness across deployment contexts."
- Chakrabortty & Essam (2023, P4) validate their consensus parameters through simulation experiments with varying fault rates.

**Proposed Solution**:
Add a formal weight calibration and sensitivity analysis methodology:

**Step 1 — Expert Elicitation (Analytical Hierarchy Process)**:
Conduct AHP surveys with 5–10 agricultural domain experts (farmers, agronomists, food safety inspectors) to derive pairwise comparisons for each scoring dimension. Compute eigenvector weights from the comparison matrix.

**Step 2 — Monte Carlo Sensitivity Analysis**:
For each weight vector, perform 10,000 Monte Carlo simulations:
- Sample weights from uniform distributions ±20% around the AHP-derived values
- Compute scores for a synthetic dataset of 500 logs across 20 farms
- Measure: rank stability (Kendall's τ between perturbed and original rankings), score variance, and threshold sensitivity (how many farms change transparency category)

**Step 3 — Robustness Reporting**:
Report sensitivity indices (Sobol' first-order and total-order) for each weight parameter, identifying which weights most influence final scores.

```
Example output:
    Parameter            Sobol' S₁    Sobol' ST    Interpretation
    W_CONSENSUS          0.42         0.51         HIGH sensitivity — most influential
    W_SPATIAL            0.18         0.24         MODERATE sensitivity
    W_EVIDENCE           0.08         0.12         LOW sensitivity — robust to variation
    PT exponent (0.65)   0.35         0.44         HIGH sensitivity — validate carefully
    Bayesian α₀          0.05         0.08         LOW sensitivity — prior washes out
```

**Specific Benefits**:
- Transforms "I chose these numbers" into "these numbers were derived through AHP and validated through sensitivity analysis"
- Identifies which parameters matter most, focusing calibration effort
- Produces publishable sensitivity analysis figures for the thesis
- Directly addresses the most common committee critique of trust scoring systems

**Risks and Mitigation**:
- *Risk*: Expert elicitation requires access to domain experts. *Mitigation*: 5 experts is sufficient for AHP; can recruit from university agriculture department.
- *Risk*: Sensitivity analysis is computationally intensive. *Mitigation*: The scoring functions are simple arithmetic; 10,000 simulations complete in seconds.

---

### Improvement 5: Scalability Benchmarking and Gas Cost Analysis

**Problem Description**:
The architecture proposes significant on-chain activity (verification requests, auditor votes, consensus finalization, trust score computation) but provides no quantitative analysis of transaction costs, throughput limits, or performance under load. This is a critical gap for both practical deployment and academic rigor.

**Scientific Reference**:
- Manoj et al. (2025, P5) benchmark their AgriInsureDON framework on both Ganache and Sepolia test networks, reporting transaction latency, throughput, CPU usage, and memory consumption. This establishes the standard for agricultural blockchain performance evaluation.
- Sri Vigna Hema et al. (2024) note that "scalability remains the primary barrier to blockchain adoption in food supply chains, with gas costs and transaction throughput limiting practical deployment."

**Proposed Solution**:
Conduct a structured benchmarking study:

**Test Environment**: zkSync Era testnet (matching deployment target)

**Metrics**:
| Metric | Method |
|--------|--------|
| Gas cost per operation | Deploy contracts, execute each function, measure gas consumed |
| Transaction latency | Time from submission to finalization |
| Throughput | Maximum verifications per minute before degradation |
| Cost projection | Gas × current ETH price × projected daily log volume |

**Scenarios**:
1. **Baseline**: 10 farms, 5 auditors, 50 logs/day
2. **Growth**: 100 farms, 20 auditors, 500 logs/day
3. **Stress**: 1000 farms, 50 auditors, 5000 logs/day

**Expected Outputs**:
- Gas cost table per operation (requestVerification, verify, finalizeVerification, processData)
- Daily/monthly cost projections at each scale
- Identification of bottlenecks (e.g., consensus finalization gas cost scales with auditor count)
- Comparison with off-chain alternative cost (to justify on-chain computation)

**Specific Benefits**:
- Provides quantitative evidence for blockchain cost-effectiveness
- Identifies scale limits before deployment
- Produces benchmarking figures comparable to AgriInsureDON (P5)
- Addresses committee question: "Is this economically viable?"

**Risks and Mitigation**:
- *Risk*: zkSync testnet performance may not reflect mainnet. *Mitigation*: Report testnet results with explicit caveats; supplement with gas estimation tools.
- *Risk*: Benchmarking takes time. *Mitigation*: Automated test scripts can be written in Foundry/Hardhat and reused.

---

### Improvement 6: Temporal Verification Decoupling via Provisional Scoring

**Problem Description**:
The current design (§9.4, Step 18) blocks step completion if any log has `verification_status = PENDING`. This creates a temporal coupling where slow auditor response directly stalls farmer workflows. In agricultural contexts, step completion may be time-sensitive (e.g., harvest must proceed regardless of verification status).

**Scientific Reference**:
- Guo et al. (2025, P7) design their traceability system with asynchronous data flow between supply chain stages, recognizing that agricultural operations cannot be paused for administrative processes.
- Caldarelli (2025, P6) emphasizes that hybrid oracle architectures must balance "speed of automation with trust of human verification," suggesting that sequential dependency is an anti-pattern.

**Proposed Solution**:
Introduce a **provisional scoring** mechanism:

```
Step completion check:
    IF all logs verified (VERIFIED/REJECTED/SKIPPED):
        → Compute FINAL step score (current behavior)

    IF some logs still PENDING:
        → Compute PROVISIONAL step score using:
            - Verified/Rejected/Skipped logs: use actual scores
            - Pending logs: use AI pre-filter score × 0.7 (discount factor)
        → Mark step as PROVISIONALLY_COMPLETED
        → When remaining verifications finalize:
            → Recalculate step score automatically
            → Update season score if already computed
            → Log the score delta for audit trail
```

Add a new status to step tracking:
```typescript
enum StepCompletionStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    PROVISIONALLY_COMPLETED = 'PROVISIONALLY_COMPLETED',
    COMPLETED = 'COMPLETED',
}
```

**Specific Benefits**:
- Decouples farmer workflow from auditor response time
- Maintains scoring accuracy through automatic recalculation
- Preserves incentive for timely verification (provisional scores are discounted)
- Produces an auditable score history (provisional → final) demonstrating transparency

**Risks and Mitigation**:
- *Risk*: Provisional scores may be displayed to consumers before finalization. *Mitigation*: UI displays "provisional" badge; API response includes `is_provisional: boolean`.
- *Risk*: Cascading recalculations (step → season → farm). *Mitigation*: Queue recalculations asynchronously; batch updates in the existing 3AM cron job.

---

### Improvement 7: Selective Transparency Detection

**Problem Description**:
Cui et al. (2024, P2) demonstrate that supply chain participants may strategically choose *what information to disclose*, creating the appearance of transparency while concealing problematic data. In Farmera V2, farmers choose which activities to log. A farmer could log only successful activities (healthy crops, proper fertilization) while omitting failures (pest outbreaks, chemical overuse), producing a high transparency score that does not reflect actual transparency.

**Scientific Reference**:
- Cui et al. (2024, P2) formalize selective disclosure as a rational strategy when transparency scoring rewards quantity and quality of disclosed data.
- Guo et al. (2025, P7) propose supervision nodes that cross-reference expected activities with reported activities.

**Proposed Solution**:
Introduce an **Expected Activity Model** per crop type and growing step:

```
For each (crop_type, step_type) combination:
    expected_activities = predefined list of activities that SHOULD occur
    expected_log_frequency = minimum logs per week
    expected_topics = set of topics that should be covered

Detection signals:
    1. Topic Coverage: Are expected topics represented in log descriptions?
       (NLP keyword matching or simple category tagging)

    2. Temporal Gaps: Are there unexplained gaps in logging frequency?
       (Compare actual log intervals against expected frequency)

    3. Outcome Inconsistency: Does the final yield/quality align with
       the logged activities? (If all logs show perfect conditions
       but yield is below average → suspicious)

Integration:
    Add a "completeness_penalty" to the Step Transparency Index:
    Is_adjusted = Is × CompletenessRatio
    Where CompletenessRatio = covered_topics / expected_topics
```

**Specific Benefits**:
- Addresses Cui et al.'s selective transparency concern directly
- Provides a measurable metric for what is *missing*, not just what is *present*
- Creates an incentive for farmers to log comprehensively, including setbacks
- Academically novel: few blockchain supply chain systems address selective disclosure

**Risks and Mitigation**:
- *Risk*: Expected activity models are crop-specific and region-specific. *Mitigation*: Start with broad categories (planting, fertilizing, pest management, watering, harvesting) that apply universally; refine per crop type over time.
- *Risk*: False positives (farmer didn't log because activity didn't happen). *Mitigation*: CompletenessRatio is a discount, not a penalty — it reduces the score toward the Bayesian prior rather than to zero.

---

## 6. Conclusions and Recommendations

### 6.1 Overall Assessment

The Farmera V2 architecture as described in `ARCHITECTURE_AND_WORKFLOW_DESIGN.md` represents a **significant and academically grounded improvement** over the current system. The transition from centralized backend attestation to multi-party auditor consensus, combined with Bayesian scoring and the preservation of Leteane & Ayalew's (2024) extensible TrustPackage pattern, creates a system with genuine decentralization properties and statistical rigor.

The architecture aligns well with the current state of the art as represented in recent literature (2023–2025), particularly in its hybrid oracle design (validated by Caldarelli, 2025), Bayesian trust aggregation (supported by Arshad et al., 2023), and modular trust computation (directly from Leteane & Ayalew, 2024).

### 6.2 Priority Ranking of Improvements

| Priority | Improvement | Effort | Academic Impact | Practical Impact |
|----------|------------|--------|----------------|-----------------|
| **1** | Sensitivity analysis for weights (#4) | MEDIUM | CRITICAL | HIGH |
| **2** | Formal hybrid oracle framing (#3) | LOW | HIGH | N/A (thesis only) |
| **3** | Commit-reveal voting (#1) | MEDIUM | HIGH | HIGH |
| **4** | Scalability benchmarking (#5) | MEDIUM | HIGH | HIGH |
| **5** | Multi-factor auditor selection (#2) | MEDIUM | MEDIUM | HIGH |
| **6** | Provisional scoring (#6) | LOW | LOW | HIGH |
| **7** | Selective transparency detection (#7) | HIGH | HIGH | MEDIUM |

### 6.3 Minimum Viable Academic Contributions

For thesis defense, the following subset is recommended as the minimum:

1. **Weight sensitivity analysis** (Improvement #4) — transforms the scoring model from "arbitrary" to "empirically validated"
2. **Hybrid oracle framing** (Improvement #3) — positions the work within established high-impact literature
3. **Commit-reveal voting** (Improvement #1) — demonstrates privacy-awareness and defense against strategic voting
4. **Scalability benchmarking** (Improvement #5) — provides quantitative evidence of practical viability

Together, these four additions address the most likely committee criticisms while being implementable within the project timeline.

---

## 7. Full References

[P1] Leteane, O. & Ayalew, Y. (2024). "Improving the Trustworthiness of Traceability Data in Food Supply Chain Using Blockchain and Trust Model." *The Journal of The British Blockchain Association*, 7(1). DOI: [10.31585/jbba-7-1-(2)2024](https://doi.org/10.31585/jbba-7-1-(2)2024)

[P2] Cui, Y., Gaur, V. & Liu, J. (2024). "Supply Chain Transparency and Blockchain Design." *Management Science*, 70(5), 3245–3263. DOI: [10.1287/mnsc.2023.4851](https://doi.org/10.1287/mnsc.2023.4851)

[P3] Arshad, Q., Khan, W.Z., Azam, F., Khan, M.K., Yu, H. & Zikria, Y.B. (2023). "Blockchain-based decentralized trust management in IoT: systems, requirements and challenges." *Complex & Intelligent Systems*, 9, 6155–6176. DOI: [10.1007/s40747-023-01058-8](https://doi.org/10.1007/s40747-023-01058-8)

[P4] Chakrabortty, R.K. & Essam, D.L. (2023). "Reputation based proof of cooperation: an efficient and scalable consensus algorithm for supply chain applications." *Journal of Ambient Intelligence and Humanized Computing*, 14, 7515–7532. DOI: [10.1007/s12652-023-04592-y](https://doi.org/10.1007/s12652-023-04592-y)

[P5] Manoj, T., Makkithaya, K., Narendra, V.G. & Vijaya Murari, T. (2025). "Blockchain oracles for decentralized agricultural insurance using trusted IoT data." *Frontiers in Blockchain*, 7, 1481339. DOI: [10.3389/fbloc.2024.1481339](https://doi.org/10.3389/fbloc.2024.1481339)

[P6] Caldarelli, G. (2025). "Can artificial intelligence solve the blockchain oracle problem? Unpacking the challenges and possibilities." *Frontiers in Blockchain*, 8, 1682623. DOI: [10.3389/fbloc.2025.1682623](https://doi.org/10.3389/fbloc.2025.1682623)

[P7] Guo, T., Chen, Y., Ren, Q., Li, D., Bo, W. & Wang, X. (2025). "Blockchain-Based Trusted Traceability Scheme for Food Quality and Safety." *Journal of Food Quality*, 2025, 5914078. DOI: [10.1155/jfq/5914078](https://doi.org/10.1155/jfq/5914078)

---

*This review was prepared on February 11, 2026 as an academic evaluation of the Farmera V2 architecture design document.*
