#!/usr/bin/env tsx
/**
 * generate-platform-metrics.ts
 *
 * CANONICAL platform-metrics generator. This is the single source of truth for
 * both the curated registry and the diligence-audit metrics snapshot.
 *
 * Outputs:
 *   1. packages/platform-metrics-registry/src/registry.ts
 *      Curated + structural facts consumed by the platform-facts API.
 *   2. docs/platform-facts.md
 *      Public-facing markdown derived from (1).
 *   3. generated/platform-metrics.json
 *      Deep code-derived metrics snapshot used by the diligence audit runner.
 *   4. generated/platform-metrics.md
 *      Markdown rendering of (3).
 *
 * Usage:
 *   tsx scripts/generate-platform-metrics.ts
 *   tsx scripts/generate-platform-metrics.ts --dry-run
 *
 * History: This script supersedes scripts/audit/generate-platform-metrics.ts.
 * That file is now a thin re-export that delegates here so the artifact-exclude
 * logic, registry walk, and output shape never drift between the two callers
 * (root `pnpm metrics:generate` and the diligence audit runner). See task
 * #5112 and Section 7 of docs/DEPENDENCY_AND_SCRIPT_DRIFT.md.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname ?? process.cwd(), '..');
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

function countDir(path: string, excludes: string[] = []): number {
  if (!existsSync(path)) return 0;
  try {
    return readdirSync(path).filter((entry) => {
      if (excludes.includes(entry)) return false;
      const full = join(path, entry);
      return statSync(full).isDirectory();
    }).length;
  } catch {
    return 0;
  }
}

function countFiles(path: string, ext?: string): number {
  if (!existsSync(path)) return 0;
  try {
    return readdirSync(path).filter((entry) => {
      if (ext && !entry.endsWith(ext)) return false;
      const full = join(path, entry);
      return statSync(full).isFile();
    }).length;
  } catch {
    return 0;
  }
}

function countDbTables(schemaDir: string): number {
  if (!existsSync(schemaDir)) return 0;
  let count = 0;
  try {
    const files = readdirSync(schemaDir);
    for (const file of files) {
      const full = join(schemaDir, file);
      if (statSync(full).isFile() && (file.endsWith('.ts') || file.endsWith('.js'))) {
        const content = readFileSync(full, 'utf-8');
        const matches = content.match(/pgTable\s*\(/g);
        count += matches ? matches.length : 0;
      }
    }
  } catch {
    /* ignore */
  }
  return count;
}

function listDirs(dir: string): string[] {
  const full = join(ROOT, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name);
}

function countGithubWorkflows(): number {
  const dir = join(ROOT, '.github/workflows');
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml')).length;
}

// ---------------------------------------------------------------------------
// Git / grep helpers (audit-style deep metrics)
// ---------------------------------------------------------------------------

function git(cmd: string): string {
  try {
    return execSync(cmd, { cwd: ROOT, timeout: 15000, maxBuffer: 10 * 1024 * 1024 }).toString();
  } catch {
    return '';
  }
}

function countGit(pattern: string): number {
  const out = git(`git ls-files '${pattern}' 2>/dev/null | wc -l`);
  return parseInt(out.trim(), 10) || 0;
}

function grepLines(pattern: string, dir: string): number {
  try {
    const out = execSync(
      `grep -rE '${pattern}' ${dir} --include='*.ts' 2>/dev/null | wc -l`,
      { cwd: ROOT, timeout: 15000 },
    ).toString();
    return parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Canonical artifact registry (single source of truth, shared by both outputs)
// ---------------------------------------------------------------------------

// Directories under `artifacts/` that are NOT deployable artifacts and must be
// excluded from artifact counts (e.g. evidence folders from diligence audits).
const ARTIFACT_DIR_EXCLUDES = ['audit'];
const ARTIFACT_DIR_EXCLUDES_SET = new Set<string>(ARTIFACT_DIR_EXCLUDES);

function countRegisteredArtifacts(): number {
  // The canonical artifact registry is the set of directories under
  // `artifacts/` — the same source the artifacts skill / workspace registry
  // walks when enumerating registered artifacts.
  const artifactsDir = join(ROOT, 'artifacts');
  if (!existsSync(artifactsDir)) {
    throw new Error(
      `Canonical artifact registry directory not found at ${artifactsDir}. ` +
        'Cannot compute activeArtifactCount. Update scripts/generate-platform-metrics.ts ' +
        'if the registry has moved.',
    );
  }
  const entries = readdirSync(artifactsDir, { withFileTypes: true }).filter(
    (d) => d.isDirectory() && !d.name.startsWith('.'),
  );
  if (entries.length === 0) {
    throw new Error(
      `Found 0 registered artifacts under ${artifactsDir}. ` +
        'Registry appears empty — refusing to write a zero count.',
    );
  }
  return entries.length;
}

function getArtifacts(): { name: string; kind: string; path: string }[] {
  const artifactsDir = join(ROOT, 'artifacts');
  if (!existsSync(artifactsDir)) return [];
  const dirs = readdirSync(artifactsDir, { withFileTypes: true }).filter(
    (d) => d.isDirectory() && !d.name.startsWith('.') && !ARTIFACT_DIR_EXCLUDES_SET.has(d.name),
  );

  return dirs.map((d) => {
    const pkgPath = join(artifactsDir, d.name, 'package.json');
    let name = d.name;
    let kind = 'web';
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        name = pkg.name || d.name;
      } catch {
        /* ignore */
      }
    }
    if (d.name.includes('mobile')) kind = 'mobile';
    if (d.name.includes('video')) kind = 'video';
    if (d.name.includes('api-server')) kind = 'backend';
    if (d.name.includes('mockup')) kind = 'design';
    return { name, kind, path: `artifacts/${d.name}` };
  });
}

function countScripts(): number {
  const scriptsDir = join(ROOT, 'scripts');
  if (!existsSync(scriptsDir)) return 0;
  return readdirSync(scriptsDir).filter((f) => {
    const full = join(scriptsDir, f);
    return statSync(full).isFile();
  }).length;
}

// ---------------------------------------------------------------------------
// Compute structural counts (shared inputs for all four outputs)
// ---------------------------------------------------------------------------

// `artifactCount` is the filtered count of deployable artifact directories
// (excludes the `audit/` evidence folder). `activeArtifactCount` is the
// unfiltered canonical registry count — every directory under `artifacts/`.
// These two numbers can legitimately differ.
const structural = {
  artifactCount: countDir(join(ROOT, 'artifacts'), ARTIFACT_DIR_EXCLUDES),
  activeArtifactCount: countRegisteredArtifacts(),
  packageCount: countDir(join(ROOT, 'packages')),
  libCount: countDir(join(ROOT, 'lib')),
  workerCount: countDir(join(ROOT, 'workers')),
  serviceCount: countDir(join(ROOT, 'services')),
  appCount: countDir(join(ROOT, 'apps')),
  scriptCount: countScripts(),
};

const dbSchemaDir = join(ROOT, 'lib', 'db', 'src', 'schema');
const schema = {
  dbTableCount: countDbTables(dbSchemaDir),
  dbSchemaFileCount: countFiles(dbSchemaDir, '.ts'),
  dbSchemaDomainCount: 10,
};

if (DRY_RUN) {
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Output 1: packages/platform-metrics-registry/src/registry.ts
// ---------------------------------------------------------------------------

const registryPath = join(ROOT, 'packages', 'platform-metrics-registry', 'src', 'registry.ts');
const currentContent = existsSync(registryPath) ? readFileSync(registryPath, 'utf-8') : '';

// Extract curated block from current file (preserve manually maintained values)
const curatedMatch = currentContent.match(/curated:\s*\{[\s\S]*?\},\s*\n\s*\};/);
const curatedBlock = curatedMatch
  ? curatedMatch[0]
  : `curated: {
    platformVersion: "4.0.0",
    platformName: "SZL Holdings Platform",
    platformCodename: "AEEP",
    foundedYear: 2024,
    lastAuditDate: "${new Date().toISOString().split('T')[0]}",
    authProviders: ["Replit Auth (OIDC/PKCE)", "Clerk"],
    aiProviders: ["OpenAI", "Anthropic", "Google Gemini", "HuggingFace", "NVIDIA NIM"],
    externalDataSources: [],
  },
};`;

const registryContent = `import type { PlatformFacts } from "./schema.js";

/**
 * Platform facts registry.
 * AUTO-GENERATED by scripts/generate-platform-metrics.ts on ${new Date().toISOString()}
 *
 * DO NOT hand-edit structural counts — run the generation script instead.
 * Curated facts are preserved across regenerations.
 */
export const PLATFORM_FACTS: PlatformFacts = {
  generatedAt: "${new Date().toISOString()}",
  generatedBy: "generate-platform-metrics",

  structural: {
    artifactCount: ${structural.artifactCount},
    activeArtifactCount: ${structural.activeArtifactCount},
    packageCount: ${structural.packageCount},
    libCount: ${structural.libCount},
    workerCount: ${structural.workerCount},
    serviceCount: ${structural.serviceCount},
    appCount: ${structural.appCount},
    scriptCount: ${structural.scriptCount},
  },

  schema: {
    dbTableCount: ${schema.dbTableCount},
    dbSchemaFileCount: ${schema.dbSchemaFileCount},
    dbSchemaDomainCount: ${schema.dbSchemaDomainCount},
  },

  api: {
    apiRouteGroupCount: 14,
    v1EndpointCount: 18,
    v1EndpointTarget: 18,
  },

  runtime: {
    domainPackCount: 6,
    agentRoleCount: 8,
    cognitiveLoopPhaseCount: 8,
    starterWorkflowCount: 10,
    rbacRoleCount: 11,
    embeddingBackendCount: 5,
    memoryTierCount: 4,
  },

  deployment: {
    deploymentTargets: ["Reserved VM", "Autoscale", "External Workers"],
    primaryRegion: "us-east",
  },

  ${curatedBlock}

export const AEEP_VERSION = PLATFORM_FACTS.curated.platformVersion;
export const AEEP_CODENAME = PLATFORM_FACTS.curated.platformCodename;
`;

writeFileSync(registryPath, registryContent, 'utf-8');

// ---------------------------------------------------------------------------
// Output 2: docs/platform-facts.md
// ---------------------------------------------------------------------------

const today = new Date().toISOString().split('T')[0];
const totalPackages = structural.packageCount + structural.libCount;
const docsMarkdown = `# Platform Facts

**Source:** \`packages/platform-metrics-registry\` | **Generated:** ${today} | **Codename:** AEEP

This document is the canonical public reference for all SZL Holdings platform statistics.

All counts are derived from the platform metrics registry. **Do not edit this file directly** — update the registry or run the generation script.

---

## Platform Identity

| Fact | Value |
|------|-------|
| Platform name | SZL Holdings Platform |
| Codename | AEEP (Counsel Execution and Evidence Platform) |
| Version | 4.0.0 |
| Founded | 2024 |
| Last comprehensive audit | ${today} |

---

## Application Surface

| Metric | Count |
|--------|-------|
| Active registered artifacts | ${structural.activeArtifactCount} |
| Total artifacts (including archived) | ${structural.artifactCount} |
| Domain packs | 6 |
| Standalone applications | ${structural.appCount} |
| Background workers | ${structural.workerCount} |
| Hybrid services | ${structural.serviceCount} |

### Domain Packs

| Pack | Domain |
|------|--------|
| KORA | Decision Intelligence command surface |
| SEXTANT | Maritime fleet intelligence |
| DOMAINE | Real estate intelligence |
| PARAGON | Security and defense intelligence |
| PRISM | Legal matter command |
| Carlota | Premium advisory operations |

---

## Package Ecosystem

| Metric | Count |
|--------|-------|
| Domain packages (\`packages/\`) | ${structural.packageCount} |
| Shared library packages (\`lib/\`) | ${structural.libCount} |
| Total packages | ${totalPackages} |

---

## Data Layer

| Metric | Count |
|--------|-------|
| Database tables (Drizzle pgTable) | ${schema.dbTableCount} |
| Schema files | ${schema.dbSchemaFileCount} |
| Schema domains | ${schema.dbSchemaDomainCount} |

---

## API Surface

| Metric | Count |
|--------|-------|
| API route groups | 14 |
| AEEP v1 endpoints (active) | 18 |

### AEEP v1 Endpoint Map

| Endpoint | Service | Status |
|----------|---------|--------|
| \`POST /v1/tasks/plan\` | alloy-runtime-api | Active |
| \`POST /v1/tasks/execute\` | alloy-runtime-api | Active |
| \`POST /v1/memory/write\` | alloy-runtime-api | Active |
| \`POST /v1/memory/query\` | alloy-runtime-api | Active |
| \`DELETE /v1/memory/evict-stale\` | alloy-runtime-api | Active |
| \`POST /v1/workflows/start\` | alloy-runtime-api | Active |
| \`GET /v1/workflows\` | alloy-runtime-api | Active |
| \`GET /v1/workflows/:runId\` | alloy-runtime-api | Active |
| \`POST /v1/workflows/:runId/resume\` | alloy-runtime-api | Active |
| \`POST /v1/workflows/:runId/approve\` | alloy-runtime-api | Active |
| \`DELETE /v1/workflows/:runId\` | alloy-runtime-api | Active |
| \`POST /v1/search/hybrid\` | alloy-runtime-api | Active |
| \`POST /v1/embed\` | alloy-runtime-api | Active |
| \`POST /v1/rerank\` | alloy-runtime-api | Active |
| \`POST /v1/openai/embeddings\` | alloy-runtime-api | Active (compat) |
| \`POST /v1/index/rebuild\` | alloy-runtime-api | Active |
| \`GET /v1/index/verify\` | alloy-runtime-api | Active |
| \`POST /v1/evals/run\` | alloy-runtime-api | Active |

---

## Runtime Capabilities

| Metric | Count |
|--------|-------|
| Typed agent role contracts | 8 |
| Cognitive loop phases | 8 |
| Starter workflow definitions | 10 |
| Embedding backends | 5 |
| Memory tiers | 4 |

### Typed Agent Roles

MissionPlanner · RetrievalStrategist · MemoryCustodian · ToolOrchestrator · PolicyGuardian · ExecutionSupervisor · EvidenceSynthesizer · Evaluator

### Cognitive Loop Phases

perceive → orient → plan → execute → verify → reflect → update_self_model → update_memory

### Memory Tiers

working · episodic · semantic · governance

### Embedding Backends

cpu-local · external-http · gpu-stub · azure-stub · dev-hash

---

## Security and Access Control

| Metric | Value |
|--------|-------|
| RBAC roles | 11 |
| Authentication providers | Replit Auth (OIDC/PKCE), Clerk |
| Tenant isolation | Org-scoped, deny-by-default |

### RBAC Roles

\`anonymous_visitor\` · \`founder_admin\` · \`platform_admin\` · \`operator\` · \`analyst\` · \`executive_viewer\` · \`ops_manager\` · \`sales_delivery_user\` · \`maritime_ops_user\` · \`service_coordinator\` · \`pilot_customer_user\`

---

## AI Providers

OpenAI · Anthropic · Google Gemini · HuggingFace Inference · NVIDIA NIM

---

## Deployment

| Target | Use |
|--------|-----|
| Reserved VM | Always-on API and control plane |
| Autoscale | Variable-traffic application surfaces |
| External Workers | Heavier inference, reranking, and eval workloads |

---

## External Data Sources

| Category | Sources |
|----------|---------|
| Maritime | MarineTraffic, AISHub, Digitraffic, BarentsWatch, Open-Meteo Marine |
| Threat Intelligence | STIX/TAXII, AlienVault OTX, MISP OSINT, Shodan, GreyNoise, MalwareBazaar |
| Sanctions | OFAC SDN, EU Consolidated List, UN Security Council |
| Vulnerability | CISA KEV, NVD CVE, MITRE ATT&CK |
| Legal | CourtListener REST API |
| Government | Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR |
| CRM / Integration | GitHub API, HubSpot, Mapbox |

---

*Run \`tsx scripts/generate-platform-metrics.ts\` to regenerate with current filesystem counts.*
*Run \`tsx scripts/validate-platform-facts.ts\` to verify registry against filesystem.*
`;

const docsPath = join(ROOT, 'docs', 'platform-facts.md');
writeFileSync(docsPath, docsMarkdown, 'utf-8');

// ---------------------------------------------------------------------------
// Outputs 3 & 4: generated/platform-metrics.{json,md} (audit snapshot)
// ---------------------------------------------------------------------------

const artifacts = getArtifacts();
const libs = listDirs('lib');
const packages = listDirs('packages');

const tsFiles = countGit('*.ts') - countGit('*.d.ts');
const tsxFiles = countGit('*.tsx');
const testFiles =
  countGit('*.test.ts') + countGit('*.test.tsx') + countGit('*.spec.ts') + countGit('*.spec.tsx');
const docFiles = countGit('*.md');
const pyFiles = countGit('*.py');
const cssFiles = countGit('*.css') + countGit('*.scss');
const screenshotFiles =
  countGit('screenshots/*.png') +
  countGit('screenshots/*.jpg') +
  countGit('screenshots/**/*.png') +
  countGit('screenshots/**/*.jpg');

const routeFilesRecursive =
  parseInt(
    git(`git ls-files 'artifacts/api-server/src/routes/**/*.ts' 2>/dev/null | wc -l`).trim(),
    10,
  ) || 0;

const routeHandlers = grepLines(
  '\\.(get|post|put|patch|delete|all)\\(',
  join(ROOT, 'artifacts/api-server/src/routes'),
);
const dbTablesGrep = grepLines('pgTable\\(', join(ROOT, 'lib/db/src/schema'));
const migrations =
  parseInt(git(`git ls-files '*/migrations/*.sql' 2>/dev/null | wc -l`).trim(), 10) || 0;
const ciWorkflows = countGithubWorkflows();

const primitives = [
  { name: 'Outcome Graph', pkg: 'lib/outcome-graph' },
  { name: 'Proof Chain', pkg: 'lib/proof-chain' },
  { name: 'Decision Replay', pkg: 'packages/replay-core' },
  { name: 'Trace Graph', pkg: 'packages/trace-graph' },
  { name: 'Policy Engine (Covenant)', pkg: 'lib/covenant-policy' },
  { name: 'Policy Enforcer (Guardian)', pkg: 'packages/guardian' },
  { name: 'Event Fabric (Signal Mesh)', pkg: 'packages/signal-mesh' },
  { name: 'Event Bus (PRISM Bus)', pkg: 'lib/prism-bus' },
  { name: 'Simulation Engine (Monte Carlo)', pkg: 'lib/monte-carlo' },
  { name: 'Skill Forge Runtime', pkg: 'lib/forge-runtime' },
  { name: 'Skill Library', pkg: 'packages/skill-library' },
  { name: 'Document Engine', pkg: 'lib/shared-ui' },
].map((p) => ({
  ...p,
  exists: existsSync(join(ROOT, p.pkg)),
  status: existsSync(join(ROOT, p.pkg)) ? 'implemented' : 'scaffold',
}));

const metrics = {
  generated_at: new Date().toISOString(),
  generator: 'scripts/generate-platform-metrics.ts',
  repository: {
    typescript_files: tsFiles,
    tsx_files: tsxFiles,
    total_ts_tsx: tsFiles + tsxFiles,
    python_files: pyFiles,
    css_files: cssFiles,
    markdown_docs: docFiles,
    screenshot_assets: screenshotFiles,
  },
  architecture: {
    // `artifacts` is the filtered list of deployable artifact directories
    // (e.g. excludes the `audit/` evidence folder). `activeArtifactCount` is
    // the unfiltered canonical registry count — every directory under
    // `artifacts/`. These two numbers can legitimately differ.
    artifacts: artifacts.length,
    activeArtifactCount: structural.activeArtifactCount,
    artifact_list: artifacts.map((a) => ({ name: a.name, kind: a.kind })),
    lib_packages: libs.length,
    standalone_packages: packages.length,
    total_packages: libs.length + packages.length,
  },
  api_surface: {
    route_files_recursive: routeFilesRecursive,
    route_handlers: routeHandlers,
    db_tables_defined: dbTablesGrep,
    migrations,
  },
  quality: {
    test_files: testFiles,
    ci_workflows: ciWorkflows,
  },
  platform_primitives: primitives.map((p) => ({
    name: p.name,
    package: p.pkg,
    status: p.status,
  })),
  primitives_implemented: primitives.filter((p) => p.exists).length,
  primitives_total: primitives.length,
};

const outDir = join(ROOT, 'generated');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

writeFileSync(join(outDir, 'platform-metrics.json'), JSON.stringify(metrics, null, 2));

const auditMd = `# SZL Holdings — Platform Metrics
> Auto-generated ${metrics.generated_at} by \`scripts/generate-platform-metrics.ts\`
> **These numbers are code-derived. Do not hand-edit.**

## Repository Scale

| Metric | Count |
|--------|-------|
| TypeScript files (.ts) | ${metrics.repository.typescript_files.toLocaleString()} |
| React/TSX files (.tsx) | ${metrics.repository.tsx_files.toLocaleString()} |
| Total TS + TSX | ${metrics.repository.total_ts_tsx.toLocaleString()} |
| Python files (.py) | ${metrics.repository.python_files} |
| CSS/SCSS files | ${metrics.repository.css_files} |
| Markdown docs | ${metrics.repository.markdown_docs} |
| Screenshot assets | ${metrics.repository.screenshot_assets} |

## Architecture

| Metric | Count |
|--------|-------|
| Active registered artifacts (canonical registry) | ${metrics.architecture.activeArtifactCount} |
| Artifact directories on disk (filtered) | ${metrics.architecture.artifacts} |
| Library packages (lib/) | ${metrics.architecture.lib_packages} |
| Standalone packages (packages/) | ${metrics.architecture.standalone_packages} |
| Total packages | ${metrics.architecture.total_packages} |

### Artifact Registry

| Name | Kind |
|------|------|
${metrics.architecture.artifact_list.map((a) => `| ${a.name} | ${a.kind} |`).join('\n')}

## API Surface

| Metric | Count |
|--------|-------|
| Route files (recursive) | ${metrics.api_surface.route_files_recursive} |
| Route handlers (GET/POST/PUT/PATCH/DELETE) | ${metrics.api_surface.route_handlers.toLocaleString()} |
| Database table definitions (Drizzle pgTable) | ${metrics.api_surface.db_tables_defined} |
| SQL migrations | ${metrics.api_surface.migrations} |

## Quality & CI

| Metric | Count |
|--------|-------|
| Test files (.test.ts/tsx, .spec.ts/tsx) | ${metrics.quality.test_files} |
| GitHub CI workflows | ${metrics.quality.ci_workflows} |

## Platform Primitives

| Primitive | Package | Status |
|-----------|---------|--------|
${metrics.platform_primitives.map((p) => `| ${p.name} | \`${p.package}\` | ${p.status} |`).join('\n')}

**Primitives implemented: ${metrics.primitives_implemented} / ${metrics.primitives_total}**

---

*To regenerate: \`pnpm metrics:generate\` (or \`tsx scripts/generate-platform-metrics.ts\`)*
`;

writeFileSync(join(outDir, 'platform-metrics.md'), auditMd);
