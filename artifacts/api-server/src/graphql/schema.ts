import { directiveTypeDefs } from './directives.js';
import { continuumResolvers, continuumTypeDefs, pubsub } from './domains/continuum.js';
import { approvalsResolvers, approvalsTypeDefs } from './domains/approvals.js';
import { authResolvers, authTypeDefs } from './domains/auth.js';
import { carlotaJoResolvers, carlotaJoTypeDefs } from './domains/carlota-jo.js';
import { aegisResolvers, aegisTypeDefs } from './domains/firestorm.js';
import { holdingsResolvers, holdingsTypeDefs } from './domains/holdings.js';
import { lyteResolvers, lyteTypeDefs } from './domains/lyte.js';
import { prismCounselResolvers, prismCounselTypeDefs } from './domains/prism-counsel.js';
import {
  prismCounselPilotOneResolvers,
  prismCounselPilotOneTypeDefs,
} from './domains/prism-counsel-pilot-one.js';
import { modelPassportsResolvers, modelPassportsTypeDefs } from './domains/model-passports.js';
import { proofChainResolvers, proofChainTypeDefs } from './domains/proof-chain.js';
import { stephenResolvers, stephenTypeDefs } from './domains/stephen.js';
import { terraResolvers, terraTypeDefs } from './domains/terra.js';
import { vesselsResolvers, vesselsTypeDefs } from './domains/vessels.js';

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
  continuumTypeDefs,
  aegisTypeDefs,
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
  modelPassportsTypeDefs,
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
      _version: () => '1.0.0',
    },
    Mutation: {
      _noop: () => null,
    },
    Subscription: {
      _heartbeat: {
        subscribe: () => pubsub.asyncIterableIterator('_HEARTBEAT'),
      },
    },
  },
  authResolvers as Record<string, Record<string, unknown>>,
  continuumResolvers as Record<string, Record<string, unknown>>,
  aegisResolvers as Record<string, Record<string, unknown>>,
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
  modelPassportsResolvers as Record<string, Record<string, unknown>>,
);
