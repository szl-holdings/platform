import { Shell } from "@/components/layout/shell";
import { useDimensions } from "@/hooks/use-readiness";
import { Loader2, Target, Calendar, User, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function Scorecards() {
  const { data: dimensions, isLoading } = useDimensions();

  if (isLoading) {
    return (
      <Shell>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  const chartData = dimensions?.map(d => ({
    subject: d.name.split(' ')[0], // Short name for radar
    score: d.currentScore,
    target: d.targetScore,
    fullMark: 100,
  })) || [];

  return (
    <Shell>
      <div className="p-8 pb-20 space-y-8">
        <header>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Domain Scorecards</h1>
          <p className="text-muted-foreground mt-2 text-lg">Detailed breakdown across all maturity dimensions.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="xl:col-span-1 glass-panel rounded-3xl p-6 flex flex-col items-center justify-center"
          >
            <h3 className="text-lg font-semibold text-white mb-6 font-display w-full text-left">Portfolio Radar</h3>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                  <Radar name="Target" dataKey="target" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm font-medium">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary/50 border border-primary"></div> Current Score</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-muted-foreground/20 border border-muted-foreground"></div> Target</div>
            </div>
          </motion.div>

          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {dimensions?.map((dim, i) => (
              <motion.div 
                key={dim.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-panel rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-300 group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">{dim.category}</div>
                    <h3 className="text-lg font-bold text-white font-display leading-tight">{dim.name}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-full border-[4px] flex items-center justify-center font-bold text-sm"
                    style={{ borderColor: dim.currentScore >= dim.targetScore ? 'hsl(var(--primary))' : 'hsl(var(--warning))' }}>
                    {dim.currentScore}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress to Target ({dim.targetScore})</span>
                      <span>{Math.round((dim.currentScore / dim.targetScore) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ 
                          width: `${Math.min((dim.currentScore / dim.targetScore) * 100, 100)}%`,
                          backgroundColor: dim.currentScore >= dim.targetScore ? 'hsl(var(--primary))' : 'hsl(var(--warning))'
                        }} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      <span className="truncate max-w-[100px]">{dim.assessorName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(dim.lastAssessedAt), 'MMM d, yy')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}
