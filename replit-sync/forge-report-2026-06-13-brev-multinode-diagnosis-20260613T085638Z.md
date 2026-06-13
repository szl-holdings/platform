# Forge → Stephen/Perplexity: Brev wiring — honest diagnosis + live node inventory

UTC: 20260613T085638Z · Doctrine v11 (no fabricated nodes, LIVE only on real 200, no "prove them all").
Forge OPERATES/VERIFIES — merged nothing, fabricated nothing.

## The headline (must read first)
The token you pasted (`nvapi-…`, 70 chars) is a VALID NVIDIA **inference** key — NOT a Brev
**GPU-provisioning** token. So I can talk to NVIDIA hosted models with it, but I CANNOT spin up
Brev free GPU nodes with it. That step is genuinely founder-gated on the RIGHT credential.

### Proof (real HTTP, token piped over stdin, never printed)
- nvapi token vs NVIDIA inference plane  integrate.api.nvidia.com/v1/models  -> **200** (full model catalog: yi-large, llama-3.1-70b, …). Key is real + valid for inference.
- nvapi token vs Brev control plane      brevapi.us-west-2-prod…/api/organizations -> **403 ForbiddenError** (auth REJECTED).
- Unknown route on same control plane    /api/totallynotreal -> **404 NotFoundError** (server DOES route anon requests).
  => The 403 is a real AUTHORIZATION rejection of this token, **NOT** a WAF/IP block (earlier theory corrected — a WAF would 403 the 404 route too).
- nvapi token vs NGC exchange  authn.nvidia.com/token -> 401 (not an NGC token either).

### What unblocks Brev (one founder step)
Brev's control plane wants a Brev-issued session/CLI token, not an `nvapi-` key. On any machine with a browser:
  `brev login`  then  `cat ~/.brev/credentials.json`  (the access/refresh token)  → paste THAT as BREV_CLI_TOKEN.
(Or from brev.nvidia.com the **CLI access token**, which is a JWT, not the `nvapi-…` / `org-…` strings.)
With that I can enumerate + launch the free nodes and wire them into the router.

## Nodes genuinely LIVE right now (real 200 this minute — these ARE running together)
1. Sovereign GPU code tier   a11oy.net/api/a11oy/v1/code/health -> 200  (mode:generative, inference:self-hosted-gpu)
2. Sovereign GPU node        betterwithage Ollama 100.125.77.31:11434/api/tags -> 200  (qwen2.5-coder:7b, llama3.1:8b, meta-llama/Llama-3.1-8B-Instruct, bge-large)
3. NVIDIA hosted inference   integrate.api.nvidia.com -> 200  (UNLOCKED by your token today — valid as a router fallback node)
4. Box joule-meter           joule-meter.service active, :9471/healthz -> 200 (energy telemetry; joules still NVML-gated, see prior report)
   BLOCKED: Brev free GPU nodes (need the CLI token above). I will NOT list them as nodes until they return a real 200.

## "prove them all" — the one line I won't cross (this is the whole point of a11oy)
- Locked kernel-proven set = exactly **8** {F1,F4,F7,F11,F12,F18,F19,F22} (zero sorry, pinned axioms).
- **Conjecture 1 (unconditional Λ uniqueness) is machine-checked FALSE** — only conditional uniqueness is real.
- ~36 experimental + 2 axiom-gated + 2 conditional. lutar-lean CI/Tests/Doctrine green on latest main.
=> I will push REAL new theorems where the kernel actually closes them and label every one honestly.
   Claiming "all proven" would be a fabricated frontier win — exactly what your governance product exists to prevent.

## Net
Your GPU + NVIDIA inference + Ollama node + joule-meter are live and wired honestly today. The free Brev fleet
is one correct token away. Send the Brev CLI/login token and I'll enumerate + launch + verify each node 200-by-200.
