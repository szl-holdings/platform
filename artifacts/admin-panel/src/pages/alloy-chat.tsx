import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Sparkles, Terminal, Database, Server, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  type?: "text" | "command" | "query";
}

const initialMessages: Message[] = [
  { id: "1", role: "system", content: "AlloyChat initialized. Connected to SZL Admin Control Plane. You can ask about system status, run diagnostics, query configurations, or manage infrastructure.", timestamp: new Date(Date.now() - 300000) },
  { id: "2", role: "user", content: "What's the current system health status?", timestamp: new Date(Date.now() - 240000) },
  { id: "3", role: "assistant", content: "**System Health Overview:**\n\n• **API Server**: Healthy (99.97% uptime, avg response 42ms)\n• **Database**: Healthy (PostgreSQL 16, connections: 23/100)\n• **Cache**: Healthy (Redis, hit rate: 94.2%)\n• **CDN**: Healthy (Cloudflare, 14 edge locations active)\n• **Workers**: Healthy (4/4 background workers running)\n\nAll 14 registered artifacts are responding normally. No critical alerts in the last 24 hours.", timestamp: new Date(Date.now() - 200000), type: "text" },
  { id: "4", role: "user", content: "Show me the recent deployments", timestamp: new Date(Date.now() - 120000) },
  { id: "5", role: "assistant", content: "**Recent Deployments (Last 7 Days):**\n\n| App | Version | Deployed | Status |\n|-----|---------|----------|--------|\n| Firestorm | v2.4.1 | Mar 28 14:32 | ✅ Live |\n| INCA | v3.1.0 | Mar 27 09:15 | ✅ Live |\n| Admin Panel | v1.8.2 | Mar 26 16:45 | ✅ Live |\n| Dreamscape | v2.0.3 | Mar 25 11:20 | ✅ Live |\n| API Server | v4.2.0 | Mar 24 08:00 | ✅ Live |\n\nAll deployments completed successfully with zero rollbacks.", timestamp: new Date(Date.now() - 60000), type: "text" },
];

const suggestions = [
  "Check integration health status",
  "Show database connection stats",
  "List all feature flags",
  "Run smoke test on API endpoints",
  "Show recent audit log entries",
  "What services are in demo mode?",
];

export default function AlloyChat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (content: string) => {
    if (!content.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const responses: Record<string, string> = {
        "Check integration health status": "**Integration Health:**\n\n• GitHub: ✅ Connected (OAuth active)\n• Stripe: ⚠️ Demo Mode (test keys configured)\n• OpenAI: ✅ Connected (GPT-4 access)\n• PostgreSQL: ✅ Healthy (23 active connections)\n• Redis: ✅ Healthy (memory: 128MB/512MB)\n\n2 of 5 integrations are in demo/test mode.",
        "Show database connection stats": "**Database Stats:**\n\n• Active connections: 23/100\n• Idle connections: 8\n• Queries/sec: 142\n• Avg query time: 3.2ms\n• Slow queries (>100ms): 2 in last hour\n• Database size: 2.4 GB\n• Cache hit ratio: 94.2%",
      };

      const reply = responses[content] || `I've processed your request: "${content}"\n\nThis is a simulated response. In production, AlloyChat connects to the full admin API to execute queries, run diagnostics, and manage infrastructure in real-time.`;

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: "assistant", content: reply, timestamp: new Date(), type: "text"
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">AlloyChat</h1>
          <p className="text-xs text-muted-foreground">AI-powered admin assistant for infrastructure and operations</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Online
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
            {msg.role !== "user" && (
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                msg.role === "assistant" ? "bg-primary/10" : "bg-muted"
              )}>
                {msg.role === "assistant" ? <Sparkles className="w-4 h-4 text-primary" /> : <Terminal className="w-4 h-4 text-muted-foreground" />}
              </div>
            )}
            <div className={cn("max-w-[70%] rounded-xl px-4 py-3",
              msg.role === "user" ? "bg-primary text-primary-foreground" :
              msg.role === "system" ? "bg-muted/50 border border-border" :
              "bg-card border border-border"
            )}>
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              <p className={cn("text-[10px] mt-2",
                msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
              )}>{msg.timestamp.toLocaleTimeString()}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-foreground" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex gap-2 flex-wrap">
          {suggestions.map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              className="px-3 py-1.5 rounded-full text-xs bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask AlloyChat about your infrastructure..."
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button onClick={() => sendMessage(input)}
            className="px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
