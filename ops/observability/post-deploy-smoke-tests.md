# Post-Deploy Smoke Tests

Generated: 2026-04-15

## Automated Checks (run after every deployment)

### 1. API Health
```bash
curl -sf https://$DOMAIN/api/health/live || exit 1
curl -sf https://$DOMAIN/api/health/ready || exit 1
curl -sf https://$DOMAIN/api/health | jq '.status' | grep -q 'ok' || exit 1
```

### 2. Web App Loads
```bash
for path in / /firestorm/ /terra/ /vessels/ /carlota-jo/ /command/; do
  status=$(curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN$path")
  [ "$status" = "200" ] || echo "FAIL: $path returned $status"
done
```

### 3. Auth Flow
```bash
curl -sf -X POST https://$DOMAIN/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@test.com","password":"SmokeTe$t2026!"}' \
  | jq '.data.token' | grep -q 'null' && echo "WARN: login returned null token"
```

### 4. API Version
```bash
curl -sf https://$DOMAIN/api/health | jq '.version'
```

### 5. Database Connectivity
```bash
curl -sf https://$DOMAIN/api/health | jq '.db.latencyMs' | awk '$1 > 500 { print "WARN: DB latency > 500ms"; exit 1 }'
```

## Manual Verification (first deploy to new environment)

1. Load SZL Holdings homepage — verify hero, nav, footer render correctly
2. Navigate to Trust Center — verify security and compliance pages load
3. Navigate to /demo — verify demo flow works
4. Open Aegis (/firestorm/) — verify sidebar and workspace switching
5. Open Terra (/terra/) — verify map and property views load
6. Open Command Portal (/command/) — verify mode switching works
7. Test login/logout cycle
8. Test API docs page (/api/docs)
9. Verify no console errors in browser dev tools
10. Verify no secrets visible in page source or network requests

## Rollback Criteria

Initiate rollback if any of these are true:
- API health endpoint returns non-200
- Error rate > 5% within 10 minutes of deploy
- Any P0 alert fires within 30 minutes
- Critical user-facing feature is broken

## Rollback Procedure

1. Revert to previous Replit deployment version
2. Verify health endpoints return 200
3. Run smoke test suite
4. Create incident report
