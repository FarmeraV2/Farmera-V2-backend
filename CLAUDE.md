# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Farmera V2 Backend — an Final year project — Smart digital market for safe and clean food API built with NestJS 11 and TypeScript, using TypeORM with PostgreSQL. Key features: transparency of the production process based on blockchain technology, and a transparency scoring mechanism for farms based on their production processes

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

## Code Style

- Prettier: single quotes, trailing commas, tab width 4, print width 150
- ESLint with TypeScript type checking
- DTOs use class-validator decorators for validation
- Global validation pipe with `whitelist: true` and `forbidNonWhitelisted: true`
