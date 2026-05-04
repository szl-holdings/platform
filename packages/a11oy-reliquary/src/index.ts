import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  db,
  proofChainTable,
  reliquaryAttestationsTable,
  reliquaryCatalogTable,
  reliquaryLineageEdgesTable,
  reliquarySnapshotsTable,
  reliquarySovereignStateTable,
} from '@szl-holdings/db';
import { asc, desc, eq, inArray, or } from 'drizzle-orm';

export type ArtifactType = 'model' | 'prompt' | 'agent' | 'dataset' | 'embedding' | 'report' | 'bundle';

export interface PutParams {
  content: Buffer;
  artifactType: ArtifactType;
  label: string;
  description?: string;
  policyId: string;
  actor: string;
  tenant: string;
  doctrineRevision: string;
  mimeType?: string;
  parentHashes?: string[];
  metadata?: Record<string, unknown>;
}

export interface PutResult {
  contentHash: string;
  covenantHash: string;
  proofReceiptId: string;
  diskPath: string;
  sizeBytes: number;
}

export interface GetResult {
  content: Buffer;
  contentHash: string;
  covenantHash: string;
  artifactType: ArtifactType;
  label: string;
  metadata: Record<string, unknown>;
}

export interface SnapshotEntry {
  artifactId: string;
  contentHash: string;
  covenantHash: string;
  label: string;
  artifactType: ArtifactType;
}

export interface SnapshotResult {
  snapshotHash: string;
  label: string;
  entries: SnapshotEntry[];
  createdAt: string;
}

export interface LineageResult {
  contentHash: string;
  parents: string[];
  children: string[];
  depth: number;
  ancestors: string[];
  descendants: string[];
}

export interface AttestResult {
  merkleRoot: string;
  artifactCount: number;
  proofReceiptId: string;
  attestationId: number;
  proofChainId?: number;
}

export interface SovereignStatus {
  active: boolean;
  activatedBy?: string | null;
  reason?: string | null;
  activatedAt?: string | null;
}

function getBlobDir(): string {
  const dir = process.env.RELIQUARY_BLOB_DIR ?? join(process.cwd(), '.reliquary', 'blobs');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function getSnapshotDir(): string {
  const dir = process.env.RELIQUARY_SNAPSHOT_DIR ?? join(process.cwd(), '.reliquary', 'snapshots');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * SHA-256 over raw content bytes.
 */
export function computeContentHash(content: Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Covenant hash: SHA-256 of binary concatenation of:
 *   raw content bytes || policyId || actor || tenant || doctrineRevision || timestamp
 * All string fields encoded as UTF-8 bytes. This matches the spec requirement:
 * "SHA-256(content || policy_id || actor || tenant || doctrine_revision || timestamp)"
 */
export function computeCovenantHash(
  content: Buffer,
  policyId: string,
  actor: string,
  tenant: string,
  doctrineRevision: string,
  timestamp: string,
): string {
  const combined = Buffer.concat([
    content,
    Buffer.from(policyId, 'utf8'),
    Buffer.from(actor, 'utf8'),
    Buffer.from(tenant, 'utf8'),
    Buffer.from(doctrineRevision, 'utf8'),
    Buffer.from(timestamp, 'utf8'),
  ]);
  return createHash('sha256').update(combined).digest('hex');
}

function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return createHash('sha256').update('empty').digest('hex');
  let layer = [...hashes].sort();
  while (layer.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const left = layer[i] ?? '';
      const right = layer[i + 1] ?? layer[i] ?? '';
      next.push(createHash('sha256').update(left + right).digest('hex'));
    }
    layer = next;
  }
  return layer[0]!;
}

/** Fetch current sovereign status without DB overhead (single lightweight query). */
async function _getSovereignActive(): Promise<boolean> {
  const [row] = await db
    .select({ active: reliquarySovereignStateTable.active })
    .from(reliquarySovereignStateTable)
    .orderBy(desc(reliquarySovereignStateTable.updatedAt))
    .limit(1);
  return row?.active ?? false;
}

export async function put(params: PutParams): Promise<PutResult> {
  const {
    content,
    artifactType,
    label,
    description,
    policyId,
    actor,
    tenant,
    doctrineRevision,
    mimeType = 'application/octet-stream',
    parentHashes = [],
    metadata = {},
  } = params;

  const contentHash = computeContentHash(content);
  const timestamp = new Date().toISOString();
  const covenantHash = computeCovenantHash(content, policyId, actor, tenant, doctrineRevision, timestamp);

  const blobDir = getBlobDir();
  const diskPath = join(blobDir, contentHash);

  if (!existsSync(diskPath)) {
    writeFileSync(diskPath, content);
  }

  const proofReceiptId = `reliquary-${contentHash.slice(0, 12)}-${Date.now()}`;

  const existing = await db
    .select({ id: reliquaryCatalogTable.id })
    .from(reliquaryCatalogTable)
    .where(eq(reliquaryCatalogTable.contentHash, contentHash))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(reliquaryCatalogTable).values({
      contentHash,
      covenantHash,
      artifactType,
      label,
      description: description ?? null,
      policyId,
      actor,
      tenant,
      doctrineRevision,
      sizeBytes: content.byteLength,
      mimeType,
      diskPath,
      proofReceiptId,
      metadata: metadata as Record<string, unknown>,
    });
  }

  if (parentHashes.length > 0) {
    const edges = parentHashes.map((parentHash) => ({
      parentContentHash: parentHash,
      childContentHash: contentHash,
      relationship: 'derived_from',
      metadata: {} as Record<string, unknown>,
    }));
    await db.insert(reliquaryLineageEdgesTable).values(edges).onConflictDoNothing();
  }

  return { contentHash, covenantHash, proofReceiptId, diskPath, sizeBytes: content.byteLength };
}

/**
 * Get artifact by content hash.
 * In Sovereign Mode: if the blob is not present on local disk, throws SOVEREIGN_BLOCK.
 */
export async function get(contentHash: string): Promise<GetResult> {
  const [row] = await db
    .select()
    .from(reliquaryCatalogTable)
    .where(eq(reliquaryCatalogTable.contentHash, contentHash))
    .limit(1);

  if (!row) throw Object.assign(new Error(`Artifact ${contentHash} not found`), { code: 'NOT_FOUND' });

  const sovereignActive = await _getSovereignActive();
  const blobOnDisk = existsSync(row.diskPath);

  if (sovereignActive && !blobOnDisk) {
    throw Object.assign(
      new Error(`Sovereign Mode active: blob ${contentHash} not available on local disk. Network fetch blocked.`),
      { code: 'SOVEREIGN_BLOCK' },
    );
  }

  if (!blobOnDisk) {
    throw Object.assign(new Error(`Blob missing from disk: ${contentHash}`), { code: 'BLOB_MISSING' });
  }

  const content = readFileSync(row.diskPath);
  const verifyHash = computeContentHash(content);
  if (verifyHash !== contentHash) {
    throw Object.assign(new Error(`Integrity check failed for ${contentHash}`), { code: 'INTEGRITY_FAIL' });
  }

  return {
    content,
    contentHash: row.contentHash,
    covenantHash: row.covenantHash,
    artifactType: row.artifactType as ArtifactType,
    label: row.label,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  };
}

export async function getByCovenant(covenantHash: string): Promise<GetResult> {
  const [row] = await db
    .select()
    .from(reliquaryCatalogTable)
    .where(eq(reliquaryCatalogTable.covenantHash, covenantHash))
    .limit(1);

  if (!row) throw Object.assign(new Error(`Covenant ${covenantHash} not found`), { code: 'NOT_FOUND' });
  return get(row.contentHash);
}

export async function snapshot(label: string): Promise<SnapshotResult> {
  const rows = await db
    .select()
    .from(reliquaryCatalogTable)
    .orderBy(asc(reliquaryCatalogTable.createdAt))
    .limit(1000);

  const entries: SnapshotEntry[] = rows.map((r) => ({
    artifactId: String(r.id),
    contentHash: r.contentHash,
    covenantHash: r.covenantHash,
    label: r.label,
    artifactType: r.artifactType as ArtifactType,
  }));

  // Deterministic manifest: sorted by contentHash to ensure reproducibility
  const sortedEntries = [...entries].sort((a, b) => a.contentHash.localeCompare(b.contentHash));
  const manifest = {
    label,
    entries: sortedEntries,
    capturedAt: new Date().toISOString(),
    doctrineRevision: 'doctrine-rev-007',
    merkleRoot: computeMerkleRoot(sortedEntries.map(e => e.contentHash)),
  };
  const manifestJson = JSON.stringify(manifest, null, 2);
  const manifestBuffer = Buffer.from(manifestJson, 'utf8');
  const snapshotHash = computeContentHash(manifestBuffer);

  const snapshotDir = getSnapshotDir();
  const diskPath = join(snapshotDir, `${snapshotHash}.json`);
  writeFileSync(diskPath, manifestJson, 'utf8');

  const proofReceiptId = `snapshot-${snapshotHash.slice(0, 12)}-${Date.now()}`;

  await db
    .insert(reliquarySnapshotsTable)
    .values({
      snapshotHash,
      label,
      manifest: manifest as Record<string, unknown>,
      diskPath,
      proofReceiptId,
    })
    .onConflictDoNothing();

  return { snapshotHash, label, entries: sortedEntries, createdAt: manifest.capturedAt };
}

export async function replay(snapshotHash: string): Promise<{ snapshot: SnapshotResult & { merkleRoot?: string }; artifacts: Array<{ entry: SnapshotEntry; available: boolean; covenantHash: string; integrityOk: boolean }> }> {
  const [row] = await db
    .select()
    .from(reliquarySnapshotsTable)
    .where(eq(reliquarySnapshotsTable.snapshotHash, snapshotHash))
    .limit(1);

  if (!row) throw Object.assign(new Error(`Snapshot ${snapshotHash} not found`), { code: 'NOT_FOUND' });

  const manifest = row.manifest as { label: string; entries: SnapshotEntry[]; capturedAt: string; merkleRoot?: string };
  const entries = manifest.entries ?? [];

  const hashes = entries.map((e) => e.contentHash);
  const catalogRows = hashes.length > 0
    ? await db
        .select({
          contentHash: reliquaryCatalogTable.contentHash,
          covenantHash: reliquaryCatalogTable.covenantHash,
          diskPath: reliquaryCatalogTable.diskPath,
        })
        .from(reliquaryCatalogTable)
        .where(inArray(reliquaryCatalogTable.contentHash, hashes))
    : [];

  const catalogMap = new Map(catalogRows.map((r) => [r.contentHash, r]));

  const artifacts = entries.map((entry) => {
    const catalogRow = catalogMap.get(entry.contentHash);
    const diskPath = catalogRow?.diskPath ?? '';
    const available = !!diskPath && existsSync(diskPath);

    // Verify on-disk integrity if available
    let integrityOk = false;
    if (available) {
      try {
        const content = readFileSync(diskPath);
        integrityOk = computeContentHash(content) === entry.contentHash;
      } catch {
        integrityOk = false;
      }
    }

    return {
      entry,
      available,
      covenantHash: catalogRow?.covenantHash ?? entry.covenantHash,
      integrityOk,
    };
  });

  return {
    snapshot: {
      snapshotHash,
      label: manifest.label,
      entries,
      createdAt: manifest.capturedAt,
      merkleRoot: manifest.merkleRoot,
    },
    artifacts,
  };
}

/**
 * Depth-aware provenance lineage traversal.
 * Returns immediate parents/children plus ancestors and descendants up to `depth` levels.
 */
export async function lineage(contentHash: string, depth = 3): Promise<LineageResult> {
  const parents: string[] = [];
  const children: string[] = [];
  const ancestors: string[] = [];
  const descendants: string[] = [];

  const parentEdges = await db
    .select()
    .from(reliquaryLineageEdgesTable)
    .where(eq(reliquaryLineageEdgesTable.childContentHash, contentHash));
  for (const e of parentEdges) parents.push(e.parentContentHash);

  const childEdges = await db
    .select()
    .from(reliquaryLineageEdgesTable)
    .where(eq(reliquaryLineageEdgesTable.parentContentHash, contentHash));
  for (const e of childEdges) children.push(e.childContentHash);

  // BFS upward for ancestors beyond immediate parents
  if (depth > 1) {
    const ancestorQueue = [...parents];
    const ancestorSeen = new Set<string>([contentHash, ...parents]);
    let level = 1;
    while (ancestorQueue.length > 0 && level < depth) {
      const current = ancestorQueue.shift()!;
      const edges = await db
        .select()
        .from(reliquaryLineageEdgesTable)
        .where(eq(reliquaryLineageEdgesTable.childContentHash, current));
      for (const e of edges) {
        if (!ancestorSeen.has(e.parentContentHash)) {
          ancestorSeen.add(e.parentContentHash);
          ancestors.push(e.parentContentHash);
          ancestorQueue.push(e.parentContentHash);
        }
      }
      level++;
    }

    // BFS downward for descendants beyond immediate children
    const descendantQueue = [...children];
    const descendantSeen = new Set<string>([contentHash, ...children]);
    level = 1;
    while (descendantQueue.length > 0 && level < depth) {
      const current = descendantQueue.shift()!;
      const edges = await db
        .select()
        .from(reliquaryLineageEdgesTable)
        .where(eq(reliquaryLineageEdgesTable.parentContentHash, current));
      for (const e of edges) {
        if (!descendantSeen.has(e.childContentHash)) {
          descendantSeen.add(e.childContentHash);
          descendants.push(e.childContentHash);
          descendantQueue.push(e.childContentHash);
        }
      }
      level++;
    }
  }

  return { contentHash, parents, children, depth, ancestors, descendants };
}

/**
 * Compute and persist a Merkle-root attestation over the current catalog.
 * Writes a proof_chain entry for durable governance audit trail.
 */
export async function attest(): Promise<AttestResult> {
  const rows = await db
    .select({ contentHash: reliquaryCatalogTable.contentHash })
    .from(reliquaryCatalogTable)
    .orderBy(asc(reliquaryCatalogTable.contentHash));

  const hashes = rows.map((r) => r.contentHash);
  const merkleRoot = computeMerkleRoot(hashes);
  const proofReceiptId = `attest-${merkleRoot.slice(0, 12)}-${Date.now()}`;

  const [attestation] = await db
    .insert(reliquaryAttestationsTable)
    .values({
      merkleRoot,
      artifactCount: hashes.length,
      contentHashesSnapshot: hashes as unknown as Record<string, unknown>,
      proofReceiptId,
    })
    .returning();

  // Write to the platform Proof Ledger (proof_chain table) for durable audit trail
  let proofChainId: number | undefined;
  try {
    const [proofEntry] = await db
      .insert(proofChainTable)
      .values({
        contentId: proofReceiptId,
        contentType: 'reliquary_attestation',
        sourceClass: 'system_computed',
        confidenceScore: 1.0,
        correlationId: merkleRoot,
        serviceAttribution: 'a11oy-reliquary',
        inputSources: hashes.slice(0, 20) as unknown as Record<string, unknown>,
        metadata: {
          merkleRoot,
          artifactCount: hashes.length,
          attestationId: attestation?.id,
          doctrineRevision: 'doctrine-rev-007',
        } as Record<string, unknown>,
        exportSafetyState: 'safe',
        reviewState: 'approved',
      })
      .returning({ id: proofChainTable.id });
    proofChainId = proofEntry?.id;
  } catch {
    // Proof chain write is best-effort; attestation is still valid without it
  }

  return {
    merkleRoot,
    artifactCount: hashes.length,
    proofReceiptId,
    attestationId: attestation!.id,
    proofChainId,
  };
}

export async function getSovereignStatus(): Promise<SovereignStatus> {
  const [row] = await db
    .select()
    .from(reliquarySovereignStateTable)
    .orderBy(desc(reliquarySovereignStateTable.updatedAt))
    .limit(1);

  if (!row) return { active: false };
  return {
    active: row.active,
    activatedBy: row.activatedBy,
    reason: row.reason,
    activatedAt: row.activatedAt?.toISOString() ?? null,
  };
}

export async function setSovereign(active: boolean, activatedBy: string, reason: string): Promise<SovereignStatus> {
  await db.insert(reliquarySovereignStateTable).values({
    active,
    activatedBy,
    reason,
    activatedAt: active ? new Date() : null,
    deactivatedAt: active ? null : new Date(),
  });

  // Write audit trail to Proof Ledger
  try {
    await db.insert(proofChainTable).values({
      contentId: `sovereign-${active ? 'activate' : 'deactivate'}-${Date.now()}`,
      contentType: 'reliquary_sovereign_toggle',
      sourceClass: 'human_authored',
      confidenceScore: 1.0,
      correlationId: activatedBy,
      serviceAttribution: 'a11oy-reliquary',
      metadata: {
        active,
        activatedBy,
        reason,
        timestamp: new Date().toISOString(),
      } as Record<string, unknown>,
      exportSafetyState: 'safe',
      reviewState: 'approved',
    });
  } catch {
    // Best-effort
  }

  return getSovereignStatus();
}

export async function verifyAttestation(attestationId: number): Promise<{ match: boolean; storedRoot: string; computedRoot: string }> {
  const [row] = await db
    .select()
    .from(reliquaryAttestationsTable)
    .where(eq(reliquaryAttestationsTable.id, attestationId))
    .limit(1);

  if (!row) throw Object.assign(new Error(`Attestation ${attestationId} not found`), { code: 'NOT_FOUND' });

  const storedHashes = row.contentHashesSnapshot as string[];
  const computedRoot = computeMerkleRoot(storedHashes);
  const match = computedRoot === row.merkleRoot;

  await db
    .update(reliquaryAttestationsTable)
    .set({ verifiedAt: new Date(), verificationResult: match ? 'pass' : 'fail' })
    .where(eq(reliquaryAttestationsTable.id, attestationId));

  return { match, storedRoot: row.merkleRoot, computedRoot };
}
