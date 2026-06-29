# PRE-DEMO HARDENING + SMOKE-TEST PLAYBOOK
## Sovereign GPU Compute Mesh — WarHacker Live Founder Demo

**System:** Distributed GPU energy/inference mesh (3 Tailscale nodes), HTTP API surfaces (a-11-oy.com), published+keyless-signed UDS/k8s bundle (Sigstore/cosign, SBOM), signed receipt ledgers, ~15 live web surfaces with 3D/WebGPU visualizations.

**Audience:** Defense Unicorns WarHacker — live founder demo in ≤36 hours.

**Playbook authority:** Synthesized from Google SRE, Netflix, Stripe, Cloudflare, Datadog, CNCF, and Sigstore primary documentation. Every recommendation is traceable to an industry source.

---

## TABLE OF CONTENTS

1. [Smoke Testing](#1-smoke-testing)
2. [Hardening](#2-hardening)
3. [Debugging Under Pressure](#3-debugging-under-pressure)
4. [Supply-Chain & Signing Verification](#4-supply-chain--signing-verification)
5. [Demo-Specific Resilience](#5-demo-specific-resilience)
6. [36-Hour Priority Checklist](#6-36-hour-priority-checklist)

---

## 1. SMOKE TESTING

### 1.1 What a Pre-Launch Smoke Suite Covers

Google's original [Launch Coordination Checklist](https://sre.google/sre-book/launch-checklist/) (still the canonical reference) requires you to validate: load balancing, rate-limiting, timeout, retry, error handling behavior, and what happens when each backend dies — before a single request hits production. The [Harness DevOps Academy](https://www.harness.io/harness-devops-academy/integrating-smoke-testing-into-your-ci-cd-pipeline-what-devops-needs-to-know) distills this into five mandatory gates:

| Gate | Check | Acceptance |
|------|-------|------------|
| Readiness | Kubernetes/service readiness endpoint returns 200 | `HTTP 200` within 2s |
| Auth | A basic auth/token flow completes | Token returned, no 401/403 |
| Core Read | Most-used API endpoint returns expected schema | `HTTP 200`, valid JSON |
| Core Write (idempotent only) | If you must test writes, use idempotent test data | No side-effects in prod |
| Dependency confidence | DB/cache/queue/mesh node connectivity | All upstreams report healthy |

**Key discipline:** The suite MUST finish in **under 5 minutes** and **halt the pipeline** (or in our case, halt a pre-demo) if any check fails. If it takes longer, you have too many tests. ([QASkills production smoke suite guidance](https://qaskills.sh/skills/Pramod/production-smoke-suite))

Mark all smoke traffic explicitly with a header:
```http
X-Smoke-Test: true
X-Demo-Run: warhacker-2024
```
This prevents test traffic from polluting analytics or triggering billing events. ([QASkills](https://qaskills.sh/skills/Pramod/production-smoke-suite))

### 1.2 System-Specific Smoke Checks — Executed NOW

**A. HTTP API layer (a-11-oy.com)**
```bash
# Health/readiness
curl -sf -o /dev/null -w "%{http_code} %{time_total}s\n" \
  https://a-11-oy.com/health

# Core API endpoint — substitute actual golden path
curl -sf -H "X-Smoke-Test: true" \
  https://a-11-oy.com/api/v1/status | jq '{status, version, nodes}'

# TLS certificate validity (alert if < 14 days)
echo | openssl s_client -connect a-11-oy.com:443 -servername a-11-oy.com 2>/dev/null \
  | openssl x509 -noout -dates

# Check for HTTP→HTTPS redirect
curl -sI http://a-11-oy.com/ | grep -i location
```

**B. GPU mesh nodes (Tailscale)**
```bash
# Verify all 3 mesh nodes are reachable
for NODE in node1 node2 node3; do
  echo -n "Ping $NODE: "
  tailscale ping --c 3 $NODE || echo "FAIL"
done

# Check Tailscale health messages (will surface any warnings)
tailscale status --json | jq '.Health'

# GPU health on each node (via SSH over Tailscale)
for NODE in node1 node2 node3; do
  ssh $NODE "nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used,memory.total \
    --format=csv,noheader"
done

# Inference endpoint smoke — adapt to your actual endpoint
curl -sf http://node1:8000/v2/health/ready  # Triton/vLLM pattern
curl -sf http://node1:8000/health           # vLLM pattern
```
Per [NVIDIA/vLLM docs](https://build.nvidia.com/spark/vllm/multi-sparks-through-switch):
```bash
# Ray cluster health (if applicable)
docker exec $VLLM_CONTAINER ray status
```

**C. Web surfaces (15 demo pages)**
```bash
# Batch HTTP check — replace with your actual URLs
SURFACES=(
  "https://surface1.a-11-oy.com"
  "https://surface2.a-11-oy.com"
  # ... all 15
)
for URL in "${SURFACES[@]}"; do
  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "$URL")
  echo "$STATUS $URL"
done
```

**D. Signed receipt ledger**
```bash
# Verify the ledger API is live and returns a valid signed receipt
curl -sf https://a-11-oy.com/api/v1/ledger/latest | jq '{hash, signature, timestamp}'
```

**E. WebGPU surfaces (3D visualizations)**  
Manually open each page in Chrome; navigate to `chrome://gpu` and confirm "WebGPU: Hardware accelerated" is listed. This cannot be automated headlessly with full GPU passthrough. ([Chrome for Developers WebGPU troubleshooting](https://developer.chrome.com/docs/web-platform/webgpu/troubleshooting-tips))

Implement a JS fallback detector in each WebGPU page:
```javascript
if (!navigator.gpu) {
  // Show pre-rendered video fallback or Canvas2D version
  document.getElementById('webgpu-canvas').style.display = 'none';
  document.getElementById('video-fallback').style.display = 'block';
}
```

### 1.3 Synthetic Monitoring During the Demo

[DevOps School's synthetic monitoring checklist](https://www.devopsschool.nl/synthetic-monitoring/) specifies a "production readiness" posture during the demo window:

1. **Multi-surface availability**: Run a cron-based loop every 30 seconds checking all 15 surfaces return `HTTP 200`.
2. **Probe agent NTP time-sync**: Verify all nodes have synchronized clocks (critical for Tailscale and cosign).
3. **Error budget alerting**: If any surface starts returning errors, signal immediately — do not wait for aggregation.

Minimal watchdog script to run in a terminal during the demo:
```bash
#!/bin/bash
# demo-watchdog.sh — run this on a second screen during the demo
while true; do
  for URL in "${SURFACES[@]}"; do
    CODE=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 3 "$URL")
    [[ "$CODE" != "200" ]] && echo "⚠️  ALERT $CODE: $URL at $(date)" | tee -a demo-watch.log
  done
  echo "---$(date)---"
  sleep 30
done
```

### 1.4 Golden-Path Health Checks

The "golden path" is the **most important user journey** end-to-end. For this system:

1. **Operator visits a demo surface URL** → Page loads with 3D/WebGPU visualization (< 3s)
2. **Operator triggers an inference request** → API responds with energy telemetry/result (< 5s)
3. **Operator views signed receipt** → Ledger returns a verifiable signed receipt
4. **Operator views node mesh status** → All 3 GPU nodes show healthy

Encode this as a literal script and execute it 3× in the 2 hours before the demo. If any step fails, do not proceed without mitigation.

Per [MOSS deployment health check guidance](https://moss.sh/deployment/how-to-set-up-deployment-health-checks/):
> "Synthetic checks [should] replicate critical flows and assert business outcomes (e.g., 'create order → pay → verify receipt')."

---

## 2. HARDENING

### 2.1 Google SRE Production Readiness Review (PRR)

The canonical source is the [Google SRE Book — Reliable Product Launches](https://sre.google/sre-book/reliable-product-launches/). The PRR process, formalized at Google circa 2006, asks you to do a **failure mode analysis** before every significant launch:

**Mandatory failure mode questions (adapted for this system):**

| Failure Scenario | Mitigation Required |
|------------------|---------------------|
| GPU node 1 dies | Mesh degrades gracefully; inference routes to node 2/3; readiness endpoint on node 1 returns 503 |
| Tailscale connectivity loss between nodes | API returns cached/degraded response; no hard crash; UI shows "mesh degraded" state |
| HTTP API overload during demo | Rate limiting in place; load-shedding returns `429` not `500` |
| Bad input to inference endpoint | Timeout + deadline propagation; no resource leak |
| Dependency (external API) unavailable at startup | Service starts in degraded mode; does not refuse to start |
| DoS/sudden traffic spike from demo attendees | Rate limiting, request queuing, or static fallback |

From the SRE book: "Implement request deadlines to avoid running out of resources for long-running requests. Implement load shedding to reject new requests early in overload situations."

### 2.2 Error Budget & Change Freeze

[Google Cloud's SRE error budget guidance](https://cloud.google.com/blog/products/management-tools/sre-error-budgets-and-maintenance-windows):

> "The decision to burn through your error budget during your maintenance windows should be made only if you consider those downtime periods as part of your reliability work."

**Action for T-36h:**
- **FREEZE ALL NON-CRITICAL CHANGES NOW.** No new deployments, dependency updates, or config changes unless fixing a P0 bug found by smoke tests.
- Tag the current working commit as `demo-stable`:
  ```bash
  git tag demo-stable-warhacker-$(date +%Y%m%d)
  git push origin --tags
  ```
- Create a rollback branch:
  ```bash
  git checkout -b demo-rollback-point
  ```

### 2.3 Timeouts, Retries, Circuit Breakers

Per the [Distributed Systems Authority circuit breaker reference](https://distributedsystemauthority.com/circuit-breaker-pattern) and [Michael Nygard's canonical *Release It!* patterns](https://rustycloud.org/distributed_systems_track/module-04-fault-tolerance/lesson-02-circuit-breakers-bulkheads.html):

**Timeout formula:**
```
timeout = p99.9_latency + safety_margin
```
Measure your actual p99.9 latency now. For GPU inference: set a hard deadline (e.g., 30s). For API health endpoints: ≤ 2s.

**Retry policy:**
```
backoff = base * 2^attempt * random()  # exponential backoff with jitter
max_retries = 3
retry_budget = 10% of base traffic rate
```
Never retry non-idempotent operations. Without jitter, simultaneous retries from multiple callers form "synchronized waves" that re-hit the failing service. ([Circuit Breakers and Bulkheads analysis](https://rustycloud.org/distributed_systems_track/module-04-fault-tolerance/lesson-02-circuit-breakers-bulkheads.html))

**Circuit breaker state machine:**
```
CLOSED → (failure threshold exceeded) → OPEN → (timeout) → HALF-OPEN → (probe succeeds) → CLOSED
```
Recommendation: Use [Resilience4j](https://resilience4j.readme.io/) (Java/Kotlin) or the equivalent in your stack. Netflix's original Hystrix is now maintenance-only; Resilience4j is its documented successor.

**Rate-limit handling:** Return `HTTP 429 Too Many Requests` with a `Retry-After` header. Never return `500` on a rate-limit condition.

### 2.4 Graceful Degradation Modes

From [service degradation guidance](https://mianshi.idocdown.com/en/app/articles/blogs/detail/1622), define three explicit degradation modes for the demo:

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Full** | All nodes healthy, API < 200ms | Normal live demo |
| **Partial** | 1 node offline OR latency 200-2000ms | Show 2-node mesh; label it "mesh auto-rebalancing" |
| **Degraded/Static** | 2 nodes offline OR API unavailable | Switch to pre-recorded demo video; narrate live |

Implement a UI banner that activates in partial/degraded mode:
```javascript
// Poll mesh status every 10s; update UI badge
fetch('/api/v1/mesh/health')
  .then(r => r.json())
  .then(data => {
    if (data.nodes_healthy < 3) {
      showDegradedBanner(`Mesh operating at ${data.nodes_healthy}/3 nodes`);
    }
  });
```

### 2.5 Load Test Before Demo

The SRE book is explicit: "It is very hard to predict from first principles how a service will react to overload; load tests are therefore invaluable." ([Google SRE — Reliable Product Launches](https://sre.google/sre-book/reliable-product-launches/))

Run a minimal load test **today** (T-24h minimum):
```bash
# Using k6 (install: https://k6.io)
k6 run --vus 20 --duration 60s - <<'EOF'
import http from 'k6/http';
export default function () {
  const res = http.get('https://a-11-oy.com/api/v1/status');
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
}
EOF
```
Target: sustain the demo's expected peak load × 3 with p99 < your timeout threshold.

---

## 3. DEBUGGING UNDER PRESSURE

### 3.1 The Three Pillars of Observability

Per [OpenTelemetry and observability maturity research](https://zeonedge.com/eu/blog/observability-metrics-logs-traces-guide):

| Pillar | What it answers | Tool |
|--------|----------------|------|
| **Metrics** | Is the system healthy right now? | Prometheus + Grafana |
| **Logs** | What happened and when? | Structured JSON logs + Loki/ELK |
| **Traces** | Where did this specific request fail? | OpenTelemetry → Jaeger/Tempo |

The key is **correlation**: every log line, metric, and trace for a single request should share the same `trace_id`. When a metric shows an error spike, you click through to the trace, then to the exact log lines.

**Structured log format** (every service should emit this):
```json
{
  "timestamp": "2024-01-15T14:32:10.123Z",
  "level": "ERROR",
  "service": "inference-mesh",
  "trace_id": "abc123",
  "span_id": "def456",
  "node_id": "gpu-node-2",
  "message": "GPU memory exhausted",
  "error": "CUDA OOM on model forward pass",
  "gpu_memory_used_mb": 24576,
  "gpu_memory_total_mb": 24576
}
```
From [Kubernetes structured logs guidance](https://kubernetes.io/blog/2020/09/04/kubernetes-1-19-introducing-structured-logs/): "With structured logs, all references to Kubernetes objects are structured the same way, so you can filter the output and only log entries referencing the particular pod."

**Production log level:** Run at `INFO`. Debug logging in production can generate more data than the rest of your fleet combined — do not turn it on before a demo unless actively debugging a specific issue. ([DEV Community observability guide](https://dev.to/young_gao/the-three-pillars-of-observability-logs-metrics-and-traces-in-practice-4537))

### 3.2 Health, Readiness, and Liveness Endpoints

Every service **must** expose these three endpoints before the demo. ([Kubernetes health probes course](https://handsonk8s.substack.com/p/lesson-12-health-probes-and-lifecycle))

```
GET /healthz      → liveness  (is the process alive? simple, cheap, no DB check)
GET /readyz       → readiness (can this instance accept traffic? checks dependencies)
GET /metrics      → Prometheus metrics scrape
```

Liveness vs readiness distinction is critical:
- **Liveness fails** → Kubernetes kills and restarts the container (use for deadlock/infinite loop detection only)
- **Readiness fails** → Kubernetes removes the pod from load-balancing (use for dependency unavailability)
- **NEVER share the same endpoint** for both — doing so causes cascading restarts during dependency outages

Kubernetes probe configuration for your GPU nodes:
```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 2
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /readyz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

**Tailscale mesh health** — query Tailscale's built-in health reporting:
```bash
# On each node:
tailscale status --json | jq '.Health'
tailscale ping --c 3 <peer-node-tailscale-ip>

# Prometheus metrics (tailscaled exposes these natively):
curl http://localhost:9100/metrics | grep tailscaled_health_messages
```
Per [Tailscale monitoring with Prometheus/Grafana](https://binadit.com/tutorials/configure-tailscale-monitoring-with-prometheus-grafana), set these alerts:
```yaml
- alert: TailscaleHighLatency
  expr: tailscale_node_latency_seconds > 0.5
  for: 5m
  labels: { severity: warning }
- alert: TailscaleConnectionLoss
  expr: increase(tailscale_connection_failures_total[10m]) > 3
  for: 1m
  labels: { severity: critical }
```

### 3.3 The Four Golden Signals (Google SRE)

From [Google SRE service best practices](https://sre.google/sre-book/service-best-practices/):

1. **Latency** — p50, p95, p99 of inference + API response times
2. **Traffic** — requests/sec to each GPU node and API surface
3. **Errors** — error rate per endpoint (alert at > 1%)
4. **Saturation** — GPU memory %, CPU %, Tailscale bandwidth

Set dashboard to show ALL FOUR on a single screen. During the demo, this is your "cockpit" — keep it visible on a second monitor.

Recommended alerting thresholds for demo:
```
latency_p99 > 5s   → WARNING
latency_p99 > 15s  → CRITICAL  
error_rate > 1%    → WARNING
error_rate > 5%    → CRITICAL
gpu_memory_pct > 90% → WARNING
```

### 3.4 Demo-Time Incident Runbook

Write this DOWN and have it on a physical card or second screen. ([FitGap go-live monitoring readiness](https://us.fitgap.com/stack-guides/prove-monitoring-alerting-and-incident-response-readiness-before-go-live))

```
INCIDENT RUNBOOK — DEMO DEGRADATION

T+0 (symptom detected):
  1. Check: Is it a node failure or API failure? → `tailscale status`
  2. Check: Is it a network issue or application issue? → ping vs HTTP check
  3. Check: Which surface is affected? → batch URL check

T+2m (diagnosis):
  4. `kubectl get pods -A | grep -v Running` — look for failed pods
  5. `kubectl logs <failing-pod> --tail=50` — last 50 lines
  6. Check metrics dashboard: which golden signal is spiking?
  7. Check Tailscale health: `tailscale status --json | jq '.Health'`

T+5m (mitigation decision):
  8. Can we route around it? → Direct traffic to healthy nodes
  9. Can we restart it? → `kubectl rollout restart deployment/<name>`
  10. Is it demo-blocking? → Activate fallback video (see Section 5)

T+10m (worst case):
  11. Switch to pre-recorded demo video
  12. Continue narration as if live — audience sees the capability, not the infrastructure
```

### 3.5 Chaos/Failure Injection — Pre-Demo Game Day

Netflix's chaos engineering methodology per [TechInterview.org chaos engineering guide](https://www.techinterview.org/post/3233474125/system-design-chaos-engineering-netflix-chaos-monkey-fault-injection-game-days-resilience-testing-blast-radius/):

> "Define the hypothesis → Define the blast radius → Define abort criteria → Execute → Observe → Document"

**Run this game day NOW (T-24h):**

| Failure scenario | How to inject | Expected behavior | Pass/fail |
|------------------|--------------|-------------------|-----------|
| GPU node 1 down | `tailscale down` on node 1 | API degrades gracefully, returns 2/3 mesh status | ☐ |
| API high latency | `tc qdisc add dev eth0 root netem delay 500ms` | Circuit breaker opens, UI shows "degraded" | ☐ |
| WebGPU not available | Open page in Firefox without WebGPU flag | Fallback video/canvas shown, no JS error | ☐ |
| Cert expiry simulation | N/A — verify cert expiry dates now | Alert fires, rotation procedure documented | ☐ |
| Memory pressure | `stress --vm 1 --vm-bytes 90% --timeout 30s` | Service doesn't OOM; readiness fails gracefully | ☐ |

Abort criterion: if error rate exceeds 5% for > 60s, immediately restore normal state before proceeding.

---

## 4. SUPPLY-CHAIN & SIGNING VERIFICATION

### 4.1 Cosign Keyless Signature Verification

Your bundle uses **keyless signing** (Fulcio + Rekor). The verification workflow per [Sigstore's keyless signing documentation](https://www.systemshardening.com/articles/cicd/sigstore-keyless-signing/) and the [cosign README](https://github.com/sigstore/cosign/blob/main/README.md):

```bash
# Install cosign v2.4.1+ (required for Rekor v1.2 support)
# https://github.com/sigstore/cosign/releases

# Verify image signature (keyless — against expected GitHub Actions workflow identity)
cosign verify \
  --certificate-identity-regexp "^https://github.com/YOUR_ORG/YOUR_REPO/.github/workflows/build.yml@refs/heads/main$" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  YOUR_REGISTRY/YOUR_IMAGE@sha256:DIGEST

# Expected output lines indicating PASS:
# - The cosign claims were validated
# - The claims were present in the transparency log
# - The signatures were integrated into the transparency log when the certificate was valid
# - The code-signing certificate was verified using trusted certificate authority certificates
```

**For UDS bundles signed with a keypair (if applicable):**
```bash
cosign verify --key cosign.pub YOUR_REGISTRY/YOUR_BUNDLE:tag
```

**Offline verification** (critical for air-gapped or demo environments where Rekor may not be reachable):
```bash
# Cosign stores bundle annotation on image manifest by default for keyless signing
cosign verify --offline \
  --certificate-identity-regexp ".*" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  YOUR_REGISTRY/YOUR_IMAGE@sha256:DIGEST
```
From the [cosign README](https://github.com/sigstore/cosign/blob/main/README.md): "Cosign can do completely offline verification by verifying a bundle which is typically distributed as an annotation on the image manifest."

### 4.2 SBOM Attestation Verification

Per [Trivy SBOM attestation docs](https://trivy.dev/docs/supply-chain/attestation/sbom/) and [Secure Pipelines lab](https://secure-pipelines.com/ci-cd-security/lab-sbom-pipeline-generate-attest-verify-syft-cosign/):

```bash
# Verify SBOM attestation (SPDX JSON format)
cosign verify-attestation \
  --certificate-identity-regexp "^https://github.com/YOUR_ORG/YOUR_REPO/.*@refs/heads/main$" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  --type spdxjson \
  YOUR_REGISTRY/YOUR_IMAGE@sha256:DIGEST \
  | jq '.payload | @base64d | fromjson | .predicate'

# Verify CycloneDX SBOM (if using CycloneDX format)
COSIGN_EXPERIMENTAL=1 cosign verify-attestation \
  --type cyclonedx \
  YOUR_REGISTRY/YOUR_IMAGE@sha256:DIGEST

# For SLSA provenance attestation
cosign verify-attestation \
  --type slsaprovenance \
  --certificate-identity-regexp "https://github.com/YOUR_ORG/*" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  YOUR_REGISTRY/YOUR_IMAGE@sha256:DIGEST
```

### 4.3 Rekor Transparency Log Audit

The Rekor log is publicly auditable. Verify your signing events are correctly recorded:

```bash
# Install rekor-cli
# https://github.com/sigstore/rekor/releases

# Search for your artifact by digest
rekor-cli search \
  --sha sha256:YOUR_DIGEST \
  --rekor_server https://rekor.sigstore.dev

# Get full log entry by UUID (from search output)
rekor-cli get --uuid <UUID_FROM_SEARCH> --format json | jq .

# Verify log entry signature (offline verification of tlog entry itself)
rekor-cli get --log-index <TLOG_INDEX> --format json | \
  jq -r '.Body.HashedRekordObj.signature.content'
```

Per [Sigstore transparency log verification guide](https://rewanthtammana.com/sigstore-the-easy-way/rekor/compare-the-signatures-uploaded-to-transparency-log-and-registry/):
```bash
# Cross-check: signature in registry == signature in Rekor
export TLOG_INDEX=<your_index>
rekor-cli get --log-index $TLOG_INDEX --format json | \
  jq -r '.Body.HashedRekordObj.signature.content'
# Compare this to the signature returned by: cosign sign --output-signature image.sig
```

### 4.4 SLSA Levels — What "Good" Looks Like

From the [SLSA Framework Guide 2026](https://www.practical-devsecops.com/slsa-framework-guide-software-supply-chain-security/) and [SLSA deep dive](https://dev.to/kanywst/slsa-deep-dive-securing-the-supply-chain-using-verifiable-levels-klk):

| SLSA Level | What it proves | Minimum bar for demo |
|-----------|---------------|----------------------|
| Level 1 | Provenance exists | Acceptable for internal demos |
| Level 2 | Build service generates provenance; hosted, versioned build | **Recommended minimum** for defense audience |
| Level 3 | Build is isolated, signing is non-falsifiable; source integrity verified | Target for production deployment |

**For a WarHacker defense demo, target SLSA Level 2 minimum:**
- All images have cosign signatures recorded in Rekor ✓
- SBOM attached as a verifiable attestation ✓
- Build triggered from a versioned, tagged commit ✓
- Provenance records the exact builder identity (GitHub Actions workflow URL) ✓

**Pre-demo verification checklist:**
```bash
# Run this block — all commands should exit 0
echo "=== Verifying UDS Bundle Signing ==="
cosign verify \
  --certificate-identity-regexp "YOUR_WORKFLOW_REGEX" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  YOUR_BUNDLE_IMAGE && echo "PASS: Bundle signature valid"

echo "=== Verifying SBOM Attestation ==="
cosign verify-attestation \
  --certificate-identity-regexp "YOUR_WORKFLOW_REGEX" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  --type spdxjson \
  YOUR_BUNDLE_IMAGE > /dev/null && echo "PASS: SBOM attestation valid"

echo "=== Checking Rekor Log ==="
rekor-cli search --sha sha256:YOUR_DIGEST \
  --rekor_server https://rekor.sigstore.dev && echo "PASS: Entry in transparency log"
```

### 4.5 UDS Bundle Verification

Per [Defense Unicorns UDS documentation](https://docs.defenseunicorns.com/core/v1-2/how-to-guides/packaging-applications/create-uds-package/):

```bash
# Verify Package CR was processed by UDS Operator
kubectl get packages -A

# Monitor resource status
uds zarf tools monitor
# OR
k9s

# Check UDS Operator reports Ready
kubectl get package <your-package-name> -n <namespace> -o jsonpath='{.status.phase}'
# Expected: Ready

# Watch for Pepr policy violations in real time
uds monitor pepr denied

# Verify web application is accessible and SSO works
# Navigate to: https://your-package.uds.dev
```

---

## 5. DEMO-SPECIFIC RESILIENCE

### 5.1 The Classic "Demo Gods" Failures

These are the documented failure modes every experienced demo presenter has catalogued. Per [DEMOgod Awards guidance](https://na.eventscloud.com/file_uploads/e1f4ea812871256b214e709b27bcae86_DEMOgod_Tips.pdf) and [Appeasing the Demo Gods](https://watro.zimmic.com/post/48037704726/appeasing-the-demo-gods):

| Failure Mode | Probability | Mitigation |
|-------------|-------------|------------|
| Network failure at venue | HIGH | Local WiFi backup + mobile hotspot pre-configured |
| Live dependency unavailable | HIGH | Pre-recorded video of working golden path |
| Last-minute code change breaks demo | VERY HIGH | **CODE FREEZE NOW** — do not touch anything that works |
| Demo environment ≠ rehearsal environment | HIGH | Dress rehearsal on identical hardware tonight |
| WebGPU not supported on venue display hardware | MEDIUM | Chrome + tested GPU; fallback video ready |
| Presenter nerves → typo/mistake | HIGH | Scripted clickthrough; no live typing |
| Tailscale auth token expiry | MEDIUM | Pre-auth all nodes; check `tailscale status` before demo |
| SSL cert expiry | LOW | Check now; alert threshold < 14 days |
| GPU node OOM during demo inference | MEDIUM | Pre-warm inference engine; limit concurrent requests during demo |

Rule: "Never exercise any capability in your demo that you have not thoroughly tested beforehand. If you have not tested it, it does not work." ([Appeasing the Demo Gods](https://watro.zimmic.com/post/48037704726/appeasing-the-demo-gods))

### 5.2 Pre-Recorded Fallbacks

Per [Segment8 technical demo design](https://blog.segment8.com/posts/technical-demo-design/) and [Kate Catlin's high-stakes demo prep](https://katecatlin.substack.com/p/how-i-prepare-for-high-stakes-technical):

**Record in SHORT MODULAR SEGMENTS, not one long video.** If you need to switch mid-demo, you need a clip for each section, not a 20-minute monolith.

Recommended video structure:
```
clip-01-mesh-overview.mp4        (2min) — 3-node topology, Tailscale mesh visualization
clip-02-inference-live.mp4       (3min) — GPU inference request, energy telemetry response
clip-03-signed-receipt.mp4       (1min) — Signed receipt generation and cosign verification
clip-04-webgpu-visualization.mp4 (2min) — 3D energy visualization, WebGPU demo
clip-05-sbom-signing.mp4         (2min) — UDS bundle deploy, cosign verify, SBOM attestation
```

Each clip should be **fullscreen on a separate desktop** so the switch is a 3-finger swipe, invisible to the audience. ([Kate Catlin](https://katecatlin.substack.com/p/how-i-prepare-for-high-stakes-technical))

**Graceful handoff script (rehearse this phrase):**
> "Let me switch to a pre-recorded sequence so we can see the full end-to-end flow — I'll walk you through exactly what's happening."

### 5.3 Network Resilience

```bash
# Before leaving for the venue:
# 1. Configure mobile hotspot as fallback WiFi (name it same SSID or pre-configure)
# 2. Test that demo system connects to hotspot AND all surfaces resolve
# 3. Verify Tailscale works over hotspot (it will — it's designed for this)

# Check DNS resolution for all critical hostnames
for HOST in a-11-oy.com node1 node2 node3; do
  nslookup $HOST || echo "DNS FAIL: $HOST"
done

# Pre-warm all connections (HTTP keep-alive, Tailscale handshakes)
for URL in "${SURFACES[@]}"; do curl -sf "$URL" -o /dev/null; done
```

For Cloudflare-fronted surfaces, use [Cloudflare's minimize-downtime guidance](https://developers.cloudflare.com/fundamentals/performance/minimize-downtime/) — ensure your DNS records have correct TTLs and proxy status before the event window.

### 5.4 Local Mirrors

For any external dependency (fonts, CDN assets, third-party APIs), create local mirrors or bundle them:

```bash
# Download any external JS/CSS dependencies locally
# Example for Three.js / WebGPU library
npm pack three  # or vendor the specific version
# Serve from local CDN or bundle into the build
```

If you're calling any third-party API during the demo, ensure:
1. You have a cached/mock response that can be returned if the API is slow/unavailable
2. The fallback is realistic enough that it demonstrates the feature

### 5.5 Dress Rehearsal Protocol

From [DEMOgod Awards formula](https://na.eventscloud.com/file_uploads/e1f4ea812871256b214e709b27bcae86_DEMOgod_Tips.pdf):
```
Rehearsal count = (Importance × Inability to get second chance) / normalization_factor
```
For WarHacker (Importance: 9, No second chance: 9) → **minimum 3 full run-throughs tonight**.

Protocol for each rehearsal:
1. Start from a **fresh state** (restart all services as you will on demo day)
2. Execute the **full demo script end-to-end**, including transitions between surfaces
3. Have a second person play "antagonist" — try to break things while you demo
4. Time the entire demo — it should be within 10% of your target duration
5. Record rehearsal #3 — this becomes your fallback video

### 5.6 Freeze Window

**START NOW:**
- No new git commits to any demo-critical branch
- No dependency updates
- No infrastructure changes
- No DNS changes
- Only allowed exceptions: P0 smoke-test failures and TLS cert rotation

Announce the freeze to your team explicitly in Slack/Discord with timestamp.

---

## 6. 36-HOUR PRIORITY CHECKLIST

> **Execute in order. Each section must PASS before moving to the next.**
> Owner column = who is accountable. Status = update as you go.

---

### PHASE 1: FREEZE & BASELINE (Do immediately — T-36h)

| # | Action | Command/Method | Owner | Status |
|---|--------|----------------|-------|--------|
| 1.1 | Declare code freeze; tag demo-stable commit | `git tag demo-stable-warhacker-$(date +%Y%m%d) && git push --tags` | Lead | ☐ |
| 1.2 | Verify all 3 GPU nodes are up and reachable via Tailscale | `tailscale status` on each node | Infra | ☐ |
| 1.3 | Check GPU health on all nodes | `nvidia-smi` on each node | Infra | ☐ |
| 1.4 | Verify TLS certs for a-11-oy.com — must have > 14 days remaining | `echo \| openssl s_client -connect a-11-oy.com:443 2>/dev/null \| openssl x509 -noout -dates` | Infra | ☐ |
| 1.5 | Check Tailscale auth tokens are not near expiry | `tailscale status --json \| jq '.Self.KeyExpiry'` | Infra | ☐ |
| 1.6 | Run batch HTTP check on all 15 demo surfaces | See Section 1.2-C script | Dev | ☐ |
| 1.7 | Confirm all liveness/readiness endpoints return 200 | `curl -sf https://a-11-oy.com/healthz` | Dev | ☐ |

---

### PHASE 2: SMOKE TESTS (T-24h)

| # | Action | Command/Method | Owner | Status |
|---|--------|----------------|-------|--------|
| 2.1 | Execute full golden-path smoke test suite (Section 1.2) | Run all A/B/C/D checks | Dev | ☐ |
| 2.2 | Execute golden-path narrative end-to-end (Section 1.4) | Full user journey: surface load → inference → receipt | Demo lead | ☐ |
| 2.3 | Run load test at 3× expected peak | `k6 run --vus 20 --duration 60s` against API | Infra | ☐ |
| 2.4 | Verify inference latency p99 < 30s | Extract from load test results | Dev | ☐ |
| 2.5 | Test WebGPU on demo hardware | Open each page in Chrome; check `chrome://gpu` | Frontend | ☐ |
| 2.6 | Confirm WebGPU fallback video loads if `navigator.gpu` is null | Open in Firefox without flag; verify fallback | Frontend | ☐ |

---

### PHASE 3: SUPPLY CHAIN VERIFICATION (T-24h)

| # | Action | Command/Method | Owner | Status |
|---|--------|----------------|-------|--------|
| 3.1 | Verify cosign signature on UDS bundle image | `cosign verify --certificate-identity-regexp ... YOUR_BUNDLE_IMAGE` | Security | ☐ |
| 3.2 | Verify SBOM attestation is valid | `cosign verify-attestation --type spdxjson ... YOUR_BUNDLE_IMAGE` | Security | ☐ |
| 3.3 | Confirm artifact appears in Rekor transparency log | `rekor-cli search --sha sha256:YOUR_DIGEST` | Security | ☐ |
| 3.4 | Verify UDS Package CR reports `Ready` | `kubectl get package <name> -o jsonpath='{.status.phase}'` | Infra | ☐ |
| 3.5 | Run `uds monitor pepr denied` — confirm zero violations | `uds monitor pepr denied` | Infra | ☐ |
| 3.6 | Check signed receipt ledger API returns valid receipts | `curl https://a-11-oy.com/api/v1/ledger/latest \| jq` | Dev | ☐ |

---

### PHASE 4: HARDENING VALIDATION (T-18h)

| # | Action | Command/Method | Owner | Status |
|---|--------|----------------|-------|--------|
| 4.1 | Run mini game day: kill GPU node 1, verify mesh degrades gracefully | `tailscale down` on node 1; check API response | Infra | ☐ |
| 4.2 | Verify API returns `503` (not `500`) when node is down | `curl -v https://a-11-oy.com/api/v1/mesh/health` | Dev | ☐ |
| 4.3 | Restore node 1 and verify mesh self-heals | `tailscale up` on node 1; re-check mesh health | Infra | ☐ |
| 4.4 | Verify circuit breaker fires at correct threshold | Introduce artificial latency; observe breaker state | Dev | ☐ |
| 4.5 | Confirm rate limiting returns `429` (not `500`) | `for i in $(seq 100); do curl -sf https://a-11-oy.com/api/v1/status; done` | Dev | ☐ |
| 4.6 | Verify all services restart gracefully | `kubectl rollout restart deployment/<name>` | Infra | ☐ |

---

### PHASE 5: OBSERVABILITY READINESS (T-12h)

| # | Action | Command/Method | Owner | Status |
|---|--------|----------------|-------|--------|
| 5.1 | Confirm Prometheus scrapes all nodes and API surfaces | `curl http://localhost:9090/targets` | Infra | ☐ |
| 5.2 | Confirm 4 golden signals visible on single dashboard | View Grafana dashboard; verify latency, traffic, errors, saturation panels | Infra | ☐ |
| 5.3 | Set up demo-watchdog script on second terminal | See Section 1.3 script; test it fires an alert | Dev | ☐ |
| 5.4 | Write and print incident runbook (Section 3.4) | Physical card or second screen — tested | All | ☐ |
| 5.5 | Verify Tailscale Prometheus metrics flowing | `curl http://localhost:9100/metrics \| grep tailscaled` | Infra | ☐ |
| 5.6 | Configure alert: API error rate > 1% → notification | In Grafana/Prometheus alerting | Infra | ☐ |

---

### PHASE 6: DEMO RESILIENCE (T-8h)

| # | Action | Command/Method | Owner | Status |
|---|--------|----------------|-------|--------|
| 6.1 | Record all 5 fallback video clips (Section 5.2) | Screen recording; save as per naming convention | Demo lead | ☐ |
| 6.2 | Arrange clips on separate desktops; test 3-finger swipe | macOS Mission Control or equivalent | Demo lead | ☐ |
| 6.3 | Configure mobile hotspot as backup network | Test full demo flow over hotspot | Demo lead | ☐ |
| 6.4 | Bundle all external JS/CSS dependencies locally | Check for CDN dependencies in all 15 surfaces | Frontend | ☐ |
| 6.5 | Close all non-essential apps; enable Do Not Disturb | OS-level DND + mute all notifications | Demo lead | ☐ |

---

### PHASE 7: DRESS REHEARSAL (T-4h to T-2h)

| # | Action | Command/Method | Owner | Status |
|---|--------|----------------|-------|--------|
| 7.1 | Rehearsal #1: Full demo run from cold start | Time it; note any failures | Demo lead | ☐ |
| 7.2 | Rehearsal #2: Deliberately kill one node mid-demo | Practice graceful degradation + pivot | Demo lead + Infra | ☐ |
| 7.3 | Rehearsal #3: Full run; record as final fallback video | This is your backup if everything fails | Demo lead | ☐ |
| 7.4 | Run golden-path smoke test suite ONE FINAL TIME | Should complete in < 5 minutes, all green | Dev | ☐ |
| 7.5 | Re-verify Tailscale auth on all nodes | `tailscale status` | Infra | ☐ |

---

### PHASE 8: T-30 MINUTES (Demo Day)

| # | Action | Method | Owner | Status |
|---|--------|--------|-------|--------|
| 8.1 | Run batch HTTP check on all 15 surfaces | Quick script (< 60s) | Dev | ☐ |
| 8.2 | Open Grafana/metrics dashboard on second monitor | Confirm all 4 golden signals are green | Infra | ☐ |
| 8.3 | Start demo-watchdog script | Terminal, second monitor | Dev | ☐ |
| 8.4 | Pre-warm all connections and inference engine | Hit each surface URL; fire one dummy inference | Demo lead | ☐ |
| 8.5 | Confirm mobile hotspot is on and connected as backup | Check backup network is live | Demo lead | ☐ |
| 8.6 | Open fallback video clips on separate desktops | Ready to 3-finger swipe at any moment | Demo lead | ☐ |
| 8.7 | Incident runbook is visible on second screen | Physical card or second window | All | ☐ |

---

## QUICK REFERENCE: DECISION TREE DURING DEMO

```
Something feels wrong →
  ├─ Is a URL returning non-200? → Check demo-watchdog alerts
  │     ├─ One surface only → Switch to pre-recorded clip for that section
  │     └─ Multiple surfaces → Activate full fallback; narrate from recording
  │
  ├─ Is inference slow (> 15s)? → Check GPU health
  │     ├─ One node OOM → API should auto-route; watch metrics
  │     └─ All nodes slow → Switch to pre-recorded clip-02-inference-live.mp4
  │
  ├─ Tailscale issue? → `tailscale status` on any node
  │     ├─ Node offline → Narrate as "watching mesh self-heal" (if it heals)
  │     └─ Full mesh down → Activate full fallback recording
  │
  └─ WebGPU visualization broken? → Check browser console
        ├─ GPU adapter null → Fallback video should have activated automatically
        └─ JS error → Refresh once; if still broken → switch to pre-recorded
```

---

## SOURCES

- [Google SRE Launch Coordination Checklist](https://sre.google/sre-book/launch-checklist/)
- [Google SRE Reliable Product Launches (PRR)](https://sre.google/sre-book/reliable-product-launches/)
- [Google SRE Error Budgets and Maintenance Windows](https://cloud.google.com/blog/products/management-tools/sre-error-budgets-and-maintenance-windows)
- [Google SRE Service Best Practices](https://sre.google/sre-book/service-best-practices/)
- [Circuit Breakers and Bulkheads — Meridian Space / Michael Nygard Release It!](https://rustycloud.org/distributed_systems_track/module-04-fault-tolerance/lesson-02-circuit-breakers-bulkheads.html)
- [Distributed Systems Authority Circuit Breaker Pattern](https://distributedsystemauthority.com/circuit-breaker-pattern)
- [Harness DevOps Academy — Smoke Testing CI/CD](https://www.harness.io/harness-devops-academy/integrating-smoke-testing-into-your-ci-cd-pipeline-what-devops-needs-to-know)
- [QASkills Production Smoke Suite](https://qaskills.sh/skills/Pramod/production-smoke-suite)
- [LaunchDarkly Comprehensive Guide to Smoke Testing](https://launchdarkly.com/blog/comprehensive-guide-smoke-testing-software-development/)
- [MOSS Deployment Health Checks](https://moss.sh/deployment/how-to-set-up-deployment-health-checks/)
- [Netflix/TechInterview — Chaos Engineering, Game Days](https://www.techinterview.org/post/3233474125/system-design-chaos-engineering-netflix-chaos-monkey-fault-injection-game-days-resilience-testing-blast-radius/)
- [Chaos Engineering Guide — Yuri Kan](https://yrkan.com/blog/chaos-engineering-guide/)
- [OpenTelemetry Three Pillars — DEV Community](https://dev.to/young_gao/the-three-pillars-of-observability-logs-metrics-and-traces-in-practice-4537)
- [ZeonEdge Three Pillars of Observability](https://zeonedge.com/eu/blog/observability-metrics-logs-traces-guide)
- [Kubernetes Health Probes and Lifecycle](https://handsonk8s.substack.com/p/lesson-12-health-probes-and-lifecycle)
- [Kubernetes Structured Logs](https://kubernetes.io/blog/2020/09/04/kubernetes-1-19-introducing-structured-logs/)
- [Tailscale Monitoring with Prometheus & Grafana](https://binadit.com/tutorials/configure-tailscale-monitoring-with-prometheus-grafana)
- [Tailscale Gateway Monitoring and Observability](https://rajsinghtech.github.io/tailscale-gateway/operations/monitoring/)
- [FitGap — Prove Monitoring Readiness Before Go-Live](https://us.fitgap.us/stack-guides/prove-monitoring-alerting-and-incident-response-readiness-before-go-live)
- [cosign README — Sigstore](https://github.com/sigstore/cosign/blob/main/README.md)
- [Sigstore Keyless Signing — systemshardening.com](https://www.systemshardening.com/articles/cicd/sigstore-keyless-signing/)
- [Trivy SBOM Attestation Docs](https://trivy.dev/docs/supply-chain/attestation/sbom/)
- [Secure Pipelines SBOM Lab](https://secure-pipelines.com/ci-cd-security/lab-sbom-pipeline-generate-attest-verify-syft-cosign/)
- [Sigstore Cosign Cheat Sheet — Tech Bytes](https://techbytes.app/posts/software-integrity-sigstore-cosign-rekor-cheat-sheet/)
- [SLSA Framework Guide 2026 — Practical DevSecOps](https://www.practical-devsecops.com/slsa-framework-guide-software-supply-chain-security/)
- [SLSA Deep Dive — DEV Community](https://dev.to/kanywst/slsa-deep-dive-securing-the-supply-chain-using-verifiable-levels-klk)
- [Sigstore/Rekor Compare Signatures — Rewanth Tammana](https://rewanthtammana.com/sigstore-the-easy-way/rekor/compare-the-signatures-uploaded-to-transparency-log-and-registry/)
- [Defense Unicorns UDS Package Documentation](https://docs.defenseunicorns.com/core/v1-2/how-to-guides/packaging-applications/create-uds-package/)
- [NVIDIA vLLM GPU Inference Health Checks](https://build.nvidia.com/spark/vllm/multi-sparks-through-switch)
- [Triton Inference Server Health Check](https://leeroopedia.com/index.php/Implementation:Triton_inference_server_Server_Container_Health_Check)
- [WebGPU Troubleshooting — Chrome for Developers](https://developer.chrome.com/docs/web-platform/webgpu/troubleshooting-tips)
- [DEMOgod Awards Tips](https://na.eventscloud.com/file_uploads/e1f4ea812871256b214e709b27bcae86_DEMOgod_Tips.pdf)
- [Appeasing the Demo Gods](https://watro.zimmic.com/post/48037704726/appeasing-the-demo-gods)
- [Segment8 Technical Demo Design](https://blog.segment8.com/posts/technical-demo-design/)
- [Kate Catlin High-Stakes AI Demo Prep](https://katecatlin.substack.com/p/how-i-prepare-for-high-stakes-technical)
- [Cloudflare Minimize Downtime](https://developers.cloudflare.com/fundamentals/performance/minimize-downtime/)
- [Stripe Observability at Scale — InfoQ](https://www.infoq.com/news/2024/11/stripe-observability-aws-managed/)
- [Datadog Health Check Guide](https://webeyez.com/insights/guides/datadog-health-check-guide)
