#!/usr/bin/env node
/**
 * Backstage Catalog Validation Script
 *
 * Uses @backstage/catalog-model to run the same schema and policy checks
 * that a real Backstage backend applies when importing catalog entities.
 *
 * Policies applied (from @backstage/catalog-model):
 *   SchemaValidEntityPolicy — JSON-Schema validation per kind
 *   FieldFormatEntityPolicy — name/namespace/owner ref format
 *   NoForeignRootFieldsEntityPolicy — no unknown top-level YAML keys
 *
 * Usage:
 *   node platform/backstage/scripts/validate-catalog.mjs
 *   pnpm --filter @szl-holdings/backstage catalog:validate
 */

// @backstage/catalog-model ships as CJS; use createRequire so this ESM
// script can import it without --experimental-vm-modules.
import { createRequire } from 'module';
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const yaml = require('js-yaml');
const {
  SchemaValidEntityPolicy,
  FieldFormatEntityPolicy,
  NoForeignRootFieldsEntityPolicy,
  EntityPolicies,
} = require('@backstage/catalog-model');

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../..');

// Combined Backstage entity policy (same set Backstage backend applies)
const entityPolicy = EntityPolicies.allOf([
  new NoForeignRootFieldsEntityPolicy(),
  new SchemaValidEntityPolicy(),
  new FieldFormatEntityPolicy(),
]);

// SZL-specific cross-entity checks (not covered by schema alone)
const VALID_TYPES = [
  'website', 'service', 'library', 'worker', 'mobile', 'video', 'infrastructure',
];
const VALID_LIFECYCLES = ['production', 'experimental', 'deprecated'];
const VALID_OWNERS = [
  'group:platform-team', 'group:alloy-team', 'group:lyte-team', 'group:aegis-team',
  'group:domain-vessels', 'group:domain-terra', 'group:domain-counsel',
  'group:domain-carlota', 'group:mobile-team',
];
const SKIP_KINDS = new Set(['Location', 'Template']);

const SCAN_DIRS = ['artifacts', 'apps', 'services', 'workers', 'packages'];
const CATALOG_DIR = 'platform/backstage/catalog';
const TEMPLATE_DIRS = [
  'platform/backstage/templates/new-domain-api',
  'platform/backstage/templates/new-agent-worker',
  'platform/backstage/templates/new-domain-ui',
];

function findCatalogFiles(baseDir) {
  const files = [];
  const fullPath = join(repoRoot, baseDir);
  if (!existsSync(fullPath)) return files;
  for (const entry of readdirSync(fullPath)) {
    const entryPath = join(fullPath, entry);
    if (!statSync(entryPath).isDirectory()) continue;
    const catalogFile = join(entryPath, 'catalog-info.yaml');
    if (existsSync(catalogFile)) files.push(catalogFile);
  }
  return files;
}

function findYamlFiles(dir) {
  const fullPath = join(repoRoot, dir);
  if (!existsSync(fullPath)) return [];
  return readdirSync(fullPath)
    .filter(f => f.endsWith('.yaml') && f !== 'app-config.yaml')
    .map(f => join(fullPath, f));
}

const allFiles = [
  ...SCAN_DIRS.flatMap(findCatalogFiles),
  ...findYamlFiles(CATALOG_DIR),
  ...TEMPLATE_DIRS.map(d => join(repoRoot, d, 'template.yaml')).filter(existsSync),
];

let errors = 0, warnings = 0, checked = 0;

console.log(`\n🔍 Backstage Catalog Validation (using @backstage/catalog-model)`);
console.log(`   Checking ${allFiles.length} files...\n`);

async function validateFile(filePath) {
  const relPath = filePath.replace(repoRoot + '/', '');
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch (e) {
    console.log(`❌ ${relPath}: Cannot read — ${e.message}`);
    errors++;
    return;
  }

  // Split multi-document YAML on --- separator
  const docStrings = content.split(/^---\s*$/m).filter(s => s.trim());
  if (docStrings.length === 0) {
    console.log(`⚠️  ${relPath}: Empty file`);
    warnings++;
    return;
  }

  for (const docStr of docStrings) {
    let entity;
    try {
      entity = yaml.load(docStr);
    } catch (e) {
      console.log(`❌ ${relPath}: YAML parse error — ${e.message}`);
      errors++;
      continue;
    }

    if (!entity || typeof entity !== 'object') continue;
    const kind = entity.kind;
    const name = entity?.metadata?.name ?? '?';

    // Skip Location entities (they are references, not full entities)
    if (kind === 'Location') continue;

    // Template entities use Nunjucks syntax; validate header only
    if (kind === 'Template') {
      const label = `${relPath} [Template/${name}]`;
      checked++;
      if (!entity.apiVersion || !entity.metadata?.name || !entity.spec?.owner) {
        console.log(`❌ ${label}`);
        console.log(`     ERROR: Missing required Template fields (apiVersion, metadata.name, spec.owner)`);
        errors++;
      } else {
        console.log(`✅ ${label}`);
      }
      continue;
    }

    const label = `${relPath} [${kind}/${name}]`;
    checked++;

    // Run Backstage-native schema + field-format + no-foreign-fields policies
    try {
      await entityPolicy.enforce(entity);
    } catch (e) {
      console.log(`❌ ${label}`);
      console.log(`     ERROR (schema): ${e.message}`);
      errors++;
      continue;
    }

    // SZL-specific checks (business rules on top of schema)
    const fileWarnings = [];
    if (kind === 'Component') {
      const type = entity.spec?.type;
      if (type && !VALID_TYPES.includes(type)) {
        fileWarnings.push(`Non-canonical spec.type: ${type}`);
      }
      const lifecycle = entity.spec?.lifecycle;
      if (lifecycle && !VALID_LIFECYCLES.includes(lifecycle)) {
        fileWarnings.push(`Non-standard spec.lifecycle: ${lifecycle}`);
      }
      const owner = entity.spec?.owner;
      if (owner && !VALID_OWNERS.includes(owner)) {
        fileWarnings.push(`spec.owner not in canonical group list: ${owner}`);
      }
      const hasAnnotations = entity.metadata?.annotations &&
        Object.keys(entity.metadata.annotations).length > 0;
      if (!hasAnnotations) {
        fileWarnings.push('Missing metadata.annotations block');
      }
    }

    if (fileWarnings.length > 0) {
      console.log(`⚠️  ${label}`);
      fileWarnings.forEach(w => { console.log(`     WARN:  ${w}`); warnings++; });
    } else {
      console.log(`✅ ${label}`);
    }
  }
}

for (const filePath of allFiles) {
  await validateFile(filePath);
}

console.log(`\n──────────────────────────────────────────────`);
console.log(`Checked : ${checked} entities in ${allFiles.length} files`);
console.log(`Errors  : ${errors}`);
console.log(`Warnings: ${warnings}`);
console.log(`Validator: @backstage/catalog-model@${require('@backstage/catalog-model/package.json').version}`);

if (errors > 0) {
  console.log(`\n❌ Validation FAILED — ${errors} error(s) found.\n`);
  process.exit(1);
} else {
  console.log(`\n✅ Validation PASSED${warnings > 0 ? ` (${warnings} warning(s))` : ' — clean'}.\n`);
  process.exit(0);
}
