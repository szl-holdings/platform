import { useState } from "react";
import { MessageSquare, Send, Scale, FileText, Clock, AlertTriangle, Sparkles } from "lucide-react";

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
  },
];

export default function CopilotPage() {
  const [messages, setMessages] = useState(DEMO_CONVERSATION);
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-white/[0.06] px-6 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#d4a054]" />
          <h1 className="text-sm font-semibold text-slate-200">PRISM Copilot</h1>
          <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
            ALPHA
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">Source-grounded matter intelligence — every assertion traceable to evidence</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Scale className="w-8 h-8 text-[#d4a054]/30 mx-auto mb-3" />
              <h2 className="text-sm text-slate-300 mb-1">Ask about your matters</h2>
              <p className="text-[10px] text-slate-500">Copilot answers are grounded in matter data with source citations</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
              {SUGGESTED_QUERIES.map((q, i) => {
                const Icon = q.icon;
                return (
                  <button
                    key={i}
                    className="flex items-start gap-2 p-3 rounded-lg border border-white/[0.06] text-left hover:border-white/[0.12] transition-colors"
                    style={{ background: "#0c1220" }}
                  >
                    <Icon className="w-3.5 h-3.5 text-[#d4a054] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-[#d4a054] uppercase mb-0.5">{q.category}</div>
                      <div className="text-[11px] text-slate-300">{q.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-2xl rounded-lg p-4 ${
                msg.role === "user"
                  ? "bg-[#d4a054]/10 border border-[#d4a054]/20"
                  : "border border-white/[0.06]"
              }`}
              style={msg.role === "assistant" ? { background: "#0c1220" } : undefined}
            >
              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {msg.content.split("\n").map((line, li) => {
                  if (line.startsWith("**") && line.endsWith("**")) {
                    return <div key={li} className="font-semibold text-slate-100 mt-2 first:mt-0">{line.replace(/\*\*/g, "")}</div>;
                  }
                  if (line.startsWith("*") && line.endsWith("*")) {
                    return <div key={li} className="text-[10px] text-slate-500 italic">{line.replace(/\*/g, "")}</div>;
                  }
                  if (line.match(/^\d+\./)) {
                    return <div key={li} className="ml-2 mt-1">{line}</div>;
                  }
                  return <div key={li}>{line}</div>;
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a matter, deadline, or evidence..."
            className="flex-1 px-4 py-2.5 rounded-lg text-xs bg-white/[0.04] border border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#d4a054]/40"
          />
          <button className="p-2.5 rounded-lg bg-[#d4a054]/10 border border-[#d4a054]/20 text-[#d4a054] hover:bg-[#d4a054]/20 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-slate-600 text-center mt-2">
          Copilot outputs are AI-generated and require attorney review. All assertions include source citations. Not legal advice.
        </p>
      </div>
    </div>
  );
}
