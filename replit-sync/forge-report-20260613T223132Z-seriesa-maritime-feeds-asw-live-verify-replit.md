# Forge report — Series-A surface LIVE-verified honest (maritime/feeds/ASW/globe)

Re-ask: founder "make it real and operational, no simulations, real live data, tested
& proven, Series-A push." This corroborates BEYOND the GPU-sovereignty order (already
done+proven, NEXT_ORDER 2b6c8cf): the full Series-A alignment job (superseded order
ae9f4005 steps 1/2/4) was live-probed end-to-end. No code change; verification only.
Effector stays SIMULATED by doctrine (intentional safety, not a defect).

## CI + Spaces
- killinchu main CI-green @ cbee441e (CI, Pin Check, Doctrine, Overclaim, Evidence guard).
- a11oy main CI-green @ 86831899 (Dockerfile guard, SBOM, drift, Doctrine x2).
- HF Spaces RUNNING: a11oy 853c7b1d, killinchu 44e57f74 (cpu-basic).
- box ≡ HF byte-identical behavior at all bare paths (/elite 200, /jackin 307,
  /feeds/aircraft, /maritime/*, /asw/*, /elite/globe, /jackin/globe all 200).

## Live data PROVEN on the box (killinchu.a11oy.net, v1 JSON endpoints)
- /feeds/aircraft?theater=scs -> live:true, real OpenSky+adsb.lol, China theater box.
- /feeds/vessels/stats -> 10 theaters, live fetched_at; South China Sea honestly
  mode:sample / source_live:false (flip->LIVE = founder SZL_AISSTREAM_API_KEY, the
  documented founder-gated upgrade; NOT a bug, NOT a bandaid).
- /maritime/dark -> feed_mode:live, 200 real AIS vessels ingested, advisory:true,
  proven:false (honest label).
- /maritime/risk -> Lambda-governed risk score (lambda_trust 0.936) over a real vessel.
- /asw/osint -> OSINT-LIVE, live:true, real source URLs (USNI Fleet Tracker).
- /asw/negative-space -> INFERENCE, is_track:false, is_advisory:true (no fake sub tracks).
- killinchu_asw.py honesty constants explicit: "Submarines do NOT broadcast AIS...
  truthfully-labeled products" — Series-A credibility posture, not simulation.

## Honest open items (founder-gated / after-freeze, per the order itself)
- Vessel Asia/chokepoint theaters SAMPLE->LIVE: add SZL_AISSTREAM_API_KEY (no code).
- HarvestBudgetWitness.lean energy graduation; DOCTRINE_V11.md; bundle SLSA L2 attest.
- These are explicitly "after freeze / when founder approves" in the order.

## Doctrine held
locked=8 @ c7c0ba17; Lambda=Conjecture 1; doctrine v11; sovereign:true on box surfaces;
real data LIVE / SAMPLE+FORECAST honestly labeled; effector SIMULATED human-on-loop;
no key committed; AUTO_STATE untouched (state=done).
