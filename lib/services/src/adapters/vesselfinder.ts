import { ServiceAdapter } from "../base.js";

export interface VesselFinderPosition {
  mmsi: string;
  imo: string;
  name: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  heading: number;
  status: number;
  statusText: string;
  flag: string;
  shipType: string;
  typeText: string;
  destination: string;
  eta: string;
  received: string;
}

export interface VesselFinderRoutePoint {
  lat: number;
  lon: number;
  timestamp: string;
  speed: number;
  course: number;
}

const STATUS_TEXTS: Record<number, string> = {
  0: "Under Way Using Engine", 1: "At Anchor", 2: "Not Under Command",
  3: "Restricted Manoeuvrability", 5: "Moored", 8: "Under Way Sailing",
};

const MOCK_POSITIONS: VesselFinderPosition[] = [
  { mmsi: "219024478", imo: "9344281", name: "EMMA MAERSK", lat: 55.680, lon: 12.537, speed: 0, course: 0, heading: 511, status: 5, statusText: "Moored", flag: "DK", shipType: 79, typeText: "Container Ship", destination: "DEHAM", eta: "2026-04-20T06:00:00Z", received: new Date().toISOString() },
  { mmsi: "477049900", imo: "9629946", name: "CSCL GLOBE", lat: 22.270, lon: 114.167, speed: 11.4, course: 223, heading: 218, status: 0, statusText: "Under Way Using Engine", flag: "HK", shipType: 71, typeText: "Container Ship", destination: "SGSIN", eta: "2026-04-17T22:00:00Z", received: new Date().toISOString() },
  { mmsi: "371427000", imo: "9321483", name: "CRUDE MARINER", lat: 26.083, lon: 56.350, speed: 0, course: 0, heading: 285, status: 1, statusText: "At Anchor", flag: "PA", shipType: 80, typeText: "Tanker", destination: "AEAUH", eta: "2026-04-15T00:00:00Z", received: new Date().toISOString() },
] as unknown as VesselFinderPosition[];

export class VesselFinderAdapter extends ServiceAdapter {
  readonly name = "vesselfinder";
  readonly description =
    "VesselFinder API — global vessel tracking, AIS position data, voyage history, and fleet monitoring. Requires API key. Falls back to demo mode when VESSEL_FINDER_API_KEY is absent.";
  readonly requiredEnvVars = ["VESSEL_FINDER_API_KEY"];

  private get apiKey(): string | undefined {
    return process.env.VESSEL_FINDER_API_KEY;
  }

  private readonly BASE_URL = "https://api.vesselfinder.com";

  private async vfRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.BASE_URL}${path}`);
    url.searchParams.set("userkey", this.apiKey!);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`VesselFinder API error: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  protected override async performHealthCheck(): Promise<void> {
    await this.vfRequest("/vessels", { mmsi: "219024478" });
  }

  async getVesselPosition(mmsi: string): Promise<VesselFinderPosition | null> {
    if (this.isDemoMode) return MOCK_POSITIONS.find(v => v.mmsi === mmsi) ?? MOCK_POSITIONS[0] ?? null;
    const data = await this.vfRequest<{ data: Array<{ AIS: Record<string, unknown> }> }>("/vessels", { mmsi });
    const ais = data.data?.[0]?.AIS;
    if (!ais) return null;
    const statusNum = Number(ais.NAVSTAT ?? 0);
    return {
      mmsi: String(ais.MMSI ?? ""), imo: String(ais.IMO ?? ""),
      name: String(ais.NAME ?? ""), lat: Number(ais.LATITUDE ?? 0),
      lon: Number(ais.LONGITUDE ?? 0), speed: Number(ais.SPEED ?? 0),
      course: Number(ais.COURSE ?? 0), heading: Number(ais.HEADING ?? 511),
      status: statusNum, statusText: STATUS_TEXTS[statusNum] ?? "Unknown",
      flag: String(ais.FLAG ?? ""), shipType: String(ais.TYPE ?? ""),
      typeText: String(ais.TYPENAME ?? ""), destination: String(ais.DESTINATION ?? ""),
      eta: String(ais.ETA ?? ""), received: String(ais.TIMESTAMP ?? ""),
    };
  }

  async getFleetPositions(mmsiList: string[]): Promise<VesselFinderPosition[]> {
    if (this.isDemoMode) return MOCK_POSITIONS;
    const results = await Promise.allSettled(mmsiList.map(m => this.getVesselPosition(m)));
    return results.filter(r => r.status === "fulfilled" && r.value).map(r => (r as PromiseFulfilledResult<VesselFinderPosition>).value);
  }

  async getVesselRoute(mmsi: string, hours = 24): Promise<VesselFinderRoutePoint[]> {
    if (this.isDemoMode) {
      return Array.from({ length: Math.min(hours, 24) }, (_, i) => ({
        lat: 1.264 + i * 0.05, lon: 103.823 + i * 0.03,
        timestamp: new Date(Date.now() - (hours - i) * 3600000).toISOString(),
        speed: 12 + Math.random() * 4, course: 45 + i * 2,
      }));
    }
    const data = await this.vfRequest<{ data: Array<Record<string, unknown>> }>("/vessels-pos-history", {
      mmsi, interval: "1h", hours: String(hours),
    });
    return (data.data ?? []).map(p => ({
      lat: Number(p.LATITUDE ?? 0), lon: Number(p.LONGITUDE ?? 0),
      timestamp: String(p.TIMESTAMP ?? ""), speed: Number(p.SPEED ?? 0),
      course: Number(p.COURSE ?? 0),
    }));
  }

  getMockPositions(): VesselFinderPosition[] {
    return MOCK_POSITIONS;
  }
}
