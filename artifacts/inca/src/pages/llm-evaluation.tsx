import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { MessageSquare, Zap, AlertTriangle, CheckCircle, BarChart3, Brain } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

const models = [
  { name: "GPT-4o", provider: "OpenAI", accuracy: 91, coherence: 94, hallucination: 3.2, latency: 1.8, cost: "$0.008/1K", overall: 89 },
  { name: "Claude 3.5 Sonnet", provider: "Anthropic", accuracy: 93, coherence: 96, hallucination: 1.8, latency: 2.1, cost: "$0.009/1K", overall: 92 },
  { name: "LLaMA-3-70B (FT)", provider: "Internal", accuracy: 88, coherence: 89, hallucination: 4.1, latency: 0.9, cost: "$0.001/1K", overall: 84 },
  { name: "Gemini 1.5 Pro", provider: "Google", accuracy: 90, coherence: 92, hallucination: 2.9, latency: 2.4, cost: "$0.007/1K", overall: 87 },
];

const promptTests = [
  { prompt: "Summarize Q4 2025 earnings report", model: "Claude 3.5 Sonnet", score: 94, hallucination: false, tokens: 847, time: "2.1s" },
  { prompt: "Generate SQL for nested JOIN across 5 tables", model: "GPT-4o", score: 91, hallucination: false, tokens: 312, time: "1.4s" },
  { prompt: "Explain quantum entanglement to a 10-year-old", model: "LLaMA-3-70B (FT)", score: 82, hallucination: true, tokens: 445, time: "0.8s" },
  { prompt: "Analyze sentiment in customer feedback batch", model: "Gemini 1.5 Pro", score: 88, hallucination: false, tokens: 1204, time: "3.1s" },
];

const radarData = [
  { metric: "Accuracy", "GPT-4o": 91, "Claude 3.5": 93, "LLaMA (FT)": 88 },
  { metric: "Coherence", "GPT-4o": 94, "Claude 3.5": 96, "LLaMA (FT)": 89 },
  { metric: "Speed", "GPT-4o": 75, "Claude 3.5": 68, "LLaMA (FT)": 95 },
  { metric: "Cost Eff.", "GPT-4o": 72, "Claude 3.5": 68, "LLaMA (FT)": 99 },
  { metric: "Safety", "GPT-4o": 90, "Claude 3.5": 97, "LLaMA (FT)": 82 },
];

export default function LLMEvaluation() {
  const [selectedModel, setSelectedModel] = useState(models[1]);

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
                <p className={`text-xl font-bold ${model.overall >= 90 ? "text-emerald-400" : model.overall >= 85 ? "text-sky-400" : "text-amber-400"}`}>{model.overall}</p>
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
                { label: "Cost Efficiency", value: Math.round((1 - parseFloat(selectedModel.cost.replace(/[$\/1K]/g, "")) / 0.01) * 100), color: "bg-purple-500" },
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
