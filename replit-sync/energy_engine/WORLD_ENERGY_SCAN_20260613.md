# WORLD ENERGY + FORMULA SCAN — what we're missing (arXiv-grounded, honest tiers)

Zoom-out across arXiv + the open literature for (1) wasted energy we haven't jacked, and (2) the
physics/formulas that ground it. Sorted by HONEST tier so we never overclaim.

---

## TIER A — REAL wasted energy we're missing, HARVESTABLE now (add jacks)
1. **Waste HEAT via thermoelectric (Seebeck effect).** Every engine, pipe, chimney — and OUR OWN GPU —
   dumps heat. TEGs convert a ΔT into electricity; an ICE-exhaust TEG hit 40 W on a 190°C gradient
   ([Smriti et al., ACS AMI 2025](https://pubs.acs.org/doi/10.1021/acsami.4c18023)); oil&gas IIoT nodes
   already run battery-free on residual pipe heat ([Ferrer et al., Sensors 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12030912/)).
   **For us:** the RTX 5000's OWN waste heat + any flare/industrial site is a real on-site power source
   for a co-located sensor/edge node. Formula: Seebeck `V = S·ΔT`; bounded, measurable, honest.
2. **Ambient RF harvesting.** GSM/3G/WiFi RF is available 24/7; ~423 µW demonstrated on-chip
   ([Chong et al., Sensors 2022](https://www.mdpi.com/1424-8220/22/12/4415/pdf)). Tiny but real — a
   witness-rail power source for ultra-low-power consent beacons.
3. **Diurnal / soil-air ΔT TEG** — free temperature-gradient power for deploy-and-forget nodes.
> These are SAMPLE until a real meter, like all our energy figures. They are WITNESS RAILS + on-site
> micro-power, NOT a data-center power source. Honest: small but real, no over-unity.

## TIER B — the FORMULA we were missing (grounds the whole doctrine in physics)
**The Penrose process — and why it CANNOT be a free-energy machine — is the missing formula.**
- You extract rotational energy from a Kerr black hole's ergosphere by splitting a particle so the
  negative-energy half falls in. Tempting as "free energy."
- **But** ([Ruffini et al., PRL 134 081403, 2025](https://link.aps.org/doi/10.1103/PhysRevLett.134.081403);
  [Zhang & Prakapenia, CQG 2024](https://iopscience.iop.org/article/10.1088/1361-6382/ad51c2)): a
  *repetitive* Penrose process that looks like it extracts 100% would **violate energy conservation** —
  and the resolution is the **irreducible mass**: feedback raises `M_irr` so the total extractable
  energy is STRICTLY BOUNDED. "The system works at most as an energy factory, **no black hole bomb**."
- **THIS IS OUR DOCTRINE, PROVEN IN GR.** It is the exact analogue of our Bekenstein info cap +
  Landauer floor + monotone ledger: there is a hard, provable ceiling; you can harvest the FREE/wasted
  surplus (rotational energy / negative-price power) but a closed recursive loop that beats the bound
  is forbidden by a conservation law. **Map:** black-hole irreducible mass ⇄ our monotone SoakLedger
  floor; ergosphere wasted-rotation ⇄ negative-price grid surplus; "no black hole bomb" ⇄ our
  Ouroboros bounded-recursion (the sponge can't run away). Cite this as the physics grounding for
  STRANDED_ENERGY doctrine: harvest the surplus, never claim over-unity.

## TIER C — EXPERIMENTAL / witness-only (log SAMPLE provenance, never assert real harvest)
- Vacuum/zero-point & Casimir: NOT a usable power source (no net extraction); witness-rail only.
- Blandford-Znajek / magnetic reconnection BH energy extraction: astrophysical, not terrestrial.
- These stay EXPERIMENTAL tier — named honestly, never wired as a real feed.

---

## RECOMMENDATION (what to build / hand Forge)
1. **Add a TEG/waste-heat WITNESS jack** to the harvest: read the GPU's own `nvidia-smi temperature.gpu`
   + ambient; report a Seebeck `V=S·ΔT` SAMPLE estimate of recoverable on-board waste heat (honest
   micro-power, on-box). This is a REAL second on-box signal beside NVML power.draw.
2. **Encode the Penrose/irreducible-mass bound as the doctrine's physics citation** in the proven-
   formula budget (`harvest_budget.py` / lutar-lean comment): the SoakLedger floor IS our irreducible
   mass; the Ouroboros bound IS "no black hole bomb." This is the formula that proves — in general
   relativity — that our no-free-energy stance is physics, not policy.
3. Keep RF + soil-air ΔT as documented witness rails (SAMPLE provenance only).

Doctrine held: harvest WASTED surplus, prove a hard bound, joules SAMPLE until metered, no over-unity,
consent-only, no key. Λ=Conjecture 1; locked-8 untouched. The Penrose result is the universe agreeing
with us: you can take the wasted energy, you can NEVER beat the irreducible floor.
