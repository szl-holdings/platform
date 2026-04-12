import { ServiceAdapter } from "../base.js";

export interface NoaaAlert {
  id: string;
  headline: string;
  description: string;
  instruction: string | null;
  event: string;
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
  certainty: string;
  urgency: string;
  status: string;
  messageType: string;
  category: string;
  areaDesc: string;
  sent: string;
  effective: string;
  expires: string | null;
  ends: string | null;
  senderName: string;
  affectedZones: string[];
  geocode: { SAME?: string[]; UGC?: string[] };
}

export type NoaaAlertDomain = "all" | "marine" | "coastal" | "land";

interface NoaaRawProps {
  id?: string;
  headline?: string;
  description?: string;
  instruction?: string;
  event?: string;
  severity?: string;
  certainty?: string;
  urgency?: string;
  status?: string;
  messageType?: string;
  category?: string;
  areaDesc?: string;
  sent?: string;
  effective?: string;
  expires?: string;
  ends?: string;
  senderName?: string;
  affectedZones?: string[];
  geocode?: { SAME?: string[]; UGC?: string[] };
}

interface NoaaRawFeature {
  id?: string;
  properties?: NoaaRawProps;
}

export class NoaaAlertsAdapter extends ServiceAdapter {
  readonly name = "noaa-alerts";
  readonly description = "NOAA Weather Alerts API — all hazard types, severe weather, marine, coastal. Free, no key.";
  readonly requiredEnvVars = [];

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch("https://api.weather.gov/alerts/active?limit=1", {
      headers: { "User-Agent": "SZL-Platform/1.0 contact@szlholdings.com", Accept: "application/geo+json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`NOAA Alerts returned ${res.status}`);
  }

  private parseAlert(f: NoaaRawFeature): NoaaAlert {
    const props = f.properties ?? {};
    return {
      id: f.id ?? props.id ?? "",
      headline: props.headline ?? props.event ?? "",
      description: (props.description ?? "").slice(0, 600),
      instruction: props.instruction ? props.instruction.slice(0, 400) : null,
      event: props.event ?? "",
      severity: (props.severity as NoaaAlert["severity"]) ?? "Unknown",
      certainty: props.certainty ?? "Unknown",
      urgency: props.urgency ?? "Unknown",
      status: props.status ?? "Actual",
      messageType: props.messageType ?? "Alert",
      category: props.category ?? "Met",
      areaDesc: props.areaDesc ?? "",
      sent: props.sent ?? "",
      effective: props.effective ?? "",
      expires: props.expires ?? null,
      ends: props.ends ?? null,
      senderName: props.senderName ?? "NWS",
      affectedZones: Array.isArray(props.affectedZones)
        ? props.affectedZones.map((z) => z.split("/").pop() ?? z)
        : [],
      geocode: (props.geocode as { SAME?: string[]; UGC?: string[] }) ?? {},
    };
  }

  async getActiveAlerts(params: {
    domain?: NoaaAlertDomain;
    area?: string;
    severity?: string;
    event?: string;
    limit?: number;
  } = {}): Promise<NoaaAlert[]> {
    const qp = new URLSearchParams({ limit: String(Math.min(params.limit ?? 50, 500)) });
    if (params.area) qp.set("area", params.area);
    if (params.severity) qp.set("severity", params.severity);
    if (params.event) qp.set("event", params.event);

    if (params.domain === "marine") {
      qp.set("urgency", "Immediate,Expected");
      qp.set("event", params.event ?? "Marine Weather Statement,Special Marine Warning,Gale Warning,Hurricane Force Wind Warning,Storm Warning,Tsunami Warning");
    }

    const res = await fetch(`https://api.weather.gov/alerts/active?${qp}`, {
      headers: { "User-Agent": "SZL-Platform/1.0 contact@szlholdings.com", Accept: "application/geo+json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`NOAA Alerts HTTP ${res.status}`);
    const data = await res.json() as { features?: NoaaRawFeature[] };
    const features = data?.features ?? [];
    return features.map((f) => this.parseAlert(f));
  }

  async getAlertsByState(state: string): Promise<NoaaAlert[]> {
    const res = await fetch(`https://api.weather.gov/alerts/active/area/${state}`, {
      headers: { "User-Agent": "SZL-Platform/1.0 contact@szlholdings.com", Accept: "application/geo+json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`NOAA Alerts state HTTP ${res.status}`);
    const data = await res.json() as { features?: NoaaRawFeature[] };
    const features = data?.features ?? [];
    return features.map((f) => this.parseAlert(f));
  }

  async getSevereAlerts(severities: string[] = ["Extreme", "Severe"]): Promise<NoaaAlert[]> {
    const allAlerts = await this.getActiveAlerts({ limit: 100 });
    return allAlerts.filter(a => severities.includes(a.severity));
  }

  categorizeForDomain(alerts: NoaaAlert[]): {
    marine: NoaaAlert[];
    property: NoaaAlert[];
    infrastructure: NoaaAlert[];
    all: NoaaAlert[];
  } {
    const marineKeywords = /marine|coastal|tsunami|rip current|beach hazard|wind wave|storm surge|hurricane|tropical/i;
    const propertyKeywords = /tornado|flood|flash flood|severe thunderstorm|ice storm|blizzard|winter storm|wildfire|red flag/i;
    const infraKeywords = /extreme heat|extreme cold|wind advisory|high wind|ice|freezing/i;

    return {
      all: alerts,
      marine: alerts.filter(a => marineKeywords.test(a.event + " " + a.headline)),
      property: alerts.filter(a => propertyKeywords.test(a.event + " " + a.headline)),
      infrastructure: alerts.filter(a => infraKeywords.test(a.event + " " + a.headline)),
    };
  }
}
