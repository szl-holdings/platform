import { withFilter } from "graphql-subscriptions";
import { parseIntId } from "../utils.js";
import { publish, WS_CHANNELS } from "../../lib/websocket.js";
import { pubsub, ALLOY_EVENTS } from "../../lib/pubsub-bridge.js";

export { pubsub, ALLOY_EVENTS };

export const alloyTypeDefs = `#graphql
  type AlloySignal {
    id: ID!
    source: String
    sourceType: String
    domain: String
    severity: String
    status: String
    createdAt: String
  }

  type AlloyWorkflow {
    id: ID!
    name: String!
    type: String
    status: String
    priority: String
    createdAt: String
  }

  type AlloyWorkflowRun {
    id: ID!
    workflowId: ID!
    status: String!
    durationMs: Int
    startedAt: String
    completedAt: String
  }

  type AlloyAction {
    id: ID!
    workflowId: ID!
    type: String
    status: String
    createdAt: String
  }

  type AlloyArtifact {
    id: ID!
    type: String
    title: String
    content: String
    confidenceScore: Float
    createdAt: String
  }

  extend type Query {
    alloySignals(limit: Int, offset: Int): [AlloySignal!]!
    alloySignal(id: ID!): AlloySignal
    alloyWorkflows(limit: Int, offset: Int): [AlloyWorkflow!]!
    alloyWorkflow(id: ID!): AlloyWorkflow
    alloyWorkflowRuns(workflowId: ID, limit: Int, offset: Int): [AlloyWorkflowRun!]!
    alloyWorkflowRun(id: ID!): AlloyWorkflowRun
    alloyActions(workflowId: ID, limit: Int, offset: Int): [AlloyAction!]!
    alloyArtifacts(limit: Int, offset: Int): [AlloyArtifact!]!
  }

  extend type Mutation {
    createAlloyWorkflow(name: String!, type: String, priority: String): AlloyWorkflow!
    updateAlloyWorkflowRun(id: ID!, status: String!): AlloyWorkflowRun!
  }

  extend type Subscription {
    alloyWorkflowRunUpdated(workflowId: ID): AlloyWorkflowRun!
  }
`;

export const alloyResolvers = {
  Query: {
    alloySignals: async (_: unknown, args: { limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { alloySignals } = await import("@workspace/db/schema");
        const { desc } = await import("drizzle-orm");
        return await db
          .select()
          .from(alloySignals)
          .orderBy(desc(alloySignals.createdAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
      } catch {
        return [];
      }
    },
    alloySignal: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { alloySignals } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(alloySignals).where(eq(alloySignals.id, args.id)).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    alloyWorkflows: async (_: unknown, args: { limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { alloyWorkflows } = await import("@workspace/db/schema");
        const { desc } = await import("drizzle-orm");
        return await db
          .select()
          .from(alloyWorkflows)
          .orderBy(desc(alloyWorkflows.createdAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
      } catch {
        return [];
      }
    },
    alloyWorkflow: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { alloyWorkflows } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(alloyWorkflows).where(eq(alloyWorkflows.id, args.id)).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    alloyWorkflowRuns: async (_: unknown, args: { workflowId?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { alloyWorkflowRuns } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db
          .select()
          .from(alloyWorkflowRuns)
          .orderBy(desc(alloyWorkflowRuns.startedAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
        if (args.workflowId) {
          return await query.where(eq(alloyWorkflowRuns.workflowId, args.workflowId));
        }
        return await query;
      } catch {
        return [];
      }
    },
    alloyWorkflowRun: async (_: unknown, args: { id: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { alloyWorkflowRuns } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.select().from(alloyWorkflowRuns).where(eq(alloyWorkflowRuns.id, parseIntId(args.id))).limit(1);
        return rows[0] ?? null;
      } catch {
        return null;
      }
    },
    alloyActions: async (_: unknown, args: { workflowId?: string; limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { alloyActions } = await import("@workspace/db/schema");
        const { desc, eq } = await import("drizzle-orm");
        const query = db
          .select()
          .from(alloyActions)
          .orderBy(desc(alloyActions.createdAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
        if (args.workflowId) {
          return await query.where(eq(alloyActions.workflowId, args.workflowId));
        }
        return await query;
      } catch {
        return [];
      }
    },
    alloyArtifacts: async (_: unknown, args: { limit?: number; offset?: number }) => {
      try {
        const { db } = await import("@workspace/db");
        const { alloyArtifacts } = await import("@workspace/db/schema");
        const { desc } = await import("drizzle-orm");
        return await db
          .select()
          .from(alloyArtifacts)
          .orderBy(desc(alloyArtifacts.createdAt))
          .limit(args.limit ?? 50)
          .offset(args.offset ?? 0);
      } catch {
        return [];
      }
    },
  },
  Mutation: {
    createAlloyWorkflow: async (_: unknown, args: { name: string; type?: string; priority?: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { alloyWorkflows } = await import("@workspace/db/schema");
        const rows = await db
          .insert(alloyWorkflows)
          .values({
            name: args.name,
            type: args.type ?? "standard",
            priority: args.priority ?? "medium",
            status: "pending",
          })
          .returning();
        return rows[0];
      } catch (err) {
        throw new Error(`Failed to create workflow: ${err}`);
      }
    },
    updateAlloyWorkflowRun: async (_: unknown, args: { id: string; status: string }) => {
      try {
        const { db } = await import("@workspace/db");
        const { alloyWorkflowRuns } = await import("@workspace/db/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db
          .update(alloyWorkflowRuns)
          .set({ status: args.status, ...(args.status === "completed" ? { completedAt: new Date() } : {}) })
          .where(eq(alloyWorkflowRuns.id, parseIntId(args.id)))
          .returning();
        const run = rows[0];
        pubsub.publish(ALLOY_EVENTS.WORKFLOW_RUN_UPDATED, { alloyWorkflowRunUpdated: run });
        publish(WS_CHANNELS.WORKFLOW_RUNS, "workflow-run-updated", {
          id: run.id,
          workflowId: run.workflowId,
          status: run.status,
          durationMs: run.durationMs,
        });
        return run;
      } catch (err) {
        throw new Error(`Failed to update workflow run: ${err}`);
      }
    },
  },
  Subscription: {
    alloyWorkflowRunUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator(ALLOY_EVENTS.WORKFLOW_RUN_UPDATED),
        (payload: { alloyWorkflowRunUpdated: { workflowId: number } }, variables: { workflowId?: string }) => {
          if (!variables.workflowId) return true;
          return String(payload.alloyWorkflowRunUpdated.workflowId) === variables.workflowId;
        },
      ),
    },
  },
};
