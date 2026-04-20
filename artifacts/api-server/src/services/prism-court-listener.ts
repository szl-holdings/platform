import { LRUCache } from 'lru-cache';
import { logger } from '../lib/logger';

const COURT_LISTENER_BASE = 'https://www.courtlistener.com/api/rest/v4';
const REQUEST_CACHE = new LRUCache<string, { data: unknown; ts: number }>({ max: 500 });
const CACHE_TTL_MS = 5 * 60 * 1000;

function getApiKey(): string | undefined {
  return process.env.COURT_LISTENER_API_KEY;
}

function cacheKey(endpoint: string, params: Record<string, string>): string {
  return `${endpoint}?${new URLSearchParams(params).toString()}`;
}

async function courtListenerFetch(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<Record<string, unknown>> {
  const key = cacheKey(endpoint, params);
  const cached = REQUEST_CACHE.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data as Record<string, unknown>;
  }

  const apiKey = getApiKey();
  const url = new URL(`${COURT_LISTENER_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKey) headers['Authorization'] = `Token ${apiKey}`;

  const res = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    throw new Error(`CourtListener API ${endpoint} → ${res.status}: ${res.statusText}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  REQUEST_CACHE.set(key, { data, ts: Date.now() });
  return data;
}

export interface CourtListenerDocket {
  id: number;
  docket_number: string;
  case_name: string;
  court: string;
  court_id: string;
  date_filed: string | null;
  date_terminated: string | null;
  cause: string | null;
  nature_of_suit: string | null;
  jury_demand: string | null;
  jurisdiction_type: string | null;
  assigned_to_str: string | null;
  referred_to_str: string | null;
  absolute_url: string;
}

export interface CourtListenerOpinion {
  id: number;
  absolute_url: string;
  cluster_id: number;
  case_name: string;
  court: string;
  date_filed: string;
  judges: string | null;
  precedential_status: string | null;
  citation_count: number;
  summary: string | null;
}

export interface CourtListenerJudge {
  id: number;
  name_full: string;
  name_last: string;
  name_first: string;
  court: string;
  court_exact: string | null;
  date_start: string | null;
  date_termination: string | null;
  position_type: string | null;
  appointing_president: string | null;
  political_affiliation: string | null;
  is_alias_of: string | null;
  absolute_url: string;
}

export interface DocketEntry {
  id: number;
  date_filed: string;
  entry_number: number | null;
  description: string;
  recap_documents: { id: number; description: string; is_available: boolean }[];
}

type CLRaw = Record<string, unknown>;
function asArr(v: unknown): CLRaw[] {
  return Array.isArray(v) ? (v as CLRaw[]) : [];
}
function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}
function strN(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback;
}

class CourtListenerService {
  async searchDockets(
    query: string,
    court?: string,
    limit = 20,
  ): Promise<{
    count: number;
    results: CourtListenerDocket[];
    source: 'live' | 'error';
  }> {
    try {
      const params: Record<string, string> = {
        q: query,
        type: 'r',
        order_by: 'score desc',
        page_size: String(Math.min(limit, 20)),
      };
      if (court) params.court = court;

      const data = await courtListenerFetch('/search/', params);
      return {
        count: num(data.count),
        results: asArr(data.results).map(
          (r): CourtListenerDocket => ({
            id: num(r.docket_id) || num(r.id),
            docket_number: str(r.docketNumber) || str(r.docket_number) || 'N/A',
            case_name: str(r.caseName) || str(r.case_name) || 'Unknown',
            court: str(r.court),
            court_id: str(r.court_id) || str(r.court),
            date_filed: strN(r.dateFiled) ?? strN(r.date_filed),
            date_terminated: strN(r.dateTerminated) ?? strN(r.date_terminated),
            cause: strN(r.cause),
            nature_of_suit: strN(r.suitNature) ?? strN(r.nature_of_suit),
            jury_demand: strN(r.juryDemand) ?? strN(r.jury_demand),
            jurisdiction_type: strN(r.jurisdictionType) ?? strN(r.jurisdiction_type),
            assigned_to_str: strN(r.assignedTo) ?? strN(r.assigned_to_str),
            referred_to_str: strN(r.referredTo) ?? strN(r.referred_to_str),
            absolute_url: `https://www.courtlistener.com${str(r.absolute_url)}`,
          }),
        ),
        source: 'live',
      };
    } catch (err: unknown) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        'CourtListener docket search failed — returning empty',
      );
      return { count: 0, results: [], source: 'error' };
    }
  }

  async getDocket(docketId: number): Promise<{
    docket: CourtListenerDocket | null;
    entries: DocketEntry[];
    source: 'live' | 'error';
  }> {
    try {
      const docket = await courtListenerFetch(`/dockets/${docketId}/`);
      const entriesData = await courtListenerFetch('/docket-entries/', {
        docket: String(docketId),
        order_by: '-date_filed',
        page_size: '25',
      });

      return {
        docket: {
          id: num(docket.id),
          docket_number: str(docket.docket_number) || 'N/A',
          case_name: str(docket.case_name) || 'Unknown',
          court: str(docket.court),
          court_id: str(docket.court_id),
          date_filed: strN(docket.date_filed),
          date_terminated: strN(docket.date_terminated),
          cause: strN(docket.cause),
          nature_of_suit: strN(docket.nature_of_suit),
          jury_demand: strN(docket.jury_demand),
          jurisdiction_type: strN(docket.jurisdiction_type),
          assigned_to_str: strN(docket.assigned_to_str),
          referred_to_str: strN(docket.referred_to_str),
          absolute_url: `https://www.courtlistener.com${str(docket.absolute_url)}`,
        },
        entries: asArr(entriesData.results).map(
          (e): DocketEntry => ({
            id: num(e.id),
            date_filed: str(e.date_filed),
            entry_number: typeof e.entry_number === 'number' ? e.entry_number : null,
            description: str(e.description),
            recap_documents: asArr(e.recap_documents).map((d) => ({
              id: num(d.id),
              description: str(d.description),
              is_available: d.is_available === true,
            })),
          }),
        ),
        source: 'live',
      };
    } catch (err: unknown) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err), docketId },
        'CourtListener getDocket failed',
      );
      return { docket: null, entries: [], source: 'error' };
    }
  }

  async searchOpinions(
    query: string,
    court?: string,
    limit = 10,
  ): Promise<{
    count: number;
    results: CourtListenerOpinion[];
    source: 'live' | 'error';
  }> {
    try {
      const params: Record<string, string> = {
        q: query,
        type: 'o',
        order_by: 'score desc',
        page_size: String(Math.min(limit, 20)),
        stat_Precedential: 'on',
      };
      if (court) params.court = court;

      const data = await courtListenerFetch('/search/', params);
      return {
        count: num(data.count),
        results: asArr(data.results).map(
          (r): CourtListenerOpinion => ({
            id: num(r.id),
            absolute_url: `https://www.courtlistener.com${str(r.absolute_url)}`,
            cluster_id: num(r.cluster_id) || num(r.id),
            case_name: str(r.caseName) || str(r.case_name) || 'Unknown',
            court: str(r.court),
            date_filed: str(r.dateFiled) || str(r.date_filed),
            judges: strN(r.judge) ?? strN(r.judges),
            precedential_status: strN(r.status) ?? strN(r.precedential_status),
            citation_count: num(r.citeCount) || num(r.citation_count),
            summary: strN(r.suitNature),
          }),
        ),
        source: 'live',
      };
    } catch (err: unknown) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        'CourtListener opinion search failed',
      );
      return { count: 0, results: [], source: 'error' };
    }
  }

  async searchJudges(
    name: string,
    court?: string,
    limit = 10,
  ): Promise<{
    count: number;
    results: CourtListenerJudge[];
    source: 'live' | 'error';
  }> {
    try {
      const params: Record<string, string> = {
        q: name,
        type: 'p',
        order_by: 'score desc',
        page_size: String(Math.min(limit, 20)),
      };
      if (court) params.court = court;

      const data = await courtListenerFetch('/search/', params);
      return {
        count: num(data.count),
        results: asArr(data.results).map(
          (r): CourtListenerJudge => ({
            id: num(r.id),
            name_full: str(r.name_full) || `${str(r.first_name)} ${str(r.last_name)}`.trim(),
            name_last: str(r.last_name) || str(r.name_last),
            name_first: str(r.first_name) || str(r.name_first),
            court: str(r.court),
            court_exact: strN(r.court_exact),
            date_start: strN(r.date_start),
            date_termination: strN(r.date_termination),
            position_type: strN(r.position_type),
            appointing_president: strN(r.appointing_president),
            political_affiliation: strN(r.political_affiliation),
            is_alias_of: strN(r.is_alias_of),
            absolute_url: `https://www.courtlistener.com${str(r.absolute_url)}`,
          }),
        ),
        source: 'live',
      };
    } catch (err: unknown) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        'CourtListener judge search failed',
      );
      return { count: 0, results: [], source: 'error' };
    }
  }

  async getRecentFilings(
    court?: string,
    limit = 15,
  ): Promise<{
    results: CourtListenerDocket[];
    source: 'live' | 'error';
  }> {
    try {
      const params: Record<string, string> = {
        type: 'r',
        order_by: 'dateFiled desc',
        page_size: String(Math.min(limit, 20)),
        filed_after: new Date(Date.now() - 7 * 24 * 3600000).toISOString().split('T')[0],
      };
      if (court) params.court = court;

      const data = await courtListenerFetch('/search/', params);
      return {
        results: asArr(data.results).map(
          (r): CourtListenerDocket => ({
            id: num(r.docket_id) || num(r.id),
            docket_number: str(r.docketNumber) || str(r.docket_number) || 'N/A',
            case_name: str(r.caseName) || str(r.case_name) || 'Unknown',
            court: str(r.court),
            court_id: str(r.court_id) || str(r.court),
            date_filed: strN(r.dateFiled) ?? strN(r.date_filed),
            date_terminated: strN(r.dateTerminated) ?? strN(r.date_terminated),
            cause: strN(r.cause),
            nature_of_suit: strN(r.suitNature) ?? strN(r.nature_of_suit),
            jury_demand: strN(r.juryDemand) ?? strN(r.jury_demand),
            jurisdiction_type: strN(r.jurisdictionType) ?? strN(r.jurisdiction_type),
            assigned_to_str: strN(r.assignedTo) ?? strN(r.assigned_to_str),
            referred_to_str: strN(r.referredTo) ?? strN(r.referred_to_str),
            absolute_url: `https://www.courtlistener.com${str(r.absolute_url)}`,
          }),
        ),
        source: 'live',
      };
    } catch (err: unknown) {
      logger.warn(
        { err: err instanceof Error ? err.message : String(err) },
        'CourtListener recent filings failed',
      );
      return { results: [], source: 'error' };
    }
  }

  clearCache() {
    REQUEST_CACHE.clear();
  }
}

export const courtListener = new CourtListenerService();
