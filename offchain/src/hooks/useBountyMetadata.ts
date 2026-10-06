// Loads the optional details file behind a bounty's details link (see utils/metadata.ts).
// `metadata` is null while loading, when there's no link, and when the link is a plain
// web page rather than a v1 JSON file. Requests are shared, so several components on
// one page can call this for the same link and only one fetch goes out.

import { useCallback } from "react";
import { useAsync } from "./useAsync";
import { fetchMetadata, metadataGatewayUrl, type BountyMetadata } from "@/utils/metadata";

const MAX_CACHED = 50;
const requests = new Map<string, Promise<BountyMetadata | null>>();

function loadShared(url: string): Promise<BountyMetadata | null> {
  const cached = requests.get(url);
  if (cached) return cached;
  if (requests.size >= MAX_CACHED) requests.clear();

  const request = fetchMetadata(url);
  requests.set(url, request);
  // A failed load isn't kept, so "Try again" really tries again
  request.catch(() => requests.delete(url));
  return request;
}

export function useBountyMetadata(metadataUri: string) {
  const url = metadataGatewayUrl(metadataUri);
  const state = useAsync(url, () => (url ? loadShared(url) : Promise.resolve(null)));
  const { refetch: reload } = state;

  const refetch = useCallback(() => {
    if (url) requests.delete(url);
    reload();
  }, [url, reload]);

  return {
    metadata: state.data ?? null,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}
