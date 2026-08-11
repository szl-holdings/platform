import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildPublicSurfaceManifest,
  type PublicSurface,
  type PublicSurfaceRegistry,
  validatePublicSurfaceObservationFreshness,
  validatePublicSurfaceRegistry,
  verifyLivePublicSurfaces,
} from './public-surfaces.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const REGISTRY = path.join(ROOT, 'config', 'public-surfaces.json');
const OUTPUT = path.join(ROOT, 'artifacts', 'PUBLIC_SURFACES.json');

function serializeSurface(surface: PublicSurface): string {
  return JSON.stringify(surface).replace(/"audience":\[([^\]]*)\]/, (match, members: string) => {
    if (members.length === 0) return match;
    return `"audience":[${members.split(',').join(', ')}]`;
  });
}

export function serializeManifest(registry: PublicSurfaceRegistry): string {
  const manifest = buildPublicSurfaceManifest(registry);
  const summaryLines = JSON.stringify(manifest.summary, null, 2).split('\n');
  const formattedSummary = summaryLines.map((line, index) => {
    if (index === 0) return `  "summary": ${line}`;
    return `  ${line}`;
  });
  formattedSummary[formattedSummary.length - 1] += ',';

  const surfaceLines = manifest.surfaces.map(
    (surface, index) =>
      `    ${serializeSurface(surface)}${index === manifest.surfaces.length - 1 ? '' : ','}`,
  );

  return [
    '{',
    `  "schema": ${JSON.stringify(manifest.schema)},`,
    `  "generated_by": ${JSON.stringify(manifest.generated_by)},`,
    `  "observed_at": ${JSON.stringify(manifest.observed_at)},`,
    ...formattedSummary,
    '  "surfaces": [',
    ...surfaceLines,
    '  ]',
    '}',
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check');
  const verifyLive = process.argv.includes('--verify-live');
  const requireFreshObservation = process.argv.includes('--require-fresh-observation');
  const registry = JSON.parse(await readFile(REGISTRY, 'utf8')) as PublicSurfaceRegistry;
  const failures = [
    ...new Set([
      ...validatePublicSurfaceRegistry(registry),
      ...(requireFreshObservation ? validatePublicSurfaceObservationFreshness(registry) : []),
    ]),
  ];
  if (failures.length > 0) {
    throw new Error(`public surface registry invalid:\n- ${failures.join('\n- ')}`);
  }

  const serialized = serializeManifest(registry);
  if (check) {
    if (!existsSync(OUTPUT)) throw new Error('artifacts/PUBLIC_SURFACES.json is missing');
    const existing = await readFile(OUTPUT, 'utf8');
    if (existing !== serialized) throw new Error('artifacts/PUBLIC_SURFACES.json is stale');
  } else {
    await mkdir(path.dirname(OUTPUT), { recursive: true });
    await writeFile(OUTPUT, serialized, 'utf8');
  }

  if (verifyLive) {
    const liveFailures = await verifyLivePublicSurfaces(registry);
    if (liveFailures.length > 0) {
      throw new Error(`public surface live drift:\n- ${liveFailures.join('\n- ')}`);
    }
  }

  process.stdout.write(
    `${check ? 'public surface manifest: PASS' : 'artifacts/PUBLIC_SURFACES.json generated'}${
      verifyLive ? ' (live routes verified)' : ''
    }\n`,
  );
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]).toLowerCase() : '';
if (invokedPath === fileURLToPath(import.meta.url).toLowerCase()) {
  void main().catch((error: unknown) => {
    process.stderr.write(`public surface generation failed: ${String(error)}\n`);
    process.exit(1);
  });
}
