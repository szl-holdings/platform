/**
 * In-process registry of TypeScript Sentra detectors.
 *
 * Python detectors live in the sidecar and are persisted into
 * `sentra_detectors` with `runtime='python'` + `sidecar_base_url`; the
 * route layer calls them over HTTP instead of looking them up here.
 *
 * Keep this module side-effect-free (no DB writes) so it can be imported
 * from anywhere without coupling to drizzle.
 */
import { db, sentraDetectorsTable } from '@szl-holdings/db';
import { ReceiptChain } from '@szl-holdings/szl-receipts';
import type {
  Detector,
  DetectorContext,
  DetectorId,
  Finding,
} from '@szl-holdings/sentra-detector-sdk';

class DetectorRegistry {
  private detectors = new Map<DetectorId, Detector>();

  register(detector: Detector): void {
    this.detectors.set(detector.manifest.id, detector);
  }

  unregister(id: DetectorId): void {
    this.detectors.delete(id);
  }

  get(id: DetectorId): Detector | undefined {
    return this.detectors.get(id);
  }

  list(): Detector[] {
    return Array.from(this.detectors.values());
  }

  clear(): void {
    this.detectors.clear();
  }
}

const _global = globalThis as { __sentra_detector_registry__?: DetectorRegistry };
export const sentraDetectorRegistry: DetectorRegistry =
  _global.__sentra_detector_registry__ ?? (_global.__sentra_detector_registry__ = new DetectorRegistry());

/**
 * Default in-memory `read` adapter used in tests when no telemetry
 * source is wired. Production code overrides it per detector input.
 */
export function emptyContextRead(): (input: string) => Promise<unknown[]> {
  return async (_input: string) => [];
}

/**
 * Persist an in-process TS detector's manifest into `sentra_detectors`
 * so the public list / run routes can resolve it without a round-trip
 * through `/sentra/detectors/register`. Safe to call repeatedly — uses
 * an upsert so boot-time re-registration is idempotent.
 */
const bootChains = new Map<string, ReceiptChain>();
function bootChainFor(detectorId: string): ReceiptChain {
  let c = bootChains.get(detectorId);
  if (!c) {
    c = new ReceiptChain({ operatorId: `sentra/detector/${detectorId}` });
    bootChains.set(detectorId, c);
  }
  return c;
}

export async function persistRegisteredDetector(detector: Detector): Promise<void> {
  const m = detector.manifest;
  const now = new Date();
  // Boot-time auto-registration is still a write to sentra_detectors,
  // so it must emit a receipt to satisfy the framework's "every write
  // emits a receipt" invariant.
  const receipt = await bootChainFor(m.id).append({
    kind: 'sentra.detector.register',
    detectorId: m.id,
    runtime: m.runtime,
    version: m.version ?? null,
    source: 'boot',
    at: now.toISOString(),
  });
  await db
    .insert(sentraDetectorsTable)
    .values({
      id: m.id,
      label: m.label,
      description: m.description,
      kind: m.kind,
      runtime: m.runtime,
      inputs: m.inputs ?? [],
      costClass: m.costClass,
      governanceClass: m.governanceClass,
      attackTechniques: m.attackTechniques ?? null,
      version: m.version ?? null,
      sidecarBaseUrl: null,
      chainReceiptId: receipt.selfHash,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: sentraDetectorsTable.id,
      set: {
        label: m.label,
        description: m.description,
        kind: m.kind,
        runtime: m.runtime,
        inputs: m.inputs ?? [],
        costClass: m.costClass,
        governanceClass: m.governanceClass,
        attackTechniques: m.attackTechniques ?? null,
        version: m.version ?? null,
        chainReceiptId: receipt.selfHash,
        lastSeenAt: now,
      },
    });
}

/** Run a TS detector with a captured trace buffer. */
export async function runTsDetector(
  detector: Detector,
  base: Omit<DetectorContext, 'trace'>,
): Promise<{ findings: Finding[]; trace: Array<{ ts: string; msg: string; data?: Record<string, unknown> }> }> {
  const trace: Array<{ ts: string; msg: string; data?: Record<string, unknown> }> = [];
  const ctx: DetectorContext = {
    ...base,
    trace: (msg, data) => {
      trace.push({ ts: new Date().toISOString(), msg, ...(data ? { data } : {}) });
    },
  };
  const findings = await detector.evaluate(ctx);
  return { findings, trace };
}
