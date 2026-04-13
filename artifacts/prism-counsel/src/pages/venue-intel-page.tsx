import { MapPin, Clock, Users, BarChart3, ArrowRight } from "lucide-react";
import { VENUE_PROFILES } from "../data/ny-data";

const VELOCITY_COLORS: Record<string, string> = {
  fast: "#4a90b8",
  moderate: "#d4a054",
  slow: "#c45a4a",
};

export default function VenueIntelPage() {
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
