export * from "./types.js";
export { buildBriefContext, summarizeContext, extractEntityProvenance, buildCitations } from "./context-builder.js";
export { buildSystemPrompt, buildUserPrompt, buildCitationManifest, getAgentId } from "./prompts.js";
export { parseBriefResponse } from "./parser.js";
export { gateBrief, type GateResult } from "./verifier-gate.js";

export const EXECUTIVE_BRIEFING_VERSION = "1.0.0" as const;

export const SUPPORTED_DOMAINS = [
  "vessels",
  "aegis",
  "terra",
  "lyte",
  "prism",
  "szl-holdings",
  "consolidated",
] as const;

export type SupportedDomain = typeof SUPPORTED_DOMAINS[number];
