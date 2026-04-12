import { ServiceAdapter } from "../base.js";

export interface OpenSkyAircraft {
  icao24: string;
  callsign: string;
  originCountry: string;
  lat: number | null;
  lon: number | null;
  baroAltitude: number | null;
  geoAltitude: number | null;
  velocity: number | null;
  trueTrack: number | null;
  verticalRate: number | null;
  onGround: boolean;
  squawk: string | null;
  positionSource: string;
  timestamp: string;
}

const POSITION_SOURCE_MAP: Record<number, string> = {
  0: "ADS-B",
  1: "ASTERIX",
  2: "MLAT",
  3: "FLARM",
};

export class OpenSkyAdapter extends ServiceAdapter {
  readonly name = "opensky";
  readonly description = "OpenSky Network aircraft/drone tracking — free anonymous REST API, no key required";
  readonly requiredEnvVars = [];

  private get headers(): Record<string, string> {
    const user = process.env["OPENSKY_USERNAME"];
    const pass = process.env["OPENSKY_PASSWORD"];
    const base: Record<string, string> = { "User-Agent": "SZL-Aegis/1.0", Accept: "application/json" };
    if (user && pass) {
      base["Authorization"] = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
    }
    return base;
  }

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch("https://opensky-network.org/api/states/all?lamin=51&lomin=-0.5&lamax=52&lomax=0.5", {
      headers: this.headers,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok && res.status !== 429) throw new Error(`OpenSky returned ${res.status}`);
  }

  async getStates(params?: {
    lamin?: number; lomin?: number; lamax?: number; lomax?: number; icao24?: string;
  }): Promise<{ aircraft: OpenSkyAircraft[]; time: string; source: string }> {
    const qp = new URLSearchParams();
    if (params?.lamin != null) qp.set("lamin", String(params.lamin));
    if (params?.lomin != null) qp.set("lomin", String(params.lomin));
    if (params?.lamax != null) qp.set("lamax", String(params.lamax));
    if (params?.lomax != null) qp.set("lomax", String(params.lomax));
    if (params?.icao24) qp.set("icao24", params.icao24);

    const qs = qp.toString() ? `?${qp}` : "";
    const res = await fetch(`https://opensky-network.org/api/states/all${qs}`, {
      headers: this.headers,
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429) throw new Error("OpenSky rate limit exceeded — anonymous access limited to 400 requests/day");
    if (!res.ok) throw new Error(`OpenSky HTTP ${res.status}`);
    const data = await res.json() as { time?: number; states?: unknown[][] };

    const states = data?.states ?? [];
    const time = data?.time ? new Date(data.time * 1000).toISOString() : new Date().toISOString();

    const aircraft: OpenSkyAircraft[] = states.map((s) => ({
      icao24: String(s[0] ?? ""),
      callsign: String(s[1] ?? "").trim(),
      originCountry: String(s[2] ?? ""),
      lat: (s[6] as number | null) ?? null,
      lon: (s[5] as number | null) ?? null,
      baroAltitude: (s[7] as number | null) ?? null,
      geoAltitude: (s[13] as number | null) ?? null,
      velocity: (s[9] as number | null) ?? null,
      trueTrack: (s[10] as number | null) ?? null,
      verticalRate: (s[11] as number | null) ?? null,
      onGround: (s[8] as boolean) ?? false,
      squawk: s[14] ? String(s[14]) : null,
      positionSource: POSITION_SOURCE_MAP[s[16] as number ?? 0] ?? "ADS-B",
      timestamp: time,
    }));

    return { aircraft, time, source: "live-opensky" };
  }

  async getAircraftNearCoords(lat: number, lon: number, radiusDeg = 2): Promise<OpenSkyAircraft[]> {
    const { aircraft } = await this.getStates({
      lamin: lat - radiusDeg,
      lomin: lon - radiusDeg,
      lamax: lat + radiusDeg,
      lomax: lon + radiusDeg,
    });
    return aircraft;
  }
}
