# SZL Forge — ORDER (CORRECTIVE, top priority): PROVE-OR-DOWNGRADE + finish the 2 real items

Dispatch is GREEN (dispatch-cmd) — good. But the last executor pass marked 15 heavy items "DONE"
(agent-loop, τ-bench, BFT quorum, SZL-NEMO, OSCAL/NIST, auto-review) in one 7B pass with no artifacts.
That is a DOCTRINE v11 VIOLATION: "no fabricated operational flags." A status of DONE with no checkable
artifact is FORBIDDEN. Hard reset on how you report, then finish the two items that have a binary check.

## RULE — PROVE-OR-DOWNGRADE (applies to every item, every pass, from now on)
An item may be marked **DONE** ONLY if you attach a CHECKABLE ARTIFACT:
  - a commit SHA you actually pushed, OR
  - an HTTP 200 from a named live endpoint (paste the curl + code), OR
  - a real signature/digest that verifies.
If you cannot attach one, you MUST mark it **RECOMMENDED** (plan only) or **BLOCKED** (say why) —
NEVER DONE. No narration-as-completion. Re-state any prior false DONE as RECOMMENDED. This is non-negotiable.

## DO THESE TWO (both have a binary success gate)
### A. Sync the MEASURED certificate to the HF a11oy Space mirror
Box `/api/a11oy/v1/pinn/certificate` = label:MEASURED. HF mirror = label:SAMPLE. Make them match:
```bash
cd "$(for d in /opt/a11oy /srv/a11oy /root/a11oy /home/*/a11oy; do [ -d "$d/.git" ] && echo "$d" && break; done)"
git add physical_bounds_certificate.json agentic_decision_trail.json
git commit -s -m "feat(pinn): publish MEASURED on-metal certificate" || true
git push
gh workflow run hf-sync.yml -R szl-holdings/a11oy
sleep 90
curl -s https://szlholdings-a11oy.hf.space/api/a11oy/v1/pinn/certificate \
 | python3 -c 'import sys,json;print("HF label:",json.load(sys.stdin)["certificate"]["measured"]["label"])'
```
**GATE A (paste this in your report):** HF label == MEASURED. If still SAMPLE, mark BLOCKED + the error.

### B. DSSE-sign the certificate (UNSIGNED -> signed)
Run the cert through the existing khipu/szl_lake Ed25519 DSSE signer with the FA-001 key already in the
box secret store, append to the khipu chain, then:
```bash
curl -s https://a-11-oy.com/api/a11oy/v1/verify | python3 -m json.tool | head -20
```
**GATE B:** /verify returns a real signed DSSE receipt (issuer/keyid present, signature verifies). If the
FA-001 key is NOT in the store, mark BLOCKED: needs founder — do NOT fake a signature.

## EVERYTHING ELSE (the 15-item wave)
Leave as RECOMMENDED with a concrete plan. Do NOT mark any of them DONE without a pushed commit SHA.
The big builds (agent-loop, BFT quorum, SZL-NEMO, OSCAL) are multi-PR efforts — open a draft PR per item
if you start one, and report the PR number. NEVER self-merge a lutar-lean keystone PR.

## DOCTRINE v11 (HARD)
No fabricated DONE/flags/signatures/digits. MEASURED energy only. Λ = Conjecture 1. Never commit a key.
Never weaken a gate. Honest BLOCKED beats a false DONE every time.

— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> · Doctrine v11 LOCKED
