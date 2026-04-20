import { GraphQLError } from 'graphql';

export function parseIntId(value: string, fieldName = 'id'): number {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new GraphQLError(`Invalid ${fieldName}: "${value}" is not a valid integer ID`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  return parsed;
}
