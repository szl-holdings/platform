/**
 * sitemap-seo.mjs
 *
 * Priority and changefreq rules for the sitemap generator.
 * Rules are evaluated in order — first match wins.
 * To customise SEO for a specific route, add an entry with an exact match
 * BEFORE the prefix rules that would otherwise capture it.
 *
 * Pattern types:
 *   string  — exact path match (e.g. "/")
 *   RegExp  — tested against the route path
 *
 * @type {Array<{ pattern: string|RegExp; changefreq: string; priority: number }>}
 */
export const SEO_RULES = [
  // ── Exact matches (highest specificity) ────────────────────────────────────
  { pattern: "/",                    changefreq: "weekly",  priority: 1.0 },
  { pattern: "/platform",            changefreq: "monthly", priority: 0.9 },
  { pattern: "/alloy-fabric",        changefreq: "monthly", priority: 0.9 },
  { pattern: "/lyte",                changefreq: "monthly", priority: 0.9 },
  { pattern: "/solutions",           changefreq: "monthly", priority: 0.9 },
  { pattern: "/how-it-works",        changefreq: "monthly", priority: 0.8 },
  { pattern: "/pricing",             changefreq: "monthly", priority: 0.8 },
  { pattern: "/contact",             changefreq: "monthly", priority: 0.8 },
  { pattern: "/design-partners",     changefreq: "monthly", priority: 0.8 },
  { pattern: "/design-partner",      changefreq: "monthly", priority: 0.8 },
  { pattern: "/demo",                changefreq: "monthly", priority: 0.8 },
  { pattern: "/trust-center",        changefreq: "monthly", priority: 0.8 },
  { pattern: "/trust",               changefreq: "monthly", priority: 0.8 },
  { pattern: "/investors",           changefreq: "monthly", priority: 0.8 },
  { pattern: "/investors/overview",  changefreq: "monthly", priority: 0.8 },
  { pattern: "/demos",               changefreq: "monthly", priority: 0.7 },
  { pattern: "/docs",                changefreq: "monthly", priority: 0.7 },
  { pattern: "/insights",            changefreq: "weekly",  priority: 0.7 },
  { pattern: "/case-studies",        changefreq: "monthly", priority: 0.7 },
  { pattern: "/faq",                 changefreq: "monthly", priority: 0.7 },
  { pattern: "/roi",                 changefreq: "monthly", priority: 0.7 },
  { pattern: "/roadmap",             changefreq: "weekly",  priority: 0.6 },
  { pattern: "/changelog",           changefreq: "weekly",  priority: 0.6 },
  { pattern: "/company",             changefreq: "monthly", priority: 0.7 },
  { pattern: "/founder",             changefreq: "monthly", priority: 0.7 },
  { pattern: "/leadership",          changefreq: "monthly", priority: 0.7 },
  { pattern: "/operating-doctrine",  changefreq: "monthly", priority: 0.7 },
  { pattern: "/investor",            changefreq: "monthly", priority: 0.7 },
  { pattern: "/investor-relations",  changefreq: "monthly", priority: 0.6 },
  { pattern: "/architecture",        changefreq: "monthly", priority: 0.7 },
  { pattern: "/security",            changefreq: "monthly", priority: 0.7 },
  { pattern: "/status",              changefreq: "yearly",  priority: 0.5 },
  { pattern: "/accessibility",       changefreq: "yearly",  priority: 0.5 },
  { pattern: "/brand",               changefreq: "monthly", priority: 0.4 },
  { pattern: "/api",                 changefreq: "monthly", priority: 0.6 },
  { pattern: "/press",               changefreq: "monthly", priority: 0.6 },
  { pattern: "/packages",            changefreq: "monthly", priority: 0.6 },
  { pattern: "/relief",              changefreq: "monthly", priority: 0.6 },
  { pattern: "/ventures",            changefreq: "monthly", priority: 0.7 },
  { pattern: "/a11oy",               changefreq: "monthly", priority: 0.7 },
  { pattern: "/academy",             changefreq: "monthly", priority: 0.6 },
  { pattern: "/help",                changefreq: "monthly", priority: 0.6 },
  { pattern: "/pulse",               changefreq: "monthly", priority: 0.6 },

  // ── Prefix rules (order matters — more specific first) ─────────────────────
  { pattern: /^\/solutions\//,       changefreq: "monthly", priority: 0.9 },
  { pattern: /^\/lyte\//,            changefreq: "monthly", priority: 0.8 },
  { pattern: /^\/trust\/diligence\//, changefreq: "monthly", priority: 0.7 },
  { pattern: /^\/trust\//,           changefreq: "monthly", priority: 0.8 },
  { pattern: /^\/docs\//,            changefreq: "monthly", priority: 0.7 },
  { pattern: /^\/investors\//,       changefreq: "monthly", priority: 0.7 },
  { pattern: /^\/founder\//,         changefreq: "monthly", priority: 0.6 },
  { pattern: /^\/pilot\//,           changefreq: "monthly", priority: 0.8 },
  { pattern: /^\/legal\//,           changefreq: "yearly",  priority: 0.5 },
  { pattern: /^\/products\//,        changefreq: "monthly", priority: 0.8 },
  { pattern: /^\/services\//,        changefreq: "monthly", priority: 0.7 },
  { pattern: /^\/services\/carlota-jo/, changefreq: "monthly", priority: 0.7 },
];

/** Default SEO for any route not matched by a rule above. */
export const DEFAULT_SEO = { changefreq: "monthly", priority: 0.6 };

/**
 * Look up SEO metadata for a given route path.
 * @param {string} routePath
 * @returns {{ changefreq: string; priority: number }}
 */
export function getSeo(routePath) {
  for (const rule of SEO_RULES) {
    if (typeof rule.pattern === "string") {
      if (rule.pattern === routePath) {
        return { changefreq: rule.changefreq, priority: rule.priority };
      }
    } else {
      if (rule.pattern.test(routePath)) {
        return { changefreq: rule.changefreq, priority: rule.priority };
      }
    }
  }
  return DEFAULT_SEO;
}
