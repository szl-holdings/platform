/**
 * SpecialistRegistry — maps specialist names to their factory functions.
 *
 * To add a new specialist:
 *   1. Implement a class that satisfies `SpecialistAgent`.
 *   2. Add one entry to `SPECIALIST_REGISTRY`.
 *   3. No other code change is needed.
 */
import type { SpecialistOutput } from '../evidence-merger.js';
import { KnowledgeAgent } from './knowledge-agent.js';
import { WebResearchAgent } from './web-research-agent.js';
import { CloudOpsAgent } from './cloud-ops-agent.js';

export interface SpecialistQuery {
  query: string;
  topK?: number;
  domain?: string;
  filters?: Record<string, unknown>;
}

export interface SpecialistAgent {
  name: string;
  description: string;
  run(query: SpecialistQuery): Promise<SpecialistOutput>;
}

export const SPECIALIST_REGISTRY: Record<string, () => SpecialistAgent> = {
  'knowledge-agent': () => new KnowledgeAgent(),
  'web-research-agent': () => new WebResearchAgent(),
  'cloud-ops-agent': () => new CloudOpsAgent(),
};

export const DEFAULT_SPECIALISTS = Object.keys(SPECIALIST_REGISTRY);

export function createSpecialist(name: string): SpecialistAgent {
  const factory = SPECIALIST_REGISTRY[name];
  if (!factory) {
    throw new Error(
      `Unknown specialist agent: "${name}". Available: ${Object.keys(SPECIALIST_REGISTRY).join(', ')}`,
    );
  }
  return factory();
}

export function listSpecialists(): string[] {
  return Object.keys(SPECIALIST_REGISTRY);
}
