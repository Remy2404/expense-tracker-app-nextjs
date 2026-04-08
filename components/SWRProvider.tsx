'use client';

import { SWRConfig } from 'swr';

/**
 * Global SWR configuration.
 *
 * WHY revalidateOnFocus: false?
 * Tab-switch focus revalidation is the #1 cause of DB pool exhaustion.
 * With 50 users switching tabs, each visit generates 5+ redundant API calls
 * that all hit the DB simultaneously. Data is kept fresh via:
 *   - Explicit mutate() calls after every add / edit / delete
 *   - Real-time invalidations pushed by RealtimeBootstrap (Socket.IO)
 *
 * WHY revalidateOnReconnect: false?
 * Network reconnect re-fetches every mounted hook at once, creating a burst.
 * Mutations and realtime sync handle this already.
 *
 * dedupingInterval: 5 000 ms (default is 2 000 ms)
 * Prevents duplicate in-flight requests when the same key is used by
 * multiple components mounting at the same time (e.g. NotificationsBootstrap
 * + dashboard both subscribing to 'expenses').
 *
 * focusThrottleInterval: 60 000 ms
 * Belt-and-suspenders: if revalidateOnFocus is ever re-enabled per hook,
 * it can fire at most once per minute instead of on every alt-tab.
 */
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 5_000,
        focusThrottleInterval: 60_000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
