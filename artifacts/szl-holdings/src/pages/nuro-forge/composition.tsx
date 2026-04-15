import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { GitMerge, ArrowRight, Zap, Check, AlertTriangle, Play, RotateCcw, TrendingUp } from "lucide-react";

interface Pipeline {
  id: string; name: string; steps: { model: string; task: string; color: string }[];
  qualityScore: number; avgLatency: number; successRate: number; executions: number; status: "active" | "optimizing" | "draft";
}

const PIPELINES: Pipeline[] = [
  { id: "legal-risk", name: "Legal Contract Risk Analysis", steps: [
    { model: "Claude 4 Sonnet", task: "NLP Extraction", color: "#8b5cf6" },
    { model: "GPT-5.2", task: "Legal Reasoning", color: "#10b981" },
    { model: "Qwen3-8B", task: "Risk Scoring", color: "#06b6d4" },
    { model: "Claude 3.5 Haiku", task: "Summary Generation", color: "#f472b6" },
  ], qualityScore: 94.2, avgLatency: 3420, successRate: 99.1, executions: 1847, status: "active" },
  { id: "maritime-intel", name: "Maritime Intelligence Pipeline", steps: [
    { model: "Qwen3-8B", task: "AIS Data Parsing", color: "#06b6d4" },
    { model: "Gemini 2.5 Pro", task: "Route Analysis", color: "#3b82f6" },
    { model: "Llama 4 Scout", task: "Threat Assessment", color: "#f59e0b" },
    { model: "GPT-5.2", task: "Brief Generation", color: "#10b981" },
  ], qualityScore: 91.8, avgLatency: 2180, successRate: 98.7, executions: 923, status: "active" },
  { id: "deal-scoring", name: "Real Estate Deal Scoring", steps: [
    { model: "GPT-5.2", task: "Document Extraction", color: "#10b981" },
    { model: "Mistral Large", task: "Financial Modeling", color: "#d4a054" },
    { model: "Claude 4 Sonnet", task: "Comparable Analysis", color: "#8b5cf6" },
    { model: "Qwen3-8B", task: "Score Generation", color: "#06b6d4" },
  ], qualityScore: 89.6, avgLatency: 4100, successRate: 97.3, executions: 456, status: "active" },
  { id: "threat-hunt", name: "Autonomous Threat Hunting", steps: [
    { model: "Llama 4 Scout", task: "IOC Scanning", color: "#f59e0b" },
    { model: "Claude 4 Sonnet", task: "Pattern Correlation", color: "#8b5cf6" },
    { model: "DeepSeek V3", task: "Attack Chain Reasoning", color: "#ec4899" },
    { model: "GPT-5.2", task: "Response Recommendation", color: "#10b981" },
  ], qualityScore: 92.4, avgLatency: 2890, successRate: 99.5, executions: 2134, status: "active" },
  { id: "financial-brief", name: "Executive Financial Brief", steps: [
    { model: "Mistral Large", task: "Data Aggregation", color: "#d4a054" },
    { model: "GPT-5.2", task: "Trend Analysis", color: "#10b981" },
    { model: "Claude 4 Sonnet", task: "Narrative Generation", color: "#8b5cf6" },
  ], qualityScore: 87.3, avgLatency: 1560, successRate: 98.9, executions: 312, status: "optimizing" },
  { id: "compliance-check", name: "Regulatory Compliance Check", steps: [
    { model: "Claude 4 Sonnet", task: "Regulation Matching", color: "#8b5cf6" },
    { model: "GPT-5.2", task: "Gap Analysis", color: "#10b981" },
    { model: "Gemini 2.5 Pro", task: "Remediation Plan", color: "#3b82f6" },
  ], qualityScore: 95.1, avgLatency: 2740, successRate: 99.8, executions: 678, status: "active" },
  { id: "sentiment-intel", name: "Market Sentiment Intelligence", steps: [
    { model: "Qwen3-8B", task: "Feed Ingestion", color: "#06b6d4" },
    { model: "Grok 3", task: "Sentiment Analysis", color: "#a855f7" },
    { model: "GPT-5.2", task: "Signal Synthesis", color: "#10b981" },
  ], qualityScore: 86.7, avgLatency: 980, successRate: 97.6, executions: 1456, status: "active" },
  { id: "multimodal-report", name: "Multimodal Report Generator", steps: [
    { model: "Gemini 2.5 Pro", task: "Image + Text Fusion", color: "#3b82f6" },
    { model: "Claude 4 Sonnet", task: "Report Structuring", color: "#8b5cf6" },
    { model: "Phi-4 Mini", task: "Chart Generation", color: "#0ea5e9" },
  ], qualityScore: 83.9, avgLatency: 5200, successRate: 96.2, executions: 189, status: "draft" },
];

export default function ModelCompositionPage() {
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!selectedPipeline) return;
    const t = setInterval(() => setActiveStep(p => (p + 1) % selectedPipeline.steps.length), 2000);
    return () => clearInterval(t);
  }, [selectedPipeline]);

  return (
    <div className="min-h-screen" style={{ background: "#070a10" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <GitMerge className="w-4 h-4" style={{ color: "#8b5cf6" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>Autonomous Model Composition</h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{PIPELINES.length} pipelines · Self-optimizing chains</p>
          </div>
        </m.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 space-y-2">
            {PIPELINES.map((p, i) => (
              <m.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => { setSelectedPipeline(p); setActiveStep(0); }}
                className="rounded-lg p-3 cursor-pointer group"
                style={{ background: selectedPipeline?.id === p.id ? "rgba(139,92,246,0.06)" : "rgba(255,255,255,0.015)",
                  border: `1px solid ${selectedPipeline?.id === p.id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)"}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{p.name}</span>
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                    style={{ background: p.status === "active" ? "rgba(16,185,129,0.1)" : p.status === "optimizing" ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)",
                      color: p.status === "active" ? "#10b981" : p.status === "optimizing" ? "#f59e0b" : "rgba(255,255,255,0.3)" }}>{p.status}</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {p.steps.map((s, j) => (
                    <div key={j} className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: `${s.color}15` }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                      </div>
                      {j < p.steps.length - 1 && <ArrowRight className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.1)" }} />}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] tabular-nums" style={{ color: "#10b981" }}>{p.qualityScore}%</span>
                  <span className="text-[9px] tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>{p.avgLatency}ms</span>
                  <span className="text-[9px] tabular-nums" style={{ color: "rgba(255,255,255,0.2)" }}>{p.executions.toLocaleString()} runs</span>
                </div>
              </m.div>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedPipeline ? (
              <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg p-5" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <h2 className="text-sm font-bold mb-4" style={{ color: "rgba(255,255,255,0.85)" }}>{selectedPipeline.name}</h2>

                <div className="space-y-3 mb-6">
                  {selectedPipeline.steps.map((step, i) => (
                    <m.div key={i} className="flex items-center gap-4 px-4 py-3 rounded-lg"
                      animate={{ background: i === activeStep ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)",
                        borderColor: i === activeStep ? `${step.color}30` : "rgba(255,255,255,0.03)" }}
                      style={{ border: "1px solid rgba(255,255,255,0.03)" }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: `${step.color}15`, color: step.color }}>{i + 1}</div>
                      <div className="flex-1">
                        <div className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{step.task}</div>
                        <div className="text-[10px]" style={{ color: step.color }}>{step.model}</div>
                      </div>
                      {i === activeStep && (
                        <m.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                          <Zap className="w-3.5 h-3.5" style={{ color: step.color }} />
                        </m.div>
                      )}
                      {i < activeStep && <Check className="w-3.5 h-3.5" style={{ color: "#10b981" }} />}
                    </m.div>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Quality", value: `${selectedPipeline.qualityScore}%`, color: "#10b981" },
                    { label: "Latency", value: `${selectedPipeline.avgLatency}ms`, color: "#06b6d4" },
                    { label: "Success Rate", value: `${selectedPipeline.successRate}%`, color: "#8b5cf6" },
                    { label: "Executions", value: selectedPipeline.executions.toLocaleString(), color: "#f59e0b" },
                  ].map(s => (
                    <div key={s.label} className="text-center rounded-md p-2.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div className="text-sm font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </m.div>
            ) : (
              <div className="rounded-lg p-12 text-center" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <GitMerge className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>Select a pipeline to view composition details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
