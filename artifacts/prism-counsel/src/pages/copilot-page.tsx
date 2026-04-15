import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Scale, FileText, Clock, AlertTriangle, Sparkles, Shield, CheckCircle2 } from "lucide-react";

const ACCENT = "#d4a054";

const SUGGESTED_QUERIES = [
  { icon: FileText, label: "Summarize insurer correspondence for Rodriguez matter", category: "Summary" },
  { icon: Clock, label: "What deadlines are at risk in the next 30 days?", category: "Deadlines" },
  { icon: AlertTriangle, label: "Show missing evidence before demand finalization", category: "Evidence" },
  { icon: Sparkles, label: "Draft internal matter status update for Thompson case", category: "Draft" },
  { icon: Scale, label: "Why did the settlement forecast change for Meridian?", category: "Forecast" },
  { icon: FileText, label: "List conflicting facts in Rodriguez treatment history", category: "Integrity" },
];

const DEMO_CONVERSATION = [
  {
    role: "user" as const,
    content: "Summarize all insurer communications for Rodriguez v. National General in the last 90 days.",
  },
  {
    role: "assistant" as const,
    content: `**Insurer Communications Summary — Rodriguez v. National General**
*Last 90 days (Jan 3 – Apr 3, 2026)*

**3 communications identified:**

1. **Jan 15, 2026** — Counter-offer from adjuster Karen Mitchell
   - Increased offer from $45K to $95K
   - Cited "review of additional medical documentation"
   - No mention of IME or disputed treatment

2. **Feb 12, 2026** — Reserve update notification
   - Hartford internal reserve adjustment noted in claim file
   - Suggests upward reserve movement (positive signal)

3. **Mar 5, 2026** — IME scheduling request
   - Defense counsel requested IME with Dr. Whitmore (orthopedic)
   - Scheduled for April 15, 2026
   - Typical defense strategy for cases approaching demand threshold

**Assessment:**
Offer trajectory is positive (111% increase over 3 months). The IME scheduling suggests the carrier is evaluating the case seriously rather than low-balling. Recommend preparing client for IME and finalizing demand package before mediation.

*Sources: Matter communications log, offer trail, deadline calendar*
*Confidence: High (3/3 communications verified against source records)*`,
    confidence: 94,
    sources: 3,
  },
];

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: "4px", padding: "14px 16px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: ACCENT,
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            opacity: 0.7,
          }}
        />
      ))}
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const color = confidence >= 90 ? "#10b981" : confidence >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.625rem", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b" }}>Confidence</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color }}>{confidence}%</span>
      </div>
      <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ width: `${confidence}%`, height: "100%", background: `linear-gradient(90deg, ${color}80, ${color})`, borderRadius: "2px" }} />
      </div>
    </div>
  );
}

export default function CopilotPage() {
  const [messages, setMessages] = useState(DEMO_CONVERSATION as typeof DEMO_CONVERSATION);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: "I'm analyzing the matter record for relevant data. In a live environment, this response would be grounded in your case management system with full source citations.",
          confidence: 72,
          sources: 0,
        },
      ]);
    }, 1800);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#070b14" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem 1.5rem", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: `${ACCENT}15`, border: `1px solid ${ACCENT}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={13} style={{ color: ACCENT }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h1 style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>PRISM Copilot</h1>
                <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "9px", fontWeight: 700, background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}22`, letterSpacing: "0.05em" }}>ALPHA</span>
              </div>
              <p style={{ fontSize: "10px", color: "#475569", marginTop: "1px" }}>Source-grounded matter intelligence — every assertion traceable to evidence</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "9px", color: "#10b981", fontWeight: 600, letterSpacing: "0.08em" }}>
            <Shield size={10} />
            VERIFIED SOURCES
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <Scale size={32} style={{ color: `${ACCENT}50`, margin: "0 auto 0.75rem" }} />
              <h2 style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "0.375rem", fontWeight: 600 }}>Ask about your matters</h2>
              <p style={{ fontSize: "10px", color: "#475569" }}>Copilot answers are grounded in matter data with source citations</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", maxWidth: "640px", margin: "0 auto", width: "100%" }}>
              {SUGGESTED_QUERIES.map((q, i) => {
                const Icon = q.icon;
                return (
                  <button
                    key={i}
                    onClick={() => setInput(q.label)}
                    style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.75rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "left", background: "#0c1220", cursor: "pointer", transition: "border-color 0.18s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${ACCENT}30`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                  >
                    <Icon size={12} style={{ color: ACCENT, marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "9px", color: ACCENT, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "2px", fontWeight: 600 }}>{q.category}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>{q.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "640px",
              borderRadius: "12px",
              padding: "0.875rem 1rem",
              background: msg.role === "user" ? `${ACCENT}12` : "#0c1220",
              border: msg.role === "user" ? `1px solid ${ACCENT}22` : "1px solid rgba(255,255,255,0.06)",
              position: "relative",
            }}>
              {msg.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "0.5rem" }}>
                  <Sparkles size={10} style={{ color: ACCENT }} />
                  <span style={{ fontSize: "9px", fontWeight: 600, color: ACCENT, letterSpacing: "0.08em", textTransform: "uppercase" }}>PRISM Copilot</span>
                  {(msg as any).sources > 0 && (
                    <span style={{ marginLeft: "0.25rem", fontSize: "9px", color: "#10b981", display: "flex", alignItems: "center", gap: "3px" }}>
                      <CheckCircle2 size={9} /> {(msg as any).sources} sources verified
                    </span>
                  )}
                </div>
              )}
              <div style={{ fontSize: "12px", color: "#e2e8f0", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                {msg.content.split("\n").map((line, li) => {
                  if (line.startsWith("**") && line.endsWith("**")) {
                    return <div key={li} style={{ fontWeight: 700, color: "#f1f5f9", marginTop: li > 0 ? "0.5rem" : 0 }}>{line.replace(/\*\*/g, "")}</div>;
                  }
                  if (line.startsWith("*") && line.endsWith("*")) {
                    return <div key={li} style={{ fontSize: "10px", color: "#64748b", fontStyle: "italic", marginTop: "0.25rem" }}>{line.replace(/\*/g, "")}</div>;
                  }
                  if (line.match(/^\d+\./)) {
                    return <div key={li} style={{ marginLeft: "0.5rem", marginTop: "0.25rem" }}>{line}</div>;
                  }
                  return <div key={li}>{line}</div>;
                })}
              </div>
              {msg.role === "assistant" && (msg as any).confidence !== undefined && (
                <ConfidenceBar confidence={(msg as any).confidence} />
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ borderRadius: "12px", background: "#0c1220", border: "1px solid rgba(255,255,255,0.06)" }}>
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1rem 1.5rem", background: "rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", maxWidth: "768px", margin: "0 auto" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about a matter, deadline, or evidence..."
            style={{
              flex: 1, padding: "0.625rem 1rem", borderRadius: "10px", fontSize: "12px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#e2e8f0", outline: "none", transition: "border-color 0.18s",
            }}
            onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${ACCENT}40`; }}
            onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              padding: "0.625rem 0.75rem", borderRadius: "10px", background: `${ACCENT}15`, border: `1px solid ${ACCENT}25`,
              color: ACCENT, cursor: input.trim() ? "pointer" : "not-allowed", transition: "all 0.18s",
              opacity: input.trim() ? 1 : 0.4,
            }}
            onMouseEnter={(e) => { if (input.trim()) (e.currentTarget as HTMLElement).style.background = `${ACCENT}25`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${ACCENT}15`; }}
          >
            <Send size={15} />
          </button>
        </div>
        <p style={{ fontSize: "9px", color: "#334155", textAlign: "center", marginTop: "0.5rem" }}>
          Copilot outputs are AI-generated and require attorney review. All assertions include source citations. Not legal advice.
        </p>
      </div>
    </div>
  );
}
