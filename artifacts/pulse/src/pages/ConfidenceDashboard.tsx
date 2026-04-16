import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { getConfidenceLabel } from "../lib/data";
import { useConfidenceHistory, useTodaysBrief, type ConfidenceHistoryEntry } from "../lib/api";
import AgentBadge from "../components/AgentBadge";
import ConfidenceChip from "../components/ConfidenceChip";

type DomainMetricKey = "maritime" | "security" | "real_estate" | "legal" | "financial" | "platform";

const DOMAIN_COLORS: Record<string, string> = {
  maritime: "#5090e8",
  security: "#e05050",
  real_estate: "#4eca8b",
  legal: "#9b70e8",
  financial: "#e08c40",
  platform: "#40c8d8",
};

const RUBRIC_DIMS = [
  { key: "Evidence Quantity", weight: "20%", desc: "How much evidence is available?" },
  { key: "Evidence Quality", weight: "25%", desc: "Reliability and directness of sources" },
  { key: "Source Diversity", weight: "15%", desc: "Do multiple independent sources corroborate?" },
  { key: "Logical Coherence", weight: "25%", desc: "Does evidence logically support conclusions?" },
  { key: "Assumption Defensibility", weight: "15%", desc: "How well-grounded are key assumptions?" },
];

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d1220", border: "1px solid #1a2035", borderRadius: 6, padding: "10px 14px" }}>
      <div style={{ fontSize: "0.72rem", color: "#8a96b0", marginBottom: 6 }}>{String(label ?? "")}</div>
      {payload.map((p) => {
        const key = String(p.dataKey ?? p.name ?? "");
        const num = typeof p.value === "number" ? p.value : Number(p.value ?? 0);
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
            <span style={{ fontSize: "0.75rem", color: "#e8edf8", textTransform: "capitalize" }}>
              {key.replace("_", " ")}: <strong>{Math.round(num * 100)}%</strong>
            </span>
          </div>
        );
      })}
    </div>
  );
};

function AgentConfidenceCard({ agentId, domainKey, history }: { agentId: string; domainKey: DomainMetricKey; history: ConfidenceHistoryEntry[] }) {
  const latest = history[history.length - 1];
  const prevEntry = history[history.length - 2];
  const score = latest?.[domainKey] ?? 0;
  const prev = prevEntry?.[domainKey] ?? 0;
  const delta = score - prev;
  const label = getConfidenceLabel(score);

  return (
    <div style={{
      padding: "14px 16px", borderRadius: 8,
      background: "var(--pulse-card)", border: "1px solid var(--pulse-border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <AgentBadge agentId={agentId} />
        <ConfidenceChip score={score} label={label} />
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--pulse-text)", marginBottom: 4 }}>
        {Math.round(score * 100)}<span style={{ fontSize: "1rem", color: "var(--pulse-text-muted)" }}>%</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem" }}>
        <span style={{ color: delta >= 0 ? "#4eca8b" : "#e05050", fontWeight: 600 }}>
          {delta >= 0 ? "▲" : "▼"}{Math.abs(Math.round(delta * 100))}%
        </span>
        <span style={{ color: "var(--pulse-text-muted)" }}>vs yesterday</span>
      </div>

      {/* Mini bar chart */}
      <div style={{ marginTop: 10, display: "flex", gap: 3, alignItems: "flex-end", height: 28 }}>
        {history.map((day, i) => {
          const v = day[domainKey] ?? 0;
          const h = Math.round(v * 28);
          const isLast = i === history.length - 1;
          return (
            <div key={i} style={{
              flex: 1, height: `${h}px`, borderRadius: 2,
              background: isLast ? DOMAIN_COLORS[domainKey] : `${DOMAIN_COLORS[domainKey]}50`,
            }} />
          );
        })}
      </div>
    </div>
  );
}

export default function ConfidenceDashboard() {
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  const { data: history } = useConfidenceHistory();
  const { data: latestBrief } = useTodaysBrief();
  const confidenceHistory = history ?? [];

  return (
    <div style={{ padding: "28px 28px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--pulse-text)", marginBottom: 6 }}>Confidence Dashboard</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--pulse-text-muted)" }}>
          Tradecraft confidence trends by domain — evidence quantity, quality, diversity, coherence, and assumption defensibility
        </p>
      </div>

      {/* Agent confidence cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        <AgentConfidenceCard agentId="helmsman" domainKey="maritime" history={confidenceHistory} />
        <AgentConfidenceCard agentId="sentinel" domainKey="security" history={confidenceHistory} />
        <AgentConfidenceCard agentId="terra" domainKey="real_estate" history={confidenceHistory} />
        <AgentConfidenceCard agentId="lexis" domainKey="legal" history={confidenceHistory} />
        <AgentConfidenceCard agentId="atlas" domainKey="financial" history={confidenceHistory} />
        <AgentConfidenceCard agentId="beacon" domainKey="platform" history={confidenceHistory} />
      </div>

      {/* Confidence trend chart */}
      <div className="section-card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pulse-text)", marginBottom: 3 }}>7-Day Confidence Trends</h3>
            <p style={{ fontSize: "0.75rem", color: "var(--pulse-text-muted)" }}>Rolling confidence scores by domain agent (0–100%)</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={confidenceHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2035" />
            <XAxis dataKey="date" stroke="#546078" tick={{ fontSize: 11, fill: "#546078" }} />
            <YAxis
              stroke="#546078"
              tick={{ fontSize: 11, fill: "#546078" }}
              domain={[0.55, 1.0]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(v) => <span style={{ fontSize: "0.72rem", color: "#8a96b0", textTransform: "capitalize" }}>{v.replace("_", " ")}</span>}
            />
            {Object.entries(DOMAIN_COLORS).map(([domain, color]) => (
              <Line
                key={domain}
                type="monotone"
                dataKey={domain}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tradecraft rubric */}
      <div className="section-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pulse-text)", marginBottom: 4 }}>Tradecraft Confidence Rubric</h3>
        <p style={{ fontSize: "0.75rem", color: "var(--pulse-text-muted)", marginBottom: 16 }}>
          Five dimensions scored independently and weighted to produce the final confidence score for each assessment
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {RUBRIC_DIMS.map(dim => (
            <div
              key={dim.key}
              onClick={() => setSelectedDimension(selectedDimension === dim.key ? null : dim.key)}
              style={{
                padding: "12px 14px", borderRadius: 6,
                background: selectedDimension === dim.key ? "rgba(200,168,75,0.06)" : "rgba(0,0,0,0.15)",
                border: `1px solid ${selectedDimension === dim.key ? "rgba(200,168,75,0.25)" : "var(--pulse-border)"}`,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 4,
                    background: "rgba(200,168,75,0.1)", border: "1px solid rgba(200,168,75,0.25)",
                    fontSize: "0.68rem", fontWeight: 700, color: "var(--pulse-gold)",
                    fontFamily: "JetBrains Mono, monospace",
                  }}>{dim.weight}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--pulse-text)" }}>{dim.key}</span>
                </div>
              </div>
              {selectedDimension === dim.key && (
                <p style={{ fontSize: "0.8rem", color: "var(--pulse-text-muted)", marginTop: 8, lineHeight: 1.5 }}>{dim.desc}</p>
              )}
            </div>
          ))}
        </div>

        {/* Today's confidence breakdown for latest brief */}
        {latestBrief && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--pulse-border)" }}>
            <h4 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--pulse-text-dim)", marginBottom: 12 }}>
              Today's Brief — Section Confidence Breakdown
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {latestBrief.sections.map(section => (
                <div key={section.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--pulse-text-muted)", width: 140, flexShrink: 0, textTransform: "capitalize" }}>{section.title}</span>
                  <div style={{ flex: 1, height: 6, background: "var(--pulse-border)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${Math.round(section.confidence * 100)}%`,
                      background: section.confidenceLabel === "HIGH" ? "#4eca8b" : section.confidenceLabel === "MODERATE" ? "#c8a84b" : "#e05050",
                      borderRadius: 3,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: "0.72rem", color: "var(--pulse-text-dim)", fontWeight: 600, width: 36, textAlign: "right" }}>
                    {Math.round(section.confidence * 100)}%
                  </span>
                  <ConfidenceChip score={section.confidence} label={section.confidenceLabel} showScore={false} size="sm" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
