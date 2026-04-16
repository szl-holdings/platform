import { useState, useEffect, useCallback } from "react";

export interface ActivationStateOptions {
  apiBaseUrl?: string;
  pollIntervalMs?: number;
}

export interface ActivationState {
  signalSourceConnected: boolean;
  workflowDeployed: boolean;
  actionTriaged: boolean;
  teamMemberInvited: boolean;
  profileComplete: boolean;
  isLoading: boolean;
  refresh: () => void;
}

const STORAGE_KEY = "szl_activation_state";
const STORAGE_TTL_MS = 5 * 60 * 1000;

function readCache(): Partial<Omit<ActivationState, "isLoading" | "refresh">> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as {
      ts: number;
      data: Partial<Omit<ActivationState, "isLoading" | "refresh">>;
    };
    if (Date.now() - ts > STORAGE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data: Partial<Omit<ActivationState, "isLoading" | "refresh">>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

export function markActivationEvent(
  event: keyof Omit<ActivationState, "isLoading" | "refresh">,
) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const cached = raw
      ? (JSON.parse(raw) as { ts: number; data: Record<string, boolean> }).data
      : {};
    writeCache({ ...cached, [event]: true });
  } catch {}
}

async function countFromEndpoint(
  url: string,
  options: RequestInit,
): Promise<number> {
  try {
    const res = await globalThis.fetch(url, options);
    if (!res.ok) return 0;
    const json = await res.json();
    const payload = json?.data ?? json;
    if (Array.isArray(payload)) return payload.length;
    if (typeof payload?.total === "number") return payload.total;
    if (typeof payload?.count === "number") return payload.count;
    if (payload && typeof payload === "object" && !Array.isArray(payload)) return 1;
    return 0;
  } catch {
    return 0;
  }
}

async function isProfileComplete(url: string, options: RequestInit): Promise<boolean> {
  try {
    const res = await globalThis.fetch(url, options);
    if (!res.ok) return false;
    const json = await res.json();
    const user = json?.data ?? json;
    return !!(user?.displayName && user?.email);
  } catch {
    return false;
  }
}

export function useActivationState(
  options: ActivationStateOptions = {},
): ActivationState {
  const { apiBaseUrl = "/api", pollIntervalMs = 0 } = options;

  const [state, setState] = useState<Omit<ActivationState, "refresh">>(() => {
    const cached = readCache();
    return {
      signalSourceConnected: cached?.signalSourceConnected ?? false,
      workflowDeployed: cached?.workflowDeployed ?? false,
      actionTriaged: cached?.actionTriaged ?? false,
      teamMemberInvited: cached?.teamMemberInvited ?? false,
      profileComplete: cached?.profileComplete ?? false,
      isLoading: true,
    };
  });

  const doFetch = useCallback(async () => {
    const reqOpts: RequestInit = { credentials: "include" };

    try {
      const [signalCount, workflowCount, approvedCount, profileDone] =
        await Promise.all([
          countFromEndpoint(`${apiBaseUrl}/lyte/signals?limit=1`, reqOpts),
          countFromEndpoint(`${apiBaseUrl}/alloy/workflows?limit=1`, reqOpts),
          countFromEndpoint(
            `${apiBaseUrl}/alloy/approvals?status=approved&limit=1`,
            reqOpts,
          ),
          isProfileComplete(`${apiBaseUrl}/user/profile`, reqOpts),
        ]);

      const storedCache = readCache();

      const next: Omit<ActivationState, "refresh"> = {
        signalSourceConnected: signalCount > 0,
        workflowDeployed: workflowCount > 0,
        actionTriaged: approvedCount > 0,
        teamMemberInvited:
          storedCache?.teamMemberInvited ?? false,
        profileComplete: profileDone,
        isLoading: false,
      };

      writeCache(next);
      setState(next);
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    doFetch();
    if (!pollIntervalMs) return;
    const id = setInterval(doFetch, pollIntervalMs);
    return () => clearInterval(id);
  }, [doFetch, pollIntervalMs]);

  const refresh = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true }));
    doFetch();
  }, [doFetch]);

  return { ...state, refresh };
}
