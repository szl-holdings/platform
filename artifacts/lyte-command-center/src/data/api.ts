import { useQuery } from "@tanstack/react-query";
import type { DriftItem, PressureCell, DebtItem, ReplayScenario, BoardMetric, BoardRisk } from "./seed";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(`Request failed (${res.status}): ${path}`);
  return res.json() as Promise<T>;
}

export interface DriftHistoryPoint { date: string; count: number }
export interface DebtHistoryPoint { date: string; critical: number; high: number; medium: number }

export function useOwnershipDrift() {
  return useQuery({
    queryKey: ["lyte", "ownership-drift"],
    queryFn: () => getJson<{ items: DriftItem[]; history: DriftHistoryPoint[] }>("/api/lyte/ownership-drift"),
  });
}

export function usePressureMap() {
  return useQuery({
    queryKey: ["lyte", "pressure-map"],
    queryFn: () => getJson<{ cells: PressureCell[] }>("/api/lyte/pressure-map"),
  });
}

export function useActionDebt() {
  return useQuery({
    queryKey: ["lyte", "action-debt"],
    queryFn: () => getJson<{ items: DebtItem[]; history: DebtHistoryPoint[] }>("/api/lyte/action-debt"),
  });
}

export function useDecisionReplay() {
  return useQuery({
    queryKey: ["lyte", "decision-replay"],
    queryFn: () => getJson<{ scenarios: ReplayScenario[] }>("/api/lyte/decision-replay"),
  });
}

export function useBoardView() {
  return useQuery({
    queryKey: ["lyte", "board-view"],
    queryFn: () => getJson<{ metrics: BoardMetric[]; risks: BoardRisk[] }>("/api/lyte/board-view"),
  });
}
