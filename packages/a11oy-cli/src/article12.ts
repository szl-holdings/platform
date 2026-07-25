import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
} from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';

type JsonRecord = Record<string, unknown>;

export interface Article12ExportOptions {
  inputPath: string;
  outputPath: string;
  signingKeyPath: string;
  from: string;
  to: string;
  createdAt?: string;
}

export interface Article12ExportResult {
  outputPath: string;
  archiveSha256: string;
  receiptCount: number;
  humanOversightEventCount: number;
  denialCount: number;
  rekorProofCount: number;
  from: string;
  to: string;
}

export interface Article12VerificationResult {
  ok: boolean;
  signatureValid: boolean;
  checksumsValid: boolean;
  checkedFiles: number;
  errors: string[];
}

interface ExportSource {
  receipts: JsonRecord[];
  chainProof: JsonRecord;
  rekorInclusionProofs: JsonRecord[];
  humanOversightEvents: JsonRecord[];
  denialLog: JsonRecord[];
}

interface Manifest {
  format: 'szl.article12.export/v1';
  created_at: string;
  range: {
    from: string;
    to: string;
    boundaries: 'inclusive';
  };
  evidence: {
    receipt_count: number;
    chain_proof_count: 1;
    rekor_inclusion_proof_count: number;
    human_oversight_event_count: number;
    denial_count: number;
  };
  files: Record<string, { sha256: string; bytes: number }>;
  signature: {
    algorithm: 'Ed25519';
    signed_file: 'manifest.json';
    signature_file: 'manifest.sig';
    public_key_file: 'public-key.pem';
  };
  verification_scope: string[];
  legal_posture: string;
}

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): JsonRecord {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value;
}

function requireRecordArray(value: unknown, label: string): JsonRecord[] {
  if (!Array.isArray(value) || value.some((item) => !isRecord(item))) {
    throw new Error(`${label} must be an array of objects`);
  }
  return value as JsonRecord[];
}

function parseSource(value: unknown): ExportSource {
  const root = requireRecord(value, 'article12 source');
  return {
    receipts: requireRecordArray(root.receipts, 'receipts'),
    chainProof: requireRecord(root.chainProof, 'chainProof'),
    rekorInclusionProofs: requireRecordArray(
      root.rekorInclusionProofs,
      'rekorInclusionProofs',
    ),
    humanOversightEvents: requireRecordArray(
      root.humanOversightEvents,
      'humanOversightEvents',
    ),
    denialLog: requireRecordArray(root.denialLog, 'denialLog'),
  };
}

function normalizeBoundary(value: string, endOfDay: boolean): Date {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
    : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error(`invalid ISO date/time: ${value}`);
  }
  return parsed;
}

function timestampOf(record: JsonRecord, label: string): Date {
  const raw =
    record.timestampIso8601 ??
    record.timestamp ??
    record.ts;
  if (typeof raw !== 'string') {
    throw new Error(`${label} is missing timestampIso8601/timestamp/ts`);
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error(`${label} has an invalid timestamp: ${raw}`);
  }
  return parsed;
}

function inRange(
  record: JsonRecord,
  from: Date,
  to: Date,
  label: string,
): boolean {
  const time = timestampOf(record, label).valueOf();
  return time >= from.valueOf() && time <= to.valueOf();
}

function articleOf(receipt: JsonRecord): string | null {
  const regulatory = receipt.regulatory;
  if (!isRecord(regulatory)) return null;
  const euAiAct = regulatory.eu_ai_act;
  if (!isRecord(euAiAct)) return null;
  return typeof euAiAct.article === 'string' ? euAiAct.article : null;
}

function receiptIdOf(receipt: JsonRecord, index: number): string {
  const id = receipt.receiptId ?? receipt.receipt_id;
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error(`receipts[${index}] is missing receiptId/receipt_id`);
  }
  return id;
}

function rekorReceiptId(proof: JsonRecord, index: number): string {
  const id = proof.receiptId ?? proof.receipt_id;
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error(
      `rekorInclusionProofs[${index}] is missing receiptId/receipt_id`,
    );
  }
  return id;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function jsonFile(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(stableValue(value), null, 2)}\n`, 'utf8');
}

function jsonlFile(values: JsonRecord[]): Buffer {
  if (values.length === 0) return Buffer.alloc(0);
  return Buffer.from(
    `${values.map((value) => JSON.stringify(stableValue(value))).join('\n')}\n`,
    'utf8',
  );
}

function sha256(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

function verificationScript(): Buffer {
  const lines = [
    "import { createHash, createPublicKey, verify } from 'node:crypto';",
    "import { readFileSync } from 'node:fs';",
    '',
    "const manifestBytes = readFileSync('manifest.json');",
    "const manifest = JSON.parse(manifestBytes.toString('utf8'));",
    "const signature = Buffer.from(readFileSync('manifest.sig', 'utf8').trim(), 'base64');",
    "const publicKey = createPublicKey(readFileSync('public-key.pem'));",
    'const signatureOk = verify(null, manifestBytes, publicKey, signature);',
    'const failures = [];',
    'for (const [path, expected] of Object.entries(manifest.files)) {',
    '  const bytes = readFileSync(path);',
    "  const actual = createHash('sha256').update(bytes).digest('hex');",
    '  if (actual !== expected.sha256 || bytes.length !== expected.bytes) {',
    '    failures.push(`${path}: checksum or size mismatch`);',
    '  }',
    '}',
    "console.log(`manifest signature: ${signatureOk ? 'PASS' : 'FAIL'}`);",
    "console.log(`file checksums: ${failures.length === 0 ? 'PASS' : 'FAIL'}`);",
    'for (const failure of failures) console.error(failure);',
    'if (!signatureOk || failures.length > 0) process.exit(1);',
    '',
  ];
  return Buffer.from(lines.join('\n'), 'utf8');
}

function verificationInstructions(): Buffer {
  return Buffer.from(
    [
      '# Offline verification',
      '',
      '1. Extract this archive into an empty directory:',
      '',
      '   `tar -xf <article12-export.tar>`',
      '',
      '2. From that directory, run:',
      '',
      '   `node verify.mjs`',
      '',
      'The verifier checks the Ed25519 signature on `manifest.json`, then checks',
      'the SHA-256 digest and byte length of every evidence file named by the',
      'manifest. It requires only Node.js and the files in this archive.',
      '',
      'Receipt-level DSSE signatures and the included Rekor proofs remain separate',
      'evidence. Verify each receipt with the public verifier named by the receipt',
      'contract; archive verification does not turn an unsigned receipt into a',
      'signed receipt and does not make a legal compliance determination.',
      '',
    ].join('\n'),
    'utf8',
  );
}

function writeOctal(
  header: Buffer,
  offset: number,
  length: number,
  value: number,
): void {
  const encoded = value.toString(8).padStart(length - 1, '0');
  if (encoded.length > length - 1) {
    throw new Error(`tar numeric field overflow: ${value}`);
  }
  header.write(encoded, offset, length - 1, 'ascii');
  header[offset + length - 1] = 0;
}

function tarHeader(name: string, size: number, mtimeSeconds: number): Buffer {
  const nameBytes = Buffer.byteLength(name, 'utf8');
  if (nameBytes > 100) throw new Error(`tar path exceeds 100 bytes: ${name}`);

  const header = Buffer.alloc(512, 0);
  header.write(name, 0, 100, 'utf8');
  writeOctal(header, 100, 8, 0o644);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(header, 136, 12, mtimeSeconds);
  header.fill(0x20, 148, 156);
  header[156] = '0'.charCodeAt(0);
  header.write('ustar\0', 257, 6, 'ascii');
  header.write('00', 263, 2, 'ascii');
  header.write('a11oy', 265, 32, 'ascii');
  header.write('a11oy', 297, 32, 'ascii');

  let checksum = 0;
  for (const byte of header) checksum += byte;
  header.write(checksum.toString(8).padStart(6, '0'), 148, 6, 'ascii');
  header[154] = 0;
  header[155] = 0x20;
  return header;
}

function buildTar(files: ReadonlyMap<string, Buffer>, mtime: Date): Buffer {
  const chunks: Buffer[] = [];
  const mtimeSeconds = Math.floor(mtime.valueOf() / 1000);
  for (const [name, content] of files) {
    chunks.push(tarHeader(name, content.length, mtimeSeconds));
    chunks.push(content);
    const padding = (512 - (content.length % 512)) % 512;
    if (padding > 0) chunks.push(Buffer.alloc(padding));
  }
  chunks.push(Buffer.alloc(1024));
  return Buffer.concat(chunks);
}

function readTar(archive: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let offset = 0;
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = header
      .subarray(0, 100)
      .toString('utf8')
      .replace(/\0.*$/s, '');
    const sizeText = header
      .subarray(124, 136)
      .toString('ascii')
      .replace(/\0.*$/s, '')
      .trim();
    const size = Number.parseInt(sizeText || '0', 8);
    if (!Number.isSafeInteger(size) || size < 0) {
      throw new Error(`invalid tar size for ${name}`);
    }
    const contentStart = offset + 512;
    const contentEnd = contentStart + size;
    if (contentEnd > archive.length) {
      throw new Error(`truncated tar entry: ${name}`);
    }
    files.set(name, Buffer.from(archive.subarray(contentStart, contentEnd)));
    offset = contentStart + Math.ceil(size / 512) * 512;
  }
  return files;
}

function buildEvidenceFiles(
  receipts: JsonRecord[],
  source: ExportSource,
  selectedProofs: JsonRecord[],
): Map<string, Buffer> {
  return new Map([
    ['receipts.jsonl', jsonlFile(receipts)],
    ['chain-proof.json', jsonFile(source.chainProof)],
    ['rekor-inclusion-proofs.json', jsonFile(selectedProofs)],
    ['human-oversight-events.jsonl', jsonlFile(source.humanOversightEvents)],
    ['denial-log.jsonl', jsonlFile(source.denialLog)],
    ['VERIFY.md', verificationInstructions()],
    ['verify.mjs', verificationScript()],
  ]);
}

export function createArticle12Archive(
  sourceValue: unknown,
  privateKeyPem: Buffer | string,
  options: Pick<Article12ExportOptions, 'from' | 'to' | 'createdAt'>,
): {
  archive: Buffer;
  manifest: Manifest;
  result: Omit<Article12ExportResult, 'outputPath' | 'archiveSha256'>;
} {
  const source = parseSource(sourceValue);
  const from = normalizeBoundary(options.from, false);
  const to = normalizeBoundary(options.to, true);
  if (from.valueOf() > to.valueOf()) {
    throw new Error('--from must be before or equal to --to');
  }

  const receiptIds = new Set<string>();
  const receipts = source.receipts.filter((receipt, index) => {
    const inDateRange = inRange(receipt, from, to, `receipts[${index}]`);
    if (!inDateRange || articleOf(receipt) !== '12') return false;
    receiptIds.add(receiptIdOf(receipt, index));
    return true;
  });
  if (receipts.length === 0) {
    throw new Error('no EU AI Act Article 12 receipts found in the requested range');
  }

  const selectedProofs = source.rekorInclusionProofs.filter((proof, index) =>
    receiptIds.has(rekorReceiptId(proof, index)),
  );
  const proofIds = new Set(
    selectedProofs.map((proof, index) => rekorReceiptId(proof, index)),
  );
  const missingProofIds = [...receiptIds].filter((id) => !proofIds.has(id));
  if (missingProofIds.length > 0) {
    throw new Error(
      `missing Rekor inclusion proof for receipts: ${missingProofIds.join(', ')}`,
    );
  }

  source.humanOversightEvents = source.humanOversightEvents.filter((event, index) =>
    inRange(event, from, to, `humanOversightEvents[${index}]`),
  );
  source.denialLog = source.denialLog.filter((event, index) =>
    inRange(event, from, to, `denialLog[${index}]`),
  );

  const createdAt = options.createdAt
    ? new Date(options.createdAt)
    : new Date();
  if (Number.isNaN(createdAt.valueOf())) {
    throw new Error(`invalid --created-at value: ${options.createdAt}`);
  }

  const evidenceFiles = buildEvidenceFiles(receipts, source, selectedProofs);
  const manifest: Manifest = {
    format: 'szl.article12.export/v1',
    created_at: createdAt.toISOString(),
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
      boundaries: 'inclusive',
    },
    evidence: {
      receipt_count: receipts.length,
      chain_proof_count: 1,
      rekor_inclusion_proof_count: selectedProofs.length,
      human_oversight_event_count: source.humanOversightEvents.length,
      denial_count: source.denialLog.length,
    },
    files: Object.fromEntries(
      [...evidenceFiles].map(([path, content]) => [
        path,
        { sha256: sha256(content), bytes: content.length },
      ]),
    ),
    signature: {
      algorithm: 'Ed25519',
      signed_file: 'manifest.json',
      signature_file: 'manifest.sig',
      public_key_file: 'public-key.pem',
    },
    verification_scope: [
      'Ed25519 authenticity of manifest.json',
      'SHA-256 integrity and byte length of every evidence file',
      'Presence of one Rekor inclusion proof per exported receipt',
    ],
    legal_posture:
      'Technical evidence package only; not a conformity assessment, certification, or legal determination.',
  };

  const manifestBytes = jsonFile(manifest);
  const privateKey = createPrivateKey(privateKeyPem);
  if (privateKey.asymmetricKeyType !== 'ed25519') {
    throw new Error('Article 12 export signing key must be Ed25519');
  }
  const publicKeyPem = createPublicKey(privateKey).export({
    type: 'spki',
    format: 'pem',
  });
  const signature = sign(null, manifestBytes, privateKey);

  const archiveFiles = new Map<string, Buffer>([
    ['manifest.json', manifestBytes],
    ['manifest.sig', Buffer.from(`${signature.toString('base64')}\n`, 'ascii')],
    ['public-key.pem', Buffer.from(publicKeyPem)],
    ...evidenceFiles,
  ]);
  const archive = buildTar(archiveFiles, createdAt);

  return {
    archive,
    manifest,
    result: {
      receiptCount: receipts.length,
      humanOversightEventCount: source.humanOversightEvents.length,
      denialCount: source.denialLog.length,
      rekorProofCount: selectedProofs.length,
      from: from.toISOString(),
      to: to.toISOString(),
    },
  };
}

export function exportArticle12(
  options: Article12ExportOptions,
): Article12ExportResult {
  const source = JSON.parse(readFileSync(options.inputPath, 'utf8')) as unknown;
  const privateKey = readFileSync(options.signingKeyPath);
  const created = createArticle12Archive(source, privateKey, options);
  const outputPath = resolve(options.outputPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, created.archive);
  return {
    outputPath,
    archiveSha256: sha256(created.archive),
    ...created.result,
  };
}

export function verifyArticle12Archive(
  archive: Buffer,
): Article12VerificationResult {
  const errors: string[] = [];
  let files: Map<string, Buffer>;
  try {
    files = readTar(archive);
  } catch (error) {
    return {
      ok: false,
      signatureValid: false,
      checksumsValid: false,
      checkedFiles: 0,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }

  const manifestBytes = files.get('manifest.json');
  const signatureBytes = files.get('manifest.sig');
  const publicKeyBytes = files.get('public-key.pem');
  if (!manifestBytes || !signatureBytes || !publicKeyBytes) {
    return {
      ok: false,
      signatureValid: false,
      checksumsValid: false,
      checkedFiles: 0,
      errors: ['archive is missing manifest.json, manifest.sig, or public-key.pem'],
    };
  }

  let manifest: Manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString('utf8')) as Manifest;
  } catch {
    return {
      ok: false,
      signatureValid: false,
      checksumsValid: false,
      checkedFiles: 0,
      errors: ['manifest.json is not valid JSON'],
    };
  }

  let signatureValid = false;
  try {
    signatureValid = verify(
      null,
      manifestBytes,
      createPublicKey(publicKeyBytes),
      Buffer.from(signatureBytes.toString('ascii').trim(), 'base64'),
    );
  } catch (error) {
    errors.push(
      `manifest signature could not be verified: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (!signatureValid) errors.push('manifest signature is invalid');

  let checkedFiles = 0;
  for (const [path, expected] of Object.entries(manifest.files ?? {})) {
    checkedFiles += 1;
    const content = files.get(path);
    if (!content) {
      errors.push(`manifest evidence file is missing: ${path}`);
      continue;
    }
    if (content.length !== expected.bytes || sha256(content) !== expected.sha256) {
      errors.push(`manifest evidence file failed integrity check: ${path}`);
    }
  }
  const checksumsValid = errors.every(
    (error) =>
      !error.startsWith('manifest evidence file') &&
      !error.startsWith('archive is missing'),
  );
  return {
    ok: signatureValid && checksumsValid && errors.length === 0,
    signatureValid,
    checksumsValid,
    checkedFiles,
    errors,
  };
}
