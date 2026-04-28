# Runbook: Custom Domain Setup — SZL Holdings Platform

> Steps to connect a custom domain (e.g., szlholdings.com) to the deployed project.
> Two deployment paths are covered: **Replit** (dev/staging) and **Azure Front Door** (production).

---

## Prerequisites

- A registered domain name (e.g., szlholdings.com) through a registrar (e.g., Namecheap, Cloudflare, GoDaddy)
- Access to the domain's DNS management panel
- The project published and healthy at its deployment URL

---

## Path A — Replit Deployment

### Step 1: Publish the Project First

Before connecting a custom domain, ensure the project is live and healthy at its Replit-assigned domain:

```
https://szlholdings.replit.app
```

Verify:
- [ ] The SZL Holdings homepage loads
- [ ] `/api/healthz` returns `{ "status": "ok" }`
- [ ] All public routes respond correctly

---

### Step 2: Add the Custom Domain in Replit

1. Open the project in Replit
2. Click the **Deploy** button in the top toolbar
3. In the Deployment panel, click **Custom Domain**
4. Enter your domain: `szlholdings.com` (and optionally `www.szlholdings.com`)
5. Replit will provide you with:
   - A **CNAME target** (e.g., `domains.replit.app`)
   - Or an **A record** IP address

Record these values — you'll need them for DNS.

---

### Step 3: Configure DNS (Replit)

Log into your domain registrar's DNS management panel and add the following records:

#### Root domain (`szlholdings.com`)

Most registrars support CNAME flattening (ALIAS/ANAME records) for the root domain:

| Type  | Name | Value                  | TTL  |
|-------|------|------------------------|------|
| ALIAS | @    | `domains.replit.app`   | 300  |

If your registrar does not support ALIAS/ANAME at the root, use the A record IP provided by Replit:

| Type | Name | Value         | TTL  |
|------|------|---------------|------|
| A    | @    | `<Replit IP>` | 300  |

#### WWW subdomain (`www.szlholdings.com`)

| Type  | Name | Value                | TTL  |
|-------|------|----------------------|------|
| CNAME | www  | `domains.replit.app` | 300  |

> Recommended: Use Cloudflare as your DNS provider — it supports CNAME flattening at the root, provides DDoS protection, and CDN caching for free.

---

## Path B — Azure Front Door Deployment

### Step 1: Deploy the Azure Infrastructure

Run the Bicep deployment (from the `infra/` directory):

```bash
az deployment group create \
  --resource-group szlholdings-rg \
  --template-file main.bicep \
  --parameters @parameters.json
```

Once deployed, capture the Front Door endpoint hostname from the deployment output:

```bash
az deployment group show \
  --resource-group szlholdings-rg \
  --name main \
  --query properties.outputs.frontDoorEndpoint.value \
  --output tsv
# Example: szlholdings-endpoint.z01.azurefd.net
```

---

### Step 2: Validate Custom Domain Ownership

Azure Front Door requires you to prove domain ownership before it issues a managed TLS certificate. The deployment will have created two custom domain resources (`szlholdings.com` and `www.szlholdings.com`). For each domain, retrieve the DNS validation token:

```bash
az afd custom-domain show \
  --resource-group szlholdings-rg \
  --profile-name szlholdings-frontdoor \
  --custom-domain-name szlholdings-com \
  --query "validationProperties.validationToken" \
  --output tsv
```

Repeat for `www-szlholdings-com`.

Add these DNS records at your registrar for each domain:

| Type | Name                        | Value                          | TTL  |
|------|-----------------------------|--------------------------------|------|
| TXT  | `_dnsauth.szlholdings.com`  | `<validationToken for apex>`   | 3600 |
| TXT  | `_dnsauth.www.szlholdings.com` | `<validationToken for www>`  | 3600 |

---

### Step 3: Configure DNS (Azure Front Door)

After validation is complete, point your domain to the Front Door endpoint:

#### Root domain (`szlholdings.com`)

| Type  | Name | Value                                     | TTL  |
|-------|------|-------------------------------------------|------|
| ALIAS | @    | `<frontDoorEndpoint>.azurefd.net`         | 300  |

If your registrar does not support ALIAS/ANAME at the root:

| Type  | Name | Value                                     | TTL  |
|-------|------|-------------------------------------------|------|
| CNAME | @    | `<frontDoorEndpoint>.azurefd.net`         | 300  |

#### WWW subdomain (`www.szlholdings.com`)

| Type  | Name | Value                                     | TTL  |
|-------|------|-------------------------------------------|------|
| CNAME | www  | `<frontDoorEndpoint>.azurefd.net`         | 300  |

> The `www` subdomain is automatically 301-redirected to the apex domain (`szlholdings.com`) by the Front Door Rules Engine rule `RedirectWwwToApex`.

---

### Step 4: Wait for TLS Certificate Provisioning

Azure Front Door automatically provisions managed TLS certificates once DNS propagation is complete. This typically takes 5–30 minutes.

Check certificate status:

```bash
az afd custom-domain show \
  --resource-group szlholdings-rg \
  --profile-name szlholdings-frontdoor \
  --custom-domain-name szlholdings-com \
  --query "domainValidationState" \
  --output tsv
# Should return: Approved
```

---

## Step 4: Wait for DNS Propagation (both paths)

DNS changes typically propagate within 5–30 minutes, but can take up to 48 hours globally.

Check propagation status:
```bash
dig szlholdings.com +short
nslookup szlholdings.com
```

Or use: https://dnschecker.org

---

## Step 5: Verify TLS / HTTPS

Once DNS has propagated and the certificate is issued:

```bash
curl -I https://szlholdings.com
# Expected: HTTP/2 200

curl -I https://www.szlholdings.com
# Expected: HTTP/2 301 → Location: https://szlholdings.com/...
```

---

## Step 6: Update Environment Variables

After the custom domain is live, update the following production environment variables:

```bash
PUBLIC_APP_URL=https://szlholdings.com
CORS_ORIGINS=https://szlholdings.com,https://www.szlholdings.com,https://*.replit.app,https://*.replit.dev
```

Also update `robots.txt` and `sitemap.xml` if they reference the old domain.

---

## Step 7: Configure HSTS and Security Headers

The API server already sets HSTS headers in production mode:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

Once the domain is stable, submit it to the HSTS Preload List:
- Visit: https://hstspreload.org
- Enter: `szlholdings.com`

> Only do this after you are certain you will always serve HTTPS on this domain.

---

## Step 8: Update Integrations

After custom domain is live, update any services that reference the old URL:

- [ ] OAuth redirect URIs (Replit Auth / OIDC)
- [ ] Email templates (any links to the site)
- [ ] Status page URL (if configured)
- [ ] Internal monitoring and alerting URLs

---

## Troubleshooting

### "Domain already in use" error in Replit
Another project has claimed this domain in Replit. Contact Replit support if it is your domain.

### Certificate provisioning fails (Azure)
- Ensure both `_dnsauth` TXT records are present and DNS has propagated before Azure attempts certificate issuance
- Check the `domainValidationState` field via the CLI command above

### Certificate provisioning fails (Replit)
- Ensure DNS is fully propagated before Replit attempts to issue the certificate
- CNAME records must resolve before TLS provisioning begins

### Site loads on `www` but not root (or vice versa)
- Verify both records (ALIAS/A for root, CNAME for www) are configured
- For Replit: check that both `szlholdings.com` and `www.szlholdings.com` are added in the domain panel

### Mixed content warnings
The app is served over HTTPS but some resources may load over HTTP. Check browser console for warnings and update any hardcoded `http://` URLs.

---

## Notes

- Replit-assigned domains (`*.replit.app`) will continue to work after the custom domain is connected
- The `.replit.app` domain can serve as a fallback URL if needed
- Custom domain configuration is per-deployment; if you redeploy from scratch, re-add the domain
- The Front Door `WwwToApexRedirect` rule set handles all `www.szlholdings.com` → `szlholdings.com` redirects automatically; no extra DNS redirect record is needed
