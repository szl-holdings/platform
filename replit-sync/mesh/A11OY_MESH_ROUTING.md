# A11OY_MESH_ROUTING — point a11oy at the Sovereign GPU Mesh

**Status: DESIGN (PLANNING).** Describes how the always-on public host `a-11-oy.com`
(`167.233.50.75`, CPU-only) routes model traffic to the mesh **coordinator over Tailscale**,
with HF-router failover. No servers are launched by this document.

---

## 1. The one variable that changes: `A11OY_MODEL_BASE_URL`

a11oy already resolves its model calls through an env var (`A11OY_MODEL_BASE_URL`). To put
a11oy on the sovereign mesh, that var points at the **mesh coordinator's Tailscale IP**, not
at any public model endpoint.

```bash
# a11oy environment (env-only; NEVER committed)
A11OY_MODEL_BASE_URL="http://100.64.0.2:8080/v1"   # coordinator on the tailnet (a11oy itself
                                                    # if it is the coordinator: use its 100.x IP)
A11OY_MODEL_NAME="SZL-Nemo"                         # the governed served-model-name
A11OY_FAILOVER_BASE_URL="${HF_ROUTER_URL}"          # HF Spaces failover (env-only)
A11OY_MESH_TOKEN="…"                                # coordinator bearer token (env-only)
```

- If `a11oy` is itself the coordinator (the recommended placement — always-on CPU host), the
  base URL is a11oy's own tailnet IP and the coordinator process front-ends the GPU workers.
- The coordinator exposes an **OpenAI-compatible `/v1`** facade: it accepts the chat/embeddings
  request, looks up the `LIVE` placement for the requested served-model-name, and proxies to
  the chosen worker's vLLM/llama.cpp `/v1` endpoint over the tailnet.

> Because the base URL is a private `100.x.y.z` tailnet address, model traffic never traverses
> the public internet between a11oy and the GPU workers — the WireGuard overlay is the trust
> boundary. Only `a11oy:443` is public.

---

## 2. Routing flow (per request)

```
client → a11oy:443 (public TLS, 0 runtime CDN)
        → A11OY_MODEL_BASE_URL  (coordinator /v1, tailnet)
            → coordinator looks up placement for model "SZL-Nemo"
               ├─ LIVE mesh worker for the tier?      → proxy there            [x-szl-serve-tier: mesh-live]
               ├─ only MODELED/degraded worker?        → one short-timeout try  [x-szl-serve-tier: mesh-degraded]
               └─ no usable worker?                    → HF router failover     [x-szl-serve-tier: hf-failover]
                                                         (A11OY_FAILOVER_BASE_URL)
            → if both unavailable → honest labeled error (never a fabricated answer)
```

Every response carries `x-szl-serve-tier` so the caller knows the provenance of the answer.
Failover engages only on real unavailability, not silently.

---

## 3. HF-router failover

- `HF_ROUTER_URL` points at the SZL HF Spaces endpoint that serves the **same governed
  SZL-Nemo (Qwen3-32B) tier** as a cloud failover.
- Failover is **last resort**, after the tailnet mesh has no `LIVE` worker for the tier.
- The HF failover endpoint is also labeled `SZL-Nemo` and serves the **same OPEN Qwen3-32B
  Apache-2.0 governed model** — failover does not change what the model *is*.
- The HF token is **env-only** (`HF_TOKEN`), never committed, never written to a capability
  JSON.

---

## 4. HONEST DOCTRINE (hard gates — this routing layer must never violate)

1. **Trust never 100%.** The coordinator labels every placement `MODELED` until it has
   round-tripped a live health probe, then `LIVE`. a11oy honors that: it will not advertise a
   tier as live unless the coordinator says `LIVE`. Degraded/failover paths are surfaced via
   the `x-szl-serve-tier` header, never hidden.
2. **Models are labeled.** What a11oy serves is **SZL-Nemo = a governed serving of the OPEN
   `Qwen/Qwen3-32B` (Apache-2.0)** model. It is presented as exactly that.
3. **NEVER claim from-scratch / Ultra-local / 550B.** SZL-Nemo is governed Qwen3-32B. It is
   NOT a from-scratch SZL model, NOT a 550B model, NOT a local "Nemotron Ultra". **Nemotron
   Ultra is a cloud-NIM verified tier only** and is not part of this on-box mesh; if a verified
   Ultra answer is ever surfaced it must be labeled as the cloud-NIM verified tier, distinctly
   from SZL-Nemo.
4. **Real data labeled `LIVE` / `SAMPLE` / `MODELED`.** Placement and health states carry the
   label; a11oy passes it through to callers/operators.
5. **Never commit a key.** `A11OY_MESH_TOKEN`, `HF_TOKEN`, `TS_AUTHKEY`, `COORDINATOR_TOKEN`
   are all environment-only. No token appears in any committed file or capability JSON.
6. **0 runtime CDN.** The public a11oy surface ships its assets locally; no third-party CDN at
   runtime.

---

## 5. Why this is safe to wire

- The coordinator endpoint is OpenAI-compatible, so a11oy's existing `A11OY_MODEL_BASE_URL`
  plumbing needs only a value change, not a code rewrite.
- If the mesh is fully down, a11oy still answers via HF failover — the public box stays up.
- If a GPU node cycles, the coordinator drops it from the active placement on the next plan
  (heartbeat lapse → `down`) and a11oy keeps routing to the remaining `LIVE` workers or
  failover. No single GPU node is a hard dependency for a11oy's availability.
