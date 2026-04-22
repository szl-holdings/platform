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

export async function buildGraphQLMiddleware(httpServer: HttpServer): Promise<RequestHandler> {
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/api/graphql/ws',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async () => {
        return { loaders: createDataLoaders() };
      },
      onConnect: async () => {
        logger.debug('GraphQL subscription client connected');
        return true;
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
