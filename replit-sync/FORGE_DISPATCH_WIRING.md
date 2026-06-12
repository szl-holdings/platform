# Forge dispatch wiring — the real root-cause fix (box-side)

**Problem (verified across 3 order cycles):** the box poll
`/usr/local/sbin/forge-perplexity-poll` reads `NEXT_ORDER.md`, classifies tasks,
and writes `AUTO_STATE.json` with `dispatch_mode: "none", dispatch_ok: false`.
It **delegates** reasoning-heavy work to "the Forge agent" but, with no endpoint
wired, **nothing actually executes** — so PR merges, deploys, and code fixes are
reported but never done. This is the single root cause of work stalling.

**This is NOT fixable from the repo or from Perplexity** — it requires setting
env on the Hetzner box (167.233.50.75). No bandaid exists; the fix is to wire the
dispatch endpoint once. Two supported options (pick ONE):

---

## Option A — `FORGE_DISPATCH_CMD` (recommended, simplest)

Point the poll at a local command that runs Forge's own agent against the order.
On the box, as the user that owns the timer:

```bash
sudo tee -a /etc/forge-perplexity.env >/dev/null <<'ENV'
# Dispatch executor: hand the order body to the Forge (Replit/Chaski) agent CLI.
# Replace the right-hand command with however Forge's agent is invoked on this box
# (the same agent that merged PRs #229/#230/#231). It receives the order text on
# stdin and must do the GitHub + box work, honoring Doctrine v11.
FORGE_DISPATCH_CMD="/usr/local/sbin/forge-agent-run"
ENV
```

Then create `/usr/local/sbin/forge-agent-run` (the actual executor — wire it to
your Forge agent invocation; it already holds the GitHub org token + HF write
token + box shell):

```bash
sudo tee /usr/local/sbin/forge-agent-run >/dev/null <<'SH'
#!/usr/bin/env bash
set -euo pipefail
# stdin = the NEXT_ORDER.md body. Invoke the Forge agent here. Example shape:
#   exec forge-agent --order - --doctrine v11 --no-keystone-selfmerge --no-secrets
# The agent must: do GitHub-reachable work (safe PR merges, repo edits, CI fixes)
# AND box-shell work (deploy on :8081, ollama pulls, env wiring), but NEVER
# merge a lutar-lean keystone PR, NEVER commit a key, NEVER weaken a gate.
cat | forge-agent --order - --doctrine v11
SH
sudo chmod 755 /usr/local/sbin/forge-agent-run
```

## Option B — `FORGE_AGENT_URL` + `FORGE_AGENT_TOKEN` (if Forge runs as a service)

If the Forge agent exposes an HTTP endpoint:

```bash
sudo tee -a /etc/forge-perplexity.env >/dev/null <<'ENV'
FORGE_AGENT_URL="http://127.0.0.1:<forge-agent-port>/dispatch"
FORGE_AGENT_TOKEN="<token the agent expects>"   # never commit this anywhere
ENV
```

---

## Verify (after wiring either option)

```bash
# 1. Restart/refresh the timer so it picks up the new env
sudo systemctl restart forge-perplexity-poll.timer
# 2. Trigger a poll now (or wait for the hourly tick)
sudo /usr/local/sbin/forge-perplexity-poll
# 3. Confirm AUTO_STATE.json flipped: dispatch_mode != "none", dispatch_ok: true
gh api repos/szl-holdings/platform/contents/replit-sync/AUTO_STATE.json \
  --jq '.content' | base64 -d | python3 -c \
  'import sys,json;d=json.load(sys.stdin);print("dispatch_mode:",d["dispatch_mode"],"ok:",d["dispatch_ok"])'
```

Expected after the fix: the next order's `dispatch_mode` shows `dispatch-cmd`
(Option A) or `agent-url` (Option B), `dispatch_ok: true`, and the actionable
items actually land (PRs merge, mesh-resilience `/healthz` -> 200).

## Honesty boundaries the executor MUST keep (Doctrine v11)
- NEVER merge a `lutar-lean` (keystone) PR — human decision only.
- NEVER commit a key/secret; NEVER weaken or silence a CI gate.
- Box-shell tasks are real here (Option A has shell); do them honestly, label
  `live` only on a real 200. locked=8, Lambda=Conjecture 1, Khipu BFT=Conjecture 2.

## Why no repo-side bandaid was used
A GitHub-Actions auto-merger was considered and rejected: it would be a parallel
autonomous merge loop (riskier, and not the real fix). The honest fix is wiring
the one box env var so the existing, capable Forge agent executes — which is
exactly what the auto-loop was designed for.
