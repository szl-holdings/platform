import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gavel, Search, ExternalLink, Building2, FileText, RefreshCw, AlertCircle, Calendar, Wifi, WifiOff, Link2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface CLDocket {
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

interface CLOpinion {
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

interface CLJudge {
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

interface CourtSearchResult { count: number; results: CLDocket[] | CLOpinion[] | CLJudge[]; source: "live" | "error" }
interface RecentFilingsResult { results: CLDocket[]; source: "live" | "error" }
interface OpinionsResult { count: number; results: CLOpinion[]; source: "live" | "error" }

const FEDERAL_COURTS = [
  { id: "", label: "All Federal Courts" },
  { id: "ca2", label: "2nd Circuit" },
  { id: "ca9", label: "9th Circuit" },
  { id: "ca11", label: "11th Circuit" },
  { id: "nyed", label: "E.D.N.Y." },
  { id: "nysd", label: "S.D.N.Y." },
  { id: "flsd", label: "S.D. Fla." },
  { id: "njd", label: "D.N.J." },
  { id: "cand", label: "N.D. Cal." },
  { id: "ilnd", label: "N.D. Ill." },
];

type FeedTab = "filings" | "search" | "opinions" | "judges";

function LiveBadge({ source }: { source?: "live" | "error" }) {
  if (source === "error") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">
        <WifiOff className="w-2.5 h-2.5" /> UNAVAILABLE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#5aa87a]/10 text-[#5aa87a] border border-[#5aa87a]/20">
      <Wifi className="w-2.5 h-2.5" /> LIVE · CourtListener
    </span>
  );
}

function DocketCard({ docket }: { docket: CLDocket }) {
  const [linking, setLinking] = useState(false);
  const [matterId, setMatterId] = useState("");
  const [linkState, setLinkState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [linkMsg, setLinkMsg] = useState("");

  async function linkToMatter() {
    const mid = parseInt(matterId, 10);
    if (isNaN(mid) || mid < 1) { setLinkMsg("Enter a valid matter ID"); setLinkState("error"); return; }
    setLinkState("loading");
    try {
      const res = await fetch(`${BASE}/api/prism-counsel/court/matters/${mid}/link-docket`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-requested-with": "XMLHttpRequest" },
        credentials: "include",
        body: JSON.stringify({ docketId: String(docket.id), courtId: docket.court_id ?? docket.court, caseNumber: docket.docket_number }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Link failed");
      setLinkState("done");
      setLinkMsg(`Linked to matter #${mid}`);
    } catch (e) {
      setLinkState("error");
      setLinkMsg((e as Error).message);
    }
  }

  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-200 truncate">{docket.case_name}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{docket.docket_number} · {docket.court_id?.toUpperCase() ?? docket.court}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => { setLinking(l => !l); setLinkState("idle"); setLinkMsg(""); }}
            className="flex items-center gap-1 px-2 py-1 rounded border border-white/[0.08] text-[10px] text-slate-400 hover:text-[#4a90b8] hover:border-[#4a90b8]/30 transition-colors"
            title="Link to matter"
          >
            <Link2 className="w-3 h-3" />
            Link
          </button>
          <a href={docket.absolute_url} target="_blank" rel="noopener noreferrer" className="text-[#4a90b8] hover:text-[#5aa8d8]">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {docket.date_filed && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-3 h-3" /> Filed {docket.date_filed}
          </div>
        )}
        {docket.assigned_to_str && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Gavel className="w-3 h-3" /> {docket.assigned_to_str}
          </div>
        )}
        {docket.nature_of_suit && (
          <div className="text-slate-500 col-span-2">Nature of suit: {docket.nature_of_suit}</div>
        )}
        {docket.cause && (
          <div className="text-slate-500 col-span-2">Cause: {docket.cause}</div>
        )}
      </div>
      {linking && (
        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          {linkState === "done" ? (
            <div className="flex items-center gap-1.5 text-[10px] text-[#5aa87a]">
              <CheckCircle2 className="w-3 h-3" /> {linkMsg}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={matterId}
                onChange={e => setMatterId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && linkToMatter()}
                placeholder="Matter ID"
                className="w-28 px-2 py-1 rounded text-[10px] bg-[#080c14] border border-white/[0.08] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#4a90b8]/40"
              />
              <button
                onClick={linkToMatter}
                disabled={linkState === "loading"}
                className="px-2 py-1 rounded text-[10px] text-white font-medium disabled:opacity-50"
                style={{ background: "#1a3a5c" }}
              >
                {linkState === "loading" ? "Linking…" : "Link to Matter"}
              </button>
              {linkState === "error" && <span className="text-[10px] text-red-400">{linkMsg}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OpinionCard({ opinion }: { opinion: CLOpinion }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-200 truncate">{opinion.case_name}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{opinion.court?.toUpperCase()} · {opinion.date_filed}</div>
        </div>
        <a href={opinion.absolute_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-[#4a90b8] hover:text-[#5aa8d8]">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="flex items-center gap-3 text-[10px]">
        {opinion.judges && <div className="text-slate-500">Judge: {opinion.judges}</div>}
        {opinion.precedential_status && (
          <span className="px-1.5 py-0.5 rounded bg-[#4a90b8]/10 text-[#4a90b8] text-[9px]">
            {opinion.precedential_status}
          </span>
        )}
        {opinion.citation_count > 0 && (
          <div className="text-slate-500">{opinion.citation_count} citations</div>
        )}
      </div>
    </div>
  );
}

function JudgeRulingStats({ judgeName, court }: { judgeName: string; court: string }) {
  const { data, isLoading } = useQuery<OpinionsResult>({
    queryKey: ["judge-ruling-stats", judgeName],
    queryFn: async () => {
      const params = new URLSearchParams({ q: judgeName, limit: "20" });
      if (court) params.set("court", court);
      const res = await fetch(`${BASE}/api/prism-counsel/court/opinions/search?${params}`, {
        headers: { "x-requested-with": "XMLHttpRequest" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const json = await res.json() as { data?: OpinionsResult };
      return (json.data ?? json) as OpinionsResult;
    },
    staleTime: 10 * 60 * 1000,
    retry: 0,
  });

  if (isLoading) {
    return <div className="text-[10px] text-slate-600 mt-2">Loading ruling statistics…</div>;
  }

  const opinions = data?.results ?? [];
  const precedentialCount = opinions.filter(o => o.precedential_status === "Published").length;
  const totalCitations = opinions.reduce((sum, o) => sum + (o.citation_count ?? 0), 0);
  const mostRecent = opinions.map(o => o.date_filed).filter(Boolean).sort().reverse()[0];
  const topOpinion = [...opinions].sort((a, b) => (b.citation_count ?? 0) - (a.citation_count ?? 0))[0];

  if (!opinions.length) {
    return (
      <div className="mt-2 text-[10px] text-slate-600 italic">
        No opinions indexed by CourtListener for this judge
      </div>
    );
  }

  return (
    <div className="mt-3 rounded border border-white/[0.05] p-2.5 space-y-2" style={{ background: "#080c14" }}>
      <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Ruling Statistics · CourtListener</div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-sm font-bold text-[#4a90b8]">{data?.count ?? opinions.length}</div>
          <div className="text-[9px] text-slate-500">Total Opinions</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-[#5aa87a]">{precedentialCount}</div>
          <div className="text-[9px] text-slate-500">Precedential</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-[#d4a054]">{totalCitations}</div>
          <div className="text-[9px] text-slate-500">Total Citations</div>
        </div>
      </div>
      {mostRecent && (
        <div className="text-[10px] text-slate-500">Most recent ruling: <span className="text-slate-300">{mostRecent}</span></div>
      )}
      {topOpinion && (
        <div className="text-[10px] text-slate-500 truncate">
          Most cited: <a href={topOpinion.absolute_url} target="_blank" rel="noopener noreferrer" className="text-[#4a90b8] hover:underline">{topOpinion.case_name}</a>
          {topOpinion.citation_count > 0 && <span className="ml-1 text-slate-600">({topOpinion.citation_count} citations)</span>}
        </div>
      )}
    </div>
  );
}

function JudgeCard({ judge }: { judge: CLJudge }) {
  const [showStats, setShowStats] = useState(false);
  const judgeName = judge.name_full || `${judge.name_first} ${judge.name_last}`.trim();
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-200">{judgeName}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{judge.court?.toUpperCase()}</div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-500">
            {judge.position_type && <div>Position: {judge.position_type}</div>}
            {judge.appointing_president && <div>Appointed by: {judge.appointing_president}</div>}
            {judge.political_affiliation && <div>Affiliation: {judge.political_affiliation}</div>}
            {judge.date_start && <div>Active since: {judge.date_start}</div>}
            {judge.date_termination && <div className="text-[#c45a4a]">Terminated: {judge.date_termination}</div>}
          </div>
          <button
            onClick={() => setShowStats(v => !v)}
            className="mt-2 text-[10px] text-[#4a90b8] hover:text-[#5aa8d8] underline-offset-2 hover:underline transition-colors"
          >
            {showStats ? "Hide" : "Show"} ruling statistics
          </button>
          {showStats && <JudgeRulingStats judgeName={judgeName} court={judge.court} />}
        </div>
        <a href={judge.absolute_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-[#4a90b8] hover:text-[#5aa8d8]">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export default function CourtDataFeedPage() {
  const [tab, setTab] = useState<FeedTab>("filings");
  const [selectedCourt, setSelectedCourt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searchType, setSearchType] = useState<"dockets" | "opinions" | "judges">("dockets");

  const filingsQuery = useQuery({
    queryKey: ["court-filings", selectedCourt],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "15" });
      if (selectedCourt) params.set("court", selectedCourt);
      const res = await fetch(`${BASE}/api/prism-counsel/court/filings/recent?${params}`, {
        headers: { "x-requested-with": "XMLHttpRequest" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch filings");
      const json = await res.json();
      return json.data ?? json;
    },
    enabled: tab === "filings",
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const searchQuery2 = useQuery({
    queryKey: ["court-search", activeSearch, searchType, selectedCourt],
    queryFn: async () => {
      const endpoint = searchType === "dockets"
        ? "court/dockets/search"
        : searchType === "opinions"
        ? "court/opinions/search"
        : "court/judges/search";
      const params = new URLSearchParams({ q: activeSearch, limit: "15" });
      if (selectedCourt) params.set("court", selectedCourt);
      const res = await fetch(`${BASE}/api/prism-counsel/${endpoint}?${params}`, {
        headers: { "x-requested-with": "XMLHttpRequest" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      return json.data ?? json;
    },
    enabled: !!activeSearch && tab === "search",
    staleTime: 60 * 1000,
    retry: 1,
  });

  const opinionsQuery = useQuery({
    queryKey: ["court-opinions", selectedCourt],
    queryFn: async () => {
      const params = new URLSearchParams({ q: "insurance personal injury", limit: "10" });
      if (selectedCourt) params.set("court", selectedCourt);
      const res = await fetch(`${BASE}/api/prism-counsel/court/opinions/search?${params}`, {
        headers: { "x-requested-with": "XMLHttpRequest" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch opinions");
      const json = await res.json();
      return json.data ?? json;
    },
    enabled: tab === "opinions",
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const tabs: { id: FeedTab; label: string; icon: typeof Gavel }[] = [
    { id: "filings", label: "Recent Filings", icon: FileText },
    { id: "search", label: "Docket Search", icon: Search },
    { id: "opinions", label: "Opinions", icon: Gavel },
    { id: "judges", label: "Judge Lookup", icon: Building2 },
  ];

  const activeData = tab === "filings" ? filingsQuery
    : tab === "search" ? searchQuery2
    : tab === "opinions" ? opinionsQuery
    : null;

  return (
    <div className="p-5 max-w-[1000px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gavel className="w-4 h-4 text-[#4a90b8]" />
          <h1 className="text-sm font-semibold text-slate-200">Court Data Feed</h1>
          <LiveBadge source={
            (activeData?.data as { source?: "live" | "error" } | null | undefined)?.source
            ?? (activeData?.isError ? "error" : undefined)
          } />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCourt}
            onChange={e => setSelectedCourt(e.target.value)}
            className="px-2 py-1 rounded text-[11px] bg-white/[0.04] border border-white/[0.08] text-slate-300 focus:outline-none"
          >
            {FEDERAL_COURTS.map(c => (
              <option key={c.id} value={c.id} style={{ background: "#0c1220" }}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={() => {
              filingsQuery.refetch();
              opinionsQuery.refetch();
            }}
            className="p-1.5 rounded border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/[0.12] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="text-[10px] text-slate-500 p-3 rounded border border-[#4a90b8]/10 bg-[#4a90b8]/5">
        Live data sourced from CourtListener's public API — federal PACER-mirrored dockets, appellate opinions, and judge profiles.
        All data is read-only and requires attorney review before use in any legal proceedings.
      </div>

      <div className="flex gap-1 border-b border-white/[0.06] pb-px">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs rounded-t transition-colors",
                tab === t.id ? "bg-white/[0.06] text-slate-100 border-b-2 border-[#4a90b8]" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "search" && (
        <div className="flex gap-2">
          <div className="flex gap-1 border border-white/[0.06] rounded p-0.5" style={{ background: "#0c1220" }}>
            {(["dockets", "opinions", "judges"] as const).map(t => (
              <button
                key={t}
                onClick={() => setSearchType(t)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] capitalize transition-colors",
                  searchType === t ? "bg-[#4a90b8]/20 text-[#4a90b8]" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchQuery.trim() && setActiveSearch(searchQuery.trim())}
              placeholder={`Search ${searchType}... (press Enter)`}
              className="flex-1 px-3 py-1.5 rounded text-xs bg-white/[0.04] border border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#4a90b8]/40"
            />
            <button
              onClick={() => searchQuery.trim() && setActiveSearch(searchQuery.trim())}
              className="px-3 py-1.5 rounded bg-[#4a90b8]/20 border border-[#4a90b8]/30 text-[#4a90b8] text-xs hover:bg-[#4a90b8]/30 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {tab === "judges" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && searchQuery.trim()) { setSearchType("judges"); setActiveSearch(searchQuery.trim()); setTab("search"); } }}
            placeholder="Search judges by name... (press Enter)"
            className="flex-1 px-3 py-1.5 rounded text-xs bg-white/[0.04] border border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#4a90b8]/40"
          />
          <button
            onClick={() => { if (searchQuery.trim()) { setSearchType("judges"); setActiveSearch(searchQuery.trim()); setTab("search"); } }}
            className="px-3 py-1.5 rounded bg-[#4a90b8]/20 border border-[#4a90b8]/30 text-[#4a90b8] text-xs hover:bg-[#4a90b8]/30 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {tab === "filings" && (
        <div className="space-y-3">
          {filingsQuery.isLoading && <div className="text-xs text-slate-500 flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin" /> Fetching live filings from CourtListener…</div>}
          {filingsQuery.isError && (
            <div className="rounded-lg border border-[#c45a4a]/20 p-4 text-xs text-[#c45a4a] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              CourtListener API unavailable. Check your connection or API key configuration.
            </div>
          )}
          {filingsQuery.data?.results?.length === 0 && !filingsQuery.isLoading && (
            <div className="text-xs text-slate-500">No recent filings found for the selected court.</div>
          )}
          {((filingsQuery.data?.results ?? []) as CLDocket[]).map((docket) => (
            <DocketCard key={docket.id} docket={docket} />
          ))}
        </div>
      )}

      {tab === "search" && (
        <div className="space-y-3">
          {!activeSearch && <div className="text-xs text-slate-500">Enter a search query and press Enter or click Search.</div>}
          {searchQuery2.isLoading && <div className="text-xs text-slate-500 flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin" /> Searching CourtListener…</div>}
          {searchQuery2.isError && (
            <div className="rounded-lg border border-[#c45a4a]/20 p-4 text-xs text-[#c45a4a] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Search failed. CourtListener API may be unavailable.
            </div>
          )}
          {searchQuery2.data && (
            <div className="text-[10px] text-slate-500 mb-2">{searchQuery2.data.count ?? searchQuery2.data.results?.length ?? 0} results</div>
          )}
          {searchType === "dockets" && (searchQuery2.data?.results as CLDocket[] ?? []).map(item => <DocketCard key={item.id} docket={item} />)}
          {searchType === "opinions" && (searchQuery2.data?.results as CLOpinion[] ?? []).map(item => <OpinionCard key={item.id} opinion={item} />)}
          {searchType === "judges" && (searchQuery2.data?.results as CLJudge[] ?? []).map(item => <JudgeCard key={item.id} judge={item} />)}
        </div>
      )}

      {tab === "opinions" && (
        <div className="space-y-3">
          {opinionsQuery.isLoading && <div className="text-xs text-slate-500 flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin" /> Loading opinions…</div>}
          {opinionsQuery.isError && (
            <div className="rounded-lg border border-[#c45a4a]/20 p-4 text-xs text-[#c45a4a] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              CourtListener API unavailable.
            </div>
          )}
          {((opinionsQuery.data?.results ?? []) as CLOpinion[]).map((opinion) => (
            <OpinionCard key={opinion.id} opinion={opinion} />
          ))}
        </div>
      )}

      {tab === "judges" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-white/[0.06] p-5 text-center" style={{ background: "#0c1220" }}>
            <Gavel className="w-8 h-8 text-[#4a90b8]/30 mx-auto mb-3" />
            <div className="text-sm text-slate-300 mb-1">Search federal judges</div>
            <div className="text-[10px] text-slate-500">Enter a judge name above and press Enter to look up judicial profiles from CourtListener</div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-white/[0.06] p-3 text-[10px] text-slate-500" style={{ background: "#0c1220" }}>
        <span className="text-[#4a90b8]">Data source:</span> CourtListener (courtlistener.com) — free public access to PACER-mirrored federal dockets, appellate opinions, and judicial profiles.
        Data is provided for informational purposes and requires attorney review before use in legal proceedings.
        Add <span className="font-mono text-slate-400">COURT_LISTENER_API_KEY</span> to environment variables for increased rate limits.
      </div>
    </div>
  );
}
