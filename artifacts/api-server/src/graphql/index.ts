import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { Request, RequestHandler } from 'express';
import depthLimit from 'graphql-depth-limit';
import { useServer } from 'graphql-ws/use/ws';
import type { Server as HttpServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { logger } from '../lib/logger.js';
import { SESSION_COOKIE, LEGACY_SESSION_COOKIE } from '../lib/auth.js';
import { resolveUserFromToken } from '../middlewares/auth.js';
import { type AppDataLoaders, createDataLoaders } from './dataloaders.js';
import { resolvers, typeDefs } from './schema.js';

const MAX_QUERY_DEPTH = 10;

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
        return {
          wsUser,
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

  const apolloServer = new ApolloServer<GraphQLContext>({
    schema,
    introspection: !isProduction,
    validationRules: [depthLimit(MAX_QUERY_DEPTH)],
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
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
