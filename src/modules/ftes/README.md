# FTES Module - Farm Transparency & Efficiency Score

## Overview

The FTES (Farm Transparency & Efficiency Score) module is a comprehensive system for evaluating agricultural operations through two distinct but complementary dimensions:

1. **Trust Score**: Data-item level credibility assessment (on-chain)
2. **Transparency Score**: Process-level transparency evaluation (off-chain)
3. **Efficiency Score**: Comparative efficiency analysis using DEA (Data Envelopment Analysis)

## Core Principles

### Fundamental Concepts

| Concept | Definition | Evaluation Unit | Storage |
|---------|-----------|-----------------|---------|
| **Trust** | Credibility of a single data item | Log (individual record) | Blockchain + Database |
| **Transparency** | Transparency level of a process | Step / Season / Plot / Farm | Off-chain (Database) |
| **Efficiency** | Comparative transparency efficiency | Farm | Off-chain (DEA analysis) |

> **CRITICAL**: Trust scores are NEVER aggregated. Only Transparency scores are aggregated across process levels.

## Architecture

### Scoring Hierarchy

```
Log → TrustScore (on-chain)
  ↓
Step → TransparencyStep
  ↓
Season → TransparencySeason
  ↓
Plot → TransparencyPlot
  ↓
Farm → TransparencyFarm → DEA → EfficiencyScore
```

---

## 1. Trust Score (Data-Item Level)

### Purpose
Evaluate the credibility of individual farm activity logs using blockchain-anchored verification.

### Evaluation Unit
- **Log** (individual data item)
- Each log is evaluated independently
- Scores are immutable once computed

### Trust Package System

Each log is assigned a **TrustPackage** based on its Step/Crop combination. Trust Packages define:
- List of metrics to evaluate
- Weight for each metric
- Veto rules (hard constraints)

### Scoring Formula

```
IF log is NOT verified:
  TrustScore = 0

ELSE:
  TrustScore(log) = Σ (weight_i × metric_i)

  Where:
  - Each metric_i ∈ [0, 1]
  - Σ weight_i = 1
```

### Blockchain Integration

Trust scores are written to blockchain to:
- Ensure provenance and immutability
- Enable transparent auditing
- Prevent tampering with historical scores

**Smart Contract**: [trustworthiness-smartcontract](https://github.com/FarmeraV2/trustworthiness-smartcontract)
**Local Docs**: [trustworthiness-smartcontract-readmefile.md](./trustworthiness-smartcontract-readmefile.md)

---

## 2. Transparency Score (Process Level)

### Purpose
Evaluate the completeness and consistency of farm activity documentation across different process levels.

### Key Principle
Transparency **starts from Step level** and uses TrustScore **only as a filter**, not as an input metric.

```
ValidLogs = { log | TrustScore(log) ≥ threshold }
```

---

## 2.1 TransparencyStep (SeasonDetail)

### Evaluation Question
> Is this step documented **completely and continuously**?

### Implementation Status

**Currently Active Indicators:**

| Indicator | Formula | Description |
|-----------|---------|-------------|
| **LogCoverage** | `min(validLogCount / min_logs, 1)` | Ratio of valid logs vs minimum expected |
| **ActivityRatio** | `active / (active + inactive)` | Proportion of meaningful activity logs |


### Trust Score Filtering

Before calculating transparency, logs are filtered by trust score:
```typescript
ValidLogs = { log | TrustScore(log) >= 0.8 }
```

### Current Scoring Formula

```typescript
TransparencyStep =
    W_ST_LOG_COVERAGE × LogCoverage
  + W_ST_ACTIVITY_RATIO × ActivityRatio

Result = min(score, 1)
```

---

## 2.2 TransparencySeason

### Purpose
Aggregate step-level transparency across an entire growing season with three evaluation dimensions.

### Scoring Components

#### 1. Process Transparency
Weighted aggregation of step transparency scores by step type:

```typescript
ProcessTransparency =
    weight(PREPARE, W_ST_TYPE_PREPARE)
  + weight(PLANTING, W_ST_TYPE_PLANTING)
  + weight(CARE, W_ST_TYPE_CARE)
  + weight(HARVEST, W_ST_TYPE_HARVEST)
  + weight(POST_HARVEST, W_ST_TYPE_POST_HARVEST)

where:
weight(steps, w) = steps.length === 0 ? 0 :
                   Σ(step.transparency_score × w) / steps.length
```

**Step Type Weights** (configurable per crop):
- Preparation: `W_ST_TYPE_PREPARE`
- Planting: `W_ST_TYPE_PLANTING`
- Care: `W_ST_TYPE_CARE`
- Harvest: `W_ST_TYPE_HARVEST`
- Post-Harvest: `W_ST_TYPE_POST_HARVEST`

#### 2. Temporal Transparency
Measures timeline adherence (expected vs actual end date):

```typescript
deviationDays = |actual_end_date - expected_end_date| / (24 * 60 * 60 * 1000)
maxAcceptableDeviation = 14 days  // 2 weeks tolerance

TemporalTransparency = max(1 - (deviationDays / maxAcceptableDeviation), 0)
```

#### 3. Outcome Consistency
Compares actual yield with expected yield:

```typescript
OutcomeConsistency = 1 - min(|actual_yield - expected_yield| / expected_yield, 1)
```

### Final Season Score

```typescript
TransparencySeason =
    W_SS_PROCESS × ProcessTransparency
  + W_SS_TEMPORAL × TemporalTransparency
  + W_SS_OUT_COME × OutcomeConsistency

Result = min(score, 1)
```

---

## 2.3 TransparencyPlot

### Evaluation Question
> How transparently is this plot managed across its growing season(s)?

### Crop Type Distinction

The calculation differs based on crop type:

#### SHORT_TERM Crops
Single-season crops (vegetables, grains):
```typescript
TransparencyPlot = TransparencySeason  // Direct assignment
```

#### LONG_TERM Crops
Multi-season crops (fruit trees, perennials):

Uses **exponential decay** with recency weighting to favor recent performance:

```typescript
LAMBDA = ln(2) / 6  // Half-life = 6 months

For each season:
  ageInMonths = (now - season.endDate) / (30 days)
  recencyWeight = exp(-LAMBDA × ageInMonths)

TransparencyPlot = Σ(recencyWeight × seasonScore) / Σ(recencyWeight)
```

**Recency Model**:
- Seasons lose 50% weight every 6 months
- More recent seasons have proportionally higher impact
- Older seasons fade but never completely disappear

---

## 2.4 TransparencyFarm

### Evaluation Question
> How transparent is this farm across its cultivation history and customer interactions?

### Two-Dimensional Evaluation

Farm transparency combines **internal process transparency** with **external customer trust**:

#### 1. Process Transparency
Aggregates all assigned seasons across farm with recency weighting:

```typescript
LAMBDA = ln(2) / 6  // Half-life = 6 months

For each season in farm:
  ageInMonths = (now - season.endDate) / (30 days)
  recencyWeight = exp(-LAMBDA × ageInMonths)

ProcessTransparency = Σ(recencyWeight × seasonScore) / Σ(recencyWeight)
```

**Note**: Aggregates at **season level**, not plot level. All assigned seasons contribute regardless of plot.

#### 2. Customer Trust Score
External validation through product ratings:

```typescript
CustomerTrustScore = avg(productRatings) / 5

where:
  productRatings = all ratings for farm's products
  score range: [0, 1]
```

### Final Farm Score

```typescript
FarmTransparency = min(
    W_FARM_PROCESS × ProcessTransparency
  + W_FARM_CUSTOMER_TRUST × CustomerTrustScore,
  1
)
```

**Weights**:
- `W_FARM_PROCESS`: Weight for internal process transparency
- `W_FARM_CUSTOMER_TRUST`: Weight for customer trust metrics

**Storage**:
- Recalculated daily via cron job (3:00 AM)
- Stored in farm table as JSONB
- Historical snapshots maintained for trend analysis

---

## 2.5 Automated Calculation

### Daily Cron Job

Farm transparency scores are automatically recalculated daily:

```typescript
@Cron('0 3 * * *')  // Runs at 3:00 AM daily
async handleCalcFarmTSCron()
```

**Process**:
1. Retrieves all farm IDs
2. Calculates transparency metrics for each farm
3. Updates farm transparency scores in database
4. Logs audit events

---

## 3. Efficiency Score (DEA Analysis)

### Purpose
Compare farms' transparency efficiency using Data Envelopment Analysis.

### Process
1. **Input**: FarmTransparency score (clean output from transparency module)
2. **Analysis**: DEA algorithm compares farm performance against peers
3. **Output**: EfficiencyScore indicating relative performance

---

## 4. FTES Composite Index

FTES is a **composite index** combining:
- **Transparency Score**: Absolute measure of documentation quality
- **Efficiency Score**: Relative measure against industry benchmarks

**Formula** (to be defined):
```
FTES = f(TransparencyFarm, EfficiencyScore)
```

> **Important**: FTES is NOT a trust model. It's a transparency and efficiency measurement framework.

---