# HATUN-MCP — Web Research / INSPIRATION

**Layer:** PURIQ v12 → Kallpa wires (new bridging element)
**Author:** Yachay (CTO authority) · Built by Perplexity Computer Agent
**Date:** 2026-06-01
**Phase 0 cap:** 45 min. Every claim below points to a primary source.

> Purpose: survey the MCP ecosystem leaders and the MCP-security literature, *take from them, innovate, evolve*, and feed the design of **HATUN-MCP** — the doctrine-aware MCP server that extends PURIQ governance (Yuyay-13 gate + HUKLLA tripwires + Khipu receipts + PURIQ master formula) to the world's MCP clients.

---

## 1. The protocol itself (what we must obey)

**MCP** (Model Context Protocol) is an open JSON-RPC 2.0 protocol for connecting LLM apps to external data and tools. Current protocol revision **2025-06-18** ([MCP spec 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)).

- **Stateful connections**, **server/client capability negotiation**, **JSON-RPC 2.0** message envelope.
- **Server primitives:** `Resources` (context/data), `Prompts` (templated workflows), `Tools` (functions the model executes). **Client primitives:** `Sampling`, `Roots`, `Elicitation` ([MCP spec 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)).
- The spec's **own trust principles** read like a charter for what we already do: *"Tools represent arbitrary code execution and must be treated with appropriate caution"*, *"Descriptions of tool behavior … should be considered untrusted, unless obtained from a trusted server"*, *"Hosts must obtain explicit user consent before invoking any tool"* ([MCP spec 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18)). **Hatun-MCP's answer to "is this a trusted server?" is the Khipu receipt + DSSE signature + PURIQ gate transparency.**

### Transports (we host over HTTP, support stdio for local)
- **stdio:** client launches server as subprocess; newline-delimited JSON-RPC over stdin/stdout; stderr for logs. MUST NOT write non-MCP to stdout ([MCP transports](https://modelcontextprotocol.io/docs/concepts/transports)).
- **Streamable HTTP** (replaces the older HTTP+SSE from `2024-11-05`): a **single MCP endpoint path** supporting `POST` and `GET`; server may stream via SSE. Example endpoint `https://example.com/mcp` ([MCP transports](https://modelcontextprotocol.io/docs/concepts/transports)).
- **Security requirements baked into the transport:** servers MUST validate the `Origin` header (DNS-rebinding defense); SHOULD bind localhost when local; SHOULD authenticate all connections; session IDs MUST be cryptographically secure (≥128-bit UUID/JWT/hash) and visible-ASCII only ([MCP transports](https://modelcontextprotocol.io/docs/concepts/transports)).
- **Protocol version header** `MCP-Protocol-Version: 2025-06-18` required on every HTTP request after init ([MCP transports](https://modelcontextprotocol.io/docs/concepts/transports)).
- **Backwards compat:** old HTTP+SSE transport used a `GET /sse` that returns an `endpoint` event, then `POST` to that endpoint. We expose **both** the modern `/mcp` Streamable HTTP endpoint and a legacy `/sse` endpoint so older clients (and the founder-requested SSE URL `…/sse`) work ([MCP transports](https://modelcontextprotocol.io/docs/concepts/transports)).

**Python SDK:** the official `mcp` package (installed v1.27.1 in this environment) ships a low-level `Server` plus the high-level `FastMCP`. FastMCP's `mcp.run(transport="http", host=..., port=...)` exposes the server at `http://host:port/mcp` and handles multiple simultaneous clients ([FastMCP running server](https://gofastmcp.com/deployment/running-server)).

---

## 2. The leaders — what exists, what we take

### Anthropic first-party / reference servers
The official `modelcontextprotocol/servers` repo ships **7 reference servers**: **Everything** (test), **Fetch**, **Filesystem**, **Git**, **Memory** (knowledge-graph), **Sequential Thinking**, **Time** — explicitly *"reference implementations … not production-ready"* ([modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)). A large set is **archived** (`servers-archived`): GitHub, GitLab, Postgres, Slack, Sentry, Puppeteer, Redis, SQLite, Google Drive/Maps, Brave, EverArt, AWS-KB — most now maintained by their vendors or replaced by official servers ([modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)).
- **Take:** the tool-surface granularity (one server = one capability domain, narrow tools). **Evolve:** Hatun-MCP is a *single* server fronting **all** SZL flagships, because our differentiation is *governance*, not a thin API wrapper. One gate, one receipt chain, every organ.
- **Contribution path:** the repo's README has a community/`ADDITIONAL.md` pointer and directs server discovery to the **MCP Registry**; third-party servers get listed via PR adding a bullet to the community list ([modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)). We will open such a PR.

### Cloudflare — remote MCP + OAuth
Cloudflare popularized **remote (hosted) MCP servers** with first-class OAuth: `addMcpServer()` returns an `authUrl` when auth is required; the agent presents it, the user authorizes, the connection completes ([Cloudflare OAuth MCP client](https://developers.cloudflare.com/agents/guides/oauth-mcp-client/); [Cloudflare MCP authorization](https://developers.cloudflare.com/agents/model-context-protocol/authorization/)).
- **Take:** auth-gated remote server is the production norm. **Evolve:** our auth is the SZL **API key** (cosign-signed, tamper-evident — see `customer_surface/API_KEY_SYSTEM.md`), surfaced as the `Hatun_MCP(client_id)` reputation factor in the PURIQ formula. **Default-decline if no key** (no anonymous tool calls).

### Smithery — the MCP registry / gateway (our distribution surface)
Smithery is the de-facto MCP registry + managed gateway. Publishing a **remote/hosted** server: go to `smithery.ai/new`, enter the **public HTTPS URL**, and Smithery's Gateway proxies to the upstream. Requirements: **Streamable HTTP transport** + **OAuth if auth required**. Smithery **scans** the server (`tools/list`) to extract metadata; if the scan is blocked (auth wall / WAF), publish a **static server card** at `/.well-known/mcp/server-card.json` with `serverInfo`, `authentication`, `tools[]` ([Smithery publish](https://smithery.ai/docs/build/publish)). CLI: `smithery mcp publish "https://…/mcp" -n @org/server --config-schema '{…}'` ([Smithery publish](https://smithery.ai/docs/build/publish)).
- **Take:** ship a `/.well-known/mcp/server-card.json` so Smithery (and any registry) can enumerate our 15 tools even behind the API-key wall. **Evolve:** our scan returns honest auth metadata (`oauth2`/`apiKey`) and the governance posture.
- **Note for the deploy agent:** Smithery's scanner is `SmitheryBot/1.0` from Cloudflare Workers; an unauthenticated request should return **401**, not 403, or the scan fails ([Smithery publish](https://smithery.ai/docs/build/publish)). HF Spaces don't bot-block by default, so the static card is the reliable path.

### Composio / Gram / xmcp — managed MCP infra
Composio runs a hosted **MCP Gateway** and 100s of managed integrations with `@composio/core`/`composio` SDKs; Gram and xmcp are URL-publishing hosts that work with Smithery ([Composio MCP gateway](https://composio.dev/mcp-gateway); [Composio hosted platforms](https://composio.dev/content/hosted-mcp-platforms); [Smithery publish](https://smithery.ai/docs/build/publish)).
- **Take:** the "gateway in front of many tools" pattern. **Evolve:** our gateway is a *governance* gateway — every proxied call is gated + receipted, which none of these provide.

### Block, Replit, Cursor/Anysphere, Sourcegraph Cody, Continue, Zed, Goose, Notion, Linear, Apollo, Inkeep
These are the **clients/hosts** (and some servers) Hatun-MCP must be addable to. The universal addition mechanism is a JSON config block (`mcpServers` map) for stdio, or a remote URL entry for HTTP/SSE. Claude Desktop uses `claude_desktop_config.json`; Cursor uses `.cursor/mcp.json` (project) or global MCP settings; Continue/Zed/Goose accept either a command (stdio) or a URL (SSE/HTTP). We ship copy-paste snippets for each in the quickstarts. (Mechanism confirmed by the transport spec's stdio/HTTP client behavior, [MCP transports](https://modelcontextprotocol.io/docs/concepts/transports).)

---

## 3. MCP security & governance literature — the threat model we govern against

This is the heart of our differentiation. The ecosystem now has a real security canon; **Hatun-MCP maps each PURIQ control to a named MCP threat.**

### OWASP MCP Top 10 (2025, beta; lead Vandana Verma Sehgal)
The **first official MCP security framework** ([OWASP MCP Top 10](https://owasp.org/www-project-mcp-top-10/); [Practical DevSecOps summary](https://www.practical-devsecops.com/owasp-mcp-top-10/)):

| ID | Risk | Hatun-MCP control |
|----|------|-------------------|
| MCP01 | Token Mismanagement & Secret Exposure | cosign-signed API keys; never store raw key; no secrets in tool output |
| MCP02 | Privilege Escalation via Scope Creep | per-flagship + read/write/admin scopes from key; 2-person Yuyay gate on state-changing tools |
| MCP03 | Tool Poisoning (rug-pull, schema poisoning, tool shadowing) | **tool descriptors hashed + DSSE-signed**; Khipu records descriptor hash; re-prompt on change |
| MCP04 | Supply-chain / dependency tampering | pinned deps, SBOM, reproducible HfApi-direct push (never CI), Apache-2.0 |
| MCP05 | Command Injection & Execution | no raw shell; parameterized backend calls; bounded action space (Bekenstein) |
| MCP06 | Intent Flow Subversion / prompt injection via payloads | Yuyay-13 gate treats tool input as **data not instructions**; HUKLLA T03 introspection-drift tripwire |
| MCP07 | Insufficient Auth/Authz | API-key required (default-decline anonymous); OAuth-style 401; scope enforcement |
| MCP08 | Lack of Audit & Telemetry | **Khipu receipt on every call (success AND failure)** — the entire point |
| MCP09 | Shadow MCP Servers | signed server card + DSSE responses let the client verify *this* is the real SZL server |
| MCP10 | Context Injection & Over-Sharing | per-session isolation; `governance_tier=sovereign` constrains data egress |

### NSA / CISA — MCP Security CSI
The NSA Cybersecurity Information Sheet on MCP warns that MCP environments invite **Arbitrary Code Execution** (CWE-77/78/94/95), that **semantic/tool poisoning is systemic not isolated**, and prescribes **intentional separation of data and processing**, **explicit trust boundaries between agents/plugins/models/users**, and that **dynamic tool discovery should be coupled with origin verification or authorization checks** ([NSA MCP Security CSI](https://www.nsa.gov/Portals/75/documents/Cybersecurity/CSI_MCP_SECURITY.pdf)).
- **This is a direct mandate for our design:** Hatun-MCP couples discovery with **origin verification** (signed server card) + **authorization** (API key → `Hatun_MCP(client_id)` factor). Trust boundary = the PURIQ gate.

### Academic papers
- **"Model Context Protocol Threat Modeling and …"** ([arXiv 2603.22489](https://arxiv.org/abs/2603.22489)): tool poisoning is the *most prevalent client-side* vuln; proposes a **multi-layered defense**: static metadata analysis, **model decision-path tracking**, behavioral anomaly detection, user transparency. → Our **PURIQ Gate Transparency** (refusals say *which* factor/tripwire fired) and **Cross-Tool Khipu Chaining** (decision-path tracking) are exactly this.
- **"MCP: Landscape, Security Threats, and Future Directions"** ([arXiv 2503.23278](https://arxiv.org/abs/2503.23278); [Hou et al. PDF](https://xinyi-hou.github.io/files/hou2025mcp_1.pdf)): taxonomy of 4 attacker types + 16 threat scenarios (tool poisoning, installer spoofing, unauthorized access), validated on real cases.

### Real CVEs (proof the threat is live)
- **MCPoison (CVE-2025-54136)** + **CurXecute (CVE-2025-54135)**: an attacker controlling an MCP server writes directives into JSON-Schema fields / tool descriptions that the agent feeds the model with full ambient authority — *tool poisoning is a supply-chain problem on the agent's context, fixed at the network/server layer, not the laptop* ([TrueFoundry tool-poisoning](https://www.truefoundry.com/blog/blog-mcp-tool-poisoning-gateway-defense); [Descope tool poisoning](https://www.descope.com/learn/post/mcp-tool-poisoning)).
- **Prompt Hijacking (CVE-2025-6515)** in `oatpp-mcp`: predictable/reused **session IDs** let an attacker hijack a victim's SSE stream — *use cryptographically secure ≥128-bit session IDs, reject mismatched event IDs* ([JFrog prompt hijacking](https://jfrog.com/blog/mcp-prompt-hijacking-vulnerability/)).
- **Mitigation we adopt directly:** Descope's gateway recommendations — *store cryptographic hashes of tool metadata/schemas, compare incoming against expected signatures, block changed metadata, sign all tool manifests* ([Descope](https://www.descope.com/learn/post/mcp-tool-poisoning)). This is **Receipt-Signed MCP Responses** (Frontier Innovation #1).

---

## 4. Synthesis — what Hatun-MCP takes, innovates, evolves

| Source | We take | We innovate / evolve |
|--------|---------|----------------------|
| MCP spec | Streamable HTTP + stdio, capability negotiation, server card | Add Khipu receipt + DSSE sig + gate-transparency to *every* response |
| Anthropic servers | narrow-tool granularity, reference-server clarity | one governed server fronting all 9 flagships |
| Cloudflare | remote+OAuth norm | cosign-signed API key → reputation factor `Hatun_MCP(client_id)` |
| Smithery | registry distribution, static server card | honest auth metadata + governance posture in the card |
| Composio gateway | gateway-in-front-of-many pattern | *governance* gateway: gate+receipt on every proxied call |
| OWASP MCP Top 10 | the threat catalog | one-to-one control mapping (table §3); refusals cite the OWASP class |
| NSA CSI | discovery+origin-verification mandate | signed server card couples discovery to origin verification |
| arXiv threat-modeling | decision-path tracking | Cross-Tool Khipu Chaining = verifiable reasoning chain |
| Tool-poisoning CVEs | hash-and-sign tool metadata | DSSE-signed tool descriptors recorded in Khipu |
| Prompt-hijacking CVE | crypto-secure session IDs | inherit MCP `Mcp-Session-Id` UUID4 + reject mismatches |

**Where it fits in our anatomy (CTO answer to the founder):** MCP is a transport/discovery protocol, not a decision organ. So Hatun-MCP is **not the heart** — the heart stays Yuyay-13. It belongs in the **WIRES (Kallpa)** as a *new bridging element* that carries PURIQ-governed signals **out to the world's agents**. The heart still decides; the wire now reaches every MCP client on Earth, and every signal on that wire is gated and receipted.

---

*Signed Yachay (CTO authority), 2026-06-01. Real protocol, real threat model, real distribution. No bandaid.*
