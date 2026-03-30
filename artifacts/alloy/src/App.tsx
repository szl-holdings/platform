import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare, Send, Bot, User, Sparkles, Image as ImageIcon, BookOpen,
  Bell, GitCompare, Download, Copy, Check, Trash2, Plus, Search, RefreshCw,
  ChevronDown, ThumbsUp, ThumbsDown, CheckCircle, X, Zap, Clock,
  FileText, Brain, Cpu, Mic, MicOff, Volume2, VolumeX, Activity,
  Shield, Ship, Palette, BarChart2, Building, Network, ChevronRight,
  ChevronLeft, Globe, Radio, SlidersHorizontal, Layers, ExternalLink,
  AlertTriangle, Info, AlertCircle, Eye, EyeOff, Lock,
} from "lucide-react";
import { cn } from "./lib/utils";

const BASE_PATH = import.meta.env.BASE_URL?.replace(/\/$/, "") || "/alloy";
const API_BASE = "/api";

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
  agentId?: string;
  imageData?: {
    imageBase64: string;
    mimeType: string;
    provider: string;
    model: string;
    generationTimeMs: number;
    originalPrompt: string;
    enhancedPrompt: string;
    size: string;
  };
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

type ModelProvider = "auto" | "openai" | "anthropic";
type ImageProvider = "huggingface" | "openai";
type ChatMode = "normal" | "image";
type ActivePanel = "chat" | "kb" | "advisories" | "comparison" | "voice";

// ─── Agent definitions ────────────────────────────────────────────────────────

interface AgentDef {
  id: string;
  name: string;
  icon: string;
  domain: string;
  description: string;
  accent: string;
  agentType?: string;
}

const AGENTS: AgentDef[] = [
  {
    id: "auto",
    name: "Alloy Auto",
    icon: "⚡",
    domain: "Cross-Ecosystem",
    description: "Auto-routes to the best specialist for your question",
    accent: "hsl(195, 100%, 50%)",
  },
  {
    id: "helmsman",
    name: "Helmsman",
    icon: "⚓",
    domain: "Vessels Maritime",
    description: "Fleet operations, route risks, weather impacts, maritime security",
    accent: "hsl(210, 90%, 55%)",
    agentType: "vessels",
  },
  {
    id: "sentinel",
    name: "Sentinel",
    icon: "🛡️",
    domain: "Firestorm Security",
    description: "Threat analysis, vulnerability triage, incident response",
    accent: "hsl(350, 80%, 55%)",
    agentType: "firestorm",
  },
  {
    id: "beacon",
    name: "Beacon",
    icon: "📡",
    domain: "Lyte Command",
    description: "Signal analysis, incident triage, operational recommendations",
    accent: "hsl(190, 90%, 50%)",
    agentType: "lyte",
  },
  {
    id: "muse",
    name: "Muse",
    icon: "✨",
    domain: "Dreamscape Creative",
    description: "Content strategy, campaign ideas, creative briefs",
    accent: "hsl(280, 80%, 60%)",
    agentType: "dreamscape",
  },
  {
    id: "compass",
    name: "Compass",
    icon: "🎯",
    domain: "Readiness Report",
    description: "Readiness assessments, gap analysis, improvement roadmaps",
    accent: "hsl(160, 80%, 50%)",
    agentType: "readiness-report",
  },
  {
    id: "terra",
    name: "Terra",
    icon: "🏢",
    domain: "Terra Real Estate",
    description: "Portfolio performance, market trends, investment analysis",
    accent: "hsl(148, 70%, 47%)",
    agentType: "terra",
  },
  {
    id: "nexus",
    name: "Nexus",
    icon: "⬡",
    domain: "Admin Control",
    description: "Platform ops, system health, connector troubleshooting",
    accent: "hsl(250, 90%, 65%)",
    agentType: "admin",
  },
  {
    id: "navigator",
    name: "Navigator",
    icon: "🧭",
    domain: "SZL Holdings",
    description: "Portfolio guide, technology overview, ecosystem navigation",
    accent: "hsl(195, 100%, 50%)",
    agentType: "szl-holdings",
  },
  {
    id: "stephen",
    name: "Stephen AI",
    icon: "💼",
    domain: "Stephen Lutar",
    description: "Professional portfolio, consulting, expertise showcase",
    accent: "hsl(250, 70%, 65%)",
    agentType: "stephen",
  },
];

const AGENT_MAP = Object.fromEntries(AGENTS.map(a => [a.id, a]));

// ─── Utility functions ────────────────────────────────────────────────────────

function detectImageIntent(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = ["/image", "generate image", "create image", "draw ", "make an image",
    "show me a picture", "generate mockup", "create mockup", "create architecture diagram"];
  return keywords.some(k => lower.includes(k));
}

// ─── MarkdownContent ──────────────────────────────────────────────────────────

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
        parts.push(<code key={keyIdx++} className="px-1.5 py-0.5 rounded text-xs font-mono bg-black/40 text-cyan-300 border border-white/10">{first.match[1]}</code>);
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
          <div key={blockId} className="relative my-3 rounded-lg overflow-hidden border border-white/10">
            {lang && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-white/10">
                <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-wider">{lang}</span>
                <button onClick={() => copyCode(codeStr, blockId)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  {copiedBlock === blockId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedBlock === blockId ? "Copied" : "Copy"}
                </button>
              </div>
            )}
            <pre className="px-4 py-3 text-xs font-mono overflow-x-auto bg-black/30 text-foreground leading-relaxed"><code>{codeStr}</code></pre>
          </div>
        );
        i++; continue;
      }

      if (line.startsWith("### ")) { elements.push(<h3 key={`h3-${keyCounter++}`} className="text-sm font-semibold text-foreground mt-4 mb-1">{renderInline(line.slice(4))}</h3>); i++; continue; }
      if (line.startsWith("## ")) { elements.push(<h2 key={`h2-${keyCounter++}`} className="text-base font-bold text-foreground mt-4 mb-1.5">{renderInline(line.slice(3))}</h2>); i++; continue; }
      if (line.startsWith("# ")) { elements.push(<h1 key={`h1-${keyCounter++}`} className="text-lg font-bold text-foreground mt-4 mb-2">{renderInline(line.slice(2))}</h1>); i++; continue; }

      if (line.startsWith("- ") || line.startsWith("• ")) {
        const listItems: string[] = [];
        while (i < lines.length && (lines[i]!.startsWith("- ") || lines[i]!.startsWith("• "))) { listItems.push(lines[i]!.slice(2)); i++; }
        elements.push(<ul key={`ul-${keyCounter++}`} className="my-2 space-y-1">{listItems.map((item, li) => <li key={li} className="flex items-start gap-2 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" /><span>{renderInline(item)}</span></li>)}</ul>);
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

  return <div>{renderMarkdownElements(content)}</div>;
}

// ─── SeverityBadge ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    alert: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const icons: Record<string, React.ReactNode> = {
    info: <Info className="w-3 h-3" />,
    warning: <AlertTriangle className="w-3 h-3" />,
    alert: <AlertCircle className="w-3 h-3" />,
    critical: <AlertCircle className="w-3 h-3" />,
  };
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase tracking-wide", styles[severity] || styles["info"])}>
      {icons[severity] || icons["info"]}
      {severity}
    </span>
  );
}

// ─── ModelBadge ───────────────────────────────────────────────────────────────

function ModelBadge({ provider, model }: { provider?: string; model?: string }) {
  if (!provider) return null;
  const isAnthropic = provider === "anthropic";
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border",
      isAnthropic ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
    )}>
      {isAnthropic ? <Brain className="w-2.5 h-2.5" /> : <Cpu className="w-2.5 h-2.5" />}
      {model ?? (isAnthropic ? "Claude" : "GPT-5.2")}
    </span>
  );
}

// ─── AgentBadge ───────────────────────────────────────────────────────────────

function AgentBadge({ agentId }: { agentId?: string }) {
  if (!agentId || agentId === "auto") return null;
  const agent = AGENT_MAP[agentId];
  if (!agent) return null;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border border-white/10 bg-white/5 text-white/60">
      <span>{agent.icon}</span>{agent.name}
    </span>
  );
}

// ─── ComparisonMessage ────────────────────────────────────────────────────────

function ComparisonMessage({ data, onRate }: { data: ComparisonResult; onRate: (id: string, provider: string, rating: "up" | "down") => void }) {
  const providers = Object.keys(data.results);
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">Comparing {providers.length} models for: "{data.prompt.slice(0, 60)}{data.prompt.length > 60 ? "..." : ""}"</p>
      <div className={cn("grid gap-2", providers.length === 2 ? "grid-cols-2" : "grid-cols-1 md:grid-cols-3")}>
        {providers.map(provider => {
          const r = data.results[provider]!;
          return (
            <div key={provider} className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold capitalize text-foreground">{provider}</span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" />{r.responseTimeMs}ms</div>
              </div>
              {r.error ? <p className="text-xs text-red-400 italic">{r.error}</p> : <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{r.content.slice(0, 300)}{r.content.length > 300 ? "..." : ""}</p>}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{r.usage.completionTokens} tokens</span>
                <div className="flex gap-1">
                  <button onClick={() => onRate(data.id, provider, "up")} className="p-0.5 hover:text-emerald-400 transition-colors"><ThumbsUp className="w-3 h-3" /></button>
                  <button onClick={() => onRate(data.id, provider, "down")} className="p-0.5 hover:text-red-400 transition-colors"><ThumbsDown className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ImageMessage ──────────────────────────────────────────────────────────────

function ImageMessage({ data, onDownload, onCopy }: {
  data: NonNullable<ChatMessage["imageData"]>;
  onDownload: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="relative group">
        <img src={`data:${data.mimeType};base64,${data.imageBase64}`} alt={data.originalPrompt} className="max-w-full rounded-lg border border-white/10" style={{ maxHeight: "400px", objectFit: "contain" }} />
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onDownload} className="p-1.5 bg-black/70 rounded-md border border-white/20 hover:bg-black/90 transition-colors" title="Download"><Download className="w-3.5 h-3.5" /></button>
          <button onClick={onCopy} className="p-1.5 bg-black/70 rounded-md border border-white/20 hover:bg-black/90 transition-colors" title="Copy base64"><Copy className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="px-1.5 py-0.5 bg-primary/10 rounded text-primary border border-primary/20">{data.provider === "openai" ? "OpenAI" : `HuggingFace`}</span>
        <span>{data.size}</span>
        <span>{data.generationTimeMs}ms</span>
      </div>
    </div>
  );
}

// ─── RealtimeFeedsSidebar ──────────────────────────────────────────────────────

interface FeedItem {
  id: string;
  type: "vessel" | "threat" | "health" | "advisory";
  title: string;
  detail: string;
  severity?: "low" | "medium" | "high" | "critical";
  timestamp: string;
}

function RealtimeFeedsSidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFeeds = useCallback(async () => {
    setLoading(true);
    const items: FeedItem[] = [];

    try {
      const [vesselRes, threatRes, healthRes] = await Promise.allSettled([
        fetch(`${API_BASE}/intelligence/maritime/vessels`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/intelligence/threats`).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/services/health`).then(r => r.ok ? r.json() : null),
      ]);

      if (vesselRes.status === "fulfilled" && vesselRes.value) {
        const data = vesselRes.value as { data?: { vessels?: unknown[] } };
        const vessels = Array.isArray(data.data?.vessels) ? data.data.vessels : [];
        vessels.slice(0, 3).forEach((v: unknown, i: number) => {
          const vessel = v as { name?: string; status?: string; speed?: number; destination?: string };
          items.push({
            id: `vessel-${i}`,
            type: "vessel",
            title: vessel.name || `Vessel ${i + 1}`,
            detail: `${vessel.status || "Unknown"} · ${vessel.speed || 0}kn → ${vessel.destination || "N/A"}`,
            severity: "low",
            timestamp: new Date().toISOString(),
          });
        });
      }

      if (threatRes.status === "fulfilled" && threatRes.value) {
        const data = threatRes.value as { data?: { threats?: unknown[] } };
        const threats = Array.isArray(data.data?.threats) ? data.data.threats : [];
        threats.slice(0, 3).forEach((t: unknown, i: number) => {
          const threat = t as { name?: string; severity?: string; type?: string };
          items.push({
            id: `threat-${i}`,
            type: "threat",
            title: threat.name || `Threat ${i + 1}`,
            detail: `${threat.type || "Unknown"} · ${threat.severity || "medium"}`,
            severity: (threat.severity as FeedItem["severity"]) || "medium",
            timestamp: new Date().toISOString(),
          });
        });
      }

      if (healthRes.status === "fulfilled" && healthRes.value) {
        const data = healthRes.value as { data?: { services?: unknown[] } };
        const services = Array.isArray(data.data?.services) ? data.data.services : [];
        const degraded = services.filter((s: unknown) => {
          const svc = s as { status?: string };
          return svc.status !== "healthy";
        });
        degraded.slice(0, 2).forEach((s: unknown, i: number) => {
          const svc = s as { name?: string; status?: string };
          items.push({
            id: `health-${i}`,
            type: "health",
            title: svc.name || `Service ${i + 1}`,
            detail: svc.status || "degraded",
            severity: svc.status === "down" ? "critical" : "medium",
            timestamp: new Date().toISOString(),
          });
        });
      }
    } catch {}

    if (items.length === 0) {
      items.push(
        { id: "demo-1", type: "vessel", title: "ATLANTIC VOYAGER", detail: "Under way · 12.4kn → Rotterdam", severity: "low", timestamp: new Date().toISOString() },
        { id: "demo-2", type: "threat", title: "BlackMamba RAT", detail: "malware · critical", severity: "critical", timestamp: new Date().toISOString() },
        { id: "demo-3", type: "health", title: "API Server", detail: "healthy · 45ms", severity: "low", timestamp: new Date().toISOString() },
        { id: "demo-4", type: "vessel", title: "PACIFIC GUARDIAN", detail: "Under way · 8.2kn → Singapore", severity: "low", timestamp: new Date().toISOString() },
        { id: "demo-5", type: "threat", title: "CryptoStorm 3.0", detail: "ransomware · critical", severity: "critical", timestamp: new Date().toISOString() },
      );
    }

    setFeedItems(items);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isCollapsed) {
      loadFeeds();
      const interval = setInterval(loadFeeds, 30000);
      return () => clearInterval(interval);
    }
  }, [isCollapsed, loadFeeds]);

  const feedIcons: Record<FeedItem["type"], React.ReactNode> = {
    vessel: <Ship className="w-3 h-3" />,
    threat: <Shield className="w-3 h-3" />,
    health: <Activity className="w-3 h-3" />,
    advisory: <Bell className="w-3 h-3" />,
  };

  const sevColor: Record<string, string> = {
    low: "text-emerald-400 bg-emerald-400/10",
    medium: "text-amber-400 bg-amber-400/10",
    high: "text-orange-400 bg-orange-400/10",
    critical: "text-red-400 bg-red-400/10",
  };

  if (isCollapsed) {
    return (
      <div className="w-8 border-l border-white/5 flex flex-col items-center py-3 gap-3 bg-black/20">
        <button onClick={onToggle} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors" title="Expand feeds">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <div className="flex flex-col gap-2">
          {[<Radio key="r" className="w-3 h-3 text-primary/60" />, <Ship key="s" className="w-3 h-3 text-blue-400/60" />, <Shield key="sh" className="w-3 h-3 text-red-400/60" />, <Activity key="a" className="w-3 h-3 text-amber-400/60" />].map((icon, i) => (
            <div key={i} className="w-6 h-6 flex items-center justify-center">{icon}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 shrink-0 border-l border-white/5 flex flex-col bg-black/20">
      <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Live Feeds</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={loadFeeds} disabled={loading} className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          </button>
          <button onClick={onToggle} className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {feedItems.map(item => (
          <div key={item.id} className="px-3 py-2 hover:bg-white/3 transition-colors border-b border-white/3">
            <div className="flex items-start gap-2">
              <div className={cn("w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5", sevColor[item.severity || "low"])}>
                {feedIcons[item.type]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-foreground truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-white/5">
        <div className="flex flex-wrap gap-1">
          {[
            { label: "Vessels", path: "/vessels/", icon: "🚢" },
            { label: "Threats", path: "/firestorm/", icon: "🛡️" },
            { label: "Ops", path: "/lyte-command-center/", icon: "⚡" },
          ].map(link => (
            <a key={link.path} href={link.path} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors border border-white/8">
              <span>{link.icon}</span>{link.label}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── VoicePanel ──────────────────────────────────────────────────────────────

function VoicePanel({ onTranscribed }: { onTranscribed: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const mimeType = mimeTypes.find(m => MediaRecorder.isTypeSupported(m));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start(100);
      setIsRecording(true);
    } catch {
      alert("Microphone access denied");
    }
  };

  const stopRecording = async () => {
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
  };

  const handleMicToggle = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (!blob || blob.size < 1000) return;
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        const res = await fetch(`${API_BASE}/agent-training/transcribe`, { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json() as { text?: string };
          if (data.text) {
            setTranscript(data.text);
            onTranscribed(data.text);
          }
        }
      } catch {}
      setIsTranscribing(false);
    } else {
      await startRecording();
    }
  };

  const speakText = async (text: string) => {
    if (!voiceOutputEnabled) return;
    try {
      setIsSpeaking(true);
      const res = await fetch(`${API_BASE}/agent-training/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 800), voice: selectedVoice }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch { setIsSpeaking(false); }
  };

  const voices = [
    { id: "alloy", label: "Alloy (Neutral)" },
    { id: "echo", label: "Echo (Male)" },
    { id: "fable", label: "Fable (British)" },
    { id: "onyx", label: "Onyx (Deep)" },
    { id: "nova", label: "Nova (Female)" },
    { id: "shimmer", label: "Shimmer (Soft)" },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-center">
        <div className={cn(
          "w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-3 transition-all",
          isRecording ? "bg-red-500/20 border-2 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]" :
          isTranscribing ? "bg-amber-500/20 border-2 border-amber-400" :
          "bg-primary/10 border-2 border-primary/30"
        )}>
          {isRecording ? <MicOff className="w-8 h-8 text-red-400" /> : <Mic className={cn("w-8 h-8", isTranscribing ? "text-amber-400" : "text-primary")} />}
        </div>
        <button
          onClick={handleMicToggle}
          disabled={isTranscribing}
          className={cn(
            "px-5 py-2 rounded-full text-sm font-medium transition-all",
            isRecording ? "bg-red-500/20 border border-red-400/50 text-red-300 hover:bg-red-500/30" :
            "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
          )}
        >
          {isTranscribing ? "Transcribing..." : isRecording ? "Stop Recording" : "Start Recording"}
        </button>
        {isRecording && (
          <p className="text-xs text-red-400 mt-2 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Recording active — speak clearly
          </p>
        )}
      </div>

      {transcript && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Last transcript:</p>
          <p className="text-sm text-foreground">{transcript}</p>
        </div>
      )}

      <div className="space-y-3 border-t border-white/5 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Voice Output (TTS)</span>
          <button
            onClick={() => setVoiceOutputEnabled(v => !v)}
            className={cn("w-9 h-5 rounded-full transition-colors relative", voiceOutputEnabled ? "bg-primary" : "bg-white/10")}
          >
            <span className={cn("absolute w-3.5 h-3.5 rounded-full bg-white top-0.5 transition-all", voiceOutputEnabled ? "right-0.5" : "left-0.5")} />
          </button>
        </div>
        {voiceOutputEnabled && (
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Voice</label>
            <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="w-full text-xs bg-card border border-white/10 rounded-md px-2 py-1.5 text-foreground">
              {voices.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
        )}
        {isSpeaking && (
          <div className="flex items-center gap-2 text-xs text-primary">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            Playing response...
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Voice is powered by OpenAI Whisper (transcription) and TTS. Requires microphone permission.
      </div>
    </div>
  );
}

// ─── KnowledgeBasePanel ───────────────────────────────────────────────────────

function KnowledgeBasePanel({ useKB, onToggleUseKB }: { useKB: boolean; onToggleUseKB: () => void }) {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [ingestTitle, setIngestTitle] = useState("");
  const [ingestContent, setIngestContent] = useState("");
  const [ingestType, setIngestType] = useState<"text" | "url">("text");
  const [ingestUrl, setIngestUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ title: string; content: string; score: number }>>([]);
  const [loading, setLoading] = useState(false);

  const loadDocuments = async () => {
    try {
      const data = await apiFetch<{ documents: KBDocument[] }>("/alloy-chat/kb/documents");
      setDocuments(data.documents);
    } catch {}
  };

  useEffect(() => { loadDocuments(); }, []);

  const ingestDocument = async () => {
    if (!ingestTitle.trim() || !ingestContent.trim()) return;
    setLoading(true);
    try {
      let content = ingestContent;
      let sourceUrl: string | undefined;
      if (ingestType === "url" && ingestUrl.trim()) {
        sourceUrl = ingestUrl.trim();
        content = `Content from ${sourceUrl}:\n${ingestContent}`;
      }
      await apiFetch("/alloy-chat/kb/ingest", {
        method: "POST",
        body: JSON.stringify({ title: ingestTitle, content, sourceType: ingestType, sourceUrl }),
      });
      setIngestTitle(""); setIngestContent(""); setIngestUrl("");
      await loadDocuments();
    } catch (err) { alert(`Ingest failed: ${err instanceof Error ? err.message : "Unknown"}`); }
    setLoading(false);
  };

  const deleteDocument = async (groupId: string) => {
    try { await apiFetch(`/alloy-chat/kb/documents/${groupId}`, { method: "DELETE" }); await loadDocuments(); } catch {}
  };

  const searchKB = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const result = await apiFetch<{ chunks: Array<{ title: string; content: string; score: number }> }>("/alloy-chat/kb/retrieve", {
        method: "POST",
        body: JSON.stringify({ query: searchQuery, topK: 5 }),
      });
      setSearchResults(result.chunks);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Knowledge Base</h3>
          <p className="text-xs text-muted-foreground">{documents.length} document{documents.length !== 1 ? "s" : ""} indexed</p>
        </div>
        <button
          onClick={onToggleUseKB}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
            useKB ? "bg-primary/10 border-primary/40 text-primary" : "border-white/10 text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          {useKB ? "KB Active" : "Use in Chat"}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchKB()}
            placeholder="Search knowledge base..."
            className="flex-1 text-xs bg-card border border-white/10 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <button onClick={searchKB} disabled={loading} className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors">
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((r, i) => (
              <div key={i} className="bg-white/3 border border-white/8 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">{r.title}</span>
                  <span className="text-[10px] text-primary">{(r.score * 100).toFixed(0)}% match</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{r.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-white/5 pt-3">
        <h4 className="text-xs font-medium text-foreground">Ingest Document</h4>
        <div className="flex gap-1">
          {(["text", "url"] as const).map(t => (
            <button key={t} onClick={() => setIngestType(t)} className={cn("px-2.5 py-1 rounded text-xs transition-colors", ingestType === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
              {t === "text" ? "Text" : "URL"}
            </button>
          ))}
        </div>
        <input value={ingestTitle} onChange={e => setIngestTitle(e.target.value)} placeholder="Document title" className="w-full text-xs bg-card border border-white/10 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
        {ingestType === "url" && <input value={ingestUrl} onChange={e => setIngestUrl(e.target.value)} placeholder="Source URL" className="w-full text-xs bg-card border border-white/10 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />}
        <textarea value={ingestContent} onChange={e => setIngestContent(e.target.value)} placeholder={ingestType === "url" ? "Paste content from the URL..." : "Paste or type document content..."} rows={4} className="w-full text-xs bg-card border border-white/10 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
        <button onClick={ingestDocument} disabled={loading || !ingestTitle.trim() || !ingestContent.trim()} className="w-full py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50">
          {loading ? "Ingesting..." : "Ingest Document"}
        </button>
      </div>

      <div className="space-y-2 border-t border-white/5 pt-3">
        <h4 className="text-xs font-medium text-foreground">Documents</h4>
        {documents.length === 0 ? (
          <p className="text-xs text-muted-foreground">No documents yet. Ingest content to build the knowledge base.</p>
        ) : (
          <div className="space-y-1.5">
            {documents.map(doc => (
              <div key={doc.doc_group_id} className="flex items-center gap-2 bg-white/3 border border-white/8 rounded-lg px-3 py-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{doc.title}</p>
                  <p className="text-[10px] text-muted-foreground">{doc.chunk_count} chunks · {doc.source_type}</p>
                </div>
                <button onClick={() => deleteDocument(doc.doc_group_id)} className="p-1 hover:text-red-400 text-muted-foreground transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AdvisoryPanel ────────────────────────────────────────────────────────────

function AdvisoryPanel() {
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAdvisories = async () => {
    try {
      const data = await apiFetch<{ advisories: Advisory[]; unreadCount: number }>("/alloy-chat/advisory/list?limit=30");
      setAdvisories(data.advisories);
    } catch {}
  };

  useEffect(() => { loadAdvisories(); }, []);

  const generateAdvisory = async () => {
    setLoading(true);
    try {
      await apiFetch<Advisory>("/alloy-chat/advisory/generate", { method: "POST" });
      await loadAdvisories();
    } catch {}
    setLoading(false);
  };

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/alloy-chat/advisory/${id}/read`, { method: "POST" });
      setAdvisories(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/alloy-chat/advisory/read-all", { method: "POST" });
      setAdvisories(prev => prev.map(a => ({ ...a, is_read: true })));
    } catch {}
  };

  const unread = advisories.filter(a => !a.is_read).length;

  return (
    <div className="flex flex-col gap-3 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Advisories</h3>
          {unread > 0 && <p className="text-xs text-amber-400">{unread} unread</p>}
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-white/10 hover:bg-white/5 transition-colors">
              Mark all read
            </button>
          )}
          <button onClick={generateAdvisory} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs hover:bg-primary/20 transition-colors disabled:opacity-50">
            <Zap className="w-3.5 h-3.5" />
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {advisories.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <Bell className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground">No advisories yet. Generate one to get AI-powered system insights.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {advisories.map(adv => (
            <div key={adv.id} className={cn("border rounded-lg p-3 space-y-2 transition-all", adv.is_read ? "border-white/5 bg-white/2" : "border-white/10 bg-white/4")}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <SeverityBadge severity={adv.severity} />
                    <span className="text-[10px] text-muted-foreground">{adv.category}</span>
                  </div>
                  <p className={cn("text-xs font-medium", adv.is_read ? "text-muted-foreground" : "text-foreground")}>{adv.title}</p>
                </div>
                {!adv.is_read && (
                  <button onClick={() => markRead(adv.id)} className="shrink-0 p-1 hover:text-emerald-400 text-muted-foreground transition-colors" title="Mark read">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">{adv.content}</p>
              <p className="text-[10px] text-muted-foreground/60">{new Date(adv.generated_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ComparisonPanel ──────────────────────────────────────────────────────────

function ComparisonPanel({ onComparisonResult }: { onComparisonResult: (result: ComparisonResult) => void }) {
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [models, setModels] = useState<Record<string, boolean>>({ openai: true, anthropic: true });
  const [loading, setLoading] = useState(false);

  const runComparison = async () => {
    if (!prompt.trim()) return;
    const selectedModels = Object.entries(models).filter(([, v]) => v).map(([k]) => k);
    if (selectedModels.length === 0) { alert("Select at least one model"); return; }
    setLoading(true);
    try {
      const result = await apiFetch<ComparisonResult>("/alloy-chat/compare", {
        method: "POST",
        body: JSON.stringify({ prompt, models: selectedModels, systemPrompt: systemPrompt || undefined }),
      });
      onComparisonResult(result);
    } catch (err) { alert(`Comparison failed: ${err instanceof Error ? err.message : "Unknown"}`); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Model Arena</h3>
        <p className="text-xs text-muted-foreground">Compare AI models side-by-side</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Models to compare</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(models).map(([model, enabled]) => (
            <button
              key={model}
              onClick={() => setModels(prev => ({ ...prev, [model]: !prev[model] }))}
              className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all",
                enabled ? "bg-primary/10 border-primary/40 text-primary" : "border-white/10 text-muted-foreground hover:text-foreground"
              )}
            >
              {model === "openai" ? <Cpu className="w-3 h-3" /> : <Brain className="w-3 h-3" />}
              {model === "openai" ? "GPT-5.2" : "Claude"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">System prompt (optional)</label>
        <input
          value={systemPrompt}
          onChange={e => setSystemPrompt(e.target.value)}
          placeholder="Custom system prompt..."
          className="w-full text-xs bg-card border border-white/10 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Test prompt</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter the prompt to compare across models..."
          rows={5}
          className="w-full text-xs bg-card border border-white/10 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
        />
      </div>

      <button
        onClick={runComparison}
        disabled={loading || !prompt.trim()}
        className="w-full py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <GitCompare className="w-3.5 h-3.5" />
        {loading ? "Running comparison..." : "Run Comparison"}
      </button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function AlloyApp() {
  const [selectedAgent, setSelectedAgent] = useState<string>("auto");
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>("chat");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>("auto");
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showConvSidebar, setShowConvSidebar] = useState(() => window.innerWidth >= 768);

  const [chatMode, setChatMode] = useState<ChatMode>("normal");
  const [imageProvider, setImageProvider] = useState<ImageProvider>("huggingface");
  const [imageSize, setImageSize] = useState("512x512");
  const [enhancePrompts, setEnhancePrompts] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(() => window.innerWidth >= 1024);
  const [rightFeedsCollapsed, setRightFeedsCollapsed] = useState(false);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    loadConversations();
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
    setLoadingConversations(false);
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

  const sendMessageViaAgent = useCallback(async (content: string, conversationId: number) => {
    const agent = AGENT_MAP[selectedAgent];
    if (!agent || selectedAgent === "auto" || !agent.agentType) {
      return null;
    }

    try {
      const res = await fetch(`${API_BASE}/domain-agents/${agent.agentType}/chat?stream=1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, conversationId: String(conversationId), stream: true }),
        signal: abortRef.current?.signal,
      });

      if (!res.ok) return null;
      if (!res.headers.get("content-type")?.includes("text/event-stream")) {
        const data = await res.json() as { data?: { reply?: string } };
        return data.data?.reply || null;
      }

      return res;
    } catch {
      return null;
    }
  }, [selectedAgent]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming || isTyping) return;

    const isImageRequest = chatMode === "image" || detectImageIntent(content);

    if (isImageRequest) {
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
          content: `Generated: "${result.originalPrompt}"`,
          timestamp: new Date(),
          type: "image",
          imageData: result,
        }]);
      } catch (err) {
        setChatMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "system", content: `Image generation failed: ${err instanceof Error ? err.message : "Unknown error"}`, timestamp: new Date() }]);
      }
      setIsTyping(false);
      return;
    }

    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation();
      if (!conversationId) return;
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now() + 1}`;

    setChatMessages(prev => [
      ...prev,
      { id: userMsgId, role: "user", content: content.trim(), timestamp: new Date(), type: "text", agentId: selectedAgent },
      { id: assistantMsgId, role: "assistant", content: "", timestamp: new Date(), isStreaming: true, type: "text", agentId: selectedAgent },
    ]);
    setInput("");
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const agent = AGENT_MAP[selectedAgent];
      const isAgentMode = selectedAgent !== "auto" && agent?.agentType;

      let response: Response;

      if (isAgentMode) {
        const agentRes = await sendMessageViaAgent(content.trim(), conversationId);
        if (agentRes && agentRes instanceof Response) {
          response = agentRes;
        } else if (agentRes && typeof agentRes === "string") {
          setChatMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: agentRes, isStreaming: false } : m));
          setIsStreaming(false);
          return;
        } else {
          response = await fetch(`${API_BASE}/alloy-chat/conversations/${conversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: content.trim(), provider: selectedProvider }),
            signal: abortRef.current.signal,
          });
        }
      } else {
        response = await fetch(`${API_BASE}/alloy-chat/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: content.trim(), provider: selectedProvider }),
          signal: abortRef.current.signal,
        });
      }

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
          const dataStr = line.slice(6);
          if (dataStr === "[DONE]") continue;
          try {
            const data = JSON.parse(dataStr) as {
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
  }, [chatMode, imageProvider, imageSize, enhancePrompts, isStreaming, isTyping, activeConversationId, selectedProvider, selectedAgent, sendMessageViaAgent]);

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setChatMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
  };

  const rateComparison = async (id: string, provider: string, rating: "up" | "down") => {
    try { await apiFetch(`/alloy-chat/compare/${id}/rate`, { method: "POST", body: JSON.stringify({ provider, rating }) }); } catch {}
  };

  const downloadImage = (data: NonNullable<ChatMessage["imageData"]>) => {
    const link = document.createElement("a");
    link.href = `data:${data.mimeType};base64,${data.imageBase64}`;
    link.download = `alloy-image-${Date.now()}.png`;
    link.click();
  };

  const copyImageBase64 = async (data: NonNullable<ChatMessage["imageData"]>) => {
    await navigator.clipboard.writeText(data.imageBase64).catch(() => {});
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const currentAgent = AGENT_MAP[selectedAgent] ?? AGENT_MAP["auto"]!;

  const MODEL_OPTIONS: { value: ModelProvider; label: string; icon: React.ReactNode }[] = [
    { value: "auto", label: "Auto-Route", icon: <Sparkles className="w-3 h-3" /> },
    { value: "anthropic", label: "Claude", icon: <Brain className="w-3 h-3" /> },
    { value: "openai", label: "GPT-5.2", icon: <Cpu className="w-3 h-3" /> },
  ];
  const selectedModel = MODEL_OPTIONS.find(o => o.value === selectedProvider) ?? MODEL_OPTIONS[0]!;

  const CROSS_ECOSYSTEM_PROMPTS = [
    "What are our top risks across maritime and cybersecurity?",
    "Compare threat intelligence across all domains",
    "Summarize the current state of the entire SZL portfolio",
    "What operational improvements can we make across all platforms?",
    "Give me a cross-domain risk assessment",
    "What data insights span maritime, security, and ops?",
  ];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Top bar */}
      <header className="shrink-0 border-b border-white/5 bg-black/30 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3 z-20">
        {/* Logo */}
        <div className="flex items-center gap-2.5 min-w-[200px]">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center alloy-glow">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-none tracking-tight">Alloy</h1>
            <p className="text-[10px] text-primary/70 leading-none mt-0.5">Unified AI Command</p>
          </div>
        </div>

        {/* Agent switcher */}
        <div className="relative">
          <button
            onClick={() => setShowAgentPicker(s => !s)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm"
          >
            <span className="text-base leading-none">{currentAgent.icon}</span>
            <div className="text-left">
              <div className="text-xs font-medium text-foreground leading-none">{currentAgent.name}</div>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5">{currentAgent.domain}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground ml-1" />
          </button>

          {showAgentPicker && (
            <div className="absolute left-0 top-full mt-1 w-80 rounded-xl border border-white/10 bg-popover shadow-2xl shadow-black/50 z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-white/5">
                <p className="text-xs font-semibold text-foreground">Select Agent</p>
                <p className="text-[10px] text-muted-foreground">Choose a specialist or let Alloy auto-route</p>
              </div>
              <div className="p-2 grid grid-cols-1 gap-1 max-h-80 overflow-y-auto">
                {AGENTS.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => { setSelectedAgent(agent.id); setShowAgentPicker(false); }}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left transition-all",
                      selectedAgent === agent.id ? "bg-white/8 border border-white/12" : "hover:bg-white/4 border border-transparent"
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-lg" style={{ backgroundColor: `${agent.accent}15` }}>
                      <span style={{ filter: selectedAgent === agent.id ? "none" : "grayscale(30%)" }}>{agent.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{agent.name}</span>
                        {selectedAgent === agent.id && <Check className="w-3 h-3 text-primary" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground block truncate">{agent.description}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0">{agent.domain}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Panel tabs */}
        <div className="flex gap-0.5 bg-white/3 rounded-lg p-0.5 border border-white/5">
          {([
            { id: "chat" as ActivePanel, icon: <MessageSquare className="w-3 h-3" />, label: "Chat" },
            { id: "kb" as ActivePanel, icon: <BookOpen className="w-3 h-3" />, label: "KB" },
            { id: "advisories" as ActivePanel, icon: <Bell className="w-3 h-3" />, label: "Advisory" },
            { id: "comparison" as ActivePanel, icon: <GitCompare className="w-3 h-3" />, label: "Arena" },
            { id: "voice" as ActivePanel, icon: <Mic className="w-3 h-3" />, label: "Voice" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] transition-all",
                activePanel === tab.id ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-white/3"
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRightPanel(s => !s)}
            className={cn("p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors", showRightPanel && "text-primary")}
            title="Toggle feeds panel"
          >
            <Radio className="w-3.5 h-3.5" />
          </button>
          <a
            href="/admin/"
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 border border-white/8 px-2 py-1 rounded"
          >
            Admin <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Chat Panel ── */}
        {activePanel === "chat" && (
          <>
            {/* Conversation sidebar */}
            {showConvSidebar && (
              <div className="w-52 shrink-0 border-r border-white/5 flex flex-col bg-sidebar">
                <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Conversations</span>
                  <button
                    onClick={() => createNewConversation()}
                    className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-1 px-1.5">
                  {loadingConversations ? (
                    <div className="flex items-center justify-center py-6"><RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                  ) : conversations.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-6 px-2">No conversations yet</p>
                  ) : (
                    conversations.map(convo => (
                      <div
                        key={convo.id}
                        className={cn(
                          "group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors mb-0.5",
                          activeConversationId === convo.id ? "bg-primary/10 text-primary" : "hover:bg-white/4 text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setActiveConversationId(convo.id)}
                      >
                        <MessageSquare className="w-3 h-3 shrink-0" />
                        <span className="text-[11px] truncate flex-1">{convo.title}</span>
                        <button
                          onClick={e => { e.stopPropagation(); deleteConversation(convo.id); }}
                          className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-3 py-2 border-t border-white/5">
                  <button
                    onClick={() => setShowConvSidebar(false)}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" /> Collapse
                  </button>
                </div>
              </div>
            )}

            {/* Chat area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Chat toolbar */}
              <div className="shrink-0 border-b border-white/5 px-3 py-2 flex items-center gap-2 bg-black/10">
                {!showConvSidebar && (
                  <button onClick={() => setShowConvSidebar(true)} className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="flex-1 text-xs text-muted-foreground">
                  {chatMode === "image"
                    ? "Image generation mode — describe what to generate"
                    : selectedAgent !== "auto"
                    ? `Talking to ${currentAgent.name} · ${currentAgent.domain}`
                    : "Alloy auto-routing — cross-ecosystem intelligence"}
                  {useKnowledgeBase && <span className="ml-2 text-primary">· KB active</span>}
                </div>
                <div className="flex items-center gap-1.5 bg-black/20 rounded-lg p-0.5 border border-white/5">
                  <button onClick={() => setChatMode("normal")} className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all", chatMode === "normal" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    <MessageSquare className="w-3 h-3" /> Chat
                  </button>
                  <button onClick={() => setChatMode("image")} className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all", chatMode === "image" ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    <ImageIcon className="w-3 h-3" /> Image
                  </button>
                </div>
                {chatMode === "image" && (
                  <div className="flex items-center gap-1.5">
                    <select value={imageProvider} onChange={e => setImageProvider(e.target.value as ImageProvider)} className="text-[11px] bg-card border border-white/10 rounded-md px-2 py-1 text-foreground">
                      <option value="huggingface">HuggingFace SDXL</option>
                      <option value="openai">OpenAI gpt-image-1</option>
                    </select>
                    <select value={imageSize} onChange={e => setImageSize(e.target.value)} className="text-[11px] bg-card border border-white/10 rounded-md px-2 py-1 text-foreground">
                      <option value="256x256">256×256</option>
                      <option value="512x512">512×512</option>
                      <option value="1024x1024">1024×1024</option>
                    </select>
                  </div>
                )}
                {chatMode === "normal" && (
                  <div className="relative">
                    <button
                      onClick={() => setShowProviderMenu(s => !s)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-[11px] text-foreground transition-colors"
                    >
                      {selectedModel.icon}<span>{selectedModel.label}</span><ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>
                    {showProviderMenu && (
                      <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-white/10 bg-popover shadow-xl z-50">
                        {MODEL_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => { setSelectedProvider(opt.value); setShowProviderMenu(false); }}
                            className={cn("w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg text-[11px]", selectedProvider === opt.value && "text-primary")}>
                            <span>{opt.icon}</span>
                            <span>{opt.label}</span>
                            {selectedProvider === opt.value && <Check className="w-3 h-3 ml-auto" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-4 border border-cyan-500/20">
                      <span className="text-3xl">{currentAgent.icon}</span>
                    </div>
                    <h2 className="text-base font-bold text-foreground mb-1">
                      {selectedAgent === "auto" ? "Alloy — Unified AI Command" : currentAgent.name}
                    </h2>
                    <p className="text-xs text-muted-foreground max-w-sm mb-1">
                      {selectedAgent === "auto"
                        ? "Ask questions that span the entire SZL ecosystem. Alloy auto-routes to the right specialist."
                        : currentAgent.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mb-6">
                      {selectedAgent === "auto" ? "Or pick a specific agent above for domain-focused expertise." : `Specialist in ${currentAgent.domain}`}
                    </p>
                    <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                      {(selectedAgent === "auto" ? CROSS_ECOSYSTEM_PROMPTS : [
                        `What's the latest from ${currentAgent.domain}?`,
                        `Give me a status report`,
                        `What should I focus on today?`,
                        `Show me key metrics and insights`,
                      ]).slice(0, 6).map(prompt => (
                        <button
                          key={prompt}
                          onClick={() => sendMessage(prompt)}
                          className="px-3 py-2.5 rounded-lg text-[11px] text-left bg-white/4 hover:bg-white/7 border border-white/8 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {chatMessages.map(msg => (
                  <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" && "justify-end")}>
                    {msg.role !== "user" && (
                      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                        msg.role === "assistant" ? "bg-primary/10 border border-primary/20 text-sm" : "bg-white/5 text-muted-foreground"
                      )}>
                        {msg.role === "assistant" ? (
                          <span className="text-sm">{msg.agentId && msg.agentId !== "auto" ? (AGENT_MAP[msg.agentId]?.icon || "⚡") : "⚡"}</span>
                        ) : (
                          <Activity className="w-3 h-3" />
                        )}
                      </div>
                    )}

                    <div className={cn("max-w-[75%] space-y-1",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}>
                      <div className={cn("rounded-lg px-3 py-2",
                        msg.role === "user"
                          ? "bg-primary/15 border border-primary/20 text-foreground"
                          : msg.role === "system"
                          ? "bg-white/3 border border-white/8 text-muted-foreground text-xs italic"
                          : "bg-card border border-white/8"
                      )}>
                        {msg.type === "image" && msg.imageData ? (
                          <ImageMessage data={msg.imageData} onDownload={() => downloadImage(msg.imageData!)} onCopy={() => copyImageBase64(msg.imageData!)} />
                        ) : msg.type === "comparison" && msg.comparisonData ? (
                          <ComparisonMessage data={msg.comparisonData} onRate={rateComparison} />
                        ) : (
                          <div className={cn(msg.isStreaming && "streaming-cursor")}>
                            {msg.role === "user" ? (
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                              <MarkdownContent content={msg.content} />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {msg.provider && <ModelBadge provider={msg.provider} model={msg.model} />}
                        {msg.agentId && msg.agentId !== "auto" && <AgentBadge agentId={msg.agentId} />}
                        <button
                          onClick={() => navigator.clipboard.writeText(msg.content).catch(() => {})}
                          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors opacity-50 hover:opacity-100"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {msg.role === "user" && (
                      <div className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="shrink-0 border-t border-white/5 p-3 bg-black/10">
                <div className="flex items-end gap-2 bg-card border border-white/10 rounded-xl px-3 py-2 focus-within:border-primary/40 transition-colors">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      chatMode === "image"
                        ? "Describe the image to generate..."
                        : selectedAgent !== "auto"
                        ? `Ask ${currentAgent.name}...`
                        : "Ask Alloy anything — it spans all domains..."
                    }
                    rows={1}
                    disabled={isStreaming || isTyping}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none leading-relaxed disabled:opacity-50 min-h-[24px] max-h-32"
                    style={{ overflow: "hidden" }}
                    onInput={e => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = "auto";
                      t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
                      t.style.overflow = t.scrollHeight > 128 ? "auto" : "hidden";
                    }}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setActivePanel("voice")}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                      title="Voice input"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    {(isStreaming || isTyping) ? (
                      <button onClick={stopStreaming} className="p-1.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim()}
                        className="p-1.5 rounded-md bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <p className="text-[10px] text-muted-foreground/60">
                    Enter to send · Shift+Enter for newline
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUseKnowledgeBase(v => !v)}
                      className={cn("flex items-center gap-1 text-[10px] transition-colors", useKnowledgeBase ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                    >
                      <BookOpen className="w-3 h-3" />
                      {useKnowledgeBase ? "KB On" : "KB"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Knowledge Base Panel ── */}
        {activePanel === "kb" && (
          <div className="flex-1 overflow-hidden">
            <KnowledgeBasePanel useKB={useKnowledgeBase} onToggleUseKB={() => setUseKnowledgeBase(v => !v)} />
          </div>
        )}

        {/* ── Advisories Panel ── */}
        {activePanel === "advisories" && (
          <div className="flex-1 overflow-hidden">
            <AdvisoryPanel />
          </div>
        )}

        {/* ── Comparison Panel ── */}
        {activePanel === "comparison" && (
          <div className="flex-1 overflow-hidden overflow-y-auto">
            <ComparisonPanel onComparisonResult={(result) => {
              setChatMessages(prev => [...prev, {
                id: `cmp-${Date.now()}`, role: "assistant",
                content: `Model comparison complete`,
                timestamp: new Date(),
                type: "comparison",
                comparisonData: result,
              }]);
              setActivePanel("chat");
            }} />
          </div>
        )}

        {/* ── Voice Panel ── */}
        {activePanel === "voice" && (
          <div className="flex-1 overflow-hidden overflow-y-auto max-w-sm mx-auto">
            <VoicePanel onTranscribed={(text) => {
              setInput(text);
              setActivePanel("chat");
              setTimeout(() => inputRef.current?.focus(), 100);
            }} />
          </div>
        )}

        {/* Right panel: Real-time feeds */}
        {showRightPanel && (
          <RealtimeFeedsSidebar
            isCollapsed={rightFeedsCollapsed}
            onToggle={() => setRightFeedsCollapsed(v => !v)}
          />
        )}
      </div>

      {/* Click outside to close menus */}
      {(showAgentPicker || showProviderMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowAgentPicker(false); setShowProviderMenu(false); }}
        />
      )}
    </div>
  );
}
