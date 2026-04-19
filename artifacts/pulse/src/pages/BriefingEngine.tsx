import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, AlertTriangle, ChevronDown, ChevronRight, Target, Info, CheckCircle2, ArrowRight } from "lucide-react";
import { CitationPanel, type Citation } from "../components/CitationPanel";
import { VerifierBadge, AutonomyTierBadge } from "../components/VerifierBadge";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";

const BASE_API = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/\/pulse$/, "") || "";
const API_PREFIX = `${BASE_API}/api`;

type Domain = "consolidated" | "vessels" | "aegis" | "terra" | "lyte" | "prism" | "szl-holdings";

const DOMAIN_LABELS: Record<Domain, string> = {
  consolidated: "All Domains",
  vessels: "Vessels Maritime",
  aegis: "Aegis Security",
  terra: "Terra Real Estate",
  lyte: "Lyte Infrastructure",
  prism: "Prism Counsel",
  "szl-holdings": "SZL Holdings",
};

const DOMAIN_COLORS: Record<Domain, string> = {
  consolidated: "#c8a84b",
  vessels: "#4eca8b",
  aegis: "#e53e3e",
  terra: "#48bb78",
  lyte: "#7eb8f7",
  prism: "#a78bfa",
  "szl-holdings": "#c8a84b",
};

export interface BeliefStatement {
  id: string;
  claim: string;
  confidence: number;
  citationIds: string[];
  supported: boolean;
  caveats: string[];
}

export interface RecommendedAction {
  id: string;
  priority: "P0" | "P1" | "P2" | "P3";
  action: string;
  rationale: string;
  owner?: string;
  dueBy?: string;
  autonomyTier: string;
  citationIds: string[];
}

export interface ExecBrief {
  id: string;
  briefingId?: string;
  domain: string;
  status: "published" | "draft" | "revision_required";
  headline: string;
  situation: string;
  autonomyTier: string;
  confidence: string;
  overallRisk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  verifierStatus: "passed" | "revision_required" | "pending";
  verifierFeedback?: string | null;
  whatWeBelieve: BeliefStatement[];
  whyCitations: Citation[];
  whatWeRecommend: RecommendedAction[];
  sourceTraceIds: string[];
  entityProvenance: Array<{ entityId: string; entityType: string; domain: string; confidence: number }>;
  sections: unknown[];
  generatedAt: string;
}

async function fetchExecBrief(domain: Domain): Promise<{ data: ExecBrief }> {
  const path = domain === "consolidated" ? "/pulse/executive" : `/pulse/executive/${domain}`;
  const res = await fetch(`${API_PREFIX}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ data: ExecBrief }>;
}

async function generateExecBrief(domain: Domain): Promise<{ data: ExecBrief }> {
  const path = domain === "consolidated" ? "/pulse/executive/generate" : `/pulse/executive/generate/${domain}`;
  const res = await fetch(`${API_PREFIX}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ data: ExecBrief }>;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "#4eca8b" : pct >= 60 ? "#c8a84b" : "#e8855b";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color, fontFamily: "monospace", minWidth: 36 }}>{pct}%</span>
    </div>
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  P0: "#e53e3e",
  P1: "#e8855b",
  P2: "#c8a84b",
  P3: "#7eb8f7",
};

function BeliefCard({ belief, citations }: { belief: BeliefStatement; citations: Citation[] }) {
  const [expanded, setExpanded] = useState(false);
  const conf = belief.confidence;
  const color = conf >= 0.8 ? "#4eca8b" : conf >= 0.6 ? "#c8a84b" : "#e8855b";
  const relatedCitations = citations.filter((c) => belief.citationIds.includes(c.id));

  return (
    <div style={{
      borderRadius: 7,
      border: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(255,255,255,0.025)",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
          padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 10,
        }}
      >
        <div style={{ marginTop: 2, color, flexShrink: 0 }}>
          {belief.supported ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.5, textAlign: "left" }}>
            {belief.claim}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1, maxWidth: 120 }}>
              <ConfidenceBar value={belief.confidence} />
            </div>
            {belief.caveats.length > 0 && (
              <span style={{ fontSize: "0.6rem", color: "#c8a84b", opacity: 0.8 }}>
                {belief.caveats.length} caveat{belief.caveats.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {expanded && (
        <div style={{ padding: "0 12px 12px" }}>
          {belief.caveats.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {belief.caveats.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 3 }}>
                  <Info size={11} color="#c8a84b" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>{c}</span>
                </div>
              ))}
            </div>
          )}
          {relatedCitations.length > 0 && (
            <CitationPanel citations={relatedCitations} />
          )}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ rec }: { rec: RecommendedAction }) {
  const priorityColor = PRIORITY_COLORS[rec.priority] ?? "#888";
  return (
    <div style={{
      borderRadius: 7,
      border: `1px solid ${priorityColor}25`,
      background: `${priorityColor}08`,
      padding: "10px 12px",
      display: "flex", gap: 10,
    }}>
      <div style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: 5,
        background: `${priorityColor}18`, border: `1px solid ${priorityColor}35`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.65rem", fontWeight: 800, color: priorityColor, fontFamily: "monospace",
      }}>
        {rec.priority}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 4px", fontSize: "0.82rem", color: "rgba(255,255,255,0.88)", fontWeight: 600 }}>
          {rec.action}
        </p>
        <p style={{ margin: "0 0 6px", fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
          {rec.rationale}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {rec.owner && (
            <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 4 }}>
              Owner: {rec.owner}
            </span>
          )}
          {rec.dueBy && (
            <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 4 }}>
              Due: {rec.dueBy}
            </span>
          )}
          <AutonomyTierBadge tier={rec.autonomyTier} />
        </div>
      </div>
    </div>
  );
}

const RISK_COLORS: Record<string, string> = {
  LOW: "#4eca8b",
  MEDIUM: "#c8a84b",
  HIGH: "#e8855b",
  CRITICAL: "#e53e3e",
};

function BriefView({ brief }: { brief: ExecBrief }) {
  const conf = Number(brief.confidence);
  const riskColor = RISK_COLORS[brief.overallRisk] ?? "#888";
  const domColor = DOMAIN_COLORS[brief.domain as Domain] ?? "#888";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{
        padding: "16px 20px",
        borderRadius: 10,
        background: "var(--pulse-bg-2)",
        border: "1px solid var(--pulse-border)",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: domColor }}>
            {DOMAIN_LABELS[brief.domain as Domain] ?? brief.domain}
          </span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
            {new Date(brief.generatedAt).toLocaleString()}
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
            <VerifierBadge status={brief.verifierStatus} feedback={brief.verifierFeedback} compact />
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px",
              borderRadius: 4, background: `${riskColor}12`, border: `1px solid ${riskColor}30`,
              fontSize: "0.6rem", fontWeight: 700, color: riskColor, textTransform: "uppercase",
            }}>
              {brief.overallRisk} RISK
            </div>
          </div>
        </div>

        <h2 style={{ margin: "0 0 8px", fontSize: "1.05rem", fontWeight: 700, color: "rgba(255,255,255,0.92)", lineHeight: 1.4 }}>
          {brief.headline}
        </h2>

        <p style={{ margin: "0 0 12px", fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
          {brief.situation}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
              Overall Confidence
            </span>
            <div style={{ width: 80 }}>
              <ConfidenceBar value={conf} />
            </div>
          </div>
          <AutonomyTierBadge tier={brief.autonomyTier} />
        </div>
      </div>

      {brief.verifierStatus === "revision_required" && brief.verifierFeedback && (
        <div style={{
          padding: "10px 14px", borderRadius: 7,
          background: "rgba(232,133,91,0.06)", border: "1px solid rgba(232,133,91,0.25)",
        }}>
          <VerifierBadge status="revision_required" feedback={brief.verifierFeedback} />
        </div>
      )}

      <div>
        <h3 style={{ margin: "0 0 10px", fontSize: "0.67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)" }}>
          What We Believe · {brief.whatWeBelieve.length} claims
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {brief.whatWeBelieve.map((b) => (
            <BeliefCard key={b.id} belief={b} citations={brief.whyCitations} />
          ))}
          {brief.whatWeBelieve.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>No belief statements generated.</p>
          )}
        </div>
      </div>

      {brief.whyCitations.length > 0 && (
        <div>
          <h3 style={{ margin: "0 0 10px", fontSize: "0.67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)" }}>
            Evidence Sources · {brief.whyCitations.length} citations
          </h3>
          <CitationPanel citations={brief.whyCitations} />
        </div>
      )}

      <div>
        <h3 style={{ margin: "0 0 10px", fontSize: "0.67rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)" }}>
          What We Recommend · {brief.whatWeRecommend.length} actions
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {brief.whatWeRecommend.map((r) => (
            <RecommendationCard key={r.id} rec={r} />
          ))}
          {brief.whatWeRecommend.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>No recommendations generated.</p>
          )}
        </div>
      </div>

      {brief.entityProvenance.length > 0 && (
        <div style={{
          padding: "10px 14px", borderRadius: 7,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{ fontSize: "0.63rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.25)", marginBottom: 7 }}>
            Entity Provenance · {brief.entityProvenance.length} entities sourced
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {brief.entityProvenance.slice(0, 10).map((e) => (
              <div key={e.entityId} style={{
                padding: "2px 7px", borderRadius: 4,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                fontSize: "0.6rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace",
              }}>
                {e.entityType} · {(e.confidence * 100).toFixed(0)}%
              </div>
            ))}
            {brief.entityProvenance.length > 10 && (
              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", padding: "2px 7px" }}>
                +{brief.entityProvenance.length - 10} more
              </div>
            )}
          </div>
        </div>
      )}

      {brief.briefingId && (
        <div style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
          Linked brief: {brief.briefingId} · Trace IDs: {brief.sourceTraceIds.length > 0 ? brief.sourceTraceIds.join(", ") : "none"}
        </div>
      )}
    </div>
  );
}

export default function BriefingEngine() {
  const [domain, setDomain] = useState<Domain>("consolidated");
  const qc = useQueryClient();

  const { data, isLoading, error } = useStandardQuery({
    queryKey: ["exec-brief", domain],
    queryFn: () => fetchExecBrief(domain),
    select: (d) => d.data,
    staleTime: 5 * 60 * 1000,
  });

  const generateMutation = useStandardMutation({
    mutationFn: () => generateExecBrief(domain),
    onSuccess: (result) => {
      qc.setQueryData(["exec-brief", domain], result);
    },
  });

  const brief = data;
  const isGenerating = generateMutation.isPending;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 880, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: "1.2rem", fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}>
              Briefing Engine
            </h1>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
              Evidence-first executive briefs · Cognitive runtime · Verifier-gated
            </p>
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={isGenerating}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 7,
              background: isGenerating ? "rgba(200,168,75,0.06)" : "rgba(200,168,75,0.1)",
              border: "1px solid rgba(200,168,75,0.25)",
              color: isGenerating ? "rgba(200,168,75,0.4)" : "#c8a84b",
              fontSize: "0.75rem", fontWeight: 600, cursor: isGenerating ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw size={13} style={{ animation: isGenerating ? "spin 1s linear infinite" : "none" }} />
            {isGenerating ? "Generating…" : "Generate New Brief"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {(Object.keys(DOMAIN_LABELS) as Domain[]).map((d) => {
            const active = d === domain;
            const color = DOMAIN_COLORS[d];
            return (
              <button
                key={d}
                onClick={() => setDomain(d)}
                style={{
                  padding: "5px 11px", borderRadius: 6,
                  background: active ? `${color}18` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? `${color}45` : "rgba(255,255,255,0.07)"}`,
                  color: active ? color : "rgba(255,255,255,0.45)",
                  fontSize: "0.7rem", fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {DOMAIN_LABELS[d]}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", fontFamily: "monospace", letterSpacing: "0.05em" }}>
              Loading brief from cognitive runtime…
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: "14px 16px", borderRadius: 7,
            background: "rgba(229,62,62,0.06)", border: "1px solid rgba(229,62,62,0.2)",
            color: "rgba(255,255,255,0.6)", fontSize: "0.8rem",
          }}>
            <AlertTriangle size={14} color="#e53e3e" style={{ display: "inline", marginRight: 6 }} />
            Failed to load brief — click Generate to create one.
          </div>
        )}

        {generateMutation.error && (
          <div style={{
            padding: "10px 14px", borderRadius: 7, marginBottom: 12,
            background: "rgba(229,62,62,0.06)", border: "1px solid rgba(229,62,62,0.2)",
            color: "rgba(255,255,255,0.55)", fontSize: "0.75rem",
          }}>
            Generation failed: {generateMutation.error instanceof Error ? generateMutation.error.message : "Unknown error"}
          </div>
        )}

        {brief && <BriefView brief={brief} />}
        {!brief && !isLoading && !error && (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <Target size={28} color="rgba(200,168,75,0.3)" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.35)" }}>
              No brief for this domain yet.
            </p>
            <button
              onClick={() => generateMutation.mutate()}
              style={{
                marginTop: 12, padding: "8px 18px", borderRadius: 7,
                background: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.3)",
                color: "#c8a84b", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
              }}
            >
              Generate First Brief <ArrowRight size={12} style={{ display: "inline" }} />
            </button>
          </div>
        )}
      </div>
  );
}
