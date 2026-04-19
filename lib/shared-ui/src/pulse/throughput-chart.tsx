import { useState, useEffect } from "react";

export function PulseThroughputChart({ color = "#d4a054", label = "Throughput" }: { color?: string; label?: string }) {
  const [dataPoints, setDataPoints] = useState<number[]>(() => Array.from({ length: 30 }, () => Math.random() * 60 + 20));
  useEffect(() => {
    const timer = setInterval(() => setDataPoints(prev => [...prev.slice(1), Math.random() * 60 + 20]), 1500);
    return () => clearInterval(timer);
  }, []);
  const max = Math.max(...dataPoints, 1);
  const w = 400, h = 80;
  const points = dataPoints.map((v, i) => `${(i / (dataPoints.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`tp-fill-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`tp-stroke-${color.replace("#","")}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="50%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#tp-fill-${color.replace("#","")})`} />
      <polyline points={points} fill="none" stroke={`url(#tp-stroke-${color.replace("#","")})`} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={w} cy={h - (dataPoints[dataPoints.length - 1]! / max) * h} r="3" fill={color}>
        <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
