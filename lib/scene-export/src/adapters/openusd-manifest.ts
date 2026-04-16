import type { OpenUSDManifest, ExportAdapterContract, ExportAdapterResult } from "../types.js";

const ADAPTER_NAME = "OpenUSDManifestAdapter";
const ADAPTER_VERSION = "1.0.0";

/**
 * OpenUSD Manifest Adapter — Stub
 *
 * This adapter generates a typed, serializable representation of an ATLAS scene
 * in the OpenUSD manifest format. It is a stub designed to document where true
 * OpenUSD, Omniverse, RTX, or NIM GPU infrastructure would plug in at a later stage.
 *
 * PRODUCTION INTEGRATION NOTES (for future implementors):
 *
 * 1. OpenUSD Runtime: Replace `serializeToUsdText()` below with calls to
 *    the NVIDIA USD Python bindings (pxr.Usd) or the OpenUSD C++ SDK.
 *    The `prims` array in OpenUSDManifest maps directly to USD Prim definitions.
 *
 * 2. Omniverse Nucleus: Upload the resulting .usda file to an Omniverse Nucleus
 *    server using the `omni.client` Python library or the Nucleus REST API.
 *    The `stage` field in OpenUSDManifest should be used as the Nucleus path.
 *
 * 3. RTX Renderer: Once staged in Nucleus, trigger an RTX render job via
 *    the Omniverse Farm Queue API (KitAppStreaming or OmniFarm) to produce
 *    visual snapshots of the ATLAS scene twin.
 *
 * 4. NIM (NVIDIA Inference Microservices): When ENABLE_NIM_PROVIDER is active,
 *    route scene-level inference tasks (spatial reasoning, anomaly detection on
 *    the scene graph) through a NIM endpoint. The `customLayerData.proofChainId`
 *    should be passed as a correlation header to NIM requests so that inference
 *    outputs are traceable back to the originating proof bundle.
 *
 * 5. USD Schema Registration: Register custom ATLAS schema attributes (drift score,
 *    proof chain ID, correlation ID) as USD API schemas via the USD schema generator
 *    to ensure type-safe layer composition in multi-layer ATLAS scenes.
 *
 * Current state: This adapter produces a valid JSON representation of the
 * manifest structure. The `serializeToUsdText()` method produces a minimal
 * USDA-compatible text stub. Full binary .usdc output requires the USD SDK.
 */

export interface OpenUSDManifestOutput {
  $schema: string;
  adapterVersion: string;
  format: "openusd_manifest";
  manifest: OpenUSDManifest;
  usdaText: string;
  integrationNotice: string;
  exportedAt: string;
}

function serializeToUsdText(manifest: OpenUSDManifest): string {
  const lines: string[] = [];
  lines.push(`#usda 1.0`);
  lines.push(`(`);
  lines.push(`    doc = """ATLAS Spatial Runtime — ${manifest.domain} scene export (stub)"""`);
  lines.push(`    metersPerUnit = 1`);
  lines.push(`    upAxis = "Y"`);
  lines.push(`)`);
  lines.push(``);

  for (const prim of manifest.prims) {
    lines.push(`def ${prim.typeName} "${prim.path.replace(/\//g, "_")}" (`);
    if (prim.metadata?.doc) {
      lines.push(`    doc = "${prim.metadata.doc}"`);
    }
    lines.push(`)`);
    lines.push(`{`);
    for (const [attr, def] of Object.entries(prim.attributes)) {
      const valueStr = typeof def.value === "string" ? `"${def.value}"` : String(def.value);
      lines.push(`    ${def.type} ${attr} = ${valueStr}`);
    }
    lines.push(`}`);
    lines.push(``);
  }

  return lines.join("\n");
}

export class OpenUSDManifestAdapter implements ExportAdapterContract<OpenUSDManifest, OpenUSDManifestOutput> {
  readonly adapterName = ADAPTER_NAME;
  readonly adapterVersion = ADAPTER_VERSION;
  readonly outputFormat = "openusd_manifest";

  validate(input: OpenUSDManifest): void {
    if (!input.stage) throw new Error("OpenUSDManifestAdapter: stage is required");
    if (!input.domain) throw new Error("OpenUSDManifestAdapter: domain is required");
    if (!Array.isArray(input.layers)) throw new Error("OpenUSDManifestAdapter: layers must be an array");
    if (!Array.isArray(input.prims)) throw new Error("OpenUSDManifestAdapter: prims must be an array");
  }

  serialize(input: OpenUSDManifest): OpenUSDManifestOutput {
    this.validate(input);

    const manifest: OpenUSDManifest = {
      ...input,
      customLayerData: {
        ...input.customLayerData,
        szlAtlasVersion: "1.0.0",
        exportedAt: new Date().toISOString(),
        notice:
          "ATLAS OpenUSD export stub. True OpenUSD/Omniverse/RTX/NIM integration requires NVIDIA USD SDK and Nucleus server. See adapter source for integration guidance.",
      },
    };

    return {
      $schema: "https://szlholdings.com/schemas/atlas/openusd-manifest/v1.json",
      adapterVersion: ADAPTER_VERSION,
      format: "openusd_manifest",
      manifest,
      usdaText: serializeToUsdText(manifest),
      integrationNotice:
        "This is a stub export. Production deployment requires NVIDIA OpenUSD SDK (pxr.Usd), Omniverse Nucleus for staging, RTX Farm for rendering, and NIM endpoints for spatial inference. See docs/architecture/atlas-spatial-runtime.md for the full integration roadmap.",
      exportedAt: new Date().toISOString(),
    };
  }

  toExportResult(input: OpenUSDManifest): ExportAdapterResult {
    const output = this.serialize(input);
    const json = JSON.stringify(output, null, 2);
    return {
      format: this.outputFormat,
      payload: output,
      sizeEstimateBytes: Buffer.byteLength(json, "utf8"),
      generatedAt: output.exportedAt,
      adapterVersion: ADAPTER_VERSION,
      warnings: [
        "OpenUSD output is a stub. Binary .usdc requires NVIDIA OpenUSD SDK.",
        "Omniverse Nucleus staging not performed — ENABLE_NIM_PROVIDER must be active in production.",
      ],
    };
  }
}

export function exportOpenUSDManifest(input: OpenUSDManifest): ExportAdapterResult {
  return new OpenUSDManifestAdapter().toExportResult(input);
}

export function buildOpenUSDManifest(params: {
  stage: string;
  domain: string;
  entityId?: string;
  proofChainId?: number | null;
  sceneState: Record<string, unknown>;
}): OpenUSDManifest {
  const prims = Object.entries(params.sceneState).map(([key, value]) => ({
    path: `/ATLAS/${params.domain}/${key}`,
    typeName: "Xform",
    attributes: {
      atlasKey: { type: "string", value: key },
      atlasValue: { type: "string", value: typeof value === "string" ? value : JSON.stringify(value) },
    },
  }));

  return {
    manifestVersion: "1.0",
    stage: params.stage,
    domain: params.domain,
    layers: [
      {
        identifier: `atlas_${params.domain}_root.usda`,
        layerType: "root",
        documentation: "Root layer generated by ATLAS Spatial Runtime",
      },
    ],
    prims,
    customLayerData: {
      szlAtlasVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
      domain: params.domain,
      entityId: params.entityId,
      proofChainId: params.proofChainId ?? null,
      notice: "",
    },
  };
}
