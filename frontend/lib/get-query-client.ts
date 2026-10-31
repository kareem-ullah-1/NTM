import { QueryClient, defaultShouldDehydrateQuery, isServer } from "@tanstack/react-query";

/**
 * Shared QueryClient defaults, used by both the server-side prefetch
 * (app/page.tsx and friends) and the client-side Providers component.
 * Keeping this in one place means the client that hydrates on the
 * browser has the exact same staleTime/gcTime behavior as before —
 * only the *source* of the first fetch changes (server vs. browser).
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // No client-side data cache — always treat data as stale so the
        // UI reflects the latest backend state after admin changes.
        staleTime: 0,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 1
      },
      dehydrate: {
        // Include queries still loading (e.g. a slow endpoint) so
        // suspense/loading states hydrate correctly instead of
        // re-fetching from scratch on the client.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending"
      }
    }
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * On the server: always return a new QueryClient — requests must not
 * share cache across users. On the browser: reuse a singleton so
 * React re-renders (e.g. Fast Refresh, route changes) don't wipe
 * the client-side cache.
 */
export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
