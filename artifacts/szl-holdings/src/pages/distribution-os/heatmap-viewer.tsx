import { useState, useEffect, useRef, useCallback } from "react";
import { Flame, RefreshCw, MousePointer, MoveHorizontal, ArrowDown, BarChart3 } from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";

interface HeatmapData {
  pagePath: string;
  eventType: string;
  days: number;
  totalEvents: number;
  densityGrid: Record<string, number>;
  scrollMap: Record<number, number>;
  topElements: Array<{ element: string; count: number; tag: string; class: string }>;
  rawEvents: Array<{ x: number | null; y: number | null; xPct: number | null; yPct: number | null; elementTag?: string; elementText?: string }>;
}

const PAGE_PATHS = ["/", "/lyte", "/vessels", "/terra", "/aegis", "/pricing", "/contact", "/investors", "/platform"];
const DAYS_OPTIONS = [7, 14, 30, 90];
const EVENT_TYPES = [
  { value: "click", label: "Click Map", icon: MousePointer },
  { value: "move", label: "Move Map", icon: MoveHorizontal },
  { value: "scroll", label: "Scroll Map", icon: ArrowDown },
];

function lerp(t: number): string {
  const r = Math.round(50 + t * 205);
  const g = Math.round(50 - t * 30);
  const b = Math.round(200 - t * 180);
  return `rgba(${r},${g},${b},0.7)`;
}

export default function HeatmapViewerPage() {
  const [pagePath, setPagePath] = useState("/");
  const [eventType, setEventType] = useState("click");
  const [days, setDays] = useState(30);
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollCanvasRef = useRef<HTMLCanvasElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ path: pagePath, type: eventType, days: String(days) });
      const r = await fetch(`${API}/api/analytics/heatmap?${params}`, { credentials: "include" });
      if (!r.ok) return;
      const d = await r.json() as { data: HeatmapData };
      setData(d.data || d as unknown as HeatmapData);
    } catch {}
    setLoading(false);
  }, [pagePath, eventType, days]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    drawClickHeatmap();
  }, [data]);

  useEffect(() => {
    if (!data || !scrollCanvasRef.current) return;
    drawScrollMap();
  }, [data]);

  function drawClickHeatmap() {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grid = data.densityGrid;
    const values = Object.values(grid);
    const maxVal = Math.max(...values, 1);
    const gridSize = 20;

    for (const [key, count] of Object.entries(grid)) {
      const [gx, gy] = key.split(",").map(Number);
      const t = count / maxVal;
      ctx.fillStyle = lerp(t);
      ctx.fillRect(
        (gx / (100 / gridSize)) * canvas.width,
        (gy / (100 / gridSize)) * canvas.height * 0.3,
        canvas.width * (gridSize / 100),
        canvas.height * 0.3 * (gridSize / 100),
      );
    }

    if (eventType === "click" && data.rawEvents.length > 0) {
      for (const ev of data.rawEvents.slice(0, 300)) {
        if (ev.xPct !== null && ev.yPct !== null) {
          const cx = (ev.xPct / 100) * canvas.width;
          const cy = Math.min(ev.yPct / 100, 1) * canvas.height;
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,120,0,0.5)";
          ctx.fill();
        }
      }
    }
  }

  function drawScrollMap() {
    const canvas = scrollCanvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scrollMap = data.scrollMap;
    const maxCount = Math.max(...Object.values(scrollMap), 1);
    const buckets = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    const barH = canvas.height / buckets.length;
    for (const bucket of buckets) {
      const count = scrollMap[bucket] ?? 0;
      const t = count / maxCount;
      const barW = t * canvas.width;
      ctx.fillStyle = lerp(t);
      ctx.fillRect(0, (bucket / 100) * canvas.height, barW, barH - 2);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "10px Inter, system-ui";
      ctx.fillText(`${bucket}%`, 4, (bucket / 100) * canvas.height + barH - 6);
    }
  }

  const totalClicks = data?.totalEvents ?? 0;

  return (
    <DistributionOsLayout>
      <div style={{ padding: "2rem", fontFamily: "Inter, system-ui, sans-serif", color: "#e8e4de" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <Flame size={22} style={{ color: "#d4a054" }} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Heatmap Viewer</h1>
            <p style={{ margin: 0, fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)", marginTop: "0.25rem" }}>First-party click, move, and scroll density maps</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" }}>
          <select value={pagePath} onChange={e => setPagePath(e.target.value)} style={{ padding: "0.5rem 0.875rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.375rem", color: "#e8e4de", fontSize: "0.8125rem" }}>
            {PAGE_PATHS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {EVENT_TYPES.map(et => (
              <button key={et.value} onClick={() => setEventType(et.value)} style={{ padding: "0.4rem 0.875rem", background: eventType === et.value ? "rgba(212,160,84,0.15)" : "transparent", border: `1px solid ${eventType === et.value ? "rgba(212,160,84,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: "0.375rem", color: eventType === et.value ? "#d4a054" : "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                {et.label}
              </button>
            ))}
          </div>
          <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ padding: "0.5rem 0.875rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "0.375rem", color: "#e8e4de", fontSize: "0.8125rem" }}>
            {DAYS_OPTIONS.map(d => <option key={d} value={d}>Last {d} days</option>)}
          </select>
          <button onClick={loadData} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "rgba(212,160,84,0.1)", border: "1px solid rgba(212,160,84,0.3)", borderRadius: "0.375rem", color: "#d4a054", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>
            <RefreshCw size={13} /> Refresh
          </button>
          {loading && <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)" }}>Loading…</span>}
          {data && <span style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.35)" }}>{totalClicks.toLocaleString()} events</span>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.75rem", overflow: "hidden" }}>
              <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MousePointer size={14} style={{ color: "#d4a054" }} /> {eventType === "click" ? "Click Density Map" : eventType === "move" ? "Mouse Move Map" : "Scroll Depth Map"} — <code style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{pagePath}</code>
              </div>
              <div style={{ padding: "1rem", position: "relative" }}>
                {data && (Object.keys(data.densityGrid).length > 0 || data.rawEvents.length > 0) ? (
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={400}
                    style={{ width: "100%", borderRadius: "0.5rem", background: "rgba(255,255,255,0.02)" }}
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.3)" }}>
                    <Flame size={32} style={{ marginBottom: "1rem", opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>No heatmap data for this page yet.</p>
                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem" }}>Data is collected automatically when analytics consent is granted.</p>
                  </div>
                )}
              </div>
            </div>

            {eventType === "scroll" && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.75rem", overflow: "hidden" }}>
                <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ArrowDown size={14} style={{ color: "#d4a054" }} /> Scroll Depth Attention Map
                </div>
                <div style={{ padding: "1rem" }}>
                  <canvas ref={scrollCanvasRef} width={700} height={200} style={{ width: "100%", borderRadius: "0.375rem", background: "rgba(255,255,255,0.02)" }} />
                </div>
              </div>
            )}
          </div>

          <div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.75rem", overflow: "hidden" }}>
              <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.8125rem", fontWeight: 700, color: "#e8e4de", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BarChart3 size={14} style={{ color: "#d4a054" }} /> Top Clicked Elements
              </div>
              <div style={{ padding: "0.5rem 0" }}>
                {data?.topElements && data.topElements.length > 0 ? data.topElements.map((el, i) => (
                  <div key={i} style={{ padding: "0.625rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.75rem", color: "#e8e4de", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {el.element.split("::")[1] || el.element}
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{el.tag}</div>
                    </div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#d4a054", flexShrink: 0 }}>{el.count}</div>
                  </div>
                )) : (
                  <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.8125rem" }}>No click data yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DistributionOsLayout>
  );
}
