/**
 * Sub-Router Middleware Path-Scope Regression Test (task #1395)
 *
 * Rule (see artifacts/api-server/README.md → "Sub-router middleware
 * path-scoping"): a sub-router file mounted on a SHARED parent router via
 * `lazyMatch('/<prefix>', ...)` MUST path-scope any top-level
 * `authMiddleware` / `tenantScope` / `requireRole` it installs, otherwise
 * the guard runs for every request under the shared prefix and silently
 * blocks unrelated public sibling routes.
 *
 * Background: alloy-digest.ts, agent-os.ts, consciousness.ts and
 * carlota-time-tracking were each broken by this footgun in past tasks
 * (#718, #1329, original Carlota Jo bug). This test enumerates the files
 * tightened in the task #1395 sweep (and the task #3453 wider sweep of
 * lazyMount-mounted files) and asserts each one keeps the defensive
 * `router.use('/<owner-path>', ...)` form.
 *
 * If a future change drops the leading path string and reverts to the
 * unprefixed `router.use(authMiddleware())` / `router.use(tenantScope(...))`
 * form, this test fails loudly — adding back the bug would be impossible
 * without explicitly editing this list.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROUTES_DIR = join(__dirname, '..');

interface ScopedExpectation {
  file: string;
  /** Each entry is the EXACT line the file must still contain. */
  mustContain: string[];
}

/**
 * Per-file expected path-scoped middleware lines.
 *
 * `mustContain` strings are matched verbatim (whitespace-sensitive). When
 * adding a file here, prefer the narrowest path the file owns — for
 * routers sharing a broad prefix (`/alloy`, `/nuro-mesh`, `/booking`,
 * `/forge`, `/connectors`, `/prism-counsel`, …) the scope MUST narrow
 * down to the specific sub-prefix this file's routes serve, otherwise
 * sibling routers on the same broad prefix will still be 401/403'd.
 */
const EXPECTATIONS: ScopedExpectation[] = [
  // ── Prior fixes (task #718) — kept here so the regression net stays whole.
  {
    file: 'agent-os.ts',
    mustContain: [`router.use('/agent-os', tenantScope({ required: true }));`],
  },
  {
    file: 'alloy-digest.ts',
    mustContain: [`router.use('/alloy/digest', tenantScope({ required: true }));`],
  },
  {
    file: 'consciousness.ts',
    mustContain: [`router.use('/nuro-mesh/consciousness', tenantScope({ required: true }));`],
  },

  // ── Task #1395 sweep ────────────────────────────────────────────────────
  {
    file: 'agent-autonomy.ts',
    mustContain: [`router.use('/agent-autonomy', authMiddleware());`],
  },
  {
    file: 'ontology.ts',
    mustContain: [`router.use('/ontology', authMiddleware());`],
  },
  {
    file: 'briefings.ts',
    mustContain: [`router.use('/briefings', authMiddleware({ required: false }));`],
  },
  {
    file: 'booking.ts',
    mustContain: [`router.use('/booking', authMiddleware());`],
  },
  {
    file: 'drift.ts',
    mustContain: [`router.use('/drift', authMiddleware({ required: false }));`],
  },
  {
    file: 'domains.ts',
    mustContain: [`router.use('/domains', authMiddleware({ required: false }));`],
  },
  {
    file: 'imperium.ts',
    mustContain: [`router.use('/imperium', authMiddleware());`],
  },
  {
    file: 'graph.ts',
    mustContain: [`router.use('/graph', authMiddleware({ required: false }));`],
  },
  {
    file: 'forge.ts',
    mustContain: [`router.use('/forge', authMiddleware());`],
  },
  {
    file: 'nuro-mesh-advanced.ts',
    mustContain: [
      `router.use(NURO_MESH_ADVANCED_OWNED_PREFIXES, authMiddleware());`,
      `router.use(NURO_MESH_ADVANCED_OWNED_PREFIXES, tenantScope({ required: true }));`,
    ],
  },
  {
    file: 'nuro-mesh.ts',
    mustContain: [
      `nueroMeshRouter.use(NURO_MESH_OWNED_PREFIXES, authMiddleware());`,
      `nueroMeshRouter.use(NURO_MESH_OWNED_PREFIXES, tenantScope({ required: true }));`,
    ],
  },
  {
    file: 'connectors.ts',
    mustContain: [`router.use('/connectors', authMiddleware());`],
  },
  {
    file: 'alloy-skills.ts',
    mustContain: [`router.use('/alloy/skills', tenantScope({ required: true }));`],
  },
  {
    file: 'alloy-governance.ts',
    mustContain: [`router.use('/alloy/policies', tenantScope({ required: true }));`],
  },

  // ── Task #3453 sweep — lazyMount-mounted files ────────────────────────
  {
    file: 'innovation-engine.ts',
    mustContain: [`router.use(INNOVATION_ENGINE_OWNED_PREFIXES, authMiddleware());`],
  },
  {
    file: 'knowledge-graph.ts',
    mustContain: [`router.use(KNOWLEDGE_GRAPH_OWNED_PREFIXES, authMiddleware({ required: true }));`],
  },
  {
    file: 'prism-counsel-s31.ts',
    mustContain: [
      `router.use(PRISM_COUNSEL_S31_OWNED_PREFIXES, authMiddleware());`,
      `router.use(PRISM_COUNSEL_S31_OWNED_PREFIXES, tenantScope({ required: true }));`,
    ],
  },
  {
    file: 'prism-counsel-review.ts',
    mustContain: [
      `router.use('/review-desk', authMiddleware());`,
      `router.use('/review-desk', tenantScope({ required: true }));`,
    ],
  },
  {
    file: 'prism-counsel-pilot.ts',
    mustContain: [
      `router.use(PRISM_COUNSEL_PILOT_OWNED_PREFIXES, authMiddleware());`,
      `router.use(PRISM_COUNSEL_PILOT_OWNED_PREFIXES, tenantScope({ required: true }));`,
    ],
  },
  {
    file: 'prism-counsel-pilot-one.ts',
    mustContain: [
      `router.use(PRISM_COUNSEL_PILOT_ONE_OWNED_PREFIXES, authMiddleware());`,
      `router.use(PRISM_COUNSEL_PILOT_ONE_OWNED_PREFIXES, tenantScope({ required: true }));`,
    ],
  },
  {
    file: 'nexus.ts',
    mustContain: [`router.use(NEXUS_OWNED_PREFIXES, authMiddleware({ required: true }));`],
  },
  {
    file: 'provenance.ts',
    mustContain: [`router.use('/', authMiddleware());`],
  },
  {
    file: 'signal-bus.ts',
    mustContain: [`router.use(SIGNAL_BUS_OWNED_PREFIXES, authMiddleware());`],
  },
  {
    file: 'pulse.ts',
    mustContain: [`router.use(PULSE_AUTHENTICATED_PREFIXES, authMiddleware({ required: true }));`],
  },
];

/**
 * Forbidden patterns — the unprefixed forms of these guards must NOT
 * reappear in any of the fixed files. We match the exact syntactic form
 * (no leading path string) at the start of a line.
 */
const FORBIDDEN_PATTERNS: RegExp[] = [
  /^router\.use\(\s*authMiddleware\s*\(/m,
  /^router\.use\(\s*tenantScope\s*\(/m,
  /^router\.use\(\s*requireRole\s*\(/m,
];

describe('Sub-router internal middleware is path-scoped (task #1395)', () => {
  for (const exp of EXPECTATIONS) {
    describe(exp.file, () => {
      const fullPath = join(ROUTES_DIR, exp.file);
      const src = readFileSync(fullPath, 'utf8');

      for (const needle of exp.mustContain) {
        it(`contains the path-scoped guard: ${needle}`, () => {
          expect(
            src.includes(needle),
            `Expected ${exp.file} to contain:\n  ${needle}\n` +
              `If you intentionally changed the owner path, update the EXPECTATIONS ` +
              `entry in this file. Do NOT drop the leading path argument — that ` +
              `re-introduces the footgun documented in artifacts/api-server/README.md ` +
              `("Sub-router middleware path-scoping").`,
          ).toBe(true);
        });
      }

      for (const forbidden of FORBIDDEN_PATTERNS) {
        it(`does not contain unprefixed pattern ${forbidden}`, () => {
          expect(
            forbidden.test(src),
            `${exp.file} contains a top-level unprefixed guard ` +
              `matching ${forbidden}.\n` +
              `Path-scope it: router.use('/<owner-path>', <middleware>())`,
          ).toBe(false);
        });
      }
    });
  }
});
