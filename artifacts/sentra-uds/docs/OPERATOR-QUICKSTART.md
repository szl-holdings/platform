# Sentra.UDS — Operator Quickstart (v0.1.0)

```bash
# 1. Download verification assets
BASE=https://github.com/szl-holdings/sentra/releases/download/uds-v0.1.0
curl -fsSLO $BASE/sentra-uds-0.1.0.tar.zst
curl -fsSLO $BASE/sentra-uds-0.1.0.tar.zst.sha256
curl -fsSLO $BASE/sentra-uds-0.1.0.tar.zst.sig
curl -fsSLO $BASE/sentra-uds-dev.pub

# 2. Verify
sha256sum -c sentra-uds-0.1.0.tar.zst.sha256
cosign verify-blob \
  --key sentra-uds-dev.pub \
  --signature sentra-uds-0.1.0.tar.zst.sig \
  sentra-uds-0.1.0.tar.zst

# 3. Inspect
zarf package inspect definition sentra-uds-0.1.0.tar.zst
zarf package inspect sbom       sentra-uds-0.1.0.tar.zst --output ./sbom-out

# 4. Run the 30-second doctrine demo
curl -fsSLO $BASE/doctrine-demo.mjs
zstd -d sentra-uds-0.1.0.tar.zst -o pkg.tar
mkdir staged && tar -xf pkg.tar -C staged
for c in staged/components/*.tar; do tar -xf "$c" -C staged; done
node doctrine-demo.mjs staged/sentra-core/files/0/lib
```

Expected: every pillar reports `PASS`, including the demonstration that
offensive action classes (`attack`, `exploit`, `ddos`, `hack_back`,
`offensive_recon`, `implant`) throw at the boundary; ending with a live
5-row verdict table where in-scope assets `ALLOW` and out-of-scope or
offensive requests `BLOCK`.
