#!/usr/bin/env node
/**
 * scripts/qa/check-doc-freshness.js
 *
 * Compares a handful of high-signal codebase metrics against the values
 * recorded in the canonical architecture / data / API / product docs and
 * warns when they have drifted beyond a threshold.
 *
 * Checks performed:
 *   1. pgTable declarations in lib/db/src/schema/ vs. ARCHITECTURE.md +
 *      DATA-MODEL.md ("799 tables", "132 schema files")
 *   2. Route file count in artifacts/api-server/src/routes/ vs. API-SPEC.md
 *      ("140+ TypeScript route files")
 *   3. Registered artifact directories vs. PRODUCT-SURFACES.md — every
 *      section the doc marks "Archived" must point at a directory that is
 *      either (a) absent from artifacts/ or (b) explicitly marked archived
 *      in its artifact.toml. Conversely, every present, non-archived
 *      artifact directory must NOT be listed as Archived in the doc.
 *
 * Exit codes:
 *   0  — all checks passed (or only warnings, default)
 *   1  — one or more checks failed AND --strict was passed (CI gate mode)
 *
 * Flags:
 *   --strict                      treat warnings as failures (exit 1)
 *   --table-threshold=<n>         allowed |actual - stated| for tables   (default 10)
 *   --schema-file-threshold=<n>   allowed |actual - stated| for schema files (default 5)
 *   --route-overshoot-pct=<n>     allowed (actual / stated - 1) * 100   (default 30)
 *   --json                        emit a JSON report on stdout
 *
 * Usage:
 *   node scripts/qa/check-doc-freshness.js
 *   node scripts/qa/check-doc-freshness.js --strict
 *   node scripts/qa/check-doc-freshness.js --json
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  if (hit === `--${name}`) return true;
  const v = hit.split("=")[1];
  const n = Number(v);
  return Number.isFinite(n) ? n : v;
};

const STRICT = !!flag("strict", false);
const JSON_OUT = !!flag("json", false);
const TABLE_THRESHOLD = Number(flag("table-threshold", 10));
const SCHEMA_FILE_THRESHOLD = Number(flag("schema-file-threshold", 5));
const ROUTE_OVERSHOOT_PCT = Number(flag("route-overshoot-pct", 30));

// ---------- helpers -------------------------------------------------------

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}
function exists(rel) {
  try { fs.accessSync(path.join(ROOT, rel)); return true; } catch { return false; }
}
function walk(dir, filter) {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); }
    catch { continue; }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === ".git" || e.name === "dist" || e.name === "build") continue;
        stack.push(full);
      } else if (e.isFile() && filter(full, e.name)) {
        out.push(full);
      }
    }
  }
  return out;
}

function countMatches(text, regex) {
  const m = text.match(regex);
  return m ? m.length : 0;
}

// ---------- check 1: tables + schema files --------------------------------

function checkSchema() {
  const schemaDir = path.join(ROOT, "lib/db/src/schema");
  const files = walk(schemaDir, (_, n) => n.endsWith(".ts") && !n.endsWith(".test.ts") && !n.endsWith(".d.ts"));
  let tableCount = 0;
  for (const f of files) {
    const txt = fs.readFileSync(f, "utf8");
    tableCount += countMatches(txt, /=\s*pgTable\s*\(/g);
  }
  const schemaFileCount = files.length;

  const findings = [];
  for (const docRel of ["ARCHITECTURE.md", "DATA-MODEL.md"]) {
    if (!exists(docRel)) continue;
    const doc = readText(docRel);
    const tableMatches = [...doc.matchAll(/(\d{2,5})\s*(?:`pgTable`\s*declarations|tables)/gi)];
    const schemaMatches = [...doc.matchAll(/(\d{2,5})\s*schema files/gi)];
    const statedTables = tableMatches.length ? Math.max(...tableMatches.map((m) => Number(m[1]))) : null;
    const statedSchemaFiles = schemaMatches.length ? Math.max(...schemaMatches.map((m) => Number(m[1]))) : null;

    if (statedTables != null) {
      const drift = tableCount - statedTables;
      const ok = Math.abs(drift) <= TABLE_THRESHOLD;
      findings.push({
        check: "tables",
        doc: docRel,
        stated: statedTables,
        actual: tableCount,
        drift,
        threshold: TABLE_THRESHOLD,
        severity: ok ? "ok" : "warn",
        message: ok
          ? `${docRel}: tables in sync (stated ${statedTables}, actual ${tableCount}, drift ${drift})`
          : `${docRel}: TABLE DRIFT — stated ${statedTables}, actual ${tableCount} (drift ${drift > 0 ? "+" : ""}${drift}, threshold ±${TABLE_THRESHOLD})`,
      });
    } else {
      findings.push({ check: "tables", doc: docRel, severity: "info", message: `${docRel}: no table count statement found` });
    }

    if (statedSchemaFiles != null) {
      const drift = schemaFileCount - statedSchemaFiles;
      const ok = Math.abs(drift) <= SCHEMA_FILE_THRESHOLD;
      findings.push({
        check: "schema-files",
        doc: docRel,
        stated: statedSchemaFiles,
        actual: schemaFileCount,
        drift,
        threshold: SCHEMA_FILE_THRESHOLD,
        severity: ok ? "ok" : "warn",
        message: ok
          ? `${docRel}: schema files in sync (stated ${statedSchemaFiles}, actual ${schemaFileCount}, drift ${drift})`
          : `${docRel}: SCHEMA-FILE DRIFT — stated ${statedSchemaFiles}, actual ${schemaFileCount} (drift ${drift > 0 ? "+" : ""}${drift}, threshold ±${SCHEMA_FILE_THRESHOLD})`,
      });
    }
  }

  return { tableCount, schemaFileCount, findings };
}

// ---------- check 2: API route file count ---------------------------------

function checkRoutes() {
  const routesDir = path.join(ROOT, "artifacts/api-server/src/routes");
  const files = walk(routesDir, (_, n) =>
    n.endsWith(".ts") &&
    !n.endsWith(".test.ts") &&
    !n.endsWith(".spec.ts") &&
    !n.endsWith(".d.ts")
  );
  const actual = files.length;

  const findings = [];
  if (!exists("API-SPEC.md")) {
    findings.push({ check: "routes", severity: "info", message: "API-SPEC.md not present, skipping route count check" });
    return { actual, findings };
  }
  const doc = readText("API-SPEC.md");
  const m = doc.match(/(\d{2,5})\+?\s*TypeScript\s*route files/i)
        || doc.match(/(\d{2,5})\+?\s*route files/i);
  if (!m) {
    findings.push({ check: "routes", severity: "info", actual, message: "API-SPEC.md: no route file count statement found" });
    return { actual, findings };
  }
  const stated = Number(m[1]);
  const overshootPct = ((actual - stated) / Math.max(stated, 1)) * 100;
  const undershoot = actual < stated;
  const overshoot = overshootPct > ROUTE_OVERSHOOT_PCT;
  const ok = !undershoot && !overshoot;
  findings.push({
    check: "routes",
    doc: "API-SPEC.md",
    stated,
    actual,
    overshootPct: Number(overshootPct.toFixed(1)),
    threshold: ROUTE_OVERSHOOT_PCT,
    severity: ok ? "ok" : "warn",
    message: ok
      ? `API-SPEC.md: route count in sync (stated "${stated}+", actual ${actual}, +${overshootPct.toFixed(1)}%)`
      : undershoot
        ? `API-SPEC.md: ROUTE UNDERSHOOT — stated "${stated}+", actual ${actual} (codebase has fewer routes than the doc claims)`
        : `API-SPEC.md: ROUTE DRIFT — stated "${stated}+", actual ${actual} (+${overshootPct.toFixed(1)}%, threshold +${ROUTE_OVERSHOOT_PCT}%)`,
  });
  return { actual, findings };
}

// ---------- check 3: archived artifacts -----------------------------------

function checkArchivedArtifacts() {
  const artifactsDir = path.join(ROOT, "artifacts");
  const presentDirs = fs.readdirSync(artifactsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const findings = [];
  if (!exists("PRODUCT-SURFACES.md")) {
    findings.push({ check: "archived", severity: "info", message: "PRODUCT-SURFACES.md not present, skipping archived artifact check" });
    return { presentDirs, findings };
  }
  const doc = readText("PRODUCT-SURFACES.md");

  // Sections look like:  ### Name — Tagline *(Archived)*
  const sectionRe = /^###\s+(.+?)(?:\s*\*\(Archived\)\*)?\s*$/gm;
  const archivedSections = [];
  let mm;
  while ((mm = sectionRe.exec(doc)) !== null) {
    const isArchived = mm[0].includes("*(Archived)*");
    if (isArchived) archivedSections.push(mm[1].trim());
  }

  // Heuristic: map a section name to a likely artifact dir slug by taking
  // the first lowercased word(s) before " —" / "(" and converting to kebab.
  const slugify = (label) => {
    const head = label.split(/[—\-(]/)[0].trim().toLowerCase();
    return head.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  };

  for (const section of archivedSections) {
    const slug = slugify(section);
    // Try a few candidate dir names
    const candidates = Array.from(new Set([
      slug,
      slug.replace("-counsel", "-counsel"),
      `${slug}-site`,
      slug.split("-")[0],
    ])).filter(Boolean);
    const present = candidates.find((c) => presentDirs.includes(c));
    if (!present) {
      findings.push({
        check: "archived",
        section,
        severity: "ok",
        message: `PRODUCT-SURFACES.md: "${section}" marked Archived and no matching artifact dir present (consistent)`,
      });
      continue;
    }
    // Dir is present — confirm it is archived in artifact.toml
    const tomlPath = path.join("artifacts", present, "artifact.toml");
    let archivedInToml = false;
    if (exists(tomlPath)) {
      const toml = readText(tomlPath).toLowerCase();
      archivedInToml = /\barchived\s*=\s*true\b/.test(toml) || /status\s*=\s*"archived"/.test(toml);
    }
    findings.push({
      check: "archived",
      section,
      dir: present,
      archivedInToml,
      severity: archivedInToml ? "ok" : "warn",
      message: archivedInToml
        ? `PRODUCT-SURFACES.md: "${section}" archived and artifacts/${present}/artifact.toml agrees`
        : `PRODUCT-SURFACES.md: "${section}" marked Archived but artifacts/${present}/ is still present and artifact.toml does NOT mark it archived`,
    });
  }

  return { presentDirs, archivedSections, findings };
}

// ---------- run all -------------------------------------------------------

const schemaResult = checkSchema();
const routesResult = checkRoutes();
const archivedResult = checkArchivedArtifacts();

const allFindings = [
  ...schemaResult.findings,
  ...routesResult.findings,
  ...archivedResult.findings,
];

const warnCount = allFindings.filter((f) => f.severity === "warn").length;
const okCount = allFindings.filter((f) => f.severity === "ok").length;
const infoCount = allFindings.filter((f) => f.severity === "info").length;

if (JSON_OUT) {
  process.stdout.write(JSON.stringify({
    summary: { ok: okCount, warn: warnCount, info: infoCount, strict: STRICT },
    metrics: {
      tables: schemaResult.tableCount,
      schemaFiles: schemaResult.schemaFileCount,
      routeFiles: routesResult.actual,
    },
    findings: allFindings,
  }, null, 2) + "\n");
} else {
  const tag = (s) => s === "warn" ? "WARN" : s === "ok" ? "OK  " : "INFO";
  console.log("Doc freshness check — SZL Holdings monorepo");
  console.log("--------------------------------------------");
  console.log(`tables(actual)=${schemaResult.tableCount}  schemaFiles(actual)=${schemaResult.schemaFileCount}  routeFiles(actual)=${routesResult.actual}`);
  console.log("");
  for (const f of allFindings) {
    console.log(`[${tag(f.severity)}] ${f.message}`);
  }
  console.log("");
  console.log(`Summary: ${okCount} ok, ${warnCount} warn, ${infoCount} info${STRICT ? " (strict mode)" : ""}`);
}

if (STRICT && warnCount > 0) process.exit(1);
process.exit(0);
