import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@szl-holdings/shared-ui/ui/card";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { DollarSign, TrendingUp, Shield, CheckCircle, BarChart2, Award, Loader2, Sparkles } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const GOLD = "var(--color-gold)";

type Recommendation = {
  id: string;
  title: string;
  category: "revenue" | "cost" | "risk";
  status: "implemented" | "in-progress" | "pending";
  revenueInfluenced: number;
  costsAvoided: number;
  risksMitigated: number;
  confidence: number;
  implementedDate?: string;
};

type Engagement = {
  id: string;
  client: string;
  engagement: string;
  startDate: string;
  fee: number;
  recommendations: Recommendation[];
};

const CATEGORY_COLORS: Record<string, string> = {
  revenue: "#22c55e",
  cost: "#3b82f6",
  risk: "#f59e0b",
};

const STATUS_STYLES: Record<string, string> = {
  implemented: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-stone-50 text-stone-600 border-stone-200",
};

const API = import.meta.env.BASE_URL + "api";

export default function EngagementROI() {
  usePageMeta({
    title: "Engagement ROI Tracker | Carlota Jo",
    description: "Track the measurable business impact of consulting recommendations — revenue influenced, costs avoided, risks mitigated.",
    canonical: "https://szlholdings.com/carlota-jo/engagement-roi",
  });

  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [selectedEngagement, setSelectedEngagement] = useState<Engagement | null>(null);
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEngagements() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/booking/reservations`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          const raw: { id?: string | number; client?: string; notes?: string; startDate?: string; totalAmount?: number }[] =
            Array.isArray(json.reservations) ? json.reservations : Array.isArray(json.data) ? json.data : [];
          const mapped: Engagement[] = raw.map(r => ({
            id: String(r.id ?? Math.random()),
            client: r.client ?? "Unknown Client",
            engagement: r.notes ?? "Consulting Engagement",
            startDate: r.startDate ?? new Date().toISOString().slice(0, 10),
            fee: r.totalAmount ?? 0,
            recommendations: [],
          }));
          setEngagements(mapped);
          if (mapped.length > 0) setSelectedEngagement(mapped[0]);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    void loadEngagements();
  }, []);

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading engagement data…
      </div>
    );
  }

  if (!selectedEngagement) {
    return (
      <div className="p-10 text-center">
        <BarChart2 className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-sm text-stone-500">No engagement data connected.</p>
        <p className="text-xs text-stone-600 mt-1">Connect engagement records to track ROI across recommendations.</p>
      </div>
    );
  }

  const recs = selectedEngagement.recommendations;
  const totalRevenue = recs.reduce((s, r) => s + r.revenueInfluenced, 0);
  const totalCost = recs.reduce((s, r) => s + r.costsAvoided, 0);
  const totalRisk = recs.reduce((s, r) => s + r.risksMitigated, 0);
  const totalImpact = totalRevenue + totalCost + totalRisk;
  const roi = selectedEngagement.fee > 0 ? ((totalImpact - selectedEngagement.fee) / selectedEngagement.fee * 100).toFixed(0) : "0";
  const implemented = recs.filter(r => r.status === "implemented").length;

  const chartData = [
    { name: "Revenue Influenced", value: totalRevenue, color: CATEGORY_COLORS.revenue },
    { name: "Costs Avoided", value: totalCost, color: CATEGORY_COLORS.cost },
    { name: "Risks Mitigated", value: totalRisk, color: CATEGORY_COLORS.risk },
  ].filter(d => d.value > 0);

  const generateInsight = async () => {
    setGeneratingInsight(true);
    try {
      const res = await fetch(`${API}/intelligence/ai/advisory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: [{ role: "user", content: `Provide a 2-3 sentence executive ROI insight for this consulting engagement. Client: ${selectedEngagement.client}. Engagement: ${selectedEngagement.engagement}. Fee: $${selectedEngagement.fee.toLocaleString()}. Total measured impact: $${totalImpact.toLocaleString()}. ROI: ${roi}%. Implemented ${implemented} of ${recs.length} recommendations. Be specific and quantitative. Do not use bullet points or headers — just 2-3 flowing sentences.` }],
          context: "Engagement ROI tracker — Carlota Jo",
        }),
      });

      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try { const json = JSON.parse(line.slice(6)); if (json.content) fullContent += json.content; } catch {}
        }
      }
      setAiInsight(fullContent);
    } catch {
      setAiInsight(null);
    } finally {
      setGeneratingInsight(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="w-5 h-5" style={{ color: GOLD }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: GOLD }}>Engagement ROI Tracker</span>
        </div>
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-serif)" }}>Consulting Impact Attribution</h1>
        <p className="text-sm text-muted-foreground mt-1">Tie every recommendation to measurable business outcomes — proving consulting value with data, not promises.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {engagements.map(eng => (
          <button
            key={eng.id}
            onClick={() => { setSelectedEngagement(eng); setAiInsight(null); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${selectedEngagement.id === eng.id ? "text-white" : "border-border text-muted-foreground hover:bg-muted"}`}
            style={selectedEngagement.id === eng.id ? { background: GOLD, borderColor: GOLD } : {}}
          >
            {eng.client}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Consulting Investment", value: `$${(selectedEngagement.fee / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-foreground" },
          { label: "Total Measured Impact", value: `$${(totalImpact / 1000).toFixed(0)}K`, icon: TrendingUp, color: "text-emerald-600" },
          { label: "Engagement ROI", value: `${roi}%`, icon: Award, color: "text-foreground" },
          { label: "Recommendations", value: recs.length > 0 ? `${implemented}/${recs.length}` : "—", icon: CheckCircle, color: "text-foreground" },
          { label: "Avg. Confidence", value: recs.length > 0 ? `${Math.round(recs.reduce((s, r) => s + r.confidence, 0) / recs.length)}%` : "—", icon: Shield, color: "text-foreground" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={`text-xl font-semibold ${stat.color}`} style={{ fontFamily: "var(--font-serif)" }}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {aiInsight && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-l-4" style={{ borderLeftColor: GOLD }}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
                <span className="text-xs font-medium" style={{ color: GOLD }}>AI ROI Insight</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ fontFamily: "var(--font-serif)", fontSize: "0.95rem" }}>{aiInsight}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{selectedEngagement.engagement} — Recommendation Tracker</CardTitle>
                <button onClick={generateInsight} disabled={generatingInsight} className="text-xs px-3 py-1 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50 text-white" style={{ background: GOLD }}>
                  {generatingInsight ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {generatingInsight ? "Analysing…" : "AI Insight"}
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recs.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-muted-foreground">No recommendations recorded for this engagement.</p>
                </div>
              ) : recs.map(rec => (
                <div key={rec.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium">{rec.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[rec.status]}`}>
                          {rec.status === "implemented" ? "Implemented" : rec.status === "in-progress" ? "In Progress" : "Pending"}
                        </span>
                        {rec.implementedDate && <span className="text-xs text-muted-foreground">{rec.implementedDate}</span>}
                        <span className="text-xs text-muted-foreground">{rec.confidence}% confidence</span>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: CATEGORY_COLORS[rec.category] }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {rec.revenueInfluenced > 0 && (
                      <div className="p-1.5 rounded bg-emerald-50 border border-emerald-100 text-center">
                        <p className="text-xs font-semibold text-emerald-700">${(rec.revenueInfluenced / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-emerald-600">Revenue</p>
                      </div>
                    )}
                    {rec.costsAvoided > 0 && (
                      <div className="p-1.5 rounded bg-blue-50 border border-blue-100 text-center">
                        <p className="text-xs font-semibold text-blue-700">${(rec.costsAvoided / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-blue-600">Cost Avoided</p>
                      </div>
                    )}
                    {rec.risksMitigated > 0 && (
                      <div className="p-1.5 rounded bg-amber-50 border border-amber-100 text-center">
                        <p className="text-xs font-semibold text-amber-700">${(rec.risksMitigated / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-amber-600">Risk Mitigated</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Impact Breakdown</CardTitle></CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                        {chartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} contentStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {chartData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                          <span className="text-xs text-muted-foreground">{d.name}</span>
                        </div>
                        <span className="text-xs font-medium">${(d.value / 1000).toFixed(0)}K</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">No impact data recorded yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Engagement Details</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span className="text-xs text-muted-foreground">Client</span><span className="text-xs font-medium">{selectedEngagement.client}</span></div>
              <div className="flex justify-between"><span className="text-xs text-muted-foreground">Engagement</span><span className="text-xs font-medium text-right max-w-32 text-wrap">{selectedEngagement.engagement}</span></div>
              <div className="flex justify-between"><span className="text-xs text-muted-foreground">Started</span><span className="text-xs font-medium">{selectedEngagement.startDate}</span></div>
              <div className="flex justify-between"><span className="text-xs text-muted-foreground">Fee</span><span className="text-xs font-medium">${selectedEngagement.fee.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-xs text-muted-foreground">Total Impact</span><span className="text-xs font-semibold text-emerald-600">${totalImpact.toLocaleString()}</span></div>
              <div className="pt-1 border-t border-border flex justify-between"><span className="text-xs text-muted-foreground">Return on Investment</span><span className="text-xs font-bold" style={{ color: GOLD }}>{roi}%</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
