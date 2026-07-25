// SPDX-License-Identifier: Apache-2.0
// © 2026 Lutar, Stephen P. — SZL Holdings
//
// Proves the emitted ./schema/*.json files are byte-identical to the TS source
// of truth, so a Python consumer (amaru) validates against the same contract
// the TS apps use. Run after `node --experimental-strip-types scripts/emit-schemas.ts`.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { EMITTED_SCHEMAS } from "../schemas.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaDir = path.join(here, "..", "..", "schema");

test("every contract has an emitted JSON Schema file that matches the TS source", () => {
  for (const [filename, schema] of Object.entries(EMITTED_SCHEMAS)) {
    const file = path.join(schemaDir, filename);
    assert.ok(fs.existsSync(file), `missing emitted schema: ${filename}`);
    const onDisk = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.deepEqual(onDisk, schema, `emitted ${filename} drifted from TS source`);
  }
});
