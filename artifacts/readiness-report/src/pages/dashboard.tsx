import { Shell } from "@/components/layout/shell";
import { usePrograms, useDimensions, useAlerts, useRisks } from "@/hooks/use-readiness";
import { ArrowUpRight, Activity, ShieldAlert, Target, BellRing, CheckCircle2, TrendingUp, RefreshCw, Shield, FileCheck, Clock, AlertCircle, CheckCircle, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { type ComponentType, useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ─── Continuous Compliance Controls (Vanta/Drata-style) ──────────────────────
const controlMonitors = [
  { control: "MFA Enforcement", framework: "SOC 2 CC6.1", status: "passing", lastChecked: "2m ago", automationCoverage: 100 },
  { control: "Encryption at Rest", framework: "ISO 27001 A.10.1", status: "passing", lastChecked: "5m ago", automationCoverage: 100 },
  { control: "Privileged Access Review", framework: "CMMC AC.2.006", status: "failing", lastChecked: "1h ago", automationCoverage: 75 },
  { control: "Audit Log Retention", framework: "SOC 2 CC7.2", status: "passing", lastChecked: "8m ago", automationCoverage: 100 },
  { control: "Vulnerability Scan Cadence", framework: "NIST CSF DE.CM-8", status: "warning", lastChecked: "3h ago", automationCoverage: 88 },
  { control: "Data Classification Tags", framework: "ISO 27001 A.8.2", status: "passing", lastChecked: "12m ago", automationCoverage: 92 },
];

const evidenceRequests = [
  { id: "EVD-241", control: "Pen Test Report", assignee: "Security Team", due: "Mar 31", status: "in-progress", priority: "high" },
  { id: "EVD-240", control: "Vendor Risk Assessment", assignee: "Procurement", due: "Apr 5", status: "not-started", priority: "medium" },
  { id: "EVD-239", control: "Employee Training Certs", assignee: "HR", due: "Apr 12", status: "in-progress", priority: "medium" },
];

const auditReadinessItems = [
  { framework: "SOC 2 Type II", progress: 84, target: "May 2026", status: "On Track" },
  { framework: "ISO 27001", progress: 71, target: "Jul 2026", status: "On Track" },
  { framework: "CMMC Level 2", progress: 58, target: "Sep 2026", status: "At Risk" },
];

function ContinuousCompliancePanel() {
  const passing = controlMonitors.filter(c => c.status === "passing").length;
  const failing = controlMonitors.filter(c => c.status === "failing").length;
  const warning = controlMonitors.filter(c => c.status === "warning").length;
  const total = controlMonitors.length;
  const pct = Math.round((passing / total) * 100);

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-white flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-primary animate-spin [animation-duration:3s]" />
          Continuous Compliance Monitoring
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-emerald-400 font-mono">{passing} passing</span>
          <span className="text-amber-400 font-mono">{warning} warning</span>
          <span className="text-red-400 font-mono">{failing} failing</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white">{pct}%</span>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-1">
          {controlMonitors.map(c => (
            <div key={c.control} className="flex items-center gap-2 py-1">
              {c.status === "passing" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> :
               c.status === "failing" ? <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" /> :
               <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              <div className="min-w-0">
                <p className="text-[11px] text-white/80 truncate">{c.control}</p>
                <p className="text-[9px] text-white/30 font-mono">{c.framework} · {c.lastChecked}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EvidenceCollectionPanel() {
  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-display font-semibold text-white flex items-center gap-2">
        <FileCheck className="w-4 h-4 text-blue-400" />
        Evidence Collection Tracker
      </h3>
      <div className="space-y-3">
        {evidenceRequests.map(e => (
          <div key={e.id} className={`p-3 rounded-xl border ${e.priority === "high" ? "border-red-500/20 bg-red-500/5" : "border-white/5 bg-white/[0.02]"}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/30">{e.id}</span>
                <span className="text-xs font-semibold text-white">{e.control}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${e.status === "in-progress" ? "text-blue-400 bg-blue-400/10" : "text-white/30 bg-white/5"}`}>{e.status}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/40">
              <span>{e.assignee}</span>
              <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Due {e.due}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditReadinessPanel() {
  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-display font-semibold text-white flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        Audit Readiness by Framework
      </h3>
      <div className="space-y-4">
        {auditReadinessItems.map(a => (
          <div key={a.framework}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-white">{a.framework}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-white/40">Target: {a.target}</span>
                <span className={a.status === "On Track" ? "text-emerald-400" : "text-amber-400"}>{a.status}</span>
                <span className="font-bold text-white">{a.progress}%</span>
              </div>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${a.status === "On Track" ? "bg-gradient-to-r from-primary to-emerald-400" : "bg-gradient-to-r from-amber-500 to-yellow-400"}`} style={{ width: `${a.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-white/20 font-mono text-center">Mock Data · Auto-synced from control tests</p>
    </div>
  );
}

function useAnimatedCounter(target: number, duration = 1200, decimals = 0) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = eased * target;
      setCount(decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.round(value));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration, decimals]);

  return count;
}

function ModernGauge({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const animatedValue = useAnimatedCounter(value, 1400, 1);
  const pct = value / max;
  
  const size = 240;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2 + 20;
  const startAngle = -220;
  const endAngle = 40;
  const totalAngle = endAngle - startAngle;
  
  function polarToCart(angle: number, radius: number) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }
  
  function arcPath(start: number, end: number, radius: number) {
    const s = polarToCart(start, radius);
    const e = polarToCart(end, radius);
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  }
  
  const fillAngle = startAngle + totalAngle * pct;
  const scoreColor = pct >= 0.8 ? "#22c55e" : pct >= 0.6 ? "#3b82f6" : pct >= 0.4 ? "#f59e0b" : "#ef4444";
  
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.75}`} className="overflow-visible">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={scoreColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={scoreColor} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <path d={arcPath(startAngle, endAngle, r)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} strokeLinecap="round" />
        {/* Filled arc */}
        <path d={arcPath(startAngle, fillAngle, r)} fill="none" stroke="url(#gaugeGrad)" strokeWidth={stroke} strokeLinecap="round" />
        {/* Center value */}
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize="42" fontWeight="700" fill="white" fontFamily="Outfit, sans-serif">
          {animatedValue}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.5)" fontFamily="Plus Jakarta Sans, sans-serif">
          {label}
        </text>
        {/* Scale ticks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = startAngle + (totalAngle * tick) / 100;
          const inner = polarToCart(angle, r - stroke / 2 - 8);
          const outer = polarToCart(angle, r - stroke / 2 - 2);
          return (
            <line key={tick} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          );
        })}
      </svg>
      <div className="flex items-center gap-3 -mt-2">
        <span className="text-xs text-muted-foreground">0</span>
        <div className="h-px flex-1 bg-white/5 w-20" />
        <span className="text-xs font-semibold" style={{ color: scoreColor }}>{value.toFixed(1)} / {max}</span>
        <div className="h-px flex-1 bg-white/5 w-20" />
        <span className="text-xs text-muted-foreground">{max}</span>
      </div>
    </div>
  );
}

const cohesivePalette = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];

function DimensionBar({ name, score, target, index }: { name: string; score: number; target: number; index: number }) {
  const animatedScore = useAnimatedCounter(score, 1000 + index * 100);
  const gap = target - score;
  const pct = (score / 100) * 100;
  const color = cohesivePalette[Math.min(index, cohesivePalette.length - 1)];
  const statusText = gap <= 0 ? "On Target" : gap <= 15 ? "Near Target" : "Below Target";
  const statusColor = gap <= 0 ? "text-emerald-400" : gap <= 15 ? "text-blue-400" : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-white font-medium">{name}</span>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${statusColor}`}>{statusText}</span>
          <span className="font-bold text-white w-8 text-right">{animatedScore}</span>
        </div>
      </div>
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: index * 0.06, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        {/* Target marker */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white/30"
          style={{ left: `${target}%` }}
        />
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: programs, isLoading: pLoading } = usePrograms();
  const { data: dimensions, isLoading: dLoading } = useDimensions();
  const { data: alerts, isLoading: aLoading } = useAlerts();
  const { data: risks, isLoading: rLoading } = useRisks();

  const isLoading = pLoading || dLoading || aLoading || rLoading;

  if (isLoading) {
    return (
      <Shell>
        <div className="p-8 space-y-8 animate-pulse">
          <div className="h-10 w-72 bg-white/5 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 bg-white/[0.03] rounded-3xl border border-white/5 h-96" />
            <div className="lg:col-span-8 bg-white/[0.03] rounded-3xl border border-white/5 h-96" />
          </div>
        </div>
      </Shell>
    );
  }

  const activeProgram = programs?.[0];
  const criticalRisks = risks?.filter(r => r.severity === 'critical' && r.status !== 'resolved') || [];
  const unreadAlerts = alerts?.filter(a => !a.isRead) || [];
  const sortedDimensions = [...(dimensions || [])].sort((a, b) => b.currentScore - a.currentScore);

  return (
    <Shell>
      <div className="p-6 lg:p-8 pb-20 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Readiness Posture</h1>
            <p className="text-muted-foreground mt-1">NIST CSF · ISO 27001 · CMMC frameworks</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-card border border-white/10 px-4 py-2.5 rounded-xl text-white font-medium shadow-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm">{activeProgram?.name}</span>
            </div>
          </motion.div>
        </header>

        {/* Hero Section: Gauge + Dimensions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Modern Gauge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-4 glass-panel rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none rounded-2xl" />
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4 self-start">
              <Target className="w-4 h-4" /> Overall Score
            </div>

            <ModernGauge value={activeProgram?.overallScore || 0} label="Readiness Index" />

            <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/5">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Target</div>
                <div className="text-xl font-bold text-white">{activeProgram?.targetScore}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <div className="text-sm font-bold flex items-center gap-1 bg-emerald-500/10 text-emerald-400 w-max px-2.5 py-1 rounded-lg">
                  <ArrowUpRight className="w-4 h-4" /> On Track
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dimension Performance Bars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-8 glass-panel rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white font-display">Dimension Performance</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1.5 rounded-full bg-indigo-400 inline-block" /> Score
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-0.5 h-3 bg-white/30 inline-block" /> Target
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {sortedDimensions.map((d, i) => (
                <DimensionBar
                  key={d.id}
                  name={d.name}
                  score={d.currentScore}
                  target={d.targetScore}
                  index={i}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard delay={0.25} value={dimensions?.length || 0} label="Assessed Dimensions" icon={Target} accentColor="text-primary" bg="bg-primary/10" trend="+2 this cycle" />
          <StatCard delay={0.35} value={criticalRisks.length} label="Critical Open Risks" icon={ShieldAlert} accentColor="text-destructive" bg="bg-destructive/10" highlight />
          <StatCard delay={0.45} value={unreadAlerts.length} label="Unread Alerts" icon={BellRing} accentColor="text-amber-400" bg="bg-amber-500/10" />
        </div>

        {/* Continuous Compliance Monitoring */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <ContinuousCompliancePanel />
        </motion.div>

        {/* Evidence + Audit Readiness */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EvidenceCollectionPanel />
          <AuditReadinessPanel />
        </motion.div>
      </div>
    </Shell>
  );
}

function StatCard({ delay, value, label, icon: Icon, accentColor, bg, trend, highlight }: {
  delay: number;
  value: number;
  label: string;
  icon: ComponentType<{ className?: string }>;
  accentColor: string;
  bg: string;
  trend?: string;
  highlight?: boolean;
}) {
  const animatedValue = useAnimatedCounter(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`glass-panel rounded-2xl p-5 ${highlight ? "border-destructive/20" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${accentColor}`} />
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-display font-bold text-white">{animatedValue}</div>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}
