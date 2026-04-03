import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Brain, FileText, TrendingUp, Settings, Scale, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { useCopilotSessions, useCopilotHistory, useCopilotCreateSession, useCopilotSendMessage, useCopilotTemplates } from "../../hooks/use-prism-s31";

const MODES = [
  { id: "matter", label: "Matter", icon: Scale, description: "Status, pressures, changes, missing artifacts" },
  { id: "communications", label: "Comms", icon: MessageSquare, description: "Insurer communications, silence windows" },
  { id: "document", label: "Document", icon: FileText, description: "Extraction, contradictions, chronology" },
  { id: "strategy", label: "Strategy", icon: TrendingUp, description: "Leverage, readiness, settlement posture" },
  { id: "ops", label: "Ops", icon: Settings, description: "Connector health, sync lag, system diagnostics" },
] as const;

const DEMO_MESSAGES = [
  { role: "system", content: "You are the PRISM Counsel Matter Assistant." },
  { role: "user", content: "What changed on Rodriguez v. National General in the last 7 days?" },
  { role: "assistant", content: `## Matter Changes — Last 7 Days\n\n**Rodriguez v. National General** (Case #2024-CV-1847)\n\n### Pressure Shifts\n- **Insurer pressure** rose from 0.52 → 0.58 (+6%) — carrier response lag now exceeds 21 days\n- **Settlement pressure** stable at 0.62 — mediation approaching April 22\n- **Evidence pressure** fell from 0.60 → 0.52 — 2 documents processed from extraction queue\n\n### Key Events\n1. **Mar 28** — Reserve increase notification detected in carrier correspondence\n2. **Mar 30** — IME report received from Dr. Whitmore (orthopedic)\n3. **Apr 1** — Discovery deadline extension granted (new cutoff: May 15)\n\n### Missing Artifacts\n- Outstanding medical records from 2 providers\n- Lost wage verification incomplete\n- No mediation memo drafted\n\n### Recommended Actions\n1. Follow up on outstanding medical records (2 providers)\n2. Complete lost wage verification before demand finalization\n3. Draft mediation memo — mediation in 19 days\n\n*Sources: Matter Twin snapshot, Pressure Graph, Communication logs*\n*Confidence: 0.82 | Proof Chain: #PC-2847*` },
];

export default function CopilotWorkbenchPage() {
  const [activeMode, setActiveMode] = useState<string>("matter");
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [demoMessages, setDemoMessages] = useState(DEMO_MESSAGES);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: sessionsData } = useCopilotSessions();
  const { data: historyData } = useCopilotHistory(activeSessionId);
  const { data: templatesData } = useCopilotTemplates();
  const createSession = useCopilotCreateSession();
  const sendMessage = useCopilotSendMessage();

  const isDemo = activeSessionId === null;
  const messages = isDemo ? demoMessages : (historyData?.messages ?? []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const session = await createSession.mutateAsync({ mode: activeMode });
        sessionId = session.id;
        setActiveSessionId(session.id);
      }
      await sendMessage.mutateAsync({ sessionId, content: input });
    } catch {
      setDemoMessages(prev => [...prev, { role: "user", content: input }, { role: "assistant", content: `Processing your query in **${activeMode}** mode...\n\n*This is a demo response. Connect to the Model Mesh for live AI-powered answers with full Proof Chain traceability.*\n\n**Query**: "${input}"\n**Mode**: ${activeMode}\n**Sources**: Pressure Graph, Matter Twin, Proof Chain\n**Confidence**: 0.78` }]);
    }
    setInput("");
  };

  const templates = templatesData?.templates ?? [];

  return (
    <div className="flex h-full">
      <div className="w-[240px] border-r border-white/[0.06] flex flex-col" style={{ background: "#0a0f18" }}>
        <div className="p-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-[#8b7ac8]" />
            <span className="text-xs font-semibold text-slate-200">Copilot Workbench</span>
          </div>
          <p className="text-[10px] text-slate-500">Source-grounded AI counsel across 5 operational modes</p>
        </div>

        <div className="p-2 border-b border-white/[0.06]">
          <div className="text-[9px] uppercase tracking-wider text-slate-600 px-2 py-1">Mode</div>
          {MODES.map(m => {
            const Icon = m.icon;
            return (
              <button key={m.id} onClick={() => { setActiveMode(m.id); setActiveSessionId(null); }} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${activeMode === m.id ? "bg-[#8b7ac8]/10 text-[#8b7ac8]" : "text-slate-400 hover:text-slate-300 hover:bg-white/[0.03]"}`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <div>
                  <div className="text-[11px] font-medium">{m.label}</div>
                  <div className="text-[9px] text-slate-600 leading-tight">{m.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-2 flex-1 overflow-y-auto">
          <div className="text-[9px] uppercase tracking-wider text-slate-600 px-2 py-1">Quick Prompts</div>
          {templates.filter((t: any) => t.mode === activeMode).map((t: any) => (
            <button key={t.id} onClick={() => setInput(t.template)} className="w-full text-left px-2 py-1.5 text-[10px] text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] rounded transition-colors">{t.template}</button>
          ))}
          {templates.filter((t: any) => t.mode === activeMode).length === 0 && (
            <>
              {["What changed in the last 7 days?", "What is missing before mediation?", "Show actions requiring approval"].map(q => (
                <button key={q} onClick={() => setInput(q)} className="w-full text-left px-2 py-1.5 text-[10px] text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] rounded transition-colors">{q}</button>
              ))}
            </>
          )}
        </div>

        <div className="p-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 px-2 py-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isDemo ? "bg-[#d4a054]" : "bg-[#4a90b8]"}`} />
            <span className="text-[9px] text-slate-500 font-mono">{isDemo ? "DEMO" : "LIVE"}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2">
            {(() => { const M = MODES.find(m => m.id === activeMode); const Icon = M?.icon ?? Brain; return <Icon className="w-4 h-4 text-[#8b7ac8]" />; })()}
            <span className="text-sm font-medium text-slate-200">{MODES.find(m => m.id === activeMode)?.label} Mode</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8b7ac8]/10 text-[#8b7ac8] font-mono">S31</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600">Proof Chain enabled</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#4a90b8]" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.filter((m: any) => m.role !== "system").map((msg: any, i: number) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === "user" ? "bg-[#8b7ac8]/15 border border-[#8b7ac8]/20" : "border border-white/[0.06]"}`} style={msg.role !== "user" ? { background: "#0c1220" } : undefined}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3 h-3 text-[#8b7ac8]" />
                    <span className="text-[9px] text-[#8b7ac8] font-mono">PRISM COPILOT</span>
                  </div>
                )}
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-white/[0.06]" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()} placeholder={`Ask in ${activeMode} mode...`} className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#8b7ac8]/30" />
            <button onClick={handleSend} disabled={!input.trim() || sendMessage.isPending} className="p-2 rounded bg-[#8b7ac8]/20 text-[#8b7ac8] hover:bg-[#8b7ac8]/30 transition-colors disabled:opacity-40">
              {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
