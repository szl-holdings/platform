import { loadSeedDataSync, applyOffsetMinutes, applyOffsetDays } from "../lib/seed-loader.js";

type SignalSeverity = "critical" | "high" | "medium" | "low" | "info";

interface RawSignal {
  id: number;
  source: string;
  sourceType: string;
  severity: SignalSeverity;
  title: string;
  status: string;
  offsetMinutes?: number;
  receivedAt?: string;
}

interface RawIncident {
  id: number;
  title: string;
  description: string;
  severity: string;
  status: string;
  assignee: string;
  createdOffsetMinutes?: number;
  resolvedOffsetMinutes?: number;
  createdAt?: string;
  resolvedAt?: string;
}

interface RawCommandCard {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  assignee: string;
  dueDays?: number;
  dueDate?: string;
}

function hydrateSignals(raw: RawSignal[]) {
  return raw.map((item) => {
    const result: any = { ...item };
    if (typeof result.offsetMinutes === "number") {
      result.receivedAt = new Date(Date.now() - result.offsetMinutes * 60 * 1000).toISOString();
      delete result.offsetMinutes;
    }
    return result;
  });
}

function hydrateIncidents(raw: RawIncident[]) {
  return raw.map((item) => {
    const result: any = { ...item };
    if (typeof result.createdOffsetMinutes === "number") {
      result.createdAt = new Date(Date.now() - result.createdOffsetMinutes * 60 * 1000).toISOString();
      delete result.createdOffsetMinutes;
    }
    if (typeof result.resolvedOffsetMinutes === "number") {
      result.resolvedAt = new Date(Date.now() - result.resolvedOffsetMinutes * 60 * 1000).toISOString();
      delete result.resolvedOffsetMinutes;
    }
    return result;
  });
}

function hydrateCommandCards(raw: RawCommandCard[]) {
  return raw.map((item) => {
    const result: any = { ...item };
    if (typeof result.dueDays === "number") {
      result.dueDate = new Date(Date.now() + result.dueDays * 24 * 60 * 60 * 1000).toISOString();
      delete result.dueDays;
    }
    return result;
  });
}

const rawSignals = loadSeedDataSync<RawSignal[]>("lyte/signals.json", []);
export let signals = hydrateSignals(rawSignals);

const rawIncidents = loadSeedDataSync<RawIncident[]>("lyte/incidents.json", []);
export let incidents = hydrateIncidents(rawIncidents);

export let recommendations = loadSeedDataSync<any[]>("lyte/recommendations.json", []);

export let playbooks = loadSeedDataSync<any[]>("lyte/playbooks.json", []);

const rawCommandCards = loadSeedDataSync<RawCommandCard[]>("lyte/command-cards.json", []);
export let commandCards = hydrateCommandCards(rawCommandCards);
