import type { ToolManifest } from './manifest.js';
import type { ToolRegistry } from './registry.js';

export interface GeneratedStub {
  toolId: string;
  functionName: string;
  signature: string;
  javaScript: string;
}

export interface StubGenerationResult {
  stubs: GeneratedStub[];
  preamble: string;
  fullSource: string;
}

function safeIdentifier(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^([0-9])/, '_$1');
}

function schemaToTsType(schema: Record<string, unknown> | undefined, depth = 0): string {
  if (!schema) return 'unknown';
  if (depth > 5) return 'unknown';

  const type = schema.type as string | undefined;

  if (type === 'string') return 'string';
  if (type === 'number' || type === 'integer') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'null') return 'null';

  if (type === 'array') {
    const items = schema.items as Record<string, unknown> | undefined;
    const itemType = schemaToTsType(items, depth + 1);
    return `${itemType}[]`;
  }

  if (type === 'object') {
    const props = schema.properties as Record<string, Record<string, unknown>> | undefined;
    const required = (schema.required as string[] | undefined) ?? [];
    if (!props || Object.keys(props).length === 0) return 'Record<string, unknown>';
    const fields = Object.entries(props)
      .map(([k, v]) => {
        const opt = required.includes(k) ? '' : '?';
        return `${k}${opt}: ${schemaToTsType(v as Record<string, unknown>, depth + 1)}`;
      })
      .join('; ');
    return `{ ${fields} }`;
  }

  return 'unknown';
}

function buildInputType(manifest: ToolManifest): string {
  const schema = manifest.inputSchema;
  if (!schema) return 'Record<string, unknown>';
  return schemaToTsType(schema as Record<string, unknown>);
}

function buildOutputType(manifest: ToolManifest): string {
  const schema = manifest.outputSchema;
  if (!schema) return 'unknown';
  return schemaToTsType(schema as Record<string, unknown>);
}

export function generateStub(manifest: ToolManifest): GeneratedStub {
  const functionName = safeIdentifier(manifest.id);
  const inputType = buildInputType(manifest);
  const outputType = buildOutputType(manifest);

  const signature = `function ${functionName}(args: ${inputType}): Promise<${outputType}>`;

  const javaScript = [
    `/** [${manifest.domainTags.join(', ')}] ${manifest.description} */`,
    `async function ${functionName}(args) {`,
    `  return __mcp_call(${JSON.stringify(manifest.id)}, args);`,
    `}`,
  ].join('\n');

  return { toolId: manifest.id, functionName, signature, javaScript };
}

export function generateStubs(manifests: ToolManifest[]): StubGenerationResult {
  const stubs = manifests.map(generateStub);

  const preamble = [
    '// Auto-generated tool stubs — do not edit manually',
    '// Each function routes through the MCP tool-mesh gateway via __mcp_call(toolId, args)',
    '',
    ...stubs.map((s) => s.signature + ';'),
  ].join('\n');

  // Include TypeScript type signatures as comments so model-authored scripts
  // have full type information when writing against these stubs. The sandbox
  // executes JavaScript but the TypeScript signatures act as inline documentation
  // that guides models toward correctly-typed argument shapes.
  const fullSource = [
    '// MCP Code-Mode Sandbox — generated tool stubs',
    '// TypeScript signatures (for type reference):',
    ...stubs.map((s) => `//   ${s.signature};`),
    '',
    stubs.map((s) => s.javaScript).join('\n\n'),
  ].join('\n');

  return { stubs, preamble, fullSource };
}

export function generateStubsForIds(
  toolIds: string[],
  registry: ToolRegistry,
): StubGenerationResult {
  const manifests: ToolManifest[] = [];
  for (const id of toolIds) {
    const m = registry.getToolDetails(id);
    if (m) manifests.push(m);
  }
  return generateStubs(manifests);
}

export function generateStubsForQuery(
  query: string,
  registry: ToolRegistry,
  limit = 20,
): StubGenerationResult {
  const results = registry.searchTools(query, { limit });
  const ids = results.map((r) => r.toolId);
  return generateStubsForIds(ids, registry);
}
