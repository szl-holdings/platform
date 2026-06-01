# HATUN-MCP — GitHub Push Log (Phase 3)

**Author:** Yachay (CTO authority) · Built by Perplexity Computer Agent
**Date:** 2026-06-01
**Target repo:** https://github.com/szl-holdings/hatun-mcp (**PUBLIC** — open-source distribution path)
**License:** Apache-2.0
**Auth:** `gh` CLI / git via `api_credentials=["github"]`.

---

## Method

The repo pre-existed with a LICENSE-only `main` (created at repo init). The local working tree had the full
server history. Reconciled with:

```bash
gh auth setup-git
git remote add origin https://github.com/szl-holdings/hatun-mcp.git
git fetch origin
git merge origin/main --allow-unrelated-histories -X ours -m "merge initial repo LICENSE"
git push origin HEAD:main
```

The git remote rewrites to `git-agent-proxy.perplexity.ai` for transport but authenticates with the GitHub
credential preset.

---

## Commit log (on `main`)

| Commit | Description |
|--------|-------------|
| `8cd499a` | Initial commit (repo bootstrap) |
| `223c44d` | Hatun-MCP v1.0.0 — doctrine-aware MCP server |
| `a1875be` | v1.0.0: add `szl_formula_evaluate` (16 tools), v11 LOCKED 749/14/163, stateless HTTP, real-protocol proof transcript |
| `d19ca47` | merge initial repo LICENSE (`--allow-unrelated-histories -X ours`) |
| `36d04e3` | Add DSSE verification public key (`szlholdings-ec-p256`); also served at `/pubkey` |

Latest `main` = **`36d04e3`**.

---

## Repo metadata set

- **Description:** doctrine-aware MCP server exposing governed SZL flagship capabilities (Yuyay-13 gate + Khipu receipts).
- **Topics:** `model-context-protocol`, `mcp`, `agentic`, `governance`.
- **Homepage:** https://szlholdings-hatun-mcp.hf.space
- **Visibility:** public.

---

## Secret-leak check

- `.gitignore` excludes `*.pem` private keys, `.keys_DO_NOT_COMMIT.pem`, `__pycache__`, `.pytest_cache`.
- Only the **public** key `PUBKEY_szlholdings-ec-p256.pem` is tracked.
- `git log -p | grep -i "BEGIN EC PRIVATE\|BEGIN PRIVATE"` → **no matches**. Confirmed: no private key in history.

---

## What a fresh clone gives you

```bash
git clone https://github.com/szl-holdings/hatun-mcp.git
cd hatun-mcp
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m hatun_mcp.server            # stdio MCP server, ready for Claude Desktop / Cursor
pytest tests/test_governance.py -q    # 13 governance tests pass
python tests/proof_inmemory.py        # full in-memory MCP protocol proof
```
