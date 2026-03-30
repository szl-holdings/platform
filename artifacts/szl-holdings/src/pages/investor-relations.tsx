import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shared-ui/ui/card";
import { Badge } from "@workspace/shared-ui/ui/badge";
import { TrendingUp, FileText, Calendar, Download, BarChart3, PieChart, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const fundMetrics = [
  { label: "Fund III Target", value: "$85M", sub: "Final close Q1 2026", color: "text-szl-accent" },
  { label: "Fund III Called", value: "$61M", sub: "72% deployed to date", color: "text-foreground" },
  { label: "Portfolio TVPI", value: "2.4x", sub: "Total Value / Paid-In", color: "text-emerald-400" },
  { label: "DPI", value: "0.6x", sub: "Distributions / Paid-In", color: "text-foreground" },
];

const fundHistory = [
  { quarter: "Q1 24", nav: 48, deployed: 32 }, { quarter: "Q2 24", nav: 61, deployed: 44 },
  { quarter: "Q3 24", nav: 79, deployed: 52 }, { quarter: "Q4 24", nav: 98, deployed: 58 },
  { quarter: "Q1 25", nav: 118, deployed: 61 }, { quarter: "Q2 25", nav: 134, deployed: 61 },
  { quarter: "Q3 25", nav: 152, deployed: 61 }, { quarter: "Q4 25", nav: 171, deployed: 61 },
  { quarter: "Q1 26", nav: 185, deployed: 61 },
];

const lps = [
  { name: "Meridian Family Office", commitment: "$12M", type: "Family Office", region: "North America", status: "Active" },
  { name: "Varuna Capital Partners", commitment: "$18M", type: "Institutional", region: "Europe", status: "Active" },
  { name: "Axiom Endowment Fund", commitment: "$8M", type: "Endowment", region: "North America", status: "Active" },
  { name: "Pacific Rim Ventures", commitment: "$15M", type: "Institutional", region: "Asia-Pacific", status: "Active" },
  { name: "Solaris Family Trust", commitment: "$5M", type: "Family Office", region: "Middle East", status: "Active" },
];

const documents = [
  { name: "Q1 2026 LP Update", date: "April 15, 2026", type: "Quarterly Report" },
  { name: "Fund III Annual Report 2025", date: "March 1, 2026", type: "Annual Report" },
  { name: "Portfolio Company KPIs — Q4 2025", date: "January 20, 2026", type: "KPI Report" },
  { name: "Fund III Capital Call Notice #8", date: "January 5, 2026", type: "Capital Call" },
  { name: "Tax Documents — K-1 2025", date: "March 15, 2026", type: "Tax" },
];

const docColor: Record<string, string> = {
  "Quarterly Report": "text-blue-400 bg-blue-500/10",
  "Annual Report": "text-violet-400 bg-violet-500/10",
  "KPI Report": "text-emerald-400 bg-emerald-500/10",
  "Capital Call": "text-amber-400 bg-amber-500/10",
  "Tax": "text-orange-400 bg-orange-500/10",
};

export default function InvestorRelations() {
  return (
    <div className="min-h-screen bg-szl-bg text-szl-text p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-szl-text flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-szl-accent" />
            Investor Relations
          </h1>
          <p className="text-szl-text-secondary mt-2">Fund performance, LP reporting, capital activity, and document vault for SZL Holdings limited partners.</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {fundMetrics.map(({ label, value, sub, color }) => (
            <Card key={label} className="bg-szl-surface border-szl-border">
              <CardContent className="p-4">
                <p className="text-xs text-szl-text-secondary">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] text-szl-text-secondary mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="bg-szl-surface border-szl-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-szl-text">NAV vs. Deployed Capital ($M)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={fundHistory}>
                  <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0a0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="nav" stroke="#6c63ff" fill="#6c63ff" fillOpacity={0.15} strokeWidth={2} name="NAV ($M)" />
                  <Area type="monotone" dataKey="deployed" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" name="Deployed ($M)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-szl-surface border-szl-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-szl-text flex items-center gap-2"><Users className="w-4 h-4 text-szl-accent" /> LP Registry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lps.map(lp => (
                  <div key={lp.name} className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                    <div>
                      <p className="text-xs font-medium text-szl-text">{lp.name}</p>
                      <p className="text-[10px] text-szl-text-secondary">{lp.type} · {lp.region}</p>
                    </div>
                    <p className="text-sm font-bold text-szl-accent">{lp.commitment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-szl-surface border-szl-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-szl-text flex items-center gap-2"><FileText className="w-4 h-4 text-szl-accent" /> Document Vault</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.name} className="flex items-center justify-between p-3 rounded-lg bg-black/10 hover:bg-black/20 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[9px] ${docColor[doc.type]}`}>{doc.type}</Badge>
                    <div>
                      <p className="text-sm font-medium text-szl-text">{doc.name}</p>
                      <p className="text-[10px] text-szl-text-secondary flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> {doc.date}</p>
                    </div>
                  </div>
                  <button className="text-xs text-szl-text-secondary group-hover:text-szl-accent transition-colors flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">Download</span>
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
