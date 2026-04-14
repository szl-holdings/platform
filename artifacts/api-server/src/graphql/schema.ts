import { authTypeDefs, authResolvers } from "./domains/auth.js";
import { alloyTypeDefs, alloyResolvers, pubsub } from "./domains/alloy.js";
import { firestormTypeDefs, firestormResolvers } from "./domains/firestorm.js";
import { vesselsTypeDefs, vesselsResolvers } from "./domains/vessels.js";
import { terraTypeDefs, terraResolvers } from "./domains/terra.js";
import { lyteTypeDefs, lyteResolvers } from "./domains/lyte.js";
import { holdingsTypeDefs, holdingsResolvers } from "./domains/holdings.js";
import { stephenTypeDefs, stephenResolvers } from "./domains/stephen.js";
import { carlotaJoTypeDefs, carlotaJoResolvers } from "./domains/carlota-jo.js";
import { prismCounselTypeDefs, prismCounselResolvers } from "./domains/prism-counsel.js";
import { prismCounselPilotOneTypeDefs, prismCounselPilotOneResolvers } from "./domains/prism-counsel-pilot-one.js";
import { directiveTypeDefs } from "./directives.js";
import { approvalsTypeDefs, approvalsResolvers } from "./domains/approvals.js";
import { proofChainTypeDefs, proofChainResolvers } from "./domains/proof-chain.js";

const baseTypeDefs = `#graphql
  type Query {
    _version: String!
  }

  type Mutation {
    _noop: Boolean
  }

  type Subscription {
    _heartbeat: String!
  }
`;

export const typeDefs = [
  directiveTypeDefs,
  baseTypeDefs,
  authTypeDefs,
  alloyTypeDefs,
  firestormTypeDefs,
  vesselsTypeDefs,
  terraTypeDefs,
  lyteTypeDefs,
  holdingsTypeDefs,
  stephenTypeDefs,
  carlotaJoTypeDefs,
  prismCounselTypeDefs,
  prismCounselPilotOneTypeDefs,
  approvalsTypeDefs,
  proofChainTypeDefs,
];

function mergeResolversSimple(...resolverMaps: Record<string, Record<string, unknown>>[]) {
  const merged: Record<string, Record<string, unknown>> = {};
  for (const resolverMap of resolverMaps) {
    for (const [typeName, fields] of Object.entries(resolverMap)) {
      if (!merged[typeName]) {
        merged[typeName] = {};
      }
      Object.assign(merged[typeName], fields);
    }
  }
  return merged;
}

export const resolvers = mergeResolversSimple(
  {
    Query: {
      _version: () => "1.0.0",
    },
    Mutation: {
      _noop: () => null,
    },
    Subscription: {
      _heartbeat: {
        subscribe: () => pubsub.asyncIterableIterator("_HEARTBEAT"),
      },
    },
  },
  authResolvers as Record<string, Record<string, unknown>>,
  alloyResolvers as Record<string, Record<string, unknown>>,
  firestormResolvers as Record<string, Record<string, unknown>>,
  vesselsResolvers as Record<string, Record<string, unknown>>,
  terraResolvers as Record<string, Record<string, unknown>>,
  lyteResolvers as Record<string, Record<string, unknown>>,
  holdingsResolvers as Record<string, Record<string, unknown>>,
  stephenResolvers as Record<string, Record<string, unknown>>,
  carlotaJoResolvers as Record<string, Record<string, unknown>>,
  prismCounselResolvers as Record<string, Record<string, unknown>>,
  prismCounselPilotOneResolvers as Record<string, Record<string, unknown>>,
  approvalsResolvers as Record<string, Record<string, unknown>>,
  proofChainResolvers as Record<string, Record<string, unknown>>,
);
