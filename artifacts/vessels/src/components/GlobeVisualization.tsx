import { useRef, useEffect, useState } from "react";

interface VesselMarker {
  lat: number;
  lng: number;
  name: string;
  type: "cargo" | "tanker" | "container" | "alert";
  status: "normal" | "anomaly" | "dark";
}

const SAMPLE_VESSELS: VesselMarker[] = [
  { lat: 1.3, lng: 103.8, name: "MV Aurora Star", type: "tanker", status: "anomaly" },
  { lat: 26.2, lng: 56.3, name: "MV Pacific Lion", type: "cargo", status: "normal" },
  { lat: 34.4, lng: 135.3, name: "MT Solaris VII", type: "tanker", status: "normal" },
  { lat: 51.9, lng: 1.3, name: "CMA CGM Atlas", type: "container", status: "normal" },
  { lat: -33.8, lng: 18.4, name: "MV Phantom Drift", type: "cargo", status: "dark" },
  { lat: 37.8, lng: -122.4, name: "Evergreen Tide", type: "container", status: "normal" },
  { lat: -6.1, lng: 106.8, name: "MV Jakarta Reach", type: "cargo", status: "normal" },
  { lat: 22.3, lng: 114.2, name: "OOCL Pioneer", type: "container", status: "normal" },
  { lat: 40.7, lng: -74.0, name: "Atlantic Resolve", type: "tanker", status: "anomaly" },
  { lat: 12.0, lng: 44.0, name: "MV Shadow Runner", type: "cargo", status: "dark" },
  { lat: -34.6, lng: -58.4, name: "MSC Victoria", type: "container", status: "normal" },
  { lat: 35.7, lng: 139.7, name: "NYK Horizon", type: "container", status: "normal" },
  { lat: 25.3, lng: 55.3, name: "Maersk Sentinel", type: "cargo", status: "normal" },
  { lat: 59.3, lng: 18.1, name: "Nordic Frost", type: "tanker", status: "normal" },
  { lat: 4.2, lng: 73.5, name: "MV Indian Pearl", type: "cargo", status: "anomaly" },
];

const TRADE_ROUTES = [
  { from: { lat: 1.3, lng: 103.8 }, to: { lat: 51.9, lng: 1.3 }, name: "Asia-Europe" },
  { from: { lat: 22.3, lng: 114.2 }, to: { lat: 37.8, lng: -122.4 }, name: "Trans-Pacific" },
  { from: { lat: 26.2, lng: 56.3 }, to: { lat: 40.7, lng: -74.0 }, name: "Gulf-Atlantic" },
  { from: { lat: -33.8, lng: 18.4 }, to: { lat: -34.6, lng: -58.4 }, name: "Cape-South America" },
];

function latLngToXY(lat: number, lng: number, cx: number, cy: number, r: number, rotation: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + rotation) * (Math.PI / 180);
  const x3d = r * Math.sin(phi) * Math.cos(theta);
  const y3d = r * Math.cos(phi);
  const z3d = r * Math.sin(phi) * Math.sin(theta);
  return { x: cx + x3d, y: cy - y3d, z: z3d, visible: z3d > -r * 0.1 };
}

export function GlobeVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(40);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const [hoveredVessel, setHoveredVessel] = useState<VesselMarker | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const handleDown = (e: MouseEvent) => { isDragging.current = true; lastX.current = e.clientX; };
    const handleUp = () => { isDragging.current = false; };
    const handleMove = (e: MouseEvent) => {
      if (isDragging.current) {
        rotationRef.current += (e.clientX - lastX.current) * 0.3;
        lastX.current = e.clientX;
      }
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const r = Math.min(cx, cy) * 0.78;

      let found: VesselMarker | null = null;
      for (const v of SAMPLE_VESSELS) {
        const pos = latLngToXY(v.lat, v.lng, cx, cy, r, rotationRef.current);
        if (pos.visible && Math.hypot(pos.x - mx, pos.y - my) < 10) {
          found = v;
          setTooltipPos({ x: pos.x, y: pos.y });
          break;
        }
      }
      setHoveredVessel(found);
    };

    canvas.addEventListener("mousedown", handleDown);
    canvas.addEventListener("mouseup", handleUp);
    canvas.addEventListener("mouseleave", handleUp);
    canvas.addEventListener("mousemove", handleMove);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = Math.min(cx, cy) * 0.78;
      const rot = rotationRef.current;

      if (!isDragging.current) rotationRef.current += 0.06;

      ctx.clearRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.3);
      glow.addColorStop(0, "hsla(192, 50%, 30%, 0.08)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "hsla(210, 25%, 8%, 0.95)";
      ctx.fill();
      ctx.strokeStyle = "hsla(192, 50%, 40%, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = "hsla(192, 40%, 40%, 0.08)";
      ctx.lineWidth = 0.5;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lng = -180; lng <= 180; lng += 3) {
          const p = latLngToXY(lat, lng, cx, cy, r, rot);
          if (p.visible) {
            if (!started) { ctx.moveTo(p.x, p.y); started = true; }
            else ctx.lineTo(p.x, p.y);
          } else { started = false; }
        }
        ctx.stroke();
      }
      for (let lng = -180; lng < 180; lng += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 3) {
          const p = latLngToXY(lat, lng, cx, cy, r, rot);
          if (p.visible) {
            if (!started) { ctx.moveTo(p.x, p.y); started = true; }
            else ctx.lineTo(p.x, p.y);
          } else { started = false; }
        }
        ctx.stroke();
      }

      for (const route of TRADE_ROUTES) {
        const from = latLngToXY(route.from.lat, route.from.lng, cx, cy, r, rot);
        const to = latLngToXY(route.to.lat, route.to.lng, cx, cy, r, rot);
        if (from.visible && to.visible) {
          const midLat = (route.from.lat + route.to.lat) / 2;
          const midLng = (route.from.lng + route.to.lng) / 2;
          const mid = latLngToXY(midLat, midLng, cx, cy, r * 1.08, rot);
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.quadraticCurveTo(mid.x, mid.y, to.x, to.y);
          ctx.strokeStyle = "hsla(192, 70%, 55%, 0.15)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      for (const vessel of SAMPLE_VESSELS) {
        const pos = latLngToXY(vessel.lat, vessel.lng, cx, cy, r, rot);
        if (!pos.visible) continue;

        const depthAlpha = Math.max(0.3, (pos.z + r) / (2 * r));
        let color = "hsla(192, 70%, 55%,";
        let pulseRadius = 3;
        if (vessel.status === "anomaly") { color = "hsla(35, 90%, 55%,"; pulseRadius = 5; }
        if (vessel.status === "dark") { color = "hsla(0, 80%, 55%,"; pulseRadius = 5; }

        const pulse = 1 + Math.sin(Date.now() / 600 + pos.x) * 0.3;

        if (vessel.status !== "normal") {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pulseRadius * pulse * 2, 0, Math.PI * 2);
          ctx.fillStyle = `${color}${depthAlpha * 0.12})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pulseRadius * pulse * (vessel.status === "normal" ? 0.7 : 1), 0, Math.PI * 2);
        ctx.fillStyle = `${color}${depthAlpha * 0.8})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", handleDown);
      canvas.removeEventListener("mouseup", handleUp);
      canvas.removeEventListener("mouseleave", handleUp);
      canvas.removeEventListener("mousemove", handleMove);
    };
  }, []);

  const statusColor = hoveredVessel?.status === "dark" ? "#ef4444" : hoveredVessel?.status === "anomaly" ? "#f59e0b" : "#22d3ee";

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", maxWidth: "560px", margin: "0 auto" }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", cursor: isDragging.current ? "grabbing" : "grab" }}
      />
      {hoveredVessel && (
        <div
          style={{
            position: "absolute",
            left: tooltipPos.x + 14,
            top: tooltipPos.y - 10,
            background: "hsl(210, 25%, 12%)",
            border: `1px solid ${statusColor}33`,
            borderRadius: "8px",
            padding: "10px 14px",
            zIndex: 10,
            pointerEvents: "none",
            minWidth: "180px",
            boxShadow: `0 8px 32px hsla(0,0%,0%,0.4)`,
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: statusColor, fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
            {hoveredVessel.status === "dark" ? "AIS DARK" : hoveredVessel.status === "anomaly" ? "ANOMALY" : "NORMAL"}
          </div>
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f0f0f0" }}>{hoveredVessel.name}</div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "2px" }}>
            {hoveredVessel.type.toUpperCase()} — {hoveredVessel.lat.toFixed(1)}°, {hoveredVessel.lng.toFixed(1)}°
          </div>
        </div>
      )}
      <div style={{ position: "absolute", bottom: "12px", left: "16px", display: "flex", gap: "16px", fontSize: "0.6875rem", fontFamily: "monospace", color: "#6b7280" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", display: "inline-block" }} /> Normal</span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} /> Anomaly</span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} /> AIS Dark</span>
      </div>
    </div>
  );
}
