#!/usr/bin/env bash
# =============================================================================
# SZL Holdings — Secret Rotation Script
# =============================================================================
# Generates fresh values for all rotatable platform secrets and validates the
# current environment against the secret contract.
#
# USAGE:
#   bash scripts/rotate-secrets.sh [--validate-only]
#
# OPTIONS:
#   --validate-only   Only check which secrets are set/missing; do not generate
#                     new values.
#
# OUTPUT:
#   Prints newly generated secret values in a copy-paste-ready format for the
#   Replit Secrets panel and GitHub Actions secrets.  Values are NEVER written
#   to disk or environment — the operator must paste them manually.
#
# OUT OF SCOPE:
#   - This script does NOT apply changes to any system.
#   - Third-party API key rotation (OpenAI, Anthropic, Stripe…) requires action
#     in the respective provider console and is not handled here.
# =============================================================================

set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}  ✔  $*${RESET}"; }
warn() { echo -e "${YELLOW}  ⚠  $*${RESET}"; }
err()  { echo -e "${RED}  ✘  $*${RESET}"; }
hdr()  { echo -e "\n${BOLD}${CYAN}$*${RESET}"; }

# ── Argument parsing ──────────────────────────────────────────────────────────
VALIDATE_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --validate-only) VALIDATE_ONLY=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

# ── Secret contract definition ────────────────────────────────────────────────
# Format: "KEY|classification|rotation_method|note"
#   classification: required | recommended | optional
#   rotation_method: hex32 | hex64 | base64_24 | vapid | manual
SECRET_CONTRACT=(
  "SESSION_SECRET|required|hex32|Session encryption secret — min 32 chars"
  "FIELD_ENCRYPTION_KEY|required|hex64|AES-256 PII column encryption key — 64 hex chars (32 bytes)"
  "CONNECTOR_ENCRYPTION_KEY|required|hex64|AES-256-GCM credential storage key — 64 hex chars (32 bytes)"
  "ALLOY_INTERNAL_TOKEN|required|base64_48|M2M privileged agent access token — min 32 chars"
  "OAUTH_STATE_SECRET|required|hex32|CSRF protection for OAuth state parameters"
  "INTEGRATION_TEST_TOKEN|recommended|base64_24|Integration test auth token"
  "VAPID_PRIVATE_KEY|recommended|vapid|Web Push VAPID private key (rotate keypair together)"
  "IP_HASH_SALT|recommended|hex32|Salt for privacy-preserving IP hashing"
  "MFA_SECRET_ENCRYPTION_KEY|recommended|hex64|TOTP secret encryption key"
  "ADMIN_PIN|required|manual|Admin dashboard PIN — required in production; set a strong passphrase manually"
  "SUBSTRATE_GATEWAY_API_KEY|required|base64_48|Substrate gateway API key — required in production for bearer-token auth"
  "SUBSTRATE_SIGNING_KEY|required|hex64|Substrate request signing key — required in production for agent-mesh HMAC"
)

# ── Validate: check which secrets are currently set ───────────────────────────
hdr "═══════════════════════════════════════════════════"
hdr " SZL Holdings — Secret Rotation & Validation Tool"
hdr "═══════════════════════════════════════════════════"

if [ "$VALIDATE_ONLY" = true ]; then
  echo -e "\n${BOLD}Mode: validate-only (no new values generated)${RESET}"
fi

hdr "1. Current Environment Audit"
echo ""

MISSING_REQUIRED=0
MISSING_RECOMMENDED=0

for entry in "${SECRET_CONTRACT[@]}"; do
  IFS='|' read -r key classification _method note <<< "$entry"
  if [ -n "${!key:-}" ]; then
    ok "${key}  (${classification}) — SET"
  else
    case "$classification" in
      required)
        err "${key}  (${classification}) — MISSING  »  ${note}"
        MISSING_REQUIRED=$((MISSING_REQUIRED + 1))
        ;;
      recommended)
        warn "${key}  (${classification}) — MISSING  »  ${note}"
        MISSING_RECOMMENDED=$((MISSING_RECOMMENDED + 1))
        ;;
      optional)
        echo -e "     ${key}  (${classification}) — not set (optional)"
        ;;
    esac
  fi
done

echo ""
if [ "$MISSING_REQUIRED" -gt 0 ]; then
  err "${MISSING_REQUIRED} required secret(s) are missing — platform will fail in production."
else
  ok "All required secrets are set."
fi
if [ "$MISSING_RECOMMENDED" -gt 0 ]; then
  warn "${MISSING_RECOMMENDED} recommended secret(s) are missing — some features may be degraded."
fi

if [ "$VALIDATE_ONLY" = true ]; then
  echo ""
  echo "Validation complete (--validate-only mode; no new values generated)."
  exit 0
fi

# ── Generate new secret values ────────────────────────────────────────────────
hdr "2. Generated Rotation Values"
echo -e "  Copy each value into the ${BOLD}Replit Secrets panel${RESET} and, where noted,"
echo -e "  into ${BOLD}GitHub Actions secrets${RESET}."
echo -e "  ${RED}DO NOT share these values over chat or email.${RESET}"
echo ""

# Naming convention: generate_<output_hex_chars>hexchars()
# openssl rand -hex N  →  N bytes  →  2N hex characters in output.
generate_64hexchars()  { openssl rand -hex 32; }   # 32 bytes → 64 hex chars  (AES-256 keys, high-entropy secrets)
generate_128hexchars() { openssl rand -hex 64; }   # 64 bytes → 128 hex chars (reserved; not currently used)
generate_base64_24()   { openssl rand -base64 24 | tr -d '\n'; }  # 24 bytes → ~32 base64 chars
generate_base64_48()   { openssl rand -base64 48 | tr -d '\n'; }  # 48 bytes → 64 base64 chars

generate_vapid() {
  local raw
  if raw=$(npx --yes web-push generate-vapid-keys 2>/dev/null); then
    # npx web-push generate-vapid-keys prints two labelled lines:
    #   Public Key:  <key>
    #   Private Key: <key>
    local pub priv
    pub=$(echo "$raw"  | grep -i 'public'  | sed 's/.*:[[:space:]]*//')
    priv=$(echo "$raw" | grep -i 'private' | sed 's/.*:[[:space:]]*//')
    if [ -n "$pub" ] && [ -n "$priv" ]; then
      echo "  VAPID_PUBLIC_KEY=${pub}"
      echo "  VAPID_PRIVATE_KEY=${priv}"
    else
      echo "  (web-push output was unexpected — raw output:)"
      echo "$raw" | sed 's/^/    /'
    fi
  else
    warn "npx web-push generate-vapid-keys failed — is node/npx available?"
    echo "  Fallback: run manually on a machine with Node.js:"
    echo "    npx web-push generate-vapid-keys"
  fi
}

separator() { echo "  ──────────────────────────────────────────────"; }

# SESSION_SECRET
separator
echo -e "  ${BOLD}SESSION_SECRET${RESET}  (required — Replit Secrets + GitHub Actions)"
printf "  Value: %s\n" "$(generate_64hexchars)"

# FIELD_ENCRYPTION_KEY
separator
echo -e "  ${BOLD}FIELD_ENCRYPTION_KEY${RESET}  (required — Replit Secrets)"
echo -e "  ${RED}WARNING: Rotating this key requires re-encrypting all PII columns before swap.${RESET}"
echo -e "  Consult runbooks/field-key-rotation.md before applying."
printf "  Value: %s\n" "$(generate_64hexchars)"

# CONNECTOR_ENCRYPTION_KEY
separator
echo -e "  ${BOLD}CONNECTOR_ENCRYPTION_KEY${RESET}  (required — Replit Secrets)"
echo -e "  ${RED}WARNING: Rotating this key requires re-encrypting all stored connector credentials.${RESET}"
printf "  Value: %s\n" "$(generate_64hexchars)"

# ALLOY_INTERNAL_TOKEN
separator
echo -e "  ${BOLD}ALLOY_INTERNAL_TOKEN${RESET}  (required — Replit Secrets + GitHub Actions)"
printf "  Value: szl-%s\n" "$(generate_base64_48)"

# OAUTH_STATE_SECRET
separator
echo -e "  ${BOLD}OAUTH_STATE_SECRET${RESET}  (required — Replit Secrets)"
printf "  Value: %s\n" "$(generate_64hexchars)"

# INTEGRATION_TEST_TOKEN
separator
echo -e "  ${BOLD}INTEGRATION_TEST_TOKEN${RESET}  (recommended — Replit Secrets + GitHub Actions)"
printf "  Value: %s\n" "$(generate_base64_24)"

# IP_HASH_SALT
separator
echo -e "  ${BOLD}IP_HASH_SALT${RESET}  (recommended — Replit Secrets)"
printf "  Value: %s\n" "$(generate_64hexchars)"

# MFA_SECRET_ENCRYPTION_KEY
separator
echo -e "  ${BOLD}MFA_SECRET_ENCRYPTION_KEY${RESET}  (recommended — Replit Secrets)"
echo -e "  ${RED}WARNING: Rotating invalidates all existing TOTP enrollments.${RESET}"
printf "  Value: %s\n" "$(generate_64hexchars)"

# SUBSTRATE_GATEWAY_API_KEY
separator
echo -e "  ${BOLD}SUBSTRATE_GATEWAY_API_KEY${RESET}  (required — Replit Secrets)"
printf "  Value: szl_gw_%s\n" "$(generate_base64_48)"

# SUBSTRATE_SIGNING_KEY
separator
echo -e "  ${BOLD}SUBSTRATE_SIGNING_KEY${RESET}  (required — Replit Secrets)"
printf "  Value: %s\n" "$(generate_64hexchars)"

# ADMIN_PIN — manual only
separator
echo -e "  ${BOLD}ADMIN_PIN${RESET}  (required in production — Replit Secrets)"
echo "  Value: <choose a strong passphrase — not auto-generated>"

# VAPID keypair — special case
separator
echo -e "  ${BOLD}VAPID_PRIVATE_KEY + VAPID_PUBLIC_KEY${RESET}  (recommended — Replit Secrets)"
echo -e "  ${YELLOW}NOTE: Both keys must be rotated together. Existing push subscriptions will be invalidated.${RESET}"
generate_vapid

separator
echo ""

# ── Post-rotation checklist ───────────────────────────────────────────────────
hdr "3. Post-Rotation Checklist"
echo ""
echo "  After pasting values into Replit Secrets:"
echo ""
echo "  [ ] Restart the api-server workflow to pick up the new secrets"
echo "  [ ] Run this script with --validate-only to confirm all secrets are set"
echo "  [ ] Update FIELD_ENCRYPTION_KEY only after running the key-rotation migration"
echo "  [ ] Update MFA_SECRET_ENCRYPTION_KEY only after clearing TOTP enrollments"
echo "  [ ] For VAPID rotation: clear all push subscriptions, notify users to re-subscribe"
echo "  [ ] Update ops/security/rotate-now.md to mark items complete"
echo "  [ ] Add to GitHub Actions secrets (SESSION_SECRET, ALLOY_INTERNAL_TOKEN,"
echo "      INTEGRATION_TEST_TOKEN) if CI tests authenticate against the API"
echo ""
echo -e "${GREEN}${BOLD}Rotation values generated. Apply them to Replit Secrets now.${RESET}"
echo ""
