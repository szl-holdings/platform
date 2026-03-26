import { Shell } from "@/components/layout/shell";
import { Gauge } from "@/components/ui/gauge";
import { usePrograms, useDimensions, useAlerts, useRisks } from "@/hooks/use-readiness";
import { Loader2, ArrowUpRight, ArrowDownRight, Activity, ShieldAlert, Target, BellRing } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  const activeProgram = programs?.[0];
  const criticalRisks = risks?.filter(r => r.severity === 'critical' && r.status !== 'resolved') || [];
  const unreadAlerts = alerts?.filter(a => !a.isRead) || [];
  
  // Sort dimensions by score for the bar chart
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
          <div>
            <h1 className="text-4xl font-display font-bold text-white tracking-tight">Portfolio Readiness</h1>
            <p className="text-muted-foreground mt-2 text-lg">Executive overview of active transformation programs.</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-muted-foreground mb-1">Active Context</div>
            <div className="bg-card border border-white/10 px-4 py-2 rounded-xl text-white font-medium shadow-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {activeProgram?.name}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Gauge Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-4 glass-panel rounded-3xl p-8 flex flex-col items-center justify-center glow-effect relative overflow-hidden"
          >
            <div className="absolute top-4 left-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" /> Overall Score
            </div>
            
            <div className="mt-8 mb-4">
              <Gauge value={activeProgram?.overallScore || 0} size={280} label="Readiness Index" strokeWidth={24} />
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mt-4 pt-6 border-t border-white/5">
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

          {/* Dimension Breakdown Chart */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-8 glass-panel rounded-3xl p-6 flex flex-col"
          >
            <h3 className="text-lg font-semibold text-white mb-6 font-display">Dimension Performance</h3>
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
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= entry.target ? 'hsl(var(--primary))' : 'hsl(var(--warning))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Bottom stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-bold text-success flex items-center gap-1 bg-success/10 px-2 py-1 rounded-md"><ArrowUpRight className="w-3 h-3"/> +2.4</span>
            </div>
            <h4 className="text-3xl font-display font-bold text-white">{dimensions?.length || 0}</h4>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Assessed Dimensions</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel rounded-2xl p-6 relative overflow-hidden border-l-2 border-l-destructive">
            <div className="absolute right-0 top-0 w-24 h-24 bg-destructive/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <h4 className="text-3xl font-display font-bold text-white">{criticalRisks.length}</h4>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Critical Open Risks</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-warning/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-card border border-white/10 flex items-center justify-center">
                <BellRing className="w-6 h-6 text-warning" />
              </div>
            </div>
            <h4 className="text-3xl font-display font-bold text-white">{unreadAlerts.length}</h4>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Unread Alerts</p>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}
