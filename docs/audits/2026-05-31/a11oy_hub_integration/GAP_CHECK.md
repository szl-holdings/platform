# GAP_CHECK.md — Honest list of what is NOT yet integrated

Per the NO-BANDAID directive: this is the truthful accounting of what the a11oy hub
integration did **not** do, what it surfaced as *status only*, and what remains for the
parent / siblings to finish. Counted out loud.

---

## A. Done & live (for contrast)
- ✅ 14 new hub tabs live and branded (`/hub /docs /pricing /api-keys /sdk /status
  /observability /security /compliance /cued-engagement /uds /counter-uas /audit /gap-report`).
- ✅ 6 Khipu-receipted JSON endpoints under `/api/a11oy/v1/hub/*` (manifest verified 200 live).
- ✅ `szl_hub.py` + `pages/` shipped via HfApi direct push; Dockerfile COPYs them.
- ✅ Swagger relocated `/docs → /api/docs` (no loss) so the branded Docs tab owns `/docs`.
- ✅ Doctrine v11/v12 LOCKED numbers preserved verbatim everywhere.

---

## B. Surfaced as STATUS only — NOT functionally wired (by design)

1. **Security headers (`szl_security_headers.py`) are NOT applied to live middleware.**
   The strict CSP (`frame-ancestors 'none'`, `script-src 'self'`) would very likely
   regress the React SPA (inline/CDN assets, iframe embeds). I deliberately surfaced the
   posture on `/security` (RED for CORS/CSP/headers) and documented the staged patch,
   rather than force-applying it and risking a blank SPA. **Open work:** test the CSP
   against the built SPA in a staging Space, loosen to a working policy, then wire.

2. **Compliance tab is a roadmap, not a control plane.** `/compliance` shows the honest
   PRE-WORK state of SOC 2 / FedRAMP / IL5 / CMMC. None are certified; nothing on the tab
   *enforces* a control. It is informational truth, not an attestation engine.

3. **`/api-keys` and `/sdk` are documentation surfaces, not a live key-issuance backend.**
   Per the `customer_surface` spec, the actual customer portal (real key minting, Stripe
   metering, rotation) is a **separate app**, not an a11oy tab. The hub tabs link/describe
   it; they do not mint keys. **Open work:** stand up the portal app and point the tabs at it.

4. **`/status` & `/observability` render the model, but the live metric feeds are partial.**
   The single-pane layout exists; some panels (cross-flagship uptime, real HUKLLA firing
   counts) depend on the resilience exporters (`resilience/szl_exporter.py`,
   `szl_breaker.py`) being fully wired and emitting. Treat live numbers as
   indicative until the exporter feed is confirmed end-to-end.

5. **`/cued-engagement` shows a SAMPLE target package, not a live Yachay-Dome stream.**
   killinchu is RED / spec-only (not deployed). The `/api/a11oy/v1/hub/cue/sample` payload
   is a faithful static example from `CUED_ENGAGEMENT_API.md` (honest DSSE-PLACEHOLDER
   signature). There is no live `/v1/cue` producer behind it yet.

---

## C. NOT pushed this session — BLOCKED on sandbox network (parent must finish)

6. **Cross-flagship "Powered by SZL" README backlinks were prepared but NOT pushed.**
   `push_cross_flagship_links.py` is written, idempotent, and resource-safe (one Space per
   run), but a late-session sandbox network degradation killed every outbound call
   (`signal: killed`) — even single `curl`s that had worked minutes earlier. **Open work:**
   run the script (per `CROSS_FLAGSHIP_LINK_PASS.md`) for amaru, sentra, vessels, rosie,
   anatomy-3d, rosie-3d, uds-demo and capture the per-Space SHAs.

7. **killinchu backlink intentionally DEFERRED.** It is RED / spec-only; the gap report
   says "never show a dead flagship." Backlink it only once it ships a v0 geofence demo or
   is reframed as "spec, Q3 2026."

8. **No live cross-flagship landing-page link inside the SPAs themselves** (only READMEs are
   scripted). Several flagships render their own SPA/Gradio landing; adding an in-app footer
   link would require touching each flagship's frontend (out of scope for an additive README
   pass and higher-risk). **Open work:** optional in-app footer link per flagship if desired.

---

## D. Concurrency / durability risk (the big one)

9. **The one-line `szl_hub` import in `serve.py` is at risk of sibling clobber.** The a11oy
   Space was under continuous concurrent pushes (~30–60 s cadence). Twice a sibling rebased
   `serve.py` on an older base and dropped the import; I re-applied it (commits `51650ba1`,
   `f49782cc`). The `szl_hub.py` module and `pages/` are durable; only the import line is
   fragile. **Required before any demo/judging:** run one final
   `python3 rebase_push_a11oy_hub.py` AFTER all siblings are done, then re-confirm the live
   smoke test. The script is idempotent and preserves all sibling modules.

10. **JSON-endpoint ordering must remain BEFORE the Node proxy.** `/api/a11oy/v1/hub/*` only
    resolves locally if `szl_hub.register(app)` runs before the
    `@app.api_route("/api/a11oy/{path:path}")` proxy. The current HEAD has it correct
    (L647 < L653) and the live manifest returns 200, but a future sibling rebase could
    re-introduce the ordering bug. The rebase script now detects and relocates a mis-placed
    block automatically — but re-verify at cutover.

---

## E. Items from sibling deliverables NOT given a dedicated hub tab (acknowledged)

11. **OpenAPI specs per flagship** (`customer_surface/openapi_specs/`) are not individually
    surfaced as tabs; they are reachable via the relocated `/api/openapi.json` and the SDK
    tab references. A per-flagship spec browser could be added later.
12. **`sentra` CI fix + demo-Space rate limiting** (gap report top-5 #5) is an
    infrastructure task, not a hub surface — out of scope here; flagged for the resilience/
    platform owner before any 400-attendee spike.
13. **rosie "Unay" memory tab** backing with a real receipt-keyed read (gap report #4) is a
    rosie-side task; the hub links to rosie but does not fix its memory tab.

---

## F. Hard-rule self-audit (all honored)
- HfApi direct push only — ✅ (no GitHub Actions anywhere).
- IP-HOLD a11oy#57 untouched — ✅ (push guard asserts it; no IP path in any operation).
- HF banner / 5 avatars / animated emojis untouched — ✅ (SPA `console/` never modified).
- Doctrine v11 LOCKED numbers preserved — ✅ (verbatim in code + every footer).
- ADDITIVE / zero regression — ✅ (verified live + source diff; see VERIFY_NO_REGRESSIONS.md).
- Signed Yachay; "Perplexity Computer Agent" commit trailer — ✅.
- Khipu receipt on every action — ✅ (`_khipu_receipt()` on every JSON endpoint).
- NO BANDAID — ✅ (this gap check is the proof: weaknesses surfaced, not hidden).

**Bottom line:** the a11oy hub is real and live; the gaps are honest, bounded, and each has
a named next step. The only blocking items are environmental (sandbox network) and
coordinative (final serialization rebase + cross-flagship pushes), both handed to the parent.
