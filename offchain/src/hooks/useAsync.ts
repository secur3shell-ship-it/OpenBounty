// Loads data with loading, error and refetch. A refetch keeps the old data on screen
// until the new data arrives, so refreshes never flash a skeleton.

import { useCallback, useEffect, useState } from "react";

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

interface Loaded<T> {
  key: string;
  request: string;   // key + refetch count this result answers
  data: T | undefined;
  error: unknown;
}

// `key` identifies what is loaded; pass null to skip loading.
export function useAsync<T>(key: string | null, load: () => Promise<T>): AsyncState<T> {
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);
  const [version, setVersion] = useState(0);
  const refetch = useCallback(() => setVersion((v) => v + 1), []);
  const request = `${key}#${version}`;

  useEffect(() => {
    if (key === null) return;
    let live = true;
    load()
      .then((data) => { if (live) setLoaded({ key, request, data, error: null }); })
      .catch((error: unknown) => {
        // Keep the last good data for this key; only report the error
        if (live) setLoaded((prev) => ({ key, request, data: prev?.key === key ? prev.data : undefined, error }));
      });
    return () => { live = false; };
    // `load` is recreated every render; `request` decides when to reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const fresh = key !== null && loaded?.key === key;
  return {
    data: fresh ? loaded.data : undefined,
    loading: key !== null && loaded?.request !== request,
    error: fresh ? loaded.error : null,
    refetch,
  };
}
