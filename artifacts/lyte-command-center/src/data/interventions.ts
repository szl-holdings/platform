import { useSyncExternalStore } from "react";

export type InterventionType = "claim" | "resolve" | "reassign" | "address";
export type InterventionItemKind = "drift" | "debt";

export interface Intervention {
  id: string;
  itemId: string;
  itemKind: InterventionItemKind;
  itemTitle: string;
  type: InterventionType;
  actor: string;
  timestamp: string;
  notes?: string;
  proofRef: string;
  newOwner?: string;
}

export interface DriftIntervention {
  claimedBy?: string;
  claimedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  resolveProofRef?: string;
  claimProofRef?: string;
}

export interface DebtIntervention {
  reassignedTo?: string;
  reassignedAt?: string;
  reassignedBy?: string;
  addressedAt?: string;
  addressedBy?: string;
  addressedNote?: string;
  addressedProofRef?: string;
  reassignProofRef?: string;
}

export const DEMO_OPERATOR_FALLBACK = "Demo Operator";
const STORAGE_KEY = "lyte:interventions:v2";
const isBrowser = typeof window !== "undefined";

interface State {
  log: Intervention[];
  drift: Record<string, DriftIntervention>;
  debt: Record<string, DebtIntervention>;
  operator: string;
  hydrated: boolean;
  syncing: boolean;
}

function load(): State {
  const base: State = { log: [], drift: {}, debt: {}, operator: DEMO_OPERATOR_FALLBACK, hydrated: false, syncing: false };
  if (!isBrowser) return base;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<State>;
    return {
      ...base,
      log: Array.isArray(parsed.log) ? parsed.log : [],
      drift: parsed.drift ?? {},
      debt: parsed.debt ?? {},
      operator: parsed.operator || DEMO_OPERATOR_FALLBACK,
    };
  } catch {
    return base;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  if (!isBrowser) return;
  try {
    const { log, drift, debt, operator } = state;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ log, drift, debt, operator }));
  } catch {
    /* ignore quota errors */
  }
}

function emit() {
  persist();
  listeners.forEach(l => l());
}

function setState(updater: (s: State) => State) {
  state = updater(state);
  emit();
}

function applyToProjection(record: Intervention, current: State): State {
  if (record.itemKind === "drift") {
    const prev = current.drift[record.itemId] ?? {};
    if (record.type === "claim") {
      return {
        ...current,
        drift: {
          ...current.drift,
          [record.itemId]: { ...prev, claimedBy: record.actor, claimedAt: record.timestamp, claimProofRef: record.proofRef },
        },
      };
    }
    if (record.type === "resolve") {
      return {
        ...current,
        drift: {
          ...current.drift,
          [record.itemId]: {
            ...prev,
            resolvedBy: record.actor,
            resolvedAt: record.timestamp,
            resolutionNote: record.notes,
            resolveProofRef: record.proofRef,
          },
        },
      };
    }
  }
  if (record.itemKind === "debt") {
    const prev = current.debt[record.itemId] ?? {};
    if (record.type === "reassign") {
      return {
        ...current,
        debt: {
          ...current.debt,
          [record.itemId]: {
            ...prev,
            reassignedTo: record.newOwner,
            reassignedBy: record.actor,
            reassignedAt: record.timestamp,
            reassignProofRef: record.proofRef,
          },
        },
      };
    }
    if (record.type === "address") {
      return {
        ...current,
        debt: {
          ...current.debt,
          [record.itemId]: {
            ...prev,
            addressedBy: record.actor,
            addressedAt: record.timestamp,
            addressedNote: record.notes,
            addressedProofRef: record.proofRef,
          },
        },
      };
    }
  }
  return current;
}

function ingestServerRecord(record: Intervention) {
  setState(prev => {
    if (prev.log.some(e => e.id === record.id)) return prev;
    const withLog: State = { ...prev, log: [record, ...prev.log] };
    return applyToProjection(record, withLog);
  });
}

function localFallbackProofRef(): string {
  const seq = String(state.log.length + 1).padStart(4, "0");
  return `LOCAL-INT-${seq}`;
}

async function postIntervention(payload: {
  itemId: string;
  itemKind: InterventionItemKind;
  itemTitle: string;
  type: InterventionType;
  notes?: string;
  newOwner?: string;
}): Promise<Intervention | null> {
  if (!isBrowser) return null;
  try {
    const res = await fetch("/api/lyte/interventions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    const data = json?.data ?? json;
    if (data && typeof data.id === "string" && typeof data.proofRef === "string") {
      return data as Intervention;
    }
    return null;
  } catch {
    return null;
  }
}

async function recordIntervention(input: {
  itemId: string;
  itemKind: InterventionItemKind;
  itemTitle: string;
  type: InterventionType;
  notes?: string;
  newOwner?: string;
}) {
  // Try the server first so the proof ref + actor come from the authoritative
  // ledger and the audit trail is shared across operators. If the API is
  // unreachable, fall back to a local-only entry so the demo still works.
  const server = await postIntervention(input);
  if (server) {
    ingestServerRecord(server);
    return;
  }

  const timestamp = new Date().toISOString();
  const fallback: Intervention = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    itemId: input.itemId,
    itemKind: input.itemKind,
    itemTitle: input.itemTitle,
    type: input.type,
    actor: state.operator,
    notes: input.notes,
    newOwner: input.newOwner,
    proofRef: localFallbackProofRef(),
    timestamp,
  };
  setState(prev => applyToProjection(fallback, { ...prev, log: [fallback, ...prev.log] }));
}

export async function claimDrift(item: { id: string; title: string }) {
  await recordIntervention({ itemId: item.id, itemKind: "drift", itemTitle: item.title, type: "claim" });
}

export async function resolveDrift(item: { id: string; title: string }, note: string) {
  await recordIntervention({
    itemId: item.id,
    itemKind: "drift",
    itemTitle: item.title,
    type: "resolve",
    notes: note || undefined,
  });
}

export async function reassignDebt(item: { id: string; title: string }, newOwner: string) {
  if (!newOwner.trim()) return;
  await recordIntervention({
    itemId: item.id,
    itemKind: "debt",
    itemTitle: item.title,
    type: "reassign",
    newOwner: newOwner.trim(),
  });
}

export async function addressDebt(item: { id: string; title: string }, evidence: string) {
  if (!evidence.trim()) return;
  await recordIntervention({
    itemId: item.id,
    itemKind: "debt",
    itemTitle: item.title,
    type: "address",
    notes: evidence.trim(),
  });
}

export function clearInterventions() {
  setState(() => ({ log: [], drift: {}, debt: {}, operator: state.operator, hydrated: state.hydrated, syncing: false }));
}

interface AuthUserResponse {
  data?: { displayName?: string };
  displayName?: string;
}

export async function bootstrapInterventions() {
  if (!isBrowser || state.hydrated || state.syncing) return;
  setState(prev => ({ ...prev, syncing: true }));

  // Resolve operator from authenticated session if available.
  try {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (res.ok) {
      const json = (await res.json().catch(() => null)) as AuthUserResponse | null;
      const name = json?.data?.displayName ?? json?.displayName;
      if (typeof name === "string" && name.trim()) {
        setState(prev => ({ ...prev, operator: name }));
      }
    }
  } catch {
    /* keep existing operator */
  }

  // Hydrate intervention ledger from server. Server records are the source of
  // truth — they carry the authenticated actor and the canonical proof ref.
  try {
    const res = await fetch("/api/lyte/interventions", { credentials: "include" });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      const rows = (json?.data ?? json) as Intervention[] | null;
      if (Array.isArray(rows)) {
        // Apply oldest → newest so later records correctly overlay earlier ones.
        [...rows].reverse().forEach(ingestServerRecord);
      }
    }
  } catch {
    /* offline — local store remains authoritative */
  }

  setState(prev => ({ ...prev, hydrated: true, syncing: false }));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): State {
  return state;
}

function getServerSnapshot(): State {
  return { log: [], drift: {}, debt: {}, operator: DEMO_OPERATOR_FALLBACK, hydrated: false, syncing: false };
}

export function useInterventions(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
