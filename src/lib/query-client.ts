import { isServer, QueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) {
    return createQueryClient();
  }

  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

export function createScopedQueryKey(actorCacheKey: string, ...parts: QueryKey): QueryKey {
  return ["actor", actorCacheKey, ...parts];
}
