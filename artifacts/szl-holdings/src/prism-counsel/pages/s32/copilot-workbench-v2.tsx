import { useState, useRef, useEffect } from "react";
import { Brain, Sparkles, Send, Loader2, FileText, TrendingUp, MessageSquare, AlertTriangle, CheckSquare, Search, Package, Shield, ChevronDown, X } from "lucide-react";
import { useCopilotSessions, useCopilotHistory, useCopilotCreateSession, useCopilotSendMessage } from "../../hooks/use-prism-s31";
import { DEMO_MATTERS } from "../../data/demo-matters";

const ACTION_CARDS = [
  {
    id: "summarize",
    label: "Summarize",
    icon: FileText,
    color: "#4a90b8",
    description: "Plain-language summary of a matter or document",
    defaultPrompt: "Summarize the current status and key facts of this matter in plain language",
  },
  {
    id: "explain",
    label: "Explain",
    icon: MessageSquare,
    color: "#8b7ac8",
    description: "Explain a document, claim, or situation clearly",
    defaultPrompt: "Explain what this document means and why it matters to the case",
  },
  {
    id: "compare",
    label: "Compare",
    icon: TrendingUp,
    color: "#d4a054",
    description: "Compare offers, records, or positions",
    defaultPrompt: "Compare the current demand with the latest carrier offer and explain the gap",
  },
  {
    id: "prepare",
    label: "Prepare",
    icon: Package,
    color: "#c8953c",
    description: "Prepare a demand, memo, or mediation packet",
    defaultPrompt: "Prepare a demand summary for this matter based on current damages and evidence",
  },
  {
    id: "review",
    label: "Review",
    icon: Search,
    color: "#4a90b8",
    description: "Review a draft for accuracy, support, and completeness",
    defaultPrompt: "Review this draft and identify any unsupported statements, gaps, or contradictions",
  },
  {
    id: "flag-risk",
    label: "Flag Risk",
    icon: AlertTriangle,
    color: "#c45a4a",
    description: "Flag risks, deadline concerns, or friction sources",
    defaultPrompt: "Identify all risks, deadline concerns, and friction sources in this matter right now",
  },
  {
    id: "next-steps",
    label: "Suggest Next Steps",
    icon: ChevronDown,
    color: "#d4a054",
    description: "Recommend the most impactful actions to take now",
    defaultPrompt: "What are the 3 most impactful actions to take on this matter in the next 24 hours?",
  },
  {
    id: "assemble-packet",
    label: "Assemble Packet",
    icon: Package,
    color: "#8b7ac8",
    description: "Assemble a demand, mediation, or partner packet",
    defaultPrompt: "Assemble the key facts, evidence, and timeline into a mediation packet structure",
  },
  {
    id: "show-blockers",
    label: "Show Blockers",
    icon: X,
    color: "#c45a4a",
    description: "Surface what is blocking settlement or progress",
    defaultPrompt: "What is blocking settlement on this matter? List all friction sources and blockers",
  },
  {
    id: "recovery-lien-deps",
    label: "Recovery / Lien Deps",
    icon: Shield,
    color: "#c45a4a",
    description: "Active liens, lifecycle state, stale amounts, dependency timeline",
    defaultPrompt: "Show recovery and lien dependencies for this matter — active liens, lifecycle state, stale amounts, and what blocks settlement",
  },
  {
    id: "recovery-memo",
    label: "Draft Recovery Memo",
    icon: FileText,
    color: "#8b7ac8",
    description: "Generate a recovery dependency memo for this matter",
    defaultPrompt: "Draft a recovery dependency memo documenting lien positions, lifecycle state, and settlement impact for this matter",
  },
  {
    id: "missing-support",
    label: "Show Missing Support",
    icon: Shield,
    color: "#d4a054",
    description: "Show what evidence or records are missing",
    defaultPrompt: "What evidence, records, or documentation is missing that weakens the current position?",
  },
];

const DEMO_RESPONSES: Record<string, string> = {
  summarize: `## Matter Summary — Rodriguez v. National General Insurance

**Status**: Active Discovery | IME Pending

**The Case**: Motor vehicle accident, Queens Blvd, January 15, 2025. Plaintiff sustained L4-L5 disc herniation, cervical strain, and right shoulder impingement. Physical therapy ongoing. Orthopedic specialist involved.

**Where Things Stand**:
- Liability is clear — police report, two witnesses, IME consistent with treating physician
- Discovery cutoff: May 15, 2025 (extended)
- Mediation: April 22 (19 days away)
- Carrier raised reserves from $15K to $28K — signals softening posture

**Key Numbers**: Demand at $185K–$215K range. Last carrier offer: $95K (January). Estimated settlement: $140K–$165K.

**What's Needed**: Lost wage verification, one outstanding provider record (Dr. Perez), mediation memo not yet drafted.

*Source-grounded from matter files, communications, and pressure graph.*`,
  "flag-risk": `## Risk Assessment — Rodriguez v. National General

### Critical Risks
- **Mediation in 19 days** — no mediation memo drafted. Window is closing.
- **Interrogatory deadline in 2 days** — response is 80% complete but not submitted for review

### High Risks
- **Lost wage verification missing** — weakens demand by estimated $18,500
- **Dr. Perez records outstanding** — 21 days since request, no response

### Friction Sources
- Carrier response lag: 21 days (above 14-day firm threshold)
- Reserve increase not yet incorporated into revised demand strategy

### Recommended Actions
1. Finalize interrogatory response today — submit for review immediately
2. Start mediation memo — use Workbench Prepare action
3. Re-issue records request to Dr. Perez with certified mail
4. Update demand strategy given reserve increase signal`,
  "next-steps": `## Next Best Actions — Next 24 Hours

**Impact-ranked, time-estimated actions**

1. **Clear interrogatory response (20 min)** — 2-day deadline. Draft is 80% complete. Finalize and submit for review before deadline. Impact: 95%.

2. **Review reserve increase strategy (10 min)** — Carrier raised reserves from $15K to $28K. This signals reassessment of exposure. Update demand strategy accordingly. Impact: 88%.

3. **Start mediation memo (30 min)** — Mediation in 19 days with no memo. Begin with Workbench Prepare action to auto-assemble key facts. Impact: 85%.

4. **Request Dr. Perez records via certified mail (5 min)** — 21 days outstanding. Certified request strengthens subpoena argument. Impact: 72%.`,
};

export default function CopilotWorkbenchV2() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedMatter, setSelectedMatter] = useState<number>(1);
  const [input, setInput] = useState("");
  const [demoMessages, setDemoMessages] = useState<{ role: string; content: string; action?: string }[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: historyData } = useCopilotHistory(activeSessionId);
  const createSession = useCopilotCreateSession();
  const sendMessage = useCopilotSendMessage();

  const isDemo = activeSessionId === null;
  const liveMessages = historyData?.messages ?? [];
  const messages = isDemo ? demoMessages : liveMessages;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleAction = (actionId: string) => {
    const action = ACTION_CARDS.find(a => a.id === actionId);
    if (!action) return;
    setSelectedAction(actionId);
    setInput(action.defaultPrompt);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");

    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const session = await createSession.mutateAsync({ mode: "matter" });
        sessionId = session.id;
        setActiveSessionId(session.id);
      }
      await sendMessage.mutateAsync({ sessionId: sessionId as number, content: userMsg });
    } catch {
      const actionId = selectedAction;
      const demoResponse = (actionId && DEMO_RESPONSES[actionId]) ||
        `Processing your request...\n\n**Query**: "${userMsg}"\n\n*This is a demo response. Live responses are source-grounded against matter files, communications, and real-time pressure signals.*\n\n**Confidence**: 0.78 | **Sources**: Matter files, Pressure Graph, Proof Chain`;
      setDemoMessages(prev => [...prev, { role: "user", content: userMsg, action: actionId || undefined }, { role: "assistant", content: demoResponse }]);
    }
    setSelectedAction(null);
  };

  const matter = DEMO_MATTERS.find(m => m.id === selectedMatter) || DEMO_MATTERS[0];

  return (
    <div className="flex h-full">
      <div className="w-[260px] flex-shrink-0 border-r border-white/[0.06] flex flex-col" style={{ background: "#0a0f18" }}>
        <div className="p-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-[#8b7ac8]" />
            <span className="text-xs font-semibold text-slate-200">Copilot Workbench</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">Action-card command palette — source-grounded across all matter data</p>
        </div>

        <div className="p-3 border-b border-white/[0.06]">
          <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-2">Matter Context</div>
          <select
            value={selectedMatter}
            onChange={e => setSelectedMatter(Number(e.target.value))}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-white/[0.15]"
          >
            {DEMO_MATTERS.map(m => (
              <option key={m.id} value={m.id}>{m.title.split(" v. ")[0]}</option>
            ))}
          </select>
          <div className="mt-1 text-[9px] text-slate-600">{matter.caseNumber} · {matter.status.replace("_", " ")}</div>
        </div>

        <div className="flex-1 p-2 overflow-y-auto">
          <div className="text-[9px] text-slate-600 uppercase tracking-wider px-1 py-1.5">Actions</div>
          <div className="grid grid-cols-2 gap-1">
            {ACTION_CARDS.map(action => {
              const Icon = action.icon;
              const isSelected = selectedAction === action.id;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className="flex flex-col items-center gap-1 p-2 rounded border transition-colors text-center"
                  style={{
                    background: isSelected ? action.color + "15" : "transparent",
                    borderColor: isSelected ? action.color + "40" : "transparent",
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: isSelected ? action.color : "#64748b" }} />
                  <span className="text-[9px] leading-tight" style={{ color: isSelected ? action.color : "#94a3b8" }}>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 px-2 py-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isDemo ? "bg-[#d4a054]" : "bg-[#4a90b8]"}`} />
            <span className="text-[9px] text-slate-500 font-mono">{isDemo ? "DEMO" : "LIVE"}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#8b7ac8]" />
            <span className="text-sm font-medium text-slate-200">Workbench</span>
            {selectedAction && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px]" style={{ background: (ACTION_CARDS.find(a => a.id === selectedAction)?.color || "#d4a054") + "15", color: ACTION_CARDS.find(a => a.id === selectedAction)?.color || "#d4a054" }}>
                {ACTION_CARDS.find(a => a.id === selectedAction)?.label}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600">Proof Chain enabled</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#4a90b8]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Brain className="w-8 h-8 text-[#8b7ac8]/40 mb-3" />
              <p className="text-sm text-slate-400 mb-1">Choose an action or ask a question</p>
              <p className="text-xs text-slate-600 max-w-xs">Select an action card on the left to auto-fill a prompt, or type your own question about any matter</p>
              <div className="mt-4 grid grid-cols-2 gap-2 max-w-sm">
                {["What changed in the last 7 days?", "What is missing before mediation?", "What should I do first today?", "Flag all risks across my matters"].map(q => (
                  <button key={q} onClick={() => setInput(q)}
                    className="text-left px-2 py-1.5 rounded border border-white/[0.06] text-[10px] text-slate-500 hover:text-slate-300 hover:border-white/[0.10] transition-colors" style={{ background: "#080c14" }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.filter((m: any) => m.role !== "system").map((msg: any, i: number) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-4 py-3 ${msg.role === "user" ? "bg-[#8b7ac8]/15 border border-[#8b7ac8]/20" : "border border-white/[0.06]"}`} style={msg.role !== "user" ? { background: "#0c1220" } : undefined}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3 h-3 text-[#8b7ac8]" />
                    <span className="text-[9px] text-[#8b7ac8] font-mono">PRISM COPILOT</span>
                    {msg.action && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: (ACTION_CARDS.find(a => a.id === msg.action)?.color || "#8b7ac8") + "15", color: ACTION_CARDS.find(a => a.id === msg.action)?.color || "#8b7ac8" }}>
                        {ACTION_CARDS.find(a => a.id === msg.action)?.label || msg.action}
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-white/[0.06] flex-shrink-0" style={{ background: "#0c1220" }}>
          {selectedAction && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-slate-500">Action:</span>
              <span className="text-[10px] font-medium" style={{ color: ACTION_CARDS.find(a => a.id === selectedAction)?.color }}>
                {ACTION_CARDS.find(a => a.id === selectedAction)?.label}
              </span>
              <button onClick={() => setSelectedAction(null)} className="text-slate-600 hover:text-slate-400 ml-auto">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={selectedAction ? `${ACTION_CARDS.find(a => a.id === selectedAction)?.label}...` : "Ask anything about your matters..."}
              className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#8b7ac8]/30"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              className="p-2 rounded bg-[#8b7ac8]/20 text-[#8b7ac8] hover:bg-[#8b7ac8]/30 transition-colors disabled:opacity-40"
            >
              {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[9px] text-slate-600">Context:</span>
            <span className="text-[9px] text-slate-500">{matter.title} · {matter.caseNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
