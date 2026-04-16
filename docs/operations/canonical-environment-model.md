# Canonical Environment Model — SZL Holdings Platform

**Status:** AUTHORITATIVE  
**Effective date:** April 16, 2026  
**Supersedes:** `docs/ENVIRONMENT_SEPARATION.md`, `docs/audit/env-canonical-map.md`, `docs/architecture/env-registry.md` (registry entries only)

---

## Overview

The SZL Holdings platform operates in three environments. Each environment is isolated — separate database, separate secrets, separate deployment. This document defines the canonical model.

---

## Three-Environment Model

| Environment | Purpose | Platform | Database | Secrets Scope |
|-------------|---------|----------|----------|--------------|
| **development** | Active development in Replit workspace | Replit workspace | Replit PostgreSQL (dev instance) | Replit Secrets (shared scope) |
| **staging** | Pre-production validation (optional) | Replit deployment | Replit PostgreSQL (staging instance) | Replit Secrets (staging scope) |
| **production** | Live platform, real users | Replit autoscale deployment | Replit PostgreSQL (production instance) | Replit Secrets (production scope) |

### Critical Rules

1. **Database instances are never shared across environments.** The production `DATABASE_URL` must point to a separate PostgreSQL instance from dev.
2. **Secrets are scoped to environment.** A `SESSION_SECRET` set for development must not be the same value used in production.
3. **Demo data must never reach production.** The seed scripts run against development only. Before production launch, verify demo org is absent.
4. **`NODE_ENV` is always set correctly.** `development` in workspace, `production` in deployed environments.

---

## Environment Variable Reference

### Variables Set by Platform (Automatic)

| Variable | Development | Production | Notes |
|----------|-------------|-----------|-------|
| `NODE_ENV` | `development` | `production` | Set via `.replit [userenv.*]` |
| `PORT` | Auto-assigned | Auto-assigned | Each artifact gets unique port |
| `REPL_ID` | Auto-set | Auto-set | Replit platform identifier |
| `REPLIT_DEV_DOMAIN` | Auto-set | N/A | Dev proxy domain |

### Variables Set in `.replit [userenv.production]` (Non-Secret)

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Always production in deployment |
| `LOG_LEVEL` | `info` | Reduces verbosity in production |
| `CORS_ORIGINS` | `https://*.replit.app,...` | Production CORS allowlist |
| `PUBLIC_APP_URL` | `https://szlholdings.replit.app` | Override when custom domain is live |

### Variables Set in `.replit [userenv.shared]` (Non-Secret, All Environments)

| Variable | Notes |
|----------|-------|
| `VAPID_PUBLIC_KEY` | Public key for Web Push — intentionally public, safe to source-control |
| `VAPID_SUBJECT` | `mailto:platform@szlholdings.com` — contact address for push, not a secret |

### Variables Required in Replit Secrets (Per Environment)

#### Critical — Platform Will Not Start Without These

| Variable | Description | How to Generate |
|----------|-------------|----------------|
| `DATABASE_URL` | PostgreSQL connection string | Replit PostgreSQL panel |
| `SESSION_SECRET` | Cookie signing key (≥32 chars) | `openssl rand -hex 32` |

#### Required for Full Functionality

| Variable | Description | Required For |
|----------|-------------|-------------|
| `ALLOY_INTERNAL_TOKEN` | Internal API auth for Alloy services | Workflow engine |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI via Replit AI proxy | AI features |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Replit AI proxy URL | AI features |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic via Replit AI proxy | AI features |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` | Replit AI proxy URL | AI features |
| `AI_INTEGRATIONS_GEMINI_API_KEY` | Gemini via Replit AI proxy | AI features |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | Replit AI proxy URL | AI features |
| `VAPID_PRIVATE_KEY` | Private key for Web Push signing | Push notifications |

#### Required for Production Launch (Not Dev)

| Variable | Description | Status |
|----------|-------------|--------|
| `STRIPE_SECRET_KEY` | Live Stripe key | Not configured — demo mode |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing | Not configured |
| `RESEND_API_KEY` | Email delivery | Optional — graceful fallback |

#### Optional / Enterprise Features

| Variable | Description |
|----------|-------------|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP fallback |
| `OBJECT_STORAGE_BUCKET_ID` | File storage — falls back to local |
| `ADMIN_PIN` | CMS admin access |
| `HUGGINGFACE_API_KEY` | HuggingFace inference (optional AI provider) |
| `MAPBOX_ACCESS_TOKEN` | Map tiles for Terra / Vessels |

---

## Feature Flags (Environment-Based)

These are set as environment variables and default to `true` if unset:

| Variable | Default | Description |
|----------|---------|-------------|
| `FEATURE_ALLOY_ORCHESTRATION` | `true` | Alloy workflow subsystem |
| `FEATURE_ALLOY_GOVERNANCE` | `true` | Governance approvals |
| `FEATURE_ALLOY_WEBHOOKS` | `true` | Webhook delivery |
| `FEATURE_AUDIT_LOGGING` | `true` | Audit log capture |
| `ALLOY_WORKFLOW_AUTO_RUN` | `true` | Auto-run workflows on startup |
| `ALLOY_REQUIRE_APPROVAL_CRITICAL` | `true` | Human-in-loop for critical ops |

---

## Database Operations by Environment

| Operation | Development | Staging | Production |
|-----------|-------------|---------|-----------|
| Run migrations | `pnpm migrate` | `pnpm migrate` | `pnpm migrate` (with backup first) |
| Seed demo data | `pnpm seed:demo` | Never | Never |
| Access directly | `psql $DATABASE_URL` | Restricted | Restricted — snapshot only |
| Rollback | Replit checkpoint | Restore snapshot | Restore snapshot |

---

## What Development Is and Is Not

The Replit workspace (this environment) is:
- ✅ The canonical development environment
- ✅ The internal preview surface for demos and investor reviews
- ✅ The staging-equivalent for pre-production validation
- ❌ NOT a production environment — sessions are ephemeral, database is dev-seeded

---

_For deployment mechanics see `docs/architecture/canonical-deployment-model.md`. For secret handling see `docs/security/secrets-remediation.md`._
