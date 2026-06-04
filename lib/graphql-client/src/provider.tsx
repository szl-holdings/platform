import { ApolloProvider } from '@apollo/client';
import type { ReactNode } from 'react';
import { getApolloClient } from './client.js';

interface GraphQLProviderProps {
  children: ReactNode;
  graphqlEndpoint?: string;
  wsEndpoint?: string;
}

export function GraphQLProvider({ children, graphqlEndpoint, wsEndpoint }: GraphQLProviderProps) {
  const client = getApolloClient(graphqlEndpoint, wsEndpoint);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Provider = ApolloProvider as any;
  return <Provider client={client}>{children}</Provider>;
}
