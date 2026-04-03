#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const MANIFEST_PATH = path.join(__dirname, "..", "appexchange-manifest.json");
const SFDX_PATH = path.join(__dirname, "..", "sfdx-project.json");

const REQUIRED_FIELDS = ["listingId", "listingVersion", "publisher", "listing", "permissions", "oauth", "components", "pricing"];
const REQUIRED_LISTING = ["title", "short_description", "long_description", "categories", "compatibility"];

let errors = [];
let warnings = [];

function check(condition, msg, fatal = true) {
  if (!condition) {
    (fatal ? errors : warnings).push(msg);
  }
}

console.log("Validating Salesforce AppExchange manifest...\n");

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`ERROR: ${MANIFEST_PATH} not found`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const sfdx = JSON.parse(fs.readFileSync(SFDX_PATH, "utf8"));

for (const field of REQUIRED_FIELDS) {
  check(manifest[field] !== undefined, `Missing required field: ${field}`);
}

for (const field of REQUIRED_LISTING) {
  check(manifest.listing?.[field] !== undefined, `Missing listing field: listing.${field}`);
}

check(Array.isArray(manifest.permissions) && manifest.permissions.length > 0, "permissions must be a non-empty array");
check(Array.isArray(manifest.components) && manifest.components.length > 0, "components must be a non-empty array");
check(manifest.publisher?.name, "publisher.name is required");
check(manifest.oauth?.flow === "authorization_code", "oauth.flow must be 'authorization_code'");
check(manifest.listing?.compatibility?.api_version_min, "listing.compatibility.api_version_min is required");
check(sfdx.namespace, "sfdx-project.json must have a namespace");
check(sfdx.packageDirectories?.[0]?.package, "sfdx-project.json must have a package name in packageDirectories");

const descLen = manifest.listing?.long_description?.length ?? 0;
check(descLen >= 100, `listing.long_description too short (${descLen} chars, min 100)`);
check(descLen <= 5000, `listing.long_description too long (${descLen} chars, max 5000)`, false);

if (errors.length > 0) {
  console.error("VALIDATION FAILED:\n" + errors.map(e => `  ✗ ${e}`).join("\n"));
  if (warnings.length > 0) console.warn("\nWARNINGS:\n" + warnings.map(w => `  ⚠ ${w}`).join("\n"));
  process.exit(1);
} else {
  console.log("VALIDATION PASSED\n" + [
    `  ✓ Listing: ${manifest.listing.title}`,
    `  ✓ Namespace: ${sfdx.namespace}`,
    `  ✓ Components: ${manifest.components.length}`,
    `  ✓ Permissions: ${manifest.permissions.length}`,
  ].join("\n"));
  if (warnings.length > 0) console.warn("\nWARNINGS:\n" + warnings.map(w => `  ⚠ ${w}`).join("\n"));
}
