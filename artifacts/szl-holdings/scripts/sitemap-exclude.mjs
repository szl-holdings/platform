/**
 * sitemap-exclude.mjs
 *
 * Path prefixes (or exact paths) to exclude from the generated sitemap.
 * Any route from App.tsx whose path starts with one of these prefixes — or
 * matches exactly — will be omitted from sitemap.xml.
 *
 * Common reasons to exclude:
 *  - RequireAuth / RequireAdmin gated routes (crawlers can't reach them)
 *  - Internal tool routes not meant for public indexing
 *  - ExternalRedirect routes (they redirect away from the domain)
 *  - Wildcard catch-all routes
 */

/** @type {string[]} */
export const EXCLUDED_PREFIXES = [
  // ── Authenticated / admin surfaces ─────────────────────────────────────────
  "/forge",
  "/alloy",
  "/ops",
  "/reports",
  "/investor-analytics",
  "/intelligence",
  "/nexus",
  "/digital-twin",
  "/control-tower",
  "/kpis",
  "/ai-cost-analytics",
  "/prompt-registry",
  "/admin",
  "/helm",
  "/ownership",
  "/fund-operations",
  "/fund",
  "/investors/data-room",
  "/onboarding",
  "/settings",
  "/org-settings",
  "/notifications",
  "/support",
  "/crm",
  "/pipeline",
  "/nuro-forge",
  "/dist-os",
  "/distribution-os",
  "/core-command",
  "/meridian",
  "/control-plane",
  "/portfolio-ops",
  "/revenue-fusion",
  "/financials",
  "/business-state",
  "/pulse-components",
  "/analytics",
  "/kpi-dashboard",
  "/aeep-command",
  "/account",
  "/reset-password",
  "/forgot-password",
  "/command-newsletter",
  "/command/newsletter",
  "/lp-sentiment-pulse",
  "/link-in-bio",
  "/carousel-preview",
  "/newsletter-landing",
  "/decisioning",
  "/decision-center",
  "/venture-intelligence",
  "/venture-portfolio",
  "/governed-cockpit",
  "/autopilot",
  "/ecosystem",
  "/mobile-preview",
  "/demos/mobile",
  "/portfolio",
  "/aeep",
  "/core",
  "/crm-intelligence",
  "/design-token-governance",
  "/meridian-intelligence",
  "/usage",
  "/assessment",
  // ── Redirect-only routes (not real pages) ───────────────────────────────────
  "/ir",
  "/developers",
  "/integrations",
  "/founder-legacy",
  "/investor/data-room",
  // ── ExternalRedirect routes ─────────────────────────────────────────────────
  "/vessels",        // redirects to /vessels/ (external app)
  "/carlota-jo",     // redirects to /carlota-jo/ (external app)
  "/terra",          // redirects to /terra/ (external app)
  "/lyte/demo",      // redirects to /command/
  "/lyte/app",       // redirects to /command/
  "/inca",
  "/msp",
  "/firestorm",
  "/lyte-command-center",
  "/imperium",
  "/prism-counsel",  // redirects to /aegis/
  "/stephen",
  // ── Legacy / duplicate routes ───────────────────────────────────────────────
  "/prism-counsel-public",
  "/terra-public",
  "/vessels-public",
  "/aegis-public",
  "/carlota-jo-public",
  "/about",          // alias of /company
  "/a11oy-philosophy", // alias of /a11oy
  "/platform/alloy", // canonical is /alloy-fabric
  "/products/lyte",  // canonical is /lyte
  "/products/vessels",  // canonical is /solutions/vessels
  "/products/aegis",    // canonical is /solutions/aegis
  "/products/terra",    // canonical is /solutions/terra
];

/**
 * Exact paths to always exclude, regardless of prefix rules.
 * Use this for routes where the path itself matches an allowed prefix
 * (e.g. a redirect at "/ir" where "/i" is not blocked but "/ir" should be).
 *
 * @type {Set<string>}
 */
export const EXCLUDED_EXACT = new Set([
  "/ir",
  "/founder-legacy",
  "/investor/data-room",
]);
