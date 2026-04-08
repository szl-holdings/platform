export type ConfidenceLevel = "high" | "medium" | "low";
export type TonePreference = "formal-brief" | "formal-detailed" | "conversational-brief" | "narrative";

export type GenomePref = {
  key: string;
  label: string;
  value: string;
  confidence: ConfidenceLevel;
  source: string;
  lastUpdated: string;
};

export type GenomeSection = {
  id: string;
  label: string;
  preferences: GenomePref[];
};

export const GENOME_DATA: GenomeSection[] = [
  {
    id: "routine",
    label: "Daily Rhythm",
    preferences: [
      { key: "wake", label: "Wake time", value: "6:30 AM", confidence: "high", source: "Observed across 14 engagements", lastUpdated: "Mar 2026" },
      { key: "comms-start", label: "Communication window opens", value: "9:00 AM", confidence: "high", source: "Message pattern analysis", lastUpdated: "Mar 2026" },
      { key: "comms-end", label: "Communication window closes", value: "7:00 PM", confidence: "high", source: "Response pattern analysis", lastUpdated: "Mar 2026" },
      { key: "review", label: "Preferred review time", value: "Morning, before 10:00 AM", confidence: "medium", source: "Session scheduling history", lastUpdated: "Feb 2026" },
    ],
  },
  {
    id: "comms",
    label: "Communication Style",
    preferences: [
      { key: "length", label: "Summary length preference", value: "Brief — 3 key points maximum", confidence: "high", source: "Document review feedback", lastUpdated: "Mar 2026" },
      { key: "tone", label: "Preferred tone", value: "Direct, formal, no jargon", confidence: "high", source: "Explicit instruction, onboarding session", lastUpdated: "Feb 2026" },
      { key: "frequency", label: "Update frequency", value: "Weekly digest, urgent items same-day", confidence: "high", source: "Service plan, confirmed Mar 2026", lastUpdated: "Mar 2026" },
      { key: "medium", label: "Preferred medium", value: "Written summaries over calls", confidence: "medium", source: "Response pattern analysis", lastUpdated: "Jan 2026" },
    ],
  },
  {
    id: "tastes",
    label: "Tastes & Standards",
    preferences: [
      { key: "floral", label: "Floral arrangements", value: "White and ivory only — no bold colours", confidence: "high", source: "Explicit instruction, April 2025", lastUpdated: "Apr 2025" },
      { key: "catering", label: "Catering standard", value: "British sourcing preferred, no heavy sauces", confidence: "medium", source: "Observed at 3 events", lastUpdated: "Dec 2025" },
      { key: "housekeeping", label: "Housekeeping standard", value: "No scented products. Fragrance-free only.", confidence: "high", source: "Explicit instruction, onboarding", lastUpdated: "Feb 2026" },
      { key: "temperature", label: "Property temperature", value: "68–70°F / 20–21°C", confidence: "high", source: "Service plan specification", lastUpdated: "Feb 2026" },
    ],
  },
  {
    id: "sensitivities",
    label: "Sensitivities & Discretion",
    preferences: [
      { key: "visitors", label: "Visitor access", value: "All vendors must confirm 48h in advance. No exceptions.", confidence: "high", source: "Explicit instruction", lastUpdated: "Feb 2026" },
      { key: "photography", label: "Photography on-site", value: "Prohibited without explicit written approval", confidence: "high", source: "Explicit instruction", lastUpdated: "Feb 2026" },
      { key: "staff-comms", label: "Staff communication protocol", value: "All staff to report to Rosa first. No direct client contact.", confidence: "high", source: "Service plan", lastUpdated: "Feb 2026" },
      { key: "media", label: "Media & external presence", value: "No references to client or properties in any external communications", confidence: "high", source: "NDA & service plan", lastUpdated: "Feb 2026" },
    ],
  },
  {
    id: "cadence",
    label: "Seasonal Cadence",
    preferences: [
      { key: "summer", label: "Summer residence", value: "Oxfordshire Estate — May to September", confidence: "high", source: "Observed 2 consecutive years", lastUpdated: "Oct 2025" },
      { key: "winter", label: "Winter base", value: "Mayfair — October to April", confidence: "high", source: "Observed 2 consecutive years", lastUpdated: "Oct 2025" },
      { key: "travel", label: "Travel frequency", value: "International 4–6 times per year. Main destinations: New York, Monaco, Dubai.", confidence: "medium", source: "Session notes, travel coordination", lastUpdated: "Mar 2026" },
      { key: "festive", label: "Festive period", value: "Oxfordshire always. Family gathering — elevated staffing required.", confidence: "high", source: "Observed 2 consecutive years", lastUpdated: "Jan 2026" },
    ],
  },
  {
    id: "service",
    label: "Service Preferences",
    preferences: [
      { key: "vendors", label: "Vendor relationship style", value: "Rosa manages — client not to be contacted directly by vendors", confidence: "high", source: "Service plan", lastUpdated: "Feb 2026" },
      { key: "decisions", label: "Decision escalation threshold", value: "Items under £2,000 — Rosa decides. Above: brief summary for approval.", confidence: "high", source: "Engagement agreement", lastUpdated: "Feb 2026" },
      { key: "surprises", label: "Tolerance for surprises", value: "Zero. All changes briefed in advance.", confidence: "high", source: "Explicit instruction, April 2025", lastUpdated: "Apr 2025" },
      { key: "language", label: "Reporting language", value: "British English. Metric + Imperial both acceptable.", confidence: "medium", source: "Document review feedback", lastUpdated: "Mar 2026" },
    ],
  },
];

export const CLIENT_GENOME = {
  name: "Lady Ashworth",
  status: "Active",
  defaultTone: "formal-brief" as TonePreference,
  commsStyle: "Direct, formal, no jargon",
  summaryLength: "Brief — 3 key points maximum",
  updateFrequency: "Weekly digest, urgent items same-day",
  preferredMedium: "Written summaries over calls",
  discretionLevel: 4,
};

export function getGenomePref(sectionId: string, key: string): GenomePref | undefined {
  const section = GENOME_DATA.find(s => s.id === sectionId);
  return section?.preferences.find(p => p.key === key);
}

export function getCommsPref(key: string): GenomePref | undefined {
  return getGenomePref("comms", key);
}

export function getCadencePref(key: string): GenomePref | undefined {
  return getGenomePref("cadence", key);
}

export function getHighConfidenceSignals(): GenomePref[] {
  return GENOME_DATA.flatMap(s => s.preferences.filter(p => p.confidence === "high"));
}
