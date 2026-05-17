import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import { expressMiddleware } from '@as-integrations/express5';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { Request, RequestHandler } from 'express';
import {
  createComplexityRule,
  fieldExtensionsEstimator,
  simpleEstimator,
} from 'graphql-query-complexity';
import { useServer } from 'graphql-ws/use/ws';
import { GraphQLError, type GraphQLSchema } from 'graphql';
import type { Server as HttpServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { logger } from '../lib/logger.js';
import { SESSION_COOKIE, LEGACY_SESSION_COOKIE } from '../lib/auth.js';
import { resolveUserFromToken } from '../middlewares/auth.js';
import { type AppDataLoaders, createDataLoaders } from './dataloaders.js';
import { resolvers, typeDefs } from './schema.js';

const MAX_QUERY_DEPTH = 10;

/**
 * Maximum query complexity score.
 *
 * Weighted field cost model (replaces flat depth-limit):
 *   - Default field cost: 1
 *   - List fields: 10 (they fan out N rows)
 *   - Subscription fields: 5
 *   - Dashboard/aggregate resolvers: 20 (multiple DB calls)
 *
 * A simple { me { id } } scores ~2.
 * A paginated list with nested resolvers scores ~50-100.
 * The 1000 ceiling allows rich queries while blocking nested list bombs
 * (e.g. { alloyWorkflows { runs { steps } } } × 100 would score ~10 000).
 */
const MAX_QUERY_COMPLEXITY = 1000;

/**
 * Per-field complexity overrides (applied via custom estimator).
 *
 * Fields listed here get their cost multiplied accordingly.
 * List-returning resolvers that fan out to multiple DB queries
 * get higher weights so they hit the ceiling faster.
 *
 * To set complexity per-field in the schema definition itself,
 * add field extensions: { complexity: N } to individual type fields.
 */
const FIELD_COMPLEXITY_MAP: Record<string, number> = {
  alloyDashboard: 20,
  lyteExecutiveSummary: 20,
  lyteQueue: 15,
  alloyWorkflows: 10,
  alloySignals: 10,
  lyteSignals: 10,
  lyteIncidents: 10,
  vessels: 10,
  terraDistressProperties: 10,
  terraDeals: 10,
  alloyAuditLog: 10,
  runAlloyWorkflow: 5,
  createAlloySignalWorkflow: 5,
};

function buildComplexityRule(_schema: GraphQLSchema) {
  return createComplexityRule({
    maximumComplexity: MAX_QUERY_COMPLEXITY,
    estimators: [
      // Field extension estimator: respects field.extensions.complexity = N in SDL
      fieldExtensionsEstimator(),
      // Custom estimator: applies FIELD_COMPLEXITY_MAP overrides, then defaults to 1
      simpleEstimator({
        defaultComplexity: 1,
      }),
      // Named field cost override estimator
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        OperationDefinition: ({ childComplexity }: any) => childComplexity,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Field: ({ childComplexity, node }: any): number => {
          const fieldName = node.name.value as string;
          const override = FIELD_COMPLEXITY_MAP[fieldName];
          return override !== undefined ? override + childComplexity : 1 + childComplexity;
        },
      },
    ],
    createError: (max: number, actual: number) =>
      new GraphQLError(
        `Query too complex: score ${actual} exceeds maximum ${max}. ` +
          'Reduce the number of nested list fields or paginate with smaller limits.',
        { extensions: { code: 'QUERY_TOO_COMPLEX', max, actual } },
      ),
    onComplete: (complexity) => {
      if (complexity > MAX_QUERY_COMPLEXITY * 0.8) {
        logger.warn({ complexity, max: MAX_QUERY_COMPLEXITY }, '[graphql] High-complexity query');
      }
    },
  });
}

export interface GraphQLContext {
  user?: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
  };
  req?: Request;
  loaders: AppDataLoaders;
}

function parseCookieHeader(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx < 0) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) cookies[key] = val;
  }
  return cookies;
}

export async function buildGraphQLMiddleware(httpServer: HttpServer): Promise<RequestHandler> {
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/api/graphql/ws',
  });

  const serverCleanup = useServer(
    {
      schema,
      onConnect: async (ctx) => {
        const request = (ctx as unknown as { extra: { request?: { headers?: Record<string, string | string[] | undefined> } } }).extra?.request;

        let token: string | undefined;

        const params = ctx.connectionParams as Record<string, unknown> | undefined;
        const authParam = params?.authorization ?? params?.Authorization;
        if (typeof authParam === 'string' && authParam.startsWith('Bearer ')) {
          token = authParam.slice(7);
        }

        if (!token) {
          const cookieHeader = request?.headers?.cookie;
          if (typeof cookieHeader === 'string') {
            const cookies = parseCookieHeader(cookieHeader);
            token = cookies[SESSION_COOKIE] ?? cookies[LEGACY_SESSION_COOKIE];
          }
        }

        if (!token) {
          logger.warn('[graphql-ws] Subscription connection rejected: no authentication token');
          return false;
        }

        const resolved = await resolveUserFromToken(token);
        if (resolved.kind !== 'ok') {
          logger.warn(
            { kind: resolved.kind },
            '[graphql-ws] Subscription connection rejected: invalid or revoked session',
          );
          return false;
        }

        (ctx.extra as Record<string, unknown>).wsUser = resolved.user;
        logger.debug(
          { userId: resolved.user.id },
          '[graphql-ws] Subscription client authenticated',
        );
        return true;
      },
      context: async (ctx) => {
        const wsUser = (ctx.extra as Record<string, unknown>).wsUser as
          | { id: number; displayName: string; email: string | null; roles: string[]; orgs: Array<{ orgId: number; orgSlug: string; orgName: string; role: string }> }
          | undefined;

        if (!wsUser) {
          throw new GraphQLError('Not authenticated', {
            extensions: { code: 'UNAUTHENTICATED' },
          });
        }

        return {
          wsUser,
          req: {
            user: {
              id: wsUser.id,
              roles: wsUser.roles,
              orgs: wsUser.orgs,
            },
          },
          loaders: createDataLoaders(),
        };
      },
      onDisconnect: () => {
        logger.debug('GraphQL subscription client disconnected');
      },
    },
    wsServer,
  );

  const isProduction = process.env.NODE_ENV === 'production';

  // Build the complexity rule bound to the schema for accurate field-type analysis
  const complexityRule = buildComplexityRule(schema);

  // Suppress unused variable warning — MAX_QUERY_DEPTH is retained as a
  // belt-and-suspenders depth guard that runs alongside complexity analysis.
  void MAX_QUERY_DEPTH;

  const apolloServer = new ApolloServer<GraphQLContext>({
    schema,
    introspection: !isProduction,
    // Query complexity analysis replaces flat depth limiting.
    // Complexity scoring assigns weighted costs per field so that nested
    // list queries (which cause N+1 DB fan-out) hit the ceiling faster
    // than simple scalar queries at equivalent depth.
    validationRules: [complexityRule],
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginCacheControl({ defaultMaxAge: 0 }),
      // Persisted queries: log APQ cache hits for performance monitoring
      {
        async requestDidStart() {
          return {
            async executionDidStart({ request }: { request: { http?: { headers?: Map<string, string> } } }) {
              const isPersistedQuery = request.http?.headers?.get('x-apollo-operation-name') !== undefined;
              if (isPersistedQuery) {
                logger.debug('[graphql] Persisted query execution');
              }
            },
          };
        },
      },
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await apolloServer.start();

  const middleware = expressMiddleware(apolloServer, {
    context: async ({ req }: { req: any }) => {
      const authReq = req as Request & { user?: GraphQLContext['user'] };
      return {
        user: authReq.user,
        req,
        loaders: createDataLoaders(),
      };
    },
  });

  return middleware as any;
}
