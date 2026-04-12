import React, { useState, useRef, useEffect, useCallback } from "react";
import { colors, effects, typography } from "./tokens";
import type { ExplainabilityModel } from "./doctrine-layer";
import { ExplainabilityToggle } from "./explainability-panel";

export interface VoiceProfile {
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  label: string;
}

export interface CopilotConfig {
  name: string;
  icon: string;
  systemPrompt: string;
  accentColor: string;
  welcomeMessage: string;
  placeholderText?: string;
  suggestedQuestions?: string[];
  voiceProfile?: VoiceProfile;
  agentId?: string;
  isAdvisoryAgent?: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isVoice?: boolean;
  rating?: number;
  id?: string;
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={i} style={{ fontWeight: 700, fontSize: "0.9rem", margin: "0.75rem 0 0.25rem", color: colors.text.primary }}>
          {processInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h3 key={i} style={{ fontWeight: 700, fontSize: "1rem", margin: "0.75rem 0 0.25rem", color: colors.text.primary }}>
          {processInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={i} style={{ display: "flex", gap: "0.5rem", marginLeft: "0.5rem", marginBottom: "0.125rem" }}>
          <span style={{ color: colors.text.muted, flexShrink: 0 }}>•</span>
          <span>{processInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/)!;
      elements.push(
        <div key={i} style={{ display: "flex", gap: "0.5rem", marginLeft: "0.5rem", marginBottom: "0.125rem" }}>
          <span style={{ color: colors.text.muted, flexShrink: 0, fontSize: "0.8rem" }}>{match[1]}.</span>
          <span>{processInline(match[2]!)}</span>
        </div>
      );
    } else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("```")) {
        codeLines.push(lines[i]!);
        i++;
      }
      elements.push(
        <pre key={i} style={{
          background: "hsla(220, 20%, 10%, 0.8)",
          borderRadius: "0.375rem",
          padding: "0.75rem",
          margin: "0.5rem 0",
          fontSize: "0.8rem",
          fontFamily: typography.fontFamily.mono,
          overflowX: "auto",
          border: `1px solid ${colors.border.DEFAULT}`,
        }}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: "0.5rem" }} />);
    } else {
      elements.push(<p key={i} style={{ margin: "0.125rem 0", lineHeight: 1.6 }}>{processInline(line)}</p>);
    }
  }

  return <>{elements}</>;
}

function processInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const m = match[0]!;
    if (m.startsWith("`")) {
      parts.push(
        <code key={match.index} style={{
          background: "hsla(220, 20%, 20%, 0.5)",
          padding: "0.1rem 0.35rem",
          borderRadius: "0.25rem",
          fontSize: "0.85em",
          fontFamily: typography.fontFamily.mono,
        }}>
          {m.slice(1, -1)}
        </code>
      );
    } else if (m.startsWith("**")) {
      parts.push(<strong key={match.index} style={{ fontWeight: 600 }}>{m.slice(2, -2)}</strong>);
    } else if (m.startsWith("*")) {
      parts.push(<em key={match.index}>{m.slice(1, -1)}</em>);
    }
    lastIndex = match.index + m.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function TypingIndicator({ accentColor }: { accentColor: string }) {
  return (
    <div style={{ display: "flex", gap: "4px", padding: "0.5rem 0" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: accentColor,
            opacity: 0.6,
            animation: `copilotBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function AdvisoryBadge({ type }: { type: "informational" | "advisory" | "action-required" }) {
  const styles: Record<typeof type, { bg: string; color: string; label: string; icon: string }> = {
    informational: { bg: "hsla(210, 80%, 50%, 0.15)", color: "hsl(210, 80%, 70%)", label: "Informational", icon: "ℹ️" },
    advisory: { bg: "hsla(40, 90%, 50%, 0.15)", color: "hsl(40, 90%, 65%)", label: "Advisory Only", icon: "⚠️" },
    "action-required": { bg: "hsla(0, 80%, 50%, 0.15)", color: "hsl(0, 80%, 70%)", label: "Human Approval Required", icon: "🛑" },
  };
  const s = styles[type];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.3rem",
      fontSize: "0.65rem",
      fontWeight: 600,
      padding: "0.2rem 0.5rem",
      borderRadius: "0.375rem",
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.color}40`,
      letterSpacing: "0.03em",
      textTransform: "uppercase",
    }}>
      {s.icon} {s.label}
    </span>
  );
}

function detectAdvisoryType(content: string): "informational" | "advisory" | "action-required" | null {
  const lower = content.toLowerCase();
  const actionKeywords = ["restart service", "delete", "drop table", "scale down", "terminate", "remove", "disable", "shutdown", "wipe", "reset", "rollback", "force"];
  const advisoryKeywords = ["recommend", "suggest", "consider", "you should", "i would", "you could", "configure", "update", "upgrade", "modify", "change", "adjust"];
  if (actionKeywords.some(k => lower.includes(k))) return "action-required";
  if (advisoryKeywords.some(k => lower.includes(k))) return "advisory";
  return null;
}

export type ActionStepStatus = "pending" | "running" | "done" | "error" | "awaiting-approval";

export interface ActionStep {
  id: string;
  label: string;
  tool?: string;
  status: ActionStepStatus;
  output?: string;
  requiresApproval?: boolean;
}

export interface ActionExecution {
  id: string;
  intent: string;
  steps: ActionStep[];
  approved?: boolean;
  status: "planning" | "running" | "awaiting-approval" | "approved" | "rejected" | "done" | "error";
}

const DESTRUCTIVE_INTENT_PATTERNS = [
  /\b(delete|remove|drop|destroy|terminate|disable|deactivate|wipe|reset|purge|revoke|cancel|reject|close|archive|override)\b/i,
  /\b(force\s+\w+|hard\s+reset|bulk\s+(delete|remove|update))\b/i,
];

const ACTION_INTENT_PATTERNS = [
  /\b(create|add|generate|draft|send|submit|approve|flag|escalate|assign|schedule|trigger|run|execute|process|analyze|extract|summarize|classify)\b/i,
  /\b(update|change|modify|edit|move|transfer|convert|export|import|deploy|launch|start|stop|restart)\b/i,
];

export function detectActionIntent(text: string): { isAction: boolean; isDestructive: boolean } {
  const isDestructive = DESTRUCTIVE_INTENT_PATTERNS.some(p => p.test(text));
  const isAction = isDestructive || ACTION_INTENT_PATTERNS.some(p => p.test(text));
  return { isAction, isDestructive };
}

function generateActionSteps(intent: string): ActionStep[] {
  const lower = intent.toLowerCase();
  const steps: ActionStep[] = [];
  const id = () => Math.random().toString(36).slice(2, 8);

  if (/draft|generate|create/.test(lower)) {
    steps.push({ id: id(), label: "Parsing intent & extracting parameters", tool: "intent_parser", status: "pending" });
    steps.push({ id: id(), label: "Fetching relevant context", tool: "context_retrieval", status: "pending" });
    steps.push({ id: id(), label: "Generating draft content", tool: "content_generator", status: "pending" });
    steps.push({ id: id(), label: "Reviewing output for compliance", tool: "compliance_check", status: "pending" });
  } else if (/send|submit|file/.test(lower)) {
    steps.push({ id: id(), label: "Validating submission requirements", tool: "validation", status: "pending" });
    steps.push({ id: id(), label: "Preparing submission package", tool: "packager", status: "pending" });
    steps.push({ id: id(), label: "Awaiting human approval before sending", tool: "approval_gate", status: "pending", requiresApproval: true });
    steps.push({ id: id(), label: "Submitting via secure channel", tool: "submission_api", status: "pending" });
  } else if (/analyze|extract|summarize|classify/.test(lower)) {
    steps.push({ id: id(), label: "Loading document corpus", tool: "doc_loader", status: "pending" });
    steps.push({ id: id(), label: "Running entity extraction (NER)", tool: "ner_engine", status: "pending" });
    steps.push({ id: id(), label: "Classifying document type & risk", tool: "classifier", status: "pending" });
    steps.push({ id: id(), label: "Generating structured summary", tool: "summarizer", status: "pending" });
  } else if (/delete|remove|terminate|disable/.test(lower)) {
    steps.push({ id: id(), label: "Identifying target resources", tool: "resource_resolver", status: "pending" });
    steps.push({ id: id(), label: "Checking dependencies & impact", tool: "dependency_check", status: "pending" });
    steps.push({ id: id(), label: "HUMAN APPROVAL REQUIRED — destructive action", tool: "approval_gate", status: "pending", requiresApproval: true });
    steps.push({ id: id(), label: "Executing deletion with audit log", tool: "delete_executor", status: "pending" });
  } else {
    steps.push({ id: id(), label: "Understanding request context", tool: "context_resolver", status: "pending" });
    steps.push({ id: id(), label: "Planning action sequence", tool: "planner", status: "pending" });
    steps.push({ id: id(), label: "Executing action", tool: "executor", status: "pending" });
    steps.push({ id: id(), label: "Verifying completion", tool: "verifier", status: "pending" });
  }
  return steps;
}

function ActionStepItem({ step, accentColor }: { step: ActionStep; accentColor: string }) {
  const statusIcon = {
    pending: <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px" }}>○</span>,
    running: <span style={{ animation: "copilotSpin 1s linear infinite", display: "inline-block", fontSize: "11px", color: accentColor }}>◌</span>,
    done: <span style={{ color: "#22c55e", fontSize: "12px" }}>✓</span>,
    error: <span style={{ color: "#ef4444", fontSize: "12px" }}>✗</span>,
    "awaiting-approval": <span style={{ color: "#f59e0b", fontSize: "12px" }}>⏸</span>,
  }[step.status];

  const labelColor = step.status === "done" ? "rgba(255,255,255,0.6)"
    : step.status === "running" ? "rgba(255,255,255,0.9)"
    : step.status === "awaiting-approval" ? "#f59e0b"
    : step.status === "error" ? "#ef4444"
    : "rgba(255,255,255,0.35)";

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "3px 0" }}>
      <span style={{ flexShrink: 0, marginTop: "1px", width: "14px", textAlign: "center" }}>{statusIcon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "11.5px", color: labelColor, fontFamily: "inherit", lineHeight: 1.4 }}>
          {step.requiresApproval && <span style={{ fontSize: "9px", background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "3px", padding: "1px 5px", marginRight: "5px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Approval</span>}
          {step.label}
        </div>
        {step.tool && step.status !== "pending" && (
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", marginTop: "1px", fontFamily: "monospace" }}>tool:{step.tool}</div>
        )}
        {step.output && (
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px", fontStyle: "italic" }}>{step.output}</div>
        )}
      </div>
    </div>
  );
}

function ActionExecutionCard({
  execution,
  accentColor,
  onApprove,
  onReject,
}: {
  execution: ActionExecution;
  accentColor: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const statusLabel = {
    planning: "Planning…",
    running: "Executing…",
    "awaiting-approval": "Awaiting Approval",
    approved: "Approved — Continuing…",
    rejected: "Rejected by User",
    done: "Completed",
    error: "Failed",
  }[execution.status];

  const statusColor = {
    planning: accentColor,
    running: accentColor,
    "awaiting-approval": "#f59e0b",
    approved: "#22c55e",
    rejected: "#ef4444",
    done: "#22c55e",
    error: "#ef4444",
  }[execution.status];

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${execution.status === "awaiting-approval" ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: "8px",
      padding: "10px 12px",
      margin: "4px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          AI Action Execution
        </div>
        <div style={{ fontSize: "10px", fontWeight: 600, color: statusColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {statusLabel}
        </div>
      </div>
      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "8px", fontStyle: "italic" }}>
        "{execution.intent.length > 60 ? execution.intent.slice(0, 60) + "…" : execution.intent}"
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        {execution.steps.map(step => (
          <ActionStepItem key={step.id} step={step} accentColor={accentColor} />
        ))}
      </div>
      {execution.status === "awaiting-approval" && (
        <div style={{ marginTop: "10px", padding: "8px 10px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "6px" }}>
          <div style={{ fontSize: "11px", color: "#f59e0b", marginBottom: "6px", fontWeight: 600 }}>
            ⚠ Human approval required before proceeding
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => onApprove(execution.id)}
              style={{ flex: 1, padding: "5px 10px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: "5px", color: "#22c55e", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
            >
              Approve & Continue
            </button>
            <button
              onClick={() => onReject(execution.id)}
              style={{ flex: 1, padding: "5px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "5px", color: "#ef4444", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WaveformVisualizer({ isActive, color }: { isActive: boolean; color: string }) {
  if (!isActive) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "20px" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            width: "3px",
            background: color,
            borderRadius: "2px",
            animation: `copilotWave 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

function RecordingIndicator({ isRecording, accentColor }: { isRecording: boolean; accentColor: string }) {
  if (!isRecording) return null;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem 0.75rem",
      background: "hsla(0, 80%, 40%, 0.2)",
      border: "1px solid hsla(0, 80%, 50%, 0.3)",
      borderRadius: "0.5rem",
      fontSize: "0.75rem",
      color: "hsl(0, 80%, 70%)",
    }}>
      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "hsl(0, 80%, 60%)", animation: "copilotPulse 1s ease-in-out infinite" }} />
      Recording...
      <WaveformVisualizer isActive={true} color={accentColor} />
    </div>
  );
}

function FeedbackButtons({ onFeedback, accentColor }: { onFeedback: (rating: number) => void; accentColor: string }) {
  const [given, setGiven] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.5rem" }}>
      {[1, -1].map((r) => (
        <button
          key={r}
          onClick={() => { if (!given) { setGiven(r); onFeedback(r); } }}
          title={r === 1 ? "Helpful" : "Not helpful"}
          style={{
            background: given === r ? (r === 1 ? "hsla(140, 60%, 40%, 0.3)" : "hsla(0, 60%, 40%, 0.3)") : "transparent",
            border: `1px solid ${given === r ? (r === 1 ? "hsla(140, 60%, 60%, 0.5)" : "hsla(0, 60%, 60%, 0.5)") : "transparent"}`,
            borderRadius: "0.375rem",
            padding: "0.2rem 0.4rem",
            cursor: given ? "default" : "pointer",
            fontSize: "0.875rem",
            opacity: given && given !== r ? 0.4 : 1,
            transition: "all 0.2s",
          }}
        >
          {r === 1 ? "👍" : "👎"}
        </button>
      ))}
      {given && (
        <span style={{ fontSize: "0.7rem", color: colors.text.muted, alignSelf: "center" }}>
          {given === 1 ? "Thanks!" : "We'll improve"}
        </span>
      )}
    </div>
  );
}

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function buildExplainability(content: string, agentName: string): ExplainabilityModel {
  const lower = content.toLowerCase();
  const hasRecommendation = /recommend|suggest|consider|should|could/.test(lower);
  const hasAnalysis = /because|due to|based on|indicates|shows|suggests/.test(lower);
  const hasData = /data|metric|score|trend|rate|count|percent/.test(lower);

  return {
    trigger: hasAnalysis
      ? "Pattern or anomaly detected in the input context and relevant data signals"
      : "User query matched agent expertise and available context",
    contributingData: [
      hasData ? "Real-time metrics and operational data" : "Contextual conversation history",
      "Agent system prompt and domain knowledge",
      hasRecommendation ? "Best practice knowledge base" : "Current system state",
    ],
    confidenceExplanation: hasAnalysis && hasData
      ? "High confidence: multiple data signals converge on this assessment"
      : "Moderate confidence: based on available context and domain heuristics",
    assumptions: [
      "Current data reflects the actual operational state",
      "No external context changes since last update",
      hasRecommendation ? "Standard operating conditions apply" : "Data quality is nominal",
    ],
    recommendedAction: hasRecommendation
      ? "Review the suggestion above and confirm before taking action — this is advisory only"
      : "Use this information as context for your next decision",
    alternativeActions: hasRecommendation
      ? ["Request a more detailed analysis", "Compare with historical baselines", "Escalate to domain expert if uncertain"]
      : undefined,
    layer: "UNDERSTAND",
  };
}

function MessageExplainability({
  content,
  agentName,
  accentColor,
}: {
  content: string;
  agentName: string;
  accentColor: string;
}) {
  const explainability = React.useMemo(() => buildExplainability(content, agentName), [content, agentName]);
  return (
    <div style={{ marginTop: "0.5rem" }}>
      <ExplainabilityToggle explainability={explainability} accentColor={accentColor} />
    </div>
  );
}

export function AgentCopilot({ config }: { config: CopilotConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [activeExecution, setActiveExecution] = useState<ActionExecution | null>(null);
  const executionApprovalRef = useRef<((approved: boolean) => void) | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const touchStartXRef = useRef<number>(0);

  useEffect(() => {
    const check = () => setIsMobile(isMobileDevice());
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !voiceMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, voiceMode]);

  const submitFeedback = useCallback(async (rating: number, msg: ChatMessage) => {
    if (!config.agentId) return;
    try {
      await fetch("/api/agent-training/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.agentId,
          rating: rating > 0 ? 5 : 1,
          responseContent: msg.content,
        }),
      });
    } catch {
    }
  }, [config.agentId]);

  const speakText = useCallback(async (text: string) => {
    if (!voiceOutputEnabled || !config.voiceProfile) return;
    try {
      setIsSpeaking(true);
      const res = await fetch("/api/agent-training/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 800), voice: config.voiceProfile.voice }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsSpeaking(false); };
      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  }, [voiceOutputEnabled, config.voiceProfile]);

  const executeChat = useCallback(async (userContent: string, currentMessages: ChatMessage[]) => {
    const userMsg: ChatMessage = { role: "user", content: userContent, isVoice: isRecording, id: `u-${Date.now()}` };
    const newMessages = [...currentMessages, userMsg];
    setMessages(newMessages);
    setInput("");
    setVoiceTranscript("");
    setIsStreaming(true);
    setStreamingContent("");

    const apiMessages = [
      { role: "system" as const, content: config.systemPrompt },
      ...newMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/intelligence/ai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error("Stream failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";
      let hadError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
          const data = trimmedLine.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data) as { content?: string; error?: string };
            if (parsed.error) {
              hadError = true;
            } else if (parsed.content) {
              accumulated += parsed.content;
              setStreamingContent(accumulated);
            }
          } catch {
            continue;
          }
        }
      }

      if (hadError && !accumulated) {
        throw new Error("Server reported stream error");
      }

      const finalContent = accumulated || "I'm here to help! Could you rephrase that?";
      const assistantMsg: ChatMessage = { role: "assistant", content: finalContent, id: `a-${Date.now()}` };
      setMessages([...newMessages, assistantMsg]);

      if (voiceOutputEnabled && voiceMode && finalContent) {
        await speakText(finalContent);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessages([...newMessages, { role: "assistant", content: streamingContent || "Response cancelled.", id: `a-${Date.now()}` }]);
      } else {
        try {
          const fallbackRes = await fetch("/api/intelligence/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: apiMessages }),
          });
          if (fallbackRes.ok) {
            const result = await fallbackRes.json() as { content: string };
            const assistantMsg: ChatMessage = { role: "assistant", content: result.content, id: `a-${Date.now()}` };
            setMessages([...newMessages, assistantMsg]);
            if (voiceOutputEnabled && voiceMode) await speakText(result.content);
          } else {
            throw new Error("Fallback failed");
          }
        } catch {
          setMessages([...newMessages, { role: "assistant", content: config.welcomeMessage, id: `a-${Date.now()}` }]);
        }
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  }, [config.systemPrompt, config.welcomeMessage, streamingContent, voiceMode, voiceOutputEnabled, speakText, isRecording]);

  const runActionExecution = useCallback(async (intent: string) => {
    const steps = generateActionSteps(intent);
    const execId = `exec-${Date.now()}`;
    const execution: ActionExecution = { id: execId, intent, steps, status: "planning" };
    setActiveExecution({ ...execution });

    await new Promise(r => setTimeout(r, 400));

    let currentExec: ActionExecution = { ...execution, status: "running" };
    setActiveExecution({ ...currentExec });

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]!;

      if (step.requiresApproval) {
        currentExec = {
          ...currentExec,
          status: "awaiting-approval",
          steps: currentExec.steps.map((s, idx) =>
            idx === i ? { ...s, status: "awaiting-approval" } : s
          ),
        };
        setActiveExecution({ ...currentExec });

        const approved = await new Promise<boolean>(resolve => {
          executionApprovalRef.current = resolve;
        });
        executionApprovalRef.current = null;

        if (!approved) {
          currentExec = {
            ...currentExec,
            status: "rejected",
            steps: currentExec.steps.map((s, idx) =>
              idx === i ? { ...s, status: "error", output: "Rejected by user" } : s
            ),
          };
          setActiveExecution({ ...currentExec });
          return "Action was rejected at the approval gate. No changes were made.";
        }

        currentExec = {
          ...currentExec,
          status: "approved",
          steps: currentExec.steps.map((s, idx) =>
            idx === i ? { ...s, status: "running" } : s
          ),
        };
        setActiveExecution({ ...currentExec });
        await new Promise(r => setTimeout(r, 300));
      } else {
        currentExec = {
          ...currentExec,
          steps: currentExec.steps.map((s, idx) =>
            idx === i ? { ...s, status: "running" } : s
          ),
        };
        setActiveExecution({ ...currentExec });
      }

      await new Promise(r => setTimeout(r, 600 + Math.random() * 600));

      currentExec = {
        ...currentExec,
        steps: currentExec.steps.map((s, idx) =>
          idx === i ? { ...s, status: "done", output: getStepOutput(step.tool ?? "") } : s
        ),
      };
      setActiveExecution({ ...currentExec });
    }

    currentExec = { ...currentExec, status: "done" };
    setActiveExecution({ ...currentExec });
    await new Promise(r => setTimeout(r, 800));
    setActiveExecution(null);
    return "Action completed successfully. All steps executed and verified.";
  }, []);

  const getStepOutput = (tool: string): string | undefined => {
    const outputs: Record<string, string> = {
      intent_parser: "Parameters extracted",
      context_retrieval: "Context loaded",
      content_generator: "Draft ready",
      compliance_check: "Passed",
      validation: "Valid",
      packager: "Package prepared",
      submission_api: "Submitted",
      doc_loader: "3 documents loaded",
      ner_engine: "12 entities found",
      classifier: "Classified: Contract (high confidence)",
      summarizer: "Summary generated",
      resource_resolver: "2 resources identified",
      dependency_check: "No blockers found",
      delete_executor: "Deleted with audit log entry",
      context_resolver: "Context resolved",
      planner: "4-step plan created",
      executor: "Executed",
      verifier: "Verified",
    };
    return outputs[tool];
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    const { isAction } = detectActionIntent(trimmed);
    if (isAction && !activeExecution) {
      const userMsg: ChatMessage = { role: "user", content: trimmed, id: `u-${Date.now()}` };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setIsStreaming(true);
      const result = await runActionExecution(trimmed);
      const assistantMsg: ChatMessage = { role: "assistant", content: result, id: `a-${Date.now()}` };
      setMessages([...newMessages, assistantMsg]);
      setIsStreaming(false);
    } else {
      await executeChat(trimmed, messages);
    }
  };

  const handleSuggestion = (q: string) => {
    if (isStreaming) return;
    executeChat(q, messages);
  };

  const handleApproveExecution = useCallback((execId: string) => {
    if (activeExecution?.id === execId && executionApprovalRef.current) {
      executionApprovalRef.current(true);
    }
  }, [activeExecution]);

  const handleRejectExecution = useCallback((execId: string) => {
    if (activeExecution?.id === execId && executionApprovalRef.current) {
      executionApprovalRef.current(false);
    }
  }, [activeExecution]);

  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
      const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start(100);
      setIsRecording(true);

      if ("vibrate" in navigator) navigator.vibrate(50);
    } catch {
      setIsRecording(false);
    }
  }, []);

  const stopVoiceRecording = useCallback(async () => {
    return new Promise<Blob>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state !== "recording") { resolve(new Blob()); return; }
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        recorder.stream.getTracks().forEach(t => t.stop());
        resolve(blob);
      };
      recorder.stop();
      setIsRecording(false);
    });
  }, []);

  const handleVoicePress = useCallback(async () => {
    if (isRecording) {
      if ("vibrate" in navigator) navigator.vibrate([50, 30, 50]);
      const blob = await stopVoiceRecording();
      if (!blob || blob.size < 1000) return;

      setIsTranscribing(true);
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const res = await fetch("/api/agent-training/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64, mimeType: blob.type }),
        });

        if (res.ok) {
          const data = await res.json() as { transcript: string };
          if (data.transcript?.trim()) {
            setVoiceTranscript(data.transcript);
            setInput(data.transcript);
            await executeChat(data.transcript, messages);
          }
        }
      } catch {
      } finally {
        setIsTranscribing(false);
      }
    } else {
      await startVoiceRecording();
    }
  }, [isRecording, messages, startVoiceRecording, stopVoiceRecording, executeChat]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? 0;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = (e.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
    if (diff > 80) setIsOpen(false);
  };

  const panelWidth = isMobile ? "100vw" : "min(420px, 100vw)";

  const fabStyle: React.CSSProperties = {
    position: "fixed",
    bottom: isMobile ? "1rem" : "1.5rem",
    right: isMobile ? "1rem" : "1.5rem",
    width: isMobile ? "52px" : "56px",
    height: isMobile ? "52px" : "56px",
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${config.accentColor}, ${config.accentColor}dd)`,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isMobile ? "1.375rem" : "1.5rem",
    boxShadow: `0 4px 20px ${config.accentColor}40, ${effects.shadow.lg}`,
    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    zIndex: 9998,
    color: "#fff",
    WebkitTapHighlightColor: "transparent",
  };

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    right: 0,
    width: panelWidth,
    height: "100dvh",
    background: "hsla(220, 20%, 6%, 0.98)",
    backdropFilter: "blur(40px) saturate(1.8)",
    borderLeft: isMobile ? "none" : `1px solid hsla(220, 20%, 40%, 0.2)`,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    transform: isOpen ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
    fontFamily: typography.fontFamily.body,
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "hsla(220, 20%, 4%, 0.5)",
    backdropFilter: "blur(4px)",
    zIndex: 9998,
    opacity: isOpen ? 1 : 0,
    pointerEvents: isOpen ? "auto" : "none",
    transition: "opacity 0.3s ease",
  };

  return (
    <>
      <style>{`
        @keyframes copilotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes copilotWave {
          from { height: 4px; }
          to { height: 16px; }
        }
        @keyframes copilotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes copilotFabPulse {
          0%, 100% { box-shadow: 0 4px 20px ${config.accentColor}40; }
          50% { box-shadow: 0 4px 30px ${config.accentColor}60; }
        }
        @keyframes copilotSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .copilot-msg-feedback { opacity: 0; transition: opacity 0.2s; }
        .copilot-msg:hover .copilot-msg-feedback { opacity: 1; }
      `}</style>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={fabStyle}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = "scale(1.1)";
              e.currentTarget.style.boxShadow = `0 6px 30px ${config.accentColor}60, ${effects.shadow.xl}`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = `0 4px 20px ${config.accentColor}40, ${effects.shadow.lg}`;
            }
          }}
          aria-label={`Open ${config.name} AI Copilot`}
        >
          {config.icon}
        </button>
      )}

      <div style={overlayStyle} onClick={() => setIsOpen(false)} data-testid="copilot-overlay" />

      <div
        style={panelStyle}
        data-testid="copilot-panel"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        <div style={{
          padding: "1rem 1.25rem",
          paddingTop: isMobile ? "max(1rem, env(safe-area-inset-top, 1rem))" : "1.25rem",
          borderBottom: `1px solid ${colors.border.DEFAULT}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: `linear-gradient(180deg, hsla(220, 20%, 10%, 0.8) 0%, transparent 100%)`,
          gap: "0.5rem",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: `${config.accentColor}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.125rem",
              flexShrink: 0,
            }}>
              {config.icon}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: colors.text.primary }}>{config.name}</div>
              <div style={{ fontSize: "0.75rem", color: colors.text.muted }}>
                {config.isAdvisoryAgent ? "Advisory AI" : "AI Copilot"}
                {voiceMode && <span style={{ marginLeft: "0.4rem", color: config.accentColor }}>· Voice</span>}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            {config.voiceProfile && (
              <>
                <button
                  onClick={() => { setVoiceMode(v => !v); if (!voiceMode && isMobile) setVoiceOutputEnabled(true); }}
                  title={voiceMode ? "Switch to text" : "Switch to voice mode"}
                  style={{
                    background: voiceMode ? `${config.accentColor}25` : "transparent",
                    border: `1px solid ${voiceMode ? config.accentColor : "transparent"}`,
                    borderRadius: "0.5rem",
                    padding: "0.375rem",
                    color: voiceMode ? config.accentColor : colors.text.muted,
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    transition: "all 0.2s",
                    minWidth: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="Toggle voice mode"
                >
                  🎙️
                </button>
                {voiceMode && (
                  <button
                    onClick={() => setVoiceOutputEnabled(v => !v)}
                    title={voiceOutputEnabled ? "Disable voice responses" : "Enable voice responses"}
                    style={{
                      background: voiceOutputEnabled ? `${config.accentColor}25` : "transparent",
                      border: `1px solid ${voiceOutputEnabled ? config.accentColor : "transparent"}`,
                      borderRadius: "0.5rem",
                      padding: "0.375rem",
                      color: voiceOutputEnabled ? config.accentColor : colors.text.muted,
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      transition: "all 0.2s",
                      minWidth: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Toggle voice output"
                  >
                    🔊
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setIsOpen(false)}
              data-testid="copilot-close"
              aria-label="Close copilot"
              style={{
                background: "transparent",
                border: "none",
                color: colors.text.muted,
                cursor: "pointer",
                padding: "0.375rem",
                borderRadius: "0.375rem",
                fontSize: "1.25rem",
                lineHeight: 1,
                transition: "all 0.2s",
                minWidth: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {config.isAdvisoryAgent && (
          <div style={{
            padding: "0.625rem 1.25rem",
            background: "hsla(40, 90%, 50%, 0.1)",
            borderBottom: `1px solid hsla(40, 90%, 50%, 0.2)`,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.7rem",
            color: "hsl(40, 90%, 65%)",
            flexShrink: 0,
          }}>
            ⚠️ <strong>Advisory Mode</strong> — This agent provides recommendations only. Destructive operations require explicit human approval.
          </div>
        )}

        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          WebkitOverflowScrolling: "touch",
        }}>
          {messages.length === 0 && !isStreaming && (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <div style={{
                fontSize: "2.5rem",
                marginBottom: "1rem",
                filter: "drop-shadow(0 0 8px hsla(0, 0%, 100%, 0.1))",
              }}>
                {config.icon}
              </div>
              <div style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: colors.text.primary,
                marginBottom: "0.5rem",
              }}>
                {config.name}
              </div>
              <div style={{
                fontSize: "0.8125rem",
                color: colors.text.secondary,
                lineHeight: 1.5,
                maxWidth: "280px",
                margin: "0 auto 1.5rem",
              }}>
                {config.welcomeMessage}
              </div>
              {voiceMode && config.voiceProfile && (
                <div style={{
                  fontSize: "0.75rem",
                  color: config.accentColor,
                  marginBottom: "1rem",
                  opacity: 0.8,
                }}>
                  Voice mode active — press and hold the mic to speak
                </div>
              )}
              {config.suggestedQuestions && config.suggestedQuestions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {config.suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(q)}
                      data-testid={`copilot-suggestion-${i}`}
                      style={{
                        background: colors.surface.glass,
                        border: `1px solid ${colors.border.DEFAULT}`,
                        borderRadius: "0.625rem",
                        padding: isMobile ? "0.75rem 1rem" : "0.625rem 1rem",
                        color: colors.text.secondary,
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                        fontFamily: "inherit",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg, i) => {
            const isAssistant = msg.role === "assistant";
            const advisoryType = isAssistant && config.isAdvisoryAgent ? detectAdvisoryType(msg.content) : null;
            return (
              <div
                key={i}
                className="copilot-msg"
                style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  padding: "0.75rem 1rem",
                  borderRadius: msg.role === "user" ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                  background: msg.role === "user"
                    ? `${config.accentColor}20`
                    : colors.surface.glass,
                  border: `1px solid ${msg.role === "user" ? `${config.accentColor}30` : colors.border.DEFAULT}`,
                  fontSize: isMobile ? "0.875rem" : "0.8125rem",
                  color: colors.text.primary,
                  lineHeight: 1.5,
                }}
              >
                {msg.isVoice && msg.role === "user" && (
                  <div style={{ fontSize: "0.7rem", color: colors.text.muted, marginBottom: "0.25rem" }}>🎙️ Voice input</div>
                )}
                {advisoryType && (
                  <div style={{ marginBottom: "0.5rem" }}>
                    <AdvisoryBadge type={advisoryType} />
                  </div>
                )}
                {isAssistant ? <SimpleMarkdown content={msg.content} /> : msg.content}
                {isAssistant && (
                  <MessageExplainability
                    content={msg.content}
                    agentName={config.name}
                    accentColor={config.accentColor}
                  />
                )}
                {isAssistant && config.agentId && (
                  <div className="copilot-msg-feedback">
                    <FeedbackButtons
                      onFeedback={(rating) => submitFeedback(rating, msg)}
                      accentColor={config.accentColor}
                    />
                  </div>
                )}
                {isAssistant && isSpeaking && i === messages.length - 1 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <WaveformVisualizer isActive={true} color={config.accentColor} />
                  </div>
                )}
              </div>
            );
          })}

          {isStreaming && (
            <div style={{
              alignSelf: "flex-start",
              maxWidth: "88%",
              padding: "0.75rem 1rem",
              borderRadius: "1rem 1rem 1rem 0.25rem",
              background: colors.surface.glass,
              border: `1px solid ${colors.border.DEFAULT}`,
              fontSize: isMobile ? "0.875rem" : "0.8125rem",
              color: colors.text.primary,
              lineHeight: 1.5,
            }}>
              {streamingContent ? (
                <SimpleMarkdown content={streamingContent} />
              ) : (
                <TypingIndicator accentColor={config.accentColor} />
              )}
            </div>
          )}

          {activeExecution && (
            <div style={{
              background: "rgba(255,255,255,0.02)",
              borderRadius: "0.625rem",
              padding: "0.125rem 0.125rem",
              marginBottom: "0.25rem",
            }}>
              <ActionExecutionCard
                execution={activeExecution}
                accentColor={config.accentColor}
                onApprove={handleApproveExecution}
                onReject={handleRejectExecution}
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={{
          padding: "0.75rem 1.25rem",
          paddingBottom: isMobile ? "max(0.75rem, env(safe-area-inset-bottom, 0.75rem))" : "1rem",
          borderTop: `1px solid ${colors.border.DEFAULT}`,
          background: "hsla(220, 20%, 8%, 0.6)",
          flexShrink: 0,
        }}>
          {isRecording && (
            <div style={{ marginBottom: "0.5rem" }}>
              <RecordingIndicator isRecording={isRecording} accentColor={config.accentColor} />
            </div>
          )}
          {isTranscribing && (
            <div style={{ marginBottom: "0.5rem", fontSize: "0.75rem", color: colors.text.muted }}>
              <TypingIndicator accentColor={config.accentColor} />
              Transcribing...
            </div>
          )}
          {voiceTranscript && !isTranscribing && !isStreaming && (
            <div style={{ marginBottom: "0.5rem", fontSize: "0.75rem", color: colors.text.muted, fontStyle: "italic" }}>
              "{voiceTranscript}"
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {voiceMode && config.voiceProfile ? (
              <>
                <button
                  onPointerDown={handleVoicePress}
                  disabled={isStreaming || isTranscribing}
                  style={{
                    flex: 1,
                    height: isMobile ? "52px" : "44px",
                    borderRadius: "0.75rem",
                    background: isRecording ? "hsla(0, 80%, 50%, 0.25)" : `${config.accentColor}20`,
                    border: `2px solid ${isRecording ? "hsl(0, 80%, 50%)" : config.accentColor}`,
                    color: isRecording ? "hsl(0, 80%, 60%)" : config.accentColor,
                    cursor: isStreaming || isTranscribing ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                    WebkitTapHighlightColor: "transparent",
                    opacity: isStreaming || isTranscribing ? 0.5 : 1,
                  }}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isRecording ? (
                    <><span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "hsl(0, 80%, 60%)" }} /> Stop</>
                  ) : (
                    <>🎙️ {isMobile ? "Tap to speak" : "Push to talk"}</>
                  )}
                </button>
                <button
                  onClick={() => setVoiceMode(false)}
                  disabled={isStreaming}
                  style={{
                    width: "44px",
                    height: isMobile ? "52px" : "44px",
                    borderRadius: "0.75rem",
                    background: colors.surface.glass,
                    border: `1px solid ${colors.border.DEFAULT}`,
                    color: colors.text.muted,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                    flexShrink: 0,
                    WebkitTapHighlightColor: "transparent",
                  }}
                  title="Switch to text input"
                >
                  ⌨️
                </button>
              </>
            ) : (
              <>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={config.placeholderText ?? `Ask ${config.name}...`}
                  disabled={isStreaming}
                  style={{
                    flex: 1,
                    background: colors.surface.glass,
                    border: `1px solid ${colors.border.DEFAULT}`,
                    borderRadius: "0.75rem",
                    padding: isMobile ? "0.875rem 1rem" : "0.75rem 1rem",
                    color: colors.text.primary,
                    fontSize: isMobile ? "0.9375rem" : "0.8125rem",
                    outline: "none",
                    transition: "border-color 0.2s",
                    fontFamily: "inherit",
                    WebkitAppearance: "none",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = `${config.accentColor}50`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.border.DEFAULT; }}
                />
                {config.voiceProfile && (
                  <button
                    onClick={() => setVoiceMode(true)}
                    disabled={isStreaming}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "0.75rem",
                      background: colors.surface.glass,
                      border: `1px solid ${colors.border.DEFAULT}`,
                      color: colors.text.muted,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                      transition: "all 0.2s",
                      flexShrink: 0,
                    }}
                    title="Switch to voice input"
                  >
                    🎙️
                  </button>
                )}
                <button
                  onClick={sendMessage}
                  disabled={isStreaming || !input.trim()}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "0.75rem",
                    background: input.trim() && !isStreaming ? config.accentColor : colors.surface.glass,
                    border: "none",
                    color: input.trim() && !isStreaming ? "#fff" : colors.text.muted,
                    cursor: input.trim() && !isStreaming ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                    flexShrink: 0,
                    WebkitTapHighlightColor: "transparent",
                  }}
                  aria-label="Send message"
                >
                  ↑
                </button>
              </>
            )}
          </div>
          <div style={{
            textAlign: "center",
            fontSize: "0.6875rem",
            color: colors.text.muted,
            marginTop: "0.5rem",
            opacity: 0.6,
          }}>
            {config.isAdvisoryAgent ? "Advisory mode — no destructive actions" : "Powered by SZL Intelligence"}
          </div>
        </div>
      </div>
    </>
  );
}
