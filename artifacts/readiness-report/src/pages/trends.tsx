import { Shell } from "@/components/layout/shell";
import { useScoreHistory, useDimensions } from "@/hooks/use-readiness";
import { Loader2 } from "lucide-react";
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
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  // Process data for charts
  // Create a map of dates to scores for each dimension
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

  const chartData = Array.from(dateMap.values()).reverse(); // Sort oldest to newest roughly
  
  // Pick top 3 dimensions to graph so it's not too cluttered
  const topDims = dimensions?.slice(0, 3) || [];
  const colors = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  return (
    <Shell>
      <div className="p-8 pb-20 space-y-8">
        <header>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Trend History</h1>
          <p className="text-muted-foreground mt-2 text-lg">Readiness score progression over time.</p>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
