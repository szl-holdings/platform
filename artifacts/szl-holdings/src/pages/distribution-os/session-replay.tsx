import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import {
  Play, ChevronRight, ArrowLeft, Clock, MousePointer, ScrollText,
  Globe, Monitor, Smartphone, Target, Filter, Calendar,
} from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface Session {
  id: string;
  visitorId: string;
  sessionStart: string;
  sessionEnd: string | null;
  pageCount: number;
  durationSeconds: number | null;
  bounced: boolean;
  entryPath: string | null;
  exitPath: string | null;
  channel: string | null;
  deviceType: string | null;
  browser: string | null;
  timezone: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  converted: boolean;
  conversionCount: number;
  appName: string | null;
}

interface PageView {
  id: string;
  sessionId: string | null;
  path: string;
  title: string | null;
  enterAt: string;
  exitAt: string | null;
  durationSeconds: number | null;
  scrollDepthPct: number | null;
  clickCount: number;
  properties: Record<string, unknown>;
}

interface Conversion {
  id: string;
  goalName: string;
  triggerEvent: string | null;
  value: number | null;
  createdAt: string;
}

interface SessionDetail {
  session: Session;
  pageViews: PageView[];
  conversions: Conversion[];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getScrollColor(pct: number | null): string {
  if (!pct) return "#4a4540";
  if (pct >= 75) return "#5a9c5a";
  if (pct >= 50) return "#d4a054";
  if (pct >= 25) return "#4a90b8";
  return "#c45a4a";
}

function SessionCard({ session, onClick }: { session: Session; onClick: () => void }) {
  const start = new Date(session.sessionStart);
  return (
    <div
      onClick={onClick}
      style={{
        padding: "1rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)",
        borderRadius: "8px", cursor: "pointer", transition: "all 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "hsla(0,0%,100%,0.04)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "hsla(0,0%,100%,0.02)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: session.converted ? "#5a9c5a" : session.bounced ? "#c45a4a" : "#4a90b8" }} />
          <span style={{ fontSize: "0.75rem", color: "#8b8579", fontFamily: "monospace" }}>
            {session.visitorId.slice(0, 12)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {session.converted && (
            <span style={{ fontSize: "0.625rem", padding: "0.125rem 0.375rem", background: "hsla(120,40%,40%,0.15)", color: "#5a9c5a", borderRadius: "3px", border: "1px solid hsla(120,40%,40%,0.2)" }}>
              converted
            </span>
          )}
          {session.bounced && !session.converted && (
            <span style={{ fontSize: "0.625rem", padding: "0.125rem 0.375rem", background: "hsla(0,40%,40%,0.15)", color: "#c45a4a", borderRadius: "3px", border: "1px solid hsla(0,40%,40%,0.2)" }}>
              bounced
            </span>
          )}
          <ChevronRight size={12} style={{ color: "#4a4540" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.6875rem", color: "#4a4540", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <Clock size={10} /> {formatDuration(session.durationSeconds)}
        </span>
        <span style={{ fontSize: "0.6875rem", color: "#4a4540", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <Globe size={10} /> {session.pageCount}p
        </span>
        <span style={{ fontSize: "0.6875rem", color: "#4a4540", textTransform: "capitalize" }}>
          {session.channel ?? "direct"}
        </span>
        {session.deviceType && (
          <span style={{ fontSize: "0.6875rem", color: "#4a4540", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            {session.deviceType === "mobile" ? <Smartphone size={10} /> : <Monitor size={10} />}
            {session.browser ?? session.deviceType}
          </span>
        )}
      </div>
      <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.375rem" }}>
        {start.toLocaleDateString()} {formatTime(session.sessionStart)}
        {session.entryPath && <> · entry: <span style={{ color: "#6b6560" }}>{session.entryPath}</span></>}
      </div>
    </div>
  );
}

function FilmstripPage({ pv, index, onClick, selected }: { pv: PageView; index: number; onClick: () => void; selected: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "0.75rem", background: selected ? "hsla(0,0%,100%,0.06)" : "hsla(0,0%,100%,0.02)",
        border: `1px solid ${selected ? "hsla(0,0%,100%,0.15)" : "hsla(0,0%,100%,0.05)"}`,
        borderRadius: "8px", cursor: "pointer", minWidth: "160px", transition: "all 0.15s",
      }}
    >
      <div style={{ fontSize: "0.625rem", color: "#4a4540", marginBottom: "0.375rem" }}>Page {index + 1}</div>
      <div style={{ fontSize: "0.75rem", color: "#e8e4de", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "0.25rem" }}>
        {pv.title || pv.path}
      </div>
      <div style={{ fontSize: "0.6875rem", color: "#6b6560", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "0.5rem" }}>
        {pv.path}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.625rem", color: "#8b8579", display: "flex", alignItems: "center", gap: "0.125rem" }}>
          <Clock size={8} /> {formatDuration(pv.durationSeconds)}
        </span>
        <span style={{ fontSize: "0.625rem", color: getScrollColor(pv.scrollDepthPct), display: "flex", alignItems: "center", gap: "0.125rem" }}>
          <ScrollText size={8} /> {pv.scrollDepthPct ?? 0}%
        </span>
        <span style={{ fontSize: "0.625rem", color: "#8b8579", display: "flex", alignItems: "center", gap: "0.125rem" }}>
          <MousePointer size={8} /> {pv.clickCount}
        </span>
      </div>
    </div>
  );
}

function SessionDetailView({ detail, onBack }: { detail: SessionDetail; onBack: () => void }) {
  const [selectedPage, setSelectedPage] = useState<PageView | null>(detail.pageViews[0] ?? null);

  return (
    <m.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <button
        onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "1.5rem", background: "transparent", border: "none", color: "#6b6560", cursor: "pointer", fontSize: "0.8125rem" }}
      >
        <ArrowLeft size={14} /> Back to sessions
      </button>

      <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#e8e4de", marginBottom: "0.375rem" }}>
              Session Replay
              <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "#4a4540", marginLeft: "0.75rem", fontFamily: "monospace" }}>
                {detail.session.visitorId}
              </span>
            </h2>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {[
                { label: "Pages", value: detail.session.pageCount },
                { label: "Duration", value: formatDuration(detail.session.durationSeconds) },
                { label: "Channel", value: detail.session.channel ?? "direct" },
                { label: "Device", value: detail.session.deviceType ?? "unknown" },
                { label: "Browser", value: detail.session.browser ?? "unknown" },
              ].map(({ label, value }) => (
                <span key={label} style={{ fontSize: "0.75rem", color: "#6b6560" }}>
                  <span style={{ color: "#4a4540" }}>{label}: </span>
                  <span style={{ textTransform: "capitalize" }}>{value}</span>
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {detail.session.converted && (
              <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.625rem", background: "hsla(120,40%,40%,0.15)", color: "#5a9c5a", borderRadius: "4px" }}>
                <Target size={11} style={{ display: "inline", marginRight: "0.25rem" }} />
                {detail.session.conversionCount} conversion{detail.session.conversionCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {detail.session.utmSource && (
          <div style={{ marginTop: "0.75rem", padding: "0.625rem 0.875rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "6px", border: "1px solid hsla(0,0%,100%,0.04)" }}>
            <span style={{ fontSize: "0.6875rem", color: "#4a4540" }}>
              UTM: source=<span style={{ color: "#8b8579" }}>{detail.session.utmSource}</span>
              {detail.session.utmMedium && <> medium=<span style={{ color: "#8b8579" }}>{detail.session.utmMedium}</span></>}
              {detail.session.utmCampaign && <> campaign=<span style={{ color: "#8b8579" }}>{detail.session.utmCampaign}</span></>}
            </span>
          </div>
        )}
      </div>

      <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Play size={14} style={{ color: "#4a90b8" }} />
        Page Sequence Filmstrip
      </h3>

      <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        {detail.pageViews.map((pv, i) => (
          <div key={pv.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
            <FilmstripPage pv={pv} index={i} onClick={() => setSelectedPage(pv)} selected={selectedPage?.id === pv.id} />
            {i < detail.pageViews.length - 1 && (
              <ChevronRight size={14} style={{ color: "#4a4540", flexShrink: 0 }} />
            )}
          </div>
        ))}
        {detail.pageViews.length === 0 && (
          <div style={{ fontSize: "0.8125rem", color: "#4a4540", padding: "1rem" }}>No page view data for this session</div>
        )}
      </div>

      {selectedPage && (
        <m.div
          key={selectedPage.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px", marginBottom: "1.5rem" }}
        >
          <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>
            Page Detail: {selectedPage.title || selectedPage.path}
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
            {[
              { label: "Path", value: selectedPage.path },
              { label: "Enter", value: formatTime(selectedPage.enterAt) },
              { label: "Exit", value: selectedPage.exitAt ? formatTime(selectedPage.exitAt) : "—" },
              { label: "Time on Page", value: formatDuration(selectedPage.durationSeconds) },
              { label: "Scroll Depth", value: `${selectedPage.scrollDepthPct ?? 0}%` },
              { label: "Clicks", value: String(selectedPage.clickCount) },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: "0.75rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "6px", border: "1px solid hsla(0,0%,100%,0.04)" }}>
                <div style={{ fontSize: "0.625rem", color: "#4a4540", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                <div style={{ fontSize: "0.8125rem", color: "#e8e4de", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
              </div>
            ))}
          </div>
          {Object.keys(selectedPage.properties ?? {}).length > 0 && (
            <div>
              <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Event Properties</div>
              <pre style={{ fontSize: "0.6875rem", color: "#6b6560", background: "hsla(0,0%,100%,0.02)", padding: "0.75rem", borderRadius: "6px", overflow: "auto", maxHeight: "150px" }}>
                {JSON.stringify(selectedPage.properties, null, 2)}
              </pre>
            </div>
          )}
        </m.div>
      )}

      {detail.conversions.length > 0 && (
        <div style={{ padding: "1.5rem", background: "hsla(120,40%,20%,0.08)", border: "1px solid hsla(120,40%,40%,0.15)", borderRadius: "10px" }}>
          <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#5a9c5a", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Target size={14} /> Conversions in this Session
          </h4>
          {detail.conversions.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.5rem 0", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
              <span style={{ fontSize: "0.8125rem", color: "#e8e4de", fontWeight: 600 }}>{c.goalName}</span>
              <span style={{ fontSize: "0.75rem", color: "#6b6560" }}>{c.triggerEvent}</span>
              {c.value && <span style={{ fontSize: "0.75rem", color: "#5a9c5a" }}>${c.value}</span>}
              <span style={{ fontSize: "0.75rem", color: "#4a4540", marginLeft: "auto" }}>{formatTime(c.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </m.div>
  );
}

export default function SessionReplayPage() {
  const [location] = useLocation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [days, setDays] = useState(7);
  const [filterConverted, setFilterConverted] = useState<"" | "true" | "false">("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API}/api/analytics-lake/sessions?days=${days}&page=${page}&limit=25`;
      if (filterConverted) url += `&converted=${filterConverted}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as { sessions: Session[]; total: number };
        setSessions(data.sessions);
        setTotal(data.total);
      }
    } catch {}
    setLoading(false);
  }, [days, page, filterConverted]);

  useEffect(() => { load(); }, [load]);

  const openSession = useCallback(async (session: Session) => {
    try {
      const res = await fetch(`${API}/api/analytics-lake/sessions/${session.id}`);
      if (res.ok) {
        setDetail(await res.json() as SessionDetail);
      }
    } catch {}
  }, []);

  return (
    <DistributionOsLayout currentPath={location}>
      <AnimatePresence mode="wait">
        {detail ? (
          <SessionDetailView key="detail" detail={detail} onBack={() => setDetail(null)} />
        ) : (
          <m.div key="list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Session Replay</h1>
                <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>
                  Page-by-page visitor journey reconstruction · {total.toLocaleString()} sessions
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {[7, 14, 30].map(d => (
                  <button key={d} onClick={() => { setDays(d); setPage(1); }} style={{ padding: "0.375rem 0.75rem", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer", background: days === d ? "hsla(0,0%,100%,0.1)" : "transparent", border: `1px solid ${days === d ? "hsla(0,0%,100%,0.15)" : "hsla(0,0%,100%,0.06)"}`, color: days === d ? "#e8e4de" : "#6b6560" }}>
                    {d}d
                  </button>
                ))}
                <select
                  value={filterConverted}
                  onChange={e => { setFilterConverted(e.target.value as "" | "true" | "false"); setPage(1); }}
                  style={{ padding: "0.375rem 0.5rem", borderRadius: "6px", fontSize: "0.75rem", background: "#111418", border: "1px solid hsla(0,0%,100%,0.1)", color: "#8b8579" }}
                >
                  <option value="">All sessions</option>
                  <option value="true">Converted</option>
                  <option value="false">Not converted</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#4a4540", fontSize: "0.875rem" }}>Loading sessions…</div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "#4a4540" }}>
                <ScrollText size={32} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                <div style={{ fontSize: "0.875rem" }}>No sessions found for this period</div>
                <div style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>Sessions are recorded as visitors navigate the site</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.5rem" }}>
                  {sessions.map(session => (
                    <SessionCard key={session.id} session={session} onClick={() => openSession(session)} />
                  ))}
                </div>

                {total > 25 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{ padding: "0.375rem 0.875rem", borderRadius: "6px", fontSize: "0.75rem", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", color: "#8b8579" }}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: "0.75rem", color: "#4a4540" }}>Page {page} of {Math.ceil(total / 25)}</span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= Math.ceil(total / 25)}
                      style={{ padding: "0.375rem 0.875rem", borderRadius: "6px", fontSize: "0.75rem", cursor: page >= Math.ceil(total / 25) ? "not-allowed" : "pointer", opacity: page >= Math.ceil(total / 25) ? 0.4 : 1, background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", color: "#8b8579" }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </DistributionOsLayout>
  );
}
