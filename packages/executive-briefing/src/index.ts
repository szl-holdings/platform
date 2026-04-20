export {
  buildBriefContext,
  buildCitations,
  extractEntityProvenance,
  summarizeContext,
} from './context-builder.js';
export { parseBriefResponse } from './parser.js';
export {
  buildCitationManifest,
  buildSystemPrompt,
  buildUserPrompt,
  getAgentId,
} from './prompts.js';
export * from './types.js';
export { type GateResult, gateBrief } from './verifier-gate.js';

export const EXECUTIVE_BRIEFING_VERSION = '1.0.0' as const;

export const SUPPORTED_DOMAINS = [
  'vessels',
  'aegis',
  'terra',
  'lyte',
  'prism',
  'szl-holdings',
  'consolidated',
] as const;

export type SupportedDomain = (typeof SUPPORTED_DOMAINS)[number];
