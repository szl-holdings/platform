# Runbook: Secrets Management — SZL Holdings Platform

> Procedures for creating, rotating, and recovering secrets. Follow immediately in response to any suspected secret exposure.

---

## Emergency: Suspected Secret Exposure

If a secret may have been exposed (committed to git, logged, leaked in a bug report, etc.):

**Act within minutes, not hours.**

1. **Rotate immediately** — Do not wait to confirm exposure. Rotate first.
2. **Revoke old credential** — At the source (database, Stripe dashboard, etc.)
3. **Update all environments** — Development (Replit Secrets) + Production (Azure Key Vault)
4. **Audit access logs** — Check if the exposed secret was used by anyone other than the service
5. **Notify** — Inform stephen@szlholdings.com and, if customer data may be affected, follow breach notification procedures

---

## Secret Inventory

> Last updated: 2026-04-03. Review and update this inventory any time a new secret is added to the codebase.

### Database & Core

| Secret | Storage (Dev) | Storage (Prod) | Rotation Frequency |
|--------|---------------|----------------|-------------------|
| `DATABASE_URL` | Replit Secrets | Azure Key Vault | Annually + on any exposure |
| `SESSION_SECRET` | Replit Secrets | Azure Key Vault | Quarterly |
| `ADMIN_PIN` | Replit Secrets | Azure Key Vault | Quarterly |

### Authentication & Azure AD

| Secret | Storage (Dev) | Storage (Prod) | Rotation Frequency |
|--------|---------------|----------------|-------------------|
| `AZURE_AD_CLIENT_SECRET` | Replit Secrets | Azure Key Vault | Annually |
| `AZURE_AD_CLIENT_ID` | Replit Secrets | Azure Key Vault | On tenant change |
| `AZURE_AD_TENANT_ID` | Replit Secrets | Azure Key Vault | On tenant change |
| `OAUTH_CLIENT_SECRET` | — | Azure Key Vault | Annually |

### Azure Services

| Secret | Storage (Dev) | Storage (Prod) | Rotation Frequency |
|--------|---------------|----------------|-------------------|
| `AZURE_STORAGE_CONNECTION_STRING` | Replit Secrets | Azure Key Vault | Annually |
| `AZURE_REDIS_CONNECTION_STRING` | Replit Secrets | Azure Key Vault | Annually |
| `AZURE_APP_INSIGHTS_CONNECTION_STRING` | Replit Secrets | Azure Key Vault | Annually |
| `AZURE_DOC_INTEL_KEY` | Replit Secrets | Azure Key Vault | Annually |
| `AZURE_DOC_INTEL_ENDPOINT` | Replit Secrets | Azure Key Vault | On endpoint change |

### AI / ML APIs

| Secret | Storage (Dev) | Storage (Prod) | Rotation Frequency |
|--------|---------------|----------------|-------------------|
| `OPENAI_API_KEY` | Replit Secrets | Azure Key Vault | Annually + on exposure |
| `ANTHROPIC_API_KEY` | Replit Secrets | Azure Key Vault | Annually + on exposure |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit Secrets | Azure Key Vault | Annually + on exposure |
| `HUGGINGFACE_API_KEY` | Replit Secrets | Azure Key Vault | Annually |
| `HF_TOKEN` | Replit Secrets | Azure Key Vault | Annually (alias of `HUGGINGFACE_API_KEY`) |

> **Hugging Face Xet transport:** Xet is HF's chunk-deduplicated upload/download protocol used by `huggingface_hub>=0.32.0` (pinned in Python substrate workers). It does **not** require a separate secret — `HF_TOKEN` or `HUGGINGFACE_API_KEY` authenticates both standard Hub API calls and Xet transfers. No new secret needs to be provisioned for Xet. See `docs/operations/xet-developer-guide.md` for the full developer workflow.

### Payment & Integrations

| Secret | Storage (Dev) | Storage (Prod) | Rotation Frequency |
|--------|---------------|----------------|-------------------|
| `STRIPE_SECRET_KEY` | Replit Secrets | Azure Key Vault | Annually |
| `STRIPE_WEBHOOK_SECRET` | Replit Secrets | Azure Key Vault | On Stripe key rotation |
| `MAPBOX_ACCESS_TOKEN` | Replit Secrets | Azure Key Vault | Annually |
| `SMTP_PASS` | Replit Secrets | Azure Key Vault | Annually |
| `DOCUSIGN_CLIENT_ID` | Replit Secrets | Azure Key Vault | On DocuSign rotation |
| `DOCUSIGN_PRIVATE_KEY` | Replit Secrets | Azure Key Vault | Annually |
| `DOCUSIGN_CONNECT_HMAC_KEY` | Replit Secrets | Azure Key Vault | Annually |
| `DATAVERSE_CLIENT_SECRET` | Replit Secrets | Azure Key Vault | Annually |

---

## Rotating a Secret

### Development (Replit)

1. Generate a new secret value (use a secure random generator)
2. Open Replit Secrets panel
3. Update the secret value
4. Restart the affected workflow(s)
5. Verify the service starts correctly

### Production (Azure Key Vault)

```bash
# Update a secret in Azure Key Vault
az keyvault secret set \
  --vault-name $AZURE_KEY_VAULT_NAME \
  --name <SECRET-NAME> \
  --value "<new-secret-value>"

# Verify it was set
az keyvault secret show \
  --vault-name $AZURE_KEY_VAULT_NAME \
  --name <SECRET-NAME> \
  --query "value" -o tsv
```

After updating Key Vault:
1. Restart the Azure App Service (forces the service to re-read Key Vault references)
2. Verify health check passes

---

## Rotating the Database Password

1. Generate a new strong password (≥32 chars, alphanumeric + special)
2. Update the password in Azure PostgreSQL:
   ```bash
   az postgres flexible-server update \
     --resource-group $AZURE_RESOURCE_GROUP \
     --name <server-name> \
     --admin-password "<new-password>"
   ```
3. Update `DATABASE_URL` secret in Azure Key Vault:
   ```
   postgresql://<user>:<new-password>@<host>/<db>?sslmode=require
   ```
4. Restart API server
5. Verify health check and database connectivity

---

## Rotating SESSION_SECRET

Session secret rotation will invalidate all active user sessions (users will be logged out).

1. Generate new secret: `openssl rand -hex 32`
2. Update in Replit Secrets and Azure Key Vault
3. Restart API server
4. All users will need to re-authenticate (expected behavior)
5. Schedule during low-traffic period if possible

---

## Rotating Stripe Keys

1. Go to Stripe Dashboard → Developers → API Keys
2. Click "Roll key" or create a new restricted key
3. Update `STRIPE_SECRET_KEY` in Replit Secrets and Azure Key Vault
4. Update `STRIPE_PUBLISHABLE_KEY` in frontend config (not a secret, but needs updating)
5. Update webhook endpoints if webhook secret also changed
6. Test a payment flow end-to-end in test mode before production

---

## Generating Secrets

Use cryptographically secure generators:

```bash
# Generate a 32-byte hex secret (for SESSION_SECRET, etc.)
openssl rand -hex 32

# Generate a 64-character alphanumeric secret
openssl rand -base64 48 | tr -d '/+=' | head -c 64

# Generate a numeric PIN (for ADMIN_PIN)
openssl rand -hex 4 | tr 'a-f' '0-9' | head -c 6
```

**Never** use:
- Dictionary words or phrases
- Personal information
- Sequential numbers
- Common patterns (1234, 0000, etc.)

---

## Secret Audit Checklist

Run this audit quarterly:

- [ ] No secrets in git history (`git log --all -S "secret" -- "*.env"`)
- [ ] No secrets in application logs (grep logs for known patterns)
- [ ] All secrets are environment-specific (dev ≠ prod)
- [ ] All Key Vault access policies reviewed (minimum permissions)
- [ ] All API keys verified as active and not expired
- [ ] Rotation schedule is current

---

## Recovery: Lost Access to Key Vault

If Azure Key Vault access is lost:

1. Verify Azure RBAC permissions for the service principal
2. Check if soft-delete has removed the vault
3. Contact Azure support if access cannot be restored
4. Recreate Key Vault from secure backup of secret values (stored separately in secure vault like 1Password or similar)

**Critical:** Keep an offline, encrypted record of all secret values in a secure password manager. Key Vault is the primary store, but the offline record is the recovery path.
