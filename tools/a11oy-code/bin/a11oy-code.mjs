#!/usr/bin/env node
// a11oy-code — terminal-native, governed, self-evolving agentic coding tool.
// Public entrypoint. Keep this file thin: parse argv, hand off to src/cli.mjs.

import { run } from '../src/cli.mjs';

run(process.argv.slice(2)).catch((err) => {
  console.error(`[a11oy-code] fatal: ${err?.stack || err}`);
  process.exit(1);
});
