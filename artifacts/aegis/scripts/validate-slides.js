import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const manifestPath = resolve(root, 'src/data/slides-manifest.json');

let errors = 0;

function fail(_msg) {
  errors++;
}

if (!existsSync(manifestPath)) {
  fail('slides-manifest.json not found at src/data/slides-manifest.json');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
} catch (e) {
  fail(`slides-manifest.json is invalid JSON: ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(manifest)) {
  fail('slides-manifest.json must be an array');
  process.exit(1);
}

const ids = new Set();
const positions = new Set();

manifest.forEach((entry, i) => {
  if (!entry.id) fail(`Entry ${i}: missing 'id'`);
  if (!entry.position) fail(`Entry ${i}: missing 'position'`);
  if (!entry.filepath) fail(`Entry ${i}: missing 'filepath'`);
  if (!entry.title) fail(`Entry ${i}: missing 'title'`);

  if (ids.has(entry.id)) fail(`Duplicate id: ${entry.id}`);
  ids.add(entry.id);

  if (positions.has(entry.position)) fail(`Duplicate position: ${entry.position}`);
  positions.add(entry.position);

  const fullPath = resolve(root, entry.filepath);
  if (!existsSync(fullPath)) {
    fail(`Slide file not found: ${entry.filepath} (resolved: ${fullPath})`);
  }
});

const sorted = [...positions].sort((a, b) => a - b);
for (let i = 0; i < sorted.length; i++) {
  if (sorted[i] !== i + 1) {
    fail(`Positions must be contiguous from 1. Got: ${sorted.join(', ')}`);
    break;
  }
}

if (errors === 0) {
  process.exit(0);
} else {
  process.exit(1);
}
