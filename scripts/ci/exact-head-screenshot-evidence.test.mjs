import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(
  new URL("../../.github/workflows/exact-head-screenshot-evidence.yml", import.meta.url),
  "utf8",
);
const capture = await readFile(
  new URL("./capture-series-a-exact-head.mjs", import.meta.url),
  "utf8",
);

test("binds the open source PR and branch to the exact candidate SHA", () => {
  assert.match(workflow, /pulls\/\$\{SOURCE_PR\}/);
  assert.match(workflow, /test "\$pr_repo" = "\$GITHUB_REPOSITORY"/);
  assert.match(workflow, /test "\$pr_state" = 'open'/);
  assert.match(workflow, /test "\$pr_head" = "\$CANDIDATE_SHA"/);
  assert.match(workflow, /test "\$remote_head" = "\$CANDIDATE_SHA"/);
  assert.doesNotMatch(workflow, /source_pr:[\s\S]{0,180}default:/);
});

test("uses an existing default route and rejects the rendered not-found surface", () => {
  assert.match(workflow, /route:[\s\S]{0,180}default: \/a11oy\//);
  assert.match(capture, /Page not found/);
  assert.match(capture, /application rendered the not-found surface/);
});

test("uses ISO-dated, route-bound screenshot filenames", () => {
  assert.match(capture, /startedAt\.toISOString\(\)\.slice\(0, 10\)/);
  assert.match(capture, /const routeSlug =/);
  assert.match(capture, /`\$\{captureDate\}-\$\{routeSlug\}-\$\{viewport\.name\}\.png`/);
  assert.doesNotMatch(capture, /`a11oy-start-\$\{viewport\.name\}\.png`/);
});

test("preserves the existing staging workflow", async () => {
  const staging = await readFile(
    new URL("../../.github/workflows/deploy-staging.yml", import.meta.url),
    "utf8",
  );
  assert.match(staging, /name: Deploy — Staging/);
});
