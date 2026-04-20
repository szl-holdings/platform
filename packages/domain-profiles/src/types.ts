/**
 * Domain Profile Type Contract
 *
 * A domain profile is the configuration layer that scopes all retrieval,
 * memory, policy, and agent behavior to a specific business domain.
 */
import type { AgentRoleId, MemoryScope, PolicyTier } from "@szl-holdings/shared-contracts";

export type DomainProfileId =
  | "lyte"
  | "vessels"
  | "terra"
  | "aegis"
  | "prism"
  | "carlota";

export interface IndexNamespace {
  namespaceId: string;
  description: string;
  primaryEmbeddingModel: string;
  chunkSizeTokens: number;
  chunkOverlapTokens: number;
  refreshCronUtc?: string;
}

export interface DomainProfile {
  profileId: DomainProfileId;
  displayName: string;
  description: string;
  version: string;
  accent: string;
  primaryWorkflows: string[];
  indexNamespaces: IndexNamespace[];
  defaultPolicyTier: PolicyTier;
  memoryScopes: MemoryScope[];
  agentRoles: AgentRoleId[];
  contactEmail?: string;
  active: boolean;
}
