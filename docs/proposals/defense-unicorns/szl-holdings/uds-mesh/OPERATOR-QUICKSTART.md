# szl-mesh — Operator Quickstart

Five commands. No build step. Assumes `uds-cli >= v0.27.4`, `zarf >= v0.49.1`, `cosign >= v2.4.1`, and a Kubernetes context.

## 1. Download

Grab the release assets:

```
szl-mesh-uds-0.1.0.tar.zst
szl-mesh-uds-0.1.0.tar.zst.sha256
szl-mesh-uds-0.1.0.tar.zst.sig
szl-mesh-uds-0.1.0.tar.zst.cert
```

## 2. Verify integrity

```bash
sha256sum -c szl-mesh-uds-0.1.0.tar.zst.sha256
```

## 3. Verify signature (cosign keyless, sigstore)

```bash
cosign verify-blob \
  --certificate szl-mesh-uds-0.1.0.tar.zst.cert \
  --signature   szl-mesh-uds-0.1.0.tar.zst.sig \
  --certificate-identity-regexp "^https://github.com/szl-holdings/" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  szl-mesh-uds-0.1.0.tar.zst
```

## 4. Inspect the bundle (offline)

```bash
uds bundle inspect szl-mesh-uds-0.1.0.tar.zst
```

The bundle ships its hash-chained `attestations.jsonl` at
`/uds-bundle/attestations.jsonl` per §05 Fix A — verifiable without a
registry round-trip.

## 5. Deploy

```bash
uds bundle deploy szl-mesh-uds-0.1.0.tar.zst --confirm
```

Lands three namespaces: `a11oy`, `sentra`, `amaru`. Wait for
`Available`:

```bash
for ns in a11oy sentra amaru; do
  kubectl -n "$ns" wait --for=condition=Available --all deployments --timeout=300s
done
```

## Rollback

```bash
uds bundle remove szl-mesh-uds-0.1.0.tar.zst --confirm
```
