# Runbook: Custom Domain Setup — SZL Holdings Platform

> Steps to connect a custom domain (e.g., szlholdings.com) to the deployed Replit project.
> This is out of scope for the initial deployment — complete this after the `.replit.app` production URL is verified and stable.

---

## Prerequisites

- A registered domain name (e.g., szlholdings.com) through a registrar (e.g., Namecheap, Cloudflare, GoDaddy)
- Access to the domain's DNS management panel
- The project published and working at its `.replit.app` URL

---

## Step 1: Publish the Project First

Before connecting a custom domain, ensure the project is live and healthy at its Replit-assigned domain:

```
https://szlholdings.replit.app
```

Verify:
- [ ] The SZL Holdings homepage loads
- [ ] `/api/healthz` returns `{ "status": "ok" }`
- [ ] All public routes respond correctly

---

## Step 2: Add the Custom Domain in Replit

1. Open the project in Replit
2. Click the **Deploy** button in the top toolbar
3. In the Deployment panel, click **Custom Domain**
4. Enter your domain: `szlholdings.com` (and optionally `www.szlholdings.com`)
5. Replit will provide you with:
   - A **CNAME target** (e.g., `domains.replit.app`)
   - Or an **A record** IP address

Record these values — you'll need them for DNS.

---

## Step 3: Configure DNS

Log into your domain registrar's DNS management panel and add the following records:

### Root domain (`szlholdings.com`)

Most registrars support CNAME flattening (ALIAS/ANAME records) for the root domain:

| Type  | Name | Value                  | TTL  |
|-------|------|------------------------|------|
| ALIAS | @    | `domains.replit.app`   | 300  |

If your registrar does not support ALIAS/ANAME at the root, use the A record IP provided by Replit:

| Type | Name | Value         | TTL  |
|------|------|---------------|------|
| A    | @    | `<Replit IP>` | 300  |

### WWW subdomain (`www.szlholdings.com`)

| Type  | Name | Value                | TTL  |
|-------|------|----------------------|------|
| CNAME | www  | `domains.replit.app` | 300  |

> Recommended: Use Cloudflare as your DNS provider — it supports CNAME flattening at the root, provides DDoS protection, and CDN caching for free.

---

## Step 4: Wait for DNS Propagation

DNS changes typically propagate within 5–30 minutes, but can take up to 48 hours globally.

Check propagation status:
```bash
dig szlholdings.com +short
# Should return the Replit IP or CNAME target
nslookup szlholdings.com
```

Or use: https://dnschecker.org

---

## Step 5: Verify TLS / HTTPS

Replit automatically provisions a TLS certificate via Let's Encrypt once DNS propagation is complete. No manual certificate management is required.

Verify HTTPS works:
```bash
curl -I https://szlholdings.com
# Expected: HTTP/2 200
```

---

## Step 6: Update Environment Variables

After the custom domain is live, update the following production environment variables:

```bash
# Update PUBLIC_APP_URL to the custom domain
PUBLIC_APP_URL=https://szlholdings.com  # (production env)

# Update CORS_ORIGINS to include the custom domain
CORS_ORIGINS=https://szlholdings.com,https://www.szlholdings.com,https://*.replit.app,https://*.replit.dev
```

Also update `robots.txt` and `sitemap.xml` if they reference the Replit domain — they currently reference `szlholdings.com` which is correct.

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

### Certificate provisioning fails
- Ensure DNS is fully propagated before Replit attempts to issue the certificate
- CNAME records must resolve before TLS provisioning begins

### Site loads on `www` but not root (or vice versa)
- Verify both records (ALIAS/A for root, CNAME for www) are configured
- Check that Replit has both `szlholdings.com` and `www.szlholdings.com` added in the domain panel

### Mixed content warnings
The app is served over HTTPS but some resources may load over HTTP. Check browser console for warnings and update any hardcoded `http://` URLs.

---

## Notes

- Replit-assigned domains (`*.replit.app`) will continue to work after the custom domain is connected
- The `.replit.app` domain can serve as a fallback URL if needed
- Custom domain configuration is per-deployment; if you redeploy from scratch, re-add the domain
