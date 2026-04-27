#!/usr/bin/env node
/**
 * generate-sitemap.mjs
 *
 * Reads route definitions directly from src/App.tsx and generates sitemap.xml.
 *
 * How it works:
 *   1. Scans App.tsx for every `<Route path="..."` declaration.
 *   2. Discards dynamic/parameterised paths (those containing ":" or "*").
 *   3. Discards paths on the exclusion list (internal/authenticated routes).
 *   4. Looks up changefreq + priority from sitemap-seo.mjs (falls back to defaults).
 *   5. Writes valid XML to the provided output path.
 *
 * Usage (standalone, updates public/sitemap.xml in-source):
 *   node scripts/generate-sitemap.mjs
 *
 * The Vite plugin in vite.config.ts calls generateSitemap() at build time
 * and emits the result into the build output directory via this.emitFile().
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { EXCLUDED_PREFIXES, EXCLUDED_EXACT } from "./sitemap-exclude.mjs";
import { getSeo } from "./sitemap-seo.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const ARTIFACT_ROOT = resolve(__dir, "..");
const BASE_URL = "https://szlholdings.com";

/**
 * Extract static route paths from App.tsx source text.
 * Returns only non-dynamic, non-wildcard paths.
 *
 * @param {string} src - raw App.tsx file content
 * @returns {string[]}
 */
export function extractRoutes(src) {
  const paths = new Set();
  // Match <Route path="..." or <Route path='...'
  const pattern = /<Route\s[^>]*path=["']([^"']+)["']/g;
  let match;
  while ((match = pattern.exec(src)) !== null) {
    const p = match[1];
    // Skip dynamic (parameterised) routes
    if (p.includes(":") || p.includes("*")) continue;
    paths.add(p);
  }
  return [...paths];
}

/**
 * Determine whether a path should be excluded from the sitemap.
 *
 * @param {string} routePath
 * @returns {boolean}
 */
function isExcluded(routePath) {
  if (EXCLUDED_EXACT.has(routePath)) return true;
  return EXCLUDED_PREFIXES.some(
    (prefix) => routePath === prefix || routePath.startsWith(prefix + "/")
  );
}

/**
 * Build sitemap XML for the given list of public paths.
 *
 * @param {string[]} publicPaths - deduplicated, filtered public route paths
 * @param {string} baseUrl
 * @returns {string} - complete sitemap XML
 */
export function buildSitemapXml(publicPaths, baseUrl = BASE_URL) {
  const today = new Date().toISOString().slice(0, 10);

  const urlElements = publicPaths
    .map((routePath) => {
      const { changefreq, priority } = getSeo(routePath);
      const loc = `${baseUrl}${routePath}`;
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority.toFixed(1)}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<!-- AUTO-GENERATED — do not edit by hand. -->",
    "<!-- Source: scripts/generate-sitemap.mjs reads src/App.tsx at build time. -->",
    "<!-- To exclude a route, add it to scripts/sitemap-exclude.mjs.           -->",
    "<!-- To change priority/changefreq, edit scripts/sitemap-seo.mjs.         -->",
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9',
    '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
    "",
    urlElements,
    "",
    "</urlset>",
  ].join("\n");
}

/**
 * Full pipeline: read App.tsx → filter routes → build XML.
 * Returns both the XML string and the list of included paths.
 *
 * @param {string} [appTsxPath] - optional override for App.tsx location
 * @returns {{ xml: string; paths: string[] }}
 */
export function generateSitemap(appTsxPath) {
  const tsxPath = appTsxPath ?? resolve(ARTIFACT_ROOT, "src", "App.tsx");
  const src = readFileSync(tsxPath, "utf-8");
  const allPaths = extractRoutes(src);
  const publicPaths = allPaths
    .filter((p) => !isExcluded(p))
    .sort();
  const xml = buildSitemapXml(publicPaths);
  return { xml, paths: publicPaths };
}

// ── Standalone execution ────────────────────────────────────────────────────
// When run directly (`node scripts/generate-sitemap.mjs`), write to
// public/sitemap.xml so the dev server serves a current sitemap.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { xml, paths } = generateSitemap();
  const outPath = resolve(ARTIFACT_ROOT, "public", "sitemap.xml");
  writeFileSync(outPath, xml, "utf-8");
  console.log(`[sitemap] Generated ${paths.length} URLs → ${outPath}`);
}
