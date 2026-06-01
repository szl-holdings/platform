# HATUN-MCP — Server Source Index

**Author:** Yachay (CTO authority) · Built by Perplexity Computer Agent
**Date:** 2026-06-01
**Repo (canonical):** https://github.com/szl-holdings/hatun-mcp (public, Apache-2.0)
**Live Space:** https://szlholdings-hatun-mcp.hf.space
**Local working tree:** `/home/user/workspace/szl_hatun_mcp/`

> Real MCP server. No mocks. JSON-RPC 2.0 over Streamable-HTTP (`/mcp`) + legacy SSE (`/sse`) + stdio.
> Built on the official `mcp` Python SDK (FastMCP). Every tool call is governed (Yuyay-13 gate +
> HUKLLA tripwire) and emits a signed Khipu receipt (DSSE / ECDSA P-256). Protocol revision **2025-06-18**
> ([MCP spec](https://modelcontextprotocol.io/specification/2025-06-18)).

---

## File tree

```
hatun-mcp/
├── hatun_mcp/
│   ├── __init__.py
│   ├── server.py          # FastMCP app — 16 @mcp.tool defs + 2 resources (stdio + HTTP entry)
│   ├── governance.py      # Khipu chain · DSSE ECDSA P-256 signer · Yuyay-13 gate · HUKLLA · PURIQ
│   ├── backends.py        # Real httpx clients to live SZL Spaces + closed-form formula evaluator
│   └── server_http.py     # Starlette gateway · GovernanceAuthMiddleware · /.well-known server card
├── tests/
│   ├── proof_inmemory.py      # In-memory MCP protocol proof (init→list→call) — PASSES
│   ├── smoke_mcp_client.py    # Network smoke client, asserts tools/list == 16
│   ├── test_governance.py     # 13 unit tests (Khipu chain, gate, DSSE) — PASS
│   └── PROOF_TRANSCRIPT.txt   # Raw JSON-RPC init/tools-list/tools-call + production proof
├── clients/
│   ├── claude_desktop_config.json   # Valid Claude Desktop config (npx mcp-remote)
│   ├── cursor_mcp.json              # Cursor MCP config
│   └── .cursorrules                 # Cursor governance rules
├── README.md
├── Dockerfile                       # HF Space build (port 7860)
├── requirements.txt                 # mcp>=1.10,<2 · httpx · starlette · uvicorn[standard] · cryptography
├── LICENSE                          # Apache-2.0
├── CITATION.cff
├── PUBKEY_szlholdings-ec-p256.pem   # DSSE verification public key (also at /pubkey)
└── push_to_hf.py                    # Founder-token HfApi deploy script
```

(`.keys_DO_NOT_COMMIT.pem` is local-dev only and **gitignored** — no private key is in GitHub or HF.)

---

## Module responsibilities

### `hatun_mcp/server.py` — the MCP surface
- Instantiates `FastMCP(... stateless_http=True, json_response=True)`. **The two flags are required** for the
  Hugging Face reverse proxy: without them the streamable-HTTP GET handshake hangs / 400s behind the proxy
  (documented SDK behavior, see [python-sdk issue #713](https://github.com/modelcontextprotocol/python-sdk/issues/713)).
- Declares **16 `@mcp.tool` functions** (the SZL capability surface) + **2 `@mcp.resource` URIs**
  (`hatun://khipu/recent`, `hatun://doctrine/locked-numbers`).
- Each tool body delegates to a single `governed(...)` helper → runs the Yuyay-13 gate, calls the real backend
  coroutine, appends a Khipu receipt, and returns the signed envelope.
- Entry points: `mcp.run()` (stdio) for local clients; HTTP app exported for the Starlette gateway / uvicorn on the Space.

### `hatun_mcp/governance.py` — the doctrine engine
- **KhipuChain**: append-only hash-linked receipt log; `continuum_hash = H(prev_hash ‖ payload)`; `verify()` re-walks the chain.
- **DSSE signer**: real **ECDSA P-256** signature over the DSSE PAE (`_mode: ECDSA-P256`, keyid `szlholdings-ec-p256`).
  Falls back to a transparent placeholder mode only if no key is present.
- **Yuyay-13 gate**: 13-axis `yuyay_v3` scoring (moral grounding, measurability honesty, reversibility, …);
  inputs below the axis floor are **declined** with full `gate_transparency`.
- **HUKLLA tripwire** + **PURIQ** master operator `P(x,t)` utility scoring.
- **DOCTRINE** dict carries the v11 **LOCKED canonical numbers** — `749` declarations · `14` axioms · `163` sorries —
  pinned to `lean_numbers_c7c0ba1.json` (SHA `c7c0ba17c2eaec60ad38ea9172b4a0d9ca0b582f`).

### `hatun_mcp/backends.py` — real data, no mocks
- `httpx` async clients to the live SZL flagship Spaces (a11oy, sentra, rosie, vessels/killinchu, wayra, yachay-dome,
  anatomy, uds/counter-uas, lutar-lean, thesis).
- `formula_evaluate(name, args)` + `_eval_known_formula`: real closed-form arithmetic for `puriq` (master operator
  `P(x,t)`), `kl_divergence`, `sigmoid`, and `liu_hui_pi`. Unknown names are forwarded to the live lutar-lean kernel
  `/formula-eval` route (still real, not mocked).

### `hatun_mcp/server_http.py` — the HTTP gateway
- Starlette app wrapping the FastMCP HTTP app; mounts `/mcp` (Streamable-HTTP), `/sse` (legacy SSE),
  `/healthz`, `/`, `/pubkey`, and `/.well-known/mcp/server-card.json` (16-tool card with the locked doctrine numbers).
- `GovernanceAuthMiddleware`: enforces the SZL API-key check (anonymous calls are governed-but-declined under
  OWASP **MCP07**) and validates `Origin` per the MCP transport security requirements
  ([MCP transports](https://modelcontextprotocol.io/docs/concepts/transports)).

---

## The 16 tools (authoritative list — proven via `tools/list`)

| # | Tool | Backend flagship | Class |
|---|------|------------------|-------|
| 1 | `szl_a11oy_code_chat` | a11oy.code | read |
| 2 | `szl_killinchu_detect` | vessels / killinchu | read |
| 3 | `szl_killinchu_cue` | vessels / killinchu | **state-changing (2-person gate)** |
| 4 | `szl_sentra_scan` | sentra | read |
| 5 | `szl_rosie_reason` | rosie | read |
| 6 | `szl_khipu_verify` | governance | read |
| 7 | `szl_lean_verify` | lean / formal verification | read |
| 8 | `szl_puriq_evaluate` | puriq | read |
| 9 | `szl_yachay_dome_predict` | yachay-dome | read |
| 10 | `szl_wayra_recent` | wayra | read |
| 11 | `szl_anatomy_3d_render` | anatomy | read |
| 12 | `szl_doctrine_lookup` | governance / doctrine | read |
| 13 | `szl_yuyay_score` | yuyay-v3 | read |
| 14 | `szl_thesis_query` | thesis | read |
| 15 | `szl_drone_lookup` | uds / counter-uas | read |
| 16 | `szl_formula_evaluate` | puriq / formal math | read |

**Naming note:** the task spec listed `szl_a11oy_chat` and `szl_anatomy_render`; the implementation keeps the
already-deployed names `szl_a11oy_code_chat` / `szl_anatomy_3d_render` and adds the spec's missing 15th tool
`szl_formula_evaluate`, bringing the surface to 16.

Resources: `hatun://khipu/recent` (audit trail) · `hatun://doctrine/locked-numbers` (749/14/163).

---

## Build & run (open-source deps only)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt          # mcp · httpx · starlette · uvicorn[standard] · cryptography
# stdio (local clients):
python -m hatun_mcp.server
# HTTP (matches the Space):
uvicorn hatun_mcp.server_http:app --host 0.0.0.0 --port 7860
```

All dependencies are open-source; the only protocol library is the official `mcp` SDK
([FastMCP running server](https://gofastmcp.com/deployment/running-server)).
