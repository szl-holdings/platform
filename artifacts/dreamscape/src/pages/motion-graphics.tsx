import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { Film, Play, Layers, Smartphone, Monitor, Square, Download, Sparkles, Clock } from "lucide-react";

const formats = [
  { id: "reels", name: "Instagram Reels", dims: "1080×1920", duration: "15s / 30s / 60s", icon: "📱", ratio: "9:16" },
  { id: "stories", name: "Stories", dims: "1080×1920", duration: "15s", icon: "⭕", ratio: "9:16" },
  { id: "shorts", name: "YouTube Shorts", dims: "1080×1920", duration: "60s max", icon: "▶️", ratio: "9:16" },
  { id: "feed", name: "Square Feed Post", dims: "1080×1080", duration: "60s max", icon: "⬛", ratio: "1:1" },
  { id: "landscape", name: "Landscape Video", dims: "1920×1080", duration: "No limit", icon: "🖥️", ratio: "16:9" },
  { id: "twitter", name: "X/Twitter Video", dims: "1280×720", duration: "2:20 max", icon: "🐦", ratio: "16:9" },
];

const templates = [
  { name: "Product Launch Countdown", format: "Reels", category: "Marketing", preview: "🚀", duration: "30s", style: "Bold & Dynamic" },
  { name: "Stats & Data Reveal", format: "Feed", category: "Brand", preview: "📊", duration: "15s", style: "Clean Corporate" },
  { name: "Customer Testimonial", format: "Stories", category: "Social Proof", preview: "💬", duration: "15s", style: "Warm & Human" },
  { name: "Feature Showcase", format: "Shorts", category: "Product", preview: "✨", duration: "60s", style: "Tech Modern" },
  { name: "Brand Story Arc", format: "Landscape", category: "Campaign", preview: "🎬", duration: "90s", style: "Cinematic" },
  { name: "Event Promotion", format: "Reels", category: "Events", preview: "🎉", duration: "15s", style: "Energetic" },
];

const recentExports = [
  { name: "Q1 Product Launch Reel", format: "Reels", status: "Completed", size: "24.3 MB", date: "Mar 30" },
  { name: "Brand Story — Homepage Hero", format: "Landscape", status: "Processing", size: "—", date: "Mar 30" },
  { name: "April Campaign — Stories Pack", format: "Stories", status: "Completed", size: "18.7 MB", date: "Mar 29" },
  { name: "SZL Holdings Overview", format: "Landscape", status: "Completed", size: "42.1 MB", date: "Mar 28" },
];

export default function MotionGraphics() {
  const [selectedFormat, setSelectedFormat] = useState("reels");
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Film className="w-6 h-6 text-primary" />
          Motion Graphics Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Motion graphics for every format — Reels, Stories, Shorts, and broadcast-quality video</p>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {formats.map((f) => (
          <Card key={f.id} onClick={() => setSelectedFormat(f.id)} className={`cursor-pointer transition-all hover:border-primary/50 ${selectedFormat === f.id ? "border-primary ring-1 ring-primary/20" : ""}`}>
            <CardContent className="p-3 text-center">
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="text-xs font-semibold">{f.name}</p>
              <p className="text-[10px] text-muted-foreground">{f.ratio}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Template Library — {formats.find(f => f.id === selectedFormat)?.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.map((t, i) => (
                  <div
                    key={t.name}
                    onClick={() => setSelectedTemplate(i)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 ${selectedTemplate === i ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div className="text-3xl text-center mb-2">{t.preview}</div>
                    <p className="text-xs font-semibold text-center">{t.name}</p>
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      <Badge variant="outline" className="text-[10px]">{t.duration}</Badge>
                      <Badge variant="outline" className="text-[10px]">{t.style}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex items-center gap-1.5 text-xs px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <Sparkles className="w-3.5 h-3.5" /> Generate Motion Graphic
                </button>
                <button className="flex items-center gap-1.5 text-xs px-3 py-2 bg-muted border border-border rounded-lg hover:bg-muted/80 transition-colors">
                  <Layers className="w-3.5 h-3.5" /> Customize Template
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Format Specs</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(() => {
                const f = formats.find(fm => fm.id === selectedFormat)!;
                return [
                  { label: "Dimensions", value: f.dims },
                  { label: "Aspect Ratio", value: f.ratio },
                  { label: "Max Duration", value: f.duration },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Exports</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {recentExports.map((e) => (
                <div key={e.name} className="p-2.5 rounded-lg bg-muted/40">
                  <p className="text-xs font-medium truncate">{e.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                      <span>{e.format}</span>
                      <span>{e.date}</span>
                      {e.size !== "—" && <span>{e.size}</span>}
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${e.status === "Completed" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>{e.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
