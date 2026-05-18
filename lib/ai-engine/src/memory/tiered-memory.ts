// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
/**
 * Tiered Memory — Three-Tier Architecture
 *
 * Adopts Claude Code's memory tier model:
 *   Tier 0: org-constitution   — immutable per release, sourced from mythosDoctrine + Constitution
 *   Tier 1: project-doctrine   — per-artifact CLAUDE.md-style file, writable by operators
 *   Tier 2: auto-memory        — learned, append-only, redactable, written by hooks
 *
 * Each tier has a clean read API and a write API. Auto-memory writes flow
 * through PostToolUse + PostSubagentReturn hooks with redaction support.
 * Every write produces a Proof Chain entry.
 */

import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemoryTierLabel = 'org-constitution' | 'project-doctrine' | 'auto-memory';

export interface TieredMemoryEntry {
  id: string;
  tier: MemoryTierLabel;
  key: string;
  content: string;
  artifact_id?: string;
  redacted: boolean;
  redaction_reason?: string;
  provenance: {
    written_by_hook?: string;
    written_on_event?: string;
    written_for_run?: string;
    session_id?: string;
    agent_id?: string;
  };
  proof_packet_id?: string;
  created_at: string;
  updated_at: string;
  version: number;
  diff?: string;
}

export interface MemoryReadResult {
  entries: TieredMemoryEntry[];
  total: number;
  tier: MemoryTierLabel;
}

export interface MemoryWriteResult {
  entry: TieredMemoryEntry;
  proof_packet_id: string;
  is_new: boolean;
}

// ---------------------------------------------------------------------------
// Proof Chain integration
// ---------------------------------------------------------------------------

async function emitMemoryProof(entry: TieredMemoryEntry, operation: 'write' | 'redact'): Promise<string> {
  const proofId = `mem-proof-${randomUUID()}`;
  const { tagAIContent } = await import('@szl-holdings/proof-chain');
  await tagAIContent({
    contentId: proofId,
    contentType: 'memory_operation',
    sourceClass: 'system_computed',
    correlationId: entry.provenance.session_id ?? 'unknown',
    serviceAttribution: entry.provenance.written_by_hook ?? 'memory-manager',
    metadata: {
      tier: entry.tier,
      key: entry.key,
      operation,
      agent_id: entry.provenance.agent_id,
      event: entry.provenance.written_on_event,
      run_id: entry.provenance.written_for_run,
    },
  });
  return proofId;
}

// ---------------------------------------------------------------------------
// In-memory stores per tier
// ---------------------------------------------------------------------------

const orgConstitutionStore = new Map<string, TieredMemoryEntry>();
const projectDoctrineStore = new Map<string, TieredMemoryEntry>(); // keyed by `${artifactId}:${key}`
const autoMemoryStore = new Map<string, TieredMemoryEntry>();

const MAX_AUTO_MEMORY = 10_000;

// ---------------------------------------------------------------------------
// Org Constitution (Tier 0) — immutable, seeded from mythosDoctrine
// ---------------------------------------------------------------------------

export function seedOrgConstitution(entries: Array<{ key: string; content: string }>): void {
  for (const { key, content } of entries) {
    const existing = orgConstitutionStore.get(key);
    if (existing) continue; // immutable once seeded per release
    orgConstitutionStore.set(key, {
      id: randomUUID(),
      tier: 'org-constitution',
      key,
      content,
      redacted: false,
      provenance: { written_by_hook: 'system:seed', written_on_event: 'SessionStart' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    });
  }
}

export function readOrgConstitution(keys?: string[]): MemoryReadResult {
  const all = Array.from(orgConstitutionStore.values());
  const entries = keys ? all.filter(e => keys.includes(e.key)) : all;
  return { entries, total: entries.length, tier: 'org-constitution' };
}

// ---------------------------------------------------------------------------
// Project Doctrine (Tier 1) — per-artifact, operator-writable
// ---------------------------------------------------------------------------

export async function writeProjectDoctrine(params: {
  artifact_id: string;
  key: string;
  content: string;
  agent_id?: string;
  session_id?: string;
}): Promise<MemoryWriteResult> {
  const storeKey = `${params.artifact_id}:${params.key}`;
  const existing = projectDoctrineStore.get(storeKey);
  const diff = existing
    ? `- ${existing.content.slice(0, 200)}\n+ ${params.content.slice(0, 200)}`
    : undefined;

  const entry: TieredMemoryEntry = {
    id: existing?.id ?? randomUUID(),
    tier: 'project-doctrine',
    key: params.key,
    content: params.content,
    artifact_id: params.artifact_id,
    redacted: false,
    provenance: {
      written_by_hook: 'operator',
      written_on_event: 'manual',
      agent_id: params.agent_id,
      session_id: params.session_id,
    },
    created_at: existing?.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: (existing?.version ?? 0) + 1,
    diff,
  };

  projectDoctrineStore.set(storeKey, entry);
  const proof_packet_id = await emitMemoryProof(entry, 'write');
  entry.proof_packet_id = proof_packet_id;

  return { entry, proof_packet_id, is_new: !existing };
}

export function readProjectDoctrine(artifact_id: string, keys?: string[]): MemoryReadResult {
  const prefix = `${artifact_id}:`;
  const all = Array.from(projectDoctrineStore.values()).filter(e => e.artifact_id === artifact_id);
  const entries = keys ? all.filter(e => keys.includes(e.key)) : all;
  return { entries, total: entries.length, tier: 'project-doctrine' };
}

// ---------------------------------------------------------------------------
// Auto-Memory (Tier 2) — append-only, redactable, hook-written
// ---------------------------------------------------------------------------

export async function writeAutoMemory(params: {
  key: string;
  content: string;
  written_by_hook: string;
  written_on_event: string;
  written_for_run?: string;
  session_id?: string;
  agent_id?: string;
}): Promise<MemoryWriteResult> {
  if (autoMemoryStore.size >= MAX_AUTO_MEMORY) {
    const oldest = autoMemoryStore.keys().next().value;
    if (oldest) autoMemoryStore.delete(oldest);
  }

  const entry: TieredMemoryEntry = {
    id: randomUUID(),
    tier: 'auto-memory',
    key: params.key,
    content: params.content,
    redacted: false,
    provenance: {
      written_by_hook: params.written_by_hook,
      written_on_event: params.written_on_event,
      written_for_run: params.written_for_run,
      session_id: params.session_id,
      agent_id: params.agent_id,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  };

  autoMemoryStore.set(entry.id, entry);
  const proof_packet_id = await emitMemoryProof(entry, 'write');
  entry.proof_packet_id = proof_packet_id;

  return { entry, proof_packet_id, is_new: true };
}

export async function redactAutoMemory(id: string, reason: string): Promise<{ success: boolean; proof_packet_id?: string }> {
  const entry = autoMemoryStore.get(id);
  if (!entry) return { success: false };

  entry.redacted = true;
  entry.redaction_reason = reason;
  entry.content = '[REDACTED]';
  entry.updated_at = new Date().toISOString();
  entry.version++;

  const proof_packet_id = await emitMemoryProof(entry, 'redact');
  entry.proof_packet_id = proof_packet_id;

  return { success: true, proof_packet_id };
}

export function readAutoMemory(options: {
  session_id?: string;
  agent_id?: string;
  include_redacted?: boolean;
  limit?: number;
} = {}): MemoryReadResult {
  let entries = Array.from(autoMemoryStore.values());
  if (options.session_id) entries = entries.filter(e => e.provenance.session_id === options.session_id);
  if (options.agent_id) entries = entries.filter(e => e.provenance.agent_id === options.agent_id);
  if (!options.include_redacted) entries = entries.filter(e => !e.redacted);
  entries = entries.sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (options.limit) entries = entries.slice(0, options.limit);
  return { entries, total: entries.length, tier: 'auto-memory' };
}

// ---------------------------------------------------------------------------
// Unified read across all tiers
// ---------------------------------------------------------------------------

export function readAllTiers(options: {
  artifact_id?: string;
  session_id?: string;
  agent_id?: string;
  include_redacted?: boolean;
  limit_per_tier?: number;
}): {
  org_constitution: MemoryReadResult;
  project_doctrine: MemoryReadResult;
  auto_memory: MemoryReadResult;
} {
  return {
    org_constitution: readOrgConstitution(),
    project_doctrine: options.artifact_id
      ? readProjectDoctrine(options.artifact_id)
      : (() => {
          const all = Array.from(projectDoctrineStore.values());
          return { entries: all, total: all.length, tier: 'project-doctrine' as const };
        })(),
    auto_memory: readAutoMemory({
      session_id: options.session_id,
      agent_id: options.agent_id,
      include_redacted: options.include_redacted,
      limit: options.limit_per_tier,
    }),
  };
}

export function getMemoryStats(): {
  org_constitution: number;
  project_doctrine: number;
  auto_memory: number;
  auto_memory_redacted: number;
} {
  const autoAll = Array.from(autoMemoryStore.values());
  return {
    org_constitution: orgConstitutionStore.size,
    project_doctrine: projectDoctrineStore.size,
    auto_memory: autoAll.filter(e => !e.redacted).length,
    auto_memory_redacted: autoAll.filter(e => e.redacted).length,
  };
}
