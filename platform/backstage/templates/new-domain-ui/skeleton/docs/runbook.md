# Runbook — ${{ values.domainName }} UI

**Artifact**: `artifacts/${{ values.domainSlug }}`  
**Domain**: `${{ values.domainSlug }}`  
**Owner**: `${{ values.ownerGroup }}`  
**Preview path**: `/${{ values.domainSlug }}/`  
**Slack**: #${{ values.domainSlug }}-alerts  

---

## Health Check

The UI exposes a static health endpoint as a JSON file served by the CDN/reverse-proxy:

```
GET /${{ values.domainSlug }}/health.json
Expected: { "status": "ok", "artifact": "${{ values.domainSlug }}" }
```

---

## Common Issues

### Blank Page / Not Loading
1. Check that the Replit artifact workflow is running (Vite dev server)
2. Check browser console for hydration or module resolution errors
3. Verify `VITE_API_URL` env var is set and the API is reachable

### Auth Not Working
1. Inspect `useAuth` hook — verify `fetch('/api/auth/me')` response in network tab
2. Check `packages/auth-shared` for session/cookie configuration
3. Confirm the API server's CORS config allows `/${{ values.domainSlug }}/` origin

### Stale Build Deployed
1. Trigger a rebuild: re-run the `Build & Typecheck` CI job
2. Verify CDN cache invalidation if behind a CDN

---

## Rollback

SPAs are static assets. To roll back:
1. Re-run a previous passing CI build and re-deploy its `dist/` output
2. Or re-activate a previous Container App revision if deployed as SSR

---

## Contacts

| Role | Contact |
|------|---------|
| Domain owner | ${{ values.ownerGroup }} |
| Platform | #platform-engineering |
