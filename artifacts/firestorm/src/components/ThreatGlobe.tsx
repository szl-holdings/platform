import { useRef, useEffect, useState } from "react";

interface ThreatOrigin {
  lat: number;
  lng: number;
  name: string;
  type: "apt" | "ransomware" | "ddos" | "phishing" | "insider";
  severity: "critical" | "high" | "medium";
  actor?: string;
}

const THREAT_ORIGINS: ThreatOrigin[] = [
  { lat: 55.7, lng: 37.6, name: "Moscow", type: "apt", severity: "critical", actor: "APT-29 (Cozy Bear)" },
  { lat: 39.9, lng: 116.4, name: "Beijing", type: "apt", severity: "critical", actor: "APT-41 (Winnti)" },
  { lat: 35.7, lng: 51.4, name: "Tehran", type: "apt", severity: "high", actor: "APT-33 (Elfin)" },
  { lat: 39.0, lng: 125.8, name: "Pyongyang", type: "ransomware", severity: "critical", actor: "Lazarus Group" },
  { lat: 14.6, lng: 121.0, name: "Manila", type: "phishing", severity: "medium" },
  { lat: -23.5, lng: -46.6, name: "São Paulo", type: "ransomware", severity: "high" },
  { lat: 48.9, lng: 2.3, name: "Paris", type: "ddos", severity: "medium" },
  { lat: 33.3, lng: 44.4, name: "Baghdad", type: "insider", severity: "high" },
  { lat: 19.4, lng: -99.1, name: "Mexico City", type: "phishing", severity: "medium" },
  { lat: 6.5, lng: 3.4, name: "Lagos", type: "phishing", severity: "high" },
  { lat: 50.4, lng: 30.5, name: "Kyiv", type: "ddos", severity: "medium" },
  { lat: 28.6, lng: 77.2, name: "New Delhi", type: "ransomware", severity: "medium" },
];

const DEFENSE_TARGETS = [
  { lat: 38.9, lng: -77.0, name: "Washington D.C." },
  { lat: 51.5, lng: -0.1, name: "London" },
  { lat: 35.7, lng: 139.7, name: "Tokyo" },
  { lat: 1.3, lng: 103.8, name: "Singapore" },
];

function latLngToXY(lat: number, lng: number, cx: number, cy: number, r: number, rotation: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + rotation) * (Math.PI / 180);
  const x3d = r * Math.sin(phi) * Math.cos(theta);
  const y3d = r * Math.cos(phi);
  const z3d = r * Math.sin(phi) * Math.sin(theta);
  return { x: cx + x3d, y: cy - y3d, z: z3d, visible: z3d > -r * 0.1 };
}

export function ThreatGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(-20);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const [hovered, setHovered] = useState<ThreatOrigin | null>(null);
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
      let found: ThreatOrigin | null = null;
      for (const t of THREAT_ORIGINS) {
        const pos = latLngToXY(t.lat, t.lng, cx, cy, r, rotationRef.current);
        if (pos.visible && Math.hypot(pos.x - mx, pos.y - my) < 12) {
          found = t;
          setTooltipPos({ x: pos.x, y: pos.y });
          break;
        }
      }
      setHovered(found);
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

      if (!isDragging.current) rotationRef.current += 0.04;

      ctx.clearRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.4);
      glow.addColorStop(0, "hsla(0, 50%, 20%, 0.06)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "hsla(220, 25%, 6%, 0.95)";
      ctx.fill();
      ctx.strokeStyle = "hsla(0, 60%, 40%, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.strokeStyle = "hsla(0, 40%, 40%, 0.06)";
      ctx.lineWidth = 0.5;
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;
        for (let lng = -180; lng <= 180; lng += 3) {
          const p = latLngToXY(lat, lng, cx, cy, r, rot);
          if (p.visible) { if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y); }
          else started = false;
        }
        ctx.stroke();
      }
      for (let lng = -180; lng < 180; lng += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 3) {
          const p = latLngToXY(lat, lng, cx, cy, r, rot);
          if (p.visible) { if (!started) { ctx.moveTo(p.x, p.y); started = true; } else ctx.lineTo(p.x, p.y); }
          else started = false;
        }
        ctx.stroke();
      }

      for (const target of DEFENSE_TARGETS) {
        const pos = latLngToXY(target.lat, target.lng, cx, cy, r, rot);
        if (!pos.visible) continue;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(192, 70%, 55%, 0.6)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = "hsla(192, 70%, 55%, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const time = Date.now();
      for (const threat of THREAT_ORIGINS) {
        const from = latLngToXY(threat.lat, threat.lng, cx, cy, r, rot);
        if (!from.visible) continue;

        const color = threat.severity === "critical" ? "hsla(0, 80%, 55%," : threat.severity === "high" ? "hsla(35, 90%, 55%," : "hsla(45, 70%, 55%,";
        const pulse = 1 + Math.sin(time / 500 + from.x) * 0.4;
        const baseSize = threat.severity === "critical" ? 5 : threat.severity === "high" ? 4 : 3;

        ctx.beginPath();
        ctx.arc(from.x, from.y, baseSize * pulse * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `${color}0.06)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(from.x, from.y, baseSize * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `${color}0.7)`;
        ctx.fill();

        for (const target of DEFENSE_TARGETS) {
          const to = latLngToXY(target.lat, target.lng, cx, cy, r, rot);
          if (!to.visible) continue;
          const progress = ((time / 3000 + from.x * 0.01) % 1);
          const ax = from.x + (to.x - from.x) * progress;
          const ay = from.y + (to.y - from.y) * progress;

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = `${color}0.04)`;
          ctx.lineWidth = 0.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(ax, ay, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `${color}0.5)`;
          ctx.fill();
        }
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

  const sevColor = hovered?.severity === "critical" ? "#ef4444" : hovered?.severity === "high" ? "#f59e0b" : "#eab308";

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", maxWidth: "560px", margin: "0 auto" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", cursor: isDragging.current ? "grabbing" : "grab" }} />
      {hovered && (
        <div style={{
          position: "absolute", left: tooltipPos.x + 14, top: tooltipPos.y - 10,
          background: "hsl(220, 25%, 10%)", border: `1px solid ${sevColor}33`,
          borderRadius: "8px", padding: "10px 14px", zIndex: 10, pointerEvents: "none", minWidth: "200px",
          boxShadow: `0 8px 32px hsla(0,0%,0%,0.5)`,
        }}>
          <div style={{ fontSize: "0.625rem", fontWeight: 700, color: sevColor, fontFamily: "monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
            {hovered.severity} — {hovered.type.toUpperCase()}
          </div>
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f0f0f0" }}>{hovered.name}</div>
          {hovered.actor && <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "2px" }}>{hovered.actor}</div>}
        </div>
      )}
      <div style={{ position: "absolute", bottom: "12px", left: "16px", display: "flex", gap: "16px", fontSize: "0.6875rem", fontFamily: "monospace", color: "#6b7280" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} /> Critical</span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} /> High</span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22d3ee", display: "inline-block" }} /> Defense Node</span>
      </div>
    </div>
  );
}
