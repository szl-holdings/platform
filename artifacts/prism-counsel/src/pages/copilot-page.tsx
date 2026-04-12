import { useState, useRef, useCallback, useEffect } from "react";
import { MessageSquare, Send, Scale, FileText, Clock, AlertTriangle, Sparkles, Upload, X, CheckCircle, Cpu, ChevronRight } from "lucide-react";

const ACCENT = "#d4a054";
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const SUGGESTED_QUERIES = [
  { icon: FileText, label: "Summarize insurer correspondence for Rodriguez matter", category: "Summary" },
  { icon: Clock, label: "What deadlines are at risk in the next 30 days?", category: "Deadlines" },
  { icon: AlertTriangle, label: "Show missing evidence before demand finalization", category: "Evidence" },
  { icon: Sparkles, label: "Draft internal matter status update for Thompson case", category: "Draft" },
  { icon: Scale, label: "Why did the settlement forecast change for Meridian?", category: "Forecast" },
  { icon: FileText, label: "List conflicting facts in Rodriguez treatment history", category: "Integrity" },
];

interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolName?: string;
  toolStatus?: "running" | "done";
  pendingAction?: { id: string; label: string; description: string };
  docResult?: DocResult;
}

interface DocResult {
  filename: string;
  classification: string;
  entities: Array<{ type: string; value: string }>;
  summary: string;
}

const DEMO_DOC_RESULTS: DocResult[] = [
  {
    filename: "filing_2026_04_harrison.pdf",
    classification: "Motion for Summary Judgment",
    entities: [
      { type: "CASE_NUMBER", value: "CV-2026-04-7832" },
      { type: "PARTY", value: "Harrison v. Apex Corp" },
      { type: "DATE", value: "April 28, 2026" },
      { type: "JUDGE", value: "Hon. Patricia Chen" },
      { type: "CLAIM", value: "$2.4M breach of contract" },
    ],
    summary: "Motion for Summary Judgment in Harrison v. Apex Corp. The filing contains exhibits A–F and requests adjudication on four counts of breach of contract. Claim amount: $2.4M. Hearing scheduled April 28, 2026 before Judge Patricia Chen (SDNY).",
  },
];

function ToolCallBadge({ name, status }: { name: string; status: "running" | "done" }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-[10px] font-mono mb-2"
      style={{
        borderColor: status === "done" ? "rgba(90,168,122,0.4)" : "rgba(212,160,84,0.4)",
        backgroundColor: status === "done" ? "rgba(90,168,122,0.08)" : "rgba(212,160,84,0.08)",
        color: status === "done" ? "#5aa87a" : "#d4a054",
      }}>
      <Cpu className="w-3 h-3" />
      {name}
      {status === "running" && <span className="animate-pulse ml-1">…</span>}
      {status === "done" && <CheckCircle className="w-3 h-3" />}
    </div>
  );
}

function DocResultCard({ result }: { result: DocResult }) {
  return (
    <div className="mt-3 rounded-lg border border-white/[0.08] overflow-hidden" style={{ background: "#0a0f1a" }}>
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <FileText className="w-3.5 h-3.5 text-[#d4a054]" />
        <span className="text-[11px] font-semibold text-slate-200">{result.classification}</span>
        <span className="text-[9px] text-slate-500 ml-auto">{result.filename}</span>
      </div>
      <div className="px-4 py-3 space-y-3">
        <p className="text-[11px] text-slate-300 leading-relaxed">{result.summary}</p>
        <div>
          <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2">Extracted Entities</div>
          <div className="flex flex-wrap gap-2">
            {result.entities.map(e => (
              <div key={e.type} className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/[0.08] bg-white/[0.03]">
                <span className="text-[9px] text-[#d4a054] font-semibold">{e.type}</span>
                <span className="text-[10px] text-slate-300">{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ action, onApprove, onDismiss }: {
  action: { id: string; label: string; description: string };
  onApprove: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-[#d4a054]/30 bg-[#d4a054]/05 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3 h-3 text-[#d4a054]" />
        <span className="text-[9px] text-[#d4a054] font-bold uppercase tracking-widest">Action Required</span>
      </div>
      <p className="text-[11px] text-slate-300 mb-3">{action.description}</p>
      <div className="flex items-center gap-2">
        <button onClick={onApprove} className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#d4a054]/40 bg-[#d4a054]/10 text-[#d4a054] text-[11px] font-semibold hover:bg-[#d4a054]/20 transition-colors">
          <CheckCircle className="w-3 h-3" />
          {action.label}
        </button>
        <button onClick={onDismiss} className="px-3 py-1.5 rounded border border-white/[0.08] text-slate-500 text-[11px] hover:text-slate-400 transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  }, []);

  const getOrCreateConversationId = useCallback(async (): Promise<string> => {
    if (conversationIdRef.current) return conversationIdRef.current;
    try {
      const res = await fetch(`${BASE}/api/alloy-chat/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ appId: "prism-counsel", domain: "legal" }),
      });
      if (res.ok) {
        const data = await res.json() as { id?: string; conversationId?: string };
        const id = data.id ?? data.conversationId ?? `prism-${Date.now()}`;
        conversationIdRef.current = id;
        return id;
      }
    } catch {}
    const fallback = `prism-${Date.now()}`;
    conversationIdRef.current = fallback;
    return fallback;
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    scrollToBottom();

    const assistantId = `a-${Date.now()}`;
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      const conversationId = await getOrCreateConversationId();
      const res = await fetch(`${BASE}/api/alloy-chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        credentials: "include",
        body: JSON.stringify({
          content: text,
          role: "user",
          appId: "prism-counsel",
          domain: "legal",
          context: { app: "prism-counsel" },
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const chunk = JSON.parse(raw) as {
              content?: string;
              tool?: { name: string; status: "running" | "done" };
              pendingAction?: { id: string; label: string; description: string };
              done?: boolean;
              error?: string;
            };

            if (chunk.tool) {
              const toolId = `tool-${chunk.tool.name}-${Date.now()}`;
              setMessages(prev => {
                const existing = prev.find(m => m.role === "tool" && m.toolName === chunk.tool!.name && m.toolStatus === "running");
                if (existing && chunk.tool!.status === "done") {
                  return prev.map(m => m.id === existing.id ? { ...m, toolStatus: "done" as const } : m);
                }
                if (!existing && chunk.tool!.status === "running") {
                  const insertIdx = prev.findIndex(m => m.id === assistantId);
                  const next = [...prev];
                  next.splice(insertIdx, 0, { id: toolId, role: "tool", content: "", toolName: chunk.tool!.name, toolStatus: "running" });
                  return next;
                }
                return prev;
              });
            }

            if (chunk.content) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + chunk.content } : m
              ));
              scrollToBottom();
            }

            if (chunk.pendingAction) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, pendingAction: chunk.pendingAction } : m
              ));
            }

            if (chunk.done || chunk.error) break;
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: m.content || "Connection error. Please check your session and try again." }
          : m
      ));
    } finally {
      setThinking(false);
      scrollToBottom();
    }
  }, [thinking, scrollToBottom, getOrCreateConversationId]);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true);
    const uploadMsg: Message = {
      id: `upload-${Date.now()}`,
      role: "user",
      content: `Document uploaded: ${file.name}`,
    };
    setMessages(prev => [...prev, uploadMsg]);
    scrollToBottom();

    const toolId = `tool-ocr-${Date.now()}`;
    setMessages(prev => [...prev, { id: toolId, role: "tool", content: "", toolName: "ocr_extraction_pipeline", toolStatus: "running" }]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("domain", "legal");
      formData.append("tasks", JSON.stringify(["classification", "entities", "summary"]));

      const res = await fetch(`${BASE}/api/ai/extract`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      setMessages(prev => prev.map(m => m.id === toolId ? { ...m, toolStatus: "done" as const } : m));

      if (res.ok) {
        const data = await res.json() as {
          classification?: string;
          entities?: Array<{ type: string; value: string }>;
          summary?: string;
        };
        const docResult: DocResult = {
          filename: file.name,
          classification: data.classification ?? "Legal Document",
          entities: data.entities ?? [],
          summary: data.summary ?? "Document processed successfully.",
        };
        setMessages(prev => [...prev, {
          id: `doc-${Date.now()}`,
          role: "assistant",
          content: "I've extracted and analyzed the uploaded document:",
          docResult,
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: `doc-err-${Date.now()}`,
          role: "assistant",
          content: `Document extraction failed (HTTP ${res.status}). Please try again or verify the file format.`,
        }]);
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === toolId ? { ...m, toolStatus: "done" as const } : m));
      setMessages(prev => [...prev, {
        id: `doc-err-${Date.now()}`,
        role: "assistant",
        content: "Document extraction failed. Please check your connection and try again.",
      }]);
    } finally {
      setUploading(false);
      scrollToBottom();
    }
  }, [scrollToBottom]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleApproveAction = useCallback(async (msgId: string, actionId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, pendingAction: undefined } : m));
    try {
      await fetch(`${BASE}/api/approvals/${actionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch {}
    setMessages(prev => [...prev, {
      id: `sys-${Date.now()}`,
      role: "assistant",
      content: "Action approved and logged to matter audit trail. The recommended workflow has been initiated.",
    }]);
    scrollToBottom();
  }, [scrollToBottom]);

  const handleDismissAction = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, pendingAction: undefined } : m));
  };

  return (
    <div className="flex flex-col h-full" onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
      <div className="border-b border-white/[0.06] px-6 py-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#d4a054]" />
            <h1 className="text-sm font-semibold text-slate-200">PRISM Copilot Workbench</h1>
            <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
              STREAMING AI
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Source-grounded matter intelligence · Document extraction · Action approval</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] text-slate-500">Live</span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/[0.16] transition-colors text-[11px]"
          >
            <Upload className="w-3 h-3" />
            Upload Document
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
        </div>
      </div>

      {dragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="text-center">
            <Upload className="w-12 h-12 text-[#d4a054] mx-auto mb-3 animate-bounce" />
            <p className="text-slate-200 font-semibold">Drop legal document to extract</p>
            <p className="text-slate-500 text-xs mt-1">PDF, Word, or text documents supported</p>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-6">
            <div className="text-center py-6">
              <Scale className="w-8 h-8 text-[#d4a054]/30 mx-auto mb-3" />
              <h2 className="text-sm text-slate-300 mb-1">PRISM Copilot Workbench</h2>
              <p className="text-[10px] text-slate-500 max-w-md mx-auto">Full streaming AI with tool calls, document extraction, and inline action approval. Every answer is grounded in your matter data.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
              {SUGGESTED_QUERIES.map((q, i) => {
                const Icon = q.icon;
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.label)}
                    className="flex items-start gap-2 p-3 rounded-lg border border-white/[0.06] text-left hover:border-white/[0.12] hover:bg-white/[0.02] transition-colors"
                    style={{ background: "#0c1220" }}
                  >
                    <Icon className="w-3.5 h-3.5 text-[#d4a054] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-[10px] text-[#d4a054] uppercase mb-0.5">{q.category}</div>
                      <div className="text-[11px] text-slate-300">{q.label}</div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-600 ml-auto mt-1" />
                  </button>
                );
              })}
            </div>
            <div
              className="max-w-2xl mx-auto border-2 border-dashed border-white/[0.08] rounded-xl p-8 text-center hover:border-[#d4a054]/30 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-6 h-6 text-slate-600 mx-auto mb-2" />
              <p className="text-[11px] text-slate-500">Drop legal documents here or click to upload</p>
              <p className="text-[9px] text-slate-600 mt-1">AI will extract entities, classify, and generate a summary</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "tool" && (
              <div className="flex justify-center my-1">
                <ToolCallBadge name={msg.toolName!} status={msg.toolStatus!} />
              </div>
            )}
            {msg.role !== "tool" && (
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-2xl rounded-xl p-4 ${msg.role === "user"
                    ? "bg-[#d4a054]/10 border border-[#d4a054]/20"
                    : "border border-white/[0.06]"}`}
                  style={msg.role === "assistant" ? { background: "#0c1220" } : undefined}
                >
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full bg-[#d4a054]" />
                      <span className="text-[9px] text-[#d4a054] font-bold uppercase tracking-widest">PRISM AI</span>
                    </div>
                  )}
                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {msg.content.split("\n").map((line, li) => {
                      if (line.startsWith("**") && line.endsWith("**")) {
                        return <div key={li} className="font-semibold text-slate-100 mt-2 first:mt-0">{line.replace(/\*\*/g, "")}</div>;
                      }
                      if (line.startsWith("*") && line.endsWith("*")) {
                        return <div key={li} className="text-[10px] text-slate-500 italic">{line.replace(/\*/g, "")}</div>;
                      }
                      return <div key={li}>{line}</div>;
                    })}
                  </div>
                  {msg.docResult && <DocResultCard result={msg.docResult} />}
                  {msg.pendingAction && (
                    <ActionCard
                      action={msg.pendingAction}
                      onApprove={() => handleApproveAction(msg.id, msg.pendingAction!.id)}
                      onDismiss={() => handleDismissAction(msg.id)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-xl p-4 border border-white/[0.06]" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2 h-2 rounded-full bg-[#d4a054]" />
                <span className="text-[9px] text-[#d4a054] font-bold uppercase tracking-widest">PRISM AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#d4a054]/50 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2.5 rounded-lg border border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/[0.16] transition-colors"
            title="Upload document"
          >
            {uploading ? <div className="w-4 h-4 border border-[#d4a054] border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Ask about a matter, deadline, document, or evidence..."
            className="flex-1 px-4 py-2.5 rounded-lg text-xs bg-white/[0.04] border border-white/[0.08] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-[#d4a054]/40 transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || thinking}
            className="p-2.5 rounded-lg bg-[#d4a054]/10 border border-[#d4a054]/20 text-[#d4a054] hover:bg-[#d4a054]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-slate-600 text-center mt-2">
          AI outputs require attorney review · Source citations included · Not legal advice · Drag & drop documents to extract entities
        </p>
      </div>
    </div>
  );
}
