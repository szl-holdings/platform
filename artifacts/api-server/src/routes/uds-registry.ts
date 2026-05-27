/**
 * UDS bundle registry — public, read-only mesh-facing feed of every
 * signed UDS payload SZL Holdings ships. Mirror of `docs/uds/REGISTRY.md`.
 *
 * Consumers (Defense-Unicorns gateways, downstream mesh nodes, CI runners)
 * read this to discover current `oci://` pull coordinates, the signing
 * workflow identity needed for `cosign verify --certificate-identity-regexp`,
 * and the target install path under `/opt/<bundle>/` — without scraping
 * the markdown.
 *
 * Read-only by design: bundles register themselves at publish time via
 * the per-bundle GitHub Actions workflow, not at runtime. There is no
 * POST surface on the mesh.
 */

import { Router } from 'express';
import { sendSuccess } from '../lib/api-response';

interface UdsBundleEntry {
  readonly slug: string;
  readonly title: string;
  readonly sourceDir: string;
  readonly currentVersion: string;
  readonly oci: {
    readonly release: string;
    readonly dev: string;
  };
  readonly publishWorkflow: string;
  readonly cosignIdentityRegex: string;
  readonly installPath: string;
  readonly buildCommand: string;
  readonly description: string;
}

export const BUNDLES: ReadonlyArray<UdsBundleEntry> = [
  {
    slug: 'a11oy',
    title: 'A11oy — Brand Orchestration Layer',
    sourceDir: 'artifacts/a11oy-uds',
    currentVersion: '0.2.0',
    oci: {
      release: 'oci://ghcr.io/szl-holdings/a11oy-uds:0.2.0',
      dev: 'oci://ghcr.io/szl-holdings/a11oy-uds:dev',
    },
    publishWorkflow: '.github/workflows/a11oy-uds-publish.yml',
    cosignIdentityRegex:
      'https://github.com/szl-holdings/.+/\\.github/workflows/a11oy-uds-publish\\.yml@.+',
    installPath: '/opt/a11oy/',
    buildCommand: 'pnpm --filter @workspace/a11oy-uds run build',
    description:
      'A11oy UDS / Zarf payload — single-command installable A11oy bundle for Defense-Unicorns environments. Ships @a11oy/core + @a11oy/connection plus the optional a11oy-attestations hash-chain component.',
  },
  {
    slug: 'amaru',
    title: 'Amaru — Andean Ouroboros',
    sourceDir: 'artifacts/amaru-uds',
    currentVersion: '0.2.0',
    oci: {
      release: 'oci://ghcr.io/szl-holdings/amaru-uds:0.2.0',
      dev: 'oci://ghcr.io/szl-holdings/amaru-uds:dev',
    },
    publishWorkflow: '.github/workflows/amaru-uds-publish.yml',
    cosignIdentityRegex:
      'https://github.com/szl-holdings/.+/\\.github/workflows/amaru-uds-publish\\.yml@.+',
    installPath: '/opt/amaru/',
    buildCommand: 'pnpm --filter @szl/amaru-uds run build',
    description:
      'Amaru.UDS — signed Zarf payload for the Andean Ouroboros convergent data-sync runtime (Doctrine V6: Lutar Σ family, Λ floor, Bekenstein admission, bounded-loop convergence, KL drift, hash-chained proof receipts).',
  },
  {
    slug: 'rosie',
    title: 'ROSIE — Governed Decision Fabric',
    sourceDir: 'artifacts/rosie-uds',
    currentVersion: '0.2.0',
    oci: {
      release: 'oci://ghcr.io/szl-holdings/rosie-uds:0.2.0',
      dev: 'oci://ghcr.io/szl-holdings/rosie-uds:dev',
    },
    publishWorkflow: '.github/workflows/rosie-uds-publish.yml',
    cosignIdentityRegex:
      'https://github.com/szl-holdings/.+/\\.github/workflows/rosie-uds-publish\\.yml@.+',
    installPath: '/opt/rosie/',
    buildCommand: 'pnpm --filter @szl/rosie-uds run build',
    description:
      'ROSIE.UDS — signed Zarf payload for the governed decision-fabric runtime (policy admission, contradiction detection, governed-action emit, hash-chained decision receipts).',
  },
  {
    slug: 'sentra',
    title: 'Sentra — Cyber Resilience Command',
    sourceDir: 'artifacts/sentra-uds',
    currentVersion: '0.2.0',
    oci: {
      release: 'oci://ghcr.io/szl-holdings/sentra-uds:0.2.0',
      dev: 'oci://ghcr.io/szl-holdings/sentra-uds:dev',
    },
    publishWorkflow: '.github/workflows/sentra-uds-publish.yml',
    cosignIdentityRegex:
      'https://github.com/szl-holdings/.+/\\.github/workflows/sentra-uds-publish\\.yml@.+',
    installPath: '/opt/sentra/',
    buildCommand: 'pnpm --filter @szl/sentra-uds run build',
    description:
      'Sentra.UDS — signed Zarf payload for the cyber-resilience command runtime (asset-scoped fail-closed Safety Gate, NIST CSF 2.0 / SP 800-61r2 / CISA CIRCIA / MITRE D3FEND mappings, risk + exposure + drift + Ising allocation, hash-chained Proof Chain).',
  },
  {
    slug: 'vessels',
    title: 'Vessels — Maritime Intelligence',
    sourceDir: 'artifacts/vessels-uds',
    currentVersion: '0.2.0',
    oci: {
      release: 'oci://ghcr.io/szl-holdings/vessels-uds:0.2.0',
      dev: 'oci://ghcr.io/szl-holdings/vessels-uds:dev',
    },
    publishWorkflow: '.github/workflows/vessels-uds-publish.yml',
    cosignIdentityRegex:
      'https://github.com/szl-holdings/.+/\\.github/workflows/vessels-uds-publish\\.yml@.+',
    installPath: '/opt/vessels/',
    buildCommand: 'pnpm --filter @szl/vessels-uds run build',
    description:
      'Vessels.UDS — signed Zarf payload for the Vessels maritime-intelligence runtime (trajectory inspector, AIS-gap detector, sanctions screen, voyage Λ-receipts). Pure-ESM kernel, no runtime dependencies, deterministic build.',
  },
];

const SHARED_PACKAGES: ReadonlyArray<{
  readonly name: string;
  readonly path: string;
  readonly purpose: string;
}> = [
  {
    name: '@szl-holdings/perception-loop',
    path: 'packages/perception-loop',
    purpose: 'Operator-loop perception envelope for real-time sensing.',
  },
  {
    name: '@szl-holdings/sequence-pipeline',
    path: 'packages/sequence-pipeline',
    purpose: 'Multi-stage hashed evidence pipeline for data integrity.',
  },
  {
    name: '@szl-holdings/sparse-attention-kit',
    path: 'packages/sparse-attention-kit',
    purpose:
      'Sparse envelope + 12 receipt classes with contradiction-probe escalation.',
  },
];

const router = Router();

router.get('/registry', (_req, res) => {
  return sendSuccess(res, {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    canonicalDoc: 'docs/uds/REGISTRY.md',
    universalPullVerifyInstall: {
      pull: 'zarf package pull oci://ghcr.io/szl-holdings/<bundle>-uds:<version>',
      verify:
        "cosign verify --certificate-identity-regexp '<cosignIdentityRegex>' --certificate-oidc-issuer https://token.actions.githubusercontent.com ghcr.io/szl-holdings/<bundle>-uds:<version>",
      install:
        'zarf package deploy zarf-package-<bundle>-uds-*.tar.zst --confirm',
    },
    sharedPackages: SHARED_PACKAGES,
    bundles: BUNDLES,
  });
});

router.get('/registry/:slug', (req, res) => {
  const entry = BUNDLES.find((b) => b.slug === req.params.slug);
  if (!entry) {
    return sendSuccess(
      res,
      { ok: false, error: 'unknown-bundle', slug: req.params.slug },
      404,
    );
  }
  return sendSuccess(res, entry);
});

export default router;
