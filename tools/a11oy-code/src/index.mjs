// Public, programmatic surface for A11oy Code. The CLI is the primary product;
// this re-export keeps the package consumable as a library too — used by the
// in-A11oy /code panel and by sub-agent embedders.

export { run as runCli } from './cli.mjs';
export { runOneShot, startRepl } from './agent.mjs';
export { TOOLS, runTool } from './tools/index.mjs';
export { proof } from './proof.mjs';
export * as evolve from './evolve/index.mjs';
export { classify as classifyBlastRadius } from './evolve/classifier.mjs';
export { ouroboros } from './codex/ouroboros.mjs';
export { lutarPick, lutarScore } from './codex/lutar.mjs';
export { mirrorEval } from './codex/mirroreval.mjs';
export { router } from './providers/router.mjs';
