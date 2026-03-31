import React, { type ReactNode } from "react";
import { ApolloProvider } from "@apollo/client";
import { getApolloClient } from "./client.js";

interface GraphQLProviderProps {
  children: ReactNode;
  graphqlEndpoint?: string;
  wsEndpoint?: string;
}

export function GraphQLProvider({
  children,
  graphqlEndpoint,
  wsEndpoint,
}: GraphQLProviderProps) {
  const client = getApolloClient(graphqlEndpoint, wsEndpoint);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
