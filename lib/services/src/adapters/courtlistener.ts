import { ServiceAdapter } from "../base.js";

export interface CourtListenerCase {
  id: number;
  absoluteUrl: string;
  caseName: string;
  dateFiled: string | null;
  dateTerminated: string | null;
  court: string;
  courtFullName: string;
  docketNumber: string;
  natureOfSuit: string | null;
  cause: string | null;
  status: string;
  pacer: boolean;
}

export interface CourtListenerOpinion {
  id: number;
  absoluteUrl: string;
  caseName: string;
  dateFiled: string;
  court: string;
  type: string;
  precedentialStatus: string;
  citation: string;
  plainText: string;
}

export interface CourtListenerParty {
  id: number;
  name: string;
  role: string;
  attorneys: string[];
}

const MOCK_CASES: CourtListenerCase[] = [
  {
    id: 67284901, absoluteUrl: "/docket/67284901/harmon-capital-v-meridian-properties/",
    caseName: "Harmon Capital LLC v. Meridian Properties Inc.",
    dateFiled: "2026-01-14", dateTerminated: null,
    court: "nysd", courtFullName: "Southern District of New York",
    docketNumber: "1:26-cv-04821", natureOfSuit: "190 Contract: Other",
    cause: "28:1332 Diversity-Contract Dispute", status: "Open", pacer: true,
  },
  {
    id: 58921034, absoluteUrl: "/docket/58921034/sec-v-nexgen-advisors/",
    caseName: "Securities and Exchange Commission v. NexGen Advisors LLC",
    dateFiled: "2025-08-07", dateTerminated: null,
    court: "nysd", courtFullName: "Southern District of New York",
    docketNumber: "1:25-cv-18340", natureOfSuit: "850 Securities/Commodities/Exchanges",
    cause: "15:78j Securities Exchange Act", status: "Open", pacer: true,
  },
];

const MOCK_OPINIONS: CourtListenerOpinion[] = [
  {
    id: 4928001, absoluteUrl: "/opinion/4928001/in-re-meridian-properties/",
    caseName: "In re Meridian Properties Foreclosure Proceedings",
    dateFiled: "2025-11-03", court: "ny2",
    type: "010combined", precedentialStatus: "Published",
    citation: "2025 U.S. App. LEXIS 28841",
    plainText: "The district court's grant of summary judgment for the plaintiff is AFFIRMED...",
  },
];

export class CourtListenerAdapter extends ServiceAdapter {
  readonly name = "courtlistener";
  readonly description =
    "CourtListener — free federal court opinions, docket tracking, PACER integration, and legal citation search. API token optional for higher rate limits. Falls back to demo mode when COURT_LISTENER_TOKEN is absent.";
  readonly requiredEnvVars = ["COURT_LISTENER_TOKEN"];

  private get token(): string | undefined { return process.env["COURT_LISTENER_TOKEN"]; }

  get supportsMockMode(): boolean { return true; }

  private readonly BASE_URL = "https://www.courtlistener.com/api/rest/v3";

  private async clRequest<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.BASE_URL}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.token) headers["Authorization"] = `Token ${this.token}`;
    const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`CourtListener API error: HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  protected async performHealthCheck(): Promise<void> {
    await this.clRequest("/dockets/", { limit: "1" });
  }

  async searchCases(query: string, court?: string, dateAfter?: string): Promise<CourtListenerCase[]> {
    if (this.isDemoMode) return MOCK_CASES;
    const params: Record<string, string> = { q: query, order_by: "score desc", limit: "20" };
    if (court) params["court"] = court;
    if (dateAfter) params["date_filed__gte"] = dateAfter;
    const data = await this.clRequest<{ results: Array<Record<string, unknown>> }>("/dockets/", params);
    return (data.results ?? []).map(c => ({
      id: Number(c["id"] ?? 0), absoluteUrl: String(c["absolute_url"] ?? ""),
      caseName: String(c["case_name"] ?? ""), dateFiled: c["date_filed"] ? String(c["date_filed"]) : null,
      dateTerminated: c["date_terminated"] ? String(c["date_terminated"]) : null,
      court: String((c["court"] as Record<string, unknown>)?.["id"] ?? ""),
      courtFullName: String(c["court_full_name"] ?? ""),
      docketNumber: String(c["docket_number"] ?? ""),
      natureOfSuit: c["nature_of_suit"] ? String(c["nature_of_suit"]) : null,
      cause: c["cause"] ? String(c["cause"]) : null,
      status: String(c["status"] ?? ""), pacer: Boolean(c["pacer_case_id"]),
    }));
  }

  async searchOpinions(query: string, court?: string, limit = 10): Promise<CourtListenerOpinion[]> {
    if (this.isDemoMode) return MOCK_OPINIONS;
    const params: Record<string, string> = { q: query, type: "o", order_by: "score desc", limit: String(limit) };
    if (court) params["court"] = court;
    const data = await this.clRequest<{ results: Array<Record<string, unknown>> }>("/search/", params);
    return (data.results ?? []).map(o => ({
      id: Number(o["id"] ?? 0), absoluteUrl: String(o["absolute_url"] ?? ""),
      caseName: String(o["caseName"] ?? ""), dateFiled: String(o["dateFiled"] ?? ""),
      court: String(o["court_id"] ?? ""), type: String(o["type"] ?? ""),
      precedentialStatus: String(o["status"] ?? ""),
      citation: Array.isArray(o["citation"]) ? (o["citation"] as string[]).join(", ") : String(o["citation"] ?? ""),
      plainText: String(o["snippet"] ?? ""),
    }));
  }

  async getCitators(citationString: string): Promise<{ citing: number; negative: number; positive: number }> {
    if (this.isDemoMode) return { citing: 47, negative: 3, positive: 12 };
    const data = await this.clRequest<{ count: number }>("/search/", { q: `"${citationString}"`, type: "o", limit: "1" });
    return { citing: data.count ?? 0, negative: 0, positive: 0 };
  }

  getMockCases(): CourtListenerCase[] { return MOCK_CASES; }
}
