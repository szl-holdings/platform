import { useState, useRef, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown } from "lucide-react";
import { analytics } from "@/lib/analytics";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "What is Lyte and how does it work?",
  "How is this different from a BI tool?",
  "What does the pricing look like?",
  "How long does implementation take?",
];

const SYSTEM_CONTEXT = `You are the SZL Holdings assistant. SZL Holdings builds Lyte (business observability platform) and Alloy (execution fabric). 

Key facts:
- Lyte detects execution risk, workflow friction, and ownership gaps in real time
- Alloy routes actions to the right person with full governance and audit trail
- Architecture: Signal Ingestion → Visibility Surface → Explainable Forecast → Governed Action
- Domain packs: PRISM Counsel (legal), Vessels (maritime), Aegis (security/defense), Terra (real estate), Carlota Jo (private advisory)
- Currently in design-partner stage (pre-commercial)
- Pricing: Observer tier (monitoring only, limited signals), Operator tier (full platform, full signal coverage, Alloy routing), Enterprise (custom, white-glove, dedicated instance)
- Design partner engagement: 3-month pilot, enterprise pricing, starts with a conversation
- Primary CTAs: /demo for the live product, /contact for conversation, /investors for investor relations
- Trust: human-in-the-loop on every consequential action, immutable audit trail, source attribution, policy routing
- No autonomous execution without review

Keep responses concise (2-3 paragraphs max), helpful, and direct. If asked about pricing, explain the three tiers and suggest contacting sales. If asked technical questions, refer to the architecture. Always end with a relevant next step.`;

async function askAssistant(messages: Message[]): Promise<string> {
  try {
    const payload = {
      messages: [
        { role: "user", content: `[Context for this session: ${SYSTEM_CONTEXT}]\n\nPlease use the above context and answer as the SZL Holdings assistant.` },
        { role: "assistant", content: "Understood. I'll answer as the SZL Holdings assistant using that context." },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      routeClass: "conversational",
      maxTokens: 400,
    };

    const res = await fetch("/api/ai/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json() as { content?: string; error?: string };
    return data.content ?? "I apologize, I couldn't process that. Try contacting us directly at hello@szlholdings.com.";
  } catch {
    return "I'm having trouble connecting right now. Please try our contact page or email hello@szlholdings.com for immediate help.";
  }
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content: "Hi! I'm the SZL Holdings assistant. I can answer questions about Lyte, Alloy, pricing, our architecture, or how to get started. What would you like to know?",
  timestamp: new Date(),
};

interface AIChatWidgetProps {
  pages?: string[];
}

export function AIChatWidget({ pages }: AIChatWidgetProps) {
  const currentPage = typeof window !== "undefined" ? window.location.pathname : "/";
  const isOnTargetPage = !pages || pages.some(p => currentPage.includes(p));

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
      setHasNewMessage(false);
    }
  }, [isOpen, messages]);

  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const userMsg: Message = { id: generateId(), role: "user", content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    analytics.chatMessageSent();

    try {
      const allMessages = [...messages, userMsg];
      const response = await askAssistant(allMessages);
      const assistantMsg: Message = { id: generateId(), role: "assistant", content: response, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
      if (!isOpen) setHasNewMessage(true);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, isOpen]);

  if (!isOnTargetPage) return null;

  return (
    <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9998 }}>
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 0.75rem)",
              right: 0,
              width: "clamp(300px, 90vw, 380px)",
              background: "hsl(214,14%,6%)",
              border: "1px solid hsla(0,0%,100%,0.1)",
              borderRadius: "1rem",
              overflow: "hidden",
              boxShadow: "0 24px 64px hsla(0,0%,0%,0.6), 0 0 0 1px hsla(192,72%,48%,0.08)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "520px",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "0.875rem 1rem",
              background: "hsla(0,0%,100%,0.03)",
              borderBottom: "1px solid hsla(0,0%,100%,0.07)",
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "hsla(192,72%,48%,0.15)",
                border: "1px solid hsla(192,72%,48%,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Bot size={15} color="hsl(192,72%,48%)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,92%)", margin: 0 }}>SZL Assistant</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "hsl(145,60%,46%)" }} />
                  <p style={{ fontSize: "0.6875rem", color: "hsl(214,7%,55%)", margin: 0 }}>Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(214,7%,55%)", padding: "0.25rem", borderRadius: "0.25rem" }}
                aria-label="Close chat"
              >
                <X size={15} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: msg.role === "user" ? "hsla(192,72%,48%,0.2)" : "hsla(0,0%,100%,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${msg.role === "user" ? "hsla(192,72%,48%,0.3)" : "hsla(0,0%,100%,0.1)"}`,
                  }}>
                    {msg.role === "user" ? <User size={12} color="hsl(192,72%,48%)" /> : <Bot size={12} color="hsl(214,7%,65%)" />}
                  </div>
                  <div style={{
                    maxWidth: "80%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: msg.role === "user" ? "1rem 0.25rem 1rem 1rem" : "0.25rem 1rem 1rem 1rem",
                    background: msg.role === "user" ? "hsla(192,72%,48%,0.15)" : "hsla(0,0%,100%,0.04)",
                    border: `1px solid ${msg.role === "user" ? "hsla(192,72%,48%,0.25)" : "hsla(0,0%,100%,0.06)"}`,
                    fontSize: "0.8125rem",
                    lineHeight: 1.6,
                    color: "hsl(38,8%,88%)",
                    whiteSpace: "pre-wrap",
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "hsla(0,0%,100%,0.06)", border: "1px solid hsla(0,0%,100%,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 size={12} color="hsl(214,7%,65%)" style={{ animation: "spin 1s linear infinite" }} />
                  </div>
                  <div style={{ padding: "0.625rem 0.875rem", borderRadius: "0.25rem 1rem 1rem 1rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                    <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "hsl(214,7%,45%)", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested questions (only shown early) */}
            {messages.length <= 1 && (
              <div style={{ padding: "0 1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    style={{
                      textAlign: "left",
                      background: "hsla(0,0%,100%,0.03)",
                      border: "1px solid hsla(0,0%,100%,0.07)",
                      borderRadius: "0.5rem",
                      padding: "0.4375rem 0.75rem",
                      fontSize: "0.75rem",
                      color: "hsl(214,7%,60%)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "hsla(192,72%,48%,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(192,72%,48%,0.2)"; (e.currentTarget as HTMLElement).style.color = "hsl(192,72%,65%)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.03)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.07)"; (e.currentTarget as HTMLElement).style.color = "hsl(214,7%,60%)"; }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{
              padding: "0.75rem 1rem",
              borderTop: "1px solid hsla(0,0%,100%,0.07)",
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask anything..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: "hsla(0,0%,100%,0.05)",
                  border: "1px solid hsla(0,0%,100%,0.1)",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.8125rem",
                  color: "hsl(38,8%,92%)",
                  outline: "none",
                }}
                onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(192,72%,48%,0.5)"; }}
                onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.1)"; }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                style={{
                  width: 34, height: 34,
                  background: input.trim() && !isLoading ? "hsl(192,72%,48%)" : "hsla(0,0%,100%,0.06)",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
                aria-label="Send message"
              >
                <Send size={14} color={input.trim() && !isLoading ? "hsl(214,16%,4%)" : "hsl(214,7%,40%)"} />
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(o => { if (!o) analytics.chatOpened(); return !o; })}
        aria-label={isOpen ? "Close chat" : "Open chat assistant"}
        style={{
          width: 52, height: 52,
          borderRadius: "50%",
          background: isOpen ? "hsl(214,14%,10%)" : "hsl(192,72%,48%)",
          border: isOpen ? "1px solid hsla(0,0%,100%,0.12)" : "none",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px hsla(0,0%,0%,0.4)",
          transition: "all 0.2s ease",
          position: "relative",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      >
        {isOpen ? (
          <ChevronDown size={20} color="hsl(38,8%,85%)" />
        ) : (
          <MessageCircle size={20} color="hsl(214,16%,4%)" />
        )}
        {hasNewMessage && !isOpen && (
          <div style={{
            position: "absolute", top: -2, right: -2,
            width: 12, height: 12, borderRadius: "50%",
            background: "hsl(0,72%,60%)",
            border: "2px solid hsl(214,16%,4%)",
          }} />
        )}
      </button>
      <style>{`
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } }
      `}</style>
    </div>
  );
}
