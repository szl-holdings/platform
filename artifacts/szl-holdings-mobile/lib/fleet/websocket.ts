export interface VesselPositionUpdate {
  vesselId: string;
  name: string;
  lat: number;
  lon: number;
  latitude?: string;
  longitude?: string;
  speed: number;
  course: number;
  heading?: number;
  status: string;
  timestamp: string;
}

export interface AlertUpdate {
  id: string;
  vesselId: string;
  vesselName: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: string;
}

type PositionUpdateHandler = (update: VesselPositionUpdate) => void;
type AlertUpdateHandler = (update: AlertUpdate) => void;

type WsEventHandler = PositionUpdateHandler | AlertUpdateHandler | (() => void);

class VesselsWebSocket {
  private ws: WebSocket | null = null;
  private positionHandlers: Set<PositionUpdateHandler> = new Set();
  private alertHandlers: Set<AlertUpdateHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private token: string | null = null;
  private eventListeners: Map<string, Set<WsEventHandler>> = new Map();

  connect(token: string | null = null): void {
    this.token = token;
    if (this.ws) return;
    this.createConnection();
  }

  private createConnection(): void {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (!domain) return;

    const wsUrl = `wss://${domain}/api/vessels/ws${this.token ? `?token=${encodeURIComponent(this.token)}` : ""}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; data: unknown };
          if (msg.type === "position_update") {
            const update = msg.data as VesselPositionUpdate;
            update.latitude = String(update.lat);
            update.longitude = String(update.lon);
            this.positionHandlers.forEach((h) => h(update));
            this.emit("position_update", update);
          } else if (msg.type === "alert_update") {
            this.alertHandlers.forEach((h) => h(msg.data as AlertUpdate));
            this.emit("alert_created", msg.data as AlertUpdate);
          } else if (msg.type === "alert_resolved") {
            this.emit("alert_resolved", msg.data);
          }
        } catch {
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
    }
  }

  private emit(event: string, data?: unknown): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach((h) => (h as (data: unknown) => void)(data));
    }
  }

  on(event: string, handler: WsEventHandler): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
  }

  off(event: string, handler: WsEventHandler): void {
    this.eventListeners.get(event)?.delete(handler);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.createConnection();
    }, 5000);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  onPositionUpdate(handler: PositionUpdateHandler): () => void {
    this.positionHandlers.add(handler);
    return () => this.positionHandlers.delete(handler);
  }

  onAlertUpdate(handler: AlertUpdateHandler): () => void {
    this.alertHandlers.add(handler);
    return () => this.alertHandlers.delete(handler);
  }
}

export const vesselsWs = new VesselsWebSocket();
