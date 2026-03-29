import { Shell } from "@/components/layout/shell";
import { Gauge } from "@/components/ui/gauge";
import { usePrograms, useDimensions, useAlerts, useRisks } from "@/hooks/use-readiness";
import { Loader2, ArrowUpRight, ArrowDownRight, Activity, ShieldAlert, Target, BellRing } from "lucide-react";
import { motion } from "framer-motion";
import { type ComponentType } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useState, useEffect, useRef } from "react";

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

export default function Dashboard() {
  const { data: programs, isLoading: pLoading } = usePrograms();
  const { data: dimensions, isLoading: dLoading } = useDimensions();
  const { data: alerts, isLoading: aLoading } = useAlerts();
  const { data: risks, isLoading: rLoading } = useRisks();

  const isLoading = pLoading || dLoading || aLoading || rLoading;

  if (isLoading) {
    return (
      <Shell>
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground animate-pulse">Loading readiness data...</span>
          </div>
        </div>
      </Shell>
    );
  }

  const activeProgram = programs?.[0];
  const criticalRisks = risks?.filter(r => r.severity === 'critical' && r.status !== 'resolved') || [];
  const unreadAlerts = alerts?.filter(a => !a.isRead) || [];
  
  const chartData = dimensions?.map(d => ({
    name: d.name,
    score: d.currentScore,
    target: d.targetScore,
    shortName: d.category.charAt(0).toUpperCase() + d.category.slice(1)
  })).sort((a, b) => b.score - a.score) || [];

  return (
    <Shell>
      <div className="p-8 pb-20 space-y-8">
        <header className="flex items-end justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-display font-bold text-white tracking-tight">Readiness Posture</h1>
            <p className="text-muted-foreground mt-2 text-lg">Organizational readiness across NIST CSF, ISO 27001, and CMMC frameworks.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-right">
            <div className="text-sm font-medium text-muted-foreground mb-1">Active Program</div>
            <div className="bg-card border border-white/10 px-4 py-2 rounded-xl text-white font-medium shadow-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {activeProgram?.name}
            </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-4 glass-panel rounded-3xl p-8 flex flex-col items-center justify-center glow-effect relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            <div className="absolute top-4 left-4 text-sm font-medium text-muted-foreground flex items-center gap-2 z-10">
              <Target className="w-4 h-4" /> Overall Score
            </div>
            
            <div className="mt-8 mb-4 relative z-10">
              <Gauge value={activeProgram?.overallScore || 0} size={280} label="Readiness Index" strokeWidth={24} />
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mt-4 pt-6 border-t border-white/5 relative z-10">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Target</div>
                <div className="text-xl font-bold text-white">{activeProgram?.targetScore}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <div className="text-sm font-bold text-success flex items-center gap-1 bg-success/10 w-max px-2 py-1 rounded-md">
                  <ArrowUpRight className="w-4 h-4" /> On Track
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-8 glass-panel rounded-3xl p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white font-display">Dimension Performance</h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-primary" /> Meets Tier Target</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(38, 92%, 50%)' }} /> Near Target</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-destructive" /> Below Tier Target</span>
              </div>
            </div>
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="shortName" 
                    stroke="rgba(255,255,255,0.3)" 
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: number, name: string) => [value, name === 'score' ? 'Current Score' : name]}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={40} animationDuration={1200} animationEasing="ease-out">
                    {chartData.map((entry, index) => {
                      const gap = entry.target - entry.score;
                      const color = gap <= 0 ? 'hsl(var(--primary))' : gap <= 15 ? 'hsl(38, 92%, 50%)' : 'hsl(var(--destructive))';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedStatCard 
            delay={0.25} 
            value={dimensions?.length || 0} 
            label="Assessed Dimensions" 
            icon={Target} 
            trend="+2.4" 
            trendColor="text-success"
            glowColor="bg-primary/10"
          />
          <AnimatedStatCard 
            delay={0.35} 
            value={criticalRisks.length} 
            label="Critical Open Risks" 
            icon={ShieldAlert} 
            accentBorder="border-l-2 border-l-destructive"
            glowColor="bg-destructive/10"
            iconColor="text-destructive"
          />
          <AnimatedStatCard 
            delay={0.45} 
            value={unreadAlerts.length} 
            label="Unread Alerts" 
            icon={BellRing}
            glowColor="bg-warning/10"
            iconColor="text-warning"
          />
        </div>
      </div>
    </Shell>
  );
}

function AnimatedStatCard({ delay, value, label, icon: Icon, trend, trendColor, accentBorder, glowColor, iconColor = "text-primary" }: {
  delay: number; value: number; label: string; icon: ComponentType<{ className?: string }>; trend?: string; trendColor?: string; accentBorder?: string; glowColor: string; iconColor?: string;
}) {
  const animatedValue = useAnimatedCounter(value);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay }}
      className={`glass-panel rounded-2xl p-6 relative overflow-hidden ${accentBorder || ''}`}
    >
      <div className={`absolute right-0 top-0 w-24 h-24 ${glowColor} rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2`} />
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center">
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <span className={`text-xs font-bold ${trendColor} flex items-center gap-1 bg-success/10 px-2 py-1 rounded-md`}>
            <ArrowUpRight className="w-3 h-3"/> {trend}
          </span>
        )}
      </div>
      <h4 className="text-3xl font-display font-bold text-white">{animatedValue}</h4>
      <p className="text-sm text-muted-foreground mt-1 font-medium">{label}</p>
    </motion.div>
  );
}
