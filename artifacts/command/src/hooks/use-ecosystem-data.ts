import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

export interface EcosystemDataResult {
  data: EcosystemSnapshot | null;
  dataUpdatedAt: number;
  sseConnected: boolean;
}

export function useEcosystemData(): EcosystemDataResult {
  const [data, setData] = useState<EcosystemSnapshot | null>(null);
  const [dataUpdatedAt, setDataUpdatedAt] = useState<number>(0);
  const [sseConnected, setSseConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchEcosystemSnapshot().then((snapshot) => {
      if (!cancelled) {
        setData(snapshot);
        setDataUpdatedAt(Date.now());
      }
    }).catch(() => {});

    const startSSE = () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      const es = new EventSource("/api/command/snapshot/stream");
      esRef.current = es;

      es.onopen = () => {
        if (!cancelled) setSseConnected(true);
        if (fallbackRef.current) {
          clearInterval(fallbackRef.current);
          fallbackRef.current = null;
        }
      };

      es.onmessage = (event) => {
        if (cancelled) return;
        try {
          const body = JSON.parse(event.data) as Omit<EcosystemSnapshot, "lastUpdated"> & { generatedAt: string };
          setData({ ...body, lastUpdated: new Date(body.generatedAt) });
          setDataUpdatedAt(Date.now());
        } catch {}
      };

      es.onerror = () => {
        if (!cancelled) {
          setSseConnected(false);
          es.close();
          esRef.current = null;
          if (!fallbackRef.current) {
            fallbackRef.current = setInterval(() => {
              fetchEcosystemSnapshot().then((snapshot) => {
                if (!cancelled) {
                  setData(snapshot);
                  setDataUpdatedAt(Date.now());
                }
              }).catch(() => {});
            }, 30_000);
          }
          setTimeout(startSSE, 5_000);
        }
      };
    };

    startSSE();

    return () => {
      cancelled = true;
      esRef.current?.close();
      esRef.current = null;
      if (fallbackRef.current) {
        clearInterval(fallbackRef.current);
        fallbackRef.current = null;
      }
    };
  }, []);

  return { data, dataUpdatedAt, sseConnected };
}
