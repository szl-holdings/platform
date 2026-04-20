import { GraphQLError } from 'graphql';

export const authTypeDefs = `#graphql
  type User {
    id: ID!
    email: String
    name: String
    role: String
    createdAt: String
  }

  type AuthPayload {
    user: User
    authenticated: Boolean!
  }

  extend type Query {
    me: User
    authStatus: AuthPayload!
  }
`;

export const authResolvers = {
  Query: {
    me: async (
      _: unknown,
      __: unknown,
      ctx: {
        user?: { id: string; email?: string; name?: string; role?: string; createdAt?: string };
      },
    ) => {
      if (!ctx.user) return null;
      return ctx.user;
    },
    authStatus: async (
      _: unknown,
      __: unknown,
      ctx: { user?: { id: string; email?: string; name?: string; role?: string } },
    ) => {
      return {
        user: ctx.user ?? null,
        authenticated: !!ctx.user,
      };
    },
  },
};
