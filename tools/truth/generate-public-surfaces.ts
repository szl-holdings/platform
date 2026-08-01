import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildPublicSurfaceManifest,
  type PublicSurfaceRegistry,
  validatePublicSurfaceObservationFreshness,
  validatePublicSurfaceRegistry,
  verifyLivePublicSurfaces,
} from './public-surfaces.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const REGISTRY = path.join(ROOT, 'config', 'public-surfaces.json');
const OUTPUT = path.join(ROOT, 'artifacts', 'PUBLIC_SURFACES.json');

export function serializeManifest(registry: PublicSurfaceRegistry): string {
  const lines = JSON.stringify(buildPublicSurfaceManifest(registry), null, 2).split('\n');
  const formatted: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() !== '"audience": [') {
      formatted.push(line);
      continue;
    }

    const indent = line.slice(0, line.indexOf('"'));
    const audience: string[] = [];
    index += 1;
    while (index < lines.length && lines[index].trim() !== '],') {
      const encoded = lines[index].trim().replace(/,$/, '');
      audience.push(JSON.parse(encoded) as string);
      index += 1;
    }
    formatted.push(`${indent}"audience": [${audience.map(JSON.stringify).join(', ')}],`);
  }

  return `${formatted.join('\n')}\n`;
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
