import { useQuery } from "@tanstack/react-query";
import type { EcosystemSnapshot } from "../types";

async function fetchEcosystemSnapshot(): Promise<EcosystemSnapshot> {
  const res = await fetch("/api/command/snapshot", { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ecosystem snapshot: ${res.status} ${res.statusText}`);
  }
  const body = await res.json() as Omit<EcosystemSnapshot, "lastUpdated"> & { generatedAt: string };
  return {
    ...body,
    lastUpdated: new Date(body.generatedAt),
  };
}

export function useEcosystemData() {
  return useQuery({
    queryKey: ["ecosystem-snapshot"],
    queryFn: fetchEcosystemSnapshot,
    refetchInterval: 30_000,
    staleTime: 0,
    retry: 2,
  });
}
