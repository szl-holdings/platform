#!/usr/bin/env node
"use strict";

/**
 * Salesforce AppExchange Build Package Script
 * Validates package structure and prepares files for SFDX packaging.
 * Actual packaging is done via: sfdx force:package:create + sfdx force:package:version:create
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const FORCE_APP = path.join(ROOT, "force-app", "main", "default");
const DIST = path.join(ROOT, "dist");
const SFDX_PROJECT = path.join(ROOT, "sfdx-project.json");
const MANIFEST = path.join(ROOT, "appexchange-manifest.json");

const REQUIRED_CLASSES = [
  "SZLApiClient.cls",
  "SZLSignalQueueable.cls",
  "SZLWorkflowQueueable.cls",
];
const REQUIRED_TRIGGERS = ["OpportunitySZLSync.trigger"];

let errors = [];

function check(condition, msg) {
  if (!condition) errors.push(msg);
}

console.log("Building Salesforce AppExchange package...\n");

check(fs.existsSync(SFDX_PROJECT), "sfdx-project.json not found");
check(fs.existsSync(MANIFEST), "appexchange-manifest.json not found");

const classesDir = path.join(FORCE_APP, "classes");
const triggersDir = path.join(FORCE_APP, "triggers");

for (const cls of REQUIRED_CLASSES) {
  const p = path.join(classesDir, cls);
  check(fs.existsSync(p), `Missing Apex class: force-app/main/default/classes/${cls}`);
}
for (const t of REQUIRED_TRIGGERS) {
  const p = path.join(triggersDir, t);
  check(fs.existsSync(p), `Missing Apex trigger: force-app/main/default/triggers/${t}`);
}

if (errors.length > 0) {
  console.error("BUILD FAILED:\n" + errors.map(e => `  ✗ ${e}`).join("\n"));
  process.exit(1);
}

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

const sfdx = JSON.parse(fs.readFileSync(SFDX_PROJECT, "utf8"));
const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const buildSummary = {
  builtAt: new Date().toISOString(),
  namespace: sfdx.namespace,
  packageName: sfdx.packageDirectories?.[0]?.package,
  listingTitle: manifest.listing?.title,
  components: manifest.components?.length ?? 0,
  classes: REQUIRED_CLASSES,
  triggers: REQUIRED_TRIGGERS,
  deployCommand: `sfdx force:source:deploy -p force-app -u <org-alias>`,
  packageCommand: `sfdx force:package:version:create -p "${sfdx.packageDirectories?.[0]?.package}" -d force-app -x -w 10`,
};
fs.writeFileSync(path.join(DIST, "build-summary.json"), JSON.stringify(buildSummary, null, 2));

console.log("BUILD PASSED\n" + [
  `  ✓ Namespace: ${sfdx.namespace}`,
  `  ✓ Package: ${sfdx.packageDirectories?.[0]?.package}`,
  `  ✓ Apex classes: ${REQUIRED_CLASSES.join(", ")}`,
  `  ✓ Apex triggers: ${REQUIRED_TRIGGERS.join(", ")}`,
  `  ✓ Components declared: ${manifest.components?.length}`,
].join("\n"));

console.log(`\nTo deploy to a scratch org:\n  ${buildSummary.deployCommand}`);
console.log(`To create a package version:\n  ${buildSummary.packageCommand}`);
