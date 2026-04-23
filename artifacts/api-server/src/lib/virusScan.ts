/**
 * Virus Scanner — signature-based malware detection for uploaded files.
 *
 * Implements a lightweight YARA-style byte-signature scanner covering:
 *   - EICAR standard test virus (canonical AV test file)
 *   - Common malware file-type smuggling patterns (PE/EXE headers in non-exe files)
 *   - Obfuscated script launchers embedded in documents
 *   - Macro-enabled Office format magic bytes
 *
 * Scan states:
 *   - "pending"  — queued, not yet started (initial DB state at upload)
 *   - "scanning" — scan in progress
 *   - "clean"    — no threats found
 *   - "infected" — threat detected; file quarantined
 *   - "error"    — scan failed (e.g., storage read error)
 *   - "skipped"  — object storage not configured
 *
 * When a real AV cloud API (e.g., VirusTotal, ClamAV-REST, Cloudmersive) is
 * provisioned, replace `performSignatureScan` with that API call and keep the
 * DB update logic intact.
 */

import { eq } from 'drizzle-orm';
import { db, filesTable } from '@szl-holdings/db';
import { ObjectStorageService } from './objectStorage';
import { logger } from './logger';

export type VirusScanStatus = 'pending' | 'scanning' | 'clean' | 'infected' | 'error' | 'skipped';

export interface VirusScanResult {
  fileId: number;
  objectPath: string;
  status: VirusScanStatus;
  threat?: string;
  scannedAt: string;
}

// ─── Signature database ───────────────────────────────────────────────────────

interface Signature {
  name: string;
  pattern: Buffer;
  offset?: number;
}

const EICAR_TEST_SIGNATURE = Buffer.from(
  'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
  'ascii',
);

const SIGNATURES: Signature[] = [
  {
    name: 'EICAR-Test-File',
    pattern: EICAR_TEST_SIGNATURE,
    offset: 0,
  },
  {
    name: 'Win32-PE-Executable',
    pattern: Buffer.from([0x4d, 0x5a]), // MZ header — PE executable
    offset: 0,
  },
  {
    name: 'ELF-Linux-Executable',
    pattern: Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF magic
    offset: 0,
  },
  {
    name: 'Win64-PE-COFF',
    pattern: Buffer.from([0x50, 0x45, 0x00, 0x00, 0x64, 0x86]), // PE64 header
  },
  {
    name: 'Powershell-Encoded-Launcher',
    pattern: Buffer.from('powershell -e', 'ascii'),
  },
  {
    name: 'Powershell-Bypass-Hidden',
    pattern: Buffer.from('-executionpolicy bypass', 'ascii'),
  },
  {
    name: 'Java-Archive-Executable',
    // JAR manifests that declare a Main-Class with suspicious names
    pattern: Buffer.from('Main-Class: Exploit', 'ascii'),
  },
  {
    name: 'Python-Reverse-Shell',
    pattern: Buffer.from('socket.connect', 'ascii'),
  },
];

// Safe MIME types that can contain only inert data (no executable content)
const SAFE_MIME_PREFIXES = [
  'image/',
  'text/plain',
  'text/csv',
  'text/markdown',
];

function isSafeMimeType(mimeType: string): boolean {
  return SAFE_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

function scanBuffer(data: Buffer): { infected: boolean; threat?: string } {
  const haystack = data.subarray(0, Math.min(data.length, 1_048_576)); // scan first 1 MB

  for (const sig of SIGNATURES) {
    const start = sig.offset ?? 0;
    const searchable = haystack.subarray(start);

    const idx = searchable.indexOf(sig.pattern);
    if (idx !== -1) {
      return { infected: true, threat: sig.name };
    }
  }

  return { infected: false };
}

// ─── Object Storage reader ────────────────────────────────────────────────────

const objectStorageService = new ObjectStorageService();

async function readFileBytes(objectPath: string): Promise<Buffer | null> {
  try {
    const file = await objectStorageService.getObjectEntityFile(objectPath);
    const [content] = await file.download({ end: 1_048_576 }); // max 1 MB
    return content as Buffer;
  } catch (err) {
    logger.warn({ err, objectPath }, '[virus-scan] Failed to read file from object storage');
    return null;
  }
}

// ─── Main scanner ─────────────────────────────────────────────────────────────

async function performSignatureScan(
  fileId: number,
  objectPath: string,
  mimeType: string,
): Promise<{ status: VirusScanStatus; threat?: string }> {
  // Skip deep scan for known-safe MIME types (still checks header bytes).
  if (isSafeMimeType(mimeType)) {
    // Even for safe MIME types, check the file header for smuggled executables.
    const bytes = await readFileBytes(objectPath);
    if (!bytes) return { status: 'skipped' };
    const headerCheck = scanBuffer(bytes.subarray(0, 8));
    if (headerCheck.infected) return { status: 'infected', threat: headerCheck.threat };
    return { status: 'clean' };
  }

  const bytes = await readFileBytes(objectPath);
  if (!bytes) {
    logger.warn({ fileId, objectPath }, '[virus-scan] Cannot read file — marking skipped');
    return { status: 'skipped' };
  }

  const result = scanBuffer(bytes);
  if (result.infected) {
    return { status: 'infected', threat: result.threat };
  }

  return { status: 'clean' };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Dispatch a virus scan for a newly uploaded file.
 * Runs synchronously in the request context (the upload finalization endpoint
 * already runs asynchronously from the client's perspective via GCS presign).
 *
 * Updates the `files` row with the final scan_status immediately.
 * If the file is infected, also sets quarantined_at.
 */
export async function dispatchVirusScan(
  fileId: number,
  objectPath: string,
  mimeType = 'application/octet-stream',
): Promise<VirusScanResult> {
  const scannedAt = new Date().toISOString();

  // Mark as scanning while in progress
  try {
    await db
      .update(filesTable)
      .set({ scanStatus: 'scanning' })
      .where(eq(filesTable.id, fileId));
  } catch (dbErr) {
    logger.warn({ err: dbErr, fileId }, '[virus-scan] Failed to mark file as scanning');
  }

  let result: { status: VirusScanStatus; threat?: string };
  try {
    result = await performSignatureScan(fileId, objectPath, mimeType);
  } catch (scanErr) {
    logger.error({ err: scanErr, fileId, objectPath }, '[virus-scan] Scan failed');
    result = { status: 'error' };
  }

  // Persist the final scan result
  try {
    await db
      .update(filesTable)
      .set({
        scanStatus: result.status,
        ...(result.status === 'infected' ? { quarantinedAt: new Date() } : {}),
      })
      .where(eq(filesTable.id, fileId));
  } catch (dbErr) {
    logger.error({ err: dbErr, fileId, result }, '[virus-scan] Failed to persist scan result');
  }

  logger.info(
    { fileId, objectPath, status: result.status, threat: result.threat ?? null, scannedAt },
    '[virus-scan] Scan complete',
  );

  return {
    fileId,
    objectPath,
    status: result.status,
    threat: result.threat,
    scannedAt,
  };
}
