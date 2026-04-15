import { useContext } from "react";
import { SyncEngineContext, type SyncEngineState, type EnqueueOptions } from "../context/SyncEngineContext";

export interface UseSyncEngineResult extends SyncEngineState {
  domain: string;
  enqueue: (options: EnqueueOptions) => Promise<void>;
  resolveConflict: (conflictId: string, resolution: "keep-mine" | "keep-theirs") => Promise<void>;
  dismissConflict: (conflictId: string) => Promise<void>;
  retryFailed: () => Promise<void>;
  isOnline: boolean;
}

export function useSyncEngine(): UseSyncEngineResult {
  const ctx = useContext(SyncEngineContext);
  if (!ctx) {
    throw new Error("useSyncEngine must be used within a SyncEngineProvider");
  }
  return ctx;
}
