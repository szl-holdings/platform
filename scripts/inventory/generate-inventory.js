#!/usr/bin/env node
/**
 * Inventory Generator — SZL Holdings Platform
 * Rehaul Phase 0: generates audit/runtime/project-inventory.json and
 * audit/runtime/project-inventory.md from the live filesystem.
 *
 * Run: node scripts/inventory/generate-inventory.js
 */

import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = resolve(new URL('.', import.meta.url).pathname, '../..');
const OUT_DIR = join(ROOT, 'audit', 'runtime');
const JSON_OUT = join(OUT_DIR, 'project-inventory.json');
const MD_OUT = join(OUT_DIR, 'project-inventory.md');

// ---------- helpers ----------

function isDir(p) {
  try { return statSync(p).isDirectory(); } catch { return false; }
}

function listDirs(base) {
  if (!existsSync(base)) return [];
  return readdirSync(base).filter(n => isDir(join(base, n)));
}

function listFiles(base, ext) {
  if (!existsSync(base)) return [];
  return readdirSync(base, { recursive: true })
    .filter(f => typeof f === 'string' && (ext ? f.endsWith(ext) : true));
}

// ---------- artifact status lookup (from docs/APP_STATUS.md) ----------
const KNOWN_STATUS = {
  'szl-holdings':       'alpha-working',
  'a11oy':              'alpha-working',
  'api-server':         'live',
  'command':            'alpha-partial',
  'sentra':             'alpha-working',
  'counsel':            'alpha-working',
  'terra':              'alpha-working',
  'vessels':            'alpha-partial',
  'carlota-jo':         'alpha-working',
  'pulse':              'alpha-working',
  'aegis':              'alpha-working',
  'lyte-command-center':'alpha-working',
  'szl-demo-video':     'live',
  'szl-holdings-mobile':'alpha-partial',
  'mockup-sandbox':     'internal-only',
  'pluginmesh':         'internal-only',
  'helios':             'internal-only',
};

const BRAND_NAMES = {
  'szl-holdings':        'SZL Holdings Dashboard',
  'a11oy':               'A11oy — Brand Orchestration Layer',
  'api-server':          'API Server',
  'command':             'Unified Command (FORGE)',
  'sentra':              'TENAX — Cyber Resilience',
  'counsel':             'Counsel — Legal Matter Command',
  'terra':               'DOMAINE — Real Estate Intelligence',
  'vessels':             'SEXTANT — Maritime Intelligence',
  'carlota-jo':          'Carlota Jo Consulting',
  'pulse':               'LUMINA — AI Executive Briefing',
  'aegis':               'PARAGON (investor pitch + ATLAS)',
  'lyte-command-center': 'KORA — Decision Intelligence',
  'szl-demo-video':      'SZL Holdings Demo Video',
  'szl-holdings-mobile': 'APEX — Mobile Command',
  'mockup-sandbox':      'PRAXIS — Unified Agentic AI Layer',
  'pluginmesh':          'PluginMesh',
  'helios':              'Helios',
};

const KINDS = {
  'szl-demo-video':      'video',
  'szl-holdings-mobile': 'mobile',
  'mockup-sandbox':      'design',
};

const PREVIEW_PATHS = {
  'szl-holdings':        '/',
  'a11oy':               '/a11oy/',
  'api-server':          '/api/',
  'command':             '/command/',
  'sentra':              '/sentra/',
  'counsel':             '/counsel/',
  'terra':               '/terra/',
  'vessels':             '/vessels/',
  'carlota-jo':          '/carlota-jo/',
  'pulse':               '/pulse/',
  'aegis':               '/aegis/',
  'lyte-command-center': '/lyte/',
  'szl-demo-video':      '/szl-demo-video/',
  'szl-holdings-mobile': '/szl-holdings-mobile/',
  'mockup-sandbox':      '/nexus/',
};

// registered = visible in platform preview pane (excludes helios and pluginmesh)
const REGISTERED = new Set([
  'szl-holdings', 'a11oy', 'api-server', 'command', 'sentra', 'counsel',
  'terra', 'vessels', 'carlota-jo', 'pulse', 'aegis', 'lyte-command-center',
  'szl-demo-video', 'szl-holdings-mobile', 'mockup-sandbox',
]);

// no workflow (no runtime entry)
const NO_WORKFLOW = new Set(['helios']);

// ---------- collect artifacts ----------
function collectArtifacts() {
  const dirs = listDirs(join(ROOT, 'artifacts'));
  return dirs.map(name => ({
    dir: `artifacts/${name}`,
    brand: BRAND_NAMES[name] ?? name,
    kind: KINDS[name] ?? 'web',
    preview: PREVIEW_PATHS[name] ?? null,
    registered: REGISTERED.has(name),
    workflow: !NO_WORKFLOW.has(name),
    status: KNOWN_STATUS[name] ?? 'unknown',
  }));
}

// ---------- count packages ----------
function countPackages(subdir) {
  const base = join(ROOT, subdir);
  if (!existsSync(base)) return 0;
  return readdirSync(base).filter(n => {
    if (!isDir(join(base, n))) return false; // skip files like proxy-routes.ts
    return true;
  }).length;
}

// ---------- collect route files (path listing + count) ----------
function collectRouteFiles() {
  const routesDir = join(ROOT, 'artifacts', 'api-server', 'src', 'routes');
  if (!existsSync(routesDir)) return { file_count: 0, entries: [] };
  const entries = readdirSync(routesDir, { recursive: true })
    .filter(e => typeof e === 'string' && e.endsWith('.ts') && !e.includes('__tests__'))
    .sort();
  return { file_count: entries.length, entries };
}

// ---------- collect job files ----------
function collectJobs() {
  const jobsDir = join(ROOT, 'artifacts', 'api-server', 'src', 'jobs');
  if (!existsSync(jobsDir)) return { count: 0, entries: [] };
  const entries = readdirSync(jobsDir, { recursive: true })
    .filter(f => typeof f === 'string' && f.endsWith('.ts') && !f.includes('__tests__'))
    .sort()
    .map(f => `api-server/src/jobs/${f}`);
  return { count: entries.length, entries };
}

// ---------- parse env vars ----------
function parseEnvVars() {
  const envPath = join(ROOT, '.env.example');
  if (!existsSync(envPath)) return { count: 0, keys: [] };
  const lines = readFileSync(envPath, 'utf8').split('\n');
  const keys = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Z][A-Z0-9_]*)=/);
    if (match) keys.push(match[1]);
  }
  return { count: keys.length, keys: keys.sort() };
}

// ---------- collect github workflows ----------
function collectGHWorkflows() {
  const wfDir = join(ROOT, '.github', 'workflows');
  if (!existsSync(wfDir)) return { count: 0, entries: [] };
  const entries = readdirSync(wfDir)
    .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
    .sort();
  return { count: entries.length, entries };
}

// ---------- collect apps/services/workers ----------
function collectCategory(subdir) {
  return listDirs(join(ROOT, subdir));
}

// ---------- runtime entry points ----------
function collectRuntimeEntryPoints() {
  const rootPkg = join(ROOT, 'package.json');
  if (!existsSync(rootPkg)) return [];
  const pkg = JSON.parse(readFileSync(rootPkg, 'utf8'));
  const scripts = pkg.scripts ?? {};
  return Object.entries(scripts)
    .filter(([, v]) => typeof v === 'string' && (v.includes('node ') || v.includes('tsx ') || v.includes('pnpm -r') || v.includes('turbo run')))
    .map(([k]) => k);
}

// ---------- main ----------
function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const artifacts = collectArtifacts();
  const envVars = parseEnvVars();
  const apps = collectCategory('apps');
  const services = collectCategory('services');
  const workers = collectCategory('workers');
  const pkgCount = countPackages('packages');
  const libCount = countPackages('lib');
  const routeFiles = collectRouteFiles();
  const jobs = collectJobs();
  const ghWorkflows = collectGHWorkflows();
  const runtimeEntryPoints = collectRuntimeEntryPoints();

  // Manually verified from Replit platform (not readable from filesystem)
  const REPLIT_INFRA_WORKFLOWS = [
    'GI Design System Storybook',
    'brand-strings',
    'praxis-smoke-e2e',
    'security-tests',
  ];

  const registered = artifacts.filter(a => a.registered);
  const publicFacing = registered.filter(a => a.status !== 'internal-only');

  const inventory = {
    generated: new Date().toISOString().split('T')[0],
    generator: 'scripts/inventory/generate-inventory.js',
    artifacts: {
      total_dirs: artifacts.length,
      platform_registered: registered.length,
      public_facing_registered: publicFacing.length,
      workflow_active: artifacts.filter(a => a.workflow).length,
      entries: artifacts,
    },
    packages: {
      dir: 'packages/',
      count: pkgCount,
      note: 'proxy-routes.ts at packages/ root is a file, not a package dir; excluded',
    },
    shared_libraries: {
      dir: 'lib/',
      count: libCount,
    },
    apps: {
      dir: 'apps/',
      count: apps.length,
      entries: apps,
    },
    services: {
      dir: 'services/',
      count: services.length,
      entries: services,
    },
    workers: {
      dir: 'workers/',
      count: workers.length,
      entries: workers,
    },
    api_routes: {
      note: 'Route files in artifacts/api-server/src/routes/ (recursive, .ts, excludes __tests__)',
      file_count: routeFiles.file_count,
      entries: routeFiles.entries,
    },
    jobs: {
      note: 'Background job files in artifacts/api-server/src/jobs/ (recursive, .ts, excludes __tests__)',
      count: jobs.count,
      entries: jobs.entries,
    },
    env_vars: {
      source: '.env.example',
      count: envVars.count,
      keys: envVars.keys,
    },
    github_workflows: {
      dir: '.github/workflows/',
      count: ghWorkflows.count,
      entries: ghWorkflows.entries,
    },
    replit_workflows: {
      note: 'MANUAL INPUT — Replit runtime workflows verified from platform 2026-04-26 (not readable from filesystem)',
      total: artifacts.filter(a => a.workflow).length + REPLIT_INFRA_WORKFLOWS.length,
      artifact_workflows: artifacts.filter(a => a.workflow).length,
      infrastructure_workflows: REPLIT_INFRA_WORKFLOWS.length,
      infrastructure_entries: REPLIT_INFRA_WORKFLOWS,
    },
    runtime_entry_points: {
      note: 'Top-level package.json scripts that invoke runtime processes',
      entries: runtimeEntryPoints,
    },
    integrations: {
      note: 'MANUAL INPUT — verified from Replit integration config (not filesystem readable)',
      installed: ['github==1.0.0'],
    },
    domain_packs: {
      note: 'MANUAL INPUT — verified from artifact branding and docs/APP_STATUS.md',
      count: 6,
      entries: ['TENAX', 'Counsel', 'DOMAINE', 'SEXTANT', 'PARAGON', 'Carlota Jo'],
    },
    total_operator_products: {
      note: 'MANUAL INPUT — verified from product docs; domain packs + A11oy + KORA + LUMINA',
      count: 8,
      entries: ['A11oy', 'TENAX', 'DOMAINE', 'SEXTANT', 'PARAGON', 'Counsel', 'KORA', 'LUMINA'],
    },
  };

  writeFileSync(JSON_OUT, JSON.stringify(inventory, null, 2));
  console.log(`Wrote ${JSON_OUT}`);

  // build markdown
  const md = buildMarkdown(inventory);
  writeFileSync(MD_OUT, md);
  console.log(`Wrote ${MD_OUT}`);
}

function buildMarkdown(inv) {
  const { artifacts: arts, packages, shared_libraries: libs, apps, services, workers,
    api_routes, jobs, env_vars, github_workflows, replit_workflows, domain_packs,
    total_operator_products } = inv;

  const publicFacingEntries = arts.entries.filter(a => a.registered && a.status !== 'internal-only');
  const internalEntries = arts.entries.filter(a => !a.registered || a.status === 'internal-only');

  return `# Project Inventory — SZL Holdings Platform

**Generated:** ${inv.generated}  
**Generator:** \`${inv.generator}\`  
**Status:** Authoritative baseline for all downstream rehaul phases

---

## Summary Counts

| Category | Count | Notes |
|----------|-------|-------|
| Artifact directories (\`artifacts/\`) | ${arts.total_dirs} | Includes internal/unregistered dirs |
| Platform-registered artifacts | ${arts.platform_registered} | Accessible via platform preview pane |
| Public-facing registered artifacts | ${arts.public_facing_registered} | Excludes internal tooling (PRAXIS, PluginMesh) |
| Artifact runtime workflows | ${arts.workflow_active} | All dirs except \`helios\` |
| Total Replit workflows | ${replit_workflows.total} | ${arts.workflow_active} artifact + ${replit_workflows.infrastructure_workflows} infrastructure |
| Package directories (\`packages/\`) | ${packages.count} | Excludes \`proxy-routes.ts\` file at packages root |
| Shared library dirs (\`lib/\`) | ${libs.count} | Includes \`integrations/\` subdir |
| Background apps (\`apps/\`) | ${apps.count} | |
| Platform services (\`services/\`) | ${services.count} | |
| Background workers (\`workers/\`) | ${workers.count} | |
| API route files | ${api_routes.file_count} | \`artifacts/api-server/src/routes/\` (recursive, .ts) |
| Background jobs | ${jobs.count} | \`artifacts/api-server/src/jobs/\` (recursive, .ts) |
| Environment variables | ${env_vars.count} | Parsed from \`.env.example\` |
| GitHub CI/CD workflows | ${github_workflows.count} | |
| Domain pack verticals | ${domain_packs.count} | ${domain_packs.entries.join(', ')} |
| Total operator products | ${total_operator_products.count} | Domain packs + A11oy, KORA, LUMINA |
| Installed integrations | 1 | github==1.0.0 |

---

## Public-Facing Registered Artifacts (${arts.public_facing_registered})

| Dir | Brand | Kind | Preview | Status |
|-----|-------|------|---------|--------|
${publicFacingEntries.map(a => `| \`${a.dir}\` | ${a.brand} | ${a.kind} | ${a.preview ?? '—'} | ${a.status} |`).join('\n')}

---

## Internal / Unregistered Artifacts (${internalEntries.length})

| Dir | Brand | Registered | Workflow | Status |
|-----|-------|-----------|---------|--------|
${internalEntries.map(a => `| \`${a.dir}\` | ${a.brand} | ${a.registered ? 'Yes' : 'No'} | ${a.workflow ? 'Yes' : 'No'} | ${a.status} |`).join('\n')}

---

## Packages (\`packages/\` — ${packages.count} directories)

${packages.note}.

---

## Shared Libraries (\`lib/\` — ${libs.count} directories)

Includes \`integrations/\` subdir and \`integrations-openai-ai-react\`, \`integrations-openai-ai-server\`.

---

## Background Apps (\`apps/\` — ${apps.count})

${apps.entries.map(e => `- \`apps/${e}\``).join('\n')}

---

## Platform Services (\`services/\` — ${services.count})

${services.entries.map(e => `- \`services/${e}\``).join('\n')}

---

## Workers (\`workers/\` — ${workers.count})

${workers.entries.map(e => `- \`workers/${e}\``).join('\n')}

---

## API Routes (${api_routes.file_count} files)

Route files in \`artifacts/api-server/src/routes/\` (recursive, \`.ts\`, excludes \`__tests__\`):

${api_routes.entries.map(e => `- \`routes/${e}\``).join('\n')}

---

## Background Jobs (${jobs.count})

Job files in \`artifacts/api-server/src/jobs/\` (recursive, \`.ts\`, excludes \`__tests__\`):

${jobs.entries.map(e => `- \`${e}\``).join('\n')}

---

## Environment Variables

**${env_vars.count} variables** defined in \`.env.example\`.

First 20: ${env_vars.keys.slice(0, 20).join(', ')}

---

## GitHub CI/CD Workflows (${github_workflows.count})

\`.github/workflows/\`: ${github_workflows.entries.join(', ')}

---

## Replit Runtime Workflows (${replit_workflows.total})

**Artifact workflows (${replit_workflows.artifact_workflows}):** ${arts.entries.filter(a => a.workflow).map(a => a.dir).join(', ')}

**Infrastructure workflows (${replit_workflows.infrastructure_workflows}):** ${replit_workflows.infrastructure_entries.join(', ')}

---

## Installed Integrations

| Integration | Version |
|-------------|---------|
| github | 1.0.0 |
`;
}

main();
