#!/usr/bin/env node
/**
 * Accessibility Baseline Checks — SZL Holdings Platform
 * Performs basic automated accessibility checks on public pages.
 *
 * Checks: missing alt text, missing form labels, basic ARIA issues.
 *
 * Usage:
 *   BASE_URL=https://szlholdings.com node scripts/qa/check-a11y.js
 *   node scripts/qa/check-a11y.js
 *
 * For deeper a11y testing, use axe-core or Playwright with axe.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const PAGES_TO_CHECK = [
  "/",
  "/platform",
  "/lyte",
  "/solutions",
  "/contact",
  "/trust-center",
  "/legal/privacy",
  "/legal/terms",
  "/accessibility",
];

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SZL-QA-A11y/1.0" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function checkA11y(html, url) {
  const issues = [];

  // Check for images without alt attributes
  const imgMatches = html.matchAll(/<img\s([^>]+)>/gi);
  for (const match of imgMatches) {
    const attrs = match[1];
    if (!attrs.includes("alt=")) {
      issues.push({ severity: "error", message: "Image missing alt attribute" });
    } else if (attrs.match(/alt=["']["']/)) {
      // Empty alt is acceptable for decorative images — only flag if it seems content
      if (!attrs.includes("role=\"presentation\"") && !attrs.includes("aria-hidden")) {
        // Potentially decorative — flag as warning
      }
    }
  }

  // Check for inputs without labels
  const inputMatches = html.matchAll(/<input\s([^>]+)>/gi);
  for (const match of inputMatches) {
    const attrs = match[1];
    const type = (attrs.match(/type=["']([^"']+)["']/) || [])[1] || "text";
    if (["submit", "button", "hidden", "reset"].includes(type)) continue;
    if (
      !attrs.includes("aria-label=") &&
      !attrs.includes("aria-labelledby=") &&
      !attrs.includes("id=")
    ) {
      issues.push({
        severity: "warning",
        message: `Input (type=${type}) may lack associated label`,
      });
    }
  }

  // Check for empty buttons
  const buttonMatches = html.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/gi);
  for (const match of buttonMatches) {
    const attrs = match[1];
    const content = match[2].replace(/<[^>]+>/g, "").trim();
    if (
      !content &&
      !attrs.includes("aria-label=") &&
      !attrs.includes("aria-labelledby=")
    ) {
      issues.push({
        severity: "error",
        message: "Button has no accessible text content or aria-label",
      });
    }
  }

  // Check for language attribute on html element
  if (!html.match(/<html[^>]+lang=/i)) {
    issues.push({
      severity: "error",
      message: "Missing lang attribute on <html> element",
    });
  }

  // Check for skip navigation
  if (!html.includes("skip") && !html.includes("Skip")) {
    issues.push({
      severity: "warning",
      message: "No skip navigation link detected (recommended for WCAG 2.1 AA)",
    });
  }

  return issues;
}

async function main() {
  console.log(`\nSZL Holdings — Accessibility Baseline`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Note: This is a basic static check. Use axe-core for comprehensive a11y testing.\n`);

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  for (const route of PAGES_TO_CHECK) {
    const url = BASE_URL + route;
    const html = await fetchPage(url);
    if (!html) {
      console.error(`  ✗ Could not fetch: ${url}`);
      failed++;
      continue;
    }

    const issues = checkA11y(html, url);
    const errors = issues.filter((i) => i.severity === "error");
    const warns = issues.filter((i) => i.severity === "warning");

    if (errors.length === 0) {
      console.log(
        `  ✓ ${route}${warns.length > 0 ? ` (${warns.length} warning(s))` : ""}`
      );
      if (warns.length > 0) {
        warns.forEach((w) => console.warn(`      ⚠ ${w.message}`));
        warnings += warns.length;
      }
      passed++;
    } else {
      console.error(`  ✗ ${route} — ${errors.length} error(s), ${warns.length} warning(s)`);
      errors.forEach((e) => console.error(`      ✗ ${e.message}`));
      warns.forEach((w) => console.warn(`      ⚠ ${w.message}`));
      failed++;
      warnings += warns.length;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${warnings} warnings`);

  if (failed > 0) {
    console.error(`\nFAIL — ${failed} page(s) have accessibility errors`);
    process.exit(1);
  } else {
    console.log(`\nPASS — Basic accessibility checks passed`);
    if (warnings > 0) {
      console.warn(`${warnings} warning(s) detected — review recommended`);
    }
    process.exit(0);
  }
}

main();
