import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Volume2, Mic, Play, Pause, Download, Sliders, Music, Clock } from "lucide-react";

const voices = [
  { id: "aria", name: "Aria", gender: "Female", accent: "American", style: "Professional", sample: "Warm and authoritative with a clear, trustworthy tone", color: "text-pink-400" },
  { id: "marcus", name: "Marcus", gender: "Male", accent: "British", style: "Executive", sample: "Deep, confident voice with strong presence", color: "text-blue-400" },
  { id: "nova", name: "Nova", gender: "Female", accent: "Australian", style: "Conversational", sample: "Friendly, energetic tone perfect for brand content", color: "text-emerald-400" },
  { id: "titan", name: "Titan", gender: "Male", accent: "American", style: "Bold", sample: "Powerful, commanding voice for high-impact messaging", color: "text-orange-400" },
  { id: "sage", name: "Sage", gender: "Neutral", accent: "American", style: "Calm", sample: "Measured, thoughtful pace with neutral, approachable tone", color: "text-purple-400" },
  { id: "elara", name: "Elara", gender: "Female", accent: "French", style: "Sophisticated", sample: "Elegant, refined tone with subtle warmth", color: "text-cyan-400" },
];

const recentProductions = [
  { name: "Q1 Earnings Call Script", voice: "Marcus", duration: "4:32", status: "Completed", date: "Mar 28" },
  { name: "Product Launch Announcement", voice: "Aria", duration: "1:15", status: "Completed", date: "Mar 27" },
  { name: "Company Culture Video VO", voice: "Nova", duration: "3:08", status: "Processing", date: "Mar 30" },
  { name: "Ad Campaign — Tech Audience", voice: "Titan", duration: "0:30", status: "Completed", date: "Mar 26" },
];

const sampleScript = "Welcome to our platform — the future of enterprise intelligence. In today's rapidly evolving landscape, organizations need tools that not only keep pace with change, but anticipate it. That's exactly what we've built for you.";

export default function VoiceStudio() {
  const [selectedVoice, setSelectedVoice] = useState("aria");
  const [script, setScript] = useState(sampleScript);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Volume2 className="w-6 h-6 text-primary" />
          Voice Generation Studio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Multi-voice generation with script-to-audio pipeline — professional production quality</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {voices.map((voice) => (
          <Card
            key={voice.id}
            onClick={() => setSelectedVoice(voice.id)}
            className={`cursor-pointer transition-all hover:border-primary/50 ${selectedVoice === voice.id ? "border-primary ring-1 ring-primary/20" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-muted`}>
                  <Mic className={`w-4 h-4 ${voice.color}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${voice.color}`}>{voice.name}</p>
                  <p className="text-[10px] text-muted-foreground">{voice.gender} · {voice.accent} · {voice.style}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">{voice.sample}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Script Editor</CardTitle></CardHeader>
            <CardContent>
              <textarea
                value={script}
                onChange={e => setScript(e.target.value)}
                className="w-full h-36 bg-muted rounded-lg border border-border p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter your script here..."
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{script.split(" ").length} words</span>
                  <span>Est. {Math.ceil(script.split(" ").length / 130 * 60)}s at normal speed</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPlaying(!playing)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {playing ? "Pause" : "Generate & Play"}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs px-3 py-2 bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors">
                    <Download className="w-3.5 h-3.5" /> Export MP3
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Voice Controls</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Speed</span><span>{speed.toFixed(1)}x</span></div>
                <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Pitch</span><span>{pitch > 0 ? "+" : ""}{pitch}</span></div>
                <input type="range" min="-10" max="10" step="1" value={pitch} onChange={e => setPitch(parseInt(e.target.value))} className="w-full" />
              </div>
              <div className="flex gap-2">
                {["Natural", "Studio", "Podcast", "Broadcast"].map(style => (
                  <button key={style} className="text-[10px] px-2 py-1 rounded border border-border hover:bg-muted transition-colors">{style}</button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Productions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {recentProductions.map((p) => (
                <div key={p.name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                  <div className="flex items-start gap-2 min-w-0">
                    <Music className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.voice} · {p.duration} · {p.date}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ml-2 ${p.status === "Completed" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>{p.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
