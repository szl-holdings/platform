import { GraphQLError } from 'graphql';

export interface SubscriptionWsContext {
  wsUser: {
    id: number;
    roles: string[];
    orgs: Array<{ orgId: number; role: string }>;
  };
}

export function requireAuthenticatedWsUser(context: any): asserts context is SubscriptionWsContext {
  if (!context?.wsUser) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

export function requireOperatorWsUser(context: any): asserts context is SubscriptionWsContext {
  requireAuthenticatedWsUser(context);
  const roles = context.wsUser.roles || [];
  if (!roles.includes('super_admin') && !roles.includes('admin')) {
    throw new GraphQLError('Forbidden: requires operator role', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

export function parseIntId(value: string, fieldName = 'id'): number {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new GraphQLError(`Invalid ${fieldName}: "${value}" is not a valid integer ID`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  return parsed;
}
