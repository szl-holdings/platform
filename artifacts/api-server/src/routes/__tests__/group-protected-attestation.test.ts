import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * GROUP-PROTECTED route attestation guardrail.
 *
 * The route security matrix script
 * (`src/scripts/route-security-matrix.ts`) keeps a hand-curated
 * `GROUP_PROTECTED_BASENAMES` set of route files that are NOT self-protected
 * (no auth middleware imported in the file itself), but whose protection is
 * supplied at registration time — typically by a `routes/groups/*.ts` file
 * that calls `tenantScope({ required: true })` (or `adminGuard`,
 * `requireRole("admin")`, etc.) for the prefix the file is mounted under.
 *
 * That set was attested in April 2026 by manual audit. Without a guardrail,
 * a refactor to a group file (e.g. dropping a `tenantScope` call, renaming a
 * mount prefix, removing an import) leaves the attestation stale: the
 * matrix script will still happily report the route as `GROUP-PROTECTED`,
 * even though the gate is gone.
 *
 * This test re-verifies the attestation on every CI run. It encodes, for
 * each basename in `GROUP_PROTECTED_BASENAMES`, exactly *how* that file is
 * protected, and re-checks the underlying source on disk. If any group file
 * stops applying the gate, this test fails — forcing the developer to
 * either restore the middleware or reclassify the route as PROTECTED
 * (with explicit middleware in the file) or PUBLIC.
 */

const ROUTES_DIR = path.join(__dirname, "..");
const GROUPS_DIR = path.join(ROUTES_DIR, "groups");
const SCRIPT_PATH = path.join(__dirname, "../../scripts/route-security-matrix.ts");
const ENFORCER_PATH = path.join(__dirname, "../../middlewares/global-auth-enforcer.ts");
const ADMIN_INDEX_PATH = path.join(ROUTES_DIR, "admin/index.ts");
const MAIN_INDEX_PATH = path.join(ROUTES_DIR, "index.ts");

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readGroupProtectedBasenames(): Set<string> {
  const src = fs.readFileSync(SCRIPT_PATH, "utf-8");
  const block = src.match(
    /const\s+GROUP_PROTECTED_BASENAMES\s*=\s*new Set\(\[([\s\S]*?)\]\)/,
  );
  if (!block) {
    throw new Error(
      "Could not locate GROUP_PROTECTED_BASENAMES in route-security-matrix.ts",
    );
  }
  const set = new Set<string>();
  for (const m of block[1].matchAll(/"([^"]+)"/g)) set.add(m[1]);
  return set;
}

type Attestation =
  // Mounted in `groupFile`; that file applies tenantScope({required:true})
  // at `gatePrefix` (which covers the router's internal paths).
  | { kind: "tenant-scope-gate"; groupFile: string; gatePrefix: string }
  // Lives under `routes/admin/`. Gated by admin/index.ts which applies
  // authMiddleware() + requireRole("admin") to /admin.
  | { kind: "admin-subroute" }
  // Helper module sub-required by other route files (not directly registered
  // on a router). Protected by virtue of its callers being protected.
  | { kind: "transitive-helper"; requiredBy: string[] }
  // File enforces its own auth via inline isAuthenticated()/req.user checks.
  | { kind: "inline-auth" }
  // File is intentionally public read-only (no per-tenant data, no req.user)
  // — protection comes from the global enforcer allowlist.
  | { kind: "public-read-only" }
  // File serves only paths that are in PUBLIC_PREFIXES of the global enforcer.
  | { kind: "public-via-enforcer"; pathPrefix: string }
  // Mounted directly in routes/index.ts (not in any group file). Protection
  // for the non-public surface comes from the deny-by-default global
  // enforcer (NODE_ENV === "production"). Some endpoints are intentionally
  // public via the enforcer allowlist; others require auth implicitly.
  | { kind: "main-index-mount" };

const ATTESTATIONS: Record<string, Attestation> = {
  // ---- platform.ts group ----
  "changelog.ts": {
    kind: "tenant-scope-gate",
    groupFile: "platform.ts",
    gatePrefix: "/changelog",
  },
  // privacy.ts only serves GET /privacy/policy and similar read-only policy
  // text. No req.user, no per-tenant data. Effectively public information.
  "privacy.ts": { kind: "public-read-only" },

  // ---- data-services.ts group ----
  "analytics.ts": {
    kind: "tenant-scope-gate",
    groupFile: "data-services.ts",
    gatePrefix: "/analytics",
  },
  "analytics-engine.ts": {
    kind: "tenant-scope-gate",
    groupFile: "data-services.ts",
    gatePrefix: "/analytics-engine",
  },
  "telemetry.ts": {
    kind: "tenant-scope-gate",
    groupFile: "data-services.ts",
    gatePrefix: "/telemetry",
  },

  // ---- billing.ts group ----
  "services.ts": {
    kind: "tenant-scope-gate",
    groupFile: "billing.ts",
    gatePrefix: "/services",
  },

  // ---- core.ts group ----
  // config.ts is mounted in core.ts at root; it self-protects with inline
  // isAuthenticated() + role checks in every handler.
  "config.ts": { kind: "inline-auth" },
  // oidc-auth.ts handles /api/auth/* which is in PUBLIC_PREFIXES.
  "oidc-auth.ts": { kind: "public-via-enforcer", pathPrefix: "/api/auth/" },

  // ---- ai.ts group ----
  "a2a.ts": {
    kind: "tenant-scope-gate",
    groupFile: "ai.ts",
    gatePrefix: "/a2a",
  },
  "ai-safety.ts": {
    kind: "tenant-scope-gate",
    groupFile: "ai.ts",
    gatePrefix: "/ai-safety",
  },
  "fine-tuning.ts": {
    kind: "tenant-scope-gate",
    groupFile: "ai.ts",
    gatePrefix: "/fine-tuning",
  },

  // ---- admin/* — gated by admin/index.ts (authMiddleware + requireRole) ----
  "admin/flags.ts": { kind: "admin-subroute" },
  "admin/growth.ts": { kind: "admin-subroute" },
  "admin/integrations.ts": { kind: "admin-subroute" },
  "admin/seed.ts": { kind: "admin-subroute" },
  "admin/support.ts": { kind: "admin-subroute" },
  "admin/system.ts": { kind: "admin-subroute" },
  "admin/usage.ts": { kind: "admin-subroute" },

  // ---- transitive helpers (sub-required by other protected route files) ----
  "control-tower/shared.ts": {
    kind: "transitive-helper",
    requiredBy: [
      "control-tower/sense.ts",
      "control-tower/decide.ts",
      "control-tower/act.ts",
      "control-tower/govern-evolve.ts",
    ],
  },
  "domain-agents/configs.ts": {
    kind: "transitive-helper",
    requiredBy: ["domain-agents/index.ts", "domain-agents/runner.ts"],
  },
  "domain-agents/runner.ts": {
    kind: "transitive-helper",
    requiredBy: ["domain-agents/index.ts"],
  },
  "lyte-cognitive-helpers.ts": {
    kind: "transitive-helper",
    requiredBy: ["lyte-cognitive.ts"],
  },

  // ---- mounted directly in routes/index.ts (not in any group file) ----
  // These rely on the global deny-by-default enforcer for their protected
  // surface. The matrix script tracks them as "GROUP-PROTECTED" because
  // they're not self-protected, but they are also not in a group file.
  "fund-inbound-deals.ts": { kind: "main-index-mount" },
  "executive-briefings.ts": { kind: "main-index-mount" },
  "aegis-pcap.ts": { kind: "main-index-mount" },
  "trust-provenance.ts": { kind: "main-index-mount" },
  "maps.ts": { kind: "main-index-mount" },
};

describe("GROUP_PROTECTED_BASENAMES attestation guardrail", () => {
  const attested = readGroupProtectedBasenames();

  it("every basename in GROUP_PROTECTED_BASENAMES has an attestation entry in this test", () => {
    const missing: string[] = [];
    for (const b of attested) {
      if (!(b in ATTESTATIONS)) missing.push(b);
    }
    expect(
      missing,
      `Basename(s) added to GROUP_PROTECTED_BASENAMES without an attestation ` +
        `entry in routes/__tests__/group-protected-attestation.test.ts: ` +
        `${missing.join(", ")}. Add an entry describing exactly how the file ` +
        `is protected (which group file gates it, at which prefix, etc.).`,
    ).toEqual([]);
  });

  it("every attestation entry corresponds to a basename in GROUP_PROTECTED_BASENAMES", () => {
    const stale: string[] = [];
    for (const b of Object.keys(ATTESTATIONS)) {
      if (!attested.has(b)) stale.push(b);
    }
    expect(
      stale,
      `Attestation entries no longer present in GROUP_PROTECTED_BASENAMES: ` +
        `${stale.join(", ")}. Either remove the stale entries from this test ` +
        `or re-add the basenames to GROUP_PROTECTED_BASENAMES in ` +
        `route-security-matrix.ts.`,
    ).toEqual([]);
  });

  for (const [basename, att] of Object.entries(ATTESTATIONS)) {
    describe(basename, () => {
      const filePath = path.join(ROUTES_DIR, basename);

      it("route file still exists on disk", () => {
        expect(
          fs.existsSync(filePath),
          `${basename} is attested as group-protected but no file exists at ${filePath}`,
        ).toBe(true);
      });

      if (att.kind === "tenant-scope-gate") {
        it(`${att.groupFile} still imports it, mounts it, AND applies tenantScope({ required: true }) at ${att.gatePrefix}`, () => {
          const groupPath = path.join(GROUPS_DIR, att.groupFile);
          const rawSrc = fs.readFileSync(groupPath, "utf-8");
          // Strip comments so commented-out router.use(...) lines don't
          // satisfy the import/mount/gate checks.
          const src = rawSrc
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\/\/.*$/gm, "");
          const moduleName = basename.replace(/\.ts$/, "");

          // 1. The group file must still import the router from this module.
          //    Capture the binding name so we can verify it's actually mounted.
          //    Supported import shapes:
          //      import fooRouter from "../foo";
          //      import { fooRouter } from "../foo";
          //      import * as foo from "../foo";
          //      import fooRouter, { other } from "../foo";
          //      router.use(lazyMount(() => import("../foo"), ...))   // lazy
          //      router.use(lazyMatch(prefix, () => import("../foo"), ...))
          //      router.use(lazyRegister(() => import("../foo"), ...))
          //      router.use(lazyRegisterMatch(prefix, () => import("../foo"), ...))
          //
          //    Lazy-loaded modules satisfy the import + mount checks in a
          //    single expression (the dynamic import IS the import, and the
          //    enclosing router.use(...) IS the mount). The tenantScope gate
          //    check below remains untouched — that's the real security
          //    guarantee, and lazy loading does not affect it.
          //
          //    We iterate every import statement in the file rather than
          //    using a single regex, because non-greedy `[\s\S]*?` can leak
          //    across earlier import statements and capture the wrong clause.
          const importStmtRe =
            /import\s+(?!type\b)([\s\S]+?)\s+from\s+["']([^"']+)["']/g;
          let importMatch: RegExpExecArray | null = null;
          for (
            let m: RegExpExecArray | null;
            (m = importStmtRe.exec(src)) !== null;
          ) {
            const spec = m[2].replace(/\.js$/, "");
            if (spec === `../${moduleName}`) {
              importMatch = m;
              break;
            }
          }
          // Lazy-import detection: a `router.use(lazy*(... import("../X")))`
          // call counts as both import AND mount.
          const lazyMountRe = new RegExp(
            `router\\.use\\(\\s*(?:lazyMount|lazyMatch|lazyRegister|lazyRegisterMatch)\\(` +
              `[\\s\\S]*?import\\(\\s*["']\\.\\./${escapeRegex(moduleName)}(?:\\.js)?["']\\s*\\)`,
          );
          const hasLazyMount = lazyMountRe.test(src);
          expect(
            importMatch !== null || hasLazyMount,
            `${att.groupFile} no longer imports "../${moduleName}" (neither ` +
              `as a static import nor as a lazyMount/lazyMatch/lazyRegister ` +
              `dynamic import). If the file moved, update ` +
              `GROUP_PROTECTED_BASENAMES and this attestation.`,
          ).toBe(true);

          // If the import is via a lazy helper, the import + mount check is
          // already satisfied by hasLazyMount; we can skip the binding-name
          // mount check below.
          if (hasLazyMount && !importMatch) {
            // 3. The gate prefix must still have a tenantScope({ required: true })
            //    call in the same group file.
            const gateRe = new RegExp(
              `router\\.use\\(\\s*["']${escapeRegex(att.gatePrefix)}["']\\s*,` +
                `\\s*tenantScope\\(\\s*\\{\\s*required\\s*:\\s*true`,
            );
            expect(
              gateRe.test(src),
              `${att.groupFile} no longer applies tenantScope({ required: true }) ` +
                `at "${att.gatePrefix}". Either restore the gate, or reclassify ` +
                `${basename} as PROTECTED by adding explicit auth middleware to ` +
                `the file itself (and remove it from GROUP_PROTECTED_BASENAMES).`,
            ).toBe(true);
            return;
          }

          // Extract the bound symbol(s) — default-import name, named-imports,
          // or namespace-import name.
          const clause = importMatch![1].trim();
          const bindings: string[] = [];
          const nsMatch = clause.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)/);
          const namedMatch = clause.match(/\{([^}]+)\}/);
          if (nsMatch) {
            bindings.push(nsMatch[1]);
          } else if (namedMatch) {
            for (const piece of namedMatch[1].split(",")) {
              const name = piece.trim().split(/\s+as\s+/).pop();
              if (name) bindings.push(name);
            }
          } else {
            // Default import — first identifier in the clause.
            const def = clause.match(/^([A-Za-z_$][\w$]*)/);
            if (def) bindings.push(def[1]);
            // Plus any named imports tagged on after the default.
            if (namedMatch) {
              for (const piece of namedMatch[1].split(",")) {
                const name = piece.trim().split(/\s+as\s+/).pop();
                if (name) bindings.push(name);
              }
            }
          }
          expect(
            bindings.length > 0,
            `Could not parse the import binding for ../${moduleName} in ${att.groupFile}.`,
          ).toBe(true);

          // 2. At least one of the imported bindings must be actually mounted
          //    via `router.use(...)` or registered via a `<binding>.register(router)`
          //    call. Otherwise the import is dead and the route is unreachable
          //    via this group file.
          const isMounted = bindings.some((name) => {
            const useRe = new RegExp(
              `router\\.use\\([^)]*\\b${escapeRegex(name)}\\b`,
            );
            const registerRe = new RegExp(
              `\\b${escapeRegex(name)}\\.register\\s*\\(`,
            );
            return useRe.test(src) || registerRe.test(src);
          });
          expect(
            isMounted,
            `${att.groupFile} imports "../${moduleName}" but no longer mounts ` +
              `it via router.use(${bindings.join("|")}) or ` +
              `${bindings[0]}.register(router). ` +
              `Either restore the registration, remove the dead import, or ` +
              `remove ${basename} from GROUP_PROTECTED_BASENAMES.`,
          ).toBe(true);

          // 3. The gate prefix must still have a tenantScope({ required: true })
          //    call in the same group file.
          const gateRe = new RegExp(
            `router\\.use\\(\\s*["']${escapeRegex(att.gatePrefix)}["']\\s*,` +
              `\\s*tenantScope\\(\\s*\\{\\s*required\\s*:\\s*true`,
          );
          expect(
            gateRe.test(src),
            `${att.groupFile} no longer applies tenantScope({ required: true }) ` +
              `at "${att.gatePrefix}". Either restore the gate, or reclassify ` +
              `${basename} as PROTECTED by adding explicit auth middleware to ` +
              `the file itself (and remove it from GROUP_PROTECTED_BASENAMES).`,
          ).toBe(true);
        });
      }

      if (att.kind === "admin-subroute") {
        it("admin/index.ts still imports it AND applies authMiddleware + requireRole(\"admin\") at /admin", () => {
          const src = fs.readFileSync(ADMIN_INDEX_PATH, "utf-8");
          const moduleName = basename
            .replace(/^admin\//, "")
            .replace(/\.ts$/, "");

          const importRe = new RegExp(
            `from\\s+["']\\./${escapeRegex(moduleName)}(?:\\.js)?["']`,
          );
          expect(
            importRe.test(src),
            `admin/index.ts no longer imports "./${moduleName}".`,
          ).toBe(true);

          expect(
            /adminRouter\.use\(\s*["']\/admin["']\s*,\s*authMiddleware\(\s*\)\s*\)/.test(
              src,
            ),
            `admin/index.ts no longer applies authMiddleware() at /admin. ` +
              `Restore it or reclassify each admin/* file as PROTECTED.`,
          ).toBe(true);

          expect(
            /adminRouter\.use\(\s*["']\/admin["']\s*,\s*requireRole\(\s*["']admin["']\s*\)\s*\)/.test(
              src,
            ),
            `admin/index.ts no longer applies requireRole("admin") at /admin. ` +
              `Restore it or reclassify each admin/* file as PROTECTED.`,
          ).toBe(true);
        });
      }

      if (att.kind === "transitive-helper") {
        it(`still imported by at least one of [${att.requiredBy.join(", ")}]`, () => {
          const helperModule = basename.replace(/\.ts$/, "");
          const matches: string[] = [];
          for (const requirer of att.requiredBy) {
            const reqPath = path.join(ROUTES_DIR, requirer);
            if (!fs.existsSync(reqPath)) continue;
            const src = fs.readFileSync(reqPath, "utf-8");
            // Compute the relative module-specifier the requirer would use.
            // helperModule and requirer share a directory, so the import is
            // typically `./<basename-without-ext>`.
            const requirerDir = path.dirname(requirer);
            const helperRel = path.relative(
              requirerDir,
              helperModule,
            ).split(path.sep).join("/");
            const spec = helperRel.startsWith(".") ? helperRel : `./${helperRel}`;
            const importRe = new RegExp(
              `from\\s+["']${escapeRegex(spec)}(?:\\.js)?["']`,
            );
            if (importRe.test(src)) matches.push(requirer);
          }
          expect(
            matches.length > 0,
            `${basename} is no longer imported by any of [${att.requiredBy.join(", ")}]. ` +
              `Either remove ${basename} from GROUP_PROTECTED_BASENAMES (it's ` +
              `dead code) or update the requiredBy list in this attestation.`,
          ).toBe(true);
        });
      }

      if (att.kind === "inline-auth") {
        it("file still self-protects with inline isAuthenticated()/req.user check", () => {
          const src = fs.readFileSync(filePath, "utf-8");
          const hasInline =
            /\bisAuthenticated\s*\(\s*\)/.test(src) ||
            /\breq\.user\b/.test(src) ||
            /\breq\.oidcUser\b/.test(src);
          expect(
            hasInline,
            `${basename} no longer contains inline auth checks ` +
              `(isAuthenticated()/req.user/req.oidcUser). Either restore the ` +
              `inline guards or reclassify by removing it from ` +
              `GROUP_PROTECTED_BASENAMES and using a group-level gate.`,
          ).toBe(true);
        });
      }

      if (att.kind === "public-read-only") {
        it("file is still public read-only (no per-user/per-tenant data access)", () => {
          const src = fs.readFileSync(filePath, "utf-8");
          // Strip line/block comments so JSDoc references to req.user don't
          // produce false positives.
          const stripped = src
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\/\/.*$/gm, "");
          const leakedUser =
            /\breq\.user\b/.test(stripped) ||
            /\breq\.oidcUser\b/.test(stripped) ||
            /\bisAuthenticated\s*\(\s*\)/.test(stripped);
          expect(
            !leakedUser,
            `${basename} is attested as public read-only but now references ` +
              `req.user/req.oidcUser/isAuthenticated. If the route now ` +
              `handles per-user data, add explicit auth middleware to the ` +
              `file (and reclassify as PROTECTED) or move it under a ` +
              `tenant-scoped group prefix.`,
          ).toBe(true);
          // Also verify it only registers GET handlers (defensive — public
          // read-only files should not accept mutations).
          const hasMutation = /router\.(post|put|patch|delete)\s*\(/.test(src);
          expect(
            !hasMutation,
            `${basename} is attested as public read-only but now registers ` +
              `mutating handlers (POST/PUT/PATCH/DELETE). Add explicit auth ` +
              `middleware before exposing writes.`,
          ).toBe(true);
        });
      }

      if (att.kind === "public-via-enforcer") {
        it(`${att.pathPrefix} still listed in global-auth-enforcer PUBLIC_PREFIXES`, () => {
          const src = fs.readFileSync(ENFORCER_PATH, "utf-8");
          const found =
            src.includes(`"${att.pathPrefix}"`) ||
            src.includes(`'${att.pathPrefix}'`);
          expect(
            found,
            `${att.pathPrefix} no longer present in global-auth-enforcer.ts. ` +
              `Either restore the public allowlist entry or reclassify ` +
              `${basename} (it is no longer accessible without auth).`,
          ).toBe(true);
        });
      }

      if (att.kind === "main-index-mount") {
        it("still mounted (imported) in routes/index.ts", () => {
          const src = fs.readFileSync(MAIN_INDEX_PATH, "utf-8");
          const moduleName = basename.replace(/\.ts$/, "");
          // Accept either a static `from "./X"` import or a lazy
          // `lazyMount/lazyMatch(... import("./X") ...)` mount expression.
          const staticRe = new RegExp(
            `from\\s+["']\\./${escapeRegex(moduleName)}(?:\\.js)?["']`,
          );
          const lazyRe = new RegExp(
            `(?:lazyMount|lazyMatch|lazyRegister|lazyRegisterMatch)\\(` +
              `[\\s\\S]*?import\\(\\s*["']\\./${escapeRegex(moduleName)}(?:\\.js)?["']\\s*\\)`,
          );
          expect(
            staticRe.test(src) || lazyRe.test(src),
            `routes/index.ts no longer imports "./${moduleName}" (neither ` +
              `as a static import nor as a lazyMount/lazyMatch dynamic ` +
              `import). Either restore the mount or remove ${basename} from ` +
              `GROUP_PROTECTED_BASENAMES.`,
          ).toBe(true);
        });
      }
    });
  }
});
