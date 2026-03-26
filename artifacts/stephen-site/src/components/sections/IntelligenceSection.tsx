import { useEffect, useState, useRef } from "react";
import { Activity, Cpu, Globe, MessageSquare, Send, Loader2, TrendingUp, Zap, Shield, Ship, Brain, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBubble } from "@workspace/shared-ui/ai-components";

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
  const [streamingText, setStreamingText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<any[]>("/intelligence/ecosystem-health").then(setEcosystemHealth).catch(() => {});
    apiFetch<any>("/intelligence/platform-stats").then(setPlatformStats).catch(() => {});
    apiFetch<any[]>("/intelligence/tech-trends").then(setTechTrends).catch(() => {});
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, streamingText]);

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    setStreamingText("");

    try {
      const response = await fetch(`${API_BASE}/intelligence/ai/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are Stephen Lutar's AI assistant. You help visitors learn about SZL Holdings, its portfolio of technology products, and Stephen's expertise in enterprise technology, cybersecurity, and maritime intelligence. Be concise, professional, and helpful." },
            ...newMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
          ],
        }),
        credentials: "include",
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const ct = response.headers.get("content-type") || "";
      if (ct.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload);
                const token = parsed.choices?.[0]?.delta?.content || parsed.token || parsed.content || "";
                if (token) {
                  accumulated += token;
                  setStreamingText(accumulated);
                }
              } catch {}
            }
          }
        }
        setChatMessages([...newMessages, { role: "assistant", content: accumulated || "I'm here to help! Ask me about SZL Holdings." }]);
      } else {
        const json = await response.json();
        setChatMessages([...newMessages, { role: "assistant", content: json.content || "I'm here to help!" }]);
      }
    } catch {
      setChatMessages([...newMessages, { role: "assistant", content: "I'm currently in demo mode. Ask me about SZL Holdings' technology portfolio, cybersecurity capabilities, or maritime intelligence solutions!" }]);
    }
    setChatLoading(false);
    setStreamingText("");
  };

  const suggestedQuestions = [
    "What is SZL Holdings?",
    "Tell me about Firestorm",
    "What maritime solutions do you offer?",
  ];

  const statusColors: Record<string, string> = {
    operational: "bg-emerald-500",
    degraded: "bg-amber-500",
    down: "bg-red-500",
  };

  return (
    <section id="intelligence" className="relative py-24 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Zap className="w-4 h-4" /> Live Intelligence
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">Ecosystem Pulse</h2>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            Real-time health monitoring across all SZL Holdings applications and AI-powered insights.
          </p>
        </motion.div>

        {platformStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Shield, color: "text-red-400", label: "Threats Analyzed", value: platformStats.threatsAnalyzed },
              { icon: Ship, color: "text-blue-400", label: "Vessels Tracked", value: platformStats.vesselsTracked },
              { icon: Activity, color: "text-cyan-400", label: "Signals Processed", value: platformStats.signalsProcessed },
              { icon: Cpu, color: "text-emerald-400", label: "Platform Uptime", value: platformStats.uptime, suffix: "%" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 text-center group hover:border-primary/30 transition-all"
              >
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-3 group-hover:scale-110 transition-transform`} />
                <div className="text-3xl font-display font-bold text-foreground">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1 bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50"
          >
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50"
          >
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
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${trend.momentum}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 flex flex-col"
          >
            <div className="p-6 pb-3">
              <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" /> Ask Stephen AI
              </h3>
              <p className="text-xs text-muted-foreground mt-1">AI-powered conversational assistant</p>
            </div>
            <div className="flex-1 px-6 overflow-y-auto max-h-[300px] space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-6">
                  <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-3">Ask about SZL Holdings, our technology portfolio, or capabilities.</p>
                  <div className="space-y-2">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => { setChatInput(q); }}
                        className="block w-full text-left text-xs px-3 py-2 rounded-lg border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-muted-foreground"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <AnimatePresence>
                {chatMessages.map((msg, i) => (
                  <ChatBubble key={i} role={msg.role as "user" | "assistant"} content={msg.content} />
                ))}
              </AnimatePresence>
              {chatLoading && streamingText && (
                <ChatBubble role="assistant" content={streamingText} isStreaming />
              )}
              {chatLoading && !streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-white/5 rounded-2xl rounded-bl-sm mr-auto border border-white/10"
                >
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  Thinking...
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-border/30">
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-background/50 border border-border/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="Ask anything..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                />
                <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
