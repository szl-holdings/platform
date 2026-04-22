#!/usr/bin/env npx tsx
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

function git(cmd: string): string {
  try {
    return execSync(cmd, { cwd: ROOT, timeout: 15000, maxBuffer: 10 * 1024 * 1024 }).toString();
  } catch {
    return "";
  }
}

function countGit(pattern: string): number {
  const out = git(`git ls-files '${pattern}' 2>/dev/null | wc -l`);
  return parseInt(out.trim(), 10) || 0;
}

function _grepCount(pattern: string, fileGlob: string): number {
  try {
    const out = execSync(
      `grep -rl '${pattern}' ${ROOT}/${fileGlob} --include='*.ts' 2>/dev/null | wc -l`,
      { cwd: ROOT, timeout: 15000 }
    ).toString();
    return parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

function grepLines(pattern: string, dir: string): number {
  try {
    const out = execSync(
      `grep -rE '${pattern}' ${dir} --include='*.ts' 2>/dev/null | wc -l`,
      { cwd: ROOT, timeout: 15000 }
    ).toString();
    return parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

function listDirs(dir: string): string[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);
}

function countGithubWorkflows(): number {
  const dir = path.join(ROOT, ".github/workflows");
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml")).length;
}

function getArtifacts(): { name: string; kind: string; path: string }[] {
  const artifactsDir = path.join(ROOT, "artifacts");
  if (!fs.existsSync(artifactsDir)) return [];
  const dirs = fs
    .readdirSync(artifactsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."));

  return dirs.map((d) => {
    const pkgPath = path.join(artifactsDir, d.name, "package.json");
    let name = d.name;
    let kind = "web";
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        name = pkg.name || d.name;
      } catch {}
    }
    if (d.name.includes("mobile")) kind = "mobile";
    if (d.name.includes("video")) kind = "video";
    if (d.name.includes("api-server")) kind = "backend";
    if (d.name.includes("mockup")) kind = "design";
    return { name, kind, path: `artifacts/${d.name}` };
  });
}

const artifacts = getArtifacts();
const libs = listDirs("lib");
const packages = listDirs("packages");

const tsFiles = countGit("*.ts") - countGit("*.d.ts");
const tsxFiles = countGit("*.tsx");
const testFiles = countGit("*.test.ts") + countGit("*.test.tsx") + countGit("*.spec.ts") + countGit("*.spec.tsx");
const docFiles = countGit("*.md");
const pyFiles = countGit("*.py");
const cssFiles = countGit("*.css") + countGit("*.scss");
const screenshotFiles = countGit("screenshots/*.png") + countGit("screenshots/*.jpg") + countGit("screenshots/**/*.png") + countGit("screenshots/**/*.jpg");

const routeFilesRecursive = parseInt(
  git(`git ls-files 'artifacts/api-server/src/routes/**/*.ts' 2>/dev/null | wc -l`).trim(),
  10
) || 0;

const routeHandlers = grepLines("\\.(get|post|put|patch|delete|all)\\(", path.join(ROOT, "artifacts/api-server/src/routes"));
const dbTables = grepLines("pgTable\\(", path.join(ROOT, "lib/db/src/schema"));
const migrations = parseInt(
  git(`git ls-files '*/migrations/*.sql' 2>/dev/null | wc -l`).trim(),
  10
) || 0;
const ciWorkflows = countGithubWorkflows();

const primitives = [
  { name: "Outcome Graph", pkg: "lib/outcome-graph" },
  { name: "Proof Chain", pkg: "lib/proof-chain" },
  { name: "Decision Replay", pkg: "packages/replay-core" },
  { name: "Trace Graph", pkg: "packages/trace-graph" },
  { name: "Policy Engine (Covenant)", pkg: "lib/covenant-policy" },
  { name: "Policy Enforcer (Guardian)", pkg: "packages/guardian" },
  { name: "Event Fabric (Signal Mesh)", pkg: "packages/signal-mesh" },
  { name: "Event Bus (PRISM Bus)", pkg: "lib/prism-bus" },
  { name: "Simulation Engine (Monte Carlo)", pkg: "lib/monte-carlo" },
  { name: "Skill Forge Runtime", pkg: "lib/forge-runtime" },
  { name: "Skill Library", pkg: "packages/skill-library" },
  { name: "Document Engine", pkg: "lib/shared-ui" },
].map((p) => ({
  ...p,
  exists: fs.existsSync(path.join(ROOT, p.pkg)),
  status: fs.existsSync(path.join(ROOT, p.pkg)) ? "implemented" : "scaffold",
}));

const metrics = {
  generated_at: new Date().toISOString(),
  generator: "scripts/audit/generate-platform-metrics.ts",
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
    artifacts: artifacts.length,
    artifact_list: artifacts.map((a) => ({ name: a.name, kind: a.kind })),
    lib_packages: libs.length,
    standalone_packages: packages.length,
    total_packages: libs.length + packages.length,
  },
  api_surface: {
    route_files_recursive: routeFilesRecursive,
    route_handlers: routeHandlers,
    db_tables_defined: dbTables,
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

const outDir = path.join(ROOT, "generated");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, "platform-metrics.json"), JSON.stringify(metrics, null, 2));

const md = `# SZL Holdings — Platform Metrics
> Auto-generated ${metrics.generated_at} by \`scripts/audit/generate-platform-metrics.ts\`
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
| Registered artifacts | ${metrics.architecture.artifacts} |
| Library packages (lib/) | ${metrics.architecture.lib_packages} |
| Standalone packages (packages/) | ${metrics.architecture.standalone_packages} |
| Total packages | ${metrics.architecture.total_packages} |

### Artifact Registry

| Name | Kind |
|------|------|
${metrics.architecture.artifact_list.map((a) => `| ${a.name} | ${a.kind} |`).join("\n")}

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
${metrics.platform_primitives.map((p) => `| ${p.name} | \`${p.package}\` | ${p.status} |`).join("\n")}

**Primitives implemented: ${metrics.primitives_implemented} / ${metrics.primitives_total}**

---

*To regenerate: \`npx tsx scripts/audit/generate-platform-metrics.ts\`*
`;

fs.writeFileSync(path.join(outDir, "platform-metrics.md"), md);
