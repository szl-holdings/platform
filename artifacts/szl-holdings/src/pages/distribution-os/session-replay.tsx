import { useState, useEffect, useRef } from "react";
import { m } from "framer-motion";
import { Play, ChevronLeft, ChevronRight, Monitor, Clock, Globe, ArrowLeft, AlertCircle, Video } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface Recording {
  id: number;
  sessionId: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  pageCount: number;
  chunkCount: number;
  totalSizeBytes: number;
  deviceType: string | null;
  country: string | null;
  entryPage: string | null;
  didConvert: boolean;
  conversionEvent: string | null;
  status: string;
}

interface Chunk {
  id: number;
  sequence: number;
  events: unknown[];
  sizeBytes: number;
}

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

export default function SessionReplayPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selected, setSelected] = useState<Recording | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [replayLoading, setReplayLoading] = useState(false);
  const [convertedOnly, setConvertedOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<unknown>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadRecordings();
  }, [convertedOnly, page]);

  async function loadRecordings() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        ...(convertedOnly ? { converted: "true" } : {}),
      });
      const r = await fetch(`${API}/api/analytics/recordings?${params}`, { credentials: "include" });
      if (!r.ok) return;
      const d = await r.json() as { recordings: Recording[] };
      setRecordings(d.recordings || []);
    } catch {}
    setLoading(false);
  }

  async function loadReplay(rec: Recording) {
    setSelected(rec);
    setReplayLoading(true);
    setPlayerReady(false);
    setChunks([]);
    try {
      const r = await fetch(`${API}/api/analytics/recordings/${rec.id}`, { credentials: "include" });
      if (!r.ok) return;
      const d = await r.json() as { recording: Recording; chunks: Chunk[] };
      setChunks(d.chunks || []);
      setTimeout(() => initPlayer(d.chunks), 300);
    } catch {}
    setReplayLoading(false);
  }

  async function initPlayer(chunks: Chunk[]) {
    if (!playerContainerRef.current) return;
    const allEvents = chunks.flatMap(c => c.events);
    if (allEvents.length === 0) { setPlayerReady(false); return; }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rrweb = await (Function('return import("rrweb")')() as Promise<any>);
      const Replayer = rrweb?.Replayer ?? rrweb?.default?.Replayer;
      if (!Replayer) { setPlayerReady(false); return; }
      if (playerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (playerRef.current as any).destroy?.();
      }
      playerContainerRef.current.innerHTML = "";
      const replayer = new Replayer(allEvents, {
        root: playerContainerRef.current,
        skipInactive: true,
        showWarning: false,
        blockClass: "rr-block",
      });
      playerRef.current = replayer;
      setPlayerReady(true);
    } catch {
      setPlayerReady(false);
    }
  }

  function playPause() {
    if (!playerRef.current) return;
    const p = playerRef.current as { play: () => void; pause: () => void };
    try { p.play(); } catch {}
  }

  return (
    <DistributionOsLayout>
      <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "#e8e4de" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <Video size={22} style={{ color: "#d4a054" }} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Session Replay</h1>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)", marginTop: "0.25rem" }}>DOM-level recordings of visitor journeys with PII masking</p>
          </div>
        </div>

        {selected ? (
          <div>
            <button onClick={() => { setSelected(null); setChunks([]); setPlayerReady(false); }} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.375rem", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: "0.4rem 0.875rem", fontSize: "0.8125rem", fontWeight: 600, marginBottom: "1.5rem" }}>
              <ArrowLeft size={14} /> Back to list
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem" }}>
              <div>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.75rem", overflow: "hidden" }}>
                  <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)" }}>Session: <span style={{ color: "#e8e4de", fontFamily: "monospace" }}>{selected.sessionId.substring(0, 20)}…</span></div>
                    {playerReady && (
                      <button onClick={playPause} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#d4a054", border: "none", borderRadius: "0.375rem", color: "#0a0e16", cursor: "pointer", padding: "0.4rem 0.875rem", fontSize: "0.75rem", fontWeight: 700 }}>
                        <Play size={13} /> Play
                      </button>
                    )}
                  </div>
                  <div
                    ref={playerContainerRef}
                    style={{ width: "100%", minHeight: "400px", background: "#fff", position: "relative" }}
                  >
                    {replayLoading && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,14,22,0.9)", color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
                        Loading replay…
                      </div>
                    )}
                    {!replayLoading && !playerReady && chunks.length === 0 && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(10,14,22,0.9)", gap: "0.75rem" }}>
                        <AlertCircle size={24} style={{ color: "rgba(255,255,255,0.3)" }} />
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>No recording data available</p>
                      </div>
                    )}
                    {!replayLoading && !playerReady && chunks.length > 0 && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(10,14,22,0.9)", gap: "0.75rem" }}>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>rrweb player initializing…</p>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {chunks.map(c => (
                    <div key={c.id} style={{ padding: "0.25rem 0.5rem", background: "rgba(212,160,84,0.1)", border: "1px solid rgba(212,160,84,0.2)", borderRadius: "0.25rem", fontSize: "0.6875rem", color: "rgba(212,160,84,0.8)" }}>
                      Chunk {c.sequence + 1} · {c.events.length} events · {formatBytes(c.sizeBytes)}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.75rem", padding: "1.25rem" }}>
                  <h3 style={{ margin: "0 0 1rem", fontSize: "0.875rem", fontWeight: 700, color: "#e8e4de" }}>Session Metadata</h3>
                  {[
                    ["Entry Page", selected.entryPage || "—"],
                    ["Duration", formatDuration(selected.durationMs)],
                    ["Page Count", String(selected.pageCount)],
                    ["Chunks", String(selected.chunkCount)],
                    ["Size", formatBytes(selected.totalSizeBytes)],
                    ["Device", selected.deviceType || "—"],
                    ["Country", selected.country || "—"],
                    ["Status", selected.status],
                    ["Converted", selected.didConvert ? `Yes — ${selected.conversionEvent}` : "No"],
                    ["Recorded At", new Date(selected.startedAt).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.8125rem" }}>
                      <span style={{ color: "rgba(255,255,255,0.45)" }}>{k}</span>
                      <span style={{ color: "#e8e4de", fontWeight: 500, textAlign: "right", maxWidth: "150px", wordBreak: "break-all" }}>{v}</span>
                    </div>
                  ))}
                </div>
                {selected.didConvert && (
                  <div style={{ background: "rgba(90,156,90,0.1)", border: "1px solid rgba(90,156,90,0.3)", borderRadius: "0.5rem", padding: "0.875rem", fontSize: "0.8125rem" }}>
                    <div style={{ color: "#5a9c5a", fontWeight: 700, marginBottom: "0.25rem" }}>Conversion Recorded</div>
                    <div style={{ color: "rgba(255,255,255,0.5)" }}>{selected.conversionEvent}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>
                <input type="checkbox" checked={convertedOnly} onChange={e => { setConvertedOnly(e.target.checked); setPage(0); }} style={{ accentColor: "#d4a054" }} />
                Conversions only
              </label>
              <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: "0.4rem 0.75rem", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.375rem", color: page === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", cursor: page === 0 ? "not-allowed" : "pointer", fontSize: "0.75rem" }}>
                  <ChevronLeft size={14} />
                </button>
                <span style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>Page {page + 1}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={recordings.length < PAGE_SIZE} style={{ padding: "0.4rem 0.75rem", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.375rem", color: recordings.length < PAGE_SIZE ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", cursor: recordings.length < PAGE_SIZE ? "not-allowed" : "pointer", fontSize: "0.75rem" }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.3)" }}>Loading recordings…</div>
            ) : recordings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.3)" }}>
                <Video size={32} style={{ marginBottom: "1rem", opacity: 0.3 }} />
                <p>No recordings yet. Session recording activates automatically when analytics consent is granted.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {recordings.map(rec => (
                  <m.div
                    key={rec.id}
                    onClick={() => loadReplay(rec)}
                    whileHover={{ x: 2 }}
                    style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto auto", gap: "1rem", alignItems: "center", padding: "1rem 1.25rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.5rem", cursor: "pointer" }}
                  >
                    <div>
                      <div style={{ fontSize: "0.8125rem", color: "#e8e4de", fontWeight: 500 }}>{rec.entryPage || "/"}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: "0.125rem", fontFamily: "monospace" }}>{rec.sessionId.substring(0, 24)}…</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}><Clock size={11} style={{ display: "inline", marginRight: "0.25rem" }} />{formatDuration(rec.durationMs)}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>{rec.pageCount} pages</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}><Monitor size={11} style={{ display: "inline", marginRight: "0.25rem" }} />{rec.deviceType || "—"}</div>
                    </div>
                    <div>
                      {rec.didConvert ? (
                        <span style={{ fontSize: "0.6875rem", background: "rgba(90,156,90,0.15)", border: "1px solid rgba(90,156,90,0.3)", color: "#5a9c5a", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontWeight: 700 }}>Converted</span>
                      ) : (
                        <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)" }}>No conv.</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}><Globe size={11} style={{ display: "inline", marginRight: "0.25rem" }} />{rec.country || "—"}</div>
                    </div>
                    <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.3)" }}>{new Date(rec.startedAt).toLocaleDateString()}</div>
                  </m.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DistributionOsLayout>
  );
}
