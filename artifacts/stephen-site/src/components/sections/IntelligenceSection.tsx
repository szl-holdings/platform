import { useEffect, useState } from "react";
import { Activity, Cpu, Globe, MessageSquare, Send, Loader2, TrendingUp, Zap, Shield, Ship, Brain } from "lucide-react";

const API_BASE = "/api";
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers }, credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let c = false;
    const s = performance.now();
    const step = (n: number) => { if (c) return; const p = Math.min((n - s) / 1500, 1); setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    return () => { c = true; };
  }, [value]);
  return <>{display.toLocaleString()}{suffix}</>;
}

export function IntelligenceSection() {
  const [ecosystemHealth, setEcosystemHealth] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [techTrends, setTechTrends] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    apiFetch<any[]>("/intelligence/ecosystem-health").then(setEcosystemHealth).catch(() => {});
    apiFetch<any>("/intelligence/platform-stats").then(setPlatformStats).catch(() => {});
    apiFetch<any[]>("/intelligence/tech-trends").then(setTechTrends).catch(() => {});
  }, []);

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const result = await apiFetch<any>("/intelligence/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are Stephen Lutar's AI assistant. You help visitors learn about SZL Holdings, its portfolio of technology products, and Stephen's expertise in enterprise technology, cybersecurity, and maritime intelligence. Be concise, professional, and helpful." },
            ...newMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
          ],
        }),
      });
      setChatMessages([...newMessages, { role: "assistant", content: result.content }]);
    } catch {
      setChatMessages([...newMessages, { role: "assistant", content: "I'm currently in demo mode. Ask me about SZL Holdings' technology portfolio, cybersecurity capabilities, or maritime intelligence solutions!" }]);
    }
    setChatLoading(false);
  };

  const statusColors: Record<string, string> = {
    operational: "bg-emerald-500",
    degraded: "bg-amber-500",
    down: "bg-red-500",
  };

  return (
    <section id="intelligence" className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Zap className="w-4 h-4" /> Live Intelligence
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">Ecosystem Pulse</h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            Real-time health monitoring across all SZL Holdings applications and AI-powered insights.
          </p>
        </div>

        {platformStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 text-center group hover:border-primary/30 transition-all">
              <Shield className="w-8 h-8 text-red-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-display font-bold text-foreground"><AnimatedCounter value={platformStats.threatsAnalyzed} /></div>
              <p className="text-sm text-muted-foreground mt-1">Threats Analyzed</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 text-center group hover:border-primary/30 transition-all">
              <Ship className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-display font-bold text-foreground"><AnimatedCounter value={platformStats.vesselsTracked} /></div>
              <p className="text-sm text-muted-foreground mt-1">Vessels Tracked</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 text-center group hover:border-primary/30 transition-all">
              <Activity className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-display font-bold text-foreground"><AnimatedCounter value={platformStats.signalsProcessed} /></div>
              <p className="text-sm text-muted-foreground mt-1">Signals Processed</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 text-center group hover:border-primary/30 transition-all">
              <Cpu className="w-8 h-8 text-emerald-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-display font-bold text-foreground"><AnimatedCounter value={platformStats.uptime} suffix="%" /></div>
              <p className="text-sm text-muted-foreground mt-1">Platform Uptime</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-1 bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> App Health
            </h3>
            <div className="space-y-3">
              {ecosystemHealth.map((app: any) => (
                <div key={app.app} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${statusColors[app.status] || "bg-slate-500"} ${app.status === "operational" ? "" : "animate-pulse"}`} />
                    <span className="text-sm font-medium">{app.app}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">{app.uptime}%</span>
                    <span className="text-[10px] text-muted-foreground block">{app.latency}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
            <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" /> Tech Trend Radar
            </h3>
            <div className="space-y-3">
              {techTrends.slice(0, 6).map((trend: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-background/50 border border-border/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{trend.name}</span>
                    <span className="text-xs text-primary font-bold">{trend.momentum}%</span>
                  </div>
                  <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full transition-all duration-1000" style={{ width: `${trend.momentum}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 flex flex-col">
            <div className="p-6 pb-3">
              <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" /> Ask Stephen AI
              </h3>
              <p className="text-xs text-muted-foreground mt-1">AI-powered assistant</p>
            </div>
            <div className="flex-1 px-6 overflow-y-auto max-h-[300px] space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Ask about SZL Holdings, our technology portfolio, or capabilities.</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === "user" ? "bg-primary/10 text-foreground ml-6" : "bg-background/50 border border-border/30 mr-6"}`}>
                  {msg.content}
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-3">
                  <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border/30">
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-background/50 border border-border/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="Ask anything..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                />
                <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
