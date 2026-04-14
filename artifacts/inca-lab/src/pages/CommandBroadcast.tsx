import { useState, useEffect, useCallback } from "react";
import {
  Radio, Users, Clock, Play, StopCircle, Plus, RefreshCw, ChevronDown, ChevronUp,
  AlertCircle, MessageSquare, Search, BarChart2, FileText, Eye, Activity,
  TrendingUp, Zap, BookOpen, Star, Mic
} from "lucide-react";
import { cn } from "../lib/utils";

const BASE_URL = import.meta.env.BASE_URL ?? "/inca-lab/";
const API_BASE = BASE_URL.replace(/\/$/, "").replace(/\/inca-lab$/, "") || "";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  return data;
}

type Tab = "streams" | "live" | "reports" | "transcripts";
type StreamStatus = "scheduled" | "live" | "ended" | "archived";
type SentimentType = "positive" | "neutral" | "negative" | "mixed";

const STATUS_STYLES: Record<StreamStatus, { color: string; bg: string; label: string; dot: string }> = {
  scheduled: { color: "text-blue-400", bg: "bg-blue-400/10", label: "Scheduled", dot: "bg-blue-400" },
  live: { color: "text-red-400", bg: "bg-red-400/10", label: "LIVE", dot: "bg-red-400" },
  ended: { color: "text-muted-foreground", bg: "bg-secondary", label: "Ended", dot: "bg-muted-foreground/50" },
  archived: { color: "text-muted-foreground", bg: "bg-secondary/50", label: "Archived", dot: "bg-muted-foreground/30" },
};

const SENTIMENT_COLORS: Record<SentimentType, string> = {
  positive: "text-green-400",
  neutral: "text-muted-foreground",
  negative: "text-red-400",
  mixed: "text-amber-400",
};

const DOMAIN_LABELS: Record<string, string> = {
  legal: "Legal", defense: "Defense", maritime: "Maritime", general: "General", medical: "Medical", finance: "Finance",
};

function fmtDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
}

export function CommandBroadcast() {
  const [tab, setTab] = useState<Tab>("streams");
  const [streams, setStreams] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [streamReport, setStreamReport] = useState<any>(null);
  const [streamHighlights, setStreamHighlights] = useState<any[]>([]);
  const [streamCaptions, setStreamCaptions] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedHighlight, setExpandedHighlight] = useState<number | null>(null);

  const [showStreamForm, setShowStreamForm] = useState(false);
  const [streamForm, setStreamForm] = useState({ title: "", description: "", hostName: "", domainVocabulary: "general", scheduledAt: "" });
  const [startingStream, setStartingStream] = useState<number | null>(null);
  const [endingStream, setEndingStream] = useState<number | null>(null);

  const loadStreams = useCallback(async () => {
    setLoading(true);
    try {
      const [streamsRes, dashRes] = await Promise.all([
        apiFetch("/command-broadcast/streams"),
        apiFetch("/command-broadcast/dashboard"),
      ]);
      if (streamsRes.data?.streams) setStreams(streamsRes.data.streams);
      if (dashRes.data?.dashboard) setDashboard(dashRes.data.dashboard);
    } catch { setError("Failed to load streams"); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStreams(); }, [loadStreams]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (streams.some(s => s.status === "live")) loadStreams();
    }, 10000);
    return () => clearInterval(interval);
  }, [streams, loadStreams]);

  async function loadStreamDetails(streamId: number) {
    try {
      const [reportRes, captionsRes, highlightsRes, heatmapRes] = await Promise.all([
        apiFetch(`/command-broadcast/streams/${streamId}/report`),
        apiFetch(`/command-broadcast/streams/${streamId}/captions`),
        apiFetch(`/command-broadcast/streams/${streamId}/highlights`),
        apiFetch(`/command-broadcast/streams/${streamId}/heatmap`),
      ]);
      if (reportRes.data?.report) setStreamReport(reportRes.data.report);
      if (captionsRes.data?.captions) setStreamCaptions(captionsRes.data.captions);
      if (highlightsRes.data?.highlights) setStreamHighlights(highlightsRes.data.highlights);
      if (heatmapRes.data?.heatmap) setHeatmap(heatmapRes.data.heatmap);
    } catch { setError("Failed to load stream details"); }
  }

  async function selectStream(stream: any) {
    setSelectedStream(stream);
    setStreamReport(null);
    setStreamCaptions([]);
    setStreamHighlights([]);
    setHeatmap([]);
    setSearchResults([]);
    setSearchQuery("");
    setTab("reports");
    if (stream.status === "ended" || stream.status === "archived") {
      await loadStreamDetails(stream.id);
    }
  }

  async function createStream() {
    try {
      await apiFetch("/command-broadcast/streams", {
        method: "POST",
        body: JSON.stringify({ title: streamForm.title, description: streamForm.description, hostName: streamForm.hostName, domainVocabulary: streamForm.domainVocabulary, scheduledAt: streamForm.scheduledAt || undefined }),
      });
      setShowStreamForm(false);
      setStreamForm({ title: "", description: "", hostName: "", domainVocabulary: "general", scheduledAt: "" });
      loadStreams();
    } catch { setError("Failed to create stream"); }
  }

  async function startStream(streamId: number) {
    setStartingStream(streamId);
    try {
      await apiFetch(`/command-broadcast/streams/${streamId}/start`, { method: "POST" });
      loadStreams();
    } catch { setError("Failed to start stream"); } finally { setStartingStream(null); }
  }

  async function endStream(streamId: number) {
    setEndingStream(streamId);
    try {
      await apiFetch(`/command-broadcast/streams/${streamId}/end`, { method: "POST" });
      await loadStreams();
      const updatedStream = streams.find(s => s.id === streamId);
      if (updatedStream) await selectStream({ ...updatedStream, status: "ended" });
    } catch { setError("Failed to end stream"); } finally { setEndingStream(null); }
  }

  async function searchTranscript() {
    if (!selectedStream || !searchQuery.trim()) return;
    try {
      const res = await apiFetch(`/command-broadcast/streams/${selectedStream.id}/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.data?.results) setSearchResults(res.data.results);
    } catch { setError("Search failed"); }
  }

  const liveStreams = streams.filter(s => s.status === "live");
  const scheduledStreams = streams.filter(s => s.status === "scheduled");
  const endedStreams = streams.filter(s => s.status === "ended");

  function AttentionHeatmapViz({ data }: { data: any[] }) {
    if (!data.length) return <div className="text-xs text-muted-foreground p-4 text-center">No heatmap data available.</div>;
    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground mb-1">Attention score over time (green = high attention)</div>
        <div className="flex gap-0.5 items-end" style={{ height: "60px" }}>
          {data.map((point, i) => {
            const h = Math.max(4, Math.round(point.attentionScore * 60));
            const color = point.attentionScore > 0.7 ? "#22c55e" : point.attentionScore > 0.4 ? "#f59e0b" : "#ef4444";
            return <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${h}px`, backgroundColor: color, opacity: 0.8 }} title={`${Math.round(point.attentionScore * 100)}% @ ${Math.floor(point.timestampSeconds / 60)}m`} />;
          })}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>0:00</span>
          <span>{fmtDuration(data[data.length - 1]?.timestampSeconds ?? 0)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <Radio className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-foreground">Command Broadcast</h1>
            <p className="text-xs text-muted-foreground">AI-Intelligent Internal Streaming Command Center</p>
          </div>
          {liveStreams.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs text-red-400 font-medium">{liveStreams.length} Live</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">dismiss</button>
        </div>
      )}

      <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit flex-wrap">
        {(["streams", "live", "reports", "transcripts"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize", tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t}
            {t === "live" && liveStreams.length > 0 && <span className="ml-1.5 bg-red-500/20 text-red-400 text-xs px-1 rounded animate-pulse">{liveStreams.length}</span>}
          </button>
        ))}
        <button onClick={loadStreams} disabled={loading} className="ml-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {tab === "streams" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {dashboard && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground"><span className="text-foreground font-medium">{dashboard.streams?.total ?? 0}</span> total streams</div>
                <div className="text-sm text-muted-foreground"><span className="text-foreground font-medium">{dashboard.streams?.ended ?? 0}</span> completed</div>
                <div className="text-sm text-muted-foreground"><span className="text-foreground font-medium">{dashboard.captions ?? 0}</span> caption segments</div>
              </div>
            )}
            <button onClick={() => setShowStreamForm(!showStreamForm)} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Schedule Broadcast
            </button>
          </div>

          {showStreamForm && (
            <div className="inca-panel p-4 border border-primary/20">
              <div className="text-sm font-medium text-foreground mb-3">Schedule New Broadcast</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                  <input value={streamForm.title} onChange={e => setStreamForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="e.g. Q2 Intelligence Briefing" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Host Name</label>
                  <input value={streamForm.hostName} onChange={e => setStreamForm(f => ({ ...f, hostName: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="e.g. Commander Sarah Chen" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Domain AI Vocabulary</label>
                  <select value={streamForm.domainVocabulary} onChange={e => setStreamForm(f => ({ ...f, domainVocabulary: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                    {Object.entries(DOMAIN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Scheduled At (optional)</label>
                  <input type="datetime-local" value={streamForm.scheduledAt} onChange={e => setStreamForm(f => ({ ...f, scheduledAt: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <input value={streamForm.description} onChange={e => setStreamForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="Optional description..." />
              </div>
              <div className="flex gap-2">
                <button onClick={createStream} disabled={!streamForm.title} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">Schedule Broadcast</button>
                <button onClick={() => setShowStreamForm(false)} className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm font-medium hover:text-foreground transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {liveStreams.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">LIVE NOW</div>
              {liveStreams.map(s => (
                <div key={s.id} className="inca-panel p-4 border-red-500/25 border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0 relative">
                      <Radio className="w-4 h-4 text-red-400" />
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.hostName} · {DOMAIN_LABELS[s.domainVocabulary]} · {s.viewerCount} viewers</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => selectStream(s)} className="px-3 py-1.5 bg-secondary text-sm text-foreground rounded-lg hover:bg-secondary/80 transition-colors">View</button>
                      <button onClick={() => endStream(s.id)} disabled={endingStream === s.id} className="px-3 py-1.5 bg-red-500/15 border border-red-500/25 text-red-400 text-sm rounded-lg hover:bg-red-500/25 transition-colors disabled:opacity-50">
                        {endingStream === s.id ? "Ending..." : "End Stream"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {scheduledStreams.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">SCHEDULED</div>
              <div className="space-y-2">
                {scheduledStreams.map(s => (
                  <div key={s.id} className="inca-panel p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-foreground">{s.title}</div>
                        <div className="text-xs text-muted-foreground">{s.hostName} · {DOMAIN_LABELS[s.domainVocabulary]}{s.scheduledAt ? ` · ${new Date(s.scheduledAt).toLocaleString()}` : ""}</div>
                      </div>
                      <button onClick={() => startStream(s.id)} disabled={startingStream === s.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/15 border border-green-500/25 text-green-400 text-sm rounded-lg hover:bg-green-500/25 transition-colors disabled:opacity-50">
                        <Play className="w-3.5 h-3.5" />
                        {startingStream === s.id ? "Starting..." : "Go Live"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endedStreams.length > 0 && (
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">COMPLETED BROADCASTS</div>
              <div className="space-y-2">
                {endedStreams.map(s => (
                  <div key={s.id} className="inca-panel p-4 cursor-pointer hover:border-primary/20 transition-all" onClick={() => selectStream(s)}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-foreground">{s.title}</div>
                        <div className="text-xs text-muted-foreground">{s.hostName} · {DOMAIN_LABELS[s.domainVocabulary]} · {s.durationSeconds ? fmtDuration(s.durationSeconds) : "—"} · {s.peakViewerCount} peak viewers</div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        View Report <ChevronDown className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {streams.length === 0 && !showStreamForm && (
            <div className="inca-panel p-8 text-center text-muted-foreground text-sm">No broadcasts yet. Schedule your first command broadcast to begin.</div>
          )}
        </div>
      )}

      {tab === "live" && (
        <div className="space-y-4">
          {liveStreams.length > 0 ? liveStreams.map(s => (
            <div key={s.id} className="inca-panel p-5 border-red-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <div className="font-medium text-foreground">{s.title}</div>
                <span className="text-xs text-red-400">{s.viewerCount} watching</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Peak Viewers</div>
                  <div className="text-xl font-semibold text-foreground">{s.peakViewerCount}</div>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Domain</div>
                  <div className="text-xl font-semibold text-foreground capitalize">{DOMAIN_LABELS[s.domainVocabulary]}</div>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Host</div>
                  <div className="text-sm font-semibold text-foreground truncate">{s.hostName}</div>
                </div>
              </div>
            </div>
          )) : (
            <div className="inca-panel p-8 text-center">
              <Radio className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-muted-foreground text-sm">No broadcasts currently live.</div>
              <div className="text-xs text-muted-foreground mt-1">Go to Streams tab to schedule or start a broadcast.</div>
            </div>
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-4">
          {!selectedStream ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-3">Select a completed broadcast to view its AI-generated intelligence report:</div>
              {endedStreams.map(s => (
                <button key={s.id} onClick={() => selectStream(s)} className="w-full inca-panel p-4 text-left hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm text-foreground">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{fmtDuration(s.durationSeconds ?? 0)} · {s.peakViewerCount} peak viewers · {DOMAIN_LABELS[s.domainVocabulary]}</div>
                    </div>
                  </div>
                </button>
              ))}
              {endedStreams.length === 0 && <div className="inca-panel p-8 text-center text-muted-foreground text-sm">No completed broadcasts yet. Start and end a broadcast to generate an AI intelligence report.</div>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => { setSelectedStream(null); setStreamReport(null); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← All Broadcasts</button>
                <div className="font-medium text-foreground">{selectedStream.title}</div>
                <span className="text-xs text-muted-foreground">{DOMAIN_LABELS[selectedStream.domainVocabulary]}</span>
              </div>

              {streamReport ? (
                <div className="space-y-4">
                  <div className="inca-panel p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <div className="text-sm font-medium text-foreground">Executive Summary</div>
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{streamReport.executiveSummary}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="inca-panel p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-amber-400" />
                        <div className="text-sm font-medium text-foreground">Key Decisions</div>
                      </div>
                      <div className="space-y-2">
                        {streamReport.keyDecisions.map((d: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <div className="w-4 h-4 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-[10px] font-bold text-amber-400">{i + 1}</span>
                            </div>
                            <span className="text-foreground">{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="inca-panel p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <div className="text-sm font-medium text-foreground">Action Items</div>
                      </div>
                      <div className="space-y-2">
                        {streamReport.actionItems.map((a: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <div className="w-4 h-4 rounded flex-shrink-0 mt-0.5 border border-blue-400/40 bg-blue-400/10" />
                            <span className="text-foreground">{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Total Viewers", value: streamReport.audienceStats.totalViewers },
                      { label: "Avg Watch Time", value: fmtDuration(streamReport.audienceStats.avgWatchTime) },
                      { label: "Peak Concurrent", value: streamReport.audienceStats.peakConcurrent },
                      { label: "Avg Attention", value: `${(streamReport.audienceStats.avgAttentionScore * 100).toFixed(0)}%` },
                    ].map(c => (
                      <div key={c.label} className="inca-panel p-3 text-center">
                        <div className="text-xs text-muted-foreground">{c.label}</div>
                        <div className="text-lg font-semibold text-foreground mt-1">{c.value}</div>
                      </div>
                    ))}
                  </div>

                  {heatmap.length > 0 && (
                    <div className="inca-panel p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-primary" />
                        <div className="text-sm font-medium text-foreground">Audience Attention Heatmap</div>
                      </div>
                      <AttentionHeatmapViz data={heatmap} />
                    </div>
                  )}

                  {streamReport.highlights.length > 0 && (
                    <div className="inca-panel p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <div className="text-sm font-medium text-foreground">AI-Detected Highlights</div>
                      </div>
                      <div className="space-y-2">
                        {streamReport.highlights.map((h: any) => (
                          <div key={h.id} className="p-3 bg-secondary rounded-lg cursor-pointer" onClick={() => setExpandedHighlight(expandedHighlight === h.id ? null : h.id)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize">{h.type.replace("_", " ")}</div>
                                <div className="text-sm text-foreground">{h.title}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{fmtDuration(Math.floor(h.startMs / 1000))}</span>
                                <div className="w-8 h-1.5 bg-background rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${h.engagementScore * 100}%` }} />
                                </div>
                              </div>
                            </div>
                            {expandedHighlight === h.id && <div className="text-xs text-muted-foreground mt-2 leading-relaxed">{h.aiSummary}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="inca-panel p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-primary" />
                      <div className="text-sm font-medium text-foreground">Sentiment Timeline</div>
                    </div>
                    <div className="flex gap-1 items-center">
                      {streamReport.sentimentTimeline.map((point: any, i: number) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className={cn("text-xs font-medium", SENTIMENT_COLORS[point.sentiment as SentimentType] || "text-muted-foreground")}>
                            {point.sentiment === "positive" ? "+" : point.sentiment === "negative" ? "-" : "~"}
                          </div>
                          <div className="w-full h-6 rounded-sm flex items-center justify-center" style={{
                            backgroundColor: point.sentiment === "positive" ? "rgba(34,197,94,0.15)" : point.sentiment === "negative" ? "rgba(239,68,68,0.15)" : "rgba(148,163,184,0.1)"
                          }}>
                            <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="inca-panel p-8 text-center">
                  <RefreshCw className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2 animate-spin" />
                  <div className="text-muted-foreground text-sm">Loading broadcast report...</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "transcripts" && (
        <div className="space-y-4">
          {!selectedStream ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-3">Select a broadcast to search its transcript:</div>
              {endedStreams.map(s => (
                <button key={s.id} onClick={() => selectStream(s)} className="w-full inca-panel p-4 text-left hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm text-foreground">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.hostName} · {DOMAIN_LABELS[s.domainVocabulary]}</div>
                    </div>
                  </div>
                </button>
              ))}
              {endedStreams.length === 0 && <div className="inca-panel p-8 text-center text-muted-foreground text-sm">No completed broadcasts. Transcripts are generated automatically during live broadcasts.</div>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button onClick={() => { setSelectedStream(null); setStreamCaptions([]); setSearchResults([]); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← All Broadcasts</button>
                <div className="font-medium text-foreground">{selectedStream.title}</div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && searchTranscript()}
                    className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40"
                    placeholder={`Search transcript for domain terms, decisions, action items...`}
                  />
                </div>
                <button onClick={searchTranscript} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Search</button>
              </div>

              {searchResults.length > 0 && (
                <div className="inca-panel overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <div className="text-sm font-medium text-foreground">{searchResults.length} matches for "{searchQuery}"</div>
                  </div>
                  <div className="divide-y divide-border/50">
                    {searchResults.map(r => (
                      <div key={r.id} className="px-3 py-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">{Math.floor(r.startMs / 60000)}:{String(Math.floor((r.startMs % 60000) / 1000)).padStart(2, "0")}</span>
                          {r.domainTermsDetected.length > 0 && r.domainTermsDetected.map((t: string) => (
                            <span key={t} className="text-xs px-1 py-0.5 rounded bg-primary/10 text-primary">{t}</span>
                          ))}
                        </div>
                        <div className="text-sm text-foreground">{r.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="inca-panel overflow-hidden">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">Full Transcript</div>
                  <div className="text-xs text-muted-foreground">{streamCaptions.length} segments</div>
                </div>
                <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
                  {streamCaptions.map(c => (
                    <div key={c.id} className="px-3 py-2.5 flex gap-3">
                      <div className="text-xs text-muted-foreground flex-shrink-0 w-16 pt-0.5">{Math.floor(c.startMs / 60000)}:{String(Math.floor((c.startMs % 60000) / 1000)).padStart(2, "0")}</div>
                      <div className="flex-1">
                        <div className="text-sm text-foreground">{c.text}</div>
                        {c.domainTermsDetected.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {c.domainTermsDetected.map((t: string) => (
                              <span key={t} className="text-xs px-1 py-0.5 rounded bg-primary/10 text-primary">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0 pt-0.5">{(c.confidence * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                  {streamCaptions.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">No transcript available yet.</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
