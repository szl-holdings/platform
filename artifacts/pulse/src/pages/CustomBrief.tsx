import { useState } from "react";
import { FileText, Plus, X, Loader2, CheckCircle, ChevronRight } from "lucide-react";
import { AGENTS, type DomainKey } from "../lib/data";
import { useCustomBriefs, useRequestCustomBrief } from "../lib/api";
import AgentBadge from "../components/AgentBadge";

const DOMAIN_OPTIONS: { value: DomainKey; label: string; agentId: string }[] = [
  { value: "maritime", label: "Maritime", agentId: "helmsman" },
  { value: "security", label: "Security & Threats", agentId: "sentinel" },
  { value: "real_estate", label: "Real Estate", agentId: "terra" },
  { value: "legal", label: "Legal & Compliance", agentId: "lexis" },
  { value: "financial", label: "Financial & Portfolio", agentId: "atlas" },
  { value: "platform", label: "Platform Health", agentId: "beacon" },
];

const EXAMPLE_TOPICS = [
  "Impact of Red Sea disruption on SZL fleet profitability through Q3 2026",
  "Henderson acquisition regulatory risk — worst-case scenario analysis",
  "SZL Capital Fund III LP relations risk assessment",
  "Threat actor profile — TA505 campaign targeting financial firms",
  "Denver data center acquisition — competitive landscape and deal risk",
];

export default function CustomBrief() {
  const [topic, setTopic] = useState("");
  const [entity, setEntity] = useState("");
  const [scenario, setScenario] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<DomainKey[]>([]);

  const { data: requests } = useCustomBriefs();
  const requestBrief = useRequestCustomBrief();

  const toggleDomain = (d: DomainKey) => {
    setSelectedDomains(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const handleSubmit = () => {
    if (!topic.trim()) return;
    const domainsForRequest: DomainKey[] = selectedDomains.length > 0 ? selectedDomains : ["executive"];
    requestBrief.mutate(
      {
        topic: topic.trim(),
        entity: entity || undefined,
        scenario: scenario || undefined,
        domains: domainsForRequest,
      },
      {
        onSuccess: () => {
          setTopic("");
          setEntity("");
          setScenario("");
          setSelectedDomains([]);
        },
      }
    );
  };

  const status: "idle" | "submitting" = requestBrief.isPending ? "submitting" : "idle";
  const requestList = requests ?? [];

  return (
    <div style={{ padding: "28px 28px 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--pulse-text)", marginBottom: 6 }}>Custom Brief Builder</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--pulse-text-muted)" }}>
          Request a focused intelligence briefing on any entity, topic, or scenario. Nuro Mesh agents will synthesize a tailored brief.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
        {/* Form */}
        <div className="section-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pulse-text)", marginBottom: 18 }}>Brief Request</h3>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--pulse-text-muted)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Topic / Question *
            </label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. What is our exposure to Red Sea disruption through Q3 2026?"
              rows={3}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 6,
                background: "var(--pulse-bg)", border: "1px solid var(--pulse-border)",
                color: "var(--pulse-text)", fontSize: "0.88rem", lineHeight: 1.5,
                outline: "none", resize: "vertical", fontFamily: "inherit",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--pulse-gold-dim)")}
              onBlur={e => (e.target.style.borderColor = "var(--pulse-border)")}
            />
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: "0.68rem", color: "var(--pulse-text-muted)" }}>Examples: </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
                {EXAMPLE_TOPICS.slice(0, 3).map(ex => (
                  <button key={ex} onClick={() => setTopic(ex)} style={{
                    padding: "3px 8px", borderRadius: 4,
                    background: "rgba(255,255,255,0.04)", border: "1px solid var(--pulse-border)",
                    color: "var(--pulse-text-muted)", fontSize: "0.7rem", cursor: "pointer",
                    textAlign: "left",
                  }}>
                    {ex.length > 55 ? ex.slice(0, 55) + "…" : ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--pulse-text-muted)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Entity (optional)
              </label>
              <input
                value={entity}
                onChange={e => setEntity(e.target.value)}
                placeholder="e.g. MV Concordia Strait, Henderson acquisition…"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 6,
                  background: "var(--pulse-bg)", border: "1px solid var(--pulse-border)",
                  color: "var(--pulse-text)", fontSize: "0.85rem",
                  outline: "none", fontFamily: "inherit",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--pulse-gold-dim)")}
                onBlur={e => (e.target.style.borderColor = "var(--pulse-border)")}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--pulse-text-muted)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Scenario (optional)
              </label>
              <input
                value={scenario}
                onChange={e => setScenario(e.target.value)}
                placeholder="e.g. Best case / Worst case / Base case"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 6,
                  background: "var(--pulse-bg)", border: "1px solid var(--pulse-border)",
                  color: "var(--pulse-text)", fontSize: "0.85rem",
                  outline: "none", fontFamily: "inherit",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--pulse-gold-dim)")}
                onBlur={e => (e.target.style.borderColor = "var(--pulse-border)")}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--pulse-text-muted)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Domain Agents (leave empty for all)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DOMAIN_OPTIONS.map(d => {
                const selected = selectedDomains.includes(d.value);
                const agent = AGENTS[d.agentId];
                return (
                  <button
                    key={d.value}
                    onClick={() => toggleDomain(d.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 6,
                      background: selected ? agent?.bgColor : "var(--pulse-card)",
                      border: `1px solid ${selected ? agent?.borderColor : "var(--pulse-border)"}`,
                      color: selected ? agent?.color : "var(--pulse-text-muted)",
                      fontSize: "0.78rem", cursor: "pointer", fontWeight: selected ? 600 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: agent?.color }} />}
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!topic.trim() || status === "submitting"}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 6,
              background: topic.trim() ? "rgba(200,168,75,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${topic.trim() ? "rgba(200,168,75,0.4)" : "var(--pulse-border)"}`,
              color: topic.trim() ? "var(--pulse-gold)" : "var(--pulse-text-muted)",
              fontSize: "0.85rem", fontWeight: 600, cursor: topic.trim() ? "pointer" : "default",
            }}
          >
            {status === "submitting" ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <FileText size={15} />}
            {status === "submitting" ? "Submitting…" : "Request Brief"}
            {topic.trim() && status === "idle" && <ChevronRight size={14} />}
          </button>
        </div>

        {/* Request history */}
        <div>
          <h3 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--pulse-text-muted)", marginBottom: 12 }}>
            Request Queue
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {requestList.map(req => (
              <div key={req.id} className="section-card" style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                    background: req.status === "complete" ? "rgba(78,202,139,0.1)" : "rgba(200,168,75,0.1)",
                    color: req.status === "complete" ? "#4eca8b" : "#c8a84b",
                    border: `1px solid ${req.status === "complete" ? "rgba(78,202,139,0.3)" : "rgba(200,168,75,0.3)"}`,
                  }}>
                    {req.status === "complete" ? "✓ Complete" : "⟳ Generating"}
                  </span>
                  <span style={{ fontSize: "0.67rem", color: "var(--pulse-text-muted)" }}>
                    {new Date(req.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--pulse-text)", lineHeight: 1.5, marginBottom: 8 }}>{req.topic}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {req.domains.map(d => {
                    const opt = DOMAIN_OPTIONS.find(o => o.value === d);
                    return opt ? <AgentBadge key={d} agentId={opt.agentId} size="sm" /> : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
