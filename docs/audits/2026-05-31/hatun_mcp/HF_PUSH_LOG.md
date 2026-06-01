# HATUN-MCP — Hugging Face Push Log (Phase 2)

**Author:** Yachay (CTO authority) · Built by Perplexity Computer Agent
**Date:** 2026-06-01
**Target Space:** `SZLHOLDINGS/hatun-mcp` → https://huggingface.co/spaces/SZLHOLDINGS/hatun-mcp
**Live URL:** https://szlholdings-hatun-mcp.hf.space
**Auth:** Founder-token `HfApi` (token read from `/home/user/workspace/.../​.secret/hf_token`) — per directive, **no other path**.

---

## Method

All writes use the founder-token `huggingface_hub.HfApi` directly (not git-over-HTTP):

```python
from huggingface_hub import HfApi
from pathlib import Path
tok = Path(".../.secret/hf_token").read_text().strip()
api = HfApi(token=tok)
api.upload_folder(folder_path="/home/user/workspace/szl_hatun_mcp",
                  repo_id="SZLHOLDINGS/hatun-mcp", repo_type="space",
                  ignore_patterns=["*.pem", ".keys*", "__pycache__", ".git*", ".pytest_cache"])
```

The `.pem` private key and `.keys_DO_NOT_COMMIT.pem` were **excluded** from upload. Only the **public** key
`PUBKEY_szlholdings-ec-p256.pem` is published (also served at `/pubkey`).

---

## Commit log

| Commit | Description |
|--------|-------------|
| `464a6019` | Initial Space — Dockerfile, 16-tool server, governance, clients, server card |
| `043dfe0e` | Stateless-HTTP fix: `FastMCP(stateless_http=True, json_response=True)` — required for the HF reverse proxy |

## Space secret

- `HATUN_MCP_SIGNING_KEY` set on the Space = the **production ECDSA P-256 private PEM**
  (generated locally at `/tmp/hatun_space_signing_key.pem`; corresponding public key committed as
  `PUBKEY_szlholdings-ec-p256.pem`). The private key was set via the Space secrets API only — **never committed**.
- Leak check: `git log -p` of the published tree and the HF file listing confirm **no private key material** in
  either GitHub or HF. Verified.

---

## Live endpoint verification (all 200)

| Endpoint | Result |
|----------|--------|
| `GET /healthz` | `{"status":"ok","service":"hatun-mcp","chain_verified":true,"signer_mode":"ECDSA-P256","protocol_revision":"2025-06-18"}` |
| `GET /` | index page (200) |
| `GET /.well-known/mcp/server-card.json` | **16 tools**, locked doctrine 749/14/163 |
| `GET /pubkey` | ECDSA P-256 public key PEM |
| `GET /sse/` | 200, `content-type: text/event-stream` (legacy transport for the founder-requested `…/sse` URL) |
| `POST /mcp/` | stateless JSON-RPC `initialize` → `protocolVersion 2025-06-18`, `serverInfo.name = hatun-mcp` |

### Runtime stage at push time
`RUNNING` (Docker build → app started on port 7860). Confirmed via
`GET https://huggingface.co/api/spaces/SZLHOLDINGS/hatun-mcp` runtime stage.

---

## Known transport note (honest)

The official SDK **streamable-http client** can hang / 400 on the streaming **GET** handshake when proxied through
`*.hf.space`. The **raw stateless POST** to `/mcp/` works — which is exactly how `mcp-remote` and Cursor connect
in practice. The legacy `/sse/` endpoint is also served for older clients. This is a known proxy interaction,
not a server defect ([python-sdk issue #713](https://github.com/modelcontextprotocol/python-sdk/issues/713)).

Local-only `421 Misdirected Request` on `127.0.0.1` is host-pinning; set `HATUN_MCP_ALLOWED_HOSTS=*` for local dev.
The Space already allows `*.hf.space`.
