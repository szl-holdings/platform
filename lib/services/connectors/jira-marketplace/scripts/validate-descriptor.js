#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const MANIFEST_PATH = path.join(__dirname, "..", "manifest.yml");

const REQUIRED_SECTIONS = ["modules", "function", "permissions", "app"];
const REQUIRED_APP = ["id", "name", "vendor", "support"];

let errors = [];
let warnings = [];

function check(condition, msg, fatal = true) {
  if (!condition) (fatal ? errors : warnings).push(msg);
}

console.log("Validating Jira Marketplace Forge descriptor...\n");

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`ERROR: ${MANIFEST_PATH} not found`);
  process.exit(1);
}

const raw = fs.readFileSync(MANIFEST_PATH, "utf8");

for (const section of REQUIRED_SECTIONS) {
  check(raw.includes(`${section}:`), `Missing required section: ${section}`);
}

for (const field of REQUIRED_APP) {
  check(raw.includes(`${field}:`), `Missing app field: app.${field}`);
}

check(raw.includes("runtime:"), "Missing runtime section");
check(raw.includes("nodejs"), "Runtime must specify Node.js");
check(raw.includes("read:jira-work"), "Permissions must include read:jira-work scope");
check(raw.includes("write:jira-work"), "Permissions must include write:jira-work scope");
check(raw.includes("jira:projectPage"), "Must include jira:projectPage module");
check(raw.includes("jira:issuePanel"), "Must include jira:issuePanel module");
check(raw.includes("jira:issueAction"), "Must include jira:issueAction module");
check(raw.includes("webtrigger:"), "Must include webtrigger module for webhook reception");
check(raw.includes("privacy_policy:"), "Must include privacy_policy URL", false);
check(raw.includes("terms_of_service:"), "Must include terms_of_service URL", false);

const functionCount = (raw.match(/^  - key:/gm) || []).length;
check(functionCount >= 4, `Need at least 4 function entries, found: ${functionCount}`);

if (errors.length > 0) {
  console.error("VALIDATION FAILED:\n" + errors.map(e => `  ✗ ${e}`).join("\n"));
  if (warnings.length > 0) console.warn("\nWARNINGS:\n" + warnings.map(w => `  ⚠ ${w}`).join("\n"));
  process.exit(1);
} else {
  console.log("VALIDATION PASSED\n" + [
    "  ✓ All required sections present",
    "  ✓ Module coverage: projectPage, issuePanel, issueAction, webtrigger",
    "  ✓ Required permission scopes declared",
    `  ✓ ${functionCount} function handlers defined`,
  ].join("\n"));
  if (warnings.length > 0) console.warn("\nWARNINGS:\n" + warnings.map(w => `  ⚠ ${w}`).join("\n"));
}
