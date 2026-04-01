import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/apiClient";

export interface WorkflowRunEvent {
  id: number;
  workflowId: number | null;
  state: string;
}

type WsStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

function getWsBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    return `wss://${domain}`;
  }
  return "ws://localhost";
}

export function useAlloyWebSocket(enabled = true) {
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<WsStatus>("idle");
  const [lastEvent, setLastEvent] = useState<WorkflowRunEvent | null>(null);

  const cleanup = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!mountedRef.current || !enabled) return;
    cleanup();
    setStatus("connecting");

    const token = await getAuthToken();
    const ws = new WebSocket(`${getWsBase()}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus("connected");
      ws.send(
        JSON.stringify({
          type: "subscribe",
          channel: "workflow-runs",
          token: token ?? undefined,
        })
      );
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    ws.onmessage = (ev) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(ev.data as string);
        if (
          msg.type === "message" &&
          msg.channel === "workflow-runs" &&
          (msg.event === "run-updated" || msg.event === "workflow-run-updated")
        ) {
          const run: WorkflowRunEvent = msg.data;
          setLastEvent(run);
          qc.invalidateQueries({ queryKey: ["szl-alloy-runs"] });
          if (run.state === "waiting_approval") {
            qc.invalidateQueries({ queryKey: ["szl-alloy-approvals-pending"] });
          }
        }
      } catch {
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus("error");
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setStatus("disconnected");
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      reconnectRef.current = setTimeout(() => {
        if (mountedRef.current && enabled) connect();
      }, 5000);
    };
  }, [enabled, cleanup, qc]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) connect();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [enabled, connect, cleanup]);

  return { status, lastEvent };
}
