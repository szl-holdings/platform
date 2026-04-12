import { useState } from "react";
import { api, type ComparisonResult } from "../lib/api";
import { cn, formatCost, formatLatency } from "../lib/utils";
import { FlaskConical, Play, Plus, Trash2, ChevronDown, ChevronUp, Star, Copy } from "lucide-react";

const PRESET_PROMPTS = [
  { label: "Explain transformers", prompt: "Explain the transformer architecture and why it revolutionized NLP. Be precise and technical." },
  { label: "Python sort", prompt: "Write a Python function that sorts a list of dictionaries by multiple keys, with support for ascending and descending order per key." },
  { label: "Risk analysis", prompt: "Analyze the key risks of deploying a large language model in a regulated financial services environment. Include compliance, security, and operational concerns." },
  { label: "Prompt injection", prompt: "What is prompt injection? Describe three real-world attack vectors and how to mitigate them in a production AI system." },
  { label: "RAG vs fine-tuning", prompt: "Compare RAG (retrieval-augmented generation) with fine-tuning. When would you choose each approach, and what are the tradeoffs?" },
];

const AVAILABLE_MODELS = [
  { model: "gpt-5.2", provider: "openai" },
  { model: "claude-sonnet-4-6", provider: "anthropic" },
  { model: "gemini-3.1-pro-preview", provider: "gemini" },
  { model: "Qwen/Qwen3-8B", provider: "huggingface" },
];

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f97316",
  gemini: "#60a5fa",
  huggingface: "#a78bfa",
};

interface PromptVariable {
  name: string;
  value: string;
}

function interpolate(template: string, vars: PromptVariable[]): string {
  let result = template;
  for (const v of vars) {
    result = result.replaceAll(`{{${v.name}}}`, v.value);
  }
  return result;
}

function extractVars(template: string): string[] {
  const matches = [...template.matchAll(/\{\{(\w+)\}\}/g)];
  return [...new Set(matches.map(m => m[1]!))];
}

export function ModelLab() {
  const [tab, setTab] = useState<"comparison" | "workbench">("comparison");
  const [prompt, setPrompt] = useState(PRESET_PROMPTS[0]!.prompt);
  const [selectedModels, setSelectedModels] = useState<string[]>(["gpt-5.2", "claude-sonnet-4-6", "gemini-3.1-pro-preview"]);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  // Workbench
  const [template, setTemplate] = useState("You are an expert in {{domain}}. Answer this question about {{topic}}: {{question}}");
  const [variables, setVariables] = useState<PromptVariable[]>([
    { name: "domain", value: "machine learning" },
    { name: "topic", value: "model quantization" },
    { name: "question", value: "What are the quality tradeoffs of 4-bit quantization?" },
  ]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const detectedVars = extractVars(template);
  const interpolated = interpolate(template, variables);

  function toggleModel(model: string) {
    setSelectedModels(prev =>
      prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]
    );
  }

  async function runComparison() {
    setRunning(true);
    setRunError(null);
    try {
      const response = await api.runModelComparison(prompt, selectedModels);
      const data: ComparisonResult[] = response.data ?? [];
      setResults(data);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setRunning(false);
    }
  }

  function copyPrompt(idx: number) {
    navigator.clipboard.writeText(interpolated).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  function updateVar(name: string, value: string) {
    setVariables(prev => prev.map(v => v.name === name ? { ...v, value } : v));
  }

  function syncVarsFromTemplate(fromTemplate: string) {
    const vars = extractVars(fromTemplate);
    setVariables(prev => {
      const existing = Object.fromEntries(prev.map(v => [v.name, v.value]));
      return vars.map(name => ({ name, value: existing[name] ?? "" }));
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Model Lab</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Side-by-side model output comparison and prompt engineering workbench. Evaluate, rate, and score model responses.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit">
        <button
          onClick={() => setTab("comparison")}
          className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "comparison" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          A/B Comparison
        </button>
        <button
          onClick={() => setTab("workbench")}
          className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "workbench" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          Prompt Workbench
        </button>
      </div>

      {tab === "comparison" && (
        <div>
          {/* Prompt input */}
          <div className="inca-panel p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-sm font-medium text-foreground">Prompt</div>
              <div className="flex flex-wrap gap-1.5 ml-2">
                {PRESET_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setPrompt(p.prompt)}
                    className="px-2 py-0.5 rounded text-xs bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 resize-none font-mono"
              placeholder="Enter your prompt..."
            />
          </div>

          {/* Model selection */}
          <div className="inca-panel p-4 mb-4">
            <div className="text-sm font-medium text-foreground mb-3">Models to Compare</div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_MODELS.map(({ model, provider }) => (
                <button
                  key={model}
                  onClick={() => toggleModel(model)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-2",
                    selectedModels.includes(model)
                      ? "border-primary/35 bg-primary/8 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[provider] || "#888" }} />
                  {model}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mb-4">
            {runError && (
              <span className="text-xs text-red-400">{runError}</span>
            )}
            <button
              onClick={runComparison}
              disabled={running || selectedModels.length === 0}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                running ? "bg-primary/50 text-primary-foreground/50 cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Play className="w-4 h-4" />
              {running ? "Running comparison..." : "Run Comparison"}
            </button>
          </div>

          {/* Results */}
          <div className="space-y-3">
            {results.filter(r => selectedModels.includes(r.model)).map((result) => {
              const isExpanded = expandedResult === result.model;
              return (
                <div key={result.model} className="model-card overflow-hidden">
                  <div
                    className="p-4 flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedResult(isExpanded ? null : result.model)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `${PROVIDER_COLORS[result.provider] || "#888"}18`, border: `1px solid ${PROVIDER_COLORS[result.provider] || "#888"}33` }}>
                        <FlaskConical className="w-4 h-4" style={{ color: PROVIDER_COLORS[result.provider] || "#888" }} />
                      </div>
                      <div>
                        <div className="font-mono text-sm text-foreground">{result.model}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground">{formatLatency(result.latencyMs)}</span>
                          <span className="text-xs text-muted-foreground">{result.tokens} tokens</span>
                          <span className="text-xs text-muted-foreground">{formatCost(result.cost)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Star rating */}
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={(e) => { e.stopPropagation(); setRatings(r => ({ ...r, [result.model]: star })); }}
                            className={cn("transition-colors", (ratings[result.model] || 0) >= star ? "text-amber-400" : "text-muted-foreground/30 hover:text-muted-foreground")}
                          >
                            <Star className="w-3.5 h-3.5" fill={(ratings[result.model] || 0) >= star ? "currentColor" : "none"} />
                          </button>
                        ))}
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="px-4 pb-3">
                    <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{result.output}</div>
                  </div>

                  {/* Expanded view */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/50 pt-3 animate-fade-in">
                      <div className="bg-secondary rounded-lg p-3 text-sm text-foreground leading-relaxed font-mono whitespace-pre-wrap">
                        {result.output}
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => { navigator.clipboard.writeText(result.output).catch(() => {}); }}
                          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Evaluation summary */}
          {Object.keys(ratings).length > 0 && (
            <div className="inca-panel p-4 mt-4">
              <div className="text-sm font-medium text-foreground mb-3">Evaluation Scores</div>
              <div className="space-y-2">
                {results
                  .filter(r => ratings[r.model])
                  .sort((a, b) => (ratings[b.model] || 0) - (ratings[a.model] || 0))
                  .map((r, idx) => (
                    <div key={r.model} className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground w-4">{idx + 1}.</div>
                      <div className="font-mono text-xs text-foreground flex-1">{r.model}</div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("w-3 h-3", (ratings[r.model] || 0) >= s ? "text-amber-400" : "text-muted-foreground/20")} fill={(ratings[r.model] || 0) >= s ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatCost(r.cost)}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "workbench" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Template input */}
          <div className="space-y-4">
            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-2">Prompt Template</div>
              <div className="text-xs text-muted-foreground mb-2">Use {`{{variable}}`} syntax for injection points</div>
              <textarea
                value={template}
                onChange={(e) => { setTemplate(e.target.value); syncVarsFromTemplate(e.target.value); }}
                rows={6}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 resize-none font-mono"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-muted-foreground">{detectedVars.length} variable{detectedVars.length !== 1 ? "s" : ""} detected</div>
                <div className="flex flex-wrap gap-1">
                  {detectedVars.map(v => (
                    <span key={v} className="badge-staged px-1.5 py-0.5 rounded text-xs font-mono">{`{{${v}}}`}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Variable bindings */}
            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Variable Bindings</div>
              {variables.length === 0 && (
                <div className="text-xs text-muted-foreground">No variables detected in template</div>
              )}
              <div className="space-y-2.5">
                {variables.map((v) => (
                  <div key={v.name}>
                    <div className="text-xs text-muted-foreground mb-1 font-mono">{`{{${v.name}}}`}</div>
                    <input
                      value={v.value}
                      onChange={(e) => updateVar(v.name, e.target.value)}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                      placeholder={`Value for ${v.name}...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interpolated output */}
          <div className="space-y-4">
            <div className="inca-panel p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-foreground">Resolved Prompt</div>
                <button
                  onClick={() => copyPrompt(0)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  {copiedIdx === 0 ? "Copied!" : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
              <div className="bg-secondary rounded-lg p-3 text-sm text-foreground leading-relaxed font-mono whitespace-pre-wrap min-h-[120px] border border-border">
                {interpolated}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="text-xs text-muted-foreground">{interpolated.split(" ").length} words</div>
                <div className="text-xs text-muted-foreground">{Math.ceil(interpolated.length / 4)} est. tokens</div>
              </div>
            </div>

            {/* Quick send to comparison */}
            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-2">Evaluation</div>
              <div className="text-xs text-muted-foreground mb-3">Send this prompt to A/B comparison to evaluate multiple models</div>
              <button
                onClick={() => { setPrompt(interpolated); setTab("comparison"); }}
                className="w-full px-4 py-2.5 bg-primary/15 border border-primary/25 text-primary rounded-lg text-sm font-medium hover:bg-primary/25 transition-colors flex items-center justify-center gap-2"
              >
                <FlaskConical className="w-4 h-4" />
                Send to A/B Comparison
              </button>
            </div>

            {/* Prompt history examples */}
            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Prompt Templates</div>
              <div className="space-y-2">
                {[
                  { label: "Chain-of-thought", template: "Think step by step about {{problem}}. First identify the key constraints, then reason through each step, then provide your answer." },
                  { label: "Few-shot", template: "Here are examples of {{task}}:\n\nExample 1: {{example1}}\nExample 2: {{example2}}\n\nNow do: {{input}}" },
                  { label: "Role-play", template: "You are a {{role}} with expertise in {{domain}}. A {{user_type}} asks: {{question}}. Respond appropriately." },
                ].map(({ label, template: t }) => (
                  <button
                    key={label}
                    onClick={() => { setTemplate(t); syncVarsFromTemplate(t); }}
                    className="w-full text-left px-3 py-2 bg-secondary rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <div className="font-medium text-foreground mb-0.5">{label}</div>
                    <div className="truncate font-mono">{t.slice(0, 60)}...</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
