import { authTypeDefs, authResolvers } from "./domains/auth";
import { alloyTypeDefs, alloyResolvers, pubsub } from "./domains/alloy";
import { firestormTypeDefs, firestormResolvers } from "./domains/firestorm";
import { vesselsTypeDefs, vesselsResolvers } from "./domains/vessels";
import { terraTypeDefs, terraResolvers } from "./domains/terra";
import { lyteTypeDefs, lyteResolvers } from "./domains/lyte";
import { holdingsTypeDefs, holdingsResolvers } from "./domains/holdings";
import { stephenTypeDefs, stephenResolvers } from "./domains/stephen";
import { carlotaJoTypeDefs, carlotaJoResolvers } from "./domains/carlota-jo";
import { prismCounselTypeDefs, prismCounselResolvers } from "./domains/prism-counsel";
import { prismCounselPilotOneTypeDefs, prismCounselPilotOneResolvers } from "./domains/prism-counsel-pilot-one";
import { directiveTypeDefs } from "./directives";
import { approvalsTypeDefs, approvalsResolvers } from "./domains/approvals";
import { proofChainTypeDefs, proofChainResolvers } from "./domains/proof-chain";

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
