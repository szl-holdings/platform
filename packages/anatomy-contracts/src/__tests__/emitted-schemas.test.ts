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
import { ALL_SCHEMAS } from "../schemas.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaDir = path.join(here, "..", "..", "schema");

test("every contract has an emitted JSON Schema file that matches the TS source", () => {
  for (const [name, schema] of Object.entries(ALL_SCHEMAS)) {
    const file = path.join(schemaDir, `${name}.v1.json`);
    assert.ok(fs.existsSync(file), `missing emitted schema: ${name}.v1.json`);
    const onDisk = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.deepEqual(onDisk, schema, `emitted ${name}.v1.json drifted from TS source`);
  }
});
