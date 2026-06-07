# Credential Rotation Required

Generated: 2026-04-15

## Overview

This document lists every credential-bearing artifact that must be rotated or verified before production deployment.

## API Server Secrets

| Secret | Usage | Rotation Action |
|--------|-------|-----------------|
| `SESSION_SECRET` | Express session signing | Generate new 64-char hex string |
| `FIELD_ENCRYPTION_KEY` | AES-256 field-level encryption | Generate new 64-char hex string |
| `CONNECTOR_ENCRYPTION_KEY` | RMM/connector credential encryption | Generate new 64-char hex string |
| `ALLOY_INTERNAL_TOKEN` | Internal service-to-service auth | Generate new 64-char random token |

## AI Integration Keys

| Secret | Service | Rotation Action |
|--------|---------|-----------------|
| `OPENAI_API_KEY` | OpenAI API | Rotate in OpenAI dashboard |
| `ANTHROPIC_API_KEY` | Anthropic API | Rotate in Anthropic console |
| `GEMINI_API_KEY` | Google Gemini | Rotate in Google Cloud console |
| `HF_TOKEN` | Hugging Face | Rotate in HF settings |

## External Service Keys

| Secret | Service | Rotation Action |
|--------|---------|-----------------|
| `STRIPE_SECRET_KEY` | Stripe payments | Rotate in Stripe dashboard |
| `SENDGRID_API_KEY` | Email delivery | Rotate in SendGrid settings |
| `RESEND_API_KEY` | Email delivery (alt) | Rotate in Resend dashboard |
| `MAPBOX_ACCESS_TOKEN` | Map tiles | Rotate in Mapbox account |
| `GOOGLE_MAPS_API_KEY` | Google Maps | Rotate in GCP console |
| `DATAVERSE_CLIENT_SECRET` | Microsoft Dataverse | Rotate in Azure AD |

## Database

| Secret | Usage | Rotation Action |
|--------|-------|-----------------|
| `DATABASE_URL` | PostgreSQL connection | Managed by Replit — rotate via Replit DB panel |

## GitHub / CI

| Secret | Usage | Rotation Action |
|--------|-------|-----------------|
| `REPLIT_STAGING_DEPLOY_TOKEN` | Staging deployment | Generate in Replit deployment settings |
| `REPLIT_STAGING_APP_ID` | Staging app identifier | From Replit deployment settings |
| `REPLIT_PROD_DEPLOY_TOKEN` | Production deployment | Generate in Replit deployment settings |
| `REPLIT_PROD_APP_ID` | Production app identifier | From Replit deployment settings |

## Mobile (EAS)

| Secret | Usage | Rotation Action |
|--------|-------|-----------------|
| `EXPO_TOKEN` | EAS build/submit | Rotate in Expo account settings |
| `APPLE_TEAM_ID` | iOS signing | Static — from Apple Developer account |
| `GOOGLE_SERVICES_JSON` | Firebase config | Download fresh from Firebase console |
| `GoogleService-Info.plist` | Firebase config (iOS) | Download fresh from Firebase console |

## Test Credentials

| Item | Location | Status |
|------|----------|--------|
| `szl-test-integration-live-2026` | `tests/api/server-live.test.ts` | ✅ RESOLVED — token now read from `INTEGRATION_TEST_TOKEN` env var; hardcoded value removed |

## Rotation Schedule

| Frequency | Secrets |
|-----------|---------|
| Every 90 days | SESSION_SECRET, FIELD_ENCRYPTION_KEY, CONNECTOR_ENCRYPTION_KEY, ALLOY_INTERNAL_TOKEN |
| Every 180 days | AI API keys, external service keys |
| On compromise | All secrets immediately |
| Never rotated (static) | APPLE_TEAM_ID, app bundle IDs |
