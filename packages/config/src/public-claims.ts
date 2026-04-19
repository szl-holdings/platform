/**
 * Public Claims Registry
 *
 * Every number, tagline, and capability claim that appears on any public
 * surface (websites, pitch deck, README, marketing copy) must be defined here.
 *
 * Truth value:
 *   "verified"     — traceable to live data or confirmed measurement
 *   "demo-data"    — seed/fixture value; must be labeled [Demo] in UI
 *   "aspirational" — future-state projection; must be labeled [Projected] in UI
 *   "pending"      — measurement methodology exists but data not yet collected
 *
 * DO NOT add a claim unless you know its truth value.
 * DO NOT display a claim without the corresponding UI label when required.
 */

export type ClaimTruthValue = "verified" | "demo-data" | "aspirational" | "pending";

export interface PublicClaim {
  id: string;
  surface: string;
  claim: string;
  truthValue: ClaimTruthValue;
  source: string;
  displayLabel: string | null;
  notes: string;
}

export const PUBLIC_CLAIMS: PublicClaim[] = [
  // Platform core claims
  {
    id: "tagline-governed-decision",
    surface: "README, szl-holdings landing",
    claim:
      "Governed decision infrastructure — connecting what is observable to what is executable, with full attribution.",
    truthValue: "verified",
    source: "Architecture: proof-chain lib, policy-engine, action-engine",
    displayLabel: null,
    notes: "Accurate description of the platform architecture.",
  },
  {
    id: "covenant-policy-enforcement",
    surface: "README, trust center",
    claim: "AI cannot execute consequential actions without human confirmation.",
    truthValue: "verified",
    source: "packages/policy-engine, packages/action-engine",
    displayLabel: null,
    notes: "Enforced architecturally via Covenant Policy.",
  },
  {
    id: "tenant-isolation",
    surface: "README, trust center",
    claim: "All queries scoped by org identifier; cross-org access returns 404.",
    truthValue: "verified",
    source: "artifacts/api-server/src/lib/tenant-scope.ts",
    displayLabel: null,
    notes: "Verified in April 2026 pen test remediation.",
  },

  // Lyte / szl-holdings claims
  {
    id: "lyte-signal-detection-time",
    surface: "szl-holdings venture card",
    claim: "< 4 min average signal detection time",
    truthValue: "pending",
    source: "artifacts/szl-holdings/src/data/ventures.ts",
    displayLabel: "[Demo]",
    notes:
      "No live telemetry confirms this. Must display [Demo] until instrumented.",
  },
  {
    id: "lyte-signals-per-day",
    surface: "szl-holdings venture card",
    claim: "2.4M+ signals processed per day",
    truthValue: "pending",
    source: "artifacts/szl-holdings/src/data/ventures.ts",
    displayLabel: "[Demo]",
    notes:
      "No live signal volume telemetry. Must display [Demo] until instrumented.",
  },
  {
    id: "lyte-false-positive-rate",
    surface: "szl-holdings venture card",
    claim: "< 3% false positive rate",
    truthValue: "pending",
    source: "artifacts/szl-holdings/src/data/ventures.ts",
    displayLabel: "[Demo]",
    notes: "No live evaluation data. Must display [Demo] until instrumented.",
  },

  // Vessels claims
  {
    id: "vessels-count",
    surface: "szl-holdings venture card",
    claim: "52,000+ vessels monitored",
    truthValue: "aspirational",
    source: "artifacts/szl-holdings/src/data/ventures.ts",
    displayLabel: "[Projected]",
    notes:
      "AIS not subscribed. No live vessel tracking. Represents addressable fleet, not current monitoring.",
  },
  {
    id: "vessels-dark-detection-lead",
    surface: "szl-holdings venture card",
    claim: "34 days before formal designation for dark vessel detection",
    truthValue: "demo-data",
    source: "artifacts/szl-holdings/src/data/ventures.ts",
    displayLabel: "[Demo]",
    notes: "Demo scenario data. No live dark fleet ML model.",
  },

  // Aegis claims
  {
    id: "aegis-simulations",
    surface: "szl-holdings, szl-demo-video",
    claim: "31,200+ simulations executed",
    truthValue: "demo-data",
    source:
      "artifacts/szl-holdings/src/data/ventures.ts, artifacts/szl-demo-video/src/components/video/video_scenes/Scene2.tsx",
    displayLabel: "[Demo]",
    notes: "Hardcoded count. Not derived from simulation DB.",
  },
  {
    id: "aegis-mitre-coverage",
    surface: "szl-holdings, aegis, szl-demo-video",
    claim: "200+ MITRE ATT&CK techniques covered",
    truthValue: "aspirational",
    source:
      "artifacts/aegis/src/pages/digital-twin.tsx, artifacts/szl-demo-video",
    displayLabel: "[Projected]",
    notes:
      "MITRE ATT&CK v14 feed is real; coverage count is aspirational, not measured.",
  },

  // Market sizing (pitch deck only — not operational metrics)
  {
    id: "market-maritime-size",
    surface: "aegis pitch deck",
    claim: "$4.2B maritime intelligence market",
    truthValue: "aspirational",
    source: "artifacts/aegis/src/pages/slides/S11Market.tsx",
    displayLabel: "[Market estimate]",
    notes: "Analyst estimate; cite source in slide. Not an AUM figure.",
  },
  {
    id: "market-governed-decision",
    surface: "aegis pitch deck",
    claim: "$50.1B governed decision infrastructure market by 2030",
    truthValue: "aspirational",
    source: "artifacts/aegis/src/pages/slides",
    displayLabel: "[Projected market]",
    notes: "Projection; cite source. Not a revenue figure.",
  },

  // Carlota Jo claims
  {
    id: "carlota-jo-retention",
    surface: "carlota-jo landing, advisory intel",
    claim: "98% client retention",
    truthValue: "pending",
    source:
      "artifacts/carlota-jo/src/pages/PremiumHome.tsx, AdvisoryIntel.tsx, pulse.tsx",
    displayLabel: "[Demo]",
    notes: "No CRM data source. Must display [Demo] until CRM confirms.",
  },
  {
    id: "carlota-jo-experience",
    surface: "carlota-jo landing",
    claim: "18 years of private advisory experience",
    truthValue: "verified",
    source: "artifacts/carlota-jo/src/pages/PremiumHome.tsx",
    displayLabel: null,
    notes:
      "Biographical claim. Should be derived from a founderStartYear constant to auto-update.",
  },

  // Infrastructure claims
  {
    id: "uptime-claim",
    surface: "command marketing/status page",
    claim: "99.98% uptime",
    truthValue: "demo-data",
    source: "artifacts/command/src/pages/marketing/status.tsx",
    displayLabel: "[Demo]",
    notes:
      "Hardcoded in static data file. No real uptime monitor. Must show [Demo] or be removed.",
  },
  {
    id: "command-uptime-30day",
    surface: "command marketing/status page — 30-day metric",
    claim: "99.98%",
    truthValue: "demo-data",
    source: "artifacts/command/src/pages/marketing/status.tsx",
    displayLabel: "[Demo]",
    notes:
      "30-day uptime metric. No live uptime monitor wired. Must show [Demo].",
  },
  {
    id: "command-uptime-90day",
    surface: "command marketing/status page — 90-day metric",
    claim: "99.97%",
    truthValue: "demo-data",
    source: "artifacts/command/src/pages/marketing/status.tsx",
    displayLabel: "[Demo]",
    notes:
      "90-day uptime metric. No live uptime monitor wired. Must show [Demo].",
  },
  {
    id: "vessels-uptime-sla",
    surface: "vessels marketing-home, vessels-home",
    claim: "99.97% uptime SLA",
    truthValue: "aspirational",
    source: "artifacts/vessels/src/pages/marketing-home.tsx, vessels-home.tsx",
    displayLabel: "[Target SLA]",
    notes:
      "Stated SLA target; no historical uptime measurement. Display as target.",
  },

  // Pulse claims
  {
    id: "pulse-fallback-briefing",
    surface: "pulse — fallback brief renderer",
    claim: "Synthesized briefing",
    truthValue: "demo-data",
    source: "artifacts/pulse/src/lib/claims.ts",
    displayLabel: "[Synthesized]",
    notes:
      "When live agents have not produced a brief, the renderer must label content as Synthesized so readers know it is not freshly generated.",
  },

  // Terra claims
  {
    id: "terra-portfolio-aum",
    surface: "terra dashboard, carlota-jo case studies",
    claim: "$4.2B+",
    truthValue: "demo-data",
    source: "artifacts/terra/src/data, artifacts/carlota-jo case-studies",
    displayLabel: "[Demo]",
    notes:
      "Seed portfolio data. Used in demo views; must surface a Demo provenance label.",
  },
];

/**
 * Banned hardcoded claim strings.
 *
 * Any of these literal strings appearing in a migrated artifact's source files
 * (outside of lib/claims.ts, which IS the registry adapter) is treated as a
 * regression: someone reintroduced a hardcoded number that should be sourced
 * from the public claims registry. The CI smoke test fails when one of these
 * strings is found.
 *
 * Maintenance rules:
 *   - When you add a new claim to PUBLIC_CLAIMS whose `claim` text is a short,
 *     unambiguous public-facing number (e.g. "99.97%", "$4.2B+"), add the
 *     literal string here too so future hardcoded re-introductions are caught.
 *   - Use very specific phrases (e.g. "34 days pre-designation" rather than
 *     "34 days") to avoid false positives in unrelated copy.
 *   - Strings that already appear in non-claims source files are NOT included
 *     here yet — they would need to be migrated through the claims adapter
 *     first. Add them here once the migration is complete.
 *   - The associated `claimId` documents which registry entry the value lives
 *     under so reviewers know where to source it from.
 */
export interface BannedHardcodedString {
  value: string;
  claimId: string;
  reason?: string;
  /**
   * Repo-relative file paths (POSIX) that are grandfathered for this banned
   * value. Used to allow CI to enforce the ban globally while existing legacy
   * occurrences are migrated incrementally. Any NEW file or any file removed
   * from this list that still contains the literal will fail the smoke test.
   *
   * Keep this list as small as possible — every entry is tech debt waiting to
   * be migrated through the per-artifact claims adapter.
   */
  legacyAllowedFiles?: string[];
}

export const BANNED_HARDCODED_STRINGS: BannedHardcodedString[] = [
  {
    value: "31,200+",
    claimId: "aegis-simulations",
    reason: "Use AEGIS_SIMULATIONS from the artifact's claims adapter.",
  },
  {
    value: "52,000+",
    claimId: "vessels-count",
    reason: "Use VESSELS_COUNT from the artifact's claims adapter.",
  },
  {
    value: "2.4M+",
    claimId: "lyte-signals-per-day",
    reason: "Use LYTE_SIGNALS_PER_DAY from the artifact's claims adapter.",
  },
  {
    value: "< 3%",
    claimId: "lyte-false-positive-rate",
    reason:
      "Use LYTE_FALSE_POSITIVE_RATE from the artifact's claims adapter.",
  },
  {
    value: "34 days pre-designation",
    claimId: "vessels-dark-detection-lead",
    reason:
      "Use VESSELS_DARK_DETECTION_LEAD from the artifact's claims adapter.",
  },
  {
    value: "$4.2B+",
    claimId: "terra-portfolio-aum",
    reason: "Use TERRA_PORTFOLIO_AUM from the artifact's claims adapter.",
  },
  {
    value: "99.97%",
    claimId: "command-uptime-90day",
    reason:
      "Use COMMAND_UPTIME_90DAY (or appropriate uptime constant) from the artifact's claims adapter.",
    // Legacy: pre-existing uptime occurrences across command and szl-holdings
    // surfaces. Migrate each through the claims adapter and remove the entry.
    legacyAllowedFiles: [
      "artifacts/command/src/data/mock-data.ts",
      "artifacts/command/src/hooks/use-ecosystem-data.ts",
      "artifacts/command/src/operations/pages/executive-command.tsx",
      "artifacts/command/src/operations/pages/executive-summary.tsx",
      "artifacts/command/src/pages/marketing/apps/[id].tsx",
      "artifacts/command/src/pages/marketing/pricing.tsx",
      "artifacts/command/src/pages/marketing/status.tsx",
      "artifacts/aegis/src/pages/msp/dashboard.tsx",
      "artifacts/szl-holdings/src/alloy/pages/marketing-landing.tsx",
      "artifacts/szl-holdings/src/data/ventures.ts",
      "artifacts/szl-holdings/src/pages/control-plane.tsx",
      "artifacts/szl-holdings/src/pages/forge-home.tsx",
      "artifacts/szl-holdings/src/pages/nexus-command.tsx",
      "artifacts/szl-holdings/src/pages/pulse.tsx",
    ],
  },
  {
    value: "99.98%",
    claimId: "command-uptime-30day",
    reason:
      "Use COMMAND_UPTIME_30DAY (or appropriate uptime constant) from the artifact's claims adapter.",
    legacyAllowedFiles: [
      "artifacts/command/src/infrastructure/lib/imperium-data.ts",
      "artifacts/command/src/pages/marketing/apps/[id].tsx",
      "artifacts/command/src/pages/marketing/status.tsx",
      "artifacts/szl-holdings/src/pages/control-plane.tsx",
      "artifacts/szl-holdings/src/pages/nexus-command.tsx",
    ],
  },
];

export const FOUNDER_START_YEAR = 2007;
export const CURRENT_YEAR = new Date().getFullYear();
export const FOUNDER_YEARS_EXPERIENCE = CURRENT_YEAR - FOUNDER_START_YEAR;

export function getClaim(id: string): PublicClaim | undefined {
  return PUBLIC_CLAIMS.find((c) => c.id === id);
}

export function getUnverifiedClaims(): PublicClaim[] {
  return PUBLIC_CLAIMS.filter(
    (c) => c.truthValue !== "verified"
  );
}

export function getClaimsByTruthValue(
  truthValue: ClaimTruthValue
): PublicClaim[] {
  return PUBLIC_CLAIMS.filter((c) => c.truthValue === truthValue);
}
