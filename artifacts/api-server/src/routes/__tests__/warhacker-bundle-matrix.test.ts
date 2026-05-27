/**
 * Warhacker bundle matrix — unit + integration tests (#5573).
 *
 * Covers the non-trivial behavior added to `readBundleMatrix`:
 *   - parseSha256Sidecar:  sidecar parsing tolerates the `sha256sum`
 *     two-column format, trailing newlines, mixed case, and rejects
 *     malformed input.
 *   - discoverSignerKey:   stable selection prefers `artifacts/<name>/
 *     release-keys/*.pub` and falls back to sibling `*.pub` next to the
 *     tarball; alphabetical-first when several candidates exist.
 *   - deriveSignerDid:     produces the `did:key:cosign:sha256:<32hex>`
 *     namespace string from raw public-key bytes.
 *   - integration:         POST /warhacker/lane/1/bundle-compose against
 *     a temp `dist/<name>-uds/` containing a fake tarball + `.sha256`
 *     sidecar + `.sig` + release-keys `.pub`, asserting the lane
 *     surfaces `artifactSha256Source: "sidecar"` and a non-null
 *     `signerDid`.
 */
import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import warhackerRouter, { __testables } from '../warhacker';

const { parseSha256Sidecar, discoverSignerKey, deriveSignerDid } = __testables;

function sha256Hex(buf: Buffer | string): string {
  return createHash('sha256').update(buf).digest('hex');
}

// ─── parseSha256Sidecar ──────────────────────────────────────────────────────

describe('parseSha256Sidecar', () => {
  it('parses the standard `sha256sum` two-column format', () => {
    const hex = 'a'.repeat(64);
    expect(parseSha256Sidecar(`${hex}  rosie-uds-1.0.0-alpha.tar.zst\n`)).toBe(hex);
  });

  it('accepts a bare 64-hex line with no filename column', () => {
    const hex = '0123456789abcdef'.repeat(4);
    expect(parseSha256Sidecar(`${hex}\n`)).toBe(hex);
  });

  it('lowercases mixed-case hex', () => {
    const upper = 'ABCDEF0123456789'.repeat(4);
    expect(parseSha256Sidecar(`${upper}  bundle.tar.zst`)).toBe(upper.toLowerCase());
  });

  it('returns the first valid digest when multiple lines are present', () => {
    const first = '1'.repeat(64);
    const second = '2'.repeat(64);
    expect(parseSha256Sidecar(`${first}  a.tar.zst\n${second}  b.tar.zst\n`)).toBe(first);
  });

  it('skips leading blank/garbage lines', () => {
    const hex = 'b'.repeat(64);
    expect(parseSha256Sidecar(`\n# header\n${hex}  bundle.tar.zst\n`)).toBe(hex);
  });

  it('returns null on malformed or short input', () => {
    expect(parseSha256Sidecar('')).toBeNull();
    expect(parseSha256Sidecar('not-a-hash')).toBeNull();
    expect(parseSha256Sidecar('z'.repeat(64))).toBeNull();
    expect(parseSha256Sidecar('a'.repeat(63))).toBeNull();
  });

  it('handles CRLF line endings', () => {
    const hex = 'c'.repeat(64);
    expect(parseSha256Sidecar(`${hex}  bundle.tar.zst\r\n`)).toBe(hex);
  });
});

// ─── discoverSignerKey ───────────────────────────────────────────────────────

describe('discoverSignerKey', () => {
  let workRoot: string;

  beforeAll(() => {
    workRoot = mkdtempSync(path.join(tmpdir(), 'warhacker-signer-'));
  });

  afterAll(() => {
    rmSync(workRoot, { recursive: true, force: true });
  });

  it('prefers a `release-keys/*.pub` under artifacts/<bundle>/', () => {
    const root = mkdtempSync(path.join(workRoot, 'case-'));
    const bundleName = 'rosie-uds';
    const releaseDir = path.join(root, 'artifacts', bundleName, 'release-keys');
    const bundleDir = path.join(root, 'dist', bundleName);
    mkdirSync(releaseDir, { recursive: true });
    mkdirSync(bundleDir, { recursive: true });
    const releaseKey = path.join(releaseDir, 'rosie-uds-dev.pub');
    writeFileSync(releaseKey, 'release-key-bytes');

    const result = discoverSignerKey(root, bundleName, bundleDir, []);
    expect(result).not.toBeNull();
    expect(result!.keyAbs).toBe(releaseKey);
    expect(result!.keyRef).toBe(path.relative(root, releaseKey));
  });

  it('falls back to a sibling `.pub` next to the tarball', () => {
    const root = mkdtempSync(path.join(workRoot, 'case-'));
    const bundleName = 'sentra-uds';
    const bundleDir = path.join(root, 'dist', bundleName);
    mkdirSync(bundleDir, { recursive: true });
    const siblingKey = path.join(bundleDir, 'sentra-uds.pub');
    writeFileSync(siblingKey, 'sibling-key-bytes');

    const result = discoverSignerKey(root, bundleName, bundleDir, ['sentra-uds.pub']);
    expect(result).not.toBeNull();
    expect(result!.keyAbs).toBe(siblingKey);
  });

  it('returns null when no candidate `.pub` exists', () => {
    const root = mkdtempSync(path.join(workRoot, 'case-'));
    const bundleName = 'amaru-uds';
    const bundleDir = path.join(root, 'dist', bundleName);
    mkdirSync(bundleDir, { recursive: true });
    expect(discoverSignerKey(root, bundleName, bundleDir, [])).toBeNull();
  });

  it('selects alphabetically-first when multiple candidates exist', () => {
    const root = mkdtempSync(path.join(workRoot, 'case-'));
    const bundleName = 'a11oy-uds';
    const releaseDir = path.join(root, 'artifacts', bundleName, 'release-keys');
    const bundleDir = path.join(root, 'dist', bundleName);
    mkdirSync(releaseDir, { recursive: true });
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(path.join(releaseDir, 'z-key.pub'), 'z');
    writeFileSync(path.join(releaseDir, 'a-key.pub'), 'a');
    writeFileSync(path.join(bundleDir, 'm-key.pub'), 'm');

    const result = discoverSignerKey(root, bundleName, bundleDir, ['m-key.pub']);
    expect(result).not.toBeNull();
    expect(path.basename(result!.keyAbs)).toBe('a-key.pub');
  });

  it('ignores non-.pub files in the release-keys dir', () => {
    const root = mkdtempSync(path.join(workRoot, 'case-'));
    const bundleName = 'rosie-uds';
    const releaseDir = path.join(root, 'artifacts', bundleName, 'release-keys');
    const bundleDir = path.join(root, 'dist', bundleName);
    mkdirSync(releaseDir, { recursive: true });
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(path.join(releaseDir, 'rosie-uds-dev.key'), 'private-keep-out');
    writeFileSync(path.join(releaseDir, 'README.md'), 'docs');
    expect(discoverSignerKey(root, bundleName, bundleDir, [])).toBeNull();
  });
});

// ─── deriveSignerDid ─────────────────────────────────────────────────────────

describe('deriveSignerDid', () => {
  it('produces the namespaced did:key:cosign string with 32 hex chars', () => {
    const bytes = Buffer.from('-----BEGIN PUBLIC KEY-----\nABC\n-----END PUBLIC KEY-----\n');
    const did = deriveSignerDid(bytes);
    expect(did).toMatch(/^did:key:cosign:sha256:[0-9a-f]{32}$/);
    expect(did.endsWith(sha256Hex(bytes).slice(0, 32))).toBe(true);
  });

  it('is content-addressed: identical bytes → identical DID', () => {
    const bytes = randomBytes(64);
    expect(deriveSignerDid(bytes)).toBe(deriveSignerDid(bytes));
  });

  it('different bytes → different DID', () => {
    expect(deriveSignerDid(Buffer.from('key-a'))).not.toBe(deriveSignerDid(Buffer.from('key-b')));
  });
});

// ─── Integration: POST /warhacker/lane/1/bundle-compose ──────────────────────

describe('POST /warhacker/lane/1/bundle-compose — sidecar + signer integration', () => {
  let tempRoot: string;
  let previousOverride: string | undefined;
  let app: ReturnType<typeof express>;
  const bundleName = 'rosie-uds' as const;
  const tarballName = `${bundleName}-1.0.0-alpha.tar.zst`;
  // The asserted hash in the sidecar is intentionally NOT the real
  // sha256 of the tarball bytes. That's the whole point of the
  // sidecar branch: when present, the asserted hash wins, even if it
  // diverges from a recomputed digest.
  const assertedHash = 'a'.repeat(64);
  const pubKeyBytes = Buffer.from(
    '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEtest\n-----END PUBLIC KEY-----\n',
  );
  const expectedSignerDid = `did:key:cosign:sha256:${sha256Hex(pubKeyBytes).slice(0, 32)}`;

  beforeAll(() => {
    tempRoot = mkdtempSync(path.join(tmpdir(), 'warhacker-lane1-'));
    // Mark this as a workspace root so findRepoRoot's override check
    // accepts it (override only needs to exist, but we also drop the
    // marker so any consumers walking up cwd land here too).
    writeFileSync(path.join(tempRoot, 'pnpm-workspace.yaml'), 'packages:\n');

    // Lay out dist/<name>-uds/ with tarball + sidecar + .sig
    const bundleDir = path.join(tempRoot, 'dist', bundleName);
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(path.join(bundleDir, tarballName), randomBytes(256));
    writeFileSync(
      path.join(bundleDir, `${tarballName}.sha256`),
      `${assertedHash}  ${tarballName}\n`,
    );
    writeFileSync(path.join(bundleDir, `${tarballName}.sig`), 'fake-cosign-signature');

    // Public key under artifacts/<name>/release-keys/ — discoverSignerKey
    // prefers this over a sibling .pub.
    const releaseDir = path.join(tempRoot, 'artifacts', bundleName, 'release-keys');
    mkdirSync(releaseDir, { recursive: true });
    writeFileSync(path.join(releaseDir, `${bundleName}-dev.pub`), pubKeyBytes);

    previousOverride = process.env.WARHACKER_REPO_ROOT_OVERRIDE;
    process.env.WARHACKER_REPO_ROOT_OVERRIDE = tempRoot;

    app = express();
    app.use(express.json());
    app.use(warhackerRouter);
  });

  afterAll(() => {
    if (previousOverride === undefined) delete process.env.WARHACKER_REPO_ROOT_OVERRIDE;
    else process.env.WARHACKER_REPO_ROOT_OVERRIDE = previousOverride;
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('surfaces artifactSha256Source="sidecar" and a non-null signerDid in bundleMatrix + chain payload', async () => {
    const res = await request(app)
      .post('/warhacker/lane/1/bundle-compose')
      .send({ bundles: [bundleName] });

    expect(res.status).toBe(200);

    const rosie = res.body.bundleMatrix.find((b: { name: string }) => b.name === bundleName);
    expect(rosie).toBeDefined();
    expect(rosie.source).toBe('dist');
    expect(rosie.artifactSha256Source).toBe('sidecar');
    expect(rosie.artifactSha256).toBe(assertedHash);
    expect(rosie.signerDid).toBe(expectedSignerDid);
    expect(rosie.signerKeyRef).toBe(
      path.join('artifacts', bundleName, 'release-keys', `${bundleName}-dev.pub`),
    );
    expect(rosie.sidecarRef).toBe(path.join('dist', bundleName, `${tarballName}.sha256`));
    expect(rosie.signatureRef).toBe(path.join('dist', bundleName, `${tarballName}.sig`));

    // The bundle.composition.v1 receipt payload mirrors the matrix; assert
    // the sidecar/signer values flowed all the way into the receipt chain
    // (not just the side-channel `bundleMatrix` response field).
    const composition = res.body.chain.find(
      (r: { receiptClass: string }) => r.receiptClass === 'bundle.composition.v1',
    );
    expect(composition).toBeDefined();
    // The attestation.chain.v1 entry should mark the signer as resolved.
    const attestation = res.body.chain.find(
      (r: { receiptClass: string }) => r.receiptClass === 'attestation.chain.v1',
    );
    expect(attestation).toBeDefined();
    expect(res.body.bundlesPresentOnDisk).toBe(1);
  });
});
