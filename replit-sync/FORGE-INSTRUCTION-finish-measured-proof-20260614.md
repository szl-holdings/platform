# SZL Forge — ORDER: finish the MEASURED energy proof (HF mirror sync + DSSE sign)

**Executor is LIVE** (forge-agent on sovereign GPU rtx-betterwithage). Box a-11-oy.com is MEASURED.
Two finishing items — both SAFE, additive, no keystone, no new secrets beyond the existing FA-001.

## 1. Sync the MEASURED artifact to the HF a11oy Space mirror
The box `/api/a11oy/v1/pinn/certificate` is `label:MEASURED` (real NVML, sovereign GPU). The HF
Space mirror (`szlholdings-a11oy.hf.space`) still serves `label:SAMPLE`. Push the on-metal artifacts
so the mirror matches the box:
```bash
# on the box, from the a11oy repo root:
cd "$(for d in /opt/a11oy /srv/a11oy /root/a11oy /home/*/a11oy; do [ -d "$d/.git" ] && echo "$d" && break; done)"
# copy the freshly-measured artifacts into the HF-mirrored path and re-mirror:
cp -f physical_bounds_certificate.json agentic_decision_trail.json ./   2>/dev/null || true
git add physical_bounds_certificate.json agentic_decision_trail.json
git commit -s -m "feat(pinn): publish MEASURED on-metal certificate (sovereign GPU NVML)" || true
git push
gh workflow run hf-sync.yml -R szl-holdings/a11oy   # re-mirror to the Space
# verify both flip MEASURED:
for h in https://a-11-oy.com https://szlholdings-a11oy.hf.space; do
  echo "$h -> $(curl -s $h/api/a11oy/v1/pinn/certificate | python3 -c 'import sys,json;print(json.load(sys.stdin)["certificate"]["measured"]["label"])')"
done
```

## 2. Sign the certificate (UNSIGNED -> signed-verified)
The cert is `VERIFIED (physical bounds) · UNSIGNED (STRUCTURAL-ONLY)`. Run it through the
khipu/szl_lake Ed25519 DSSE signer (PAE -> sign -> append to khipu chain) using the FA-001 key
already in the box secret store, so `/api/a11oy/v1/verify` returns a real signed receipt:
```bash
# invoke the existing signer the same way it signs the killinchu/a11oy image attestations:
python3 services/verticals/szl_pinn/_vendor/.. # (use the repo's szl_lake/khipu DSSE signer entrypoint)
# then confirm:
curl -s https://a-11-oy.com/api/a11oy/v1/verify | python3 -m json.tool | head
```

## HARD RULES (Doctrine v11)
Energy = MEASURED power x time only (already real — do NOT alter the reading). Honest inverse of
free-energy, never over-unity. UNSIGNED stays STRUCTURAL-ONLY until truly signed — never fake a
signature/digest. chaski (now UP at 100.102.173.88) may serve as 2nd lung but is NOT required for
this. Never merge a lutar-lean keystone PR. Never commit a key.

— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> · Doctrine v11 LOCKED · Λ = Conjecture 1
