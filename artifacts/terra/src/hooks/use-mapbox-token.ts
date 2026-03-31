import { useQuery } from "@tanstack/react-query";

async function fetchMapboxToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/config/mapbox-token", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token ?? null;
  } catch {
    return null;
  }
}

export function useMapboxToken() {
  const { data: token, isLoading } = useQuery({
    queryKey: ["mapbox-token"],
    queryFn: fetchMapboxToken,
    staleTime: Infinity,
    retry: 1,
  });
  return { token: token ?? null, isLoading };
}
