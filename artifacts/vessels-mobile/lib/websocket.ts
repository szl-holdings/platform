import { EventEmitter } from "eventemitter3";
import type { Vessel } from "./api";

export interface VesselPositionUpdate {
  vesselId: number;
  latitude: string;
  longitude: string;
  speed: string;
  heading: number;
  recordedAt: string;
}

export interface AlertUpdate {
  id: number;
  title: string;
  severity: string;
  exceptionType: string;
  vesselId: number | null;
  detectedAt: string;
}

export type WsEvent =
  | { type: "vessel_position"; payload: VesselPositionUpdate }
  | { type: "alert_created"; payload: AlertUpdate }
  | { type: "alert_resolved"; payload: { id: number } }
  | { type: "fleet_summary"; payload: { underwayCount: number; avgSpeedKnots: number } };

type WsEventMap = {
  vessel_position: (payload: VesselPositionUpdate) => void;
  alert_created: (payload: AlertUpdate) => void;
  alert_resolved: (payload: { id: number }) => void;
  fleet_summary: (payload: { underwayCount: number; avgSpeedKnots: number }) => void;
  connected: () => void;
  disconnected: () => void;
};

function getWsBase(): string {
  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `wss://${process.env.EXPO_PUBLIC_DOMAIN}/ws/vessels`;
  }
  return "ws://localhost:3001/ws/vessels";
}

class VesselsWsClient extends EventEmitter<WsEventMap> {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 3000;
  private maxDelay = 30000;
  private shouldConnect = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  connect() {
    this.shouldConnect = true;
    this._open();
  }

  disconnect() {
    this.shouldConnect = false;
    this._cleanup();
  }

  private _cleanup() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.pingInterval = null;
    this.reconnectTimer = null;
  }

  private _open() {
    if (!this.shouldConnect) return;
    this._cleanup();

    try {
      const ws = new WebSocket(getWsBase());
      this.ws = ws;

      ws.onopen = () => {
        this.reconnectDelay = 3000;
        this.emit("connected");
        this.pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
      };

      ws.onmessage = (evt) => {
        try {
          const msg: WsEvent = JSON.parse(evt.data as string);
          switch (msg.type) {
            case "vessel_position":
              this.emit("vessel_position", msg.payload);
              break;
            case "alert_created":
              this.emit("alert_created", msg.payload);
              break;
            case "alert_resolved":
              this.emit("alert_resolved", msg.payload);
              break;
            case "fleet_summary":
              this.emit("fleet_summary", msg.payload);
              break;
          }
        } catch {}
      };

      ws.onerror = () => {};

      ws.onclose = () => {
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = null;
        this.ws = null;
        this.emit("disconnected");
        if (this.shouldConnect) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxDelay);
            this._open();
          }, this.reconnectDelay);
        }
      };
    } catch {}
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const vesselsWs = new VesselsWsClient();
