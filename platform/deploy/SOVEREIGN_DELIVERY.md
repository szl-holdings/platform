# Sovereign Delivery Pattern — SZL Air-Gap Package & Deploy

<!--
  SPDX-License-Identifier: Apache-2.0
  Copyright 2026 SZL Holdings

  This document captures the sovereign air-gap packaging and delivery patterns
  developed across the SZL Holdings deployment practice. Patterns were
  reimplemented in SZL terminology from first principles. Structural inspiration
  acknowledged in comments; no third-party prose or code was copied verbatim.
  See ATTRIBUTION section.
-->

> **Status:** LIVE — ingested from `szl-uds-deployment` and `uds-bundles` practice.
> **Doctrine:** v11 LOCKED 749/14/163. Λ = Conjecture 1 (NOT a theorem).
> **Signed-off-by:** Stephen Lutar <stephenlutar2@gmail.com>

---

## Overview

SZL organs (a11oy, killinchu, sentra, amaru, yupana) are shipped as
**sovereign delivery packages** — self-contained, cryptographically-signed
tarballs that carry every image, manifest, and Helm chart needed to stand up
a full organ on any k8s cluster with no outbound network access after
the bundle is built.

This document is the org-canonical reference for the **four reusable patterns**
that make that work. They were developed over the SZL Warhacker deployment
practice and are now captured here so they live in the org regardless of
which repo-level scaffolding exists.

---

## Pattern 1 — Declarative Package Manifest (`szl-package.yaml`)

Every deployable organ declares itself in a **package manifest** — a single
YAML file that names the organ, pins every container image to a digest, and
declares the Helm chart or manifest set to render at deploy time.

```yaml
# szl-package.yaml — canonical pattern (reimplemented from SZL practice)
# yaml-language-server: $schema=https://raw.githubusercontent.com/zarf-dev/zarf/main/zarf.schema.json
kind: ZarfPackageConfig           # use the declarative packager's schema
metadata:
  name: szl-<organ>               # SZL org name, no external branding
  version: "0.N.0"
  description: "<Organ> — <one-line function description>"
  url: "https://szlholdings.com"
  authors: "SZL Holdings <eng@szlholdings.com>"

variables:
  - name: DOMAIN
    description: "Cluster domain — must match the mesh DOMAIN variable"
    default: "szl.local"
  - name: REPLICAS
    description: "Replica count"
    default: "1"

components:
  - name: szl-<organ>-namespace
    required: true
    manifests:
      - name: ns
        namespace: szl-<organ>
        files:
          - manifests/namespace.yaml         # labels: szl.io/organ, istio.io/dataplane-mode

  - name: szl-<organ>
    required: true
    charts:
      - name: <organ>
        namespace: szl-<organ>
        version: 0.N.0
        localPath: ../../charts/<organ>      # chart lives in charts/<organ>/
        valuesFiles:
          - ../../charts/<organ>/values.yaml
        variables:
          - name: DOMAIN
            path: global.domain
    images:
      # DIGEST-PIN the image — never trust a mutable tag alone.
      # Re-pin after every CI rebuild with: scripts/pin-organ-image-digest.sh
      - ghcr.io/szl-holdings/<organ>:uds-vN.N.N@sha256:<digest>
    actions:
      onDeploy:
        after:
          - description: "Wait for <organ> Deployment to be Available"
            maxTotalSeconds: 180
            wait:
              cluster:
                kind: Deployment
                name: <organ>
                namespace: szl-<organ>
                condition: Available
```

**Key invariants:**
- Every image reference carries a `@sha256:<digest>` pin. The mutable tag is
  kept for readability only; the digest is what actually constrains what runs.
- The namespace manifest sets `istio.io/dataplane-mode: ambient` so the organ
  automatically joins the mTLS mesh on clusters running Istio in ambient mode.
- The chart's `values.yaml` provides a `global.domain` key — the package
  manifest's variable binding threads the cluster DOMAIN through to it.

---

## Pattern 2 — Bundle Composition (`szl-bundle.yaml`)

Multiple organ packages are composed into a single **delivery bundle** —
one tarball that deploys the full product stack with one command.

```yaml
# szl-bundle.yaml — canonical bundle pattern
kind: UDSBundle
metadata:
  name: szl-<product>          # e.g. szl-a11oy, szl-killinchu
  description: "SZL <Product> — full air-gap deployable bundle"
  version: "0.N.0"
  architecture: amd64

packages:
  # 1. Cluster bootstrapper — brings up k8s core infra + service mesh
  - name: init
    repository: ghcr.io/zarf-dev/packages/init
    ref: "X.Y.Z"

  # 2. Service mesh + policy enforcement layer
  # NOTE: uds-core is AGPL-3.0; it is used as a BINARY DEPENDENCY (the
  # deployed OCI artifact). No uds-core source is vendored here.
  - name: uds-core
    repository: ghcr.io/defenseunicorns/packages/uds/core
    ref: "X.Y.Z-upstream"         # flavor: upstream | registry1 | unicorn

  # 3. SZL organs — each is a separately-built + cosign-signed package
  - name: szl-receipts            # governance receipt chain authority
    path: ../../                  # local build path for dev; OCI ref for prod
    ref: "0.N.0"
    overrides:
      szl-receipts:
        szl-receipts:
          variables:
            - name: DOMAIN
              value: "###ZARF_VAR_DOMAIN###"
            - name: RECEIPTS_REPLICAS
              value: "###ZARF_VAR_REPLICAS###"

  - name: szl-<organ-a>
    path: ../../packages/<organ-a>
    ref: "0.N.0"
    overrides:
      szl-<organ-a>:
        <organ-a>:
          variables:
            - name: DOMAIN
              value: "###ZARF_VAR_DOMAIN###"

  # Add further organs in dependency order (receipts first — organs wire to it)

variables:
  - name: DOMAIN
    default: "szl.local"
  - name: REPLICAS
    default: "1"
```

**Deploy (connected):**
```bash
uds deploy oci://ghcr.io/szl-holdings/szl-<product>-bundle:0.N.0 --confirm
```

**Deploy (air-gap):**
```bash
# On a connected machine: build + save
uds bundle create szl-bundle.yaml --architecture amd64 --confirm --output .

# Transfer bundle tarball to air-gapped node, then:
uds deploy uds-bundle-szl-<product>-amd64-0.N.0.tar.zst --confirm
```

---

## Pattern 3 — Cosign-Signed Artifact Delivery

Every OCI artifact in the SZL supply chain is signed at publish time using
**keyless Sigstore** (GitHub OIDC → Fulcio CA → Rekor transparency log).
No org-managed key material is required — the identity is the GitHub Actions
workflow that built the artifact.

### Signing (in CI — `.github/workflows/publish.yml`)

```yaml
- uses: sigstore/cosign-installer@<pinned-sha>
- name: Sign package
  run: |
    cosign sign --yes \
      ghcr.io/szl-holdings/${ORGAN}:${TAG}
  env:
    COSIGN_EXPERIMENTAL: "1"
```

### Verification (before deploy or in Kyverno)

```bash
cosign verify \
  --certificate-identity-regexp \
    "^https://github.com/szl-holdings/${ORGAN}/.github/workflows/.*" \
  --certificate-oidc-issuer \
    "https://token.actions.githubusercontent.com" \
  ghcr.io/szl-holdings/${ORGAN}:${TAG}
```

### Kyverno ClusterPolicy (cluster-side enforcement)

```yaml
# policies/verify-build-provenance.yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: verify-szl-build-provenance
  annotations:
    policies.kyverno.io/title: "Verify SZL build provenance"
    policies.kyverno.io/severity: high
spec:
  validationFailureAction: enforce
  rules:
    - name: verify-provenance
      match:
        any:
          - resources:
              kinds: [Pod]
              namespaces: [szl-a11oy, szl-killinchu, szl-sentra, szl-amaru, szl-yupana]
      verifyImages:
        - imageReferences: ["ghcr.io/szl-holdings/*"]
          required: true
          mutateDigest: true
          attestors:
            - count: 1
              entries:
                - keyless:
                    subject: "https://github.com/szl-holdings/*/.github/workflows/*"
                    issuer: "https://token.actions.githubusercontent.com"
                    rekor:
                      url: "https://rekor.sigstore.dev"
```

### SBOM per artifact

Each published image also gets a CycloneDX + SPDX SBOM, generated and
attached via the `sbom` workflow step:

```bash
# Generate during package create (built into the packager)
zarf package create . --sbom-out sbom/ --confirm

# Attach to OCI image post-publish
cosign attach sbom --sbom sbom/<organ>.cyclonedx.json \
  ghcr.io/szl-holdings/<organ>:${TAG}
```

SBOMs live in `sbom/<organ>.{cdx,spdx}.json` in every organ's source repo
and are embedded in the Zarf tarball so the air-gap node has them without
a network call.

---

## Pattern 4 — Admission Receipt Gate (Pepr policy)

A **Pepr** admission webhook fires on every Deployment/Job `CREATE`/`UPDATE`
in any SZL namespace. It:
1. Builds a **DSSE envelope** — a signed receipt identifying the resource,
   its spec hash, and the cluster UID.
2. Signs it with the organ's **Ed25519 key** (provisioned as a Kubernetes
   Secret before first deploy).
3. Posts the receipt to the `szl-receipts` server via the mesh.
4. Annotates the resource with the receipt SHA-256 so the receipt is
   permanently associated with the deployed workload.

```typescript
// policies/szl-receipt-on-admission.ts
// Copyright 2026 SZL Holdings — Apache-2.0
// Pattern: DSSE-wrapped receipt emitted for every admission event.

import { Capability, a, Log } from "pepr";
import * as crypto from "crypto";
import * as fs from "fs";

const ORGAN_NAMESPACES = [
  "szl-a11oy", "szl-killinchu", "szl-sentra", "szl-amaru", "szl-yupana",
];

// Load Ed25519 private key (PKCS#8 PEM) from mounted Secret.
// Secret 'szl-receipts-ed25519' must be created before deploy:
//   bash scripts/generate-receipt-key.sh
function loadPrivKey(): crypto.KeyObject | null {
  const keyPath = process.env.SZL_RECEIPT_KEY_PATH ?? "/etc/szl-receipts-key/key.priv";
  if (!fs.existsSync(keyPath)) return null;
  const pem = Buffer.from(fs.readFileSync(keyPath).toString(), "base64").toString();
  return crypto.createPrivateKey({ key: pem, format: "pem" });
}

function buildReceipt(ns: string, kind: string, name: string, specJson: string, op: string) {
  return {
    _type: "https://szlholdings.com/receipt/v1",
    subject: `${ns}/${kind}/${name}`,
    specHash: crypto.createHash("sha256").update(specJson).digest("hex"),
    timestamp: new Date().toISOString(),
    admissionOp: op,
  };
}

function signDsse(payload: object, privKey: crypto.KeyObject): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const payloadType = "application/vnd.szl.receipt.v1+json";
  // DSSE Pre-Authentication Encoding (PAE)
  const pae = `DSSEv1 ${payloadType.length} ${payloadType} ${payloadB64.length} ${payloadB64}`;
  const sig = crypto.sign(null, Buffer.from(pae), privKey).toString("base64url");
  return JSON.stringify({
    payload: payloadB64,
    payloadType,
    signatures: [{ keyid: "szl-receipts-ed25519", sig }],
  });
}

export const SzlReceiptOnAdmission = new Capability({
  name: "szl-receipt-on-admission",
  description: "Emit a DSSE receipt and annotate every organ Deployment/Job at admission time.",
});

const { When } = SzlReceiptOnAdmission;

When(a.Deployment)
  .IsCreatedOrUpdated()
  .InNamespace(...ORGAN_NAMESPACES)
  .Mutate(async (dp) => {
    const privKey = loadPrivKey();
    if (!privKey) {
      Log.warn("szl-receipt-on-admission: no Ed25519 key mounted — receipt skipped");
      return;
    }
    const receipt = buildReceipt(
      dp.Raw.metadata?.namespace ?? "unknown",
      "Deployment",
      dp.Raw.metadata?.name ?? "unknown",
      JSON.stringify(dp.Raw.spec ?? {}),
      "ADMIT",
    );
    const envelope = signDsse(receipt, privKey);
    const receiptId = crypto.createHash("sha256").update(envelope).digest("hex");
    dp.SetAnnotation("szl.io/receipt", receiptId);
    dp.SetAnnotation("szl.io/receipt-ts", receipt.timestamp);
    // Fire-and-forget POST to receipts server
    fetch("http://szl-receipts-server.szl-receipts.svc.cluster.local:8080/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: envelope,
    }).catch((e) => Log.error(`receipt post failed: ${e}`));
  });
```

**Provisioning the Ed25519 receipt key (run once before first deploy):**

```bash
# Generate key pair
openssl genpkey -algorithm ed25519 -out key.priv.pem
openssl pkey -in key.priv.pem -pubout -out key.pub.pem

# Encode and create Secret
kubectl create secret generic szl-receipts-ed25519 \
  --namespace szl-receipts \
  --from-literal=key.priv="$(base64 -w0 key.priv.pem)" \
  --from-literal=key.pub="$(cat key.pub.pem)"

# Clean up local private key
shred -u key.priv.pem
```

---

## Pattern 5 — mTLS + Network Isolation (Istio ambient mesh)

Every organ namespace carries a `PeerAuthentication` manifest that enforces
**STRICT mTLS** for all traffic within the namespace. Cross-organ calls are
permitted only via explicit `AuthorizationPolicy` rules generated from the
service mesh authorization matrix.

```yaml
# charts/<organ>/templates/peerauthentication.yaml
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: szl-<organ>-strict-mtls
  namespace: szl-<organ>
spec:
  mtls:
    mode: STRICT
```

```yaml
# mesh/authpolicies/allow-mesh-to-<organ>.yaml
# GENERATED from mesh/authorization-matrix.yaml by scripts/gen-authpolicies.py
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: allow-mesh-to-<organ>
  namespace: szl-<organ>
spec:
  selector:
    matchLabels:
      app: <organ>
  action: ALLOW
  rules:
    - from:
        - source:
            principals:
              # Allow only explicitly approved peer service accounts.
              # ALLOW-implies-default-deny: unlisted callers are silently dropped.
              - "cluster.local/ns/szl-a11oy/sa/a11oy"
              - "cluster.local/ns/szl-sentra/sa/sentra"
      to:
        - operation:
            ports: ["8080", "8443"]
```

**Generating the full matrix:**

```bash
# Edit mesh/authorization-matrix.yaml to add/remove allowed pairs, then:
python3 scripts/gen-authpolicies.py \
  --matrix mesh/authorization-matrix.yaml \
  --out mesh/authpolicies/
```

---

## Pattern 6 — k3d Local Cluster Bootstrap (dev/demo)

A one-command local cluster for iterating on packages and bundles without
cloud credentials.

```bash
# k3d-bootstrap.sh — SZL sovereign local cluster
set -euo pipefail
CLUSTER_NAME="${CLUSTER_NAME:-szl-local}"
DOMAIN="${DOMAIN:-szl.local}"

# Bring up k3d cluster configured for UDS Core slim-dev
k3d cluster create "${CLUSTER_NAME}" \
  --k3s-arg "--disable=traefik@server:0" \
  --port "443:443@loadbalancer" \
  --port "80:80@loadbalancer" \
  --wait

# Bootstrap the full platform stack (init + mesh + receipts + organs)
uds deploy oci://ghcr.io/szl-holdings/szl-full-bundle:latest \
  --set DOMAIN="${DOMAIN}" \
  --confirm

echo "Cluster '${CLUSTER_NAME}' ready. Domain: ${DOMAIN}"
```

**Teardown:**
```bash
k3d cluster delete "${CLUSTER_NAME}"
```

---

## Pattern 7 — Helm Values Override per Environment

Each Helm chart exposes a `values/*.yaml` overlay pattern for dev / staging /
prod without duplicating chart templates.

```
charts/<organ>/
├── values.yaml          # base defaults (all keys defined here)
├── values/
│   ├── dev.yaml         # override: replicas=1, logLevel=debug
│   ├── staging.yaml     # override: replicas=2
│   └── prod.yaml        # override: replicas=3, resources.requests set
```

**Deploy with overlay:**
```bash
# Local:
zarf package create packages/<organ> --confirm
zarf package deploy zarf-package-szl-<organ>-amd64-0.N.0.tar.zst \
  --set DOMAIN=szl.local --confirm

# Bundle (recommended for field deploy):
uds deploy szl-bundle.yaml \
  --set DOMAIN=prod.szlholdings.com \
  --confirm
```

**In uds-bundle.yaml overrides block:**
```yaml
overrides:
  szl-<organ>:
    <organ>:
      values:
        - path: replicaCount
          value: "3"
        - path: resources.requests.memory
          value: "512Mi"
```

---

## Quick Reference — CLI Cheat Sheet

| Task | Command |
|---|---|
| Build a single organ package | `zarf package create packages/<organ> --confirm` |
| Deploy a single organ package | `zarf package deploy zarf-package-szl-<organ>-amd64-0.N.0.tar.zst --confirm` |
| Build + deploy full bundle | `uds bundle create szl-bundle.yaml --confirm && uds deploy uds-bundle-szl-<product>-amd64-0.N.0.tar.zst --confirm` |
| Verify cosign signature | `cosign verify --certificate-identity-regexp "^https://github.com/szl-holdings/.*" --certificate-oidc-issuer "https://token.actions.githubusercontent.com" ghcr.io/szl-holdings/<organ>:<tag>` |
| Inspect SBOM in bundle | `zarf package inspect zarf-package-szl-<organ>-amd64-0.N.0.tar.zst --sbom` |
| Check receipt chain | `kubectl get pods -n szl-receipts && curl http://szl-receipts.szl.local/receipts` |
| Generate authpolicies | `python3 scripts/gen-authpolicies.py --matrix mesh/authorization-matrix.yaml --out mesh/authpolicies/` |
| Tear down local cluster | `k3d cluster delete szl-local` |

---

## Air-Gap Checklist

Before freezing a bundle for deployment into a disconnected environment:

- [ ] All images are digest-pinned (`@sha256:...`) in the package manifests
- [ ] `zarf package inspect` confirms all images are BAKED into the tarball
- [ ] Every image has a cosign `.sig` present in GHCR (verify with `cosign triangulate`)
- [ ] SBOMs are attached to each image (`cosign download sbom`)
- [ ] The Ed25519 receipt key Secret is pre-provisioned on the target cluster
- [ ] Any external URL calls (`sanctionsUrl`, live feeds) are set to `""` for air-gap mode
- [ ] Kyverno build-provenance ClusterPolicy is deployed before any organ Pods start
- [ ] Pepr webhook is confirmed healthy: `kubectl get mutatingwebhookconfigurations -l pepr.dev/uuid=szl`
- [ ] Bundle digest matches the published GHCR manifest: `cosign verify-blob-attestation ...`

---

## Attribution

Structural patterns in this document were developed during the SZL Warhacker
deployment practice (2026) and are captured here for org-wide reference.

The **Zarf declarative packager** and **UDS CLI bundle runner** are open-source
tools (Apache-2.0) from the Zarf project and the Unified Defense Stack project.
Neither is vendored here; both are used as binary toolchain dependencies.

The **Pepr admission framework** is Apache-2.0 (Pepr project). The capability
code in Pattern 4 is original SZL Holdings work.

The **Sigstore / cosign** toolchain is Apache-2.0 (Sigstore project).

The **Istio** service mesh is Apache-2.0 (CNCF / Istio project).
