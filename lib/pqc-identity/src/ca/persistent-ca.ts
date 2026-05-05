import { CertificateAuthority } from './certificate-authority.js';
import type { CertificateData, HybridKeyPair, TransparencyLogEntry } from '../types.js';
import { generateHybridKeyPair } from '../hybrid-signer.js';

export interface PersistentCAStore {
  loadRootKeys(issuerName: string): Promise<{ keyPair: HybridKeyPair } | null>;
  saveRootKeys(issuerName: string, keyPair: HybridKeyPair): Promise<void>;
  loadCertificates(): Promise<CertificateData[]>;
  saveCertificate(cert: CertificateData): Promise<void>;
  persistRevocation(certId: string, revokedAt: number, reason: string): Promise<void>;
  loadTransparencyEntries(): Promise<TransparencyLogEntry[]>;
  saveTransparencyEntry(entry: {
    logIndex: number;
    entryType: string;
    certThumbprint: string;
    certId: string;
    subjectDid: string;
    entryHash: string;
    merkleRoot: string;
    treeSize: number;
  }): Promise<void>;
}

let _persistentStore: PersistentCAStore | null = null;

export function setPersistentCAStore(store: PersistentCAStore): void {
  _persistentStore = store;
}

export function getPersistentCAStore(): PersistentCAStore | null {
  return _persistentStore;
}

export async function initializePersistentCA(
  issuerName: string,
  store?: PersistentCAStore,
): Promise<CertificateAuthority> {
  const activeStore = store ?? _persistentStore;

  if (!activeStore) {
    throw new Error(
      'PersistentCAStore is required — call setPersistentCAStore() before initializePersistentCA(), or pass a store directly.',
    );
  }

  let keyPair: HybridKeyPair;

  const stored = await activeStore.loadRootKeys(issuerName);
  if (stored) {
    keyPair = stored.keyPair;
  } else {
    keyPair = generateHybridKeyPair();
    await activeStore.saveRootKeys(issuerName, keyPair);
    const canonical = await activeStore.loadRootKeys(issuerName);
    if (canonical) {
      keyPair = canonical.keyPair;
    }
  }

  const ca = new CertificateAuthority({
    issuerName,
    keyPair,
  });

  const certs = await activeStore.loadCertificates();
  for (const cert of certs) {
    ca.restoreCertificate(cert);
  }

  const logEntries = await activeStore.loadTransparencyEntries();
  if (logEntries.length > 0) {
    ca.transparencyLog.restoreEntries(logEntries);
  }

  let _pendingPersistence: Promise<void> = Promise.resolve();

  function enqueuePersistence(fn: () => Promise<void>): void {
    _pendingPersistence = _pendingPersistence
      .then(fn)
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[pqc-ca] Persistence failed: ${msg}`);
        throw err;
      });
  }

  (ca as CertificateAuthority & { waitForPersistence: () => Promise<void> }).waitForPersistence =
    () => _pendingPersistence;

  const origIssue = ca.issueCertificate.bind(ca);
  ca.issueCertificate = (opts) => {
    const result = origIssue(opts);
    const certData = result.certificate;
    const log = ca.transparencyLog;
    const latestEntry = log.entries[log.entries.length - 1];
    const logSnapshot = latestEntry
      ? {
          logIndex: log.size - 1,
          entryType: latestEntry.entryType,
          certThumbprint: latestEntry.certThumbprint,
          certId: latestEntry.certId,
          subjectDid: latestEntry.subjectDid,
          entryHash: latestEntry.leafHash,
          merkleRoot: log.merkleRoot,
          treeSize: log.size,
        }
      : null;

    const persistencePromise = new Promise<void>((resolve, reject) => {
      enqueuePersistence(async () => {
        await activeStore.saveCertificate(certData);
        if (logSnapshot) {
          await activeStore.saveTransparencyEntry(logSnapshot);
        }
      });
      _pendingPersistence.then(resolve, reject);
    });

    return Object.assign(result, { persistencePromise });
  };

  const origRevoke = ca.revokeCertificate.bind(ca);
  ca.revokeCertificate = (certId, reason) => {
    const result = origRevoke(certId, reason);
    if (result.success) {
      const cert = ca.getCertificate(certId);
      const revokedAt = cert?.revokedAt ?? Date.now();
      const log = ca.transparencyLog;
      const latestEntry = log.entries[log.entries.length - 1];
      const logSnapshot = latestEntry
        ? {
            logIndex: log.size - 1,
            entryType: latestEntry.entryType,
            certThumbprint: latestEntry.certThumbprint,
            certId: latestEntry.certId,
            subjectDid: latestEntry.subjectDid,
            entryHash: latestEntry.leafHash,
            merkleRoot: log.merkleRoot,
            treeSize: log.size,
          }
        : null;

      const persistencePromise = new Promise<void>((resolve, reject) => {
        enqueuePersistence(async () => {
          await activeStore.persistRevocation(certId, revokedAt, reason);
          if (logSnapshot) {
            await activeStore.saveTransparencyEntry(logSnapshot);
          }
        });
        _pendingPersistence.then(resolve, reject);
      });

      return Object.assign(result, { persistencePromise });
    }
    return result;
  };

  await _pendingPersistence;

  return ca;
}
