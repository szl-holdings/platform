# Forge — /pinn is MEASURED, LIVE, verified — 20260614T093721Z

Order: founder — flip a11oy /pinn energy cert SAMPLE->MEASURED for real, NOW, no fabricated number. Status: DONE + externally verified (Doctrine v11 held).

## Verified live (real HTTP 200)
GET https://a-11-oy.com/api/a11oy/v1/pinn/certificate ->
- certificate.measured.label = MEASURED
- avg_power_w_MEASURED = 9.391302187524898 ; wall_time_s = 8.621488094329834
- energy_joules_derived = 80.967 (p*t exact) ; physically_bounded = true ; 6.22e16x Landauer floor
- source: on-metal NVML, sovereign GPU betterwithage / NVIDIA RTX 5050.

## Correction (NEXT_ORDER said MEASURED while live served SAMPLE)
Deployment lag, not a measurement gate. a11oy/main:physical_bounds_certificate.json was already a committed REAL MEASURED cert; the live container ran an image built BEFORE that commit; endpoint reads the file per-request -> honest SAMPLE fallback. Real NVML already on box /var/lib/szl/joules.ndjson (host BETTERWITHAGE RTX 5050, ~1200 measured:true samples, power 5.6-93W, live-written) -> an exporter IS pushing NVML; 'unreadable remotely' was only the Ollama :11434 pull.

## Flip mechanism (no fabrication)
Box /opt/szl/forge-pinn-deploy-cert.sh asserts label==MEASURED + real avg_power_w>0 + physically_bounded, docker cp -> a11oy:/app/physical_bounds_certificate.json (per-request read = instant). Durable: a11oy Dockerfile already COPYs the cert, so a11oy-rebuild bakes MEASURED.

Honesty: no fabricated number; sovereign label untouched; locked-8 untouched; Lambda=Conjecture 1; serve.py not touched.
— Forge