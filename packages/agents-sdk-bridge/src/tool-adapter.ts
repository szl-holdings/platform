/**
 * SzlToolAdapter — converts Tool Mesh manifests into @openai/agents tool() definitions.
 *
 * Each adapted tool:
 *   - Uses the manifest's name, description, and JSON-Schema-based input schema
 *   - Converts the manifest's inputSchema (JSON Schema) to a Zod schema so the SDK
 *     can generate a strict JSON schema for the model and validate inputs before invoke
 *   - Invokes through ToolMeshGateway.invoke() so governance, rate limiting,
 *     and tracing all apply
 */

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { tool } from '@openai/agents';
import { type ToolManifest, ToolMeshGateway, defaultToolRegistry } from '@workspace/tool-mesh';

export interface SzlToolAdapterOptions {
  /**
   * Gateway to use for tool invocations. Defaults to a new ToolMeshGateway with defaultToolRegistry.
   */
  gateway?: ToolMeshGateway;

  /**
   * Agent ID to pass as the callerId in gateway invocations. Used for audit trails.
   */
  agentId?: string;

  /**
   * Session ID to pass for audit traceability.
   */
  sessionId?: string;
}

type JsonSchemaNode = Record<string, unknown>;

/**
 * Convert a JSON Schema node to a Zod schema.
 * Handles the common types used in Tool Mesh manifests:
 * string, number, integer, boolean, array, and object.
 * Unknown or missing types fall back to z.unknown().
 */
function jsonSchemaNodeToZod(node: JsonSchemaNode): z.ZodTypeAny {
  const description = typeof node['description'] === 'string' ? node['description'] : undefined;

  const withDescription = (schema: z.ZodTypeAny): z.ZodTypeAny =>
    description ? schema.describe(description) : schema;

  const type = node['type'];

  if (type === 'string') {
    let s: z.ZodString = z.string();
    if (typeof node['minLength'] === 'number') s = s.min(node['minLength']);
    if (typeof node['maxLength'] === 'number') s = s.max(node['maxLength']);
    return withDescription(s);
  }

  if (type === 'number') {
    return withDescription(z.number());
  }

  if (type === 'integer') {
    return withDescription(z.number().int());
  }

  if (type === 'boolean') {
    return withDescription(z.boolean());
  }

  if (type === 'null') {
    return withDescription(z.null());
  }

  if (type === 'array') {
    const items = node['items'] as JsonSchemaNode | undefined;
    const itemSchema = items ? jsonSchemaNodeToZod(items) : z.unknown();
    return withDescription(z.array(itemSchema));
  }

  if (type === 'object' || node['properties']) {
    const properties = node['properties'] as Record<string, JsonSchemaNode> | undefined;
    const required = Array.isArray(node['required']) ? (node['required'] as string[]) : [];

    if (!properties || Object.keys(properties).length === 0) {
      return withDescription(z.record(z.unknown()));
    }

    const shape: Record<string, z.ZodTypeAny> = {};
    for (const [key, propNode] of Object.entries(properties)) {
      const propSchema = jsonSchemaNodeToZod(propNode as JsonSchemaNode);
      // OpenAI structured outputs require optional fields to also be nullable.
      // Required fields remain as-is; optional fields use .nullable().optional().
      shape[key] = required.includes(key) ? propSchema : propSchema.nullable().optional();
    }
    return withDescription(z.object(shape));
  }

  return withDescription(z.unknown());
}

/**
 * Convert a Tool Mesh manifest's inputSchema (JSON Schema) to a Zod schema
 * suitable for the SDK's tool() function.
 */
function manifestSchemaToZod(manifest: ToolManifest): z.ZodObject<z.ZodRawShape> {
  if (manifest.inputSchema && typeof manifest.inputSchema === 'object') {
    const schema = jsonSchemaNodeToZod(manifest.inputSchema as JsonSchemaNode);
    if (schema instanceof z.ZodObject) {
      return schema as z.ZodObject<z.ZodRawShape>;
    }
    // SDK tool parameters must be object-shaped; wrap non-object top-level schemas.
    return z.object({ input: schema });
  }

  // No inputSchema — accept a single freeform string input
  return z.object({ input: z.string().describe(`Input for ${manifest.name}`).optional() });
}

/**
 * Adapt a single Tool Mesh manifest into an SDK-compatible FunctionTool using
 * the official SDK tool() builder.
 */
export function adaptToolManifest(
  manifest: ToolManifest,
  gateway: ToolMeshGateway,
  opts: { agentId?: string; sessionId?: string } = {},
) {
  const zodSchema = manifestSchemaToZod(manifest);
  const approvalRequired = manifest.approvalRequired;
  const manifestId = manifest.id;
  const manifestDescription = manifest.description;
  const agentId = opts.agentId;
  const sessionId = opts.sessionId;

  return tool({
    name: manifestId,
    description: manifestDescription,
    parameters: zodSchema,
    needsApproval: async () => approvalRequired,
    execute: async (input) => {
      const result = await gateway.invoke(manifestId, input as unknown, {
        requestId: randomUUID(),
        agentId,
        sessionId,
      });

      if (!result.success) {
        throw new Error(result.error ?? `Tool ${manifestId} failed`);
      }

      return typeof result.output === 'string'
        ? result.output
        : JSON.stringify(result.output ?? '');
    },
  });
}

/**
 * SzlToolAdapter — adapts one or more Tool Mesh manifests into SDK tools.
 */
export class SzlToolAdapter {
  private readonly gateway: ToolMeshGateway;
  private readonly agentId?: string;
  private readonly sessionId?: string;

  constructor(options: SzlToolAdapterOptions = {}) {
    this.gateway = options.gateway ?? new ToolMeshGateway(defaultToolRegistry);
    this.agentId = options.agentId;
    this.sessionId = options.sessionId;
  }

  /**
   * Adapt a single manifest into an SDK FunctionTool.
   */
  adapt(manifest: ToolManifest) {
    return adaptToolManifest(manifest, this.gateway, {
      agentId: this.agentId,
      sessionId: this.sessionId,
    });
  }

  /**
   * Adapt all manifests from a list.
   */
  adaptAll(manifests: ToolManifest[]) {
    return manifests.map((m) => this.adapt(m));
  }

  /**
   * Look up manifests by tool ID from the registry and adapt them.
   */
  adaptByIds(toolIds: string[]) {
    return toolIds.flatMap((id) => {
      const manifest = defaultToolRegistry.get(id);
      if (!manifest) {
        console.warn(`[SzlToolAdapter] Tool not found in registry: ${id}`);
        return [];
      }
      return [this.adapt(manifest)];
    });
  }
}
