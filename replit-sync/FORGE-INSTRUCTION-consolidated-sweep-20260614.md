# SZL Forge — ORDER (CONSOLIDATED SWEEP): fix the real gaps found in full-thread audit

Full live audit done. MOST of the estate is healthy: a11oy.net + HF Space homepages restored (142KB hero,
no white screen); /pinn/* mesh 200 on BOTH surfaces; PINN cert MEASURED + SIGNED (DSSE Ed25519 FA-001,
cosign.pub anchored) on both; yarqa/hatun/anatomy live; 2 GPUs + chaski reachable. PROVE-OR-DOWNGRADE
stays in force: DONE only with a pushed commit SHA / HTTP 200 from a named endpoint / verifying signature.

## P0 — KILLINCHU IS DOWN (BUILD_ERROR) — fix now
`https://szlholdings-killinchu.hf.space/` = 503; HF Space runtime stage = **BUILD_ERROR**
(lastModified 2026-06-14T10:20:50Z — a recent push broke the build). /healthz, /, /elite/mesh all 503.
ACTION: read the killinchu Space BUILD log on HF, find the failing line (missing module / bad COPY /
syntax / requirements), fix it in szl-holdings/killinchu main, push, and rebuild the Space.
**GATE P0:** `curl https://szlholdings-killinchu.hf.space/healthz` = 200 AND `/elite/mesh` = 200
(real topology + 3-of-4 quorum). If the break is a founder-gated dep, mark BLOCKED with the exact line.

## P1 — UPGRADE-WAVE items NOT yet built (from FORGE-INSTRUCTION-sign-and-upgrade) — RECOMMENDED -> build
These were ordered but are still 404 — they are NOT done. Build each as its own draft PR, report PR number:
1. **Per-receipt energy exporter:** `/api/a11oy/v1/energy/metrics` = 404. Wire nvidia-smi power.draw so
   joules_consumed is MEASURED in EVERY receipt (not only the PINN cert). GATE: route 200 + a real watt value.
2. **Certificate history:** `/api/a11oy/v1/pinn/certificates` = 404. Add last-N signed certs,
   content-addressed, auditable over time. GATE: 200 + >=1 entry.
3. **2D-heat / Burgers PINN coverage** on rtx-betterwithage (Λ-gate + signed per-round receipt kept).
   GATE: a pushed commit + rel-L2-per-round reported per PDE.
4. **2nd-GPU role-split:** chaski is now reachable=true — run the Λ-gate governor inference on chaski while
   the PINN solve runs on rtx-betterwithage. GATE: both endpoints' /api/tags = 200; honest fallback if a link flaps.

## P2 — the 15-item agentic wave (agent-loop, BFT quorum, SZL-NEMO, OSCAL, auto-review...)
These were marked DONE in one pass earlier WITHOUT artifacts — that was a doctrine violation and is RESCINDED.
Re-classify ALL of them as RECOMMENDED. Build only via real draft PRs (report PR numbers); multi-PR efforts.
NEVER self-merge a lutar-lean keystone PR. Do NOT mark DONE without a pushed SHA + green checks.

## VERIFIED-GOOD (leave alone — do not regress)
a11oy.net/ + Space/ hero (142KB); /console; /harvest + bounds card; /pinn/* mesh; signed MEASURED cert;
Rekor anchor; yarqa; hatun-mcp; anatomy static; sovereign GPU posture honest (sovereign only on live probe).

## DOCTRINE v11 (HARD)
No fabricated DONE/flags/signatures. MEASURED energy only. Λ = Conjecture 1. SLSA L1 honest. 0 runtime CDN.
Never commit a key. Never weaken a gate. Honest BLOCKED beats a false DONE.

— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> · Doctrine v11 LOCKED · Λ = Conjecture 1
