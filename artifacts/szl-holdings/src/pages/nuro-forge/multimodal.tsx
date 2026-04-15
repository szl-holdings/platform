import { useState } from "react";
import { m } from "framer-motion";
import { Image, FileText, Mic, Code2, Database, Zap, Upload, ChevronRight } from "lucide-react";

const MODALITIES = [
  { id: "text", name: "Text", icon: FileText, color: "#8b5cf6", models: ["Claude 4 Sonnet", "GPT-5.2", "Qwen3-8B"], p50: "142ms", requests: 84200, desc: "Natural language processing, summarization, analysis" },
  { id: "vision", name: "Vision", icon: Image, color: "#3b82f6", models: ["Gemini 2.5 Pro", "GPT-5.2 Vision", "Claude 4 Vision"], p50: "890ms", requests: 12400, desc: "Image analysis, document OCR, visual inspection" },
  { id: "audio", name: "Audio", icon: Mic, color: "#06b6d4", models: ["Whisper V4", "Gemini Audio", "Assembly AI"], p50: "1.2s", requests: 3200, desc: "Transcription, sentiment, speaker diarization" },
  { id: "code", name: "Code", icon: Code2, color: "#10b981", models: ["Claude 4 Sonnet", "GPT-5.2", "DeepSeek V3"], p50: "380ms", requests: 28600, desc: "Security review, generation, refactoring, testing" },
  { id: "structured", name: "Structured Data", icon: Database, color: "#d4a054", models: ["Mistral Large", "Qwen3-8B", "Phi-4 Mini"], p50: "95ms", requests: 45800, desc: "Schema analysis, SQL generation, data transformation" },
];

const RECENT_TASKS = [
  { input: "Maritime contract PDF", modality: "vision", output: "Risk assessment report", model: "Gemini 2.5 Pro", latency: "2.1s", status: "complete" },
  { input: "Board meeting audio", modality: "audio", output: "Transcript + action items", model: "Whisper V4", latency: "4.8s", status: "complete" },
  { input: "Python exploit scanner", modality: "code", output: "Security audit + patches", model: "Claude 4 Sonnet", latency: "1.2s", status: "complete" },
  { input: "Financial dataset (CSV)", modality: "structured", output: "Trend analysis + charts", model: "Mistral Large", latency: "340ms", status: "complete" },
  { input: "Property inspection photos", modality: "vision", output: "Condition report", model: "GPT-5.2 Vision", latency: "3.4s", status: "processing" },
  { input: "Legal brief (12 pages)", modality: "text", output: "Summary + risk flags", model: "Claude 4 Sonnet", latency: "890ms", status: "complete" },
];

export default function MultimodalHubPage() {
  const [selectedModality, setSelectedModality] = useState<typeof MODALITIES[0] | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "#070a10" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.2)" }}>
            <Image className="w-4 h-4" style={{ color: "#06b6d4" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>Multimodal Intelligence Hub</h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Text · Vision · Audio · Code · Structured Data</p>
          </div>
        </m.div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {MODALITIES.map((mod, i) => (
            <m.div key={mod.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedModality(mod)} className="rounded-lg p-4 cursor-pointer group"
              style={{ background: selectedModality?.id === mod.id ? `${mod.color}08` : "rgba(255,255,255,0.02)",
                border: `1px solid ${selectedModality?.id === mod.id ? `${mod.color}20` : "rgba(255,255,255,0.04)"}` }}>
              <mod.icon className="w-5 h-5 mb-2" style={{ color: mod.color }} />
              <div className="text-[12px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>{mod.name}</div>
              <div className="text-[10px] tabular-nums" style={{ color: mod.color }}>{mod.p50} p50</div>
              <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{mod.requests.toLocaleString()} requests</div>
            </m.div>
          ))}
        </div>

        {selectedModality && (
          <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg p-5 mb-6" style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${selectedModality.color}15` }}>
            <h2 className="text-sm font-bold mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>{selectedModality.name} Intelligence</h2>
            <p className="text-[11px] mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>{selectedModality.desc}</p>
            <div className="flex flex-wrap gap-2">
              {selectedModality.models.map(m => (
                <span key={m} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                  style={{ background: `${selectedModality.color}10`, color: selectedModality.color, border: `1px solid ${selectedModality.color}20` }}>{m}</span>
              ))}
            </div>
          </m.div>
        )}

        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <h2 className="text-[13px] font-semibold mb-4 flex items-center gap-2" style={{ color: "rgba(255,255,255,0.65)" }}>
            <Zap className="w-4 h-4" style={{ color: "#d4a054" }} />
            Recent Multimodal Tasks
          </h2>
          <div className="space-y-2">
            {RECENT_TASKS.map((task, i) => {
              const mod = MODALITIES.find(m => m.id === task.modality);
              return (
                <m.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-md" style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)" }}>
                  {mod && <mod.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: mod.color }} />}
                  <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{task.input}</span>
                  <ChevronRight className="w-3 h-3" style={{ color: "rgba(255,255,255,0.1)" }} />
                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{task.output}</span>
                  <span className="ml-auto text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{task.model}</span>
                  <span className="text-[10px] tabular-nums font-medium" style={{ color: mod?.color || "#d4a054" }}>{task.latency}</span>
                </m.div>
              );
            })}
          </div>
        </m.div>
      </div>
    </div>
  );
}
