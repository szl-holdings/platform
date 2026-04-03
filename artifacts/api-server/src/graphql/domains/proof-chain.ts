import { parseIntId } from "../utils.js";

export const proofChainTypeDefs = `#graphql
  type ProofChainRecord {
    id: ID!
    orgId: Int
    contentId: String!
    contentType: String!
    sourceClass: String!
    confidenceScore: Float!
    modelLane: String
    modelId: String
    modelProvider: String
    modelVersion: String
    promptHash: String
    parentProofId: Int
    reviewState: String!
    reviewedBy: Int
    reviewedAt: String
    reviewNote: String
    exportSafetyState: String!
    generatedAt: String!
    generatedByUserId: Int
    correlationId: String
    serviceAttribution: String
    inputSources: JSON
    metadata: JSON
    createdAt: String!
    updatedAt: String!
  }

  extend type Query {
    proofChainRecord(id: ID!): ProofChainRecord @auditSensitive(actionClass: "proof_chain_read")
    proofChainByContent(contentType: String!, contentId: String!): ProofChainRecord
    proofChainList(
      orgId: Int
      reviewState: String
      sourceClass: String
      contentType: String
      limit: Int
    ): [ProofChainRecord!]! @requireRole(roles: ["super_admin", "admin", "ops", "analyst", "compliance"])
  }

  extend type Mutation {
    tagAIContent(
      contentId: String!
      contentType: String!
      sourceClass: String!
      confidenceScore: Float
      modelLane: String
      modelId: String
      modelProvider: String
      modelVersion: String
      parentProofId: Int
      metadata: JSON
    ): ProofChainRecord! @auditSensitive(actionClass: "proof_chain_tag")

    reviewProofChain(
      id: ID!
      reviewState: String!
      reviewNote: String
      exportSafetyState: String
    ): ProofChainRecord! @requireRole(roles: ["super_admin", "admin", "ops", "compliance"]) @auditSensitive(actionClass: "proof_chain_review")
  }
`;

type GQLContext = {
  req?: {
    user?: { id?: number; roles?: string[]; orgs?: Array<{ orgId: number }> };
    correlationId?: string;
  };
};

export const proofChainResolvers = {
  Query: {
    proofChainRecord: async (_: unknown, args: { id: string }) => {
      const { db, proofChainTable } = await import("@szl-holdings/db");
      const { eq } = await import("drizzle-orm");
      const [row] = await db.select().from(proofChainTable).where(eq(proofChainTable.id, parseIntId(args.id)));
      return row ?? null;
    },

    proofChainByContent: async (_: unknown, args: { contentType: string; contentId: string }) => {
      const { getProofByContent } = await import("@szl-holdings/proof-chain");
      return getProofByContent(args.contentId, args.contentType) ?? null;
    },

    proofChainList: async (
      _: unknown,
      args: { orgId?: number; reviewState?: string; sourceClass?: string; contentType?: string; limit?: number },
      ctx: GQLContext,
    ) => {
      const { listProofChain } = await import("@szl-holdings/proof-chain");
      const user = ctx?.req?.user;
      const isAdminUser = user?.roles?.some(r => ["super_admin", "admin"].includes(r)) ?? false;
      const orgId = args.orgId ?? (isAdminUser ? undefined : user?.orgs?.[0]?.orgId ?? undefined);
      return listProofChain({
        orgId,
        reviewState: args.reviewState as import("@szl-holdings/proof-chain").ProofReviewState | undefined,
        sourceClass: args.sourceClass as import("@szl-holdings/proof-chain").ProvenanceSourceClass | undefined,
        contentType: args.contentType,
        limit: args.limit ?? 100,
      });
    },
  },

  Mutation: {
    tagAIContent: async (
      _: unknown,
      args: {
        contentId: string;
        contentType: string;
        sourceClass: string;
        confidenceScore?: number;
        modelLane?: string;
        modelId?: string;
        modelProvider?: string;
        modelVersion?: string;
        parentProofId?: number;
        metadata?: Record<string, unknown>;
      },
      ctx: GQLContext,
    ) => {
      const { tagAIContent } = await import("@szl-holdings/proof-chain");
      const user = ctx?.req?.user;
      return tagAIContent({
        orgId: user?.orgs?.[0]?.orgId ?? null,
        contentId: args.contentId,
        contentType: args.contentType,
        sourceClass: args.sourceClass as import("@szl-holdings/proof-chain").ProvenanceSourceClass,
        confidenceScore: args.confidenceScore,
        modelLane: args.modelLane,
        modelId: args.modelId,
        modelProvider: args.modelProvider,
        modelVersion: args.modelVersion,
        parentProofId: args.parentProofId,
        generatedByUserId: user?.id ?? null,
        correlationId: ctx?.req?.correlationId,
        serviceAttribution: "graphql",
        metadata: args.metadata,
      });
    },

    reviewProofChain: async (
      _: unknown,
      args: { id: string; reviewState: string; reviewNote?: string; exportSafetyState?: string },
      ctx: GQLContext,
    ) => {
      const { reviewProof } = await import("@szl-holdings/proof-chain");
      const user = ctx?.req?.user;
      if (!user?.id) throw new Error("AUTHENTICATION_REQUIRED");
      return reviewProof({
        proofId: parseIntId(args.id),
        reviewedBy: user.id,
        reviewState: args.reviewState as import("@szl-holdings/proof-chain").ProofReviewState,
        reviewNote: args.reviewNote,
        exportSafetyState: args.exportSafetyState as import("@szl-holdings/proof-chain").ProofExportSafetyState | undefined,
      });
    },
  },
};
