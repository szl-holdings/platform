import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, DollarSign, Activity, Globe, PieChart, ArrowUpRight, ArrowDownRight, Calendar, Brain } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { usePageMeta } from "@/hooks/usePageMeta";

const marketData = [
  { symbol: "AAPL", name: "Apple Inc.", price: 198.45, change: 2.34, changePercent: 1.19, volume: "52.3M", sector: "Technology" },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 445.12, change: -3.21, changePercent: -0.72, volume: "28.1M", sector: "Technology" },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 178.90, change: 1.56, changePercent: 0.88, volume: "18.7M", sector: "Technology" },
  { symbol: "AMZN", name: "Amazon.com", price: 215.78, change: 4.12, changePercent: 1.95, volume: "35.2M", sector: "Consumer" },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 925.40, change: -12.50, changePercent: -1.33, volume: "45.8M", sector: "Technology" },
  { symbol: "JPM", name: "JPMorgan Chase", price: 212.34, change: 1.89, changePercent: 0.90, volume: "8.9M", sector: "Financial" },
];

const researchNotes = [
  { title: "AI Infrastructure Investment Thesis", date: "Mar 28, 2026", category: "Thesis", summary: "Analysis of the growing demand for AI compute infrastructure and implications for semiconductor and cloud providers" },
  { title: "SaaS Valuation Framework Update", date: "Mar 25, 2026", category: "Framework", summary: "Updated multiples-based valuation framework incorporating Rule of 40, NRR, and CAC payback metrics" },
  { title: "Fintech Disruption in Payments", date: "Mar 22, 2026", category: "Sector", summary: "Deep dive into real-time payment networks and embedded finance trends reshaping the payments landscape" },
  { title: "Enterprise Security Market Map", date: "Mar 18, 2026", category: "Market Map", summary: "Comprehensive mapping of the cybersecurity vendor landscape across SIEM, XDR, SASE, and identity categories" },
];

const portfolioAllocation = [
  { sector: "Technology", allocation: 42, return: 18.5 },
  { sector: "Healthcare", allocation: 15, return: 12.3 },
  { sector: "Financial", allocation: 18, return: 9.8 },
  { sector: "Consumer", allocation: 12, return: 14.2 },
  { sector: "Energy", allocation: 8, return: -2.1 },
  { sector: "Industrial", allocation: 5, return: 7.6 },
];

export default function FinancialResearch() {
  usePageMeta({
    title: "Financial Research | Stephen Lutar – Market Intelligence & Analysis",
    description: "Real-time market intelligence, equity research, and financial analysis by Stephen Lutar. Technology sector focus with portfolio insights and market commentary.",
    canonical: "https://szlholdings.com/stephen/financial-research",
  });
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              Financial Research
            </h1>
            <p className="text-muted-foreground mt-1">Equity screening, sector allocation modeling, and thesis-driven research notes</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Markets Open</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Portfolio Value</p>
            <p className="text-2xl font-bold text-foreground">$2.84M</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1"><ArrowUpRight className="w-3 h-3" /> +12.4% YTD</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Day P&L</p>
            <p className="text-2xl font-bold text-emerald-400">+$18,420</p>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" /> +0.65%</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Positions</p>
            <p className="text-2xl font-bold text-foreground">24</p>
            <span className="text-xs text-muted-foreground mt-1">across 6 sectors</span>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Research Notes</p>
            <p className="text-2xl font-bold text-foreground">{researchNotes.length}</p>
            <span className="text-xs text-muted-foreground mt-1">this month</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Market Watchlist</h3>
            <div className="space-y-2">
              {marketData.map(stock => (
                <div key={stock.symbol} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{stock.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{stock.symbol}</p>
                    <p className="text-xs text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-foreground">${stock.price.toFixed(2)}</p>
                    <p className={cn("text-xs font-mono flex items-center justify-end gap-0.5",
                      stock.change >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {stock.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {stock.change >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Sector Allocation</h3>
            <div className="space-y-3">
              {portfolioAllocation.map(sector => (
                <div key={sector.sector} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{sector.sector}</span>
                    <div className="flex items-center gap-3">
                      <span className={cn("text-xs font-mono", sector.return >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {sector.return >= 0 ? "+" : ""}{sector.return}%
                      </span>
                      <span className="text-xs text-muted-foreground w-8 text-right">{sector.allocation}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full" style={{ width: `${sector.allocation}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" /> Research Notes
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {researchNotes.map((note, i) => (
              <div key={i} className="border border-border rounded-lg p-4 hover:border-primary/20 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">{note.category}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {note.date}</span>
                </div>
                <h4 className="text-sm font-medium text-foreground">{note.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{note.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
