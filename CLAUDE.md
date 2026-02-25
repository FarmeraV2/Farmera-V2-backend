# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Farmera V2 Backend — Final year project — Smart digital market for safe and clean food API built with NestJS 11 and TypeScript, using TypeORM with PostgreSQL. Key features: transparency of the production process based on blockchain technology, and a Farm Transparency & Evaluation System (FTES) with a multi-tier academic scoring mechanism.

## Common Commands

```bash
# Development
npm run start:dev          # Start with hot-reload

# Build
npm run build              # Compile to dist/

# Lint & Format
npm run lint               # ESLint with auto-fix
npm run format             # Prettier

# Tests
npm run test               # Unit tests (Jest)
npm run test:watch         # Watch mode
npm run test:cov           # Coverage
npm run test:e2e           # End-to-end tests

# Database Migrations
npm run migration:create-linux -- src/migrations/MigrationName  # Create migration (Linux)
npm run migration:create -- src/migrations/MigrationName        # Create migration (Windows)
npm run migration:run                                            # Run pending migrations
npm run migration:revert                                         # Revert last migration

# Docker
docker compose up          # Run with docker-compose (port 3000)
```

## Architecture

### Module Structure (`src/modules/`)

NestJS modular architecture. Each feature has its own module containing controller, service, DTOs, and entities.

**Feature modules:** user, farm, product, order, review, payment, address, notification, crop-management, qr, ftes (Farm Transparency & Evaluation System), blockchain, admin

**Shared modules (`src/core/`):** auth (JWT), redis, firebase (push notifications), twilio (SMS/email), file-storage (Local/R2/Azure Blob/Pinata), audit

### Routing

- Global prefix: `/api`
- URI-based API versioning
- Route grouping via `RouterModule` in `app.module.ts` (e.g., `/api/crop-management/*`, `/api/admin/*`)

### Authentication & Authorization

- JWT access + refresh tokens. Refresh token stored in httpOnly cookies.
- `JwtAuthGuard` applied globally — use `@Public()` decorator to bypass.
- `@Roles([UserRole.FARMER])` for role-based access (BUYER, FARMER, ADMIN).
- `@User()` parameter decorator extracts authenticated user from request.

### Database

- TypeORM with PostgreSQL. Config in `src/config/typeorm.config.ts`, CLI data source in `src/data-source.ts`.
- Entities use UUID public IDs + auto-increment internal IDs, `@Exclude()` on sensitive fields.
- Database triggers for audit trail (set up via migrations).
- Migrations in `src/migrations/`.

### Response Pattern

All responses go through a global `TransformInterceptor` that wraps data in:
```json
{ "statusCode": 200, "code": "SUCCESS_CODE", "message": "...", "data": {} }
```
Response codes defined in `src/common/constants/response-code.constant.ts`.

### File Storage

Factory pattern in `src/core/file-storage/`. Provider selected via `STORAGE_TYPE` env var (local, r2, azure, pinata). Multer handles uploads.

### Key Directories

- `src/common/` — decorators, guards, interceptors, filters, enums, DTOs, constants
- `src/contracts/` — smart contract ABIs (ProcessTracking, TrustComputation)
- `src/database/` — SQL scripts, triggers, utilities
- `src/services/` — shared services (HashService for bcrypt)
- `claude/` — academic framework documents for the FTES scoring system

## FTES Scoring Architecture

The Farm Transparency & Evaluation System uses a **4-tier scoring model**. See `claude/FTES_SCORING_ACADEMIC_FRAMEWORK.md` for full criterion derivation and `claude/ONCHAIN_SCORING_ACADEMIC_ANALYSIS.md` for formula proofs.

```
Tier 1: Log Trust Score    — on-chain  (TrustComputation → LogDefaultPackage.sol / LogAuditorPackage.sol)
Tier 2: Step Trust Index   — on-chain  (TrustComputation → StepTrustPackage.sol)
Tier 3: Season Score       — off-chain (transparency.service.ts)  ← INDEPENDENT of Farm Score
Tier 4: Farm Trust Score   — off-chain (transparency.service.ts)  ← INDEPENDENT of Season Score
```

### Tier 1 — Log Trust Score (on-chain)

**Without auditor:** `S_log = (60·Tsp + 40·Tec) / 100`, accept if ≥ 60. Tsp=100 is necessary (can never pass with Tsp=0).

**With auditor:** `S_log = (55·Tc + 30·Tsp + 15·Te) / 100`, accept if ≥ 70. Tc=100 is necessary (Tc=0 → max=45 < 70).

**Step score = Log score** (step formula removed — each step has exactly 1 log; TR/GP undefined for n=1).

**CR — pending Chainlink Functions integration** (see `claude/CHAINLINK_FUNCTIONS_CR_PLAN.md`). CR removed from current contracts due to oracle trust problem: centralized backend oracle cannot be verified on-chain. Planned: `CROracle.sol` using Chainlink DON → `getCR(logId)` → included in payload when ready. Future weights: LogDefault 50·Tsp+30·Tec+20·CR, LogAuditor 45·Tc+25·Tsp+15·Te+15·CR.

| Criterion | Definition |
|---|---|
| Tsp | Spatial Plausibility — GPS proximity to registered plot (binary: within threshold = 100, else 0) |
| Tec/Te | Evidence Completeness — `min((images+videos)/(MAX_IMAGE+MAX_VIDEO), 1)×100` |
| Tc | Auditor Consensus — Beta distribution posterior mean: `α/(α+β)×100` where α=Σrep(valid), β=Σrep(invalid). Continuous [0,100]. Tcs removed (coverage captured within Tc). |
| CR | Content Completeness Ratio — planned via Chainlink Functions. `covered_topics/expected_topics×100`. Wang & Strong (1996): Completeness (topical breadth). |

### Tier 2 — Step Trust Index (on-chain)

```
I_step = (47·DC + 30·VR + 13·CR + 10·TR) / 100 × GP/100,  accept if ≥ 60
```

| Criterion | Definition |
|---|---|
| DC | Documentation Completeness — `min(n_logs/n_min,1) × avg_log_score` |
| VR | Verification Ratio — `verified/(verified+rejected)`, default 70 if none reviewed |
| CR | Content Completeness Ratio — oracle input (keyword matching, off-chain) |
| TR | Temporal Regularity — `1 - min(CV/2, 1)` where CV = stddev/mean of inter-log gaps |
| GP | Gap Penalty — `exp(-0.3×k)×100` (k = suspicious gaps > 3× expected interval) |

Weights derived via AHP (Saaty 1980), CR ≈ 0.04 < 0.10 threshold. Backend acts as oracle only for CR.

### Tier 3 — Season Transparency Score (off-chain)

```
T_season = max(PT, 0.01)^0.68 × max(SA, 0.01)^0.21 × max(OC, 0.01)^0.11
```

| Criterion | Definition |
|---|---|
| PT | Process Transparency — weighted avg of step scores by type (CARE:50%, HARVEST:20%, PREPARE/PLANTING/POST_HARVEST:10% each) |
| SA | Schedule Adherence — sigmoid on deviation days: `1/(1+exp(0.3×(days-14)))` |
| OC | Outcome Consistency — `1 - min(|actual-expected|/expected, 1)` |

Geometric mean aggregation (Saaty 1980) — all dimensions must be simultaneously adequate.

### Tier 4 — Farm Trust Score (off-chain, INDEPENDENT)

```
T_farm = ((1 + p) / (2 + p + n)) × DSC^0.2
```

Uses **raw log audit counts** (not season scores). Based on Beta Reputation System (Jøsang & Ismail 2002).
- `p` = total verified logs, `n` = total rejected logs (across all seasons)
- `DSC` = seasons_with_transparency / total_seasons (disclosure commitment penalty)

### Key FTES Files

- `src/modules/ftes/transparency/transparency.service.ts` — Season + Farm score computation
- `src/modules/ftes/selective-transparency/` — CR oracle: keyword matching for topical completeness
- `src/modules/ftes/score-history/` — Score change tracking (entity + service)
- `src/modules/ftes/expected-activity/` — Expected activity templates per crop/step type
- `src/modules/ftes/calibration/` — Weight calibration service
- `src/modules/crop-management/constants/weight.constant.ts` — All scoring constants
- `ref/` — Published reference papers.

## Code Style

- Prettier: single quotes, trailing commas, tab width 4, print width 150
- ESLint with TypeScript type checking
- DTOs use class-validator decorators for validation
- Global validation pipe with `whitelist: true` and `forbidNonWhitelisted: true`
