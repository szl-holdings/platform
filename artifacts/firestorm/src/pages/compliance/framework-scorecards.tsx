import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const dimensions = [
  { id: 1, name: "Identify", category: "NIST CSF", currentScore: 82, targetScore: 85, assessorName: "J. Chen", lastAssessedAt: "2026-03-01" },
  { id: 2, name: "Protect", category: "NIST CSF", currentScore: 74, targetScore: 85, assessorName: "M. Rodriguez", lastAssessedAt: "2026-02-28" },
  { id: 3, name: "Detect", category: "NIST CSF", currentScore: 79, targetScore: 88, assessorName: "S. Park", lastAssessedAt: "2026-03-10" },
  { id: 4, name: "Respond", category: "NIST CSF", currentScore: 71, targetScore: 85, assessorName: "K. Wilson", lastAssessedAt: "2026-02-20" },
  { id: 5, name: "Recover", category: "NIST CSF", currentScore: 68, targetScore: 80, assessorName: "A. Thompson", lastAssessedAt: "2026-01-15" },
  { id: 6, name: "Access Control", category: "ISO 27001", currentScore: 85, targetScore: 90, assessorName: "J. Chen", lastAssessedAt: "2026-03-05" },
  { id: 7, name: "Operations", category: "ISO 27001", currentScore: 77, targetScore: 88, assessorName: "M. Rodriguez", lastAssessedAt: "2026-03-08" },
  { id: 8, name: "CMMC L2", category: "CMMC", currentScore: 72, targetScore: 80, assessorName: "S. Park", lastAssessedAt: "2026-02-14" },
];

export default function FrameworkScorecards() {
  const chartData = dimensions.map(d => ({
    subject: d.name.split(' ')[0],
    score: d.currentScore,
    target: d.targetScore,
    fullMark: 100,
  }));

  const avgScore = dimensions.reduce((acc, d) => acc + d.currentScore, 0) / dimensions.length;
  const aboveTarget = dimensions.filter(d => d.currentScore >= d.targetScore).length;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-display text-lg font-bold text-orange-50">Framework Scorecards</h1>
          <p className="text-orange-400/50 text-xs mt-0.5">Maturity assessment across NIST CSF, ISO 27001, and CMMC control domains.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-orange-400/40 uppercase tracking-wider font-semibold">Avg Score</div>
            <div className="text-xl font-display font-bold text-orange-50">{avgScore.toFixed(1)}</div>
          </div>
          <div className="w-px h-8 bg-orange-500/20" />
          <div className="text-right">
            <div className="text-[10px] text-orange-400/40 uppercase tracking-wider font-semibold">On Target</div>
            <div className="text-xl font-display font-bold text-emerald-400">{aboveTarget}/{dimensions.length}</div>
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="xl:col-span-1 bg-orange-500/5 border border-orange-500/10 rounded-xl p-6 flex flex-col items-center justify-center"
        >
          <h3 className="text-sm font-semibold text-orange-50 mb-5 font-display w-full text-left">Framework Coverage Radar</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="rgba(249,115,22,0.15)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(251,146,60,0.6)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#09080f', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '8px' }} />
                <Radar name="Target" dataKey="target" stroke="rgba(249,115,22,0.3)" fill="rgba(249,115,22,0.05)" />
                <Radar name="Score" dataKey="score" stroke="rgba(239,68,68,0.8)" fill="rgba(239,68,68,0.2)" animationDuration={1500} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-3 text-xs font-medium">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500/40 border border-red-500" /><span className="text-orange-400/60">Current</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500/10 border border-orange-500/30" /><span className="text-orange-400/60">Target</span></div>
          </div>
        </motion.div>

        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {dimensions.map((dim, i) => {
            const pct = Math.min((dim.currentScore / dim.targetScore) * 100, 100);
            const onTarget = dim.currentScore >= dim.targetScore;
            return (
              <motion.div
                key={dim.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-5 hover:-translate-y-0.5 transition-transform duration-300 cursor-pointer relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none ${onTarget ? 'bg-emerald-500/10' : 'bg-red-500/10'}`} />
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-orange-400/50 font-bold mb-1">{dim.category}</div>
                    <h3 className="text-sm font-bold text-orange-50 font-display leading-tight">{dim.name}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full border-[3px] flex items-center justify-center font-bold text-xs relative"
                    style={{ borderColor: onTarget ? '#22c55e' : '#ef4444' }}>
                    <span className={onTarget ? "text-emerald-400" : "text-red-400"}>{dim.currentScore}</span>
                  </div>
                </div>
                <div className="space-y-3 relative z-10">
                  <div>
                    <div className="flex justify-between text-[10px] text-orange-400/40 mb-1">
                      <span>Progress to Target ({dim.targetScore})</span>
                      <span className="font-semibold">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-orange-500/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: onTarget ? '#22c55e' : '#ef4444' }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-orange-500/10 text-[10px] text-orange-400/40">
                    <span>{dim.assessorName}</span>
                    <span>{new Date(dim.lastAssessedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
