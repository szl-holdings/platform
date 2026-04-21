import { ServiceAdapter } from "../base.js";

export interface VesselPosition {
  vesselName: string;
  imo: string;
  mmsi: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: string;
  destination: string;
  eta: string;
  lastUpdated: string;
}

export interface PortInfo {
  name: string;
  country: string;
  unlocode: string;
  latitude: number;
  longitude: number;
}

const MOCK_VESSELS: VesselPosition[] = [
  {
    vesselName: "SZL PIONEER",
    imo: "9876543",
    mmsi: "123456789",
    latitude: 37.7749,
    longitude: -122.4194,
    speed: 12.5,
    heading: 270,
    status: "Under way using engine",
    destination: "TOKYO",
    eta: "2026-04-15T08:00:00Z",
    lastUpdated: new Date().toISOString(),
  },
  {
    vesselName: "SZL VOYAGER",
    imo: "9876544",
    mmsi: "123456790",
    latitude: 1.3521,
    longitude: 103.8198,
    speed: 0,
    heading: 45,
    status: "At anchor",
    destination: "SINGAPORE",
    eta: "2026-03-25T12:00:00Z",
    lastUpdated: new Date().toISOString(),
  },
  {
    vesselName: "SZL EXPLORER",
    imo: "9876545",
    mmsi: "123456791",
    latitude: 51.5074,
    longitude: -0.1278,
    speed: 8.2,
    heading: 180,
    status: "Under way using engine",
    destination: "ROTTERDAM",
    eta: "2026-03-28T06:00:00Z",
    lastUpdated: new Date().toISOString(),
  },
];

const MOCK_PORTS: PortInfo[] = [
  { name: "Port of Singapore", country: "Singapore", unlocode: "SGSIN", latitude: 1.2644, longitude: 103.8222 },
  { name: "Port of Rotterdam", country: "Netherlands", unlocode: "NLRTM", latitude: 51.9496, longitude: 4.1453 },
  { name: "Port of Shanghai", country: "China", unlocode: "CNSHA", latitude: 31.3602, longitude: 121.5887 },
];

export class ShippingAdapter extends ServiceAdapter {
  readonly name = "shipping";
  readonly description = "Maritime vessel tracking and port information";
  readonly requiredEnvVars = ["MARINE_TRAFFIC_API_KEY"];

  protected override async performHealthCheck(): Promise<void> {
    const apiKey = process.env["MARINE_TRAFFIC_API_KEY"];
    const response = await fetch(
      `https://services.marinetraffic.com/api/exportvessel/v:5/${apiKey}/protocol:json`,
    );
    if (!response.ok) throw new Error(`MarineTraffic API returned ${response.status}`);
  }

  async trackVessel(identifier: string): Promise<VesselPosition | null> {
    if (!this.isLive) {
      const vessel = MOCK_VESSELS.find(
        (v) =>
          v.imo === identifier ||
          v.mmsi === identifier ||
          v.vesselName.toLowerCase().includes(identifier.toLowerCase()),
      );
      return vessel ? { ...vessel, lastUpdated: new Date().toISOString() } : null;
    }

    const apiKey = process.env["MARINE_TRAFFIC_API_KEY"]!;
    const response = await fetch(
      `https://services.marinetraffic.com/api/exportvessel/v:5/${apiKey}/imo:${identifier}/protocol:jsono`,
    );

    if (!response.ok) {
      throw new Error(`MarineTraffic API error: ${response.status}`);
    }

    const data = await response.json() as Array<Record<string, string>>;
    if (!data.length) return null;

    const v = data[0]!;
    return {
      vesselName: v["SHIPNAME"] ?? "",
      imo: v["IMO"] ?? "",
      mmsi: v["MMSI"] ?? "",
      latitude: parseFloat(v["LAT"] ?? "0"),
      longitude: parseFloat(v["LON"] ?? "0"),
      speed: parseFloat(v["SPEED"] ?? "0") / 10,
      heading: parseInt(v["HEADING"] ?? "0", 10),
      status: v["STATUS"] ?? "",
      destination: v["DESTINATION"] ?? "",
      eta: v["ETA"] ?? "",
      lastUpdated: v["TIMESTAMP"] ?? new Date().toISOString(),
    };
  }

  async listFleet(): Promise<VesselPosition[]> {
    if (!this.isLive) {
      return MOCK_VESSELS.map((v) => ({
        ...v,
        lastUpdated: new Date().toISOString(),
      }));
    }

    const apiKey = process.env["MARINE_TRAFFIC_API_KEY"]!;
    const response = await fetch(
      `https://services.marinetraffic.com/api/exportvessels/v:8/${apiKey}/protocol:jsono`,
    );

    if (!response.ok) {
      throw new Error(`MarineTraffic API error: ${response.status}`);
    }

    const data = await response.json() as Array<Record<string, string>>;
    return data.map((v) => ({
      vesselName: v["SHIPNAME"] ?? "",
      imo: v["IMO"] ?? "",
      mmsi: v["MMSI"] ?? "",
      latitude: parseFloat(v["LAT"] ?? "0"),
      longitude: parseFloat(v["LON"] ?? "0"),
      speed: parseFloat(v["SPEED"] ?? "0") / 10,
      heading: parseInt(v["HEADING"] ?? "0", 10),
      status: v["STATUS"] ?? "",
      destination: v["DESTINATION"] ?? "",
      eta: v["ETA"] ?? "",
      lastUpdated: v["TIMESTAMP"] ?? new Date().toISOString(),
    }));
  }

  async getPorts(): Promise<PortInfo[]> {
    if (!this.isLive) {
      return [...MOCK_PORTS];
    }
    return [...MOCK_PORTS];
  }
}
