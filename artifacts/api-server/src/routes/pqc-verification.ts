import { type IRouter, type Request, type Response, Router } from 'express';
import { handleRouteError, sendSuccess } from '../lib/api-response';
import {
  getDefaultCA,
  getPQCConfig,
  getSigningMode,
  verifyHybridSignature,
  verifyHybridSignatureWithCertBinding,
  verifyCertificate,
  verifyDid,
  verifySignedEntry,
  walkProofChain,
  TransparencyLog,
  createDidWeb,
  verifyProofChainEntry,
} from '@szl-holdings/pqc-identity';
import type { HybridSignature, SignedProofChainEntry, IdentitySignedEntry, ProofChainWalkEntry, CertificateData } from '@szl-holdings/pqc-identity';
import { canonicalStringify } from '@szl-holdings/proof-chain';
import { db, proofChainTable, pqcCertificatesTable, pqcTransparencyLogTable } from '@szl-holdings/db';
import { eq, desc, asc, and, gte, lte, or } from 'drizzle-orm';

const router: IRouter = Router();

async function refreshCertFromDb(identifier: string): Promise<boolean> {
  try {
    const [row] = await db
      .select()
      .from(pqcCertificatesTable)
      .where(
        or(
          eq(pqcCertificatesTable.certId, identifier),
          eq(pqcCertificatesTable.thumbprint, identifier),
        ),
      )
      .limit(1);

    if (!row) return false;

    const certData: CertificateData = {
      certId: row.certId,
      version: row.version,
      issuer: row.issuer,
      subject: row.subject,
      subjectDid: row.subjectDid,
      publicKeys: { ed25519: row.ed25519PublicKey, mldsa65: row.mldsa65PublicKey },
      notBefore: row.notBefore.getTime(),
      notAfter: row.notAfter.getTime(),
      serialNumber: row.serialNumber,
      thumbprint: row.thumbprint,
      issuedAt: row.issuedAt.getTime(),
      issuerSignature: (row.issuerSignature as unknown as HybridSignature) ?? undefined,
      revokedAt: row.revokedAt?.getTime(),
      revocationReason: row.revocationReason ?? undefined,
    };

    const ca = getDefaultCA();
    ca.restoreCertificate(certData);

    const logRows = await db
      .select()
      .from(pqcTransparencyLogTable)
      .where(eq(pqcTransparencyLogTable.certThumbprint, row.thumbprint))
      .orderBy(asc(pqcTransparencyLogTable.logIndex));

    for (const lr of logRows) {
      const existing = ca.transparencyLog.getInclusionProofByThumbprint(lr.certThumbprint);
      if (!existing) {
        ca.transparencyLog.restoreEntries([{
          index: lr.logIndex,
          timestamp: lr.timestamp.getTime(),
          entryType: lr.entryType as 'issuance' | 'revocation',
          certThumbprint: lr.certThumbprint,
          certId: lr.certId,
          subjectDid: lr.subjectDid,
          leafHash: lr.entryHash,
        }]);
      }
    }

    return true;
  } catch {
    return false;
  }
}

async function verifyCertificateWithDbFallback(identifier: string): ReturnType<typeof verifyCertificate> {
  let result = verifyCertificate(identifier);
  if (!result.valid && (result.details as Record<string, unknown>).error === 'Certificate not found') {
    const refreshed = await refreshCertFromDb(identifier);
    if (refreshed) {
      result = verifyCertificate(identifier);
    }
  }
  return result;
}

router.get('/pqc/status', async (_req: Request, res: Response) => {
  try {
    const ca = getDefaultCA();
    const config = getPQCConfig();
    const stats = ca.getStats();

    sendSuccess(res, {
      status: 'operational',
      signingMode: getSigningMode(),
      config: {
        signingMode: config.signingMode,
        minimumVerificationLevel: config.minimumVerificationLevel,
        enableTransparencyLog: config.enableTransparencyLog,
      },
      ca: {
        issuer: ca.issuerName,
        rootPublicKeys: ca.rootPublicKeys,
        certificates: stats,
      },
      transparencyLog: {
        merkleRoot: ca.transparencyLog.merkleRoot,
        treeSize: ca.transparencyLog.size,
      },
      algorithms: {
        classical: 'Ed25519',
        postQuantum: 'ML-DSA-65 (FIPS 204)',
        hybrid: 'Ed25519 + ML-DSA-65 concatenated',
        version: 'hybrid-v1',
      },
    });
  } catch (err) {
    handleRouteError(res, err, 'pqc-status');
  }
});

router.post('/pqc/verify/signature', async (req: Request, res: Response) => {
  try {
    const { message, signature, certThumbprint } = req.body as {
      message: string;
      signature: HybridSignature;
      certThumbprint?: string;
    };

    if (!message || !signature) {
      res.status(400).json({ ok: false, error: 'Missing message or signature' });
      return;
    }

    if (certThumbprint) {
      const bound = verifyHybridSignatureWithCertBinding(message, signature, certThumbprint);
      sendSuccess(res, {
        verdict: bound,
        trustLevel: 'certificate-bound',
        verifiedAt: Date.now(),
      });
    } else {
      const verdict = verifyHybridSignature(message, signature);
      sendSuccess(res, {
        verdict,
        trustLevel: 'self-asserted',
        warning: 'Public keys are self-asserted by the payload. Supply certThumbprint for CA-bound verification.',
        verifiedAt: Date.now(),
      });
    }
  } catch (err) {
    handleRouteError(res, err, 'verify-signature');
  }
});

router.post('/pqc/verify/certificate', async (req: Request, res: Response) => {
  try {
    const { certId, thumbprint, certThumbprint } = req.body as { certId?: string; thumbprint?: string; certThumbprint?: string };

    const identifier = certId ?? thumbprint ?? certThumbprint;
    if (!identifier) {
      res.status(400).json({ ok: false, error: 'Missing certId or thumbprint' });
      return;
    }

    const result = await verifyCertificateWithDbFallback(identifier);
    sendSuccess(res, {
      ...result,
      verifiedAt: Date.now(),
    });
  } catch (err) {
    handleRouteError(res, err, 'verify-certificate');
  }
});

router.post('/pqc/verify/did', async (req: Request, res: Response) => {
  try {
    const { did } = req.body as { did: string };

    if (!did) {
      res.status(400).json({ ok: false, error: 'Missing did' });
      return;
    }

    const result = await verifyDid(did);
    sendSuccess(res, {
      ...result,
      verifiedAt: Date.now(),
    });
  } catch (err) {
    handleRouteError(res, err, 'verify-did');
  }
});

router.get('/pqc/transparency-log', async (_req: Request, res: Response) => {
  try {
    const ca = getDefaultCA();
    const log = ca.transparencyLog;
    const state = log.getState();

    sendSuccess(res, {
      merkleRoot: state.merkleRoot,
      treeSize: state.treeSize,
      latestEntry: state.latestEntry,
      entries: log.entries.slice(-50),
    });
  } catch (err) {
    handleRouteError(res, err, 'transparency-log');
  }
});

router.post('/pqc/transparency-log/inclusion-proof', async (req: Request, res: Response) => {
  try {
    const { thumbprint, logIndex } = req.body as { thumbprint?: string; logIndex?: number };

    const ca = getDefaultCA();
    const log = ca.transparencyLog;

    let proof;
    if (thumbprint) {
      proof = log.getInclusionProofByThumbprint(thumbprint);
    } else if (logIndex !== undefined) {
      proof = log.getInclusionProof(logIndex);
    }

    if (!proof) {
      res.status(404).json({ ok: false, error: 'No inclusion proof found' });
      return;
    }

    const verified = TransparencyLog.verifyInclusionProof(proof);
    sendSuccess(res, {
      proof,
      verified,
      verifiedAt: Date.now(),
    });
  } catch (err) {
    handleRouteError(res, err, 'inclusion-proof');
  }
});

router.get('/pqc/certificates', async (_req: Request, res: Response) => {
  try {
    const ca = getDefaultCA();
    const certs = ca.listCertificates();

    sendSuccess(res, {
      issuer: ca.issuerName,
      certificates: certs.map((c) => ({
        certId: c.certId,
        subject: c.subject,
        subjectDid: c.subjectDid,
        thumbprint: c.thumbprint,
        notBefore: c.notBefore,
        notAfter: c.notAfter,
        isRevoked: !!c.revokedAt,
      })),
      total: certs.length,
    });
  } catch (err) {
    handleRouteError(res, err, 'list-certificates');
  }
});

router.post('/pqc/verify', async (req: Request, res: Response) => {
  try {
    const { proofId, did, signature, message, certId, certThumbprint } = req.body as {
      proofId?: string;
      did?: string;
      signature?: HybridSignature;
      message?: string;
      certId?: string;
      certThumbprint?: string;
    };

    const verdict: Record<string, unknown> = {
      overallValid: true,
      verifiedAt: Date.now(),
      checks: {} as Record<string, unknown>,
    };
    const checks = verdict.checks as Record<string, unknown>;

    const certIdentifier = certThumbprint ?? certId;

    if (signature && message) {
      if (certIdentifier) {
        const certResult = await verifyCertificateWithDbFallback(certIdentifier);
        const thumbprint = (certResult.details as Record<string, unknown>).thumbprint as string | undefined;
        if (thumbprint) {
          const bound = verifyHybridSignatureWithCertBinding(message, signature, thumbprint);
          checks.signature = { ...bound, trustLevel: 'certificate-bound' };
          if (!bound.valid) verdict.overallValid = false;
        } else {
          const sigResult = verifyHybridSignature(message, signature);
          checks.signature = { ...sigResult, trustLevel: 'self-asserted' };
          if (!sigResult.valid) verdict.overallValid = false;
        }
      } else {
        const sigResult = verifyHybridSignature(message, signature);
        checks.signature = { ...sigResult, trustLevel: 'self-asserted' };
        if (!sigResult.valid) verdict.overallValid = false;
      }
    }

    if (did) {
      const didResult = await verifyDid(did);
      checks.did = didResult;
      if (!didResult.resolved) verdict.overallValid = false;
    }

    if (certIdentifier) {
      const certResult = await verifyCertificateWithDbFallback(certIdentifier);
      checks.certificate = certResult;
      if (!certResult.valid || certResult.revoked) verdict.overallValid = false;

      const ca = getDefaultCA();
      const log = ca.transparencyLog;
      const resolvedThumbprint = (certResult.details as Record<string, unknown>).thumbprint as string | undefined;
      const lookupThumbprint = resolvedThumbprint ?? certIdentifier;
      const proof = log.getInclusionProofByThumbprint(lookupThumbprint);
      if (proof) {
        const verified = TransparencyLog.verifyInclusionProof(proof);
        checks.transparencyLog = { proof, verified };
        if (!verified) verdict.overallValid = false;
      } else {
        checks.transparencyLog = { verified: false, reason: 'No proof found' };
        verdict.overallValid = false;
      }
    }

    if (proofId) {
      try {
        const proofIdNum = parseInt(proofId, 10);
        if (!isNaN(proofIdNum)) {
          const [proofRecord] = await db
            .select()
            .from(proofChainTable)
            .where(eq(proofChainTable.id, proofIdNum))
            .limit(1);

          if (proofRecord) {
            const metadata = (proofRecord.metadata ?? {}) as Record<string, unknown>;
            const signedEntry = metadata.pqcSignature as SignedProofChainEntry | undefined;

            if (signedEntry && signedEntry.signature) {
              const originalMetadata = { ...metadata };
              delete originalMetadata.pqcSignature;
              const entryContent = canonicalStringify({
                contentId: proofRecord.contentId,
                contentType: proofRecord.contentType,
                sourceClass: proofRecord.sourceClass,
                metadata: Object.keys(originalMetadata).length > 0 ? originalMetadata : {},
              });

              const verifyResult = verifyProofChainEntry(signedEntry, entryContent);

              checks.proofChain = {
                found: true,
                proofId: proofRecord.id,
                contentId: proofRecord.contentId,
                contentType: proofRecord.contentType,
                sourceClass: proofRecord.sourceClass,
                signerDid: signedEntry.signerDid,
                certThumbprint: signedEntry.certThumbprint,
                signingMode: signedEntry.signingMode,
                signedAt: signedEntry.signedAt,
                hasHybridSignature: true,
                signatureValid: verifyResult.valid,
                verificationDetails: verifyResult.details,
              };
              if (!verifyResult.valid) verdict.overallValid = false;
            } else {
              checks.proofChain = {
                found: true,
                proofId: proofRecord.id,
                contentId: proofRecord.contentId,
                legacy: true,
                hasHybridSignature: false,
              };
            }
          } else {
            checks.proofChain = { found: false, proofId };
            verdict.overallValid = false;
          }
        } else {
          checks.proofChain = { found: false, error: 'Invalid proofId format' };
          verdict.overallValid = false;
        }
      } catch (lookupErr) {
        console.error('[pqc-verify] Proof lookup error:', lookupErr);
        checks.proofChain = { found: false, error: 'Proof lookup failed' };
        verdict.overallValid = false;
      }
    }

    sendSuccess(res, verdict);
  } catch (err) {
    handleRouteError(res, err, 'verify-all');
  }
});

function buildDidDocument(ca: ReturnType<typeof getDefaultCA>, domain: string) {
  const rootPublicKeys = ca.rootPublicKeys;
  const did = createDidWeb(domain);

  const rootCerts = ca.listCertificates().filter((c) => !c.revokedAt);
  const rootCertThumbprints = rootCerts.map((c) => c.thumbprint);

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
      'https://w3id.org/security/suites/jws-2020/v1',
    ],
    id: did,
    verificationMethod: [
      {
        id: `${did}#ed25519-root`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyHex: rootPublicKeys.ed25519,
      },
      {
        id: `${did}#mldsa65-root`,
        type: 'ML-DSA-65VerificationKey',
        controller: did,
        publicKeyHex: rootPublicKeys.mldsa65,
      },
    ],
    authentication: [`${did}#ed25519-root`, `${did}#mldsa65-root`],
    assertionMethod: [`${did}#ed25519-root`, `${did}#mldsa65-root`],
    'x-pqc-ca': {
      issuer: ca.issuerName,
      activeCertThumbprints: rootCertThumbprints,
      transparencyLog: {
        merkleRoot: ca.transparencyLog.merkleRoot,
        treeSize: ca.transparencyLog.size,
      },
    },
    service: [
      {
        id: `${did}#pqc-verification`,
        type: 'PQCVerificationService',
        serviceEndpoint: `https://${domain}/api/pqc/verify`,
      },
      {
        id: `${did}#transparency-log`,
        type: 'TransparencyLogService',
        serviceEndpoint: `https://${domain}/api/pqc/transparency-log`,
      },
      {
        id: `${did}#certificate-authority`,
        type: 'CertificateAuthorityService',
        serviceEndpoint: `https://${domain}/api/pqc/certificates`,
      },
    ],
  };
}

router.post('/pqc/verify/proof-chain-walk', async (req: Request, res: Response) => {
  try {
    const { limit: rawLimit, startId, endId } = req.body as {
      limit?: number;
      startId?: number;
      endId?: number;
    };

    const queryLimit = Math.min(rawLimit ?? 50, 200);
    const conditions = [];
    if (startId !== undefined) conditions.push(gte(proofChainTable.id, startId));
    if (endId !== undefined) conditions.push(lte(proofChainTable.id, endId));

    let rows: Array<typeof proofChainTable.$inferSelect>;
    try {
      rows = await db
        .select()
        .from(proofChainTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(proofChainTable.id))
        .limit(queryLimit);
    } catch (dbErr: unknown) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      const cause = dbErr instanceof Error && 'cause' in dbErr ? String((dbErr as { cause: unknown }).cause) : '';
      const code = dbErr != null && typeof dbErr === 'object' && 'cause' in dbErr
        ? ((dbErr as { cause: { code?: string } }).cause?.code ?? '')
        : '';
      if (msg.includes('does not exist') || cause.includes('does not exist') || code === '42P01') {
        sendSuccess(res, {
          valid: false,
          entriesVerified: 0,
          entriesFailed: 0,
          hashChainIntact: true,
          results: [],
          skippedLegacyEntries: 0,
          skipped: [],
          note: 'proof_chain table does not exist yet',
          verifiedAt: Date.now(),
        });
        return;
      }
      throw dbErr;
    }

    const walkEntries: ProofChainWalkEntry[] = [];
    const skipped: Array<{ id: number; reason: string }> = [];

    for (const row of rows) {
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      const signedEntry = metadata.pqcSignature as SignedProofChainEntry | undefined;

      if (!signedEntry || !signedEntry.signature) {
        skipped.push({ id: row.id, reason: 'legacy entry (no PQC signature)' });
        continue;
      }

      const originalMetadata = { ...metadata };
      delete originalMetadata.pqcSignature;
      const entryContent = canonicalStringify({
        contentId: row.contentId,
        contentType: row.contentType,
        sourceClass: row.sourceClass,
        metadata: Object.keys(originalMetadata).length > 0 ? originalMetadata : {},
      });

      walkEntries.push({
        index: row.id,
        contentId: row.contentId ?? '',
        contentType: row.contentType ?? '',
        signedEntry: {
          signerDid: signedEntry.signerDid,
          certThumbprint: signedEntry.certThumbprint,
          signature: signedEntry.signature,
          signedAt: signedEntry.signedAt,
          previousHash: signedEntry.previousEntryHash,
          contentHash: signedEntry.contentHash,
        },
        entryContent,
      });
    }

    const result = await walkProofChain(walkEntries);

    sendSuccess(res, {
      ...result,
      skippedLegacyEntries: skipped.length,
      skipped,
      verifiedAt: Date.now(),
    });
  } catch (err) {
    handleRouteError(res, err, 'proof-chain-walk');
  }
});

router.get('/.well-known/did.json', async (_req: Request, res: Response) => {
  try {
    const ca = getDefaultCA();
    const domain = process.env.REPLIT_DEV_DOMAIN ?? 'szl-holdings.replit.app';
    const didDocument = buildDidDocument(ca, domain);

    res.setHeader('Content-Type', 'application/did+ld+json');
    res.json(didDocument);
  } catch (err) {
    handleRouteError(res, err, 'well-known-did-document');
  }
});

router.get('/pqc/did.json', async (_req: Request, res: Response) => {
  try {
    const ca = getDefaultCA();
    const domain = process.env.REPLIT_DEV_DOMAIN ?? 'szl-holdings.replit.app';
    const didDocument = buildDidDocument(ca, domain);

    res.setHeader('Content-Type', 'application/did+ld+json');
    res.json(didDocument);
  } catch (err) {
    handleRouteError(res, err, 'did-document');
  }
});

export default router;
