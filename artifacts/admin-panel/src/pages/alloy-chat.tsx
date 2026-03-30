import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare, Send, Bot, User, Sparkles, Terminal, Image, BookOpen,
  Bell, GitCompare, Download, Copy, Check, Trash2, Plus, Search, RefreshCw,
  ChevronDown, ThumbsUp, ThumbsDown, Link, CheckCircle,
  Settings, X, Zap, Clock, Database, FileText, Brain, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = "/api";

// ─── API helper ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  const json = await res.json() as { data: T };
  return json.data;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

type MessageType = "text" | "image" | "advisory" | "comparison";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  provider?: "openai" | "anthropic";
  model?: string;
  modelReason?: string;
  isStreaming?: boolean;
  type?: MessageType;
  imageData?: { imageBase64: string; mimeType: string; provider: string; model: string; generationTimeMs: number; originalPrompt: string; enhancedPrompt: string; size: string };
  advisoryData?: Advisory;
  comparisonData?: ComparisonResult;
}

interface Advisory {
  id: string;
  category: string;
  title: string;
  content: string;
  severity: "info" | "warning" | "alert" | "critical";
  is_read: boolean;
  generated_at: string;
}

interface KBDocument {
  doc_group_id: string;
  title: string;
  source_type: string;
  source_url?: string;
  chunk_count: number;
  created_at: string;
}

interface ComparisonResult {
  id: string;
  prompt: string;
  results: Record<string, {
    content: string;
    model: string;
    provider: string;
    responseTimeMs: number;
    usage: { promptTokens: number; completionTokens: number };
    error?: string;
  }>;
  createdAt: string;
}

type ActiveTab = "chat" | "knowledge-base" | "advisories" | "comparison" | "settings";
type ModelProvider = "auto" | "openai" | "anthropic";
type ImageProvider = "huggingface" | "openai";
type ChatMode = "normal" | "image";

const MODEL_OPTIONS: { value: ModelProvider; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "auto", label: "Auto-Route", description: "Best model for the task", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { value: "anthropic", label: "Claude", description: "Best for analysis & reasoning", icon: <Brain className="w-3.5 h-3.5" /> },
  { value: "openai", label: "GPT-5.2", description: "Best for general operations", icon: <Cpu className="w-3.5 h-3.5" /> },
];

const SUGGESTIONS = [
  "Check integration health status",
  "Show database connection stats",
  "List all feature flags",
  "What services are in demo mode?",
  "Summarize current system health",
  "Show recent audit log entries",
];

// ─── Utility functions ────────────────────────────────────────────────────────

function detectImageIntent(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = ["/image", "generate image", "create image", "draw", "generate a ", "create a diagram", "visualize", "make an image", "show me a picture", "generate mockup", "create mockup", "create architecture"];
  return keywords.some(k => lower.includes(k));
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<span class="font-semibold text-foreground">$1</span>')
    .replace(/\n/g, "<br />");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedBlock(id);
      setTimeout(() => setCopiedBlock(null), 2000);
    });
  }, []);

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      const italicMatch = remaining.match(/\*([^*]+)\*/);

      const candidates = [
        boldMatch ? { match: boldMatch, type: "bold" as const, index: boldMatch.index! } : null,
        codeMatch ? { match: codeMatch, type: "code" as const, index: codeMatch.index! } : null,
        italicMatch ? { match: italicMatch, type: "italic" as const, index: italicMatch.index! } : null,
      ].filter(Boolean).sort((a, b) => a!.index - b!.index);

      if (candidates.length === 0 || candidates[0] === null) {
        parts.push(<span key={keyIdx++}>{remaining}</span>);
        break;
      }

      const first = candidates[0]!;
      if (first.index > 0) parts.push(<span key={keyIdx++}>{remaining.slice(0, first.index)}</span>);

      if (first.type === "bold") {
        parts.push(<strong key={keyIdx++} className="font-semibold text-foreground">{first.match[1]}</strong>);
        remaining = remaining.slice(first.index + first.match[0].length);
      } else if (first.type === "code") {
        parts.push(<code key={keyIdx++} className="px-1.5 py-0.5 rounded text-xs font-mono bg-muted/70 text-foreground border border-border/50">{first.match[1]}</code>);
        remaining = remaining.slice(first.index + first.match[0].length);
      } else if (first.type === "italic") {
        parts.push(<em key={keyIdx++} className="italic text-muted-foreground">{first.match[1]}</em>);
        remaining = remaining.slice(first.index + first.match[0].length);
      }
    }

    return parts;
  };

  const renderMarkdownElements = (text: string) => {
    const elements: React.ReactNode[] = [];
    const lines = text.split("\n");
    let i = 0;
    let keyCounter = 0;

    while (i < lines.length) {
      const line = lines[i]!;

      if (line.startsWith("```")) {
        const lang = line.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i]!.startsWith("```")) { codeLines.push(lines[i]!); i++; }
        const codeStr = codeLines.join("\n");
        const blockId = `code-${keyCounter++}`;
        elements.push(
          <div key={blockId} className="relative my-3 rounded-lg overflow-hidden border border-border/50">
            {lang && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border/50">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{lang}</span>
                <button onClick={() => copyCode(codeStr, blockId)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  {copiedBlock === blockId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedBlock === blockId ? "Copied" : "Copy"}
                </button>
              </div>
            )}
            <pre className="px-4 py-3 text-xs font-mono overflow-x-auto bg-muted/30 text-foreground leading-relaxed"><code>{codeStr}</code></pre>
          </div>
        );
        i++; continue;
      }

      if (line.startsWith("| ") || line.startsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && (lines[i]!.startsWith("| ") || lines[i]!.startsWith("|"))) { tableLines.push(lines[i]!); i++; }
        const headerRow = tableLines[0]?.split("|").filter(c => c.trim()) ?? [];
        const dataRows = tableLines.slice(2).map(r => r.split("|").filter(c => c.trim()));
        elements.push(
          <div key={`table-${keyCounter++}`} className="my-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="border-b border-border bg-muted/30">{headerRow.map((cell, ci) => <th key={ci} className="px-3 py-2 text-left font-semibold text-foreground">{cell.trim()}</th>)}</tr></thead>
              <tbody>{dataRows.map((row, ri) => <tr key={ri} className="border-b border-border/30 hover:bg-muted/20">{row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-muted-foreground">{renderInline(cell.trim())}</td>)}</tr>)}</tbody>
            </table>
          </div>
        );
        continue;
      }

      if (line.startsWith("### ")) { elements.push(<h3 key={`h3-${keyCounter++}`} className="text-sm font-semibold text-foreground mt-4 mb-1">{renderInline(line.slice(4))}</h3>); i++; continue; }
      if (line.startsWith("## ")) { elements.push(<h2 key={`h2-${keyCounter++}`} className="text-base font-bold text-foreground mt-4 mb-1.5">{renderInline(line.slice(3))}</h2>); i++; continue; }
      if (line.startsWith("# ")) { elements.push(<h1 key={`h1-${keyCounter++}`} className="text-lg font-bold text-foreground mt-4 mb-2">{renderInline(line.slice(2))}</h1>); i++; continue; }

      if (line.startsWith("- ") || line.startsWith("• ")) {
        const listItems: string[] = [];
        while (i < lines.length && (lines[i]!.startsWith("- ") || lines[i]!.startsWith("• "))) { listItems.push(lines[i]!.slice(2)); i++; }
        elements.push(<ul key={`ul-${keyCounter++}`} className="my-2 space-y-1">{listItems.map((item, li) => <li key={li} className="flex items-start gap-2 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 shrink-0" /><span>{renderInline(item)}</span></li>)}</ul>);
        continue;
      }

      if (/^\d+\. /.test(line)) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+\. /.test(lines[i]!)) { listItems.push(lines[i]!.replace(/^\d+\. /, "")); i++; }
        elements.push(<ol key={`ol-${keyCounter++}`} className="my-2 space-y-1">{listItems.map((item, li) => <li key={li} className="flex items-start gap-2 text-sm"><span className="shrink-0 w-4 text-primary/70 font-mono text-xs mt-0.5">{li + 1}.</span><span>{renderInline(item)}</span></li>)}</ol>);
        continue;
      }

      if (line.startsWith("> ")) { elements.push(<blockquote key={`bq-${keyCounter++}`} className="my-2 pl-3 border-l-2 border-primary/40 text-sm text-muted-foreground italic">{renderInline(line.slice(2))}</blockquote>); i++; continue; }
      if (line.trim() === "") { i++; continue; }
      if (line.startsWith("---") || line.startsWith("===")) { elements.push(<hr key={`hr-${keyCounter++}`} className="my-3 border-border/40" />); i++; continue; }

      elements.push(<p key={`p-${keyCounter++}`} className="text-sm leading-relaxed my-1">{renderInline(line)}</p>);
      i++;
    }

    return elements;
  };

  return <div className="prose-custom">{renderMarkdownElements(content)}</div>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
      className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy message"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function ModelBadge({ provider, model }: { provider?: string; model?: string }) {
  if (!provider) return null;
  const isAnthropic = provider === "anthropic";
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border",
      isAnthropic ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-blue-500/10 border-blue-500/30 text-blue-400"
    )}>
      {isAnthropic ? <Brain className="w-2.5 h-2.5" /> : <Cpu className="w-2.5 h-2.5" />}
      {model ?? (isAnthropic ? "Claude" : "GPT-5.2")}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    alert: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide", styles[severity] || styles["info"])}>
      {severity}
    </span>
  );
}

function ImageMessage({ data, onDownload, onCopy }: {
  data: NonNullable<ChatMessage["imageData"]>;
  onDownload: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="relative group">
        <img src={`data:${data.mimeType};base64,${data.imageBase64}`} alt={data.originalPrompt} className="max-w-full rounded-lg border border-border" style={{ maxHeight: "400px", objectFit: "contain" }} />
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onDownload} className="p-1.5 bg-background/90 rounded-md border border-border hover:bg-muted transition-colors" title="Download"><Download className="w-3.5 h-3.5" /></button>
          <button onClick={onCopy} className="p-1.5 bg-background/90 rounded-md border border-border hover:bg-muted transition-colors" title="Copy base64"><Copy className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="px-1.5 py-0.5 bg-primary/10 rounded text-primary">{data.provider === "openai" ? "OpenAI gpt-image-1" : `HuggingFace ${data.model.split("/").pop()}`}</span>
        <span>{data.size}</span>
        <span>{data.generationTimeMs}ms</span>
      </div>
      {data.enhancedPrompt !== data.originalPrompt && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground">Enhanced prompt</summary>
          <p className="mt-1 italic">{data.enhancedPrompt}</p>
        </details>
      )}
    </div>
  );
}

function ComparisonMessage({ data, onRate }: { data: ComparisonResult; onRate: (id: string, provider: string, rating: "up" | "down") => void }) {
  const providers = Object.keys(data.results);
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">Comparing {providers.length} models for: "{data.prompt.slice(0, 60)}{data.prompt.length > 60 ? "..." : ""}"</p>
      <div className={cn("grid gap-2", providers.length === 2 ? "grid-cols-2" : "grid-cols-1 md:grid-cols-3")}>
        {providers.map(provider => {
          const r = data.results[provider]!;
          return (
            <div key={provider} className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold capitalize text-foreground">{provider}</span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" />{r.responseTimeMs}ms</div>
              </div>
              {r.error ? <p className="text-xs text-red-400 italic">{r.error}</p> : <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{r.content.slice(0, 300)}{r.content.length > 300 ? "..." : ""}</p>}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{r.usage.completionTokens} tokens</span>
                <div className="flex gap-1">
                  <button onClick={() => onRate(data.id, provider, "up")} className="p-0.5 hover:text-emerald-400 transition-colors" title="Thumbs up"><ThumbsUp className="w-3 h-3" /></button>
                  <button onClick={() => onRate(data.id, provider, "down")} className="p-0.5 hover:text-red-400 transition-colors" title="Thumbs down"><ThumbsDown className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AlloyChat() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");

  // Conversation state (HEAD streaming architecture)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>("auto");
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  // Image generation state
  const [chatMode, setChatMode] = useState<ChatMode>("normal");
  const [imageProvider, setImageProvider] = useState<ImageProvider>("huggingface");
  const [imageSize, setImageSize] = useState("512x512");
  const [enhancePrompts, setEnhancePrompts] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // KB state
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
  const [kbDocuments, setKbDocuments] = useState<KBDocument[]>([]);
  const [kbIngestTitle, setKbIngestTitle] = useState("");
  const [kbIngestContent, setKbIngestContent] = useState("");
  const [kbIngestUrl, setKbIngestUrl] = useState("");
  const [kbIngestType, setKbIngestType] = useState<"text" | "url">("text");
  const [kbSearchQuery, setKbSearchQuery] = useState("");
  const [kbSearchResults, setKbSearchResults] = useState<Array<{ title: string; content: string; score: number }>>([]);
  const [kbLoading, setKbLoading] = useState(false);

  // Advisory state
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [unreadAdvisories, setUnreadAdvisories] = useState(0);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);

  // Comparison state
  const [comparisonPrompt, setComparisonPrompt] = useState("");
  const [comparisonModels, setComparisonModels] = useState<Record<string, boolean>>({ openai: true, anthropic: true, huggingface: true });
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonSystemPrompt, setComparisonSystemPrompt] = useState("");

  // Misc state
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    loadConversations();
    loadSuggestedPrompts();
    loadAdvisories();
    loadKbDocuments();
  }, []);

  useEffect(() => {
    if (activeConversationId !== null) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // ─── Conversation CRUD ──────────────────────────────────────────────────────

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await fetch(`${API_BASE}/alloy-chat/conversations`);
      if (res.ok) {
        const data = await res.json() as { conversations: Conversation[] };
        setConversations(data.conversations);
        if (data.conversations.length > 0 && activeConversationId === null) {
          setActiveConversationId(data.conversations[0]!.id);
        }
      }
    } catch {}
    finally { setLoadingConversations(false); }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const res = await fetch(`${API_BASE}/alloy-chat/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json() as { messages: { id: number; role: string; content: string; createdAt: string }[] };
        setChatMessages(data.messages.map(m => ({
          id: m.id.toString(),
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
          timestamp: new Date(m.createdAt),
          type: "text" as MessageType,
        })));
      }
    } catch {}
  };

  const loadSuggestedPrompts = async () => {
    try {
      const res = await fetch(`${API_BASE}/alloy-chat/suggested-prompts`);
      if (res.ok) {
        const data = await res.json() as { prompts: string[] };
        setSuggestedPrompts(data.prompts);
      }
    } catch {}
  };

  const createNewConversation = async (): Promise<number | null> => {
    try {
      const res = await fetch(`${API_BASE}/alloy-chat/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      if (res.ok) {
        const convo = await res.json() as Conversation;
        setConversations(prev => [convo, ...prev]);
        setActiveConversationId(convo.id);
        setChatMessages([]);
        return convo.id;
      }
    } catch {}
    return null;
  };

  const deleteConversation = async (id: number) => {
    try {
      await fetch(`${API_BASE}/alloy-chat/conversations/${id}`, { method: "DELETE" });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter(c => c.id !== id);
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0]!.id);
        } else {
          setActiveConversationId(null);
          setChatMessages([]);
        }
      }
    } catch {}
  };

  // ─── Chat: SSE streaming (text) or image generation ────────────────────────

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming || isTyping) return;

    const isImageRequest = chatMode === "image" || detectImageIntent(content);

    if (isImageRequest) {
      // Image generation path
      const userMsgId = `user-${Date.now()}`;
      setChatMessages(prev => [...prev, { id: userMsgId, role: "user", content, timestamp: new Date(), type: "image" }]);
      setInput("");
      setIsTyping(true);
      try {
        const prompt = content.replace(/^\/image\s*/i, "").trim() || content;
        const result = await apiFetch<{
          imageBase64: string; mimeType: string; provider: string; model: string;
          generationTimeMs: number; originalPrompt: string; enhancedPrompt: string; size: string;
        }>("/alloy-chat/image-generate", {
          method: "POST",
          body: JSON.stringify({ prompt, provider: imageProvider, size: imageSize, enhance: enhancePrompts }),
        });
        setChatMessages(prev => [...prev, {
          id: `img-${Date.now()}`,
          role: "assistant",
          content: `Generated image for: "${result.originalPrompt}"`,
          timestamp: new Date(),
          type: "image",
          imageData: result,
        }]);
      } catch (err) {
        setChatMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "system", content: `Image generation failed: ${err instanceof Error ? err.message : "Unknown error"}`, timestamp: new Date() }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // Streaming SSE text chat path
    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation();
      if (!conversationId) return;
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now() + 1}`;

    setChatMessages(prev => [
      ...prev,
      { id: userMsgId, role: "user", content: content.trim(), timestamp: new Date(), type: "text" },
      { id: assistantMsgId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true, type: "text" },
    ]);
    setInput("");
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/alloy-chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), provider: selectedProvider }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) throw new Error("Request failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as {
              content?: string; done?: boolean; error?: string;
              type?: string; provider?: "openai" | "anthropic"; model?: string; reason?: string;
            };

            if (data.type === "model") {
              setChatMessages(prev => prev.map(m =>
                m.id === assistantMsgId ? { ...m, provider: data.provider, model: data.model, modelReason: data.reason } : m
              ));
              continue;
            }

            if (data.error) {
              setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: `Error: ${data.error}`, isStreaming: false } : m));
              break;
            }

            if (data.content) {
              setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: m.content + data.content! } : m));
            }

            if (data.done) {
              setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, isStreaming: false } : m));
              loadConversations();
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setChatMessages(prev => prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: "Failed to get a response. Please check the API server and try again.", isStreaming: false }
            : m
        ));
      }
    } finally {
      setIsStreaming(false);
      setChatMessages(prev => prev.map(m => m.id === assistantMsgId && m.isStreaming ? { ...m, isStreaming: false } : m));
    }
  }, [chatMode, imageProvider, imageSize, enhancePrompts, isStreaming, isTyping, activeConversationId, selectedProvider]);

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setChatMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  // ─── Advisory ──────────────────────────────────────────────────────────────

  const loadAdvisories = async () => {
    try {
      const data = await apiFetch<{ advisories: Advisory[]; unreadCount: number }>("/alloy-chat/advisory/list?limit=30");
      setAdvisories(data.advisories);
      setUnreadAdvisories(data.unreadCount);
    } catch {}
  };

  const generateAdvisory = async () => {
    setAdvisoryLoading(true);
    try {
      const result = await apiFetch<Advisory>("/alloy-chat/advisory/generate", { method: "POST" });
      setChatMessages(prev => [...prev, {
        id: `adv-msg-${Date.now()}`, role: "system",
        content: `Advisory: ${result.title}`, timestamp: new Date(),
        type: "advisory", advisoryData: result,
      }]);
      await loadAdvisories();
      if (activeTab !== "chat") setActiveTab("chat");
    } catch (err) {
      setChatMessages(prev => [...prev, { id: `adv-err-${Date.now()}`, role: "system", content: `Advisory generation failed: ${err instanceof Error ? err.message : "Unknown error"}`, timestamp: new Date() }]);
    } finally { setAdvisoryLoading(false); }
  };

  const markAdvisoryRead = async (id: string) => {
    try {
      await apiFetch(`/alloy-chat/advisory/${id}/read`, { method: "POST" });
      setAdvisories(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
      setUnreadAdvisories(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/alloy-chat/advisory/read-all", { method: "POST" });
      setAdvisories(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadAdvisories(0);
    } catch {}
  };

  // ─── Knowledge Base ─────────────────────────────────────────────────────────

  const loadKbDocuments = async () => {
    try {
      const data = await apiFetch<{ documents: KBDocument[] }>("/alloy-chat/kb/documents");
      setKbDocuments(data.documents);
    } catch {}
  };

  const ingestDocument = async () => {
    if (!kbIngestTitle.trim() || !kbIngestContent.trim()) return;
    setKbLoading(true);
    try {
      let content = kbIngestContent;
      let sourceUrl: string | undefined;
      if (kbIngestType === "url" && kbIngestUrl.trim()) {
        sourceUrl = kbIngestUrl.trim();
        content = `Content from ${sourceUrl}:\n${kbIngestContent || "URL content to be indexed"}`;
      }
      await apiFetch("/alloy-chat/kb/ingest", {
        method: "POST",
        body: JSON.stringify({ title: kbIngestTitle, content, sourceType: kbIngestType, sourceUrl }),
      });
      setKbIngestTitle(""); setKbIngestContent(""); setKbIngestUrl("");
      await loadKbDocuments();
    } catch (err) { alert(`Ingest failed: ${err instanceof Error ? err.message : "Unknown error"}`); }
    finally { setKbLoading(false); }
  };

  const deleteDocument = async (groupId: string) => {
    try { await apiFetch(`/alloy-chat/kb/documents/${groupId}`, { method: "DELETE" }); await loadKbDocuments(); } catch {}
  };

  const searchKB = async () => {
    if (!kbSearchQuery.trim()) return;
    setKbLoading(true);
    try {
      const result = await apiFetch<{ chunks: Array<{ title: string; content: string; score: number }> }>("/alloy-chat/kb/retrieve", {
        method: "POST",
        body: JSON.stringify({ query: kbSearchQuery, topK: 5 }),
      });
      setKbSearchResults(result.chunks);
    } catch {}
    finally { setKbLoading(false); }
  };

  // ─── Comparison ─────────────────────────────────────────────────────────────

  const runComparison = async () => {
    if (!comparisonPrompt.trim()) return;
    const selectedModels = Object.entries(comparisonModels).filter(([, v]) => v).map(([k]) => k);
    if (selectedModels.length === 0) { alert("Select at least one model"); return; }
    setComparisonLoading(true);
    try {
      const result = await apiFetch<ComparisonResult>("/alloy-chat/compare", {
        method: "POST",
        body: JSON.stringify({ prompt: comparisonPrompt, models: selectedModels, systemPrompt: comparisonSystemPrompt || undefined }),
      });
      setChatMessages(prev => [...prev, {
        id: `cmp-msg-${Date.now()}`, role: "assistant",
        content: `Model comparison for: "${comparisonPrompt}"`, timestamp: new Date(),
        type: "comparison", comparisonData: result,
      }]);
      setActiveTab("chat");
    } catch (err) { alert(`Comparison failed: ${err instanceof Error ? err.message : "Unknown error"}`); }
    finally { setComparisonLoading(false); }
  };

  const rateComparison = async (id: string, provider: string, rating: "up" | "down") => {
    try { await apiFetch(`/alloy-chat/compare/${id}/rate`, { method: "POST", body: JSON.stringify({ provider, rating }) }); } catch {}
  };

  // ─── Image helpers ──────────────────────────────────────────────────────────

  const downloadImage = (data: NonNullable<ChatMessage["imageData"]>) => {
    const link = document.createElement("a");
    link.href = `data:${data.mimeType};base64,${data.imageBase64}`;
    link.download = `alloy-image-${Date.now()}.png`;
    link.click();
  };

  const copyImageBase64 = async (data: NonNullable<ChatMessage["imageData"]>) => {
    await navigator.clipboard.writeText(data.imageBase64).catch(() => {});
  };

  // ─── Derived state ──────────────────────────────────────────────────────────

  const selectedOption = MODEL_OPTIONS.find(o => o.value === selectedProvider) ?? MODEL_OPTIONS[0]!;

  const tabs: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: "chat", label: "Chat", icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: "knowledge-base", label: "Knowledge Base", icon: <BookOpen className="w-3.5 h-3.5" />, badge: kbDocuments.length },
    { id: "advisories", label: "Advisories", icon: <Bell className="w-3.5 h-3.5" />, badge: unreadAdvisories },
    { id: "comparison", label: "Compare", icon: <GitCompare className="w-3.5 h-3.5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  const isBusy = isStreaming || isTyping;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">AlloyChat</h1>
          <p className="text-xs text-muted-foreground">AI-powered SZL operations assistant — streaming chat, image gen, knowledge base, advisory, multi-model comparison</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {unreadAdvisories > 0 && (
            <button onClick={() => setActiveTab("advisories")} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors">
              <Bell className="w-3.5 h-3.5" /> {unreadAdvisories} advisory
            </button>
          )}
          <button onClick={generateAdvisory} disabled={advisoryLoading} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20 transition-colors disabled:opacity-50">
            <Zap className="w-3.5 h-3.5" />
            {advisoryLoading ? "Analyzing..." : "Run Advisory"}
          </button>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors relative",
            activeTab === tab.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}>
            {tab.icon}{tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Chat Tab ── */}
      {activeTab === "chat" && (
        <div className="flex flex-1 min-h-0 gap-0 overflow-hidden rounded-xl border border-border bg-background">
          {/* Conversation sidebar */}
          {showSidebar && (
            <div className="w-56 shrink-0 border-r border-border flex flex-col bg-sidebar">
              <div className="px-3 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-primary" /></div>
                  <span className="text-xs font-semibold text-foreground">Conversations</span>
                </div>
                <button onClick={() => createNewConversation()} className="w-6 h-6 rounded hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="New conversation">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-2 px-2">
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-8"><RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                ) : conversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 px-2">No conversations yet. Start chatting!</p>
                ) : (
                  conversations.map(convo => (
                    <div
                      key={convo.id}
                      className={cn("group flex items-center gap-1.5 px-2 py-2 rounded-md cursor-pointer transition-colors mb-0.5",
                        activeConversationId === convo.id ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setActiveConversationId(convo.id)}
                    >
                      <MessageSquare className="w-3 h-3 shrink-0" />
                      <span className="text-xs truncate flex-1">{convo.title}</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }} className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center hover:text-red-400 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="px-3 py-2 border-t border-border">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Multi-model streaming active
                </div>
              </div>
            </div>
          )}

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat header bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
              <button onClick={() => setShowSidebar(s => !s)} className="w-7 h-7 rounded hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquare className="w-4 h-4" />
              </button>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">
                  {chatMode === "image" ? "Image generation mode — describe what to generate" : "Ask about system health, integrations, or any SZL platform topic"}
                </p>
              </div>
              {/* Mode toggle */}
              <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
                <button onClick={() => setChatMode("normal")} className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors", chatMode === "normal" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <MessageSquare className="w-3 h-3" />Chat
                </button>
                <button onClick={() => setChatMode("image")} className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors", chatMode === "image" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <Image className="w-3 h-3" />Image
                </button>
              </div>
              {chatMode === "image" && (
                <div className="flex items-center gap-1.5">
                  <select value={imageProvider} onChange={e => setImageProvider(e.target.value as ImageProvider)} className="text-xs bg-card border border-border rounded-md px-2 py-1 text-foreground">
                    <option value="huggingface">HuggingFace (SDXL)</option>
                    <option value="openai">OpenAI (gpt-image-1)</option>
                  </select>
                  <select value={imageSize} onChange={e => setImageSize(e.target.value)} className="text-xs bg-card border border-border rounded-md px-2 py-1 text-foreground">
                    <option value="256x256">256×256</option>
                    <option value="512x512">512×512</option>
                    <option value="1024x1024">1024×1024</option>
                  </select>
                </div>
              )}
              {/* Model provider picker (text chat only) */}
              {chatMode === "normal" && (
                <div className="relative">
                  <button onClick={() => setShowProviderMenu(s => !s)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 text-xs text-foreground transition-colors">
                    {selectedOption.icon}<span>{selectedOption.label}</span><ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>
                  {showProviderMenu && (
                    <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-border bg-popover shadow-lg z-50">
                      {MODEL_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setSelectedProvider(opt.value); setShowProviderMenu(false); }}
                          className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg", selectedProvider === opt.value && "bg-primary/5")}>
                          <span className={cn("text-muted-foreground", selectedProvider === opt.value && "text-primary")}>{opt.icon}</span>
                          <div>
                            <div className="text-xs font-medium text-foreground">{opt.label}</div>
                            <div className="text-[10px] text-muted-foreground">{opt.description}</div>
                          </div>
                          {selectedProvider === opt.value && <Check className="w-3 h-3 text-primary ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center mb-4">
                    <Bot className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground mb-1">AlloyChat — SZL Operations AI</h2>
                  <p className="text-xs text-muted-foreground max-w-sm mb-6">Ask about system health, integrations, infrastructure, or any SZL platform topic. Switch to Image mode to generate diagrams and visuals.</p>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                    {(suggestedPrompts.length > 0 ? suggestedPrompts : SUGGESTIONS).slice(0, 6).map(prompt => (
                      <button key={prompt} onClick={() => sendMessage(prompt)} className="px-3 py-2.5 rounded-lg text-xs text-left bg-muted/40 hover:bg-muted/70 border border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all">
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map(msg => (
                <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
                  {msg.role !== "user" && (
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      msg.role === "assistant" ? "bg-primary/10" : "bg-muted"
                    )}>
                      {msg.role === "assistant"
                        ? (msg.type === "image" ? <Image className="w-4 h-4 text-primary" /> : msg.type === "comparison" ? <GitCompare className="w-4 h-4 text-primary" /> : <Sparkles className="w-4 h-4 text-primary" />)
                        : (msg.type === "advisory" ? <Bell className="w-4 h-4 text-amber-400" /> : <Terminal className="w-4 h-4 text-muted-foreground" />)}
                    </div>
                  )}
                  <div className={cn("max-w-[75%] rounded-xl px-4 py-3 group",
                    msg.role === "user" ? "bg-primary text-primary-foreground" :
                    msg.type === "advisory" ? "bg-amber-500/5 border border-amber-500/20" :
                    msg.role === "system" ? "bg-muted/50 border border-border text-muted-foreground" :
                    "bg-card border border-border"
                  )}>
                    {msg.role === "assistant" && msg.type !== "image" && msg.type !== "comparison" && (
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <ModelBadge provider={msg.provider} model={msg.model} />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <CopyButton text={msg.content} />
                        </div>
                      </div>
                    )}

                    {msg.type === "image" && msg.imageData ? (
                      <ImageMessage data={msg.imageData} onDownload={() => downloadImage(msg.imageData!)} onCopy={() => copyImageBase64(msg.imageData!)} />
                    ) : msg.type === "comparison" && msg.comparisonData ? (
                      <ComparisonMessage data={msg.comparisonData} onRate={rateComparison} />
                    ) : msg.type === "advisory" && msg.advisoryData ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2"><SeverityBadge severity={msg.advisoryData.severity} /><span className="text-xs font-semibold text-foreground">{msg.advisoryData.title}</span></div>
                        <p className="text-sm text-muted-foreground">{msg.advisoryData.content}</p>
                      </div>
                    ) : msg.role === "assistant" ? (
                      <>
                        {msg.content ? <MarkdownContent content={msg.content} /> : msg.isStreaming ? (
                          <div className="flex gap-1 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        ) : null}
                        {msg.isStreaming && msg.content && <span className="inline-block w-0.5 h-3.5 bg-primary/70 animate-pulse ml-0.5 -mb-0.5" />}
                      </>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <p className={cn("text-[10px]", msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground")}>
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                      {msg.role === "assistant" && msg.modelReason && (
                        <span className="text-[9px] text-muted-foreground/60 italic">{msg.modelReason}</span>
                      )}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Image className="w-4 h-4 text-primary animate-pulse" />
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

              {chatMessages.length > 0 && suggestedPrompts.length > 0 && !isBusy && chatMode === "normal" && (
                <div className="flex gap-2 flex-wrap pt-2">
                  {suggestedPrompts.slice(0, 4).map(prompt => (
                    <button key={prompt} onClick={() => sendMessage(prompt)} className="px-2.5 py-1 rounded-full text-[10px] bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border/40 transition-colors">
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                    onKeyDown={handleKeyDown}
                    placeholder={chatMode === "image" ? "Describe the image to generate... (or /image ...)" : "Ask AlloyChat about your infrastructure... (Enter to send, Shift+Enter for new line)"}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[46px] max-h-[120px] leading-relaxed"
                    rows={1}
                    disabled={isBusy}
                  />
                  <div className="absolute right-2 bottom-2 text-[10px] text-muted-foreground/40">{selectedOption.icon}</div>
                </div>
                {isStreaming ? (
                  <button onClick={stopStreaming} className="px-3 h-[46px] rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1.5">
                    <X className="w-4 h-4" /><span className="text-xs">Stop</span>
                  </button>
                ) : (
                  <button onClick={() => sendMessage(input)} disabled={!input.trim() || isBusy} className="px-3 h-[46px] rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />
                {chatMode === "image" ? "Powered by HuggingFace SDXL Turbo + OpenAI gpt-image-1" : "Powered by Claude (Anthropic) + GPT-5.2 (OpenAI) via Replit AI Integrations — streaming SSE"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Knowledge Base Tab ── */}
      {activeTab === "knowledge-base" && (
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Add to Knowledge Base</h3>
              <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5 w-fit">
                {(["text", "url"] as const).map(t => (
                  <button key={t} onClick={() => setKbIngestType(t)} className={cn("px-3 py-1 text-xs rounded-md transition-colors", kbIngestType === t ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    {t === "text" ? <><FileText className="w-3 h-3 inline mr-1" />Text/Markdown</> : <><Link className="w-3 h-3 inline mr-1" />URL</>}
                  </button>
                ))}
              </div>
              <input value={kbIngestTitle} onChange={e => setKbIngestTitle(e.target.value)} placeholder="Document title (e.g., 'API Runbook', 'Incident SOP')" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              {kbIngestType === "url" && (
                <input value={kbIngestUrl} onChange={e => setKbIngestUrl(e.target.value)} placeholder="https://..." className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              )}
              <textarea value={kbIngestContent} onChange={e => setKbIngestContent(e.target.value)} placeholder="Paste document content, runbook, SOP, or technical documentation..." rows={6} className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              <button onClick={ingestDocument} disabled={kbLoading || !kbIngestTitle.trim() || !kbIngestContent.trim()} className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                {kbLoading ? "Ingesting & Embedding..." : "Add to Knowledge Base"}
              </button>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Search className="w-4 h-4 text-primary" /> Test Retrieval</h3>
              <div className="flex gap-2">
                <input value={kbSearchQuery} onChange={e => setKbSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchKB()} placeholder="Test retrieval query..." className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={searchKB} disabled={kbLoading || !kbSearchQuery.trim()} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"><Search className="w-4 h-4" /></button>
              </div>
              {kbSearchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {kbSearchResults.map((r, i) => (
                    <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between"><span className="text-xs font-medium text-foreground">{r.title}</span><span className="text-[10px] text-muted-foreground">score: {r.score.toFixed(3)}</span></div>
                      <p className="text-xs text-muted-foreground line-clamp-3">{r.content}</p>
                    </div>
                  ))}
                </div>
              )}
              {kbSearchResults.length === 0 && kbSearchQuery && !kbLoading && <p className="text-xs text-muted-foreground italic">No results found</p>}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> Knowledge Base ({kbDocuments.length} documents)</h3>
              <button onClick={loadKbDocuments} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><RefreshCw className="w-3 h-3" />Refresh</button>
            </div>
            {kbDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground"><BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">No documents yet. Add runbooks, SOPs, or technical docs above.</p></div>
            ) : (
              <div className="space-y-2">
                {kbDocuments.map(doc => (
                  <div key={doc.doc_group_id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="capitalize">{doc.source_type}</span><span>•</span><span>{doc.chunk_count} chunk{doc.chunk_count !== 1 ? "s" : ""}</span><span>•</span><span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        {doc.source_url && <><span>•</span><a href={doc.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-32">{doc.source_url}</a></>}
                      </div>
                    </div>
                    <button onClick={() => deleteDocument(doc.doc_group_id)} className="ml-3 p-1.5 text-muted-foreground hover:text-red-400 transition-colors" title="Delete document"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Advisories Tab ── */}
      {activeTab === "advisories" && (
        <div className="flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{advisories.length} advisories — {unreadAdvisories} unread</p>
            <div className="flex gap-2">
              {unreadAdvisories > 0 && (
                <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Mark all read</button>
              )}
              <button onClick={generateAdvisory} disabled={advisoryLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90 transition-colors disabled:opacity-50">
                <Zap className="w-3.5 h-3.5" />{advisoryLoading ? "Generating..." : "Generate Advisory"}
              </button>
            </div>
          </div>
          {advisories.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-muted-foreground"><Bell className="w-12 h-12 mb-3 opacity-30" /><p className="text-sm">No advisories yet. Click Generate Advisory to analyze your ecosystem.</p></div>
          ) : (
            advisories.map(adv => (
              <div key={adv.id} className={cn("bg-card border rounded-xl p-4 space-y-2 transition-colors", adv.is_read ? "border-border opacity-70" : "border-primary/20 bg-primary/5")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <SeverityBadge severity={adv.severity} />
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{adv.category.replace("_", " ")}</span>
                    {!adv.is_read && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  </div>
                  {!adv.is_read && <button onClick={() => markAdvisoryRead(adv.id)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">Mark read</button>}
                </div>
                <p className="text-sm font-semibold text-foreground">{adv.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{adv.content}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(adv.generated_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Comparison Tab ── */}
      {activeTab === "comparison" && (
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2"><GitCompare className="w-4 h-4 text-primary" /> Model Comparison</h3>
            <p className="text-xs text-muted-foreground">Send the same prompt to multiple AI models simultaneously and compare their responses side by side.</p>
            <textarea value={comparisonPrompt} onChange={e => setComparisonPrompt(e.target.value)} placeholder="Enter the prompt to compare across models..." rows={4} className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            <textarea value={comparisonSystemPrompt} onChange={e => setComparisonSystemPrompt(e.target.value)} placeholder="System prompt (optional)..." rows={2} className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">Models:</span>
              {(["openai", "anthropic", "huggingface"] as const).map(m => (
                <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={comparisonModels[m]} onChange={e => setComparisonModels(prev => ({ ...prev, [m]: e.target.checked }))} className="rounded" />
                  <span className="text-xs capitalize">{m}</span>
                </label>
              ))}
            </div>
            <button onClick={runComparison} disabled={comparisonLoading || !comparisonPrompt.trim()} className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {comparisonLoading ? <><RefreshCw className="w-4 h-4 animate-spin" />Comparing models...</> : <><GitCompare className="w-4 h-4" />Compare Models</>}
            </button>
            <p className="text-[10px] text-muted-foreground">Results will appear in the Chat tab. Ratings are stored to build a dataset of model performance.</p>
          </div>
        </div>
      )}

      {/* ── Settings Tab ── */}
      {activeTab === "settings" && (
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> AlloyChat Settings</h3>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chat Behavior</h4>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-foreground">Use Knowledge Base in Chat</p>
                  <p className="text-xs text-muted-foreground">When enabled, chat routes through KB-augmented context endpoint instead of streaming SSE</p>
                </div>
                <button onClick={() => setUseKnowledgeBase(prev => !prev)} className={cn("w-10 h-6 rounded-full transition-colors relative", useKnowledgeBase ? "bg-primary" : "bg-muted")}>
                  <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", useKnowledgeBase ? "left-5" : "left-1")} />
                </button>
              </label>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image Generation</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Default Provider</label>
                  <select value={imageProvider} onChange={e => setImageProvider(e.target.value as ImageProvider)} className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                    <option value="huggingface">HuggingFace SDXL Turbo (free)</option>
                    <option value="openai">OpenAI gpt-image-1 (premium)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Default Size</label>
                  <select value={imageSize} onChange={e => setImageSize(e.target.value)} className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                    <option value="256x256">256×256 (fastest)</option>
                    <option value="512x512">512×512 (balanced)</option>
                    <option value="1024x1024">1024×1024 (best quality)</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm text-foreground">Prompt Enhancement</p>
                  <p className="text-xs text-muted-foreground">Use AI to improve image prompts before generation</p>
                </div>
                <button onClick={() => setEnhancePrompts(prev => !prev)} className={cn("w-10 h-6 rounded-full transition-colors relative", enhancePrompts ? "bg-primary" : "bg-muted")}>
                  <span className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", enhancePrompts ? "left-5" : "left-1")} />
                </button>
              </label>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Model Routing</h4>
              <div className="grid grid-cols-3 gap-2">
                {MODEL_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setSelectedProvider(opt.value)} className={cn("p-3 rounded-lg border text-left transition-colors", selectedProvider === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                    <div className="flex items-center gap-1.5 mb-1">{opt.icon}<span className="text-xs font-medium text-foreground">{opt.label}</span></div>
                    <p className="text-[10px] text-muted-foreground">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showProviderMenu && <div className="fixed inset-0 z-40" onClick={() => setShowProviderMenu(false)} />}
    </div>
  );
}
