#!/usr/bin/env python3
"""
forge-agent — the REAL Forge executor invoked by the forge-perplexity poll's
dispatch path (FORGE_DISPATCH_CMD). This is NOT a placeholder.

Contract (from /usr/local/sbin/forge-perplexity-poll :: dispatch_to_agent):
  - The poll runs us via `bash -lc "$FORGE_DISPATCH_CMD"` with the order body
    (a "payload_note" preamble + the NEXT_ORDER.md text) on STDIN, 900s budget.
  - dispatch_ok in AUTO_STATE.json == (our exit code == 0). So we exit 0 ONLY
    when a real reasoning pass ran against a live sovereign model AND we
    committed a real work product back to the repo. Otherwise we exit non-zero
    so the loop reports the failure honestly (never a fake "ok").

What it actually does (the honest Gate-1 fix):
  1. Reads the order from stdin; classifies bullet/numbered lines into actionable
     vs founder-gated (same Doctrine-v11 markers the poll uses) and DROPS gated.
  2. Runs the non-gated order through the live SOVEREIGN LLM fabric (Ollama:
     betterwithage RTX primary -> chaski fallback) to produce a concrete
     execution analysis / decisions / next-actions work product.
  3. Secret-scrubs the result, then commits it to replit-sync/ via the GitHub
     contents API (GH_TOKEN already in the box env) so the output is real and
     auditable.

Doctrine v11 boundaries enforced by construction (capabilities it does NOT have):
  - Never merges a keystone (lutar-lean) PR; never commits a key/secret; never
    weakens or silences a gate; never claims something is "live"/"deployed" — it
    produces reviewable analysis + a committed report, not unsupervised prod writes.
"""
import base64
import datetime
import json
import os
import re
import sys
import urllib.error
import urllib.request

ENV_FILE = "/etc/forge-perplexity.env"
LOG_FILE = "/var/log/forge-agent.log"


def load_env(path):
    env = {}
    try:
        with open(path) as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                v = v.strip()
                if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                    v = v[1:-1]
                env[k.strip()] = v
    except FileNotFoundError:
        pass
    return env


CFG = {}
CFG.update(os.environ)
CFG.update(load_env(ENV_FILE))

REPO = CFG.get("REPO", "szl-holdings/platform")
DIRP = CFG.get("DIR", "replit-sync")
GH_TOKEN = CFG.get("GH_TOKEN", "")
API = f"https://api.github.com/repos/{REPO}"

# Sovereign LLM fabric (Ollama). Override with FORGE_LLM_SPEC="url|model,url|model".
DEFAULT_LLM_SPEC = (
    "http://100.125.77.31:11434|qwen2.5-coder:7b,"   # betterwithage RTX (sovereign GPU)
    "http://100.102.173.88:11434|qwen2.5:14b,"        # chaski (tailnet brain, CPU)
    "http://100.102.173.88:11434|llama3.1:8b"         # chaski lighter fallback
)
LLM_SPEC = CFG.get("FORGE_LLM_SPEC", DEFAULT_LLM_SPEC)

GATED_RE = re.compile(
    r"(founder[- ]?gated|founder\s+(approv|confirm)|hard[- ]?limit|cosign|"
    r"private\s*key|\bPEM\b|\bsecret\b|\bPAT\b|\btoken\b|\bHSM\b|\bKMS\b|"
    r"major\s+dep|relicen|warn\s*->?\s*enforce|enforce.*ns)",
    re.IGNORECASE,
)

SECRET_PATTERNS = [
    re.compile(r"tskey-[A-Za-z0-9-]+"),
    re.compile(r"gh[pousr]_[A-Za-z0-9]{20,}"),
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"(?i)bearer\s+[A-Za-z0-9._\-]{20,}"),
]


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def log(msg):
    line = f"{now_iso()} forge-agent: {msg}\n"
    try:
        with open(LOG_FILE, "a") as fh:
            fh.write(line)
    except OSError:
        pass
    sys.stderr.write(line)


def scrub(text):
    for pat in SECRET_PATTERNS:
        text = pat.sub("[REDACTED]", text)
    return text


def classify(order_text):
    actionable, gated = [], []
    for raw in order_text.splitlines():
        line = raw.strip()
        if not line or not re.match(r"^([-*+]|\d+[.)]|\u2022)\s", line):
            continue
        item = re.sub(r"^([-*+]|\d+[.)]|\u2022)\s*", "", line).strip()
        if not item:
            continue
        (gated if GATED_RE.search(item) else actionable).append(item)
    return actionable, gated


def ollama_chat(base, model, system, user, timeout=600):
    body = {
        "model": model,
        "stream": False,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "options": {"temperature": 0.2, "num_ctx": 8192},
    }
    req = urllib.request.Request(
        base.rstrip("/") + "/api/chat",
        data=json.dumps(body).encode(),
        method="POST",
    )
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        out = json.loads(resp.read())
    return (out.get("message") or {}).get("content", "").strip()


def has_model(base, model, timeout=8):
    try:
        req = urllib.request.Request(base.rstrip("/") + "/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            tags = json.loads(resp.read())
        names = {m.get("name") for m in tags.get("models", [])}
        return model in names or f"{model}:latest" in names
    except Exception:
        return False


def run_sovereign(system, user):
    """Try each (node, model) until one answers. Returns (text, provider)."""
    last_err = None
    for spec in LLM_SPEC.split(","):
        spec = spec.strip()
        if "|" not in spec:
            continue
        base, model = (s.strip() for s in spec.split("|", 1))
        if not has_model(base, model):
            log(f"skip {base} {model} (model not present)")
            continue
        sovereign = "100.125.77.31" in base  # betterwithage RTX
        provider = f"{'sovereign-gpu' if sovereign else 'tailnet-cpu'} {base} :: {model}"
        try:
            log(f"dispatching to {provider}")
            text = ollama_chat(base, model, system, user)
            if text:
                return text, provider
            last_err = f"empty response from {provider}"
        except Exception as e:  # noqa: BLE001
            last_err = f"{provider}: {e}"
            log(f"FAILED {last_err}")
    raise RuntimeError(last_err or "no sovereign LLM node available")


def gh_put(path, text, message):
    # fetch existing sha (if any) so we can update
    sha = None
    req = urllib.request.Request(f"{API}/contents/{path}", method="GET")
    req.add_header("Authorization", f"token {GH_TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "forge-agent")
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            sha = json.loads(resp.read()).get("sha")
    except urllib.error.HTTPError:
        pass
    body = {
        "message": message,
        "content": base64.b64encode(text.encode()).decode(),
        "branch": "main",
        "committer": {"name": "forge-agent", "email": "forge@szl-holdings.local"},
    }
    if sha:
        body["sha"] = sha
    req = urllib.request.Request(
        f"{API}/contents/{path}", data=json.dumps(body).encode(), method="PUT"
    )
    req.add_header("Authorization", f"token {GH_TOKEN}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "forge-agent")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.status, json.loads(resp.read())


SYSTEM_PROMPT = (
    "You are Forge, the box-side autonomous executor for szl-holdings, operating "
    "under Doctrine v11. You receive an auto-loop ORDER and must produce a concrete, "
    "honest execution work product for the NON-founder-gated items only.\n"
    "HARD RULES:\n"
    "- Be truthful. NEVER claim something is deployed/live/passing unless the order "
    "states it as already-verified fact. Distinguish DONE vs RECOMMENDED vs BLOCKED.\n"
    "- Never output secrets, keys, tokens, or PEM material.\n"
    "- Never propose merging a keystone (lutar-lean) PR, committing a key, or weakening a gate.\n"
    "OUTPUT (markdown):\n"
    "1. ## Understanding — 2-4 lines restating the order's intent.\n"
    "2. ## Plan — ordered, concrete steps for each actionable item.\n"
    "3. ## Decisions / Analysis — the actual reasoning work product (the substance).\n"
    "4. ## Status — per item: DONE / RECOMMENDED / BLOCKED(reason).\n"
    "5. ## Founder-gated (not executed) — list anything requiring a human/secret.\n"
    "Be specific and useful; this is real output that will be committed and read."
)


def main():
    if not GH_TOKEN:
        log("FATAL: GH_TOKEN missing")
        return 2
    order = sys.stdin.read().strip()
    if not order:
        log("no order on stdin — nothing to do")
        return 3
    actionable, gated = classify(order)
    if not actionable:
        log("order has no actionable (non-gated) items — recording handshake, exit 0")
        # still a valid, honest pass: nothing reasoning-heavy to execute
    user = (
        "ORDER (auto-loop). Execute ONLY non-founder-gated items.\n\n"
        f"Detected actionable items ({len(actionable)}):\n"
        + "\n".join(f"- {a}" for a in actionable)
        + (f"\n\nFounder-gated (DO NOT execute) ({len(gated)}):\n"
           + "\n".join(f"- {g}" for g in gated) if gated else "")
        + "\n\n--- FULL ORDER TEXT ---\n" + order
    )
    try:
        product, provider = run_sovereign(SYSTEM_PROMPT, user)
    except Exception as e:  # noqa: BLE001
        log(f"sovereign dispatch failed: {e}")
        return 4
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    report = (
        f"# Forge executor pass — {now_iso()}\n\n"
        f"**Executor:** /usr/local/sbin/forge-agent (real sovereign-LLM executor)\n"
        f"**Provider:** {provider}\n"
        f"**Actionable items:** {len(actionable)} | **Founder-gated skipped:** {len(gated)}\n"
        f"**Doctrine:** v11 — no fabricated operational flags, no secrets committed, "
        f"no keystone self-merge.\n\n---\n\n"
        + scrub(product)
        + "\n\n---\n_Generated by the sovereign fabric and committed by forge-agent. "
        "Irreversible/prod writes (merges, deploys, secrets) remain founder-gated by design._\n"
    )
    path = f"{DIRP}/forge-agent-exec-{stamp}.md"
    try:
        st, _ = gh_put(path, report, f"forge-agent: executed order -> {path.split('/')[-1]}")
    except Exception as e:  # noqa: BLE001
        log(f"commit failed: {e}")
        return 5
    if st not in (200, 201):
        log(f"commit non-2xx: {st}")
        return 6
    log(f"OK -> committed {path} via {provider}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
