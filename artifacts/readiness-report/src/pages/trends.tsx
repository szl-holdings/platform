import { Shell } from "@/components/layout/shell";
import { useScoreHistory, useDimensions } from "@/hooks/use-readiness";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from "date-fns";

export default function Trends() {
  const { data: history, isLoading: hLoading } = useScoreHistory();
  const { data: dimensions, isLoading: dLoading } = useDimensions();

  const isLoading = hLoading || dLoading;

  if (isLoading) {
    return (
      <Shell>
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground animate-pulse">Analyzing trends...</span>
          </div>
        </div>
      </Shell>
    );
  }

  const dateMap = new Map<string, any>();
  
  history?.forEach(h => {
    const dateStr = format(new Date(h.recordedAt), 'MMM dd');
    if (!dateMap.has(dateStr)) {
      dateMap.set(dateStr, { name: dateStr });
    }
    const entry = dateMap.get(dateStr);
    const dim = dimensions?.find(d => d.id === h.dimensionId);
    if (dim) {
      entry[dim.name] = h.score;
    }
  });

  const chartData = Array.from(dateMap.values()).reverse();
  
  const topDims = dimensions?.slice(0, 3) || [];
  const colors = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];
  const colorNames = ['text-primary', 'text-warning', 'text-destructive'];

  return (
    <Shell>
      <div className="p-8 pb-20 space-y-8">
        <header className="flex items-end justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-display font-bold text-white tracking-tight">Maturity Trajectory</h1>
            <p className="text-muted-foreground mt-2 text-lg">NIST CSF tier progression and control maturity trends over assessment cycles.</p>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topDims.map((d, i) => {
            const latestScores = history?.filter(h => h.dimensionId === d.id).sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
            const latest = latestScores?.[0]?.score || d.currentScore;
            const prev = latestScores?.[1]?.score || latest;
            const diff = latest - prev;

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel rounded-2xl p-5 relative overflow-hidden"
              >
                <div className={`absolute right-0 top-0 w-16 h-16 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none`} style={{ backgroundColor: colors[i], opacity: 0.1 }} />
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />
                  <span className="text-sm text-muted-foreground font-medium truncate">{d.name}</span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-display font-bold text-white">{latest}</span>
                  <div className={`flex items-center gap-0.5 text-xs font-semibold mb-1 ${diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel rounded-3xl p-8"
        >
          <h3 className="text-xl font-bold text-white font-display mb-8">Score Trajectory (Key Dimensions)</h3>
          
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  {topDims.map((d, i) => (
                    <linearGradient key={`color-${i}`} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[i]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={colors[i]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
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
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                {topDims.map((d, i) => (
                  <Area 
                    key={d.id}
                    type="monotone" 
                    dataKey={d.name} 
                    stroke={colors[i]} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill={`url(#color-${i})`}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {topDims.map((d, i) => (
              <div key={d.id} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }}></div>
                {d.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Shell>
  );
}
