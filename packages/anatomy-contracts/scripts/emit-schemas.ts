#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// © 2026 Lutar, Stephen P. — SZL Holdings
//
// emit-schemas.ts — write each contract schema to ./schema/<name>.v1.json so
// non-TypeScript apps (amaru is Python) can validate against byte-identical
// schemas. Run: node --experimental-strip-types scripts/emit-schemas.ts

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { EMITTED_SCHEMAS } from "../src/schemas.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "schema");
fs.mkdirSync(outDir, { recursive: true });

for (const [filename, schema] of Object.entries(EMITTED_SCHEMAS)) {
  const file = path.join(outDir, filename);
  fs.writeFileSync(file, JSON.stringify(schema, null, 2) + "\n", "utf8");
  console.log(`wrote ${path.relative(process.cwd(), file)}`);
}
