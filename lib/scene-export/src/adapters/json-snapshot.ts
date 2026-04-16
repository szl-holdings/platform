import type { SceneSnapshot, ExportAdapterContract, ExportAdapterResult } from "../types.js";

const ADAPTER_NAME = "JsonSnapshotAdapter";
const ADAPTER_VERSION = "1.0.0";

export interface JsonSnapshotOutput {
  $schema: string;
  adapterVersion: string;
  format: "json_snapshot";
  snapshot: SceneSnapshot;
  exportedAt: string;
}

export class JsonSnapshotAdapter implements ExportAdapterContract<SceneSnapshot, JsonSnapshotOutput> {
  readonly adapterName = ADAPTER_NAME;
  readonly adapterVersion = ADAPTER_VERSION;
  readonly outputFormat = "json_snapshot";

  validate(input: SceneSnapshot): void {
    if (!input.sceneId) throw new Error("JsonSnapshotAdapter: sceneId is required");
    if (!input.domain) throw new Error("JsonSnapshotAdapter: domain is required");
    if (!input.capturedAt) throw new Error("JsonSnapshotAdapter: capturedAt is required");
    if (!input.state || typeof input.state !== "object") {
      throw new Error("JsonSnapshotAdapter: state must be a non-null object");
    }
  }

  serialize(input: SceneSnapshot): JsonSnapshotOutput {
    this.validate(input);
    return {
      $schema: "https://szlholdings.com/schemas/atlas/scene-snapshot/v1.json",
      adapterVersion: ADAPTER_VERSION,
      format: "json_snapshot",
      snapshot: {
        sceneId: input.sceneId,
        domain: input.domain,
        entityType: input.entityType,
        entityId: input.entityId,
        capturedAt: input.capturedAt,
        state: input.state,
        driftScore: input.driftScore,
        proofChainId: input.proofChainId ?? null,
        correlationId: input.correlationId ?? null,
        metadata: input.metadata ?? {},
      },
      exportedAt: new Date().toISOString(),
    };
  }

  toExportResult(input: SceneSnapshot): ExportAdapterResult {
    const output = this.serialize(input);
    const json = JSON.stringify(output, null, 2);
    return {
      format: this.outputFormat,
      payload: output,
      sizeEstimateBytes: Buffer.byteLength(json, "utf8"),
      generatedAt: output.exportedAt,
      adapterVersion: ADAPTER_VERSION,
    };
  }
}

export function exportJsonSnapshot(input: SceneSnapshot): ExportAdapterResult {
  return new JsonSnapshotAdapter().toExportResult(input);
}
