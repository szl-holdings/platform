import { bytesToHex } from '@noble/hashes/utils.js';
import type { DIDDocument, DIDVerificationMethod, DIDService, CertificateData } from '../types.js';
import type { HybridSigner } from '../hybrid-signer.js';

const DID_DOCUMENT_CONTEXT = [
  'https://www.w3.org/ns/did/v1',
  'https://w3id.org/security/suites/ed25519-2020/v1',
  'https://w3id.org/security/suites/jws-2020/v1',
];

export function createDidWeb(domain: string): string {
  const encoded = domain.replace(/:/g, '%3A').replace(/\//g, ':');
  return `did:web:${encoded}`;
}

export function createDidKey(ed25519PublicKey: Uint8Array): string {
  const MULTICODEC_ED25519 = new Uint8Array([0xed, 0x01]);
  const combined = new Uint8Array(MULTICODEC_ED25519.length + ed25519PublicKey.length);
  combined.set(MULTICODEC_ED25519);
  combined.set(ed25519PublicKey, MULTICODEC_ED25519.length);
  const encoded = bytesToBase58btc(combined);
  return `did:key:z${encoded}`;
}

export function buildDidDocument(opts: {
  did: string;
  signer: HybridSigner;
  certificate?: CertificateData;
  serviceEndpoints?: DIDService[];
}): DIDDocument {
  const { did, signer, certificate, serviceEndpoints } = opts;
  const publicKeys = signer.publicKeys;

  const verificationMethods: DIDVerificationMethod[] = [
    {
      id: `${did}#ed25519-key`,
      type: 'Ed25519VerificationKey2020',
      controller: did,
      publicKeyHex: publicKeys.ed25519,
    },
    {
      id: `${did}#mldsa65-key`,
      type: 'ML-DSA-65VerificationKey',
      controller: did,
      publicKeyHex: publicKeys.mldsa65,
    },
  ];

  if (certificate) {
    verificationMethods.push({
      id: `${did}#hybrid-cert`,
      type: 'HybridPQCCertificate',
      controller: did,
      publicKeyHex: certificate.thumbprint,
    });
  }

  const services: DIDService[] = [...(serviceEndpoints ?? [])];

  return {
    '@context': DID_DOCUMENT_CONTEXT,
    id: did,
    verificationMethod: verificationMethods,
    authentication: [`${did}#ed25519-key`, `${did}#mldsa65-key`],
    assertionMethod: [`${did}#ed25519-key`, `${did}#mldsa65-key`],
    service: services.length > 0 ? services : undefined,
  };
}

export function resolveDidKey(did: string): { publicKeyHex: string } | null {
  if (!did.startsWith('did:key:z')) return null;
  const multibase = did.slice('did:key:z'.length);
  const decoded = base58btcToBytes(multibase);
  if (decoded[0] !== 0xed || decoded[1] !== 0x01) return null;
  const publicKey = decoded.slice(2);
  return { publicKeyHex: bytesToHex(publicKey) };
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function bytesToBase58btc(bytes: Uint8Array): string {
  let num = 0n;
  for (const b of bytes) {
    num = num * 256n + BigInt(b);
  }
  let result = '';
  while (num > 0n) {
    const mod = Number(num % 58n);
    result = BASE58_ALPHABET[mod] + result;
    num = num / 58n;
  }
  for (const b of bytes) {
    if (b === 0) result = '1' + result;
    else break;
  }
  return result || '1';
}

function base58btcToBytes(str: string): Uint8Array {
  let num = 0n;
  for (const ch of str) {
    const idx = BASE58_ALPHABET.indexOf(ch);
    if (idx === -1) return new Uint8Array(0);
    num = num * 58n + BigInt(idx);
  }
  const hex = num.toString(16).padStart(2, '0');
  const padded = hex.length % 2 ? '0' + hex : hex;
  const bytes: number[] = [];
  for (let i = 0; i < padded.length; i += 2) {
    bytes.push(parseInt(padded.slice(i, i + 2), 16));
  }
  let leadingZeros = 0;
  for (const ch of str) {
    if (ch === '1') leadingZeros++;
    else break;
  }
  const result = new Uint8Array(leadingZeros + bytes.length);
  result.set(new Uint8Array(bytes), leadingZeros);
  return result;
}

const didWebCache = new Map<string, { doc: DIDDocument; expiresAt: number }>();
const DID_WEB_TTL_MS = 5 * 60 * 1000;

const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^\[::1\]/,
  /^\[fc/i,
  /^\[fd/i,
  /^\[fe80:/i,
  /^169\.254\./,
  /\.local$/i,
  /\.internal$/i,
  /\.arpa$/i,
];

function isDomainAllowed(domain: string): boolean {
  const host = domain.split(':')[0] ?? '';
  return !BLOCKED_PATTERNS.some((p) => p.test(host));
}

async function isResolvedIpPrivate(hostname: string): Promise<boolean> {
  try {
    const dns = await import('node:dns');
    const { resolve4 } = dns.promises;
    const addresses = await resolve4(hostname);
    for (const addr of addresses) {
      if (
        addr.startsWith('127.') ||
        addr.startsWith('10.') ||
        addr.startsWith('0.') ||
        addr.startsWith('169.254.') ||
        addr.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(addr)
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

export async function resolveDidWeb(did: string): Promise<DIDDocument | null> {
  if (!did.startsWith('did:web:')) return null;

  const cached = didWebCache.get(did);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.doc;
  }

  try {
    const domainPart = did.slice('did:web:'.length);
    const parts = domainPart.split(':');
    const domain = (parts[0] ?? '').replace(/%3A/g, ':');
    const path = parts.length > 1 ? '/' + parts.slice(1).join('/') : '';

    if (!isDomainAllowed(domain)) {
      return null;
    }

    const host = domain.split(':')[0] ?? '';
    if (await isResolvedIpPrivate(host)) {
      return null;
    }

    const url = path
      ? `https://${domain}${path}/did.json`
      : `https://${domain}/.well-known/did.json`;

    const resp = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
      headers: { Accept: 'application/did+ld+json, application/json' },
    });
    if (!resp.ok) return null;
    const doc = (await resp.json()) as DIDDocument;
    didWebCache.set(did, { doc, expiresAt: Date.now() + DID_WEB_TTL_MS });
    return doc;
  } catch {
    return null;
  }
}

export function clearDidWebCache(): void {
  didWebCache.clear();
}

export function setDidWebCacheEntry(did: string, doc: DIDDocument): void {
  didWebCache.set(did, { doc, expiresAt: Date.now() + DID_WEB_TTL_MS });
}
