# Forge → R-REVERSE-LOOP: honest GPU waste-heat recovery envelope LIVE — 2026-06-13

Founder order (NEXT_ORDER top): "jack the electricity, reverse-loop the semiconductors —
TEST NOW … add szl_energy_reverse_recovery_envelope_w + szl_gpu_temp_c to /metrics."

## VERDICT (honest)
The reverse-loop ENVELOPE CALCULATOR is LIVE and additive on the energy-harvest service
(:8082, NOT serve.py — locked). The **thermal INPUT is founder-gated**: the box is
CPU-only (no nvidia-smi) and the GPU node (betterwithage, Tailscale) exposes Ollama
:11434 ONLY — no NVML/nvidia-smi/node-exporter reachable. Per the order's rule ("if NVML
unavailable, say so — do not fake"), no GPU temp is fabricated.

## WHAT IS LIVE (verified just now, off-estate HTTP)
- GET https://a11oy.net/api/a11oy/v1/reverse-loop → 200
  measured=false, sovereign=false, joules_label=sample, thermal_source=null.
  Illustrative-only envelope (assumed 75C / 230W TDP): recoverable_w=13.8 W,
  carnot_ceiling_frac=0.1522, applied_recovery_eff=0.06 — labelled
  "ILLUSTRATIVE — assumed inputs, NOT measured, NOT charted".
- GET https://a11oy.net/api/a11oy/v1/harvest/metrics carries
  `szl_energy_reverse_recovery_available 0` (real thermal absent). `szl_gpu_temp_c` and
  `szl_energy_reverse_recovery_envelope_w` are INTENTIONALLY OMITTED until a real read —
  never charted as fabricated data. When a thermal source is reachable they auto-appear.

## PHYSICS / HONESTY
- recoverable_w = min(Seebeck eff ~6% of thermal flux [ZT~1, GPU-WHR study], Carnot
  ceiling 1 - T_amb/T_hot) × P_draw. Recovery can NEVER exceed Carnot; bounded below by
  the Landauer floor (#240) — you recover wasted heat, never beat the floor. No
  free-energy, no over-unity: Seebeck + reverse-recovery RECYCLE already-spent energy.
- Adiabatic/reversible-CMOS reverse-recovery of the chip's OWN switching energy
  (Vaire "Ice River" 22nm, 76-90% recovery) needs a resonator — chip hardware. Software
  CANNOT do it on the non-adiabatic RTX 5000. Flagged ROADMAP, never claimed of our GPU.

## TO CLOSE THE MEASUREMENT (founder hardware step)
Run on the GPU node: `nvidia-smi --query-gpu=temperature.gpu,power.draw,power.limit
--format=csv` — or expose a tiny JSON at GPU_THERMAL_URL ({temp_c,power_w}). The metrics
+ envelope then go MEASURED automatically (set GPU_THERMAL_URL in the service env).

## ALIGNMENT
- Box: /opt/szl/energy-harvest/{reverse.py,server.py}, systemctl restart, nginx
  REVERSE-LOOP-PROXY reloaded. GitHub: platform apps/energy-harvest/{reverse.py,server.py}
  byte-match box. Doctrine v11: locked-8 untouched, Λ=Conjecture 1, no key, no PR merge.
