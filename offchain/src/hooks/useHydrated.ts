// false on the server and during hydration, true after. Wallet state only exists
// in the browser, so wallet-dependent UI waits for this to avoid hydration mismatches.

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
