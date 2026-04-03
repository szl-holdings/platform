import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

let _apolloClient: ApolloClient<unknown> | null = null;

function getGraphQLEndpoint(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/graphql`;
  }
  return "/api/graphql";
}

function getGraphQLWsEndpoint(): string {
  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/api/graphql/ws`;
  }
  return "ws://localhost/api/graphql/ws";
}

export function createApolloClient(
  graphqlEndpoint?: string,
  wsEndpoint?: string,
): ApolloClient<unknown> {
  const httpEndpoint = graphqlEndpoint ?? getGraphQLEndpoint();
  const wsUrl = wsEndpoint ?? getGraphQLWsEndpoint();

  const httpLink = new HttpLink({
    uri: httpEndpoint,
    credentials: "include",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  const wsLink = new GraphQLWsLink(
    createClient({
      url: wsUrl,
      retryAttempts: 5,
      shouldRetry: () => true,
    }),
  );

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      );
    },
    wsLink,
    httpLink,
  );

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
      },
      query: {
        fetchPolicy: "network-only",
        errorPolicy: "all",
      },
    },
  });
}

export function getApolloClient(
  graphqlEndpoint?: string,
  wsEndpoint?: string,
): ApolloClient<unknown> {
  if (!_apolloClient) {
    _apolloClient = createApolloClient(graphqlEndpoint, wsEndpoint);
  }
  return _apolloClient;
}

export function resetApolloClient(): void {
  _apolloClient = null;
}
