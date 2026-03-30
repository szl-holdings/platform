import { useState, useEffect, useRef } from "react";
import { Activity, Target, ShieldAlert, BellRing, TrendingUp, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";

const IS_DEMO = import.meta.env.VITE_DEMO_MODE !== "false";

const mockProgram = { name: "SZL Security Readiness Program", overallScore: 78.4, targetScore: 90, status: "active" };
const mockDimensions = [
  { id: 1, name: "Identify", category: "NIST CSF", currentScore: 82, targetScore: 85, assessorName: "J. Chen", lastAssessedAt: "2026-03-01" },
  { id: 2, name: "Protect", category: "NIST CSF", currentScore: 74, targetScore: 85, assessorName: "M. Rodriguez", lastAssessedAt: "2026-02-28" },
  { id: 3, name: "Detect", category: "NIST CSF", currentScore: 79, targetScore: 88, assessorName: "S. Park", lastAssessedAt: "2026-03-10" },
  { id: 4, name: "Respond", category: "NIST CSF", currentScore: 71, targetScore: 85, assessorName: "K. Wilson", lastAssessedAt: "2026-02-20" },
  { id: 5, name: "Recover", category: "NIST CSF", currentScore: 68, targetScore: 80, assessorName: "A. Thompson", lastAssessedAt: "2026-01-15" },
  { id: 6, name: "Access Control", category: "ISO 27001", currentScore: 85, targetScore: 90, assessorName: "J. Chen", lastAssessedAt: "2026-03-05" },
  { id: 7, name: "Operations Security", category: "ISO 27001", currentScore: 77, targetScore: 88, assessorName: "M. Rodriguez", lastAssessedAt: "2026-03-08" },
  { id: 8, name: "CMMC Level 2", category: "CMMC", currentScore: 72, targetScore: 80, assessorName: "S. Park", lastAssessedAt: "2026-02-14" },
];
const mockRisks = [
  { id: 1, severity: "critical", status: "open" },
  { id: 2, severity: "critical", status: "mitigating" },
  { id: 3, severity: "high", status: "open" },
];
const mockAlerts = [
  { id: 1, isRead: false }, { id: 2, isRead: false }, { id: 3, isRead: true },
];

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
      if (progress < 1) { frameRef.current = requestAnimationFrame(animate); }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration, decimals]);
  return count;
}

const cohesivePalette = ["#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16"];

function DimensionBar({ name, score, target, index }: { name: string; score: number; target: number; index: number }) {
  const animatedScore = useAnimatedCounter(score, 1000 + index * 100);
  const gap = target - score;
  const pct = (score / 100) * 100;
  const color = cohesivePalette[Math.min(index, cohesivePalette.length - 1)];
  const statusText = gap <= 0 ? "On Target" : gap <= 15 ? "Near Target" : "Below Target";
  const statusColor = gap <= 0 ? "text-emerald-400" : gap <= 15 ? "text-orange-400" : "text-orange-500/60";
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }} className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-orange-50/80 font-medium text-xs">{name}</span>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] ${statusColor}`}>{statusText}</span>
          <span className="font-bold text-orange-50 w-8 text-right text-xs">{animatedScore}</span>
        </div>
      </div>
      <div className="relative h-1.5 bg-orange-500/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: index * 0.06, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className="absolute inset-y-0 w-0.5 bg-orange-50/20" style={{ left: `${target}%` }} />
      </div>
    </motion.div>
  );
}

export default function ReadinessDashboard() {
  const criticalRisks = IS_DEMO ? mockRisks.filter(r => r.severity === 'critical' && r.status !== 'resolved') : [];
  const unreadAlerts = IS_DEMO ? mockAlerts.filter(a => !a.isRead) : [];
  const sortedDimensions = IS_DEMO ? [...mockDimensions].sort((a, b) => b.currentScore - a.currentScore) : [];
  const overallScore = useAnimatedCounter(IS_DEMO ? mockProgram.overallScore : 0, 1400, 1);

  const chartData = sortedDimensions.map(d => ({ name: d.name.slice(0, 8), score: d.currentScore, target: d.targetScore }));

  if (!IS_DEMO) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-lg font-bold text-orange-50">Readiness Posture</h1>
          <p className="text-orange-400/50 text-xs mt-0.5">NIST CSF · ISO 27001 · CMMC frameworks</p>
        </header>
        <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-10 flex flex-col items-center justify-center text-center gap-3">
          <Target className="w-8 h-8 text-orange-400/40" />
          <p className="text-orange-50/70 text-sm font-medium">No readiness program configured</p>
          <p className="text-orange-400/40 text-xs max-w-sm">Connect your compliance data source or enable simulation mode to view readiness scores and dimension performance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-orange-500/10 border border-orange-500/20 text-orange-400/80">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
        Simulation Data — All scores and metrics shown are illustrative. No real compliance assessments are represented.
      </div>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-display text-lg font-bold text-orange-50">Readiness Posture</h1>
          <p className="text-orange-400/50 text-xs mt-0.5">NIST CSF · ISO 27001 · CMMC frameworks</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl text-orange-50 font-medium flex items-center gap-2 text-xs">
            <Activity className="w-3.5 h-3.5 text-orange-400" />
            <span>{mockProgram.name}</span>
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-4 bg-orange-500/5 border border-orange-500/10 rounded-xl p-6 flex flex-col items-center justify-center"
        >
          <div className="text-xs font-medium text-orange-400/50 flex items-center gap-2 mb-4 self-start">
            <Target className="w-3.5 h-3.5" /> Overall Readiness Score
          </div>
          <div className="text-7xl font-display font-bold text-orange-50 my-4">{overallScore}</div>
          <p className="text-xs text-orange-400/50">out of {mockProgram.targetScore} target</p>
          <div className="w-full grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-orange-500/10">
            <div><div className="text-xs text-orange-400/40 mb-1">Target</div><div className="text-xl font-bold text-orange-50">{mockProgram.targetScore}</div></div>
            <div><div className="text-xs text-orange-400/40 mb-1">Status</div><div className="text-xs font-bold flex items-center gap-1 bg-emerald-500/10 text-emerald-400 w-max px-2.5 py-1 rounded-lg"><ArrowUpRight className="w-3.5 h-3.5" /> On Track</div></div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-8 bg-orange-500/5 border border-orange-500/10 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-orange-50 font-display">Dimension Performance</h3>
            <div className="flex items-center gap-4 text-[10px] text-orange-400/40">
              <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-red-400 inline-block" /> Score</span>
              <span className="flex items-center gap-1.5"><span className="w-0.5 h-3 bg-orange-50/20 inline-block" /> Target</span>
            </div>
          </div>
          <div className="space-y-3">
            {sortedDimensions.slice(0, 6).map((d, i) => (
              <DimensionBar key={d.id} name={d.name} score={d.currentScore} target={d.targetScore} index={i} />
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { delay: 0.25, value: mockDimensions.length, label: "Assessed Dimensions", icon: Target, color: "text-orange-400", bg: "bg-orange-500/10" },
          { delay: 0.35, value: criticalRisks.length, label: "Critical Open Risks", icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10" },
          { delay: 0.45, value: unreadAlerts.length, label: "Unread Alerts", icon: BellRing, color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map(({ delay, value, label, icon: Icon, color, bg }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-5"
          >
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-4`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <div className="text-3xl font-display font-bold text-orange-50">{value}</div>
            <p className="text-xs text-orange-400/50 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-orange-50 mb-4">Score Distribution by Control Domain</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <XAxis dataKey="name" stroke="#f97316" fontSize={9} tick={{ fill: "rgba(251,146,60,0.5)" }} tickLine={false} axisLine={false} />
              <YAxis stroke="#f97316" fontSize={9} tick={{ fill: "rgba(251,146,60,0.5)" }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#09080f', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="score" fill="rgba(239,68,68,0.7)" radius={[3, 3, 0, 0]} name="Score" />
              <Bar dataKey="target" fill="rgba(249,115,22,0.2)" radius={[3, 3, 0, 0]} name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
