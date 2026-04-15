import { useState } from "react";
import { MapPin, Clock, Search, User, ExternalLink, Loader2 } from "lucide-react";
import { VENUE_PROFILES } from "../data/demo-ny";

const BASE = import.meta.env.BASE_URL;

const VELOCITY_COLORS: Record<string, string> = {
  fast: "#4a90b8",
  moderate: "#d4a054",
  slow: "#c45a4a",
};

interface JudgeResult {
  id: number;
  name_full: string;
  court?: string;
  slug?: string;
  absolute_url?: string;
}

export default function VenueIntelPage() {
  const [judgeQuery, setJudgeQuery] = useState("");
  const [judgeResults, setJudgeResults] = useState<JudgeResult[]>([]);
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [judgeError, setJudgeError] = useState<string | null>(null);
  const [judgeSearched, setJudgeSearched] = useState(false);

  async function searchJudges() {
    if (!judgeQuery.trim()) return;
    setJudgeLoading(true);
    setJudgeError(null);
    setJudgeSearched(true);
    try {
      const r = await fetch(`${BASE}api/prism-counsel/court/judges/search?q=${encodeURIComponent(judgeQuery.trim())}`);
      const json = await r.json() as { success?: boolean; data?: { results?: unknown[]; count?: number }; results?: unknown[]; error?: string };
      if (!r.ok) throw new Error(json?.error ?? json?.data?.toString() ?? "Search failed");
      setJudgeResults((json.data?.results ?? json.results ?? []) as typeof judgeResults);
    } catch (e) {
      setJudgeError((e as Error).message);
      setJudgeResults([]);
    } finally {
      setJudgeLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Venue Intelligence</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
            {VENUE_PROFILES.length} VENUES
          </span>
        </div>
        <p className="text-xs text-slate-500">Court profiles, part assignments, scheduling patterns, and milestone velocity — operational intelligence for staffing and planning</p>
      </div>

      {/* Velocity summary */}
      <div className="grid grid-cols-3 gap-3">
        {["fast", "moderate", "slow"].map((v) => {
          const count = VENUE_PROFILES.filter((vp) => vp.observedVelocity === v).length;
          return (
            <div key={v} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: VELOCITY_COLORS[v] }} />
                <span className="text-[10px] font-medium text-slate-400 uppercase">{v} Velocity</span>
              </div>
              <div className="text-2xl font-bold text-slate-100 font-mono">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Live Judge Lookup via CourtListener */}
      <div className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-[#4a90b8]" />
          <h2 className="text-sm font-semibold text-slate-200">Live Judge Lookup</h2>
          <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20">CourtListener</span>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={judgeQuery}
            onChange={e => setJudgeQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchJudges()}
            placeholder="Search judge by name…"
            className="flex-1 bg-[#080c14] border border-white/[0.08] rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#4a90b8]/50"
          />
          <button
            onClick={searchJudges}
            disabled={judgeLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium text-white disabled:opacity-50"
            style={{ background: "#1a3a5c" }}
          >
            {judgeLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            Search
          </button>
        </div>
        {judgeError && (
          <p className="text-xs text-red-400 mb-2">{judgeError}</p>
        )}
        {judgeSearched && !judgeLoading && !judgeError && judgeResults.length === 0 && (
          <p className="text-xs text-slate-500">No judges found for "{judgeQuery}".</p>
        )}
        {judgeResults.length > 0 && (
          <div className="space-y-2">
            {judgeResults.slice(0, 10).map(j => (
              <div key={j.id} className="flex items-center justify-between rounded border border-white/[0.04] px-3 py-2" style={{ background: "#080c14" }}>
                <div>
                  <div className="text-xs font-medium text-slate-200">{j.name_full}</div>
                  {j.court && <div className="text-[10px] text-slate-500 mt-0.5">{j.court}</div>}
                </div>
                <a
                  href={j.absolute_url ?? `https://www.courtlistener.com/person/${j.id}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] text-[#4a90b8] hover:text-[#5ba3d4]"
                >
                  CourtListener <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Venue profiles */}
      <div className="space-y-4">
        {VENUE_PROFILES.map((venue) => (
          <div key={venue.id} className="rounded-lg border border-white/[0.06] p-5" style={{ background: "#0c1220" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">{venue.court}</h3>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {venue.county}, {venue.state} · {venue.part} · {venue.track}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: VELOCITY_COLORS[venue.observedVelocity] }} />
                <span className="text-[10px] font-medium capitalize" style={{ color: VELOCITY_COLORS[venue.observedVelocity] }}>
                  {venue.observedVelocity}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                <div className="text-[9px] text-slate-500 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Avg to Trial</div>
                <div className="text-sm font-mono font-semibold text-slate-200">{venue.avgDaysToTrial}d</div>
                <div className="text-[8px] text-slate-600">{(venue.avgDaysToTrial / 30).toFixed(0)} months</div>
              </div>
              <div className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                <div className="text-[9px] text-slate-500">Avg to Mediation</div>
                <div className="text-sm font-mono font-semibold text-slate-200">{venue.avgDaysToMediation}d</div>
                <div className="text-[8px] text-slate-600">{(venue.avgDaysToMediation / 30).toFixed(0)} months</div>
              </div>
              <div className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                <div className="text-[9px] text-slate-500">Avg Note of Issue</div>
                <div className="text-sm font-mono font-semibold text-slate-200">{venue.avgDaysNoteOfIssue}d</div>
                <div className="text-[8px] text-slate-600">{(venue.avgDaysNoteOfIssue / 30).toFixed(0)} months</div>
              </div>
              <div className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                <div className="text-[9px] text-slate-500">Conference Type</div>
                <div className="text-[11px] text-slate-300 mt-0.5">{venue.conferenceType}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[10px]">
              <div>
                <div className="text-slate-500 mb-1">
                  <span className="text-slate-400 font-medium">ADR Tendency: </span>{venue.adrTendency}
                </div>
                <div className="text-slate-500">
                  <span className="text-slate-400 font-medium">Scheduling: </span>{venue.schedulingNotes}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">
                  <span className="text-[#4a90b8] font-medium">Staffing: </span>{venue.staffingGuidance}
                </div>
                <div className="text-slate-500">
                  <span className="text-[#c8953c] font-medium">Escalation: </span>{venue.escalationGuidance}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
