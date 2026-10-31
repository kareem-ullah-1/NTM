"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  // getQueryClient() returns a browser-singleton on the client, so this
  // is the same one-instance-per-tab behavior as before — just sourced
  // from a shared factory so server-side prefetching (see app/page.tsx)
  // can use identical defaults.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
