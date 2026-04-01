import {
  createClient,
  cacheExchange,
  fetchExchange,
  type Client,
} from "urql";
import { getApiBase, getCachedAuthToken } from "@/lib/apiClient";

let _client: Client | null = null;

export function getGraphQLClient(): Client {
  if (_client) return _client;

  _client = createClient({
    url: `${getApiBase()}/api/graphql`,
    fetchOptions: () => {
      const token = getCachedAuthToken();
      return {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };
    },
    exchanges: [cacheExchange, fetchExchange],
  });

  return _client;
}
