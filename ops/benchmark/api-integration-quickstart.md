# API Integration Quickstart

**Last updated:** April 2026
**Purpose:** Define the ideal first-touch developer experience for SZL's API

---

## Competitive Quickstart Benchmarks

### Stripe
1. Create account → get test API key (2 minutes)
2. Copy curl command from docs → first charge created (3 minutes)
3. Install SDK → build checkout page (30 minutes)
4. **Time to "aha":** 5 minutes

### Plaid
1. Create account → get sandbox credentials (3 minutes)
2. Run Quickstart repo → Link UI appears (10 minutes)
3. Connect test bank → see transactions (15 minutes)
4. **Time to "aha":** 15 minutes

### Twilio
1. Create account → get account SID + auth token (2 minutes)
2. Copy curl command → send first SMS (3 minutes)
3. Install SDK → build voice IVR (1 hour)
4. **Time to "aha":** 3 minutes

### Vercel
1. Import GitHub repo → deploy (2 minutes)
2. See live URL with SSL (3 minutes)
3. Push code → auto-deploy preview (5 minutes)
4. **Time to "aha":** 3 minutes

---

## SZL Quickstart Design

### Goal: First Governed Decision in 10 Minutes

```bash
# Step 1: Get API key (future: self-serve dashboard)
export SZL_API_KEY="sk_test_..."

# Step 2: Publish a signal
curl -X POST https://api.szlholdings.com/api/signals \
  -H "Authorization: Bearer $SZL_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: quickstart-signal-001" \
  -d '{
    "type": "domain_signal",
    "domain": "vessels",
    "sourceId": "quickstart-ais-monitor",
    "severity": "high",
    "payload": {
      "title": "AIS anomaly detected",
      "vessel": "MV Test Pioneer",
      "imo": "0000001"
    }
  }'

# Response:
# { "data": { "signalId": "sig_...", "correlationId": "cor_..." }, "meta": { "requestId": "req_..." } }

# Step 3: Get recommendation for the signal
curl https://api.szlholdings.com/api/decisions/$CORRELATION_ID/recommendation \
  -H "Authorization: Bearer $SZL_API_KEY"

# Step 4: Approve the recommendation
curl -X POST https://api.szlholdings.com/api/decisions/$CORRELATION_ID/approve \
  -H "Authorization: Bearer $SZL_API_KEY" \
  -H "X-Idempotency-Key: quickstart-approve-001"

# Step 5: View the proof chain
curl https://api.szlholdings.com/api/proof-chain/$CORRELATION_ID \
  -H "Authorization: Bearer $SZL_API_KEY"
```

### Alternative: Decision Theater as Quickstart
For non-API users, the Decision Theater is the quickstart:
1. Open Decision Theater in browser
2. Watch the nine-step loop execute with real primitives
3. Inspect each step to see the data structures
4. Understand governance architecture through interaction, not documentation

---

## Documentation Standards (Stripe-inspired)

| Standard | Implementation |
|----------|---------------|
| Every endpoint has a curl example | Inline in API docs |
| Every example uses realistic data | Domain-specific (vessels, aegis, terra) |
| Response schemas are fully documented | OpenAPI + inline descriptions |
| Error responses are documented | Every error code with fix guidance |
| Authentication is explained upfront | First section of docs |
| Rate limits are disclosed | In every endpoint description |
| Changelog is maintained | `/api/changelog` endpoint |

---

## SDK Strategy (Future)

Start with TypeScript SDK — the primary audience is TypeScript/Node.js developers:

```typescript
import { SZL } from '@szl-holdings/sdk';

const szl = new SZL({ apiKey: process.env.SZL_API_KEY });

const signal = await szl.signals.publish({
  domain: 'vessels',
  severity: 'high',
  payload: { title: 'AIS anomaly', vessel: 'MV Test Pioneer' }
});

const decision = await szl.decisions.approve(signal.correlationId);
const proof = await szl.proofChain.get(signal.correlationId);
```

Future: Python SDK for data science teams, Go SDK for infrastructure teams.
