import { useState, useEffect, useCallback } from "react";
import {
  Music, BarChart2, TrendingUp, AlertTriangle, FileText, Shield, Plus, RefreshCw,
  ChevronDown, ChevronUp, AlertCircle, DollarSign, Activity, Eye, CheckCircle2,
  XCircle, Clock, Globe, Search, ChevronRight, Waves
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

type Tab = "overview" | "catalog" | "royalties" | "anomalies" | "forecasts" | "fingerprints" | "disputes";

const PLATFORM_COLORS: Record<string, string> = {
  spotify: "#1db954",
  apple_music: "#fc3c44",
  youtube: "#ff0000",
  tiktok: "#69c9d0",
  amazon_music: "#00a8e1",
  deezer: "#a238ff",
  pandora: "#224099",
};

const DISPUTE_STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  open: { color: "text-amber-400", bg: "bg-amber-400/10", label: "Open" },
  submitted: { color: "text-blue-400", bg: "bg-blue-400/10", label: "Submitted" },
  under_review: { color: "text-purple-400", bg: "bg-purple-400/10", label: "Under Review" },
  resolved: { color: "text-green-400", bg: "bg-green-400/10", label: "Resolved" },
  dismissed: { color: "text-muted-foreground", bg: "bg-secondary", label: "Dismissed" },
};

function fmtUsd(v: number) { return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtPct(v: number) { return `${(v * 100).toFixed(1)}%`; }

export function SoundSovereign() {
  const [tab, setTab] = useState<Tab>("overview");
  const [dashboard, setDashboard] = useState<any>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [royalties, setRoyalties] = useState<any>(null);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [fingerprints, setFingerprints] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTrack, setExpandedTrack] = useState<number | null>(null);
  const [expandedDispute, setExpandedDispute] = useState<number | null>(null);
  const [selectedTrackForForecast, setSelectedTrackForForecast] = useState<number | null>(null);
  const [forecastHorizon, setForecastHorizon] = useState<"30d" | "90d" | "1y">("90d");
  const [generateForecastLoading, setGenerateForecastLoading] = useState(false);

  const [showArtistForm, setShowArtistForm] = useState(false);
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [artistForm, setArtistForm] = useState({ name: "", bio: "", genres: "" });
  const [trackForm, setTrackForm] = useState({ title: "", artistId: "", isrc: "", duration: "" });
  const [disputeForm, setDisputeForm] = useState({ trackId: "", platform: "spotify", description: "", claimAmount: "" });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, artistsRes, tracksRes, royaltiesRes, fingerprintsRes, disputesRes] = await Promise.all([
        apiFetch("/sound-sovereign/dashboard"),
        apiFetch("/sound-sovereign/artists"),
        apiFetch("/sound-sovereign/tracks"),
        apiFetch("/sound-sovereign/royalties?limit=100"),
        apiFetch("/sound-sovereign/fingerprints"),
        apiFetch("/sound-sovereign/disputes"),
      ]);
      if (dashRes.data?.dashboard) setDashboard(dashRes.data.dashboard);
      if (artistsRes.data?.artists) setArtists(artistsRes.data.artists);
      if (tracksRes.data?.tracks) setTracks(tracksRes.data.tracks);
      if (royaltiesRes.data) setRoyalties(royaltiesRes.data);
      if (fingerprintsRes.data?.fingerprints) setFingerprints(fingerprintsRes.data.fingerprints);
      if (disputesRes.data?.disputes) setDisputes(disputesRes.data.disputes);
    } catch (e) {
      setError("Failed to load Sound Sovereign data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function createArtist() {
    try {
      await apiFetch("/sound-sovereign/artists", {
        method: "POST",
        body: JSON.stringify({ name: artistForm.name, bio: artistForm.bio, genres: artistForm.genres.split(",").map(g => g.trim()).filter(Boolean) }),
      });
      setShowArtistForm(false);
      setArtistForm({ name: "", bio: "", genres: "" });
      loadAll();
    } catch { setError("Failed to create artist"); }
  }

  async function createTrack() {
    try {
      await apiFetch("/sound-sovereign/tracks", {
        method: "POST",
        body: JSON.stringify({ title: trackForm.title, artistId: parseInt(trackForm.artistId), isrc: trackForm.isrc, duration: parseInt(trackForm.duration) || 0 }),
      });
      setShowTrackForm(false);
      setTrackForm({ title: "", artistId: "", isrc: "", duration: "" });
      loadAll();
    } catch { setError("Failed to create track"); }
  }

  async function generateForecast() {
    if (!selectedTrackForForecast) return;
    setGenerateForecastLoading(true);
    try {
      const res = await apiFetch("/sound-sovereign/forecasts", {
        method: "POST",
        body: JSON.stringify({ trackId: selectedTrackForForecast, horizon: forecastHorizon }),
      });
      if (res.data?.forecast) {
        setForecasts(prev => [res.data.forecast, ...prev.filter((f: any) => f.trackId !== selectedTrackForForecast)]);
      }
    } catch { setError("Failed to generate forecast"); } finally {
      setGenerateForecastLoading(false);
    }
  }

  async function createDispute() {
    try {
      const anomalyRecords = royalties?.records?.filter((r: any) => r.trackId === parseInt(disputeForm.trackId) && r.platform === disputeForm.platform && r.anomalyScore > 0.3).map((r: any) => r.id) ?? [];
      await apiFetch("/sound-sovereign/disputes", {
        method: "POST",
        body: JSON.stringify({ trackId: parseInt(disputeForm.trackId), platform: disputeForm.platform, description: disputeForm.description, claimAmountUsd: parseFloat(disputeForm.claimAmount) || 0, royaltyRecordIds: anomalyRecords }),
      });
      setShowDisputeForm(false);
      setDisputeForm({ trackId: "", platform: "spotify", description: "", claimAmount: "" });
      loadAll();
    } catch { setError("Failed to file dispute"); }
  }

  const anomalies = royalties?.records?.filter((r: any) => r.anomalyScore > 0.5) ?? [];
  const platformBreakdown = royalties?.platformBreakdown ?? {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Waves className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-display font-semibold text-foreground">Sound Sovereign</h1>
            <p className="text-xs text-muted-foreground">AI-Native Music Distribution & Royalty Intelligence</p>
          </div>
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
        {(["overview", "catalog", "royalties", "anomalies", "forecasts", "fingerprints", "disputes"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize", tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t === "fingerprints" ? "Content ID" : t}
            {t === "anomalies" && anomalies.length > 0 && <span className="ml-1.5 bg-red-500/20 text-red-400 text-xs px-1 rounded">{anomalies.length}</span>}
            {t === "disputes" && disputes.filter((d: any) => d.status === "open").length > 0 && <span className="ml-1.5 bg-amber-500/20 text-amber-400 text-xs px-1 rounded">{disputes.filter((d: any) => d.status === "open").length}</span>}
          </button>
        ))}
        <button onClick={loadAll} disabled={loading} className="ml-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {tab === "overview" && dashboard && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Revenue", value: fmtUsd(dashboard.totalRevenue ?? 0), icon: DollarSign, sub: `${fmtUsd(dashboard.totalExpected ?? 0)} expected` },
              { label: "Shortfall Detected", value: fmtUsd(dashboard.shortfall ?? 0), icon: TrendingUp, sub: `${dashboard.anomalies ?? 0} anomalous records`, alert: (dashboard.shortfall ?? 0) > 100 },
              { label: "Active Disputes", value: dashboard.disputes?.open ?? 0, icon: FileText, sub: `${dashboard.disputes?.total ?? 0} total filed` },
              { label: "Catalog", value: `${dashboard.artists ?? 0} artists`, icon: Music, sub: `${dashboard.tracks ?? 0} tracks registered` },
            ].map(card => (
              <div key={card.label} className={cn("inca-panel p-4", card.alert && "border-red-500/20")}>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-muted-foreground">{card.label}</div>
                  <card.icon className={cn("w-3.5 h-3.5", card.alert ? "text-red-400" : "text-muted-foreground/50")} />
                </div>
                <div className={cn("text-2xl font-semibold", card.alert ? "text-red-400" : "text-foreground")}>{card.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Revenue by Platform</div>
              <div className="space-y-2">
                {Object.entries(platformBreakdown).sort(([, a]: any, [, b]: any) => b.revenue - a.revenue).map(([platform, data]: any) => {
                  const maxRev = Math.max(...Object.values(platformBreakdown).map((d: any) => d.revenue), 1);
                  const pct = data.revenue / maxRev;
                  return (
                    <div key={platform} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PLATFORM_COLORS[platform] || "#888" }} />
                      <div className="text-xs text-muted-foreground w-20 capitalize">{platform.replace("_", " ")}</div>
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: PLATFORM_COLORS[platform] || "#888" }} />
                      </div>
                      <div className="text-xs text-foreground w-16 text-right">{fmtUsd(data.revenue)}</div>
                      {data.anomalyRate > 0.1 && <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Recent Anomalies</div>
              <div className="space-y-2">
                {anomalies.slice(0, 5).map((r: any) => (
                  <div key={r.id} className="flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/15 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{r.trackTitle}</div>
                      <div className="text-xs text-muted-foreground capitalize">{r.platform.replace("_", " ")} · {r.anomalyType?.replace("_", " ")}</div>
                    </div>
                    <div className="text-xs text-red-400 flex-shrink-0">{fmtUsd(r.expectedRevenueUsd - r.revenueUsd)} short</div>
                  </div>
                ))}
                {anomalies.length === 0 && <div className="text-xs text-muted-foreground">No anomalies detected. All royalty records within expected ranges.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "catalog" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{artists.length} artists · {tracks.length} tracks</div>
            <div className="flex gap-2">
              <button onClick={() => setShowArtistForm(!showArtistForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/25 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Artist
              </button>
              <button onClick={() => setShowTrackForm(!showTrackForm)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Track
              </button>
            </div>
          </div>

          {showArtistForm && (
            <div className="inca-panel p-4 border border-emerald-500/20">
              <div className="text-sm font-medium text-foreground mb-3">Register New Artist</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Artist Name</label>
                  <input value={artistForm.name} onChange={e => setArtistForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500/40" placeholder="e.g. Nova Meridian" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Genres (comma-separated)</label>
                  <input value={artistForm.genres} onChange={e => setArtistForm(f => ({ ...f, genres: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500/40" placeholder="electronic, soul, ambient" />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
                <input value={artistForm.bio} onChange={e => setArtistForm(f => ({ ...f, bio: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500/40" placeholder="Artist bio..." />
              </div>
              <div className="flex gap-2">
                <button onClick={createArtist} disabled={!artistForm.name} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">Register Artist</button>
                <button onClick={() => setShowArtistForm(false)} className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm font-medium hover:text-foreground transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {showTrackForm && (
            <div className="inca-panel p-4 border border-primary/20">
              <div className="text-sm font-medium text-foreground mb-3">Register New Track</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Track Title</label>
                  <input value={trackForm.title} onChange={e => setTrackForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="e.g. Cascade Protocol" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Artist</label>
                  <select value={trackForm.artistId} onChange={e => setTrackForm(f => ({ ...f, artistId: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                    <option value="">Select artist...</option>
                    {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">ISRC Code</label>
                  <input value={trackForm.isrc} onChange={e => setTrackForm(f => ({ ...f, isrc: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="e.g. USSV12300001" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Duration (seconds)</label>
                  <input type="number" value={trackForm.duration} onChange={e => setTrackForm(f => ({ ...f, duration: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="214" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={createTrack} disabled={!trackForm.title || !trackForm.artistId} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">Register Track</button>
                <button onClick={() => setShowTrackForm(false)} className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm font-medium hover:text-foreground transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Artists</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              {artists.map(a => (
                <div key={a.id} className="inca-panel p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-emerald-400">{a.name[0]}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{tracks.filter(t => t.artistId === a.id).length} tracks</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(a.genres || []).slice(0, 3).map((g: string) => <span key={g} className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{g}</span>)}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Tracks</div>
            <div className="space-y-2">
              {tracks.map(t => (
                <div key={t.id} className="inca-panel overflow-hidden">
                  <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpandedTrack(expandedTrack === t.id ? null : t.id)}>
                    <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Music className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{t.title}</div>
                      <div className="text-xs text-muted-foreground">{t.artistName} · {Math.floor(t.duration / 60)}:{String(t.duration % 60).padStart(2, "0")} · {t.isrc}</div>
                    </div>
                    {expandedTrack === t.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                  {expandedTrack === t.id && (
                    <div className="px-3 pb-3 border-t border-border/50 pt-2">
                      <div className="text-xs text-muted-foreground mb-2">Revenue Splits</div>
                      <div className="space-y-1">
                        {(t.splits || []).map((s: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="text-foreground">{s.party}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{s.role}</span>
                              <span className="font-medium text-foreground">{fmtPct(s.share)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "royalties" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Collected", value: fmtUsd(royalties?.totalRevenue ?? 0) },
              { label: "Expected Total", value: fmtUsd(royalties?.totalExpected ?? 0) },
              { label: "Total Shortfall", value: fmtUsd(royalties?.shortfall ?? 0), alert: true },
            ].map(c => (
              <div key={c.label} className={cn("inca-panel p-3", c.alert && (royalties?.shortfall ?? 0) > 100 && "border-red-500/20")}>
                <div className="text-xs text-muted-foreground">{c.label}</div>
                <div className={cn("text-lg font-semibold mt-1", c.alert && (royalties?.shortfall ?? 0) > 100 ? "text-red-400" : "text-foreground")}>{c.value}</div>
              </div>
            ))}
          </div>

          <div className="inca-panel overflow-hidden">
            <div className="p-3 border-b border-border">
              <div className="text-sm font-medium text-foreground">Royalty Records</div>
              <div className="text-xs text-muted-foreground">{royalties?.records?.length ?? 0} records · sorted by anomaly score</div>
            </div>
            <div className="divide-y divide-border/50">
              {(royalties?.records ?? []).slice(0, 20).map((r: any) => (
                <div key={r.id} className={cn("px-3 py-2.5 flex items-center gap-3", r.anomalyScore > 0.5 && "bg-red-500/3")}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: PLATFORM_COLORS[r.platform] || "#888" }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{r.trackTitle}</div>
                    <div className="text-xs text-muted-foreground capitalize">{r.platform.replace("_", " ")} · {r.territory}</div>
                  </div>
                  <div className="text-xs text-right">
                    <div className="text-foreground">{fmtUsd(r.revenueUsd)}</div>
                    <div className="text-muted-foreground">{r.streams.toLocaleString()} streams</div>
                  </div>
                  {r.anomalyScore > 0.5 && (
                    <div className="flex items-center gap-1 text-xs text-red-400 flex-shrink-0">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{(r.anomalyScore * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "anomalies" && (
        <div className="space-y-3">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            <div className="font-medium mb-1">AI Anomaly Detection — {anomalies.length} anomalous records detected</div>
            <div className="text-xs text-red-400/70">Records where actual royalty payments deviate significantly from expected rates based on streaming data and platform-published rates. Anomaly scores above 0.5 are flagged for review.</div>
          </div>

          <div className="space-y-2">
            {anomalies.map((r: any) => (
              <div key={r.id} className="inca-panel p-4 border-red-500/15 border">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-sm text-foreground">{r.trackTitle}</div>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 capitalize">{(r.anomalyType || "anomaly").replace("_", " ")}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2 capitalize">{r.platform.replace("_", " ")} · {new Date(r.periodStart).toLocaleDateString()} — {new Date(r.periodEnd).toLocaleDateString()}</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-secondary rounded p-2 text-center">
                        <div className="text-xs text-muted-foreground">Received</div>
                        <div className="text-sm font-medium text-foreground">{fmtUsd(r.revenueUsd)}</div>
                      </div>
                      <div className="bg-secondary rounded p-2 text-center">
                        <div className="text-xs text-muted-foreground">Expected</div>
                        <div className="text-sm font-medium text-foreground">{fmtUsd(r.expectedRevenueUsd)}</div>
                      </div>
                      <div className="bg-red-500/10 rounded p-2 text-center">
                        <div className="text-xs text-muted-foreground">Shortfall</div>
                        <div className="text-sm font-medium text-red-400">{fmtUsd(r.expectedRevenueUsd - r.revenueUsd)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="text-xs text-muted-foreground">Anomaly Score</div>
                    <div className="text-lg font-semibold text-red-400">{(r.anomalyScore * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            ))}
            {anomalies.length === 0 && <div className="inca-panel p-8 text-center text-muted-foreground text-sm">No anomalies detected. All royalty payments are within expected ranges.</div>}
          </div>
        </div>
      )}

      {tab === "forecasts" && (
        <div className="space-y-4">
          <div className="inca-panel p-4">
            <div className="text-sm font-medium text-foreground mb-3">Generate Revenue Forecast</div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <select value={selectedTrackForForecast ?? ""} onChange={e => setSelectedTrackForForecast(parseInt(e.target.value) || null)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                  <option value="">Select a track...</option>
                  {tracks.map(t => <option key={t.id} value={t.id}>{t.title} — {t.artistName}</option>)}
                </select>
              </div>
              <div className="flex gap-1 p-1 bg-secondary rounded-lg">
                {(["30d", "90d", "1y"] as const).map(h => (
                  <button key={h} onClick={() => setForecastHorizon(h)} className={cn("px-3 py-1 rounded-md text-xs font-medium transition-all", forecastHorizon === h ? "bg-card text-foreground" : "text-muted-foreground")}>
                    {h}
                  </button>
                ))}
              </div>
              <button onClick={generateForecast} disabled={!selectedTrackForForecast || generateForecastLoading} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {generateForecastLoading ? "Generating..." : "Generate Forecast"}
              </button>
            </div>
          </div>

          {forecasts.map(fc => (
            <div key={fc.trackId} className="inca-panel p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-medium text-foreground">{fc.trackTitle}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{fc.horizon} forecast · Generated {new Date(fc.generatedAt).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Projected</div>
                  <div className={cn("text-xl font-semibold", fc.growthRate >= 0 ? "text-green-400" : "text-red-400")}>{fmtUsd(fc.projectedRevenue)}</div>
                  <div className={cn("text-xs", fc.growthRate >= 0 ? "text-green-400" : "text-red-400")}>{fc.growthRate >= 0 ? "+" : ""}{fmtPct(fc.growthRate)} growth</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-secondary rounded-lg p-2.5 text-center">
                  <div className="text-xs text-muted-foreground">Base (Historical)</div>
                  <div className="text-sm font-medium text-foreground">{fmtUsd(fc.baseRevenue)}</div>
                </div>
                <div className="bg-secondary rounded-lg p-2.5 text-center">
                  <div className="text-xs text-muted-foreground">CI Lower</div>
                  <div className="text-sm font-medium text-foreground">{fmtUsd(fc.confidenceInterval[0])}</div>
                </div>
                <div className="bg-secondary rounded-lg p-2.5 text-center">
                  <div className="text-xs text-muted-foreground">CI Upper</div>
                  <div className="text-sm font-medium text-foreground">{fmtUsd(fc.confidenceInterval[1])}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">Platform Breakdown</div>
              <div className="space-y-1">
                {Object.entries(fc.platformBreakdown || {}).sort(([, a]: any, [, b]: any) => b - a).map(([p, v]: any) => {
                  const total = Object.values(fc.platformBreakdown as Record<string, number>).reduce((s, n) => s + n, 0);
                  return (
                    <div key={p} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] || "#888" }} />
                      <div className="text-xs text-muted-foreground w-24 capitalize">{p.replace("_", " ")}</div>
                      <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: total > 0 ? `${(v / total) * 100}%` : "0%", backgroundColor: PLATFORM_COLORS[p] || "#888" }} />
                      </div>
                      <div className="text-xs text-foreground w-14 text-right">{fmtUsd(v)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {forecasts.length === 0 && <div className="inca-panel p-8 text-center text-muted-foreground text-sm">Select a track and generate your first revenue forecast using AI-powered modeling.</div>}
        </div>
      )}

      {tab === "fingerprints" && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">{fingerprints.length} tracks fingerprinted · {fingerprints.filter(f => f.detectedDerivatives.length > 0).length} with detected derivatives</div>
          <div className="space-y-2">
            {fingerprints.map(fp => (
              <div key={fp.id} className="inca-panel p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm text-foreground">{fp.trackTitle}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{fp.fingerprintHash.slice(0, 20)}...</div>
                    <div className="text-xs text-muted-foreground mt-1">Registered {new Date(fp.registeredAt).toLocaleDateString()}</div>
                  </div>
                  {fp.detectedDerivatives.length > 0 ? (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">{fp.detectedDerivatives.length} derivative{fp.detectedDerivatives.length !== 1 ? "s" : ""}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Clean</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {fingerprints.length === 0 && <div className="inca-panel p-8 text-center text-muted-foreground text-sm">No fingerprints registered. Tracks are automatically fingerprinted upon registration.</div>}
          </div>
        </div>
      )}

      {tab === "disputes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{disputes.length} dispute{disputes.length !== 1 ? "s" : ""} · {disputes.filter(d => d.status === "open").length} open</div>
            <button onClick={() => setShowDisputeForm(!showDisputeForm)} className="flex items-center gap-2 px-3 py-1.5 bg-primary/15 border border-primary/25 text-primary rounded-lg text-sm font-medium hover:bg-primary/25 transition-colors">
              <Plus className="w-3.5 h-3.5" /> File Dispute
            </button>
          </div>

          {showDisputeForm && (
            <div className="inca-panel p-4 border border-primary/20">
              <div className="text-sm font-medium text-foreground mb-3">File Royalty Dispute</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Track</label>
                  <select value={disputeForm.trackId} onChange={e => setDisputeForm(f => ({ ...f, trackId: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                    <option value="">Select track...</option>
                    {tracks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Platform</label>
                  <select value={disputeForm.platform} onChange={e => setDisputeForm(f => ({ ...f, platform: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                    {["spotify", "apple_music", "youtube", "tiktok", "amazon_music", "deezer"].map(p => <option key={p} value={p}>{p.replace("_", " ").toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Claim Amount (USD)</label>
                <input type="number" value={disputeForm.claimAmount} onChange={e => setDisputeForm(f => ({ ...f, claimAmount: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="0.00" />
              </div>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <textarea value={disputeForm.description} onChange={e => setDisputeForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none" placeholder="Describe the royalty discrepancy..." />
              </div>
              <div className="text-xs text-muted-foreground mb-3">AI will auto-collect all anomalous royalty records for this track/platform combination as supporting evidence.</div>
              <div className="flex gap-2">
                <button onClick={createDispute} disabled={!disputeForm.trackId || !disputeForm.description} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">File Dispute</button>
                <button onClick={() => setShowDisputeForm(false)} className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm font-medium hover:text-foreground transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {disputes.map(d => {
              const style = DISPUTE_STATUS_STYLES[d.status] || DISPUTE_STATUS_STYLES.open;
              return (
                <div key={d.id} className="inca-panel overflow-hidden">
                  <div className="p-4 cursor-pointer flex items-start justify-between" onClick={() => setExpandedDispute(expandedDispute === d.id ? null : d.id)}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-sm text-foreground">{d.trackTitle}</div>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", style.bg, style.color)}>{style.label}</span>
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">{d.platform.replace("_", " ")} · Claim: {fmtUsd(d.claimAmountUsd)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{d.description}</div>
                    </div>
                    {expandedDispute === d.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {expandedDispute === d.id && d.evidencePackage && (
                    <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Expected Revenue", value: fmtUsd(d.evidencePackage.expectedRevenue) },
                          { label: "Actual Revenue", value: fmtUsd(d.evidencePackage.actualRevenue) },
                          { label: "Shortfall", value: fmtUsd(d.evidencePackage.shortfallUsd) },
                        ].map(item => (
                          <div key={item.label} className="bg-secondary rounded-lg p-2.5 text-center">
                            <div className="text-xs text-muted-foreground">{item.label}</div>
                            <div className="text-sm font-medium text-foreground">{item.value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{d.evidencePackage.narrativeSummary}</div>
                    </div>
                  )}
                </div>
              );
            })}
            {disputes.length === 0 && !showDisputeForm && (
              <div className="inca-panel p-8 text-center text-muted-foreground text-sm">No disputes filed. Use the anomaly detection tab to identify underpayment cases, then file a dispute with auto-generated evidence packages.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
