import { useMemo, type ReactNode } from 'react';
import { Provider, createClient, fetchExchange, subscriptionExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';
import { createClient as createWSClient } from 'graphql-ws';

function getGraphQLUrl(): string {
  if (typeof window === 'undefined') return '/api/graphql';
  return `${window.location.origin}/api/graphql`;
}

function getWSUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost/api/graphql/ws';
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/api/graphql/ws`;
}

export function GraphQLProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const wsClient = createWSClient({
      url: getWSUrl,
      lazy: true,
      retryAttempts: 5,
      shouldRetry: () => true,
      connectionParams: () => ({}),
    });

    return createClient({
      url: getGraphQLUrl(),
      exchanges: [
        cacheExchange({}),
        fetchExchange,
        subscriptionExchange({
          forwardSubscription(operation) {
            return {
              subscribe(sink) {
                const dispose = wsClient.subscribe(
                  { ...operation, query: operation.query || '' },
                  sink as Parameters<typeof wsClient.subscribe>[1],
                );
                return { unsubscribe: dispose };
              },
            };
          },
        }),
      ],
      requestPolicy: 'cache-and-network',
      fetchOptions: () => ({
        credentials: 'include' as const,
      }),
    });
  }, []);

  return <Provider value={client}>{children}</Provider>;
}
