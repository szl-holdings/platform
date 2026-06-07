export interface UsdAttribute {
  name: string;
  type:
    | 'float'
    | 'double'
    | 'int'
    | 'bool'
    | 'string'
    | 'token'
    | 'float3'
    | 'quatf'
    | 'matrix4d'
    | 'asset';
  value: unknown;
  custom?: boolean;
  variability?: 'varying' | 'uniform';
}

export interface UsdPrim {
  path: string;
  typeName: string;
  attributes: UsdAttribute[];
  children?: UsdPrim[];
  references?: string[];
  metadata?: Record<string, unknown>;
}

export interface UsdStage {
  defaultPrim: string;
  upAxis?: 'Y' | 'Z';
  metersPerUnit?: number;
  prims: UsdPrim[];
  metadata?: Record<string, unknown>;
}

export function serializeToUsda(stage: UsdStage): string {
  const lines: string[] = [];

  lines.push(`#usda 1.0`);
  lines.push(`(`);
  lines.push(`    defaultPrim = "${stage.defaultPrim}"`);
  if (stage.upAxis) lines.push(`    upAxis = "${stage.upAxis}"`);
  if (stage.metersPerUnit !== undefined) lines.push(`    metersPerUnit = ${stage.metersPerUnit}`);
  if (stage.metadata) {
    for (const [key, value] of Object.entries(stage.metadata)) {
      lines.push(`    ${key} = ${formatUsdValue(value)}`);
    }
  }
  lines.push(`)`);
  lines.push(``);

  for (const prim of stage.prims) {
    lines.push(...serializePrim(prim, 0));
  }

  return lines.join('\n');
}

function serializePrim(prim: UsdPrim, indent: number): string[] {
  const lines: string[] = [];
  const pad = '    '.repeat(indent);

  lines.push(
    `${pad}def ${prim.typeName} "${prim.path.split('/').pop()}"${prim.references?.length ? ` (references = [${prim.references.map((r) => `@${r}@`).join(', ')}])` : ''}`,
  );
  lines.push(`${pad}{`);

  for (const attr of prim.attributes) {
    const customStr = attr.custom ? 'custom ' : '';
    const varStr = attr.variability === 'uniform' ? 'uniform ' : '';
    lines.push(
      `${pad}    ${customStr}${varStr}${attr.type} ${attr.name} = ${formatUsdValue(attr.value)}`,
    );
  }

  if (prim.children?.length) {
    lines.push(``);
    for (const child of prim.children) {
      lines.push(...serializePrim(child, indent + 1));
    }
  }

  lines.push(`${pad}}`);
  lines.push(``);
  return lines;
}

function formatUsdValue(value: unknown): string {
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (Array.isArray(value)) {
    if (value.length === 3 && value.every((v) => typeof v === 'number')) {
      return `(${value.join(', ')})`;
    }
    return `[${value.map((v) => formatUsdValue(v)).join(', ')}]`;
  }
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return `"${String(value ?? '')}"`;
}

export interface UsdExportResult {
  format: 'usda' | 'usdz';
  content: string;
  entityId: string;
  entityType: string;
  exportedAt: string;
  primCount: number;
  fileSizeBytes: number;
  warnings: string[];
}

export function buildExportResult(
  stage: UsdStage,
  entityId: string,
  entityType: string,
  warnings: string[] = [],
): UsdExportResult {
  const content = serializeToUsda(stage);
  const primCount = countPrims(stage.prims);
  return {
    format: 'usda',
    content,
    entityId,
    entityType,
    exportedAt: new Date().toISOString(),
    primCount,
    fileSizeBytes: Buffer.byteLength(content, 'utf8'),
    warnings,
  };
}

function countPrims(prims: UsdPrim[]): number {
  return prims.reduce((sum, p) => sum + 1 + countPrims(p.children ?? []), 0);
}
