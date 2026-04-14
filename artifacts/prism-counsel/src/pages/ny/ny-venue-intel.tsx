import { MapPin, TrendingUp, Scale } from "lucide-react";
import { NY_DEMO_MATTERS } from "../../data/ny-demo-matters";

const VENUE_DATABASE = [
  {
    county: "Queens",
    courtName: "Supreme Court, Queens County",
    courtType: "supreme",
    averageCycleMonths: 31,
    medianVerdictAuto: 280000,
    medianVerdictPremises: 520000,
    plaintiffFriendliness: "moderate",
    velocityScore: 62,
    typicalPart: "Part 36",
    adrAvailability: "mandatory",
    conferenceRules: "IAS conferences at 12 and 18 months; mediation ordered at 18-month mark",
    filingExpectations: "Electronic filing via NYSCEF; appearances required for discovery conferences",
    notes: "Queens has increasingly plaintiff-friendly jury pools in auto/BI matters. Defense strategies focused on IME and surveillance.",
  },
  {
    county: "Bronx",
    courtName: "Supreme Court, Bronx County",
    courtType: "supreme",
    averageCycleMonths: 34,
    medianVerdictAuto: 420000,
    medianVerdictPremises: 780000,
    plaintiffFriendliness: "very_high",
    velocityScore: 55,
    typicalPart: "Part 18",
    adrAvailability: "available",
    conferenceRules: "Expedited track available for cases with serious injuries; regular IAS calendar for standard matters",
    filingExpectations: "In-person appearances common; NYSCEF filing required; judges active in discovery management",
    notes: "Bronx commands highest verdicts in NY. Carriers factor Bronx premium heavily into reserves. IME defense critical.",
  },
  {
    county: "New York",
    courtName: "Supreme Court, New York County — Commercial Division",
    courtType: "supreme",
    averageCycleMonths: 24,
    medianVerdictAuto: null,
    medianVerdictPremises: null,
    plaintiffFriendliness: "high",
    velocityScore: 71,
    typicalPart: "IAS Part 6 (Commercial)",
    adrAvailability: "mandatory",
    conferenceRules: "Commercial Division rules apply — strict scheduling, preliminary conference orders with hard deadlines",
    filingExpectations: "NYSCEF mandatory; counsel must follow Commercial Division rules for discovery disputes",
    notes: "Commercial Division moves faster than civil parts. Judges are sophisticated in insurance coverage law. Bad faith exposure taken seriously at trial.",
  },
  {
    county: "Kings (Brooklyn)",
    courtName: "Supreme Court, Kings County",
    courtType: "supreme",
    averageCycleMonths: 36,
    medianVerdictAuto: 380000,
    medianVerdictPremises: 650000,
    plaintiffFriendliness: "high",
    velocityScore: 51,
    typicalPart: "Various IAS Parts",
    adrAvailability: "available",
    conferenceRules: "Standard IAS calendar; court-annexed mediation available on stipulation",
    filingExpectations: "NYSCEF filing required; court is slower than Manhattan and Queens on scheduling",
    notes: "Brooklyn has experienced significant verdict increases in recent years. Carriers taking cases to trial less often.",
  },
  {
    county: "Nassau",
    courtName: "Supreme Court, Nassau County",
    courtType: "supreme",
    averageCycleMonths: 28,
    medianVerdictAuto: 195000,
    medianVerdictPremises: 340000,
    plaintiffFriendliness: "moderate",
    velocityScore: 68,
    typicalPart: "Various IAS Parts",
    adrAvailability: "mandatory",
    conferenceRules: "Mandatory mediation program for PI cases under $250K in claimed damages",
    filingExpectations: "NYSCEF required; Nassau is generally faster than NYC boroughs",
    notes: "Nassau jury pools are more conservative than NYC. Strong defense results on causation. Carriers more willing to try cases here.",
  },
];

export default function NyVenueIntelPage() {
  const activeVenues = NY_DEMO_MATTERS.map(m => m.venueProfile);

  return (
    <div className="p-6 max-w-[1300px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Venue / Part Intelligence</h1>
        </div>
        <p className="text-xs text-slate-500">County courts, part assignments, judge rules, ADR patterns, timeline history, and venue velocity scoring</p>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Matter Venues</div>
        {NY_DEMO_MATTERS.map(m => {
          const vp = m.venueProfile;
          return (
            <div key={m.id} className="rounded-lg border border-[#d4a054]/20 p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs font-semibold text-slate-200">{vp.courtName}</div>
                  <div className="text-[10px] text-slate-500">{m.title.split(" (")[0]} · Part: {vp.typicalPart}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: vp.velocityScore >= 65 ? "#4a90b820" : "#d4a05420", color: vp.velocityScore >= 65 ? "#4a90b8" : "#d4a054" }}
                  >
                    {vp.velocityScore}
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500">Velocity</div>
                    <div className="text-[9px] text-slate-600">Score</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-2">
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5">Avg Cycle</div>
                  <div className="text-sm font-mono text-slate-200">{vp.averageCycleMonths}mo</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5">Plaintiff Friendly</div>
                  <div className="text-sm font-medium" style={{
                    color: vp.plaintiffFriendliness === "very_high" ? "#c45a4a" :
                    vp.plaintiffFriendliness === "high" ? "#d4a054" : "#4a90b8"
                  }}>
                    {vp.plaintiffFriendliness.replace("_", " ").toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5">ADR</div>
                  <div className="text-sm font-medium text-[#4a90b8]">{vp.adrAvailability.toUpperCase()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5">County</div>
                  <div className="text-sm text-slate-200">{vp.county}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">NY Venue Intelligence Database</div>
        {VENUE_DATABASE.map((v, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs font-semibold text-slate-200">{v.courtName}</div>
                <div className="text-[10px] text-slate-500">Part: {v.typicalPart} · ADR: {v.adrAvailability}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] ${
                  v.plaintiffFriendliness === "very_high" ? "bg-[#c45a4a]/10 text-[#c45a4a]" :
                  v.plaintiffFriendliness === "high" ? "bg-[#d4a054]/10 text-[#d4a054]" :
                  "bg-[#4a90b8]/10 text-[#4a90b8]"
                }`}>
                  {v.plaintiffFriendliness.replace("_", " ").toUpperCase()}
                </span>
                <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold" style={{ background: v.velocityScore >= 65 ? "#4a90b820" : "#d4a05420", color: v.velocityScore >= 65 ? "#4a90b8" : "#d4a054" }}>
                  {v.velocityScore}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-2">
              <div>
                <div className="text-[10px] text-slate-500 mb-0.5">Avg Cycle</div>
                <div className="text-sm font-mono text-slate-200">{v.averageCycleMonths} months</div>
              </div>
              {v.medianVerdictAuto && (
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5">Median Verdict (Auto)</div>
                  <div className="text-sm font-mono text-[#d4a054]">${(v.medianVerdictAuto / 1000).toFixed(0)}K</div>
                </div>
              )}
              {v.medianVerdictPremises && (
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5">Median Verdict (Premises)</div>
                  <div className="text-sm font-mono text-[#d4a054]">${(v.medianVerdictPremises / 1000).toFixed(0)}K</div>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 mb-1">{v.conferenceRules}</div>
            <div className="text-[10px] text-slate-600">{v.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
