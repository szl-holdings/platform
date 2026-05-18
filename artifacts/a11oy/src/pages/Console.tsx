// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card } from '../components/ui';
import {
  ChevronDown, ChevronRight, Play, Square, Save, Zap, Brain,
  DollarSign, Clock, Eye, ExternalLink, Copy, Check, Info,
  Database, Cpu, RefreshCw, FileText
} from 'lucide-react';

const GOLD = '#c9b787';
const GHOST = 'var(--color-a11oy-text-ghost)';
const SUB = 'var(--color-a11oy-text-sub)';
const CARD_BG = 'var(--color-a11oy-card)';
const BORDER = 'var(--color-a11oy-border)';
const DEEP = 'var(--color-a11oy-deep)';
const SURFACE = 'var(--color-a11oy-surface)';
const API_BASE = '/api/a11oy/console';

interface ModelSpec {
  id: string;
  displayName: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  capabilities: string[];
  tier: string;
  supportsExtendedThinking: boolean;
  supportsVision: boolean;
  supportsPromptCaching: boolean;
  mythosModel: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ContentBlock {
  type: 'text' | 'thinking' | 'tool_call';
  content: string;
  toolName?: string;
  toolId?: string;
  expanded?: boolean;
  blockIndex: number;
}

interface RunProvenance {
  model: string;
  provider: string;
  latencyMs: number;
  estimatedCostUsd: number;
  tokens: { input: number; output: number; cacheCreation: number; cacheRead: number };
  cacheHit: boolean;
  costBreakdown: { baseInput: number; cacheWrite: number; cacheRead: number; output: number };
  trustScore: number;
  proofId: string | null;
  runId: string;
}

const PROVIDER_ORDER = ['anthropic', 'openai', 'gemini', 'deepseek', 'huggingface'];
const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Mythos Tier — Claude (Anthropic)',
  openai: 'OpenAI',
  gemini: 'Gemini (Google)',
  deepseek: 'DeepSeek',
  huggingface: 'HuggingFace / Local',
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="p-1 rounded transition-colors"
      style={{ color: copied ? GOLD : GHOST, cursor: 'pointer', background: 'none', border: 'none' }}
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function ToolCallBlock({ block, onToggle }: { block: ContentBlock; onToggle: () => void }) {
  return (
    <div className="rounded border my-1" style={{ borderColor: 'rgba(201,183,135,0.2)', background: 'rgba(201,183,135,0.03)' }}>
      <button
        type="button"
        className="flex items-center gap-2 w-full px-3 py-2 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: GOLD }}
        onClick={onToggle}
      >
        {block.expanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
        <Cpu className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs font-mono font-semibold">{block.toolName ?? 'tool_call'}</span>
        {block.toolId && <span className="text-[10px] ml-auto" style={{ color: GHOST }}>{block.toolId.slice(0, 12)}</span>}
      </button>
      {block.expanded && block.content && (
        <div className="px-3 pb-3">
          <pre className="text-[11px] font-mono overflow-x-auto whitespace-pre-wrap" style={{ color: SUB }}>
            {block.content}
          </pre>
        </div>
      )}
    </div>
  );
}

function ThinkingBlock({ block, onToggle }: { block: ContentBlock; onToggle: () => void }) {
  return (
    <div className="rounded border my-1" style={{ borderColor: 'rgba(168,85,247,0.2)', background: 'rgba(168,85,247,0.04)' }}>
      <button
        type="button"
        className="flex items-center gap-2 w-full px-3 py-2 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa' }}
        onClick={onToggle}
      >
        {block.expanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
        <Brain className="w-3.5 h-3.5 shrink-0" />
        <span className="text-xs font-mono font-semibold">Extended Thinking</span>
        <span className="text-[10px] ml-auto" style={{ color: 'rgba(168,85,247,0.6)' }}>
          {block.content.split(' ').length} tokens approx
        </span>
      </button>
      {block.expanded && block.content && (
        <div className="px-3 pb-3">
          <pre className="text-[11px] font-mono overflow-x-auto whitespace-pre-wrap" style={{ color: 'rgba(168,85,247,0.8)' }}>
            {block.content}
          </pre>
        </div>
      )}
    </div>
  );
}

export function Console() {
  const [models, setModels] = useState<Record<string, ModelSpec[]>>({});
  const [loadingModels, setLoadingModels] = useState(true);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6');
  const [systemPrompt, setSystemPrompt] = useState('You are A11oy — the Orchestration and Decision Intelligence layer of the SZL Holdings governed platform. Answer clearly and precisely.');
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState<number | null>(null);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [thinkingBudget, setThinkingBudget] = useState(0);
  const [promptCaching, setPromptCaching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [provenance, setProvenance] = useState<RunProvenance | null>(null);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedWorkcell, setSavedWorkcell] = useState(false);
  const [workcellName, setWorkcellName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const spec = models[selectedModel.split('/')[0] === 'Qwen' ? 'huggingface' : Object.keys(models).find(k => models[k]?.some(m => m.id === selectedModel)) ?? 'anthropic']?.find(m => m.id === selectedModel);

  useEffect(() => {
    fetch(`${API_BASE}/models`)
      .then(r => r.json())
      .then((d: { ok: boolean; data: { byProvider: Record<string, ModelSpec[]> } }) => {
        if (d.ok) setModels(d.data.byProvider);
      })
      .catch(() => {})
      .finally(() => setLoadingModels(false));
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.scrollTop = canvasRef.current.scrollHeight;
    }
  }, [blocks]);

  const countTokens = useCallback(async () => {
    if (!selectedModel || messages.length === 0 && !input) return;
    try {
      const res = await fetch(`${API_BASE}/count-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, systemPrompt, messages }),
      });
      const d = (await res.json()) as { ok: boolean; data: { inputTokens: number } };
      if (d.ok) setTokenCount(d.data.inputTokens);
    } catch { /* non-fatal */ }
  }, [selectedModel, systemPrompt, messages, input]);

  useEffect(() => {
    const timer = setTimeout(countTokens, 600);
    return () => clearTimeout(timer);
  }, [countTokens]);

  const stopStream = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    setError(null);
    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setProvenance(null);

    const currentBlocks: ContentBlock[] = [...blocks, {
      type: 'text',
      content: `**You:** ${userMessage.content}`,
      blockIndex: -1,
    }];
    setBlocks(currentBlocks);

    const blockMap = new Map<number, ContentBlock>();
    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch(`${API_BASE}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          systemPrompt,
          messages: newMessages,
          temperature,
          maxTokens,
          thinkingBudget: thinkingBudget > 0 ? thinkingBudget : undefined,
          promptCaching,
          topP: topP !== null ? topP : undefined,
        }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let buffer = '';
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          let event: Record<string, unknown>;
          try { event = JSON.parse(raw) as Record<string, unknown>; } catch { continue; }

          const t = event['type'] as string;

          if (t === 'text') {
            const text = (event['text'] as string) ?? '';
            const idx = (event['blockIndex'] as number) ?? 0;
            assistantText += text;
            if (!blockMap.has(idx)) {
              const b: ContentBlock = { type: 'text', content: text, blockIndex: idx };
              blockMap.set(idx, b);
            } else {
              blockMap.get(idx)!.content += text;
            }
            setBlocks([...currentBlocks, ...Array.from(blockMap.values())]);
          } else if (t === 'thinking_start') {
            const idx = (event['blockIndex'] as number) ?? 0;
            const b: ContentBlock = { type: 'thinking', content: '', blockIndex: idx, expanded: false };
            blockMap.set(idx, b);
          } else if (t === 'thinking') {
            const text = (event['text'] as string) ?? '';
            const idx = (event['blockIndex'] as number) ?? 0;
            if (blockMap.has(idx)) blockMap.get(idx)!.content += text;
            setBlocks([...currentBlocks, ...Array.from(blockMap.values())]);
          } else if (t === 'tool_call_start') {
            const idx = (event['blockIndex'] as number) ?? 0;
            const b: ContentBlock = {
              type: 'tool_call',
              content: '',
              toolName: event['toolName'] as string,
              toolId: event['toolId'] as string,
              blockIndex: idx,
              expanded: false,
            };
            blockMap.set(idx, b);
            setBlocks([...currentBlocks, ...Array.from(blockMap.values())]);
          } else if (t === 'tool_call_delta') {
            const partial = (event['partial'] as string) ?? '';
            const idx = (event['blockIndex'] as number) ?? 0;
            if (blockMap.has(idx)) blockMap.get(idx)!.content += partial;
            setBlocks([...currentBlocks, ...Array.from(blockMap.values())]);
          } else if (t === 'provenance') {
            setProvenance(event['provenance'] as RunProvenance);
          } else if (t === 'error') {
            setError((event['error'] as string) ?? 'Unknown error');
          } else if (t === 'done') {
            if (assistantText) {
              setMessages(prev => [...prev, { role: 'assistant', content: assistantText }]);
            }
            break;
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message ?? 'Stream failed');
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const clearCanvas = () => {
    setMessages([]);
    setBlocks([]);
    setProvenance(null);
    setError(null);
    setTokenCount(null);
  };

  const toggleBlock = (idx: number) => {
    setBlocks(prev => prev.map(b => b.blockIndex === idx ? { ...b, expanded: !b.expanded } : b));
  };

  const saveWorkcell = async () => {
    if (!workcellName.trim()) return;
    try {
      await fetch(`${API_BASE}/save-workcell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workcellName,
          model: selectedModel,
          systemPrompt,
          temperature,
          maxTokens,
          thinkingBudget: thinkingBudget > 0 ? thinkingBudget : undefined,
          promptCaching,
          topP: topP !== null ? topP : undefined,
        }),
      });
      setSavedWorkcell(true);
      setShowSaveDialog(false);
      setTimeout(() => setSavedWorkcell(false), 3000);
    } catch { /* non-fatal */ }
  };

  const allSpecs = Object.values(models).flat();
  const selectedSpec = allSpecs.find(m => m.id === selectedModel) ?? spec;
  const contextWindow = selectedSpec?.contextWindow ?? 200_000;
  const contextPct = tokenCount != null ? Math.min(100, (tokenCount / contextWindow) * 100) : 0;

  const isAnthropicModel = selectedModel.startsWith('claude');
  const cacheCostSavingPct = promptCaching && provenance?.tokens.cacheRead
    ? Math.round((provenance.tokens.cacheRead / (provenance.tokens.input + provenance.tokens.cacheRead)) * 90)
    : null;

  return (
    <Layout>
      <PageHeader
        label="CONSOLE"
        title="A11oy Console — Live Cockpit"
        subtitle="Workbench-style operator interface. Pick any model, write a system prompt, stream a response — every run goes through covenant policy and lands in ProofLedger."
        status="LIVE"
      />

      <div className="flex gap-4 h-[calc(100vh-14rem)] min-h-[600px]">
        {/* ── Left Pane: Config ──────────────────────────────────────── */}
        <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">

          {/* Model picker */}
          <Card className="p-3">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: GHOST }}>Model</div>
            {loadingModels ? (
              <div className="text-xs" style={{ color: GHOST }}>Loading models…</div>
            ) : (
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="w-full text-xs rounded px-2 py-1.5 border"
                style={{ backgroundColor: DEEP, borderColor: BORDER, color: 'var(--color-a11oy-text)', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {PROVIDER_ORDER.map(provider => {
                  const providerModels = models[provider];
                  if (!providerModels?.length) return null;
                  return (
                    <optgroup key={provider} label={PROVIDER_LABELS[provider] ?? provider}>
                      {providerModels.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.displayName}{m.mythosModel ? ' ★' : ''}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            )}
            {selectedSpec && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedSpec.capabilities.slice(0, 4).map(cap => (
                  <span key={cap} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: GOLD }}>
                    {cap}
                  </span>
                ))}
                {selectedSpec.supportsPromptCaching && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
                    cache
                  </span>
                )}
                {selectedSpec.supportsVision && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
                    vision
                  </span>
                )}
              </div>
            )}
          </Card>

          {/* System prompt */}
          <Card className="p-3">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: GHOST }}>System Prompt</div>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={8}
              className="w-full text-xs rounded px-2 py-1.5 border resize-none font-mono"
              style={{ backgroundColor: DEEP, borderColor: BORDER, color: 'var(--color-a11oy-text)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.5 }}
              placeholder="Enter system prompt…"
            />
          </Card>

          {/* Parameters */}
          <Card className="p-3">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: GHOST }}>Parameters</div>

            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono" style={{ color: GHOST }}>Temperature</span>
                  <span className="text-[10px] font-mono" style={{ color: GOLD }}>{temperature.toFixed(2)}</span>
                </div>
                <input type="range" min={0} max={1} step={0.01} value={temperature} onChange={e => setTemperature(Number(e.target.value))}
                  className="w-full h-1 rounded appearance-none cursor-pointer" style={{ accentColor: GOLD }} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono" style={{ color: GHOST }}>Max Tokens</span>
                  <span className="text-[10px] font-mono" style={{ color: GOLD }}>{maxTokens.toLocaleString()}</span>
                </div>
                <input type="range" min={256} max={16384} step={256} value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))}
                  className="w-full h-1 rounded appearance-none cursor-pointer" style={{ accentColor: GOLD }} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono" style={{ color: GHOST }}>Top P</span>
                  <span className="text-[10px] font-mono" style={{ color: GOLD }}>
                    {topP !== null ? topP.toFixed(2) : 'off'}
                  </span>
                </div>
                <input
                  type="range" min={0} max={1} step={0.01}
                  value={topP !== null ? topP : 1}
                  onChange={e => setTopP(Number(e.target.value) < 1 ? Number(e.target.value) : null)}
                  className="w-full h-1 rounded appearance-none cursor-pointer"
                  style={{ accentColor: GOLD }}
                />
                <div className="text-[9px] mt-0.5" style={{ color: GHOST }}>Slide left to constrain nucleus sampling</div>
              </div>

              {selectedSpec?.supportsExtendedThinking && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-mono" style={{ color: GHOST }}>Thinking Budget</span>
                    <span className="text-[10px] font-mono" style={{ color: '#a78bfa' }}>
                      {thinkingBudget > 0 ? `${thinkingBudget.toLocaleString()} tok` : 'off'}
                    </span>
                  </div>
                  <input type="range" min={0} max={16000} step={1000} value={thinkingBudget} onChange={e => setThinkingBudget(Number(e.target.value))}
                    className="w-full h-1 rounded appearance-none cursor-pointer" style={{ accentColor: '#a78bfa' }} />
                </div>
              )}

              {isAnthropicModel && selectedSpec?.supportsPromptCaching && (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono" style={{ color: GHOST }}>Prompt Caching</span>
                    <div className="text-[9px] mt-0.5" style={{ color: 'rgba(34,197,94,0.7)' }}>~90% savings on cached tokens</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPromptCaching(prev => !prev)}
                    className="relative inline-flex h-4 w-8 items-center rounded-full transition-colors"
                    style={{ backgroundColor: promptCaching ? 'rgba(34,197,94,0.4)' : 'var(--color-a11oy-muted)', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <span
                      className="inline-block h-3 w-3 transform rounded-full transition-transform"
                      style={{
                        backgroundColor: promptCaching ? '#4ade80' : GHOST,
                        transform: promptCaching ? 'translateX(17px)' : 'translateX(2px)',
                      }}
                    />
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={clearCanvas}
              disabled={isStreaming || (messages.length === 0 && blocks.length === 0)}
              className="w-full text-xs px-3 py-2 rounded font-mono transition-colors flex items-center gap-2 justify-center"
              style={{
                backgroundColor: 'var(--color-a11oy-muted)',
                color: SUB,
                border: `1px solid ${BORDER}`,
                cursor: 'pointer',
                opacity: messages.length === 0 && blocks.length === 0 ? 0.4 : 1,
              }}
            >
              <RefreshCw className="w-3 h-3" />
              Clear canvas
            </button>

            {savedWorkcell && (
              <div className="text-xs text-center py-1 rounded" style={{ color: '#4ade80', backgroundColor: 'rgba(34,197,94,0.1)' }}>
                ✓ Saved as Workcell template
              </div>
            )}

            {showSaveDialog ? (
              <div className="flex flex-col gap-2 p-2 rounded border" style={{ borderColor: BORDER, backgroundColor: CARD_BG }}>
                <input
                  type="text"
                  value={workcellName}
                  onChange={e => setWorkcellName(e.target.value)}
                  placeholder="Template name…"
                  className="text-xs px-2 py-1.5 rounded border font-mono"
                  style={{ backgroundColor: DEEP, borderColor: BORDER, color: 'var(--color-a11oy-text)' }}
                />
                <div className="flex gap-1">
                  <button type="button" onClick={saveWorkcell}
                    className="flex-1 text-xs px-2 py-1.5 rounded font-mono"
                    style={{ backgroundColor: 'rgba(201,183,135,0.15)', color: GOLD, border: `1px solid rgba(201,183,135,0.3)`, cursor: 'pointer' }}>
                    Save
                  </button>
                  <button type="button" onClick={() => setShowSaveDialog(false)}
                    className="flex-1 text-xs px-2 py-1.5 rounded font-mono"
                    style={{ backgroundColor: 'var(--color-a11oy-muted)', color: GHOST, border: `1px solid ${BORDER}`, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSaveDialog(true)}
                disabled={messages.length === 0}
                className="w-full text-xs px-3 py-2 rounded font-mono transition-colors flex items-center gap-2 justify-center"
                style={{
                  backgroundColor: 'rgba(201,183,135,0.08)',
                  color: GOLD,
                  border: `1px solid rgba(201,183,135,0.2)`,
                  cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: messages.length === 0 ? 0.4 : 1,
                }}
              >
                <Save className="w-3 h-3" />
                Save as Workcell template
              </button>
            )}
          </div>
        </div>

        {/* ── Center Pane: Message Canvas ────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Canvas scroll area */}
          <div
            ref={canvasRef}
            className="flex-1 rounded-lg border overflow-y-auto p-4 font-mono text-sm space-y-2"
            style={{ borderColor: BORDER, backgroundColor: DEEP, minHeight: 0 }}
          >
            {blocks.length === 0 && !isStreaming && (
              <div className="h-full flex items-center justify-center flex-col gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(201,183,135,0.08)', border: `1px solid rgba(201,183,135,0.15)` }}>
                  <Zap className="w-5 h-5" style={{ color: GOLD }} />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium mb-1" style={{ color: SUB }}>Console ready</div>
                  <div className="text-xs" style={{ color: GHOST }}>Select a model · write a prompt · send a message</div>
                  {isAnthropicModel && (
                    <div className="text-[10px] mt-2 px-3 py-1 rounded inline-block" style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#4ade80' }}>
                      Prompt caching available — toggle in the left panel
                    </div>
                  )}
                </div>
              </div>
            )}

            {blocks.map((block, i) => {
              if (block.type === 'tool_call') {
                return <ToolCallBlock key={`${block.blockIndex}-${i}`} block={block} onToggle={() => toggleBlock(block.blockIndex)} />;
              }
              if (block.type === 'thinking') {
                return <ThinkingBlock key={`${block.blockIndex}-${i}`} block={block} onToggle={() => toggleBlock(block.blockIndex)} />;
              }
              if (block.blockIndex === -1) {
                return (
                  <div key={i} className="text-xs px-3 py-2 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.06)', borderLeft: `2px solid rgba(201,183,135,0.3)`, color: SUB }}>
                    {block.content.replace('**You:** ', '')}
                  </div>
                );
              }
              return (
                <div key={`${block.blockIndex}-${i}`} className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-a11oy-text)' }}>
                  {block.content}
                </div>
              );
            })}

            {isStreaming && (
              <div className="flex items-center gap-2 text-xs" style={{ color: GHOST }}>
                <div className="flex gap-0.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: GOLD, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span className="font-mono">Streaming…</span>
              </div>
            )}

            {error && (
              <div className="text-xs px-3 py-2 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderLeft: '2px solid rgba(239,68,68,0.4)', color: '#f87171' }}>
                {error}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
              rows={3}
              className="flex-1 text-sm px-3 py-2 rounded border resize-none font-mono"
              style={{ backgroundColor: CARD_BG, borderColor: BORDER, color: 'var(--color-a11oy-text)', lineHeight: 1.5 }}
              disabled={isStreaming}
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={isStreaming ? stopStream : sendMessage}
                disabled={!isStreaming && !input.trim()}
                className="px-4 py-2 rounded font-mono text-sm flex items-center gap-2 transition-colors"
                style={{
                  backgroundColor: isStreaming ? 'rgba(239,68,68,0.15)' : 'rgba(201,183,135,0.15)',
                  color: isStreaming ? '#f87171' : GOLD,
                  border: isStreaming ? '1px solid rgba(239,68,68,0.3)' : `1px solid rgba(201,183,135,0.3)`,
                  cursor: (!isStreaming && !input.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (!isStreaming && !input.trim()) ? 0.4 : 1,
                }}
              >
                {isStreaming ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isStreaming ? 'Stop' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Pane: Inspector ──────────────────────────────────── */}
        <div className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto pl-1">

          {/* Context window meter */}
          <Card className="p-3">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: GHOST }}>Context Window</div>
            <div className="flex justify-between text-[10px] font-mono mb-1.5">
              <span style={{ color: SUB }}>{tokenCount != null ? tokenCount.toLocaleString() : '—'} tok used</span>
              <span style={{ color: GHOST }}>{(contextWindow / 1000).toFixed(0)}K max</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${contextPct}%`,
                  backgroundColor: contextPct > 85 ? '#f87171' : contextPct > 60 ? '#fb923c' : GOLD,
                }}
              />
            </div>
            <div className="text-[9px] mt-1 font-mono" style={{ color: GHOST }}>{contextPct.toFixed(1)}% of context used</div>
          </Card>

          {/* Live metrics */}
          <Card className="p-3">
            <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: GHOST }}>Run Metrics</div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: GHOST }} />
                <div className="flex-1">
                  <div className="text-[10px]" style={{ color: GHOST }}>Latency</div>
                  <div className="text-xs font-mono" style={{ color: provenance ? GOLD : GHOST }}>
                    {provenance ? `${provenance.latencyMs.toLocaleString()} ms` : '—'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 shrink-0" style={{ color: GHOST }} />
                <div className="flex-1">
                  <div className="text-[10px]" style={{ color: GHOST }}>Cost</div>
                  <div className="text-xs font-mono" style={{ color: provenance ? GOLD : GHOST }}>
                    {provenance ? `$${provenance.estimatedCostUsd.toFixed(6)}` : '—'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 shrink-0" style={{ color: GHOST }} />
                <div className="flex-1">
                  <div className="text-[10px]" style={{ color: GHOST }}>Tokens</div>
                  <div className="text-xs font-mono" style={{ color: provenance ? GOLD : GHOST }}>
                    {provenance
                      ? `${provenance.tokens.input.toLocaleString()} in / ${provenance.tokens.output.toLocaleString()} out`
                      : '—'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 shrink-0" style={{ color: GHOST }} />
                <div className="flex-1">
                  <div className="text-[10px]" style={{ color: GHOST }}>Trust Score</div>
                  <div className="text-xs font-mono" style={{ color: provenance ? GOLD : GHOST }}>
                    {provenance ? `${Math.round(provenance.trustScore * 100)}%` : '—'}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Cache meter */}
          {isAnthropicModel && (
            <Card className="p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: GHOST }}>Prompt Cache</div>
                {promptCaching && (
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#4ade80' }} />
                )}
              </div>

              {!promptCaching && (
                <div className="text-[10px] leading-relaxed" style={{ color: GHOST }}>
                  Toggle caching in the left panel to enable ~90% savings on repeated context tokens.
                </div>
              )}

              {promptCaching && !provenance && (
                <div className="text-[10px]" style={{ color: '#4ade80' }}>Caching enabled — run a message to see savings.</div>
              )}

              {promptCaching && provenance && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span style={{ color: GHOST }}>Cache hit</span>
                    <span style={{ color: provenance.cacheHit ? '#4ade80' : GHOST }}>
                      {provenance.cacheHit ? '✓ YES' : 'NO'}
                    </span>
                  </div>
                  {provenance.tokens.cacheRead > 0 && (
                    <div className="flex justify-between text-[10px] font-mono">
                      <span style={{ color: GHOST }}>Tokens read</span>
                      <span style={{ color: '#4ade80' }}>{provenance.tokens.cacheRead.toLocaleString()}</span>
                    </div>
                  )}
                  {provenance.tokens.cacheCreation > 0 && (
                    <div className="flex justify-between text-[10px] font-mono">
                      <span style={{ color: GHOST }}>Tokens written</span>
                      <span style={{ color: GOLD }}>{provenance.tokens.cacheCreation.toLocaleString()}</span>
                    </div>
                  )}
                  {cacheCostSavingPct !== null && cacheCostSavingPct > 0 && (
                    <div className="text-[10px] px-2 py-1 rounded font-mono" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
                      ~{cacheCostSavingPct}% cost reduction on cached tokens
                    </div>
                  )}
                  <div className="flex flex-col gap-1 text-[10px] font-mono pt-1 border-t" style={{ borderColor: BORDER }}>
                    <div className="flex justify-between">
                      <span style={{ color: GHOST }}>Base input</span>
                      <span style={{ color: SUB }}>${provenance.costBreakdown.baseInput.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: GHOST }}>Cache write</span>
                      <span style={{ color: GOLD }}>${provenance.costBreakdown.cacheWrite.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#4ade80' }}>Cache read</span>
                      <span style={{ color: '#4ade80' }}>${provenance.costBreakdown.cacheRead.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: GHOST }}>Output</span>
                      <span style={{ color: SUB }}>${provenance.costBreakdown.output.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* JSON Inspector */}
          {provenance && (
            <Card className="p-3">
              <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: GHOST }}>Run JSON</div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono" style={{ color: GHOST }}>{provenance.runId}</span>
                <CopyButton text={JSON.stringify(provenance, null, 2)} />
              </div>
              <pre className="text-[9px] font-mono overflow-x-auto whitespace-pre-wrap max-h-36 overflow-y-auto" style={{ color: GHOST }}>
                {JSON.stringify({
                  model: provenance.model,
                  tokens: provenance.tokens,
                  latencyMs: provenance.latencyMs,
                  cost: provenance.estimatedCostUsd,
                  trustScore: provenance.trustScore,
                }, null, 2)}
              </pre>
            </Card>
          )}

          {/* Proof Chain link */}
          {provenance?.proofId && (
            <Card className="p-3">
              <div className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: GHOST }}>Proof Packet</div>
              <Link
                href={`/proof-ledger?proofId=${encodeURIComponent(provenance.proofId)}`}
                className="flex items-center gap-2 text-xs font-mono transition-colors hover:opacity-80"
                style={{ color: GOLD }}
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                View in ProofLedger
                <ExternalLink className="w-3 h-3" />
              </Link>
              <div className="mt-1 text-[9px] font-mono truncate" style={{ color: GHOST }}>
                {provenance.proofId}
              </div>
            </Card>
          )}

          {/* Doctrine note */}
          <div className="text-[9px] leading-relaxed px-1" style={{ color: GHOST }}>
            <Info className="w-3 h-3 inline mr-1" />
            Every Console run is governed by the same covenant policy and proof-chain pipeline as all Workcells.
            Prompt caching is Anthropic-native — cache breakpoints are injected into system and last-user turns.
          </div>
        </div>
      </div>
    </Layout>
  );
}
