import { useState } from "react";
import { Mic, RefreshCw, CheckCircle, Star, Copy, Sparkles, Loader2 } from "lucide-react";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";

interface VoiceProfile {
  id: string;
  name: string;
  description: string;
  traits: string[];
  systemPrompt: string;
  color: string;
}

const brandVoices: VoiceProfile[] = [
  {
    id: "professional",
    name: "Professional Authority",
    description: "Confident, data-driven, industry leader tone",
    traits: ["Authoritative", "Data-backed", "Concise", "Trust-building"],
    systemPrompt: "You are a brand voice specialist. Rewrite the following content in a confident, authoritative, data-driven tone suited for C-suite and enterprise decision makers. Be concise, factual, and trust-building. Output only the rewritten text, no explanations.",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    id: "conversational",
    name: "Conversational Warm",
    description: "Approachable, friendly, human-centered voice",
    traits: ["Warm", "Relatable", "Encouraging", "Accessible"],
    systemPrompt: "You are a brand voice specialist. Rewrite the following content in a warm, approachable, human-centered tone. Make it feel genuine and friendly, like a knowledgeable colleague speaking directly to the reader. Output only the rewritten text, no explanations.",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    id: "bold",
    name: "Bold & Disruptive",
    description: "High-energy, direct, challenger brand voice",
    traits: ["Bold", "Direct", "Provocative", "Action-oriented"],
    systemPrompt: "You are a brand voice specialist. Rewrite the following content in a bold, disruptive, high-energy tone. Be direct, provocative, and action-oriented — like a challenger brand that does not accept the status quo. Output only the rewritten text, no explanations.",
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  },
  {
    id: "technical",
    name: "Technical Precision",
    description: "Detailed, accurate, expert-level terminology",
    traits: ["Precise", "Detailed", "Expert", "Methodical"],
    systemPrompt: "You are a brand voice specialist. Rewrite the following content with technical precision and expert-level detail. Use accurate terminology, provide specific technical depth, and write for an audience of engineers and technical architects. Output only the rewritten text, no explanations.",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
];

const DEFAULT_INPUT = "Our new feature helps teams work better together by sharing information more easily across departments.";

interface AiChatResponse {
  data?: { content?: string };
}

async function transformVoice(input: string, systemPrompt: string): Promise<string> {
  const res = await apiFetch<AiChatResponse>("/intelligence/ai/chat", {
    method: "POST",
    body: JSON.stringify({
      message: input,
      systemPrompt,
      maxTokens: 300,
    }),
  });
  const content = (res as Record<string, unknown>)?.content as string ?? (res as { data?: { content?: string } })?.data?.content;
  if (!content) throw new Error("No content returned");
  return content;
}

export default function BrandVoiceEngine() {
  const [selected, setSelected] = useState("professional");
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [copied, setCopied] = useState(false);
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentVoice = brandVoices.find(v => v.id === selected) ?? brandVoices[0]!;
  const currentOutput = outputs[selected] ?? "";

  const handleTransform = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await transformVoice(input, currentVoice.systemPrompt);
      setOutputs(prev => ({ ...prev, [selected]: result }));
    } catch (e) {
      setError("AI transformation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!input.trim()) return;
    setOutputs(prev => { const next = { ...prev }; delete next[selected]; return next; });
    await handleTransform();
  };

  const copyText = () => {
    if (!currentOutput) return;
    navigator.clipboard.writeText(currentOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Mic className="w-6 h-6 text-blue-400" />
          Brand Voice Engine
        </h1>
        <p className="text-sm text-slate-400 mt-1">Governed brand voice calibration — consistent tone across all generated content</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {brandVoices.map((voice) => (
          <button
            key={voice.id}
            onClick={() => setSelected(voice.id)}
            className={`text-left p-4 rounded-xl border transition-all hover:border-blue-400/20 ${selected === voice.id ? "border-blue-400/30 ring-1 ring-cyan-400/10 bg-blue-400/3" : "border-white/8 bg-[#0d1117]"}`}
          >
            <div className={`text-xs font-semibold mb-1.5 px-2 py-0.5 rounded-full inline-block border ${voice.color}`}>{voice.name}</div>
            <p className="text-[10px] text-slate-500">{voice.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {voice.traits.map(t => <span key={t} className="text-[10px] bg-white/5 px-1 py-0.5 rounded text-slate-500">{t}</span>)}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d1117] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8">
            <h3 className="text-sm font-semibold text-white">Input Content</h3>
          </div>
          <div className="p-4">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full h-40 bg-white/3 rounded-lg border border-white/8 p-3 text-sm text-slate-200 resize-none focus:outline-none focus:border-blue-500/30 placeholder:text-slate-600"
              placeholder="Enter your content to transform..."
            />
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleTransform}
                disabled={loading || !input.trim()}
                className="flex items-center gap-1.5 text-xs px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {loading ? "Transforming…" : "Transform Voice"}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={loading || !input.trim()}
                className="flex items-center gap-1.5 text-xs px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/8 transition-colors text-slate-400 disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#0d1117] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Generated — {currentVoice.name}</h3>
            <button onClick={copyText} disabled={!currentOutput} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40">
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="p-4">
            <div className="h-40 bg-white/3 rounded-lg border border-white/8 p-3 text-sm text-slate-200 overflow-y-auto">
              {loading ? (
                <div className="flex items-center gap-2 text-slate-500 h-full">
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating {currentVoice.name.toLowerCase()} voice…
                </div>
              ) : currentOutput ? (
                currentOutput
              ) : (
                <span className="text-slate-600">Click "Transform Voice" to generate content in the {currentVoice.name} style.</span>
              )}
            </div>
            {currentOutput && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= 4 ? "text-amber-400" : "text-slate-700"}`} />)}
                </div>
                <span className="text-xs text-slate-500">AI-generated content</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0d1117] border border-white/8 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8">
          <h3 className="text-sm font-semibold text-white">Voice Calibration Scores</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Tone Match", value: 94 }, { label: "Readability", value: 87 },
              { label: "Brand Alignment", value: 91 }, { label: "Clarity", value: 89 },
              { label: "Engagement", value: 82 }, { label: "SEO Fit", value: 78 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="relative w-12 h-12 mx-auto">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#4B8BDB" strokeWidth="3" strokeDasharray={`${value} ${100 - value}`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{value}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
