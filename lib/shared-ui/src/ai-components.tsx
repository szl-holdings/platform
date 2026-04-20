import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = '/api';

export function useStreamingText(endpoint: string, body: Record<string, unknown>) {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(() => {
    setText('');
    setError(null);
    setIsDone(false);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('text/event-stream') && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const payload = line.slice(6).trim();
                if (payload === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(payload);
                  const token =
                    parsed.choices?.[0]?.delta?.content || parsed.token || parsed.content || '';
                  if (token) setText((p) => p + token);
                } catch {}
              }
            }
          }
        } else {
          const json = await res.json();
          setText(json.content || json.text || JSON.stringify(json));
        }
        setIsDone(true);
        setIsStreaming(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setIsStreaming(false);
        }
      });
  }, [endpoint, JSON.stringify(body)]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { text, isStreaming, error, isDone, start, stop };
}

export function StreamingText({
  text,
  isStreaming,
  className = '',
}: {
  text: string;
  isStreaming: boolean;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <span className="whitespace-pre-wrap">{text}</span>
      {isStreaming && (
        <span className="inline-block w-2 h-5 ml-0.5 bg-current animate-pulse rounded-sm align-text-bottom" />
      )}
    </div>
  );
}

export function TypewriterText({
  text,
  speed = 20,
  className = '',
  onComplete,
}: {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span className={className}>
      {displayed}
      {!done && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm align-text-bottom" />
      )}
    </span>
  );
}

const ENTITY_COLORS: Record<string, string> = {
  PER: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  ORG: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  LOC: 'bg-[#6b8f71]/20 text-[#6b8f71] border-[#6b8f71]/30',
  MISC: 'bg-[#d4a054]/20 text-[#d4a054] border-[#d4a054]/30',
  DATE: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  MONEY: 'bg-green-500/20 text-green-300 border-green-500/30',
  GPE: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export function NERHighlight({
  text,
  entities,
  className = '',
}: {
  text: string;
  entities: Array<{ entity: string; word: string; start: number; end: number; score: number }>;
  className?: string;
}) {
  if (!entities?.length) return <span className={className}>{text}</span>;

  const sorted = [...entities].sort((a, b) => a.start - b.start);
  const parts: ReactNode[] = [];
  let last = 0;

  sorted.forEach((ent, i) => {
    if (ent.start > last) {
      parts.push(<span key={`t-${i}`}>{text.slice(last, ent.start)}</span>);
    }
    const colorClass = ENTITY_COLORS[ent.entity] || ENTITY_COLORS.MISC;
    parts.push(
      <span
        key={`e-${i}`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium cursor-help transition-all hover:scale-105 ${colorClass}`}
        title={`${ent.entity} (${(ent.score * 100).toFixed(0)}%)`}
      >
        {text.slice(ent.start, ent.end)}
        <span className="text-[9px] opacity-60 uppercase">{ent.entity}</span>
      </span>,
    );
    last = ent.end;
  });

  if (last < text.length) {
    parts.push(<span key="tail">{text.slice(last)}</span>);
  }

  return <span className={`leading-relaxed ${className}`}>{parts}</span>;
}

export function AnimatedGauge({
  value,
  max = 100,
  label,
  color = 'cyan',
  size = 120,
}: {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  size?: number;
}) {
  const [animated, setAnimated] = useState(0);
  const pct = Math.min(value / max, 1);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75;

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / 1200, 1);
      const eased = 1 - (1 - p) ** 3;
      setAnimated(eased * pct);
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [pct]);

  const colorMap: Record<string, string> = {
    cyan: '#06b6d4',
    red: '#c45a4a',
    orange: '#c8953c',
    emerald: '#6b8f71',
    violet: '#8b7ac8',
    blue: '#4a90b8',
  };
  const strokeColor = colorMap[color] || colorMap.cyan;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.8} viewBox={`0 0 ${size} ${size * 0.85}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={8}
          strokeDasharray={`${arcLen} ${circ - arcLen}`}
          strokeDashoffset={-circ * 0.125}
          strokeLinecap="round"
          transform={`rotate(0 ${size / 2} ${size / 2})`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={8}
          strokeDasharray={`${arcLen * animated} ${circ - arcLen * animated}`}
          strokeDashoffset={-circ * 0.125}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${strokeColor}40)`,
            transition: 'stroke-dasharray 0.3s',
          }}
        />
        <text
          x={size / 2}
          y={size / 2 + 4}
          textAnchor="middle"
          fill="white"
          fontSize={size * 0.22}
          fontWeight="bold"
          fontFamily="system-ui"
        >
          {Math.round(value)}
        </text>
      </svg>
      {label && <span className="text-xs text-slate-400 text-center">{label}</span>}
    </div>
  );
}

export function AnomalySparkline({
  data,
  anomalyIndices = [],
  width = 200,
  height = 40,
  color = '#06b6d4',
}: {
  data: number[];
  anomalyIndices?: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`)
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {anomalyIndices.map((idx) => {
        if (idx >= data.length) return null;
        const x = idx * step;
        const y = height - ((data[idx]! - min) / range) * (height - 4) - 2;
        return (
          <g key={idx}>
            <circle cx={x} cy={y} r={4} fill="none" stroke="#c45a4a" strokeWidth={2}>
              <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite" />
              <animate
                attributeName="opacity"
                values="1;0.4;1"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={x} cy={y} r={2} fill="#c45a4a" />
          </g>
        );
      })}
    </svg>
  );
}

export function SeverityMeter({
  level,
  score,
  label,
}: {
  level: 'critical' | 'high' | 'medium' | 'low';
  score: number;
  label?: string;
}) {
  const [animated, setAnimated] = useState(0);
  const colors = { critical: '#c45a4a', high: '#c8953c', medium: '#d4a054', low: '#6b8f71' };
  const fillColor = colors[level] || colors.medium;

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / 1000, 1);
      setAnimated((1 - (1 - p) ** 3) * score);
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-xs text-slate-400 w-16 shrink-0">{label}</span>}
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${animated}%`,
            backgroundColor: fillColor,
            boxShadow: `0 0 8px ${fillColor}40`,
          }}
        />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color: fillColor }}>
        {Math.round(animated)}%
      </span>
    </div>
  );
}

export function ShimmerReveal({
  isLoading,
  children,
  className = '',
}: {
  isLoading: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="shimmer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function RiskPill({
  score,
  label,
  tooltip,
}: {
  score: number;
  label?: string;
  tooltip?: string;
}) {
  const color =
    score >= 80
      ? 'bg-red-500/15 text-[#c45a4a] border-red-500/30'
      : score >= 60
        ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
        : score >= 40
          ? 'bg-[#d4a054]/15 text-[#d4a054] border-[#d4a054]/30'
          : 'bg-[#6b8f71]/15 text-[#6b8f71] border-[#6b8f71]/30';

  const dotColor =
    score >= 80
      ? 'bg-red-500'
      : score >= 60
        ? 'bg-orange-500'
        : score >= 40
          ? 'bg-[#d4a054]'
          : 'bg-[#6b8f71]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-help transition-all hover:scale-105 ${color}`}
      title={tooltip}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColor} ${score >= 70 ? 'animate-pulse' : ''}`}
      />
      {label && <span>{label}</span>}
      <span className="font-mono font-bold">{score}</span>
    </span>
  );
}

export function ChatBubble({
  role,
  content,
  isStreaming = false,
}: {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`p-3 rounded-2xl text-sm max-w-[85%] ${
        role === 'user'
          ? 'bg-primary/15 text-foreground ml-auto rounded-br-sm'
          : 'bg-white/5 border border-white/10 mr-auto rounded-bl-sm'
      }`}
    >
      <span className="whitespace-pre-wrap">{content}</span>
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm align-text-bottom" />
      )}
    </motion.div>
  );
}
