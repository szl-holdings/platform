#!/usr/bin/env node
/**
 * hf-sovereign — verify a Sovereign Substrate Proof Packet against a
 * HuggingFace bucket artifact, with zero platform runtime dependency.
 *
 * Trust model: verification ALWAYS pins against a trusted public key
 * (never the key embedded in the packet alone). The key is sourced in this
 * order:
 *   1. `--trusted-key <id>:<hex>` flag (one or more)
 *   2. `--public-key-url <url>` (defaults to the platform's published key)
 *   3. The bundled known-good key set
 *
 * Usage:
 *   hf-sovereign verify  <hf-bucket-uri> [--public-key-url <url>] [--trusted-key id:hex]
 *   hf-sovereign inspect <packet-path>
 *   hf-sovereign keys    [--public-key-url <url>]
 */

import { readFile } from 'node:fs/promises';
import {
  ProofPacketSchema,
  type TrustedKey,
  verifyPacket,
} from '@workspace/sovereign-substrate';

const HF_ENDPOINT = process.env.HF_ENDPOINT ?? 'https://huggingface.co';
const DEFAULT_PUBLIC_KEY_URL =
  process.env.SOVEREIGN_PUBLIC_KEY_URL ?? 'https://a11oy.szlholdings.com/api/sovereign/public-key';

// Bundled known-good keys — printed in release notes and documented in
// docs/SOVEREIGN_SUBSTRATE.md so an offline verifier can trust them
// without network access.
const BUNDLED_TRUSTED_KEYS: TrustedKey[] = [
  // Populated at release time by the build pipeline.
];

function bucketUriToHttp(bucketUri: string): { artifactUrl: string; packetUrl: string } {
  const m = bucketUri.match(/^hf-bucket:\/\/([^/]+)\/([^/]+)\/(.+)$/);
  if (!m) throw new Error(`invalid hf-bucket URI: ${bucketUri}`);
  const [, org, bucket, path] = m;
  const base = `${HF_ENDPOINT}/datasets/${org}/${bucket}/resolve/main/${path}`;
  return { artifactUrl: base, packetUrl: `${base}.proof.json` };
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed (${res.status}): ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

async function fetchTrustedKey(url: string): Promise<TrustedKey> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`could not fetch trusted key from ${url} (${res.status})`);
  const j = (await res.json()) as { keyId?: string; publicKeyHex?: string };
  if (!j.keyId || !j.publicKeyHex) throw new Error(`malformed key endpoint: ${url}`);
  return { publicKeyId: j.keyId, publicKeyHex: j.publicKeyHex };
}

function parseFlags(argv: string[]): { flags: Record<string, string[]>; positional: string[] } {
  const flags: Record<string, string[]> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const name = a.slice(2);
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`flag --${name} requires a value`);
      }
      (flags[name] ??= []).push(value);
      i++;
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

async function resolveTrustedKeys(
  flags: Record<string, string[]>,
): Promise<TrustedKey[]> {
  const out: TrustedKey[] = [...BUNDLED_TRUSTED_KEYS];
  for (const t of flags['trusted-key'] ?? []) {
    const [id, hex] = t.split(':');
    if (!id || !hex) throw new Error(`--trusted-key must be <id>:<hex>, got ${t}`);
    out.push({ publicKeyId: id, publicKeyHex: hex });
  }
  const urls = flags['public-key-url'] ?? (out.length ? [] : [DEFAULT_PUBLIC_KEY_URL]);
  for (const u of urls) out.push(await fetchTrustedKey(u));
  if (!out.length) {
    throw new Error(
      'no trusted keys configured. Pass --trusted-key id:hex or --public-key-url <url>',
    );
  }
  return out;
}

async function cmdVerify(bucketUri: string, flags: Record<string, string[]>): Promise<number> {
  const trustedKeys = await resolveTrustedKeys(flags);
  const { artifactUrl, packetUrl } = bucketUriToHttp(bucketUri);
  process.stderr.write(`→ trusted keys: ${trustedKeys.map((k) => k.publicKeyId).join(', ')}\n`);
  process.stderr.write(`→ downloading packet:  ${packetUrl}\n`);
  const packetBytes = await fetchBytes(packetUrl);
  const packetJson = JSON.parse(new TextDecoder().decode(packetBytes));
  process.stderr.write(`→ downloading artifact: ${artifactUrl}\n`);
  const artifactBytes = await fetchBytes(artifactUrl);

  const result = verifyPacket(packetJson, artifactBytes, { trustedKeys });
  if (result.ok && result.packet) {
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: true,
          bucketUri,
          artifact: result.packet.artifact,
          trustTier: result.packet.lifecycle.trustTier,
          publishedAt: result.packet.lifecycle.publishedAt,
          signer: result.packet.signature.publicKeyId,
        },
        null,
        2,
      )}\n`,
    );
    return 0;
  }
  process.stderr.write(`✗ verification FAILED: ${result.reason ?? 'unknown'}\n`);
  return 1;
}

async function cmdInspect(packetPath: string): Promise<number> {
  const bytes = await readFile(packetPath);
  const json = JSON.parse(bytes.toString('utf8'));
  const parsed = ProofPacketSchema.safeParse(json);
  if (!parsed.success) {
    process.stderr.write(`✗ invalid packet: ${parsed.error.message}\n`);
    return 1;
  }
  process.stdout.write(`${JSON.stringify(parsed.data, null, 2)}\n`);
  return 0;
}

async function cmdKeys(flags: Record<string, string[]>): Promise<number> {
  const keys = await resolveTrustedKeys(flags);
  process.stdout.write(`${JSON.stringify(keys, null, 2)}\n`);
  return 0;
}

function usage(): never {
  process.stderr.write(
    'Usage:\n' +
      '  hf-sovereign verify  <hf-bucket-uri> [--public-key-url <url>] [--trusted-key id:hex]\n' +
      '  hf-sovereign inspect <packet-path>\n' +
      '  hf-sovereign keys    [--public-key-url <url>]\n',
  );
  process.exit(2);
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd) usage();
  const { flags, positional } = parseFlags(rest);
  if (cmd === 'verify' && positional[0]) process.exit(await cmdVerify(positional[0], flags));
  if (cmd === 'inspect' && positional[0]) process.exit(await cmdInspect(positional[0]));
  if (cmd === 'keys') process.exit(await cmdKeys(flags));
  usage();
}

main().catch((err: Error) => {
  process.stderr.write(`hf-sovereign: ${err.message}\n`);
  process.exit(1);
});
