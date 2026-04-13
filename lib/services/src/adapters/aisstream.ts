import { ServiceAdapter } from "../base.js";

export interface AisStreamVessel {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  heading: number;
  shipType: number;
  shipTypeName: string;
  navStatus: number;
  navStatusName: string;
  destination: string;
  timestamp: string;
  source: "aisstream";
}

const SHIP_TYPE_MAP: Record<number, string> = {
  20: "WIG", 30: "Fishing", 31: "Towing", 36: "Sailing", 37: "Pleasure Craft",
  40: "High Speed Craft", 50: "Pilot Vessel", 51: "SAR", 52: "Tug",
  60: "Passenger", 70: "Cargo", 71: "Cargo A", 80: "Tanker", 90: "Other",
};

const NAV_STATUS_MAP: Record<number, string> = {
  0: "Under way using engine", 1: "At anchor", 2: "Not under command",
  3: "Restricted manoeuvrability", 5: "Moored", 6: "Aground",
  7: "Engaged in fishing", 8: "Under way sailing", 15: "Undefined",
};

const GLOBAL_BOUNDING_BOXES = [
  [-180, -90, 180, 90],
];

const MESSAGE_TYPES = ["PositionReport", "ExtendedClassBPositionReport", "StandardClassBPositionReport"];

export class AisStreamAdapter extends ServiceAdapter {
  readonly name = "aisstream";
  readonly description = "AISStream.io global real-time AIS WebSocket — free API key, global vessel positions";
  readonly requiredEnvVars = ["AISSTREAM_API_KEY"];

  private vesselCache: Map<string, AisStreamVessel> = new Map();
  private wsConnected = false;
  private wsInstance: any = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastMessageAt: number = 0;

  protected async performHealthCheck(): Promise<void> {
    const key = process.env["AISSTREAM_API_KEY"];
    if (!key) throw new Error("AISSTREAM_API_KEY not set");
    if (!this.wsConnected || Date.now() - this.lastMessageAt > 120000) {
      this.connect();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    if (!this.wsConnected) throw new Error("AISStream WebSocket not connected");
  }

  connect(): void {
    if (!this.isLive) return;
    const key = process.env["AISSTREAM_API_KEY"];
    if (!key) return;

    if (this.wsInstance) {
      try { this.wsInstance.close(); } catch (_e) {}
      this.wsInstance = null;
    }

    void this.connectAsync(key);
  }

  private async connectAsync(key: string): Promise<void> {
    try {
      const WebSocket = (await import("ws")).default;
      const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      this.wsInstance = ws;

      ws.on("open", () => {
        this.wsConnected = true;
        const subscription = {
          APIKey: key,
          BoundingBoxes: GLOBAL_BOUNDING_BOXES,
          FilterMessageTypes: MESSAGE_TYPES,
        };
        ws.send(JSON.stringify(subscription));
      });

      ws.on("message", (data: any) => {
        this.lastMessageAt = Date.now();
        try {
          const msg = JSON.parse(typeof data === "string" ? data : data.toString());
          this.processMessage(msg);
        } catch (parseErr) {
          console.debug("[AISstream] Failed to parse AIS message:", parseErr);
        }
      });

      ws.on("close", () => {
        this.wsConnected = false;
        this.wsInstance = null;
        this.scheduleReconnect();
      });

      ws.on("error", (wsErr: Error) => {
        console.error("[AISstream] WebSocket error:", wsErr.message);
        this.wsConnected = false;
        this.wsInstance = null;
        this.scheduleReconnect();
      });
    } catch (connErr) {
      console.error("[AISstream] Failed to establish WebSocket connection:", connErr);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.isLive) this.connect();
    }, 15000);
  }

  private processMessage(msg: any): void {
    const msgType = msg.MessageType;
    if (!MESSAGE_TYPES.includes(msgType)) return;

    const meta = msg.MetaData ?? {};
    const pos = msg.Message?.[msgType] ?? {};

    const mmsi = String(meta.MMSI ?? pos.UserID ?? "");
    if (!mmsi) return;

    const lat = meta.latitude ?? pos.Latitude ?? null;
    const lon = meta.longitude ?? pos.Longitude ?? null;
    if (lat == null || lon == null) return;

    const shipType = pos.Type ?? pos.ShipType ?? 0;
    const navStat = pos.NavigationalStatus ?? 15;

    const vessel: AisStreamVessel = {
      mmsi,
      name: (meta.ShipName ?? pos.Name ?? `VESSEL-${mmsi}`).trim(),
      lat: +lat,
      lon: +lon,
      speed: +(pos.Sog ?? pos.SpeedOverGround ?? 0).toFixed(1),
      course: Math.round(pos.Cog ?? pos.CourseOverGround ?? 0),
      heading: pos.TrueHeading && pos.TrueHeading < 360 ? Math.round(pos.TrueHeading) : Math.round(pos.Cog ?? 0),
      shipType,
      shipTypeName: SHIP_TYPE_MAP[shipType] ?? SHIP_TYPE_MAP[Math.floor(shipType / 10) * 10] ?? "Unknown",
      navStatus: navStat,
      navStatusName: NAV_STATUS_MAP[navStat] ?? "Unknown",
      destination: (pos.Destination ?? "In Transit").trim(),
      timestamp: meta.time_utc ? new Date(meta.time_utc).toISOString() : new Date().toISOString(),
      source: "aisstream",
    };

    this.vesselCache.set(mmsi, vessel);

    if (this.vesselCache.size > 2000) {
      const oldest = [...this.vesselCache.entries()]
        .sort((a, b) => a[1].timestamp.localeCompare(b[1].timestamp))
        .slice(0, 500);
      for (const [key] of oldest) this.vesselCache.delete(key);
    }
  }

  getVessels(limit = 100): AisStreamVessel[] {
    if (!this.isLive) return [];
    return [...this.vesselCache.values()]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  getVesselByMmsi(mmsi: string): AisStreamVessel | null {
    return this.vesselCache.get(mmsi) ?? null;
  }

  isConnected(): boolean {
    return this.wsConnected;
  }

  getStats(): { connected: boolean; cachedVessels: number; lastMessageAt: string | null } {
    return {
      connected: this.wsConnected,
      cachedVessels: this.vesselCache.size,
      lastMessageAt: this.lastMessageAt ? new Date(this.lastMessageAt).toISOString() : null,
    };
  }
}
