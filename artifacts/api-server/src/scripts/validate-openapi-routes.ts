#!/usr/bin/env tsx
/**
 * OpenAPI ↔ Express Route Drift Audit
 *
 * Statically scans every route file under `src/routes/` and every mount
 * declaration in `src/routes/index.ts` + `src/routes/groups/*.ts` to build
 * the full set of `(METHOD, PATH)` operations the server registers under
 * `/api`. Compares that set to the operations declared in the canonical
 * OpenAPI document at `lib/api-spec/openapi.yaml` and reports anything
 * that exists on one side but not the other.
 *
 * The script is intentionally a sibling to `route-security-matrix.ts`:
 * static, fast, no app boot, no DB access, runnable in any environment.
 *
 * Usage:
 *   pnpm --filter @workspace/api-server audit:openapi-routes
 *   # JSON report:
 *   pnpm --filter @workspace/api-server audit:openapi-routes -- --json
 *   # Fail with exit code 1 when any drift is detected (CI gate):
 *   pnpm --filter @workspace/api-server audit:openapi-routes -- --strict
 *   # Fail only when the spec references operations that no route serves
 *   # (the high-signal subset; new undocumented routes are reported but
 *   # do not fail the build):
 *   pnpm --filter @workspace/api-server audit:openapi-routes:strict
 *
 * Notes:
 *  - The OpenAPI document is published with `servers: [{ url: /api }]`,
 *    so spec paths are relative to `/api`. The audit reports operations
 *    using that same convention.
 *  - Sub-router mounts (`router.use("/x", subRouter)` inside a route file)
 *    are NOT followed by the static parser. The vast majority of the
 *    surface lives at the top level of each file, and the audit treats
 *    everything else as a known limitation rather than a hard error.
 *  - Wildcard catch-alls and the GraphQL handler are filtered out — they
 *    are infrastructure mounts, not REST operations.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, basename } from "path";
import { load as yamlLoad } from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROUTES_DIR = join(__dirname, "../routes");
const SPEC_PATH = join(__dirname, "../../../../lib/api-spec/openapi.yaml");

const args = new Set(process.argv.slice(2));
const wantJson = args.has("--json");
const strict = args.has("--strict");
const strictSpecOnly = args.has("--strict-spec-only");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

interface Operation {
  method: string;
  path: string;
  source?: string;
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------
function listRouteFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      listRouteFiles(full, out);
      continue;
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".d.ts") && !entry.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

function readSource(file: string): string {
  return readFileSync(file, "utf-8");
}

function stripComments(source: string): string {
  // Remove line + block comments to avoid matching commented-out routes.
  // Order matters: strip LINE comments first so a `// foo /* bar` doesn't
  // get treated as the start of a block comment that swallows real code.
  const lineStripped = source.replace(/(^|[^:])\/\/.*$/gm, "$1");
  return lineStripped.replace(/\/\*[\s\S]*?\*\//g, "");
}

// ---------------------------------------------------------------------------
// Path normalisation
// ---------------------------------------------------------------------------
function expressPathToOpenApi(p: string): string {
  if (!p) return "/";
  let out = p;
  // `:name` or `:name(...)` → `{name}`. Strip embedded regex constraints.
  out = out.replace(/:([A-Za-z_][A-Za-z0-9_]*)(?:\([^)]*\))?/g, "{$1}");
  // Trailing optional marker `?` (legacy Express 4 syntax)
  out = out.replace(/\?+$/g, "");
  // Express 5 wildcard splat `/*splat` → drop (not a REST operation)
  out = out.replace(/\/\*[A-Za-z_][A-Za-z0-9_]*$/g, "");
  out = out.replace(/\/\*$/g, "");
  // Collapse duplicate slashes
  out = out.replace(/\/{2,}/g, "/");
  if (out !== "/" && out.endsWith("/")) out = out.slice(0, -1);
  return out || "/";
}

function joinPaths(prefix: string, suffix: string): string {
  const a = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  const b = suffix.startsWith("/") ? suffix : "/" + suffix;
  const joined = a + b;
  return joined === "" ? "/" : joined;
}

// ---------------------------------------------------------------------------
// Mount parser — scans `routes/index.ts` and `routes/groups/*.ts` to learn,
// for each lazy-loaded route file, whether Express strips a prefix from
// `req.url` before delegating to the file's router.
//
//   router.use(lazyMatch("/foo", () => import("./bar"), …))
//     → file `bar.ts`, no prefix stripped (bar.ts uses absolute paths
//       because lazyMatch never modifies `req.url`).
//
//   router.use("/foo", lazyMount(() => import("./bar"), …))
//     → file `bar.ts`, "/foo" stripped (bar.ts uses paths RELATIVE to
//       `/foo`, because Express itself rewrites `req.url`).
//
//   router.use(lazyRegister(() => import("./bar"), …))
//   router.use(lazyRegisterMatch(["/x"], () => import("./bar"), …))
//     → bar.ts exports `register(router)`; treated like absolute paths
//       (the inner register function may add its own mounts).
//
// Non-lazy `router.use("/x", subRouter)` mounts are NOT followed (the
// majority of the surface is lazy-mounted).
// ---------------------------------------------------------------------------
interface FileMount {
  prefixStrip: string | null; // when not null, prepend to every route in the file
  source: string; // mount declaration site, for diagnostics
}

function buildMountMap(): Map<string, FileMount[]> {
  const mountFiles = [
    join(ROUTES_DIR, "index.ts"),
    ...readdirSync(join(ROUTES_DIR, "groups"))
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
      .map((f) => join(ROUTES_DIR, "groups", f)),
  ];
  const result = new Map<string, FileMount[]>();
  const recordMount = (importPath: string, mount: FileMount) => {
    const key = normaliseImport(importPath);
    if (!result.has(key)) result.set(key, []);
    result.get(key)!.push(mount);
  };

  for (const file of mountFiles) {
    const src = stripComments(readSource(file));

    // 1) router.use("/prefix"[, mw…], lazyMount(() => import("./X")))
    //    Strip-prefix variant. The first string literal arg is the prefix.
    const stripRe =
      /router\.use\s*\(\s*(['"`])([^'"`]+)\1\s*,(?:[^()]*?)lazyMount\s*\(\s*\(\)\s*=>\s*import\s*\(\s*(['"`])([^'"`]+)\3/g;
    for (let m: RegExpExecArray | null; (m = stripRe.exec(src)); ) {
      recordMount(m[4]!, { prefixStrip: m[2]!, source: basename(file) });
    }

    // 2) router.use(lazyMount(() => import("./X")))   (no strip)
    const noPrefixMountRe =
      /router\.use\s*\(\s*lazyMount\s*\(\s*\(\)\s*=>\s*import\s*\(\s*(['"`])([^'"`]+)\1/g;
    for (let m: RegExpExecArray | null; (m = noPrefixMountRe.exec(src)); ) {
      recordMount(m[2]!, { prefixStrip: null, source: basename(file) });
    }

    // 3) router.use(lazyMatch(prefixOrArray, () => import("./X")))
    //    Gate-only: prefix is for matching, NOT stripped from req.url.
    const lazyMatchRe =
      /lazyMatch\s*\(\s*(?:\[[^\]]*\]|['"`][^'"`]+['"`])\s*,\s*\(\)\s*=>\s*import\s*\(\s*(['"`])([^'"`]+)\1/g;
    for (let m: RegExpExecArray | null; (m = lazyMatchRe.exec(src)); ) {
      recordMount(m[2]!, { prefixStrip: null, source: basename(file) });
    }

    // 4) router.use(lazyRegister(() => import("./X")))
    //    Register fns apply their own router.use mounts internally; treat
    //    file paths as absolute. (The script does not follow nested
    //    register() bodies — they are usually small adapter modules.)
    const lazyRegisterRe =
      /lazy(?:Register|RegisterMatch)\s*\(\s*(?:\[[^\]]*\]\s*,\s*|['"`][^'"`]+['"`]\s*,\s*)?\(\)\s*=>\s*import\s*\(\s*(['"`])([^'"`]+)\1/g;
    for (let m: RegExpExecArray | null; (m = lazyRegisterRe.exec(src)); ) {
      recordMount(m[2]!, { prefixStrip: null, source: basename(file) });
    }
  }

  return result;
}

function normaliseImport(p: string): string {
  // Drop any "./" / "../" prefix and trailing "/index" so we can look up
  // by basename. `./admin` and `./admin/index` should both resolve to
  // the key "admin".
  let cleaned = p.replace(/\.(?:ts|js|mjs)$/, "");
  if (cleaned.endsWith("/index")) cleaned = cleaned.slice(0, -"/index".length);
  return cleaned.split("/").pop() ?? cleaned;
}

function fileKey(file: string): string {
  // For `routes/admin/index.ts`, fileKey is "admin" so that an
  // `import("../admin")` mount declaration finds it. For `routes/counsel.ts`,
  // fileKey is "counsel".
  const name = basename(file).replace(/\.(?:ts|js|mjs)$/, "");
  if (name === "index") {
    return basename(dirname(file));
  }
  return name;
}

// ---------------------------------------------------------------------------
// Per-file route extractor
// ---------------------------------------------------------------------------
function extractRoutes(file: string): { method: HttpMethod; path: string }[] {
  const src = stripComments(readSource(file));
  const out: { method: HttpMethod; path: string }[] = [];

  // router.METHOD("path", …)
  const methodAlt = HTTP_METHODS.join("|");
  const re = new RegExp(
    `router\\s*\\.\\s*(${methodAlt})\\s*\\(\\s*(['"\`])([^'"\`]+)\\2`,
    "g",
  );
  for (let m: RegExpExecArray | null; (m = re.exec(src)); ) {
    out.push({ method: m[1] as HttpMethod, path: m[3]! });
  }

  // router.route("path").METHOD(…).METHOD(…)
  const routeRe = /router\s*\.\s*route\s*\(\s*(['"`])([^'"`]+)\1\s*\)([^\n;]+)/g;
  for (let m: RegExpExecArray | null; (m = routeRe.exec(src)); ) {
    const path = m[2]!;
    const tail = m[3]!;
    const verbRe = new RegExp(`\\.\\s*(${methodAlt})\\s*\\(`, "g");
    for (let vm: RegExpExecArray | null; (vm = verbRe.exec(tail)); ) {
      out.push({ method: vm[1] as HttpMethod, path });
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// OpenAPI loader
// ---------------------------------------------------------------------------
function loadSpecOperations(): Operation[] {
  const raw = readFileSync(SPEC_PATH, "utf-8");
  const doc = yamlLoad(raw) as { paths?: Record<string, Record<string, unknown>> };
  if (!doc?.paths) return [];
  const ops: Operation[] = [];
  for (const [path, methods] of Object.entries(doc.paths)) {
    if (!methods || typeof methods !== "object") continue;
    for (const m of Object.keys(methods)) {
      if ((HTTP_METHODS as readonly string[]).includes(m)) {
        ops.push({ method: m.toUpperCase(), path });
      }
    }
  }
  return ops;
}

// ---------------------------------------------------------------------------
// Audit assembly
// ---------------------------------------------------------------------------
function dedupe(ops: Operation[]): Operation[] {
  const seen = new Set<string>();
  const out: Operation[] = [];
  for (const op of ops) {
    const k = `${op.method} ${op.path}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(op);
  }
  return out;
}

const opKey = (op: Operation): string => `${op.method} ${op.path}`;

function collectAppLevelRoutes(): Operation[] {
  // app.ts registers a handful of routes directly under `/api/...` (health
  // probes, version, csrf-token, env-registry, openapi document, etc.).
  // Capture them by scanning `app.METHOD("/api/...")` calls.
  const appFile = join(__dirname, "../app.ts");
  const src = stripComments(readSource(appFile));
  const methodAlt = HTTP_METHODS.join("|");
  const re = new RegExp(
    `app\\s*\\.\\s*(${methodAlt})\\s*\\(\\s*(['"\`])([^'"\`]+)\\2`,
    "g",
  );
  const ops: Operation[] = [];
  for (let m: RegExpExecArray | null; (m = re.exec(src)); ) {
    const path = m[3]!;
    if (!path.startsWith("/api/") && path !== "/api") continue;
    const stripped = path === "/api" ? "/" : path.slice(4);
    const normalised = expressPathToOpenApi(stripped);
    ops.push({ method: (m[1] as HttpMethod).toUpperCase(), path: normalised, source: "app.ts" });
  }
  return ops;
}

function collectRuntimeOperations(): Operation[] {
  const mounts = buildMountMap();
  const allFiles = listRouteFiles(ROUTES_DIR);
  const ops: Operation[] = collectAppLevelRoutes();

  for (const file of allFiles) {
    const key = fileKey(file);
    const routes = extractRoutes(file);
    if (routes.length === 0) continue;

    const fileMounts = mounts.get(key) ?? [{ prefixStrip: null, source: "(unmounted)" }];
    for (const { prefixStrip, source } of fileMounts) {
      for (const r of routes) {
        const fullPath = expressPathToOpenApi(
          prefixStrip ? joinPaths(prefixStrip, r.path) : r.path,
        );
        // Skip purely-mount catch-alls (paths that have collapsed to "/").
        if (fullPath === "/") continue;
        ops.push({ method: r.method.toUpperCase(), path: fullPath, source: `${basename(file)} via ${source}` });
      }
    }
  }
  return dedupe(ops);
}

function main() {
  const runtime = collectRuntimeOperations();
  const spec = dedupe(loadSpecOperations());

  const runtimeKeys = new Set(runtime.map(opKey));
  const specKeys = new Set(spec.map(opKey));

  const missingInSpec = runtime.filter((op) => !specKeys.has(opKey(op)));
  const missingInServer = spec.filter((op) => !runtimeKeys.has(opKey(op)));

  const summary = {
    runtimeOperations: runtime.length,
    specOperations: spec.length,
    missingInSpec: missingInSpec.length,
    missingInServer: missingInServer.length,
  };

  if (wantJson) {
    console.log(
      JSON.stringify(
        { summary, missingInSpec, missingInServer },
        null,
        2,
      ),
    );
  } else {
    console.log("OpenAPI ↔ Express route drift audit");
    console.log("===================================");
    console.log(`Runtime operations: ${summary.runtimeOperations}`);
    console.log(`Spec operations:    ${summary.specOperations}`);
    console.log("");
    console.log(
      `Missing in spec    (${missingInSpec.length}): route handlers that have no documented operation`,
    );
    for (const op of missingInSpec.slice(0, 200)) {
      console.log(`  - ${op.method.padEnd(6)} ${op.path}    [${op.source ?? "?"}]`);
    }
    if (missingInSpec.length > 200) {
      console.log(`  … and ${missingInSpec.length - 200} more`);
    }
    console.log("");
    console.log(
      `Missing in server  (${missingInServer.length}): documented operations with no matching route`,
    );
    for (const op of missingInServer.slice(0, 200)) {
      console.log(`  - ${op.method.padEnd(6)} ${op.path}`);
    }
    if (missingInServer.length > 200) {
      console.log(`  … and ${missingInServer.length - 200} more`);
    }
  }

  if (strict && (missingInSpec.length > 0 || missingInServer.length > 0)) {
    console.error("\n[validate-openapi-routes] Drift detected — failing because --strict was set.");
    process.exit(1);
  }
  if (strictSpecOnly && missingInServer.length > 0) {
    console.error(
      "\n[validate-openapi-routes] Spec references operations that no route serves — failing because --strict-spec-only was set.",
    );
    process.exit(1);
  }
  process.exit(0);
}

main();
