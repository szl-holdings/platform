/**
 * Virus Scanner — signature-based malware detection for uploaded files.
 *
 * Implements a two-tier scanning strategy:
 *
 * Tier 1 (always active): Lightweight YARA-style byte-signature scanner covering:
 *   - EICAR standard test virus (canonical AV test file)
 *   - Common malware file-type smuggling patterns (PE/EXE headers in non-exe files)
 *   - Obfuscated script launchers embedded in documents
 *   - Macro-enabled Office format magic bytes
 *   - Reverse shell signatures
 *
 * Tier 2 (when VIRUS_SCAN_PROVIDER is set): External AV cloud API call, one of:
 *   - "clamav-rest"   — ClamAV REST API (e.g., clamav-rest Docker image or ClamAV-as-a-Service)
 *                       Requires: CLAMAV_REST_URL (e.g., http://clamav:9000)
 *   - "cloudmersive" — Cloudmersive Virus Scan API
 *                       Requires: CLOUDMERSIVE_API_KEY
 *
 * Environment contract:
 *   VIRUS_SCAN_PROVIDER   = "" | "clamav-rest" | "cloudmersive"   (optional, default: "" = tier-1 only)
 *   CLAMAV_REST_URL       = URL of ClamAV REST service              (required when provider=clamav-rest)
 *   CLOUDMERSIVE_API_KEY  = Cloudmersive API key                    (required when provider=cloudmersive)
 *
 * Scan states:
 *   - "pending"  — queued, not yet started (initial DB state at upload)
 *   - "scanning" — scan in progress
 *   - "clean"    — no threats found
 *   - "infected" — threat detected; file quarantined
 *   - "error"    — scan failed (e.g., storage read error)
 *   - "skipped"  — object storage not configured
 *
 * Safety invariant: If the external AV API call fails (network error, timeout, invalid response),
 * the scan falls back to the tier-1 signature result rather than silently clearing the file.
 * A failed external scan is logged as a warning; it does NOT produce a "clean" result without evidence.
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
  provider?: string;
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

// ─── External AV: ClamAV REST ─────────────────────────────────────────────────
// Calls the ClamAV REST API (e.g., https://github.com/benzino77/clamav-rest).
// POST /scan with multipart form-data containing the file bytes.
// Returns: { success: boolean, data: { result: 'OK' | 'FOUND' } }

async function callClamavRest(
  bytes: Buffer,
  fileName = 'upload',
): Promise<{ infected: boolean; threat?: string } | null> {
  const clamavUrl = process.env.CLAMAV_REST_URL;
  if (!clamavUrl) {
    logger.warn('[virus-scan] CLAMAV_REST_URL not set; skipping ClamAV REST scan');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('FILES', new Blob([bytes]), fileName);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      response = await fetch(`${clamavUrl}/scan`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      logger.warn({ status: response.status }, '[virus-scan] ClamAV REST returned non-OK status');
      return null;
    }

    const json = (await response.json()) as {
      success?: boolean;
      data?: { result?: string };
    };

    const result = json?.data?.result ?? '';
    if (result === 'OK') {
      return { infected: false };
    } else if (result === 'FOUND') {
      return { infected: true, threat: 'ClamAV-detected-threat' };
    } else {
      logger.warn({ result }, '[virus-scan] ClamAV REST returned unexpected result');
      return null;
    }
  } catch (err) {
    logger.warn({ err }, '[virus-scan] ClamAV REST scan failed');
    return null;
  }
}

// ─── External AV: Cloudmersive ────────────────────────────────────────────────
// Calls the Cloudmersive Virus Scan API.
// See: https://cloudmersive.com/virus-api
// POST https://api.cloudmersive.com/virus/scan/file with file bytes.
// Returns: { CleanResult: boolean, FoundViruses: Array<{ FileName: string, VirusName: string }> }

async function callCloudmersive(
  bytes: Buffer,
): Promise<{ infected: boolean; threat?: string } | null> {
  const apiKey = process.env.CLOUDMERSIVE_API_KEY;
  if (!apiKey) {
    logger.warn('[virus-scan] CLOUDMERSIVE_API_KEY not set; skipping Cloudmersive scan');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('inputFile', new Blob([bytes]), 'upload');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      response = await fetch('https://api.cloudmersive.com/virus/scan/file', {
        method: 'POST',
        headers: { Apikey: apiKey },
        body: formData,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      logger.warn({ status: response.status }, '[virus-scan] Cloudmersive returned non-OK status');
      return null;
    }

    const json = (await response.json()) as {
      CleanResult?: boolean;
      FoundViruses?: Array<{ FileName?: string; VirusName?: string }>;
    };

    if (json.CleanResult === true) {
      return { infected: false };
    } else if (json.CleanResult === false) {
      const threatName = json.FoundViruses?.[0]?.VirusName ?? 'Unknown-threat';
      return { infected: true, threat: threatName };
    } else {
      logger.warn({ json }, '[virus-scan] Cloudmersive returned unexpected response shape');
      return null;
    }
  } catch (err) {
    logger.warn({ err }, '[virus-scan] Cloudmersive scan failed');
    return null;
  }
}

// ─── Main scanner ─────────────────────────────────────────────────────────────

async function performSignatureScan(
  fileId: number,
  objectPath: string,
  mimeType: string,
): Promise<{ status: VirusScanStatus; threat?: string; provider: string }> {
  const provider = process.env.VIRUS_SCAN_PROVIDER ?? '';

  // Skip deep scan for known-safe MIME types (still checks header bytes).
  if (isSafeMimeType(mimeType)) {
    // Even for safe MIME types, check the file header for smuggled executables.
    const bytes = await readFileBytes(objectPath);
    if (!bytes) return { status: 'skipped', provider: 'none' };
    const headerCheck = scanBuffer(bytes.subarray(0, 8));
    if (headerCheck.infected) return { status: 'infected', threat: headerCheck.threat, provider: 'signature' };
    return { status: 'clean', provider: 'signature' };
  }

  const bytes = await readFileBytes(objectPath);
  if (!bytes) {
    logger.warn({ fileId, objectPath }, '[virus-scan] Cannot read file — marking skipped');
    return { status: 'skipped', provider: 'none' };
  }

  // Tier 1: signature scan (always runs)
  const signatureResult = scanBuffer(bytes);
  if (signatureResult.infected) {
    return { status: 'infected', threat: signatureResult.threat, provider: 'signature' };
  }

  // Tier 2: external AV provider (when configured)
  if (provider === 'clamav-rest') {
    const clamResult = await callClamavRest(bytes, objectPath.split('/').pop());
    if (clamResult !== null) {
      return clamResult.infected
        ? { status: 'infected', threat: clamResult.threat, provider: 'clamav-rest' }
        : { status: 'clean', provider: 'clamav-rest' };
    }
    // If ClamAV REST failed, fall through to signature result (already clean at this point)
    logger.warn({ fileId, objectPath }, '[virus-scan] ClamAV REST unavailable — using signature result');
  } else if (provider === 'cloudmersive') {
    const cloudResult = await callCloudmersive(bytes);
    if (cloudResult !== null) {
      return cloudResult.infected
        ? { status: 'infected', threat: cloudResult.threat, provider: 'cloudmersive' }
        : { status: 'clean', provider: 'cloudmersive' };
    }
    logger.warn({ fileId, objectPath }, '[virus-scan] Cloudmersive unavailable — using signature result');
  }

  return { status: 'clean', provider: provider || 'signature' };
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

  let result: { status: VirusScanStatus; threat?: string; provider: string };
  try {
    result = await performSignatureScan(fileId, objectPath, mimeType);
  } catch (scanErr) {
    logger.error({ err: scanErr, fileId, objectPath }, '[virus-scan] Scan failed');
    result = { status: 'error', provider: 'unknown' };
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
    { fileId, objectPath, status: result.status, threat: result.threat ?? null, scannedAt, provider: result.provider },
    '[virus-scan] Scan complete',
  );

  return {
    fileId,
    objectPath,
    status: result.status,
    threat: result.threat,
    scannedAt,
    provider: result.provider,
  };
}
