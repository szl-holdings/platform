import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { MessageSquare, Zap, AlertTriangle, CheckCircle, BarChart3, Brain, Sparkles, Loader2, Play } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const models = [
  { name: "GPT-5.2", provider: "OpenAI", accuracy: 96, coherence: 97, hallucination: 1.1, latency: 1.4, cost: "$0.015/1K", overall: 95 },
  { name: "Claude Sonnet 4.6", provider: "Anthropic", accuracy: 94, coherence: 97, hallucination: 0.9, latency: 1.9, cost: "$0.012/1K", overall: 94 },
  { name: "GPT-4o", provider: "OpenAI", accuracy: 91, coherence: 94, hallucination: 3.2, latency: 1.8, cost: "$0.008/1K", overall: 89 },
  { name: "LLaMA-3-70B (FT)", provider: "Internal", accuracy: 88, coherence: 89, hallucination: 4.1, latency: 0.9, cost: "$0.001/1K", overall: 84 },
];

const promptTests = [
  { prompt: "Summarize Q4 2025 earnings report", model: "Claude Sonnet 4.6", score: 96, hallucination: false, tokens: 847, time: "1.9s" },
  { prompt: "Generate SQL for nested JOIN across 5 tables", model: "GPT-5.2", score: 94, hallucination: false, tokens: 312, time: "1.1s" },
  { prompt: "Explain quantum entanglement to a 10-year-old", model: "LLaMA-3-70B (FT)", score: 82, hallucination: true, tokens: 445, time: "0.8s" },
  { prompt: "Analyze sentiment in customer feedback batch", model: "GPT-5.2", score: 93, hallucination: false, tokens: 1204, time: "2.1s" },
];

interface LiveTest {
  prompt: string;
  model: "gpt-5.2" | "claude-sonnet-4-6";
  response: string;
  loading: boolean;
  latencyMs?: number;
  error?: string;
}

export default function LLMEvaluation() {
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [testPrompt, setTestPrompt] = useState("");
  const [testModel, setTestModel] = useState<"gpt-5.2" | "claude-sonnet-4-6">("gpt-5.2");
  const [liveTest, setLiveTest] = useState<LiveTest | null>(null);

  const runLiveTest = async () => {
    if (!testPrompt.trim() || liveTest?.loading) return;
    const prompt = testPrompt.trim();
    setLiveTest({ prompt, model: testModel, response: "", loading: true });

    const start = Date.now();
    try {
      const res = await fetch("/api/intelligence/ai/domain-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          agentId: "research",
          messages: [{ role: "user", content: prompt }],
          maxTokens: 1024,
          stream: true,
        }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.done) break;
            if (json.error) throw new Error(json.error);
            if (json.content) {
              fullResponse += json.content;
              setLiveTest(prev => prev ? { ...prev, response: fullResponse } : null);
            }
          } catch {}
        }
      }

      setLiveTest(prev => prev ? { ...prev, loading: false, latencyMs: Date.now() - start } : null);
    } catch (err) {
      setLiveTest(prev => prev ? { ...prev, loading: false, error: err instanceof Error ? err.message : "Test failed" } : null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          LLM Evaluation Suite
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Prompt testing, response quality scoring, and hallucination detection across model versions</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {models.map((model) => (
          <Card key={model.name} onClick={() => setSelectedModel(model)} className={`cursor-pointer transition-all hover:border-primary/50 ${selectedModel.name === model.name ? "border-primary ring-1 ring-primary/20" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">{model.name}</p>
                  <p className="text-[10px] text-muted-foreground">{model.provider}</p>
                </div>
                <p className={`text-xl font-bold ${model.overall >= 93 ? "text-emerald-400" : model.overall >= 88 ? "text-sky-400" : "text-amber-400"}`}>{model.overall}</p>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Hallucination Rate</span><span className={model.hallucination <= 2 ? "text-emerald-400" : model.hallucination <= 4 ? "text-amber-400" : "text-red-400"}>{model.hallucination}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Avg Latency</span><span>{model.latency}s</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cost</span><span>{model.cost}</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Live Prompt Tester
            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-400/30 bg-emerald-400/10 ml-auto">LIVE</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <input
              value={testPrompt}
              onChange={e => setTestPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && runLiveTest()}
              placeholder="Enter a prompt to test against the INCA research agent (gpt-5.2)..."
              disabled={liveTest?.loading}
              className="flex-1 px-3 py-2 text-xs bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <select
              value={testModel}
              onChange={e => setTestModel(e.target.value as any)}
              className="px-3 py-2 text-xs bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="gpt-5.2">GPT-5.2</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
            </select>
            <button
              onClick={runLiveTest}
              disabled={!testPrompt.trim() || liveTest?.loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 text-xs font-medium"
            >
              {liveTest?.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {liveTest?.loading ? "Running..." : "Run Test"}
            </button>
          </div>

          {liveTest && (
            <div className="rounded-lg bg-muted/40 border border-border p-4 space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{liveTest.model}</span>
                {liveTest.loading && <span className="flex items-center gap-1 text-primary"><Loader2 className="w-3 h-3 animate-spin" /> streaming...</span>}
                {liveTest.latencyMs && <span className="text-emerald-400">{(liveTest.latencyMs / 1000).toFixed(2)}s</span>}
                <span className="ml-auto text-[9px]">via INCA research agent</span>
              </div>
              {liveTest.error && <p className="text-xs text-red-400">{liveTest.error}</p>}
              {liveTest.response && (
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">{liveTest.response}</p>
              )}
              {liveTest.loading && !liveTest.response && (
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Model Comparison — Key Metrics</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={models} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[70, 100]} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="accuracy" name="Accuracy" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="coherence" name="Coherence" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="overall" name="Overall" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Prompt Test Results</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {promptTests.map((test, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{test.prompt}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>{test.model}</span>
                        <span>{test.tokens} tokens</span>
                        <span>{test.time}</span>
                        {test.hallucination && <span className="text-red-400 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />Hallucination detected</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {test.hallucination ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      <span className={`text-sm font-bold ${test.score >= 90 ? "text-emerald-400" : test.score >= 80 ? "text-sky-400" : "text-amber-400"}`}>{test.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{selectedModel.name} — Detail Scorecard</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Accuracy", value: selectedModel.accuracy, color: "bg-emerald-500" },
                { label: "Coherence", value: selectedModel.coherence, color: "bg-cyan-500" },
                { label: "Safety / Anti-Hallucination", value: Math.round((1 - selectedModel.hallucination / 10) * 100), color: "bg-purple-500" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{label}</span><span className="font-bold">{value}</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div>
                </div>
              ))}
              <div className="pt-2 border-t border-border space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Hallucination Rate</span><span className={selectedModel.hallucination <= 2 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{selectedModel.hallucination}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Avg Latency</span><span>{selectedModel.latency}s</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cost/1K tokens</span><span>{selectedModel.cost}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
