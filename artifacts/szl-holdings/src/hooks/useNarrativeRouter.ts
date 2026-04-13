import { useState, useEffect, useCallback, useRef } from "react";

export type VisitorType = "investor" | "lender" | "buyer" | "design-partner" | "unknown";

interface NarrativeState {
  visitorType: VisitorType;
  confidence: number;
  signals: string[];
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  pageProgression: string[];
  setIntent: (type: VisitorType) => void;
  recordClickSignal: (signal: string, weight?: number) => void;
}

const VISITOR_SESSION_KEY = "szl_visitor_intent";
const PAGE_PROGRESSION_KEY = "szl_page_progression";
const CLICK_SIGNALS_KEY = "szl_click_signals";

const CLICK_SIGNAL_WEIGHTS: Record<string, { type: VisitorType; weight: number }> = {
  cta_investor_materials: { type: "investor", weight: 0.7 },
  cta_data_room: { type: "investor", weight: 0.85 },
  cta_moat: { type: "investor", weight: 0.8 },
  cta_investor_overview: { type: "investor", weight: 0.75 },
  cta_lender_brief: { type: "lender", weight: 0.85 },
  cta_investor_relations: { type: "lender", weight: 0.65 },
  cta_demo: { type: "buyer", weight: 0.55 },
  cta_platform: { type: "buyer", weight: 0.5 },
  cta_design_partner: { type: "design-partner", weight: 0.8 },
  cta_design_partner_apply: { type: "design-partner", weight: 0.9 },
  proof_pack_investor: { type: "investor", weight: 0.75 },
  proof_pack_lender: { type: "lender", weight: 0.75 },
  proof_pack_buyer: { type: "buyer", weight: 0.7 },
  "proof_pack_design-partner": { type: "design-partner", weight: 0.75 },
  trust_route_enter: { type: "investor", weight: 0.5 },
  trust_route_complete: { type: "investor", weight: 0.7 },
};

function detectFromUTM(params: URLSearchParams): { type: VisitorType; confidence: number; signals: string[] } | null {
  const source = params.get("utm_source")?.toLowerCase() ?? "";
  const medium = params.get("utm_medium")?.toLowerCase() ?? "";
  const campaign = params.get("utm_campaign")?.toLowerCase() ?? "";
  const content = params.get("utm_content")?.toLowerCase() ?? "";
  const all = [source, medium, campaign, content].join(" ");

  if (all.match(/investor|fund|vc|angel|equity|raise|seed|series/)) {
    return { type: "investor", confidence: 0.9, signals: ["utm_investor_signal"] };
  }
  if (all.match(/lender|bank|sba|loan|debt|credit|finance|capital/)) {
    return { type: "lender", confidence: 0.9, signals: ["utm_lender_signal"] };
  }
  if (all.match(/design.?partner|pilot|early.?access|operator|enterprise/)) {
    return { type: "design-partner", confidence: 0.9, signals: ["utm_design_partner_signal"] };
  }
  if (all.match(/buyer|customer|demo|product|solution|saas/)) {
    return { type: "buyer", confidence: 0.85, signals: ["utm_buyer_signal"] };
  }
  return null;
}

function detectFromReferrer(referrer: string): { type: VisitorType; confidence: number; signals: string[] } | null {
  const r = referrer.toLowerCase();
  if (r.match(/crunchbase|pitchbook|angellist|venture|fund|ycombinator|techcrunch/)) {
    return { type: "investor", confidence: 0.75, signals: ["referrer_investor"] };
  }
  if (r.match(/banking|sba\.gov|smallbusiness|lendio|kabbage|nav\.com/)) {
    return { type: "lender", confidence: 0.75, signals: ["referrer_lender"] };
  }
  if (r.match(/producthunt|hacker.?news|indie|betalist/)) {
    return { type: "buyer", confidence: 0.65, signals: ["referrer_buyer"] };
  }
  return null;
}

function detectFromPageProgression(pages: string[]): { type: VisitorType; confidence: number; signals: string[] } | null {
  const investor_pages = ["/investors", "/investor-relations", "/investors/overview", "/investors/moat", "/investors/data-room"];
  const design_partner_pages = ["/design-partners", "/design-partner", "/pricing", "/demo"];
  const trust_pages = ["/trust", "/trust/architecture", "/trust/governance", "/trust-route"];

  const investorHits = pages.filter(p => investor_pages.some(ip => p.startsWith(ip))).length;
  const designPartnerHits = pages.filter(p => design_partner_pages.some(dp => p.startsWith(dp))).length;
  const trustHits = pages.filter(p => trust_pages.some(tp => p.startsWith(tp))).length;

  if (investorHits >= 2) return { type: "investor", confidence: 0.7, signals: ["page_progression_investor"] };
  if (designPartnerHits >= 2) return { type: "design-partner", confidence: 0.7, signals: ["page_progression_design_partner"] };
  if (trustHits >= 1 && investorHits >= 1) return { type: "investor", confidence: 0.65, signals: ["page_progression_trust_investor"] };
  return null;
}

interface StoredClickSignals {
  counts: Record<VisitorType, number>;
  signals: string[];
}

function detectFromClickSignals(): { type: VisitorType; confidence: number; signals: string[] } | null {
  try {
    const raw = sessionStorage.getItem(CLICK_SIGNALS_KEY);
    if (!raw) return null;
    const data: StoredClickSignals = JSON.parse(raw);
    const counts = data.counts ?? {};
    const maxType = (Object.entries(counts) as [VisitorType, number][])
      .sort((a, b) => b[1] - a[1])[0];
    if (!maxType || maxType[1] < 0.4) return null;
    const confidence = Math.min(maxType[1], 0.88);
    return { type: maxType[0], confidence, signals: data.signals ?? [] };
  } catch {
    return null;
  }
}

function mergeClickSignal(signal: string, weight: number): void {
  const mapping = CLICK_SIGNAL_WEIGHTS[signal];
  if (!mapping) return;
  try {
    let data: StoredClickSignals = { counts: { investor: 0, lender: 0, buyer: 0, "design-partner": 0, unknown: 0 }, signals: [] };
    const raw = sessionStorage.getItem(CLICK_SIGNALS_KEY);
    if (raw) data = JSON.parse(raw);
    data.counts[mapping.type] = (data.counts[mapping.type] ?? 0) + weight;
    if (!data.signals.includes(signal)) data.signals = [...data.signals, signal].slice(-20);
    sessionStorage.setItem(CLICK_SIGNALS_KEY, JSON.stringify(data));
  } catch {}
}

export function useNarrativeRouter(): NarrativeState {
  const [visitorType, setVisitorType] = useState<VisitorType>("unknown");
  const [confidence, setConfidence] = useState(0);
  const [signals, setSignals] = useState<string[]>([]);
  const [utmSource, setUtmSource] = useState<string | null>(null);
  const [utmMedium, setUtmMedium] = useState<string | null>(null);
  const [utmCampaign, setUtmCampaign] = useState<string | null>(null);
  const [referrer, setReferrer] = useState<string | null>(null);
  const [pageProgression, setPageProgression] = useState<string[]>([]);
  const resolved = useRef(false);

  const applyResult = useCallback((type: VisitorType, conf: number, sigs: string[]) => {
    setVisitorType(type);
    setConfidence(conf);
    setSignals(sigs);
    try {
      sessionStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify({ type, confidence: conf, signals: sigs }));
    } catch {}
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const src = params.get("utm_source");
    const med = params.get("utm_medium");
    const camp = params.get("utm_campaign");
    if (src) setUtmSource(src);
    if (med) setUtmMedium(med);
    if (camp) setUtmCampaign(camp);

    const ref = document.referrer || null;
    setReferrer(ref);

    const currentPath = window.location.pathname;
    let progression: string[] = [];
    try {
      progression = JSON.parse(sessionStorage.getItem(PAGE_PROGRESSION_KEY) ?? "[]");
    } catch (err) {
      console.warn("[narrative-router] Failed to parse page progression:", err instanceof Error ? err.message : String(err));
    }
    if (!progression.includes(currentPath)) {
      progression = [...progression, currentPath].slice(-20);
      try { sessionStorage.setItem(PAGE_PROGRESSION_KEY, JSON.stringify(progression)); } catch {}
    }
    setPageProgression(progression);

    const stored = sessionStorage.getItem(VISITOR_SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.type && parsed.confidence > 0.5) {
          setVisitorType(parsed.type);
          setConfidence(parsed.confidence);
          setSignals(parsed.signals ?? []);
          resolved.current = true;
          return;
        }
      } catch (err) {
        console.warn("[narrative-router] Failed to parse visitor session:", err instanceof Error ? err.message : String(err));
      }
    }

    type DetectionResult = { type: VisitorType; confidence: number; signals: string[] };
    const candidates: DetectionResult[] = [];

    const utmResult = detectFromUTM(params);
    if (utmResult) candidates.push(utmResult);

    if (ref) {
      const refResult = detectFromReferrer(ref);
      if (refResult) candidates.push(refResult);
    }

    const clickResult = detectFromClickSignals();
    if (clickResult) candidates.push(clickResult);

    const progResult = detectFromPageProgression(progression);
    if (progResult) candidates.push(progResult);

    const result: DetectionResult | null = candidates.length > 0
      ? candidates.reduce((best, c) => c.confidence > best.confidence ? c : best)
      : null;

    if (result) {
      applyResult(result.type, result.confidence, result.signals);
    }
    resolved.current = true;
  }, [applyResult]);

  const setIntent = useCallback((type: VisitorType) => {
    const sig = [`manual_${type}`];
    applyResult(type, 1.0, sig);
  }, [applyResult]);

  const recordClickSignal = useCallback((signal: string, weight = 1.0) => {
    mergeClickSignal(signal, weight);
    const clickResult = detectFromClickSignals();
    if (clickResult && clickResult.confidence > confidence) {
      applyResult(clickResult.type, clickResult.confidence, clickResult.signals);
    }
  }, [confidence, applyResult]);

  return { visitorType, confidence, signals, utmSource, utmMedium, utmCampaign, referrer, pageProgression, setIntent, recordClickSignal };
}
