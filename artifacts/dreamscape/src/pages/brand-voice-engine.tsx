import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Mic, Sliders, RefreshCw, CheckCircle, Star, Copy, Sparkles } from "lucide-react";

const brandVoices = [
  { id: "professional", name: "Professional Authority", description: "Confident, data-driven, industry leader tone", traits: ["Authoritative", "Data-backed", "Concise", "Trust-building"], examples: ["Our analysis reveals a 47% efficiency gain...", "Industry benchmarks confirm..."], color: "text-blue-400 bg-blue-500/10" },
  { id: "conversational", name: "Conversational Warm", description: "Approachable, friendly, human-centered voice", traits: ["Warm", "Relatable", "Encouraging", "Accessible"], examples: ["Here's something exciting we found...", "You're going to love this feature..."], color: "text-emerald-400 bg-emerald-500/10" },
  { id: "bold", name: "Bold & Disruptive", description: "High-energy, direct, challenger brand voice", traits: ["Bold", "Direct", "Provocative", "Action-oriented"], examples: ["Stop settling for average performance.", "This changes everything."], color: "text-orange-400 bg-orange-500/10" },
  { id: "technical", name: "Technical Precision", description: "Detailed, accurate, expert-level terminology", traits: ["Precise", "Detailed", "Expert", "Methodical"], examples: ["Leveraging transformer-based architectures...", "The API endpoint accepts JSON payloads..."], color: "text-purple-400 bg-purple-500/10" },
];

const inputText = "Our new feature helps teams work better together by sharing information more easily across departments.";
const generatedVersions: Record<string, string> = {
  professional: "Cross-functional collaboration efficiency increases by 34% with our unified information architecture, enabling strategic alignment across all business units.",
  conversational: "We've made it super easy for your teams to stay in sync — no more hunting around for the info you need. Everything flows naturally between departments.",
  bold: "Silos are dead. Our platform obliterates information barriers so your teams can move at the speed your business demands.",
  technical: "Our distributed data synchronization layer implements real-time event streaming across departmental nodes, ensuring sub-100ms propagation latency with full audit trail compliance.",
};

export default function BrandVoiceEngine() {
  const [selected, setSelected] = useState("professional");
  const [input, setInput] = useState(inputText);
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(generatedVersions[selected]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mic className="w-6 h-6 text-primary" />
          Brand Voice Engine
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Maintain tone consistency across all generated content with AI-powered brand voice calibration</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {brandVoices.map((voice) => (
          <Card
            key={voice.id}
            onClick={() => setSelected(voice.id)}
            className={`cursor-pointer transition-all hover:border-primary/50 ${selected === voice.id ? "border-primary ring-1 ring-primary/20" : ""}`}
          >
            <CardContent className="p-4">
              <div className={`text-xs font-semibold mb-1.5 px-2 py-0.5 rounded-full inline-block ${voice.color}`}>{voice.name}</div>
              <p className="text-[10px] text-muted-foreground">{voice.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {voice.traits.map(t => <span key={t} className="text-[10px] bg-muted px-1 py-0.5 rounded">{t}</span>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Input Content</CardTitle></CardHeader>
          <CardContent>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full h-40 bg-muted rounded-lg border border-border p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter your content to transform..."
            />
            <div className="flex gap-2 mt-3">
              <button className="flex items-center gap-1.5 text-xs px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                <Sparkles className="w-3.5 h-3.5" /> Transform Voice
              </button>
              <button className="flex items-center gap-1.5 text-xs px-3 py-2 bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Generated — {brandVoices.find(v => v.id === selected)?.name}</CardTitle>
              <button onClick={copyText} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-muted/40 rounded-lg border border-border p-3 text-sm overflow-y-auto">
              {generatedVersions[selected]}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex">
                {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= 4 ? "text-amber-400" : "text-muted"}`} />)}
              </div>
              <span className="text-xs text-muted-foreground">Quality score: 4.2/5</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Voice Consistency Metrics</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Tone Match", value: 94 }, { label: "Readability", value: 87 },
              { label: "Brand Alignment", value: 91 }, { label: "Clarity", value: 89 },
              { label: "Engagement", value: 82 }, { label: "SEO Fit", value: 78 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="relative w-12 h-12 mx-auto">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#06b6d4" strokeWidth="3" strokeDasharray={`${value} ${100 - value}`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{value}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
