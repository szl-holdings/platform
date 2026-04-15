import { ServiceAdapter } from "../base.js";

export interface MarineTrafficVessel {
  mmsi: string;
  imo: string;
  shipName: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  status: string;
  shipType: string;
  flag: string;
  destination: string;
  eta: string;
  lastPosition: string;
  draught: number;
  length: number;
  width: number;
}

export interface MarineTrafficVesselEvent {
  mmsi: string;
  shipName: string;
  eventType: string;
  eventDate: string;
  portName: string;
  portCode: string;
  flag: string;
}

export interface MarineTrafficPortCall {
  portId: string;
  portName: string;
  country: string;
  mmsi: string;
  shipName: string;
  arrivalDate: string;
  departureDate: string | null;
  status: "in_port" | "departed";
}

const MOCK_VESSELS: MarineTrafficVessel[] = [
  { mmsi: "235100643", imo: "9456789", shipName: "PACIFIC VOYAGER", latitude: 1.264, longitude: 103.823, speed: 0, course: 0, status: "0", shipType: "Container Ship", flag: "Panama", destination: "SGSIN", eta: "2026-04-15T08:00:00Z", lastPosition: new Date().toISOString(), draught: 12.4, length: 299, width: 48 },
  { mmsi: "566123456", imo: "9512034", shipName: "ARCTIC EXPLORER", latitude: 51.897, longitude: 4.452, speed: 14.2, course: 287, status: "0", shipType: "Bulk Carrier", flag: "Marshall Islands", destination: "NLRTM", eta: "2026-04-16T14:00:00Z", lastPosition: new Date().toISOString(), draught: 9.8, length: 225, width: 36 },
  { mmsi: "477912345", imo: "9678901", shipName: "HORIZON STAR", latitude: 22.302, longitude: 114.177, speed: 8.1, course: 145, status: "0", shipType: "Tanker", flag: "Hong Kong", destination: "JPYOK", eta: "2026-04-18T06:00:00Z", lastPosition: new Date().toISOString(), draught: 15.2, length: 333, width: 60 },
];

const MOCK_PORT_CALLS: MarineTrafficPortCall[] = [
  { portId: "1", portName: "Port of Singapore", country: "SG", mmsi: "235100643", shipName: "PACIFIC VOYAGER", arrivalDate: "2026-04-10T12:00:00Z", departureDate: null, status: "in_port" },
  { portId: "2", portName: "Port of Rotterdam", country: "NL", mmsi: "566123456", shipName: "ARCTIC EXPLORER", arrivalDate: "2026-04-08T09:00:00Z", departureDate: "2026-04-09T14:00:00Z", status: "departed" },
];

export class MarineTrafficAdapter extends ServiceAdapter {
  readonly name = "marinetraffic";
  readonly description =
    "MarineTraffic API — real-time AIS vessel tracking, port calls, vessel history, and voyage information. Requires API key. Falls back to demo mode when MARINE_TRAFFIC_API_KEY is absent.";
  readonly requiredEnvVars = ["MARINE_TRAFFIC_API_KEY"];

  private get apiKey(): string | undefined {
    return process.env["MARINE_TRAFFIC_API_KEY"];
  }

  private readonly BASE_URL = "https://services.marinetraffic.com/api";

  private async mtRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.BASE_URL}/${endpoint}/${this.apiKey}/`);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    url.searchParams.set("protocol", "json");
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`MarineTraffic API error: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  protected async performHealthCheck(): Promise<void> {
    await this.mtRequest("getvessel", { MMSI: "235100643" });
  }

  async getVesselPositions(mmsiList?: string[]): Promise<MarineTrafficVessel[]> {
    if (this.isDemoMode) return MOCK_VESSELS;
    const params: Record<string, string> = { timespan: "60" };
    if (mmsiList?.length) params["MMSI"] = mmsiList.join(",");
    const data = await this.mtRequest<{ DATA: Array<Record<string, string>> }>("getvessel", params);
    return (data.DATA ?? []).map(v => ({
      mmsi: v["MMSI"] ?? "",
      imo: v["IMO"] ?? "",
      shipName: v["SHIPNAME"] ?? "",
      latitude: parseFloat(v["LAT"] ?? "0"),
      longitude: parseFloat(v["LON"] ?? "0"),
      speed: parseFloat(v["SPEED"] ?? "0"),
      course: parseFloat(v["COURSE"] ?? "0"),
      status: v["STATUS"] ?? "",
      shipType: v["SHIPTYPE"] ?? "",
      flag: v["FLAG"] ?? "",
      destination: v["DESTINATION"] ?? "",
      eta: v["ETA"] ?? "",
      lastPosition: v["TIMESTAMP"] ?? "",
      draught: parseFloat(v["DRAUGHT"] ?? "0"),
      length: parseFloat(v["LENGTH"] ?? "0"),
      width: parseFloat(v["WIDTH"] ?? "0"),
    }));
  }

  async getVesselEvents(mmsi: string, eventType?: string): Promise<MarineTrafficVesselEvent[]> {
    if (this.isDemoMode) {
      return MOCK_VESSELS.map(v => ({
        mmsi: v.mmsi, shipName: v.shipName, eventType: eventType ?? "arrival",
        eventDate: v.lastPosition, portName: "Demo Port", portCode: "DEMO", flag: v.flag,
      }));
    }
    const params: Record<string, string> = { MMSI: mmsi };
    if (eventType) params["EVENT_TYPE"] = eventType;
    const data = await this.mtRequest<{ DATA: Array<Record<string, string>> }>("getevents", params);
    return (data.DATA ?? []).map(e => ({
      mmsi: e["MMSI"] ?? "", shipName: e["SHIPNAME"] ?? "", eventType: e["TYPEFLAG"] ?? "",
      eventDate: e["TIMESTAMP"] ?? "", portName: e["PORT_NAME"] ?? "",
      portCode: e["UN_LOCODE"] ?? "", flag: e["FLAG"] ?? "",
    }));
  }

  async getPortCalls(portCode: string): Promise<MarineTrafficPortCall[]> {
    if (this.isDemoMode) return MOCK_PORT_CALLS;
    const data = await this.mtRequest<{ DATA: Array<Record<string, string>> }>("getportcalls", { port_target_id: portCode });
    return (data.DATA ?? []).map(p => ({
      portId: p["port_target_id"] ?? "", portName: p["PORT_NAME"] ?? "",
      country: p["COUNTRY"] ?? "", mmsi: p["MMSI"] ?? "", shipName: p["SHIPNAME"] ?? "",
      arrivalDate: p["ARRIVAL_DATE"] ?? "", departureDate: p["DEPARTURE_DATE"] ?? null,
      status: p["DEPARTURE_DATE"] ? "departed" : "in_port",
    }));
  }
}
