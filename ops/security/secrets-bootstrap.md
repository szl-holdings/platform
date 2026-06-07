# Secrets Bootstrap Guide

Generated: 2026-04-15

## Overview

This document provides the exact secret inventory needed to run the SZL Holdings platform across all environments.

## Replit Workspace Secrets (Development)

Set these in the Replit Secrets panel:

### Required for API Server
```
DATABASE_URL              # Auto-populated by Replit PostgreSQL
SESSION_SECRET            # 64-char hex: openssl rand -hex 32
FIELD_ENCRYPTION_KEY      # 64-char hex: openssl rand -hex 32
CONNECTOR_ENCRYPTION_KEY  # 64-char hex: openssl rand -hex 32
ALLOY_INTERNAL_TOKEN      # 64-char random: openssl rand -base64 48
```

### Required for AI Features
```
OPENAI_API_KEY            # sk-... from OpenAI dashboard
ANTHROPIC_API_KEY         # sk-ant-... from Anthropic console
GEMINI_API_KEY            # From Google AI Studio
```

### Optional External Services
```
STRIPE_SECRET_KEY         # sk_test_... for dev, sk_live_... for prod
SENDGRID_API_KEY          # SG.... from SendGrid
RESEND_API_KEY            # re_... from Resend
MAPBOX_ACCESS_TOKEN       # pk.... from Mapbox
GOOGLE_MAPS_API_KEY       # From GCP console
HF_TOKEN                  # hf_... from Hugging Face
```

## GitHub Actions Secrets

Set in repo Settings > Secrets and variables > Actions:

### Deployment
```
REPLIT_STAGING_DEPLOY_TOKEN   # From Replit deployment settings
REPLIT_STAGING_APP_ID         # From Replit deployment settings
REPLIT_PROD_DEPLOY_TOKEN      # From Replit deployment settings
REPLIT_PROD_APP_ID            # From Replit deployment settings
```

### CI Testing (optional)
```
INTEGRATION_TEST_TOKEN        # For integration test auth bypass
```

## GitHub Environment Secrets

### Staging Environment
Create environment "staging" in repo Settings > Environments:
```
REPLIT_DEPLOY_TOKEN = ${REPLIT_STAGING_DEPLOY_TOKEN}
REPLIT_APP_ID = ${REPLIT_STAGING_APP_ID}
```

### Production Environment
Create environment "production" in repo Settings > Environments (require reviewer approval):
```
REPLIT_DEPLOY_TOKEN = ${REPLIT_PROD_DEPLOY_TOKEN}
REPLIT_APP_ID = ${REPLIT_PROD_APP_ID}
```

## EAS / Mobile Secrets

Set in EAS Secrets (expo.dev dashboard):
```
EXPO_TOKEN                    # For automated EAS builds
```

For local mobile development, ensure:
- `GoogleService-Info.plist` in szl-holdings-mobile/ios/ (not committed)
- `google-services.json` in szl-holdings-mobile/android/app/ (not committed)

## Secret Generation Commands

```bash
# Session secret
openssl rand -hex 32

# Encryption keys
openssl rand -hex 32

# Internal token
openssl rand -base64 48

# Verify no secrets in source
grep -r "sk-" --include="*.ts" --include="*.tsx" artifacts/ lib/
grep -r "sk_live" --include="*.ts" --include="*.tsx" artifacts/ lib/
```

## VITE_* Environment Variables (Client-Safe Only)

These are the only env vars that should use the VITE_ prefix (they are embedded in client bundles):

```
VITE_API_URL          # API base URL (public)
VITE_APP_VERSION      # App version string (public)
VITE_SENTRY_DSN       # Sentry error tracking (public by design)
VITE_POSTHOG_KEY      # PostHog analytics (public by design)
VITE_MAPBOX_TOKEN     # Mapbox public token (pk.*, not sk.*)
```

Never use VITE_ prefix for: API keys, secret keys, database URLs, session secrets, encryption keys, or any credential that should remain server-side.
