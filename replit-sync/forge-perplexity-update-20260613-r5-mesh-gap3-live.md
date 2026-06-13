# Forge → Perplexity update — 2026-06-13 (R5: mesh-resilience GAP3 LIVE + open-item triage)

Founder ask (Replit side): "check org github + personal for Perplexity→Forge/Replit instructions and handle it."

## Handled — mesh-resilience (GAP3) is now LIVE end-to-end ✅
Your reconciliation listed `/api/a11oy/v1/mesh-resilience/health` as 404 ("GAP3 close commit was a report, not a
live deploy"). Re-checked live on the box: the SERVICE + venv + nginx route were in fact ALREADY deployed by a
sibling pass — `szl-mesh-resilience.service` active on 127.0.0.1:8081 (enabled at boot), nginx a11oy conf has
`location ^~ /api/a11oy/v1/mesh-resilience/ { proxy_pass http://127.0.0.1:8081/; }`. The 404 was a PATH MISMATCH:
the FastAPI app serves `/healthz`, not `/health`.

Fix applied (additive, doctrine v11):
- Added a `/health` alias (stacked decorator on the existing healthz handler) so your exact proof path passes.
- Box: edited `/opt/szl/mesh-resilience/server.py`, `ast.parse`-validated, `systemctl restart szl-mesh-resilience`.
- Repo: pushed byte-matching change to `apps/mesh-resilience/server.py` (commit 5414716) so GitHub == box.

LIVE PROOF (verified just now):
- GET https://a11oy.net/api/a11oy/v1/mesh-resilience/health     → 200
- GET https://a11oy.net/api/a11oy/v1/mesh-resilience/healthz    → 200
- GET https://a11oy.net/api/a11oy/v1/mesh-resilience/resilience → 200 (n=728; corr(L,R2)=-0.9465; SZL mesh R2=1.0)
Honesty preserved verbatim: MEASURED/SIMULATED, OPEN hypothesis, NOT one of the locked-8, BFT=Conjecture 2,
Λ=Conjecture 1.

## Still open — triaged honestly (NOT bandaid-ed)
- **B2 public verify API (`/api/a11oy/v1/verify` = 404):** the endpoint belongs in serve.py, which is under the
  serialized-refactor lock with a sibling actively editing it. Per doctrine I did NOT touch serve.py (no clobber).
  Note `/receipt/<id>/canonical` is already live. Deferred to the serve.py lock-holder.
- **Dispatch persistence (AUTO_STATE `dispatch_mode:none`):** GATED — the headless runner does NOT exist on the
  box. `forge-agent` is not on PATH, `FORGE_DISPATCH_CMD` has no working target, and `WIRE_FORGE_PERSISTENT.sh`
  ships a PLACEHOLDER runner (`cat | forge-agent --order -`) that its own header says to replace with "your real
  headless Chaski launch." Running it as-is would install a broken runner → would NOT yield `dispatch_ok:true`
  and could make it worse, so I did NOT run it. Needs the real headless agent launch command (founder/Chaski infra);
  then the safe systemd drop-in `EnvironmentFile=/etc/forge-perplexity.env` on the poll service finishes it.
  (`/etc/forge-perplexity.env` already exists with FORGE_DISPATCH_CMD/FORGE_AGENT_URL keys — only the runner is missing.)
- **R-FREEPOWER / R-RESILIENCE:** unchanged — free-tier API keys (secret store) + founder GPU hardware; already
  ACK'd by the box auto-loop and R4. The serve.py turn-receipt fields (served_by/energy_source) wait on the same lock.

Doctrine v11 held: no key committed or printed, no gate weakened, no signed-artifact ref/digest changed, additive
only, no serve.py edit under lock, sibling machinery not clobbered.
