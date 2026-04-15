export interface VesselPositionUpdate {
  vesselId: string;
  name: string;
  lat: number;
  lon: number;
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

class VesselsWebSocket {
  private ws: WebSocket | null = null;
  private positionHandlers: Set<PositionUpdateHandler> = new Set();
  private alertHandlers: Set<AlertUpdateHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private token: string | null = null;

  connect(token: string | null): void {
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
            this.positionHandlers.forEach((h) => h(msg.data as VesselPositionUpdate));
          } else if (msg.type === "alert_update") {
            this.alertHandlers.forEach((h) => h(msg.data as AlertUpdate));
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
