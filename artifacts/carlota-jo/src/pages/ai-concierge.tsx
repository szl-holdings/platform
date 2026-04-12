import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Sparkles, Clock, CheckCircle2, Circle,
  Plane, Home, Package, FileText, Calendar, Phone,
  ChevronDown, ChevronRight, X, User, Bot,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOLD = "rgba(196,170,126,1)";
const GOLD_DIM = "rgba(196,170,126,0.08)";
const GOLD_BORDER = "rgba(196,170,126,0.18)";
const CREAM = "rgba(244,237,224,0.88)";
const CREAM_DIM = "rgba(244,237,224,0.45)";
const CREAM_FAINT = "rgba(244,237,224,0.07)";
const MUTED = "rgba(244,237,224,0.25)";
const DEEP = "#0a0906";

type TaskStatus = "pending" | "in-progress" | "done";
type OrchestrationType = "booking" | "research" | "vendor" | "document" | "coordination";

interface OrchestratedTask {
  id: string;
  label: string;
  type: OrchestrationType;
  status: TaskStatus;
  assignedTo: string;
  detail?: string;
  eta?: string;
}

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  orchestration?: OrchestratedTask[];
}

const orchTypeConfig: Record<OrchestrationType, { icon: React.ElementType; color: string }> = {
  booking: { icon: Calendar, color: "#38bdf8" },
  research: { icon: Sparkles, color: "#a78bfa" },
  vendor: { icon: Package, color: "#34d399" },
  document: { icon: FileText, color: "#c4aa7e" },
  coordination: { icon: Phone, color: "#fb923c" },
};

const INITIAL_MESSAGES: ConversationMessage[] = [
  {
    id: "m0",
    role: "assistant",
    timestamp: "9:02 AM",
    content: "Good morning. I'm ready to help — what would you like arranged today?",
  },
  {
    id: "m1",
    role: "user",
    timestamp: "9:04 AM",
    content: "We'll be heading to Oxfordshire in early May. I'd like the house ready — inspection, staff briefing, pool, and can you check on the Carlyle for a week in June?",
  },
  {
    id: "m2",
    role: "assistant",
    timestamp: "9:04 AM",
    content: "Understood. I'm orchestrating five concurrent actions across your Oxfordshire opening and New York travel. I'll confirm each as they resolve — you'll have a full status update by end of day.",
    orchestration: [
      {
        id: "t1", label: "Book Oxfordshire opening inspection", type: "booking",
        status: "done", assignedTo: "Estate Operations",
        detail: "Scheduled for April 16, 9am. Caretaker confirmed.", eta: "Confirmed",
      },
      {
        id: "t2", label: "Staff briefing document prepared", type: "document",
        status: "done", assignedTo: "Document Engine",
        detail: "8-page briefing covering seasonal protocols, updated contact list, and 2025 remediation notes. Ready to share.",
      },
      {
        id: "t3", label: "Pool maintenance seasonal renewal", type: "vendor",
        status: "in-progress", assignedTo: "Vendor Network",
        detail: "Outreach sent to AquaCare Ltd. Awaiting confirmation. Expected response: today.",
        eta: "Today",
      },
      {
        id: "t4", label: "Grounds & landscaping confirmed", type: "vendor",
        status: "done", assignedTo: "Vendor Network",
        detail: "Oxford Groundsworks confirmed availability. Seasonal contract renewed.",
      },
      {
        id: "t5", label: "The Carlyle — June availability", type: "booking",
        status: "in-progress", assignedTo: "Travel Coordination",
        detail: "Contacted preferred reservations contact. Suite availability for June 9–16 being held pending confirmation.",
        eta: "Response by 2pm",
      },
    ],
  },
];

const SUGGESTED_PROMPTS = [
  "Prepare a quarterly summary for the client",
  "Book the Mayfair florals for next week",
  "Check on the St. Barths villa for January",
  "Draft a vendor change notice for household staff",
  "Arrange private transport for the family gathering",
];

function TaskRow({ task }: { task: OrchestratedTask }) {
  const cfg = orchTypeConfig[task.type];
  const Icon = cfg.icon;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 12px",
      background: task.status === "done" ? "rgba(52,211,153,0.04)" : task.status === "in-progress" ? GOLD_DIM : CREAM_FAINT,
      borderRadius: 8, border: `1px solid ${task.status === "done" ? "rgba(52,211,153,0.15)" : task.status === "in-progress" ? GOLD_BORDER : "rgba(255,255,255,0.04)"}`,
    }}>
      <div style={{ marginTop: 2 }}>
        {task.status === "done"
          ? <CheckCircle2 size={13} style={{ color: "#34d399" }} />
          : task.status === "in-progress"
          ? <div style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${GOLD}`, borderTopColor: "transparent", animation: "spin 0.9s linear infinite" }} />
          : <Circle size={13} style={{ color: MUTED }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <Icon size={11} style={{ color: cfg.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: CREAM }}>{task.label}</span>
        </div>
        {task.detail && <p style={{ fontSize: 11, color: CREAM_DIM, margin: 0, lineHeight: 1.5 }}>{task.detail}</p>}
        {task.eta && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Clock size={10} style={{ color: MUTED }} />
            <span style={{ fontSize: 10, color: MUTED }}>{task.eta}</span>
          </div>
        )}
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
        color: task.status === "done" ? "#34d399" : task.status === "in-progress" ? GOLD : MUTED,
        flexShrink: 0, marginTop: 2,
      }}>
        {task.status === "done" ? "Done" : task.status === "in-progress" ? "Active" : "Queued"}
      </span>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ConversationMessage }) {
  const [expanded, setExpanded] = useState(true);
  const isUser = msg.role === "user";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
      gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {!isUser && (
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={11} style={{ color: GOLD }} />
          </div>
        )}
        <span style={{ fontSize: 10, color: MUTED }}>{msg.role === "user" ? "You" : "Concierge"} · {msg.timestamp}</span>
        {isUser && (
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: CREAM_FAINT, border: `1px solid rgba(255,255,255,0.08)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={11} style={{ color: CREAM_DIM }} />
          </div>
        )}
      </div>
      <div style={{
        maxWidth: "85%",
        background: isUser ? CREAM_FAINT : GOLD_DIM,
        border: `1px solid ${isUser ? "rgba(255,255,255,0.06)" : GOLD_BORDER}`,
        borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
        padding: "12px 14px",
      }}>
        <p style={{ fontSize: 13, color: CREAM, margin: 0, lineHeight: 1.65 }}>{msg.content}</p>
      </div>

      {msg.orchestration && msg.orchestration.length > 0 && (
        <div style={{ width: "100%", maxWidth: "calc(85% + 34px)" }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer",
              color: CREAM_DIM, fontSize: 11, padding: "4px 0", marginBottom: 6,
            }}
          >
            <Sparkles size={11} style={{ color: GOLD }} />
            <span>Orchestrating {msg.orchestration.length} actions</span>
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {msg.orchestration.map(t => <TaskRow key={t.id} task={t} />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default function AIConcierge() {
  usePageMeta({ title: "White Glove AI Concierge — Carlota Jo" });
  const [messages, setMessages] = useState<ConversationMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function handleSend(text: string = input) {
    if (!text.trim()) return;
    const userMsg: ConversationMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: text.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const reply: ConversationMessage = {
        id: `m-${Date.now() + 1}`,
        role: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content: "Understood — I'll handle that immediately and confirm once resolved. Anything else I should coordinate at the same time?",
      };
      setMessages(prev => [...prev, reply]);
    }, 1800);
  }

  return (
    <div style={{ height: "calc(100vh - 64px)", background: DEEP, display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${GOLD_BORDER}`, flexShrink: 0 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Sparkles size={16} style={{ color: GOLD }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: CREAM, margin: 0 }}>White Glove AI Concierge</h2>
              <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>Natural language orchestration for UHNW life management</p>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399" }} />
              <span style={{ fontSize: 11, color: "rgba(52,211,153,0.7)" }}>Active</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isTyping && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={11} style={{ color: GOLD }} />
              </div>
              <div style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, borderRadius: "4px 12px 12px 12px", padding: "10px 16px" }}>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: "50%", background: GOLD,
                      animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div style={{ padding: "12px 24px 20px", borderTop: `1px solid ${GOLD_BORDER}`, flexShrink: 0 }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {SUGGESTED_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                style={{
                  fontSize: 11, color: CREAM_DIM,
                  background: CREAM_FAINT, border: `1px solid rgba(255,255,255,0.06)`,
                  borderRadius: 20, padding: "4px 10px", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = GOLD_BORDER; (e.currentTarget as HTMLElement).style.color = CREAM; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = CREAM_DIM; }}
              >
                {p}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Describe what you need — I'll orchestrate the rest..."
              rows={2}
              style={{
                flex: 1, background: CREAM_FAINT, border: `1px solid ${GOLD_BORDER}`,
                borderRadius: 10, padding: "10px 14px", color: CREAM, fontSize: 13,
                resize: "none", outline: "none", lineHeight: 1.5,
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: input.trim() ? GOLD : "rgba(196,170,126,0.15)",
                border: "none", cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.18s",
              }}
            >
              <Send size={15} style={{ color: input.trim() ? "#0a0906" : MUTED }} />
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }`}</style>
    </div>
  );
}
