import { useEffect, useRef, useState } from "react";
import type { LensId } from "./living-graph";

const LENS_SCORES: Record<LensId, number> = {
  all: 74,
  financial: 82,
  operational: 61,
  growth: 79,
  sentiment: 88,
  compliance: 68,
  talent: 85,
  market: 73,
};

const LENS_LABELS: Record<LensId, string> = {
  all: "Ecosystem",
  financial: "Financial",
  operational: "Operational",
  growth: "Growth",
  sentiment: "Sentiment",
  compliance: "Compliance",
  talent: "Talent",
  market: "Market",
};

function getPostureColor(score: number): { primary: string; glow: string; label: string } {
  if (score >= 85) return { primary: "#e8e8e8", glow: "rgba(232,232,232,0.3)", label: "PLATINUM" };
  if (score >= 75) return { primary: "#fbbf24", glow: "rgba(251,191,36,0.3)", label: "GOLD" };
  if (score >= 60) return { primary: "#fb923c", glow: "rgba(251,146,60,0.3)", label: "AMBER" };
  if (score >= 40) return { primary: "#ef4444", glow: "rgba(239,68,68,0.3)", label: "CRITICAL" };
  return { primary: "#dc2626", glow: "rgba(220,38,38,0.4)", label: "CRITICAL" };
}

interface CommandPostureRingProps {
  activeLens: LensId;
  onDrillDown?: (lens: LensId) => void;
}

export function CommandPostureRing({ activeLens, onDrillDown }: CommandPostureRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const score = LENS_SCORES[activeLens] ?? 74;
  const { primary, glow, label } = getPostureColor(score);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 160;
    canvas.height = 160;
    const cx = 80, cy = 80, r = 62;

    const targetScore = score / 100;
    let currentScore = 0;
    let lastTime = performance.now();

    const draw = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      timeRef.current += dt;
      const t = timeRef.current;

      currentScore += (targetScore - currentScore) * 0.04;

      ctx.clearRect(0, 0, 160, 160);

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 8;
      ctx.stroke();

      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const tickProgress = i / 60;
        if (tickProgress > currentScore) continue;

        const colorProgress = tickProgress / currentScore;
        let tickColor = primary;
        if (score < 75) {
          const r2 = Math.round(239 * colorProgress + 251 * (1 - colorProgress));
          const g2 = Math.round(68 * colorProgress + 146 * (1 - colorProgress));
          const b2 = Math.round(68 * colorProgress + 60 * (1 - colorProgress));
          tickColor = `rgb(${r2},${g2},${b2})`;
        }

        const x1 = cx + (r - 6) * Math.cos(angle);
        const y1 = cy + (r - 6) * Math.sin(angle);
        const x2 = cx + (r + 6) * Math.cos(angle);
        const y2 = cy + (r + 6) * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = tickColor;
        ctx.lineWidth = i % 5 === 0 ? 2.5 : 1;
        ctx.globalAlpha = 0.5 + colorProgress * 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      const pulseSpeed = score >= 85 ? 0.4 : score >= 60 ? 1.2 : 2.5;
      const pulse = Math.sin(t * pulseSpeed) * 0.15 + 0.85;

      const arcEnd = currentScore * Math.PI * 2 - Math.PI / 2;
      const arcGrd = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
      arcGrd.addColorStop(0, primary + "40");
      arcGrd.addColorStop(1, primary);

      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, arcEnd);
      ctx.strokeStyle = arcGrd;
      ctx.lineWidth = 4;
      ctx.shadowColor = glow.replace("0.3", "0.8");
      ctx.shadowBlur = 12 * pulse;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = `rgba(255,255,255,${0.85 * pulse})`;
      ctx.font = "bold 26px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(Math.round(currentScore * 100).toString(), cx, cy - 6);

      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px 'Inter', sans-serif";
      ctx.fillText(label, cx, cy + 14);

      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "8px 'Inter', sans-serif";
      ctx.fillText(LENS_LABELS[activeLens], cx, cy + 26);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [score, primary, glow, label, activeLens]);

  const allLenses: LensId[] = ["financial", "operational", "growth", "sentiment", "compliance", "talent", "market"];

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative cursor-pointer group"
        title="Command Posture Ring — Click to drill down"
        onClick={() => onDrillDown?.(activeLens)}
      >
        <canvas ref={canvasRef} style={{ width: 160, height: 160 }} />
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <span className="text-[9px] text-white/60 uppercase tracking-widest">Drill down</span>
        </div>
      </div>

      <div className="w-full space-y-1">
        {allLenses.map(lens => {
          const s = LENS_SCORES[lens]!;
          const { primary: lp } = getPostureColor(s);
          const isActive = activeLens === lens;
          return (
            <div
              key={lens}
              className="flex items-center gap-2 cursor-pointer hover:bg-white/3 rounded px-1 py-0.5 transition-colors"
              onClick={() => onDrillDown?.(lens)}
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[8px] uppercase tracking-widest" style={{ color: isActive ? lp : "rgba(255,255,255,0.35)" }}>
                    {LENS_LABELS[lens]}
                  </span>
                  <span className="text-[8px] font-mono font-bold" style={{ color: lp }}>{s}</span>
                </div>
                <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s}%`, background: lp }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
