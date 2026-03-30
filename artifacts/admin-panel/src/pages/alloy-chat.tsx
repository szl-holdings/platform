import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare, Send, Bot, User, Sparkles, Terminal, Copy, Check,
  Plus, Trash2, ChevronDown, Zap, Brain, Cpu, RefreshCw, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = "/api";

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  provider?: "openai" | "anthropic";
  model?: string;
  modelReason?: string;
  isStreaming?: boolean;
}

type ModelProvider = "auto" | "openai" | "anthropic";

const MODEL_OPTIONS: { value: ModelProvider; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "auto", label: "Auto-Route", description: "Best model for the task", icon: <Sparkles className="w-3.5 h-3.5" /> },
  { value: "anthropic", label: "Claude", description: "Best for analysis & reasoning", icon: <Brain className="w-3.5 h-3.5" /> },
  { value: "openai", label: "GPT-5.2", description: "Best for general operations", icon: <Cpu className="w-3.5 h-3.5" /> },
];

function MarkdownContent({ content }: { content: string }) {
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedBlock(id);
      setTimeout(() => setCopiedBlock(null), 2000);
    });
  }, []);

  const renderMarkdown = (text: string) => {
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
        while (i < lines.length && !lines[i]!.startsWith("```")) {
          codeLines.push(lines[i]!);
          i++;
        }
        const codeStr = codeLines.join("\n");
        const blockId = `code-${keyCounter++}`;
        elements.push(
          <div key={blockId} className="relative my-3 rounded-lg overflow-hidden border border-border/50">
            {lang && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border/50">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{lang}</span>
                <button
                  onClick={() => copyCode(codeStr, blockId)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedBlock === blockId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedBlock === blockId ? "Copied" : "Copy"}
                </button>
              </div>
            )}
            <pre className="px-4 py-3 text-xs font-mono overflow-x-auto bg-muted/30 text-foreground leading-relaxed">
              <code>{codeStr}</code>
            </pre>
          </div>
        );
        i++;
        continue;
      }

      if (line.startsWith("| ") || line.startsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && (lines[i]!.startsWith("| ") || lines[i]!.startsWith("|"))) {
          tableLines.push(lines[i]!);
          i++;
        }
        const headerRow = tableLines[0]?.split("|").filter(c => c.trim()) ?? [];
        const dataRows = tableLines.slice(2).map(r => r.split("|").filter(c => c.trim()));
        elements.push(
          <div key={`table-${keyCounter++}`} className="my-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {headerRow.map((cell, ci) => (
                    <th key={ci} className="px-3 py-2 text-left font-semibold text-foreground">{cell.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-border/30 hover:bg-muted/20">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-muted-foreground">{renderInline(cell.trim())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      if (line.startsWith("### ")) {
        elements.push(<h3 key={`h3-${keyCounter++}`} className="text-sm font-semibold text-foreground mt-4 mb-1">{renderInline(line.slice(4))}</h3>);
        i++;
        continue;
      }
      if (line.startsWith("## ")) {
        elements.push(<h2 key={`h2-${keyCounter++}`} className="text-base font-bold text-foreground mt-4 mb-1.5">{renderInline(line.slice(3))}</h2>);
        i++;
        continue;
      }
      if (line.startsWith("# ")) {
        elements.push(<h1 key={`h1-${keyCounter++}`} className="text-lg font-bold text-foreground mt-4 mb-2">{renderInline(line.slice(2))}</h1>);
        i++;
        continue;
      }

      if (line.startsWith("- ") || line.startsWith("• ")) {
        const listItems: string[] = [];
        while (i < lines.length && (lines[i]!.startsWith("- ") || lines[i]!.startsWith("• "))) {
          listItems.push(lines[i]!.slice(2));
          i++;
        }
        elements.push(
          <ul key={`ul-${keyCounter++}`} className="my-2 space-y-1">
            {listItems.map((item, li) => (
              <li key={li} className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      if (/^\d+\. /.test(line)) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+\. /.test(lines[i]!)) {
          listItems.push(lines[i]!.replace(/^\d+\. /, ""));
          i++;
        }
        elements.push(
          <ol key={`ol-${keyCounter++}`} className="my-2 space-y-1">
            {listItems.map((item, li) => (
              <li key={li} className="flex items-start gap-2 text-sm">
                <span className="shrink-0 w-4 text-primary/70 font-mono text-xs mt-0.5">{li + 1}.</span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      if (line.startsWith("> ")) {
        elements.push(
          <blockquote key={`bq-${keyCounter++}`} className="my-2 pl-3 border-l-2 border-primary/40 text-sm text-muted-foreground italic">
            {renderInline(line.slice(2))}
          </blockquote>
        );
        i++;
        continue;
      }

      if (line.trim() === "") {
        i++;
        continue;
      }

      if (line.startsWith("---") || line.startsWith("===")) {
        elements.push(<hr key={`hr-${keyCounter++}`} className="my-3 border-border/40" />);
        i++;
        continue;
      }

      elements.push(
        <p key={`p-${keyCounter++}`} className="text-sm leading-relaxed my-1">
          {renderInline(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

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
      if (first.index > 0) {
        parts.push(<span key={keyIdx++}>{remaining.slice(0, first.index)}</span>);
      }

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

  return <div className="prose-custom">{renderMarkdown(content)}</div>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
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
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border",
      isAnthropic
        ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
        : "bg-blue-500/10 border-blue-500/30 text-blue-400"
    )}>
      {isAnthropic ? <Brain className="w-2.5 h-2.5" /> : <Cpu className="w-2.5 h-2.5" />}
      {model ?? (isAnthropic ? "Claude" : "GPT-5.2")}
    </span>
  );
}

export default function AlloyChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>("auto");
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    loadConversations();
    loadSuggestedPrompts();
  }, []);

  useEffect(() => {
    if (activeConversationId !== null) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

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
    finally {
      setLoadingConversations(false);
    }
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

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation();
      if (!conversationId) return;
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now() + 1}`;

    setChatMessages(prev => [
      ...prev,
      { id: userMsgId, role: "user", content: content.trim(), timestamp: new Date() },
      { id: assistantMsgId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true },
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
      let detectedProvider: "openai" | "anthropic" | undefined;
      let detectedModel: string | undefined;
      let detectedReason: string | undefined;

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
              content?: string;
              done?: boolean;
              error?: string;
              type?: string;
              provider?: "openai" | "anthropic";
              model?: string;
              reason?: string;
            };

            if (data.type === "model") {
              detectedProvider = data.provider;
              detectedModel = data.model;
              detectedReason = data.reason;
              setChatMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, provider: detectedProvider, model: detectedModel, modelReason: detectedReason }
                  : m
              ));
              continue;
            }

            if (data.error) {
              setChatMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, content: `Error: ${data.error}`, isStreaming: false }
                  : m
              ));
              break;
            }

            if (data.content) {
              setChatMessages(prev => prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, content: m.content + data.content! }
                  : m
              ));
            }

            if (data.done) {
              setChatMessages(prev => prev.map(m =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              ));
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
      setChatMessages(prev => prev.map(m =>
        m.id === assistantMsgId && m.isStreaming ? { ...m, isStreaming: false } : m
      ));
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setChatMessages(prev => prev.map(m =>
      m.isStreaming ? { ...m, isStreaming: false } : m
    ));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const selectedOption = MODEL_OPTIONS.find(o => o.value === selectedProvider) ?? MODEL_OPTIONS[0]!;

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 overflow-hidden rounded-xl border border-border bg-background">
      {showSidebar && (
        <div className="w-56 shrink-0 border-r border-border flex flex-col bg-sidebar">
          <div className="px-3 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground">AlloyChat</span>
            </div>
            <button
              onClick={() => createNewConversation()}
              className="w-6 h-6 rounded hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="New conversation"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 px-2">No conversations yet. Start chatting!</p>
            ) : (
              conversations.map(convo => (
                <div
                  key={convo.id}
                  className={cn(
                    "group flex items-center gap-1.5 px-2 py-2 rounded-md cursor-pointer transition-colors mb-0.5",
                    activeConversationId === convo.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveConversationId(convo.id)}
                >
                  <MessageSquare className="w-3 h-3 shrink-0" />
                  <span className="text-xs truncate flex-1">{convo.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }}
                    className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="px-3 py-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Multi-model active
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
          <button
            onClick={() => setShowSidebar(s => !s)}
            className="w-7 h-7 rounded hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-foreground">AlloyChat</h1>
            <p className="text-[10px] text-muted-foreground">AI-powered SZL operations assistant</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowProviderMenu(s => !s)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/50 text-xs text-foreground transition-colors"
            >
              {selectedOption.icon}
              <span>{selectedOption.label}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            {showProviderMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-border bg-popover shadow-lg z-50">
                {MODEL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSelectedProvider(opt.value); setShowProviderMenu(false); }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg",
                      selectedProvider === opt.value && "bg-primary/5"
                    )}
                  >
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

          <div className="flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center mb-4">
                <Bot className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground mb-1">AlloyChat — SZL Operations AI</h2>
              <p className="text-xs text-muted-foreground max-w-sm mb-6">Ask me about system health, integrations, infrastructure, or any SZL platform topic. I pull live data and use the best AI model for each query.</p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {suggestedPrompts.slice(0, 6).map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="px-3 py-2.5 rounded-lg text-xs text-left bg-muted/40 hover:bg-muted/70 border border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map(msg => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
              {msg.role !== "user" && (
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  msg.role === "assistant" ? "bg-primary/10" : "bg-muted"
                )}>
                  {msg.role === "assistant"
                    ? <Sparkles className="w-4 h-4 text-primary" />
                    : <Terminal className="w-4 h-4 text-muted-foreground" />}
                </div>
              )}

              <div className={cn(
                "max-w-[75%] rounded-xl px-4 py-3 group",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.role === "system"
                  ? "bg-muted/50 border border-border text-muted-foreground"
                  : "bg-card border border-border"
              )}>
                {msg.role === "assistant" && (
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <ModelBadge provider={msg.provider} model={msg.model} />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CopyButton text={msg.content} />
                    </div>
                  </div>
                )}

                {msg.role === "assistant" ? (
                  <>
                    {msg.content ? (
                      <MarkdownContent content={msg.content} />
                    ) : msg.isStreaming ? (
                      <div className="flex gap-1 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : null}
                    {msg.isStreaming && msg.content && (
                      <span className="inline-block w-0.5 h-3.5 bg-primary/70 animate-pulse ml-0.5 -mb-0.5" />
                    )}
                  </>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}

                <div className="flex items-center justify-between mt-2">
                  <p className={cn(
                    "text-[10px]",
                    msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>
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
          <div ref={messagesEndRef} />
        </div>

        {chatMessages.length > 0 && suggestedPrompts.length > 0 && !isStreaming && (
          <div className="px-4 pt-2 pb-1 flex gap-2 flex-wrap">
            {suggestedPrompts.slice(0, 4).map(prompt => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="px-2.5 py-1 rounded-full text-[10px] bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground border border-border/40 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 pb-4 pt-2 border-t border-border shrink-0">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask AlloyChat about your infrastructure... (Enter to send, Shift+Enter for new line)"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none min-h-[46px] max-h-[120px] leading-relaxed"
                rows={1}
                disabled={isStreaming}
              />
              <div className="absolute right-2 bottom-2 text-[10px] text-muted-foreground/40">
                {selectedOption.icon}
              </div>
            </div>
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="px-3 h-[46px] rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span className="text-xs">Stop</span>
              </button>
            ) : (
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="px-3 h-[46px] rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" />
            Powered by Claude (Anthropic) + GPT-5.2 (OpenAI) via Replit AI Integrations
          </p>
        </div>
      </div>

      {showProviderMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowProviderMenu(false)} />
      )}
    </div>
  );
}
