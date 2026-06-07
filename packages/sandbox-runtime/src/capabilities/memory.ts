/**
 * Sandbox Runtime — Memory Capability
 *
 * Cross-run workspace memory following the OpenAI contract:
 *
 * Session scope (within a run — ephemeral):
 *   - On session start: inject prior domain-scoped memory into MEMORY.md
 *   - During the run: agent can read/update MEMORY.md; lessons are written
 *     to both session scope (fast, in-process) and domain scope (persistent)
 *   - On session close: generate rollout summary, persist to domain scope
 *
 * Domain scope (cross-run — persists 90 days via memory-fabric):
 *   - Lessons from each run are written under key `sandbox.lessons.<key>`
 *   - The next session reads them back via defaultScopedMemoryManager.domain
 *
 * Local workspace files (for agent consumption):
 *   - MEMORY.md      — full memory context injected at session start
 *   - memory_summary.md — condensed prior summary for quick reference
 *   - .sandbox/sessions/<id>-rollout.json — serialised rollout record
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { validateWorkspacePath } from '../materializer.js';
import type { SandboxCapability } from '../types.js';

// Lazy import keeps the constructor fast and tests isolated
async function getScopedMemory() {
  const { defaultScopedMemoryManager } = await import('@workspace/memory-fabric');
  return defaultScopedMemoryManager;
}

const MEMORY_FILE = 'MEMORY.md';
const MEMORY_SUMMARY_FILE = 'memory_summary.md';
const SESSIONS_DIR = '.sandbox/sessions';
const MEMORIES_DIR = '.sandbox/memories';

const MEMORY_FABRIC_DOMAIN = 'sandbox';
const PRIOR_LESSONS_KEY = 'sandbox.prior.lessons';
const ROLLOUT_SUMMARY_KEY = 'sandbox.rollout.summary';

export interface MemoryCapabilityOptions {
  workspaceRoot: string;
  sessionId: string;
  /** Tenant org ID used to scope domain-level memory keys. */
  tenantId?: string;
  /** Prior memory summary to inject at session start (overrides fabric lookup). */
  priorMemorySummary?: string;
}

export interface MemoryLesson {
  lesson: string;
  context?: string;
  timestamp: number;
}

export interface RolloutSummary {
  sessionId: string;
  objective: string;
  lessons: MemoryLesson[];
  createdAt: number;
}

export class MemoryCapability implements SandboxCapability {
  readonly type = 'memory' as const;
  readonly description =
    'Cross-run workspace memory: read prior lessons on start, write new lessons to memory-fabric on close.';

  private readonly workspaceRoot: string;
  private readonly sessionId: string;
  private readonly tenantId: string;
  private readonly priorMemorySummaryOverride: string | undefined;

  constructor(opts: MemoryCapabilityOptions) {
    this.workspaceRoot = opts.workspaceRoot;
    this.sessionId = opts.sessionId;
    this.tenantId = opts.tenantId ?? 'system';
    this.priorMemorySummaryOverride = opts.priorMemorySummary;
  }

  // ─── Internal helpers ───────────────────────────────────────────────────────

  /** Domain-qualified key so tenants never read each other's memory. */
  private fabricKey(base: string): string {
    return `${base}.${this.tenantId}`;
  }

  /**
   * Read prior lessons from memory-fabric domain scope.
   * Falls back gracefully when fabric is unavailable.
   */
  private async readPriorLessonsFromFabric(): Promise<string | undefined> {
    try {
      const mem = await getScopedMemory();
      const entry = mem.domain.getByKey(this.fabricKey(PRIOR_LESSONS_KEY), MEMORY_FABRIC_DOMAIN);
      return typeof entry?.value === 'string' ? entry.value : undefined;
    } catch (err) {
      // memory-fabric is unavailable (e.g., test environment without DB).
      // Log so operations teams can detect persistence degradation.
      console.warn(
        `[MemoryCapability] memory-fabric read failed (session=${this.sessionId}):`,
        err instanceof Error ? err.message : String(err),
      );
      return undefined;
    }
  }

  /**
   * Write a lesson to both session scope (ephemeral) and domain scope
   * (persistent cross-run) in memory-fabric.
   */
  private async writeLessonToFabric(lesson: MemoryLesson): Promise<void> {
    try {
      const mem = await getScopedMemory();
      const value = JSON.stringify(lesson);

      mem.session.write({
        key: `sandbox.lesson.${this.sessionId}.${lesson.timestamp}`,
        value,
        sessionId: this.sessionId,
        domain: MEMORY_FABRIC_DOMAIN,
      });

      // Append to existing domain lessons (read-modify-write)
      const existingEntry = mem.domain.getByKey(
        this.fabricKey(PRIOR_LESSONS_KEY),
        MEMORY_FABRIC_DOMAIN,
      );
      const existingRaw = typeof existingEntry?.value === 'string' ? existingEntry.value : null;
      const existingLessons: MemoryLesson[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [...existingLessons.slice(-99), lesson]; // keep last 100

      mem.domain.write({
        key: this.fabricKey(PRIOR_LESSONS_KEY),
        value: JSON.stringify(updated),
        domain: MEMORY_FABRIC_DOMAIN,
      });
    } catch (err) {
      // Log fabric write failures — lesson is still captured in local MEMORY.md,
      // but cross-run persistence is degraded and ops teams need visibility.
      console.warn(
        `[MemoryCapability] memory-fabric lesson write failed (session=${this.sessionId}):`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  /**
   * Persist rollout summary to domain scope for cross-run recall.
   */
  private async writeRolloutToFabric(summary: RolloutSummary): Promise<void> {
    try {
      const mem = await getScopedMemory();
      mem.domain.write({
        key: this.fabricKey(ROLLOUT_SUMMARY_KEY),
        value: JSON.stringify(summary),
        domain: MEMORY_FABRIC_DOMAIN,
      });
      // End the session scope for this session ID (evict ephemeral entries)
      mem.endSession(this.sessionId);
    } catch (err) {
      // Log fabric write failures — rollout is still captured locally, but
      // cross-run recall for future sessions will be unavailable.
      console.warn(
        `[MemoryCapability] memory-fabric rollout write failed (session=${this.sessionId}):`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /** Initialize memory structure — injects prior summary into workspace. */
  async initialize(): Promise<void> {
    const sessionsPath = join(this.workspaceRoot, SESSIONS_DIR);
    const memoriesPath = join(this.workspaceRoot, MEMORIES_DIR);
    await mkdir(sessionsPath, { recursive: true });
    await mkdir(memoriesPath, { recursive: true });

    // Resolve prior memory: caller-provided override > memory-fabric domain > none
    const priorMemory =
      this.priorMemorySummaryOverride ?? (await this.readPriorLessonsFromFabric());

    const memoryPath = join(this.workspaceRoot, MEMORY_FILE);

    if (priorMemory) {
      // Deserialise lessons from fabric if stored as JSON array
      let formattedPrior = priorMemory;
      try {
        const lessons = JSON.parse(priorMemory) as unknown;
        if (Array.isArray(lessons)) {
          formattedPrior = lessons
            .map((l: unknown) => {
              const lesson = l as MemoryLesson;
              return `- [${new Date(lesson.timestamp).toISOString()}] ${lesson.lesson}`;
            })
            .join('\n');
        }
      } catch {
        // Already plain text — use as-is
      }

      const content = [
        '# Workspace Memory',
        '',
        '## Prior Session Lessons (from memory-fabric)',
        formattedPrior,
        '',
        '## Current Session Notes',
        `Session ID: ${this.sessionId}`,
        `Tenant: ${this.tenantId}`,
        `Started: ${new Date().toISOString()}`,
        '',
      ].join('\n');
      await writeFile(memoryPath, content, 'utf8');

      const summaryPath = join(this.workspaceRoot, MEMORY_SUMMARY_FILE);
      await writeFile(summaryPath, formattedPrior, 'utf8');
    } else {
      // Fresh memory — no prior context
      const content = [
        '# Workspace Memory',
        '',
        '## Current Session Notes',
        `Session ID: ${this.sessionId}`,
        `Tenant: ${this.tenantId}`,
        `Started: ${new Date().toISOString()}`,
        '',
        '_No prior session context available._',
        '',
      ].join('\n');
      await writeFile(memoryPath, content, 'utf8');
    }

    // Record session start in memory-fabric session scope
    try {
      const mem = await getScopedMemory();
      mem.session.write({
        key: `sandbox.session.start.${this.sessionId}`,
        value: JSON.stringify({
          sessionId: this.sessionId,
          tenantId: this.tenantId,
          startedAt: Date.now(),
          hasPriorContext: !!priorMemory,
        }),
        sessionId: this.sessionId,
        domain: MEMORY_FABRIC_DOMAIN,
      });
    } catch (err) {
      console.warn(
        `[MemoryCapability] memory-fabric session-start record failed (session=${this.sessionId}):`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  /** Read the current MEMORY.md content. */
  async readMemory(): Promise<string> {
    const memoryPath = validateWorkspacePath(MEMORY_FILE, this.workspaceRoot);
    try {
      return await readFile(memoryPath, 'utf8');
    } catch (err) {
      // ENOENT expected when MEMORY.md hasn't been initialised yet
      if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`[MemoryCapability] Unexpected error reading MEMORY.md:`, err.message);
      }
      return '';
    }
  }

  /**
   * Append a lesson to MEMORY.md AND persist to memory-fabric domain scope
   * for cross-run retrieval by future sessions.
   */
  async appendLesson(lesson: MemoryLesson): Promise<void> {
    const memoryPath = validateWorkspacePath(MEMORY_FILE, this.workspaceRoot);
    const existing = await this.readMemory();
    const entry = [
      '',
      `## Lesson (${new Date(lesson.timestamp).toISOString()})`,
      lesson.context ? `**Context:** ${lesson.context}` : '',
      lesson.lesson,
    ]
      .filter((l) => l !== '')
      .join('\n');

    await writeFile(memoryPath, existing + '\n' + entry, 'utf8');

    // Persist to memory-fabric for cross-run access
    await this.writeLessonToFabric(lesson);
  }

  /** Overwrite MEMORY.md with new content. */
  async writeMemory(content: string): Promise<void> {
    const memoryPath = validateWorkspacePath(MEMORY_FILE, this.workspaceRoot);
    await writeFile(memoryPath, content, 'utf8');
  }

  /**
   * Finalize session: save rollout summary to local workspace AND to
   * memory-fabric domain scope for cross-run persistence.
   * Called automatically by SandboxAgent on session close.
   */
  async finalize(objective: string, lessons: MemoryLesson[]): Promise<RolloutSummary> {
    const summary: RolloutSummary = {
      sessionId: this.sessionId,
      objective,
      lessons,
      createdAt: Date.now(),
    };

    // ── Local workspace record ───────────────────────────────────────────────
    const summaryPath = join(
      this.workspaceRoot,
      SESSIONS_DIR,
      `${this.sessionId}-rollout.json`,
    );
    await writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');

    if (lessons.length > 0) {
      const summaryContent = [
        `# Session Summary — ${this.sessionId}`,
        `Objective: ${objective}`,
        `Completed: ${new Date().toISOString()}`,
        '',
        '## Key Lessons',
        ...lessons.map((l, i) => `${i + 1}. ${l.lesson}`),
        '',
      ].join('\n');

      const memorySummaryPath = join(this.workspaceRoot, MEMORIES_DIR, `${this.sessionId}.md`);
      await writeFile(memorySummaryPath, summaryContent, 'utf8');

      const mainSummaryPath = validateWorkspacePath(MEMORY_SUMMARY_FILE, this.workspaceRoot);
      await writeFile(mainSummaryPath, summaryContent, 'utf8');
    }

    // ── memory-fabric persistence (domain scope) ─────────────────────────────
    await this.writeRolloutToFabric(summary);

    return summary;
  }

  /** Get the memory summary content for injection into the next session. */
  async getSummaryForNextSession(): Promise<string | undefined> {
    // Try local file first (faster)
    try {
      const mainSummaryPath = join(this.workspaceRoot, MEMORY_SUMMARY_FILE);
      return await readFile(mainSummaryPath, 'utf8');
    } catch {
      // Fall back to memory-fabric domain scope
      return await this.readPriorLessonsFromFabric();
    }
  }
}
