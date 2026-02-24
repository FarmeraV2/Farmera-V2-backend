# Critical Analysis: Blockchain Trustworthiness Architecture in Farmera V2

## Academic Review of Smart Contract Design, Trust Model Adequacy, and Decentralized Verification

**Review Type**: Thesis-Level Technical Review
**Date**: February 10, 2026
**Scope**: Smart contracts (`smartcontracts/src/`), backend integration (`src/modules/blockchain/`, `src/modules/ftes/`)

---

## 1. System-Level Blockchain Analysis

### 1.1 Current Blockchain Usage Pattern

The Farmera V2 system employs blockchain across three distinct contract modules:

| Contract | Function | Write Pattern | Read Pattern |
|----------|----------|---------------|--------------|
| **ProcessTracking** | Immutable hash storage | Backend writes SHA-256 hashes of logs/steps | Anyone can retrieve and compare hashes |
| **TrustComputation** | Score computation + storage | Backend submits pre-computed metrics; contract runs scoring formula | Anyone can query trust scores |
| **AuditorRegistry** | Multi-party verification | Auditors register (stake ETH) and vote on validity | Anyone can query consensus results |

The backend (`ProcessTrackingService`, `TrustworthinessService`) connects to these contracts using a **single wallet** (`WALLET_PRIVATE_KEY`). All write operations originate from one Ethereum account controlled by the application server.

### 1.2 Which Blockchain Properties Are Actually Leveraged

| Property | Leveraged? | Assessment |
|----------|-----------|------------|
| **Immutability** | Partially | Hashes stored on-chain cannot be altered post-write. However, the backend controls *what* gets written and *when*. An adversarial backend could omit unfavorable data entirely, and the chain would have no record of the omission. |
| **Decentralization** | Minimally | All production data writes flow through a single backend wallet. The `ProcessTracking` and `TrustComputation` contracts have `public` write functions (no access control), but in practice only the backend calls them. The `AuditorRegistry` is designed for multi-party participation but has no backend integration. |
| **Consensus** | Not leveraged (for data) | The underlying Ethereum/zkSync consensus validates *transaction validity* (correct nonce, sufficient gas), not *data validity*. The chain cannot determine whether a farmer's log is truthful. |
| **Trust minimization** | Partially | Consumers can independently verify hashes by comparing on-chain records to off-chain data. This is a genuine, though limited, trust-minimizing property. |
| **Transparency** | Yes | All trust scores and hashes are publicly queryable. This is a meaningful contribution. |

### 1.3 Could Traditional Technologies Achieve the Same Functionality?

**The core question**: Can a PostgreSQL database with cryptographic signatures replicate the current system's guarantees?

**Analysis**:

For `ProcessTracking`, the current implementation stores `string hashedData` keyed by `uint64 logId`. This is functionally equivalent to:

```sql
CREATE TABLE audit_log (
    log_id BIGINT PRIMARY KEY,
    hashed_data VARCHAR(64) NOT NULL,
    signature BYTEA NOT NULL,        -- Server's Ed25519 signature
    created_at TIMESTAMP DEFAULT NOW()
);
```

With an append-only policy and a signed timestamp from a Time Stamping Authority (TSA), this table provides:
- **Integrity verification**: The signature proves the server attested to this hash at a specific time.
- **Tamper evidence**: Any modification invalidates the signature.
- **Auditability**: A third-party auditor can verify all signatures.

**What the traditional approach lacks** (and what blockchain provides):
1. **Operator independence**: The database operator *could* delete rows or modify the append-only policy. Blockchain prevents the operator from rewriting history, even if they control the server.
2. **Public verifiability without trust in the operator**: Anyone with a blockchain node can verify data independently. A centralized database requires trusting the operator's API.
3. **Censorship resistance**: The backend cannot retroactively remove an unfavorable hash once it is committed to a block.

**Verdict**: The blockchain provides a real but narrow advantage over centralized alternatives. This advantage is significant **only if** there exist parties who distrust the backend operator. In the current architecture, the backend is the sole writer, which substantially weakens the censorship-resistance argument because the backend could simply choose not to write unfavorable data in the first place.

### 1.4 Why the Current Blockchain Usage Lacks Depth

The fundamental weakness is an **architectural contradiction**:

> The system uses blockchain to establish trust, but the trust model is entirely dependent on a centralized backend that acts as the sole data authority.

Specifically:

1. **Single-writer pattern negates decentralization**. The `ProcessTrackingService` uses one `WALLET_PRIVATE_KEY` for all transactions. Farmers do not interact with the blockchain directly. The backend mediates every write, creating a centralized bottleneck identical to a traditional server.

2. **Trust scores are computed from backend-supplied inputs**. The `TrustComputation.processData()` function receives pre-computed values (`verified`, `imageVerified`, `imageCount`, `logLocation`, `plotLocation`) from the backend. The smart contract merely applies a formula to data it cannot independently verify. If the backend provides false inputs, the contract produces false scores — immutably.

3. **No on-chain enforcement of data quality**. The `ProcessTracking` contract accepts any string as `hashedData`. It cannot validate that the hash corresponds to legitimate farming activity. The contract is a passive recorder, not an active verifier.

4. **The AuditorRegistry exists but is disconnected**. Despite having a fully functional auditor contract with staking, reputation, consensus, and slashing, there is no `AuditorRegistryService` in the backend, no API endpoints for auditors, and no mechanism to route logs to auditors for verification. This contract represents unrealized potential.

---

## 2. Trustworthiness Smart Contract Evaluation

### 2.1 Architecture of the Trust Scoring Pipeline

The trust computation follows a layered architecture:

```
Layer 1: Individual Log Trust (LogDefaultTrustPackage)
    Inputs: verified, imageVerified, imageCount, videoCount, logLocation, plotLocation
    Formula: 20% Provenance + 30% Image Provenance + 30% Spatial Plausibility + 20% Evidence Completeness
    Output: Score 0-100

Layer 2: Step Transparency (StepTransparencyPackage)
    Inputs: validLogs, invalidLogs, active, unactive, minLogs
    Formula: 60% Log Coverage + 40% Activity Ratio, with fraud penalty multiplier
    Output: Score 0-100

Layer 3: Season Transparency (Backend only — TransparencyService)
    Inputs: Step scores from Layer 2, temporal adherence, yield consistency
    Formula: 60% Process + 20% Temporal + 20% Outcome
    Output: Score 0-1

Layer 4: Farm Transparency (Backend only — TransparencyService)
    Inputs: Season scores (exponential decay weighted), customer ratings
    Formula: 60% Process + 40% Customer Trust
    Output: Score 0-1
```

### 2.2 Why the Smart Contracts Are Not Central to System Trust

**Observation 1: The contracts compute scores, but do not make decisions.**

The trust score is computed on-chain, stored on-chain, and read by the backend. However, the score does not trigger any on-chain consequence. There are no automated penalties, no access revocations, no conditional logic that depends on the score within the contract itself. The backend retrieves the score and decides what to do with it off-chain. The contract is a calculator, not a decision-maker.

**Observation 2: All trust-relevant inputs originate from a single trusted party.**

The `verified` and `imageVerified` booleans in `LogDefaultTrustPackage` are set by the backend. These are the most trust-sensitive fields — they determine 50% of the log trust score (20% Provenance + 30% Image Provenance). Yet the blockchain cannot verify whether these booleans are truthful. If the backend sets `verified = true` for a fraudulent log, the contract faithfully computes a high trust score.

This creates a paradox: **the trust computation is trustworthy only if the entity providing the inputs is already trusted**. The blockchain adds no independent verification.

**Observation 3: Higher-level scoring happens entirely off-chain.**

Layers 3 and 4 (season and farm transparency) are computed in `TransparencyService` on the backend using TypeScript. The weights (`W_SS_PROCESS = 0.60`, `W_FARM_CUSTOMER_TRUST = 0.40`) are defined in a JavaScript constant file, not on-chain. These values can be changed by anyone with server access, without blockchain-level governance or transparency.

### 2.3 Missing Elements in the Current Trust Architecture

| Element | Status | Impact |
|---------|--------|--------|
| **On-chain decision-making** | Absent | Trust scores exist on-chain but never trigger automated consequences (e.g., freezing a farm's verification status) |
| **Multi-party verification** | Contract exists (`AuditorRegistry`) but not integrated | Verification remains single-party (backend) |
| **Consensus-driven trust evaluation** | Not operational | The `calculateConsensus()` function in `AuditorRegistry` is never called from the backend |
| **Economic incentives/penalties** | Contract exists but not operational | Staking and slashing in `AuditorRegistry` are implemented at the Solidity level but have no backend integration to trigger or consume them |
| **Data provenance from source** | Absent | Farmers cannot sign their own data. The backend signs on behalf of all users using a single wallet |
| **Weight governance** | Absent | Scoring weights are hardcoded in both Solidity (Layer 1-2) and TypeScript (Layer 3-4) with no governance mechanism for modification |

---

## 3. Root Cause Analysis: Why Trustworthiness Is Weak

### 3.1 Architectural Root Causes

**Root Cause 1: Centralized Write Authority**

The backend holds the only private key that writes to the blockchain. This creates what can be formally described as a **single oracle problem**: the blockchain's security guarantees are only as strong as the weakest off-chain data source. Since there is only one data source (the backend), the system inherits all the trust assumptions of a centralized system.

In formal terms, the system's trust model is:

```
T(system) = T(blockchain) ∩ T(backend)
```

Since `T(backend)` requires institutional trust in the operator, `T(system)` reduces to institutional trust regardless of blockchain's cryptographic guarantees.

**Root Cause 2: Absence of the Oracle Problem Solution**

The fundamental challenge in blockchain-based systems is bridging the gap between on-chain computation and off-chain reality — the "oracle problem." The current system does not address this. Data enters the blockchain through a single, unverified channel. There is no:
- Multi-source data validation
- Challenge mechanism for disputed data
- Cryptographic attestation from the data source (farmer's device)

**Root Cause 3: No Game-Theoretic Security**

Honest behavior in the current system is enforced by **institutional trust** (trusting the backend operator to be honest) rather than **mechanism design** (making dishonesty economically irrational). There are no:
- Economic costs for submitting false data
- Rewards for identifying fraud
- Bonding mechanisms that align incentives
- Penalties that make manipulation more expensive than compliance

**Root Cause 4: Trust Score Inputs Are Not Independently Verifiable**

The `verified` and `imageVerified` fields in `LogDefaultTrustPackage` are boolean flags set by the backend. These represent **attestations by a single party** about data quality. The on-chain computation accepts these attestations at face value. There is no mechanism for a third party to dispute these values or for the contract to cross-reference them against independent sources.

### 3.2 The "Blockchain as a Database" Problem

The current architecture can be characterized as using blockchain as an **authenticated append-only datastore** with on-chain computation of scores from trusted inputs. This is a legitimate use case, but it is architecturally equivalent to:

1. A centralized database with cryptographic signing (for integrity)
2. A stored procedure (for score computation)
3. An API endpoint (for public read access)

The blockchain adds value through **operator-independent integrity verification**, but this value is diminished by the single-writer pattern. The operator cannot alter past records, but can control which records are created — a form of **censorship** that the architecture does not prevent.

### 3.3 Academic Impact Assessment

From an academic perspective, the current design:

- **Demonstrates technical competence** in blockchain integration (Web3.js, ABI encoding, event parsing, Chainlink integration)
- **Shows architectural thinking** in the pluggable `TrustPackage` pattern via `MetricSelection`
- **Fails to justify blockchain necessity** — the same functionality is achievable with simpler technology
- **Does not address the core research challenge** — how to establish trust in data provenance without relying on a central authority

The committee's likely critique: *"Your smart contracts compute a formula. The formula could run in JavaScript. What does the blockchain add that a signed database does not?"*

---

## 4. Proposed Upgrade: Decentralized Verification Architecture

### 4.1 Why This Upgrade Is Necessary

The current system has a **trust gap**: it guarantees data *immutability* but not data *validity*. A farmer can submit fabricated logs, and the backend can mark them as `verified: true`. The blockchain faithfully records and scores this fabricated data, providing a false sense of trustworthiness.

The decentralized verification network addresses this gap by introducing **independent verification parties** whose economic incentives are aligned with honest behavior.

### 4.2 Why This Is Appropriate for Blockchain

This upgrade leverages blockchain properties that the current system underutilizes:

1. **Decentralization**: Multiple independent auditors replace a single backend as the trust authority
2. **Consensus**: Reputation-weighted voting determines truth, rather than a single party's attestation
3. **Economic security**: Staked capital creates tangible consequences for dishonesty
4. **Transparency**: All votes, consensus outcomes, and reputation changes are publicly auditable
5. **Trust minimization**: No single party — including the system operator — can unilaterally determine a log's validity

### 4.3 Why This Cannot Be Easily Replicated Centrally

A centralized implementation of multi-party verification would require:
- Trusting the operator to honestly aggregate votes (blockchain eliminates this trust requirement)
- Trusting the operator not to manipulate auditor reputations (on-chain reputation is tamper-proof)
- Trusting the operator to actually slash dishonest auditors (smart contract execution is deterministic and automatic)
- Trusting the operator not to censor unfavorable consensus outcomes (on-chain finality prevents this)

The blockchain's value proposition is precisely that **the verification process is governed by code, not by an operator's discretion**.

### 4.4 Architecture of the Proposed Upgrade

#### 4.4.1 Component Overview

The upgrade connects the existing `AuditorRegistry.sol` to the backend and integrates consensus outcomes into the trust scoring pipeline:

```
┌──────────────────────────────────────────────────────────────────┐
│                    CURRENT ARCHITECTURE                          │
│                                                                  │
│  Farmer → Backend → ProcessTracking (hash)                       │
│                   → TrustComputation (score from backend inputs)  │
│                                                                  │
│  Trust Authority: Backend (single party)                         │
└──────────────────────────────────────────────────────────────────┘

                              ↓ Upgrade ↓

┌──────────────────────────────────────────────────────────────────┐
│                    UPGRADED ARCHITECTURE                          │
│                                                                  │
│  Farmer → Backend → ProcessTracking (hash)                       │
│                   → TrustComputation (score from backend inputs)  │
│                   → AuditorRegistry (verification request)        │
│                                                                  │
│  Auditor Pool → AuditorRegistry (independent votes)              │
│              → Consensus (reputation-weighted majority)           │
│              → Finalization (rewards/slashing)                    │
│                                                                  │
│  Trust Authority: Distributed consensus (multiple parties)        │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.4.2 Auditor Staking

The existing `AuditorRegistry.sol` already implements this correctly:

- **Registration**: Auditors call `registerAuditor()` with a stake of at least $1 USD equivalent (converted via Chainlink ETH/USD price feed)
- **Economic barrier**: The stake requirement prevents Sybil attacks (creating many fake auditors)
- **Skin in the game**: Auditors have capital at risk, creating economic incentives for honest behavior

**Current implementation strength**: The use of Chainlink price feeds for USD-denominated minimum stake is a sophisticated design choice that insulates the system from ETH price volatility.

#### 4.4.3 Reputation System

The existing contract implements a basic but functional reputation model:

- **Initial reputation**: 50 points
- **Correct vote (consensus majority)**: +2 reputation
- **Incorrect vote (consensus minority)**: -5 reputation, -0.1 ETH stake
- **Deactivation**: Auditor deactivated if remaining stake < $1 USD

**Reputation-weighted consensus**: Votes are weighted by auditor reputation, meaning experienced auditors with track records of honest behavior have more influence than newcomers. This creates a **meritocratic trust hierarchy** that rewards consistent accuracy.

**Asymmetric penalties**: The 5:2 ratio of penalty to reward (reputation) creates a system where the expected value of dishonest voting is negative, assuming other auditors are honest. This is a basic but valid game-theoretic design.

#### 4.4.4 Consensus-Based Verification

The `calculateConsensus()` function implements reputation-weighted majority voting:

```
validVotes = Σ(reputation_i) for auditors voting "valid"
invalidVotes = Σ(reputation_i) for auditors voting "invalid"
consensus = validVotes > invalidVotes
```

This is triggered automatically when `MIN_AUDITORS` (currently 2) have voted, via the `verify()` function. The consensus outcome determines rewards and penalties in `finalizeVerification()`.

#### 4.4.5 Slashing and Reward Mechanisms

- **Correct voters**: Reputation increases by `REPUTATION` (2 points)
- **Incorrect voters**: Reputation decreases by `REPUTATION_PENALTY` (5 points) AND stake reduced by `SLASH_AMOUNT` (0.1 ETH)
- **Automatic deactivation**: If remaining stake falls below minimum ($1 USD), auditor is deactivated

This creates a **progressive punishment model**: an auditor who votes dishonestly multiple times will eventually be economically excluded from the system.

### 4.5 What Needs to Be Built (Backend Integration)

The smart contract layer is substantially complete. The missing components are:

**1. Backend AuditorRegistry Service**
- A new `AuditorRegistryService` analogous to `ProcessTrackingService` and `TrustworthinessService`
- Connects to the deployed `AuditorRegistry` contract via Web3.js
- Exposes methods: `registerAuditor()`, `verify()`, `getAuditor()`, `getVerifications()`

**2. Verification Request Flow**
- When a farmer submits a log with high-value claims, the backend creates a verification request
- The request is stored in the database with status `PENDING`
- Selected auditors are notified (via API polling or push notification)

**3. Auditor Data Access Endpoint**
- Auditors need access to the log data (images, GPS, descriptions) to make informed verification decisions
- A dedicated API endpoint provides a "verification package" containing all relevant evidence
- The blockchain hash allows auditors to independently verify data integrity

**4. Consensus Outcome Integration**
- After consensus is reached, the backend listens for `VerificationFinalized` events
- Consensus results feed back into the trust score:
  - Positive consensus: trust score unchanged or boosted
  - Negative consensus: trust score penalized, log flagged for admin review

**5. Auditor Selection Mechanism** (currently missing from the smart contract)
- The contract currently allows any registered auditor to verify any log
- An improved design would include random or reputation-based assignment to prevent collusion

---

## 5. Justification of the Proposal

### 5.1 Trust Problems Solved

| Problem | Current System | Upgraded System |
|---------|---------------|----------------|
| **Backend fabrication** | Backend can mark fraudulent data as `verified: true` | Multiple independent auditors must reach consensus; backend cannot override |
| **Single point of failure** | If the backend is compromised, all trust guarantees fail | Compromising the backend does not affect auditor consensus |
| **Lack of accountability** | No economic consequence for publishing false data | Auditors lose staked capital for dishonest votes |
| **Unverifiable claims** | `verified` flag is a single party's assertion | Verification is a recorded, multi-party process with auditable votes |
| **Data omission** | Backend can choose not to write unfavorable data | Verification requests create on-chain evidence of pending reviews |

### 5.2 Attack Vectors Mitigated

**Attack 1: Backend Collusion with Farmer**

- **Current vulnerability**: The backend operator could be bribed to mark fraudulent logs as verified. Since the backend is the sole trust authority, this attack is undetectable.
- **Mitigation**: Multiple independent auditors must independently verify the log. The attacker would need to bribe a reputation-weighted majority of assigned auditors — a significantly more expensive and detectable attack.

**Attack 2: Sybil Attack on Verification**

- **Mitigation**: The staking requirement ($1 USD minimum per auditor) creates an economic barrier to creating multiple fake identities. Additionally, new auditors start with low reputation (50 points), limiting their influence on consensus until they build a track record.

**Attack 3: Lazy Auditor (Rubber-Stamping)**

- **Mitigation**: If an auditor habitually votes "valid" without inspection, they will occasionally disagree with honest auditors who detect actual fraud. Each disagreement costs 5 reputation points and 0.1 ETH, making lazy behavior progressively more expensive.

**Attack 4: Auditor Collusion Ring**

- **Partial mitigation**: Reputation-weighted voting means colluding low-reputation auditors have less influence. However, the current design does not fully address coordinated collusion among high-reputation auditors. This is acknowledged as a limitation and could be addressed through future work (e.g., auditor assignment randomization, commitment-reveal schemes).

### 5.3 Trust Model Transformation

```
CURRENT:
    Trust = Institutional trust in backend operator
    Verification: "The operator says this data is valid"
    Security assumption: The operator is honest

UPGRADED:
    Trust = Cryptographic guarantees + Economic incentives
    Verification: "Multiple independent parties with staked capital agree this data is valid"
    Security assumption: A majority of economically rational auditors will act honestly
```

This transformation is significant because it replaces a **subjective trust assumption** (operator honesty) with an **objective security property** (economic irrationality of dishonest behavior given stake-at-risk).

### 5.4 Impact Analysis

**Security**: The system moves from a single-point-of-trust model to a distributed verification model. The cost of a successful attack increases from "compromise one server" to "compromise a reputation-weighted majority of independently staked auditors."

**Transparency**: All verification votes, consensus outcomes, reputation changes, and slashing events are recorded on-chain and publicly auditable. This provides a level of process transparency that is impossible in a centralized system where the operator controls the audit trail.

**Censorship Resistance**: Once a verification request is submitted on-chain, the backend cannot prevent auditors from voting or suppress unfavorable consensus outcomes. This eliminates the operator's ability to selectively censor negative findings.

**Academic Novelty**: While blockchain-based supply chain systems are well-studied, the application of reputation-weighted consensus with economic slashing for agricultural data verification is underexplored. The combination of Chainlink price feeds for USD-denominated staking, asymmetric reputation penalties, and progressive auditor deactivation represents a meaningful contribution to the design space.

---

## 6. Research and Academic Perspective

### 6.1 Improvement to Research Contribution

| Dimension | Current System | Upgraded System |
|-----------|---------------|----------------|
| **Research question** | "Can blockchain store agricultural data hashes?" (trivial) | "Can decentralized consensus with economic incentives establish data validity in agricultural supply chains?" (substantive) |
| **Methodology** | Implementation-only | Implementation + mechanism design + game-theoretic analysis |
| **Novelty** | Standard hash-storage pattern | Reputation-weighted verification with Chainlink-priced staking |
| **Publishability** | Low — well-known pattern | Moderate — contributes to agricultural blockchain and mechanism design literature |
| **Reproducibility** | High but uninteresting | High and addresses an open problem |

### 6.2 Alignment with Core Blockchain Principles

| Principle | Current Alignment | Upgraded Alignment |
|-----------|------------------|-------------------|
| **Decentralization** | Weak — single writer | Strong — multiple independent verifiers |
| **Trustlessness** | Weak — trusts backend | Moderate — trusts economic rationality |
| **Immutability** | Present but limited impact | Present with meaningful consequence (verified fraud records) |
| **Transparency** | Data hashes public | Data hashes + verification process + reputation history public |
| **Incentive compatibility** | Absent | Present — honest behavior is economically dominant strategy |

### 6.3 Comparative Analysis

#### Current System vs. Upgraded System

| Aspect | Current | Upgraded |
|--------|---------|---------|
| Trust authority | Backend (centralized) | Auditor consensus (distributed) |
| Cost of attack | Compromise backend | Bribe majority of staked auditors |
| Accountability | None (backend is anonymous authority) | On-chain record of all votes and outcomes |
| Economic security | Zero (no staking) | Staked capital at risk for dishonest behavior |
| Smart contract role | Passive storage + formula computation | Active governance of verification process |
| Blockchain justification | Weak (expensive append-only log) | Strong (uniquely enables trustless multi-party verification) |

#### Traditional Centralized Verification vs. Decentralized Verification

| Aspect | Centralized (e.g., certification body) | Decentralized (proposed) |
|--------|----------------------------------------|--------------------------|
| Verifier accountability | Institutional reputation | Cryptographic + economic (staked capital) |
| Verification transparency | Audit reports (periodic, delayed) | Real-time, on-chain, continuous |
| Scalability | Limited by auditor headcount | Grows with auditor registration |
| Cost | High (professional auditor fees) | Lower (peer verification with micro-stakes) |
| Censorship resistance | Verifier can suppress findings | Consensus outcome is immutable |
| Trust model | Trust the institution | Trust the mechanism |

### 6.4 Conclusion: Does This Qualify as Meaningful Blockchain Innovation?

**Current system**: No. The current implementation uses blockchain as an authenticated datastore with on-chain computation. While technically functional, it does not leverage blockchain's distinguishing properties (decentralization, trustlessness, incentive alignment) in a way that justifies the added complexity and cost over traditional alternatives. The trust model remains centralized.

**Upgraded system**: Yes, with qualification. The integration of `AuditorRegistry` into the trust scoring pipeline creates a system where:

1. **Blockchain is necessary**: The trustless execution of staking, voting, consensus, and slashing cannot be replicated in a centralized system without reintroducing the trust assumptions the system aims to eliminate.
2. **Multiple blockchain properties are leveraged**: Decentralization (multiple verifiers), consensus (reputation-weighted voting), economic security (staking/slashing), and transparency (auditable verification process).
3. **The architecture addresses an open problem**: How to establish data validity (not just data integrity) in blockchain-based supply chain systems.

**The qualification**: The system remains partially centralized at the data ingestion layer (farmers submit data through the backend, not directly to the blockchain). Full decentralization would require farmers to interact with the blockchain directly (e.g., via a mobile wallet), which introduces UX complexity. This is an acknowledged trade-off and an appropriate scope limitation for a thesis-level project.

---

## 7. Summary of Recommendations

### Immediate Actions (Backend Integration)

1. **Create `AuditorRegistryService`** in the blockchain module — the smart contract is ready; only the backend bridge is missing.
2. **Add auditor API endpoints** for registration, verification submission, and pending task retrieval.
3. **Connect consensus outcomes to trust scores** — a negative consensus should penalize the log's trust score and trigger admin review.

### Smart Contract Improvements

4. **Add auditor assignment mechanism** — prevent self-selection bias by assigning auditors based on pseudo-random selection or reputation ranking.
5. **Add verification deadlines** — implement timeout logic so verification is not blocked by non-responsive auditors.
6. **Add reward distribution** — the contract slashes dishonest auditors but does not reward honest ones with ETH (only reputation). Adding financial rewards from a verification fee pool would strengthen incentive alignment.
7. **Connect `AuditorRegistry` to `TrustComputation`** — consensus outcomes should directly influence trust score computation, creating a closed-loop trust system.

### Academic Presentation

8. **Frame the upgrade as the thesis contribution** — the transition from centralized to decentralized trust is the novel research contribution, not the hash storage or score computation.
9. **Perform game-theoretic analysis** — formally model the auditor payoff matrix and demonstrate that honest voting is the Nash equilibrium under the current parameters.
10. **Compare with existing systems** — position against IBM Food Trust (centralized verification), TE-FOOD (single-auditor), and OriginTrail (decentralized knowledge graph) to demonstrate differentiation.

---

**Document Prepared for**: Academic thesis defense preparation
**Focus**: Blockchain trustworthiness architecture analysis
**Assessment**: Current system is technically competent but architecturally centralized; the proposed upgrade transforms it into a meaningful blockchain application with genuine decentralization and economic security properties.
