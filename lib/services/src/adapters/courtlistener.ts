import { ServiceAdapter } from "../base.js";

export interface CourtListenerDocket {
  id: string;
  caseNumber: string;
  caseName: string;
  court: string;
  dateFiled: string | null;
  dateTerminated: string | null;
  status: string;
  url: string;
}

export interface CourtListenerOpinion {
  id: string;
  type: string;
  author: string;
  dateFiled: string | null;
  caseName: string;
  court: string;
  snippet: string;
  url: string;
}

interface RawDocket {
  id?: string | number;
  docket_number?: string;
  case_name?: string;
  case_name_short?: string;
  court_id?: string;
  court?: string;
  date_filed?: string;
  date_terminated?: string;
  pacer_case_id?: string;
  absolute_url?: string;
}

interface RawOpinion {
  id?: string | number;
  type?: string;
  author_str?: string;
  date_created?: string;
  snippet?: string;
  plain_text?: string;
  absolute_url?: string;
  cluster?: { case_name?: string; court_id?: string };
}

export class CourtListenerAdapter extends ServiceAdapter {
  readonly name = "courtlistener";
  readonly description = "CourtListener REST API v4 — free federal/state court opinions, dockets, RECAP archive";
  readonly requiredEnvVars: string[] = [];

  get authenticatedAccess(): boolean {
    const token = process.env["COURTLISTENER_API_TOKEN"];
    return typeof token === "string" && token.length > 0;
  }

  private get headers(): Record<string, string> {
    const token = process.env["COURTLISTENER_API_TOKEN"];
    const base: Record<string, string> = {
      "User-Agent": "SZL-PRISM/1.0",
      Accept: "application/json",
    };
    if (token) base["Authorization"] = `Token ${token}`;
    return base;
  }

  protected async performHealthCheck(): Promise<void> {
    const res = await fetch("https://www.courtlistener.com/api/rest/v4/dockets/?format=json&page_size=1", {
      headers: this.headers,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`CourtListener returned ${res.status}`);
  }

  async searchDockets(query: string, court?: string, pageSize = 10): Promise<CourtListenerDocket[]> {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      page_size: String(pageSize),
      order_by: "-date_filed",
    });
    if (court) params.set("court", court);

    const res = await fetch(`https://www.courtlistener.com/api/rest/v4/dockets/?${params}`, {
      headers: this.headers,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`CourtListener dockets HTTP ${res.status}`);
    const data = await res.json() as { results?: RawDocket[] };
    const results = data?.results ?? [];
    return results.map((d) => ({
      id: String(d.id ?? ""),
      caseNumber: d.docket_number ?? "",
      caseName: d.case_name ?? d.case_name_short ?? "Unknown Case",
      court: d.court_id ?? d.court ?? "Unknown",
      dateFiled: d.date_filed ?? null,
      dateTerminated: d.date_terminated ?? null,
      status: d.pacer_case_id ? "PACER" : "CourtListener",
      url: d.absolute_url ? `https://www.courtlistener.com${d.absolute_url}` : `https://www.courtlistener.com/docket/${d.id}/`,
    }));
  }

  async searchOpinions(query: string, court?: string, pageSize = 10): Promise<CourtListenerOpinion[]> {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      page_size: String(pageSize),
      order_by: "-score",
      highlight: "true",
    });
    if (court) params.set("court", court);

    const res = await fetch(`https://www.courtlistener.com/api/rest/v4/opinions/?${params}`, {
      headers: this.headers,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`CourtListener opinions HTTP ${res.status}`);
    const data = await res.json() as { results?: RawOpinion[] };
    const results = data?.results ?? [];
    return results.map((o) => ({
      id: String(o.id ?? ""),
      type: o.type ?? "opinion",
      author: o.author_str ?? "Unknown",
      dateFiled: o.date_created?.slice(0, 10) ?? null,
      caseName: o.cluster?.case_name ?? "Unknown Case",
      court: o.cluster?.court_id ?? "Unknown",
      snippet: o.snippet ?? o.plain_text?.slice(0, 300) ?? "",
      url: o.absolute_url ? `https://www.courtlistener.com${o.absolute_url}` : `https://www.courtlistener.com/opinion/${o.id}/`,
    }));
  }

  async getRecapDocket(docketId: string): Promise<CourtListenerDocket | null> {
    const res = await fetch(`https://www.courtlistener.com/api/rest/v4/dockets/${docketId}/?format=json`, {
      headers: this.headers,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const d = await res.json() as RawDocket;
    return {
      id: String(d.id ?? ""),
      caseNumber: d.docket_number ?? "",
      caseName: d.case_name ?? "Unknown Case",
      court: d.court_id ?? "Unknown",
      dateFiled: d.date_filed ?? null,
      dateTerminated: d.date_terminated ?? null,
      status: d.pacer_case_id ? "PACER" : "CourtListener",
      url: d.absolute_url ? `https://www.courtlistener.com${d.absolute_url}` : `https://www.courtlistener.com/docket/${d.id}/`,
    };
  }
}
