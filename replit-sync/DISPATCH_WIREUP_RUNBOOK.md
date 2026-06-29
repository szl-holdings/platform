# Forge Dispatch Wire-Up — Box Runbook

Flips Forge from **report-only** (`dispatch_mode:none`, `dispatch_ok:false`) to
**actually executing** the pinned `NEXT_ORDER.md` jobs. Run AS ROOT on the Hetzner
box (a-11-oy.com, 167.233.50.75). Doctrine v11: never self-merge a keystone, never
commit a key, label `live` only on a real 200.

## Run it (the whole thing — copy/paste)

```bash
cd /opt/szl/platform && git pull --ff-only
sudo bash replit-sync/WIRE_FORGE_DISPATCH_ON.sh
```

## The ONE thing to know

`FORGE_AGENT_INVOCATION` must be the **real headless agent command** on this box —
the same agent that merged PRs #229/#230/#231 — and it must read the order body on
**stdin**. The script auto-detects, in order, these candidates on PATH:

```
forge-agent  |  forge-run  |  chaski-agent  |  claude
```

If none is right (or auto-detect picks wrong), force the exact command:

```bash
cd /opt/szl/platform && git pull --ff-only
sudo FORGE_AGENT_INVOCATION='<your real headless agent, reads order on stdin>' \
  bash replit-sync/WIRE_FORGE_DISPATCH_ON.sh
```

The runner fails LOUDLY (exit 127) if that command is missing — it never silently
reverts to none. Re-running is safe (idempotent: no duplicate env lines, won't
clobber a different working `FORGE_DISPATCH_CMD`).

## Verify success

The script's final VERDICT prints `SUCCESS` when `dispatch_mode != none` AND
`dispatch_ok:true`. Confirm any time from anywhere:

```bash
gh api repos/szl-holdings/platform/contents/replit-sync/AUTO_STATE.json \
  --jq '.content' | base64 -d | python3 -c \
  'import sys,json;d=json.load(sys.stdin);print("dispatch_mode:",d["dispatch_mode"],"| dispatch_ok:",d["dispatch_ok"])'
```

## Rollback

```bash
SVC=$(systemctl list-units --all --type=service --no-legend | awk '{print $1}' \
        | grep -oE 'forge-perplexity[^ ]*\.service' | head -1)
sudo rm -f "/etc/systemd/system/${SVC}.d/10-dispatch-env.conf" && sudo systemctl daemon-reload
sudo sed -i '/^FORGE_DISPATCH_CMD=/d' /etc/forge-perplexity.env
sudo systemctl restart "${SVC%.service}.timer"   # back to report-only
```
