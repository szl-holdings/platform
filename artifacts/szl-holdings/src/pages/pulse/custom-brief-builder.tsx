import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, Zap, Plus, X, ChevronRight, Clock, CheckCircle2,
  AlertCircle, Loader2, Ship, Shield, Activity, Bot, Star, Scale, Brain,
} from "lucide-react";
import { AGENT_META, confidenceColor, pulseFetch, timeAgo } from "./pulse-utils";
import { Link } from "wouter";

const TEXT = { primary: "hsl(38 8% 95%)", secondary: "hsl(214 7% 64%)", muted: "hsl(214 6% 42%)", faint: "hsl(214 5% 30%)" };
const BG = { surface: "hsla(214 12% 10% / 0.75)", card: "hsla(214 14% 6% / 0.95)" };
const BORDER = { subtle: "hsla(0 0% 100% / 0.055)" };
const PULSE_ACCENT = "hsl(191 92% 44%)";
const PULSE_DIM = "hsla(191 92% 44% / 0.10)";
const PULSE_BORDER = "hsla(191 92% 44% / 0.20)";

const AVAILABLE_AGENTS = Object.entries(AGENT_META).filter(([id]) => id !== "alloy").map(([id, meta]) => ({ id, ...meta }));
const AVAILABLE_DOMAINS = ["maritime", "security", "analytics", "legal", "infrastructure", "research", "real-estate", "readiness"];

const EXAMPLE_BRIEFS = [
  { topic: "Vessel IMO-9847231 and its owner portfolio — cross-domain risk assessment", entities: ["IMO-9847231", "Golden Star Shipping Ltd"], domains: ["maritime", "legal", "real-estate"], agents: ["helmsman", "beacon", "sentinel"] },
  { topic: "Regulatory compliance exposure across all active PRISM matters in maritime sector", entities: [], domains: ["legal", "maritime"], agents: ["sentinel", "helmsman"] },
  { topic: "Platform security posture and infrastructure threat landscape", entities: [], domains: ["security", "infrastructure"], agents: ["sentinel", "zeus"] },
  { topic: "Real estate portfolio distress signals and market risk assessment Q2 2026", entities: [], domains: ["real-estate", "analytics"], agents: ["beacon"] },
];

type CustomRequest = {
  id: string; topic: string; entities: string[]; domains: string[]; agents: string[];
  requestedBy: string; requestedAt: string; status: string; briefId: string | null;
};

export default function CustomBriefBuilder() {
  const [topic, setTopic] = useState("");
  const [entityInput, setEntityInput] = useState("");
  const [entities, setEntities] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [requestedBy, setRequestedBy] = useState("Operator");
  const queryClient = useQueryClient();

  const { data: requestsData } = useQuery({
    queryKey: ["pulse-custom-requests"],
    queryFn: () => pulseFetch<{ requests: CustomRequest[] }>("/pulse/custom/requests"),
    refetchInterval: 10000,
  });

  const generateMutation = useMutation({
    mutationFn: () => pulseFetch<{ brief: { id: string } }>("/pulse/briefs/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, entities, domains: selectedDomains, agents: selectedAgents, requestedBy }),
    }),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ["pulse-custom-requests"] });
      queryClient.invalidateQueries({ queryKey: ["pulse-library"] });
      setTopic(""); setEntities([]); setSelectedDomains([]); setSelectedAgents([]);
    },
  });

  function addEntity() {
    const v = entityInput.trim();
    if (v && !entities.includes(v)) {
      setEntities(prev => [...prev, v]);
      setEntityInput("");
    }
  }

  function toggleDomain(d: string) {
    setSelectedDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  function toggleAgent(id: string) {
    setSelectedAgents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function applyExample(ex: typeof EXAMPLE_BRIEFS[0]) {
    setTopic(ex.topic);
    setEntities(ex.entities);
    setSelectedDomains(ex.domains);
    setSelectedAgents(ex.agents);
  }

  const requests: CustomRequest[] = requestsData?.requests ?? [];
  const latestBriefId = generateMutation.data?.brief?.id;
  const canSubmit = topic.trim().length > 10 && !generateMutation.isPending;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: "var(--font-display, Space Grotesk, sans-serif)", fontWeight: 700, fontSize: 22, color: TEXT.primary, marginBottom: "0.375rem" }}>Custom Brief Builder</h1>
        <p style={{ fontSize: 14, color: TEXT.secondary }}>Request a focused intelligence product on any entity, topic, or scenario</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", alignItems: "flex-start" }}>
        {/* Builder form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Topic */}
          <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.25rem" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.625rem" }}>
              Intelligence Request *
            </label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Brief me on everything related to Vessel X and its owner's portfolio…"
              rows={3}
              style={{
                width: "100%", padding: "0.75rem", borderRadius: 8, border: `1px solid hsla(0 0% 100% / 0.08)`,
                background: "hsla(214 12% 10% / 0.6)", color: TEXT.primary, fontSize: 14, lineHeight: 1.55,
                outline: "none", resize: "vertical", fontFamily: "inherit",
                borderColor: topic.length > 0 ? PULSE_BORDER : "hsla(0 0% 100% / 0.08)",
              }}
            />
            <div style={{ fontSize: 12, color: TEXT.muted, marginTop: "0.375rem" }}>Minimum 10 characters. Be specific — the more context, the better the briefing.</div>
          </div>

          {/* Entities */}
          <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.25rem" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.625rem" }}>
              Focus Entities (optional)
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                value={entityInput}
                onChange={e => setEntityInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addEntity(); } }}
                placeholder="Entity name, IMO number, company…"
                style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: 7, border: "1px solid hsla(0 0% 100% / 0.08)", background: "hsla(214 12% 10% / 0.6)", color: TEXT.primary, fontSize: 13, outline: "none" }}
              />
              <button onClick={addEntity} style={{ padding: "0.5rem 0.875rem", borderRadius: 7, border: `1px solid ${PULSE_BORDER}`, background: PULSE_DIM, color: PULSE_ACCENT, fontSize: 13, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.375rem" }}>
                <Plus size={14} />Add
              </button>
            </div>
            {entities.length > 0 && (
              <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginTop: "0.625rem" }}>
                {entities.map(e => (
                  <span key={e} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "3px 8px", borderRadius: 5, background: PULSE_DIM, color: PULSE_ACCENT, border: `1px solid ${PULSE_BORDER}`, fontSize: 12 }}>
                    {e}
                    <button onClick={() => setEntities(prev => prev.filter(x => x !== e))} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", padding: 0 }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Domains */}
          <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.25rem" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.625rem" }}>
              Domains (leave empty for all)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {AVAILABLE_DOMAINS.map(d => {
                const active = selectedDomains.includes(d);
                return (
                  <button key={d} onClick={() => toggleDomain(d)} style={{
                    padding: "0.375rem 0.75rem", borderRadius: 6, border: `1px solid ${active ? PULSE_BORDER : "hsla(0 0% 100% / 0.08)"}`,
                    background: active ? PULSE_DIM : "hsla(214 12% 10% / 0.6)", color: active ? PULSE_ACCENT : TEXT.secondary,
                    fontSize: 12, cursor: "pointer", fontWeight: active ? 600 : 400, textTransform: "capitalize",
                  }}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agents */}
          <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.25rem" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.625rem" }}>
              Contributing Agents (leave empty for auto-routing)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.375rem" }}>
              {AVAILABLE_AGENTS.map(agent => {
                const active = selectedAgents.includes(agent.id);
                return (
                  <button key={agent.id} onClick={() => toggleAgent(agent.id)} style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.5rem 0.75rem", borderRadius: 7, border: `1px solid ${active ? agent.color + "40" : "hsla(0 0% 100% / 0.08)"}`,
                    background: active ? `${agent.color}12` : "hsla(214 12% 10% / 0.6)", cursor: "pointer", textAlign: "left",
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: agent.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: active ? agent.color : TEXT.secondary, fontWeight: active ? 600 : 400 }}>{agent.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Requested by + Submit */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.5rem" }}>Requested By</label>
              <input
                value={requestedBy}
                onChange={e => setRequestedBy(e.target.value)}
                style={{ width: "100%", padding: "0.625rem 0.875rem", borderRadius: 8, border: "1px solid hsla(0 0% 100% / 0.08)", background: "hsla(214 12% 10% / 0.6)", color: TEXT.primary, fontSize: 13, outline: "none" }}
              />
            </div>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={!canSubmit}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.5rem", borderRadius: 8, border: "none",
                background: canSubmit ? `linear-gradient(135deg, ${PULSE_ACCENT}, hsl(218 70% 52%))` : "hsla(214 12% 10% / 0.6)",
                color: canSubmit ? "hsl(214 18% 3%)" : TEXT.muted, fontSize: 14, fontWeight: 700, cursor: canSubmit ? "pointer" : "default",
                transition: "all 0.15s ease",
              }}
            >
              {generateMutation.isPending ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={16} />}
              {generateMutation.isPending ? "Generating…" : "Generate Brief"}
            </button>
          </div>

          {/* Success */}
          <AnimatePresence>
            {generateMutation.isSuccess && latestBriefId && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: "1rem 1.25rem", borderRadius: 10, background: "hsla(160 65% 42% / 0.08)", border: "1px solid hsla(160 65% 42% / 0.25)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <CheckCircle2 size={18} style={{ color: "hsl(160 65% 48%)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: TEXT.primary }}>Brief generated successfully</div>
                  <div style={{ fontSize: 12, color: TEXT.secondary }}>Your intelligence product is ready to review.</div>
                </div>
                <Link href={`/pulse/brief/${latestBriefId}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: 13, color: "hsl(160 65% 48%)", cursor: "pointer", fontWeight: 600 }}>
                    View Brief <ChevronRight size={14} />
                  </div>
                </Link>
              </motion.div>
            )}
            {generateMutation.isError && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: "1rem 1.25rem", borderRadius: 10, background: "hsla(2 70% 50% / 0.08)", border: "1px solid hsla(2 70% 50% / 0.25)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <AlertCircle size={18} style={{ color: "hsl(2 70% 60%)", flexShrink: 0 }} />
                <div style={{ fontSize: 14, color: TEXT.secondary }}>Generation failed. The Nuro Mesh agents may be temporarily unavailable — please try again.</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Examples */}
          <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.125rem" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.75rem" }}>Example Requests</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {EXAMPLE_BRIEFS.map((ex, i) => (
                <button key={i} onClick={() => applyExample(ex)} style={{
                  width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid hsla(0 0% 100% / 0.07)",
                  background: "hsla(214 12% 10% / 0.6)", cursor: "pointer", textAlign: "left",
                  color: TEXT.secondary, fontSize: 12, lineHeight: 1.5, transition: "all 0.12s ease",
                }}>
                  <div style={{ fontWeight: 600, color: TEXT.primary, marginBottom: "0.25rem", fontSize: 12 }}>{ex.topic.slice(0, 60)}…</div>
                  <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                    {ex.domains.map(d => <span key={d} style={{ fontSize: 10, padding: "1px 5px", borderRadius: 3, background: PULSE_DIM, color: PULSE_ACCENT }}>{d}</span>)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent requests */}
          {requests.length > 0 && (
            <div style={{ background: BG.card, border: `1px solid ${BORDER.subtle}`, borderRadius: 10, padding: "1.125rem" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.75rem" }}>Recent Requests</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {requests.slice(0, 5).map(req => (
                  <div key={req.id} style={{ padding: "0.625rem", borderRadius: 7, border: "1px solid hsla(0 0% 100% / 0.05)", background: "hsla(214 12% 10% / 0.5)" }}>
                    <div style={{ fontSize: 12, color: TEXT.primary, marginBottom: "0.25rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{req.topic}</div>
                    <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", fontSize: 11 }}>
                      <span style={{
                        padding: "1px 5px", borderRadius: 3, fontWeight: 600,
                        background: req.status === "complete" ? "hsla(160 65% 42% / 0.10)" : req.status === "failed" ? "hsla(2 70% 50% / 0.10)" : PULSE_DIM,
                        color: req.status === "complete" ? "hsl(160 65% 48%)" : req.status === "failed" ? "hsl(2 70% 60%)" : PULSE_ACCENT,
                      }}>{req.status}</span>
                      <span style={{ color: TEXT.faint }}>{timeAgo(req.requestedAt)}</span>
                    </div>
                    {req.briefId && req.status === "complete" && (
                      <Link href={`/pulse/brief/${req.briefId}`}>
                        <div style={{ fontSize: 11, color: PULSE_ACCENT, marginTop: "0.25rem", cursor: "pointer" }}>View brief →</div>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
