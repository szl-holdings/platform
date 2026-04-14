import { useState } from "react";
import {
  Zap, Building2, DollarSign, BarChart3, TrendingUp, FileText, Search,
  ChevronRight, CheckCircle, Loader2, Target, Calculator, Home, ArrowRight,
  Download, Edit3, Send, AlertTriangle, Activity, Clock, X, Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";

type AutopilotStage = "select" | "analyzing" | "complete";

interface PropertyInput {
  id: string;
  address: string;
  neighborhood: string;
  borough: string;
  askPrice: number;
  propertyType: string;
  units: number;
  sqft: number;
  yearBuilt: number;
  distressScore: number;
}

interface ComparableSale {
  address: string;
  salePrice: number;
  pricePerSqft: number;
  closedDate: string;
  sqft: number;
  distance: string;
  similarity: number;
}

interface RehabLine {
  category: string;
  baseEstimate: number;
  contingency: number;
  total: number;
  priority: "critical" | "important" | "optional";
}

interface CashFlowYear {
  year: number;
  grossRent: number;
  vacancy: number;
  opex: number;
  noi: number;
  debtService: number;
  cashFlow: number;
  cumCashFlow: number;
}

interface UnderwritingPackage {
  property: PropertyInput;
  comps: ComparableSale[];
  rehabLines: RehabLine[];
  arv: number;
  totalRehab: number;
  allInCost: number;
  cashFlowProjections: CashFlowYear[];
  irr: number;
  equity: number;
  cashOnCash: number;
  capRateStabilized: number;
  dscr: number;
  ltv: number;
  maxOffer: number;
  aggressiveOffer: number;
  walkAwayPrice: number;
  aiInsight: string;
  acquisitionStrategy: string;
  riskFlags: string[];
}

const SAMPLE_PROPERTIES: PropertyInput[] = [
  { id: "p-1", address: "211 Liberty Ave", neighborhood: "East New York", borough: "Brooklyn", askPrice: 790_000, propertyType: "Multi-Family", units: 4, sqft: 3200, yearBuilt: 1948, distressScore: 91 },
  { id: "p-2", address: "1847 Myrtle Ave", neighborhood: "Bushwick", borough: "Brooklyn", askPrice: 1_350_000, propertyType: "Multi-Family", units: 6, sqft: 4800, yearBuilt: 1952, distressScore: 87 },
  { id: "p-3", address: "392 Nostrand Ave", neighborhood: "Crown Heights", borough: "Brooklyn", askPrice: 2_100_000, propertyType: "Mixed-Use", units: 8, sqft: 6400, yearBuilt: 1961, distressScore: 82 },
  { id: "p-4", address: "3301 White Plains Rd", neighborhood: "Wakefield", borough: "Bronx", askPrice: 2_800_000, propertyType: "Commercial", units: 0, sqft: 9200, yearBuilt: 1971, distressScore: 82 },
];

function generateUnderwriting(property: PropertyInput): UnderwritingPackage {
  const pricePerSqft = property.askPrice / property.sqft;
  const arvPerSqft = property.propertyType === "Commercial" ? pricePerSqft * 1.28 : pricePerSqft * 1.32;
  const arv = Math.round(arvPerSqft * property.sqft);

  const rehabLines: RehabLine[] = property.propertyType === "Commercial"
    ? [
        { category: "Structural & Foundation", baseEstimate: 42_000, contingency: 6_300, total: 48_300, priority: "critical" },
        { category: "Roof & Envelope", baseEstimate: 38_000, contingency: 5_700, total: 43_700, priority: "critical" },
        { category: "HVAC Systems", baseEstimate: 55_000, contingency: 8_250, total: 63_250, priority: "important" },
        { category: "Electrical Upgrade", baseEstimate: 28_000, contingency: 4_200, total: 32_200, priority: "important" },
        { category: "Interior Fitout", baseEstimate: 65_000, contingency: 9_750, total: 74_750, priority: "optional" },
        { category: "Parking & Exterior", baseEstimate: 18_000, contingency: 2_700, total: 20_700, priority: "optional" },
      ]
    : [
        { category: "Structural & Foundation", baseEstimate: 22_000, contingency: 3_300, total: 25_300, priority: "critical" },
        { category: "Roof & Waterproofing", baseEstimate: 28_000, contingency: 4_200, total: 32_200, priority: "critical" },
        { category: "Plumbing (full upgrade)", baseEstimate: 35_000, contingency: 5_250, total: 40_250, priority: "critical" },
        { category: "Electrical (panel + wiring)", baseEstimate: 24_000, contingency: 3_600, total: 27_600, priority: "important" },
        { category: "Kitchen & Bath (per unit)", baseEstimate: property.units * 12_000, contingency: property.units * 1_800, total: property.units * 13_800, priority: "important" },
        { category: "Common Areas & Halls", baseEstimate: 15_000, contingency: 2_250, total: 17_250, priority: "optional" },
      ];

  const totalRehab = rehabLines.reduce((s, l) => s + l.total, 0);
  const allInCost = property.askPrice + totalRehab;

  const comps: ComparableSale[] = [
    { address: `${Math.floor(Math.random() * 200 + 100)} ${property.neighborhood === "East New York" ? "Sutter" : property.neighborhood === "Bushwick" ? "Knickerbocker" : "Sterling"} Ave`, salePrice: Math.round(arv * (0.96 + Math.random() * 0.08)), pricePerSqft: Math.round(arvPerSqft * 0.98), closedDate: "Jan 2026", sqft: property.sqft + Math.floor(Math.random() * 400 - 200), distance: "0.3mi", similarity: 94 },
    { address: `${Math.floor(Math.random() * 200 + 100)} Pine St`, salePrice: Math.round(arv * (0.93 + Math.random() * 0.06)), pricePerSqft: Math.round(arvPerSqft * 0.96), closedDate: "Feb 2026", sqft: property.sqft + Math.floor(Math.random() * 600 - 300), distance: "0.6mi", similarity: 88 },
    { address: `${Math.floor(Math.random() * 200 + 100)} Elm Blvd`, salePrice: Math.round(arv * (0.98 + Math.random() * 0.06)), pricePerSqft: Math.round(arvPerSqft * 1.02), closedDate: "Mar 2026", sqft: property.sqft + Math.floor(Math.random() * 800 - 400), distance: "0.8mi", similarity: 82 },
    { address: `${Math.floor(Math.random() * 200 + 100)} Oak Ave`, salePrice: Math.round(arv * (0.92 + Math.random() * 0.08)), pricePerSqft: Math.round(arvPerSqft * 0.95), closedDate: "Dec 2025", sqft: property.sqft + Math.floor(Math.random() * 500 - 250), distance: "1.1mi", similarity: 76 },
  ];

  const grossRentYear1 = property.propertyType === "Commercial" ? property.sqft * 24 : property.units * 18_000;
  const cashFlowProjections: CashFlowYear[] = [];
  let cumCashFlow = -allInCost * 0.30;
  for (let i = 1; i <= 10; i++) {
    const gr = Math.round(grossRentYear1 * Math.pow(1.03, i - 1));
    const vac = Math.round(gr * 0.07);
    const opex = Math.round((gr - vac) * 0.38);
    const noi = gr - vac - opex;
    const ds = Math.round(allInCost * 0.70 * 0.065);
    const cf = noi - ds;
    cumCashFlow += cf;
    cashFlowProjections.push({ year: i, grossRent: gr, vacancy: vac, opex, noi, debtService: ds, cashFlow: cf, cumCashFlow });
  }

  const stabNoi = cashFlowProjections[1]!.noi;
  const capRateStabilized = (stabNoi / arv) * 100;
  const ds = cashFlowProjections[0]!.debtService;
  const dscr = stabNoi / ds;
  const ltv = (allInCost * 0.70) / arv;
  const equity = allInCost * 0.30;
  const irr = 14 + (property.distressScore - 60) * 0.2 + (Math.random() * 3 - 1.5);
  const cashOnCash = (cashFlowProjections[0]!.cashFlow / equity) * 100;

  const maxOffer = Math.round(arv * 0.72 - totalRehab);
  const aggressiveOffer = Math.round(arv * 0.65 - totalRehab);
  const walkAwayPrice = Math.round(arv * 0.78 - totalRehab);

  return {
    property, comps, rehabLines, arv, totalRehab, allInCost, cashFlowProjections,
    irr: Math.round(irr * 10) / 10, equity, cashOnCash: Math.round(cashOnCash * 10) / 10,
    capRateStabilized: Math.round(capRateStabilized * 10) / 10, dscr: Math.round(dscr * 100) / 100,
    ltv: Math.round(ltv * 100) / 100, maxOffer, aggressiveOffer, walkAwayPrice,
    aiInsight: `This ${property.propertyType.toLowerCase()} property in ${property.neighborhood} presents a compelling distressed acquisition opportunity. The ${property.distressScore}-point distress score reflects deep seller motivation, creating significant pricing leverage. At the aggressive offer, you're acquiring at ${Math.round((aggressiveOffer / arv) * 100)}% of ARV all-in — well inside the 70% rule threshold. The stabilized cap rate of ${Math.round(capRateStabilized * 10) / 10}% is accretive to the portfolio average. Primary execution risk is rehab timeline — budget for 15% cost overrun buffer.`,
    acquisitionStrategy: `Lead with an all-cash or hard-money-backed offer at the aggressive price (${formatCurrency(aggressiveOffer)}). Frame as certainty of close in 14-21 days — competing against the In Rem foreclosure clock. If seller counters, move to max offer (${formatCurrency(maxOffer)}) only with expedited close concession. Walk if above ${formatCurrency(walkAwayPrice)}.`,
    riskFlags: [
      totalRehab > property.askPrice * 0.25 ? "Heavy rehab scope — execution risk elevated" : null,
      property.yearBuilt < 1960 ? "Pre-1960 construction — lead/asbestos abatement likely required" : null,
      property.units > 6 ? "6+ units triggers rent stabilization registration" : null,
      dscr < 1.2 ? "DSCR below 1.25 — debt coverage tight at stabilization" : null,
    ].filter(Boolean) as string[],
  };
}

function formatCurrency(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function SectionHeader({ icon: Icon, title }: { icon: typeof Zap; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 rounded-lg bg-[hsl(258_80%_62%)]/15 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-[hsl(258_80%_72%)]" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

function AnalyzingAnimation({ property }: { property: PropertyInput }) {
  const steps = [
    { icon: Search, label: "Pulling comparable sales data...", done: true },
    { icon: Calculator, label: "Modeling rehab cost estimate...", done: true },
    { icon: TrendingUp, label: "Projecting ARV from comp spread...", done: true },
    { icon: BarChart3, label: "Building 10-year cash flow model...", done: true },
    { icon: FileText, label: "Drafting acquisition offer strategy...", done: true },
    { icon: Zap, label: "Finalizing underwriting package...", done: false },
  ];

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[hsl(258_80%_62%)]/15 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-[hsl(258_80%_72%)]" />
          </div>
          <h2 className="text-base font-bold text-foreground">Running Deal Autopilot</h2>
          <p className="text-sm text-muted-foreground mt-1">{property.address}</p>
        </div>
        <div className="space-y-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(228_20%_6%)] border border-border"
              >
                {i < steps.length - 1 ? (
                  <CheckCircle className="w-4 h-4 text-[hsl(258_80%_72%)] flex-shrink-0" />
                ) : (
                  <Loader2 className="w-4 h-4 text-[hsl(258_80%_72%)] animate-spin flex-shrink-0" />
                )}
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function UnderwritingView({ pkg }: { pkg: UnderwritingPackage }) {
  const [activeTab, setActiveTab] = useState<"comps" | "rehab" | "cashflow" | "offer">("comps");

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="p-4 rounded-xl bg-[hsl(258_80%_62%)]/8 border border-[hsl(258_80%_62%)]/20">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-[hsl(258_80%_62%)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Zap className="w-3 h-3 text-[hsl(258_80%_72%)]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[hsl(258_80%_78%)] mb-1">AI Underwriting Insight</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{pkg.aiInsight}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Projected ARV", value: formatCurrency(pkg.arv), color: "text-foreground" },
          { label: "Total Rehab", value: formatCurrency(pkg.totalRehab), color: "text-amber-400" },
          { label: "All-In Cost", value: formatCurrency(pkg.allInCost), color: "text-foreground" },
          { label: "Proj. IRR", value: `${pkg.irr}%`, color: "text-emerald-400" },
          { label: "Cash-on-Cash", value: `${pkg.cashOnCash}%`, color: "text-emerald-400" },
          { label: "Stab. Cap Rate", value: `${pkg.capRateStabilized}%`, color: "text-sky-400" },
          { label: "DSCR (Stab.)", value: pkg.dscr.toFixed(2), color: pkg.dscr >= 1.25 ? "text-emerald-400" : "text-amber-400" },
          { label: "LTV at ARV", value: `${Math.round(pkg.ltv * 100)}%`, color: pkg.ltv <= 0.75 ? "text-emerald-400" : "text-amber-400" },
          { label: "Equity Required", value: formatCurrency(pkg.equity), color: "text-foreground" },
        ].map(m => (
          <div key={m.label} className="bg-[hsl(228_20%_6%)] border border-border rounded-xl p-3">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
            <p className={cn("text-lg font-bold mt-0.5", m.color)}>{m.value}</p>
          </div>
        ))}
      </div>

      {pkg.riskFlags.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Risk Flags</p>
          {pkg.riskFlags.map((flag, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400/80">{flag}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="flex gap-1 mb-4 bg-[hsl(228_20%_5%)] p-1 rounded-xl border border-border">
          {([["comps", "Comp Sales"], ["rehab", "Rehab Estimate"], ["cashflow", "Cash Flow"], ["offer", "Offer Strategy"]] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeTab === tab
                  ? "bg-[hsl(258_80%_62%)]/15 text-[hsl(258_80%_78%)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "comps" && (
          <div className="space-y-2">
            {pkg.comps.map((comp, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(228_20%_6%)] border border-border">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-sky-400">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{comp.address}</p>
                  <p className="text-[10px] text-muted-foreground">{comp.distance} · {comp.closedDate} · {comp.sqft.toLocaleString()} sqft</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-foreground">{formatCurrency(comp.salePrice)}</p>
                  <p className="text-[10px] text-muted-foreground">${comp.pricePerSqft}/sqft</p>
                </div>
                <div className="text-[9px] font-bold text-[hsl(258_80%_72%)] w-10 text-right">{comp.similarity}%</div>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground mt-2">
              Weighted ARV from comps: <span className="font-bold text-foreground">{formatCurrency(pkg.arv)}</span>
            </p>
          </div>
        )}

        {activeTab === "rehab" && (
          <div className="space-y-2">
            {pkg.rehabLines.map((line, i) => {
              const priorityColor = line.priority === "critical" ? "text-red-400" : line.priority === "important" ? "text-amber-400" : "text-muted-foreground";
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(228_20%_6%)] border border-border">
                  <Wrench className={cn("w-3.5 h-3.5 flex-shrink-0", priorityColor)} />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{line.category}</p>
                    <p className={cn("text-[9px] capitalize", priorityColor)}>{line.priority}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{formatCurrency(line.total)}</p>
                    <p className="text-[10px] text-muted-foreground">+{formatCurrency(line.contingency)} contingency</p>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between p-3 rounded-xl bg-border/20 border border-border font-semibold text-sm">
              <span className="text-foreground">Total Rehab Budget</span>
              <span className="text-amber-400">{formatCurrency(pkg.totalRehab)}</span>
            </div>
          </div>
        )}

        {activeTab === "cashflow" && (
          <div>
            <div className="space-y-1.5">
              <div className="grid grid-cols-7 text-[9px] text-muted-foreground uppercase tracking-wider px-3 pb-1">
                <span>Year</span><span className="text-right">Gross Rent</span><span className="text-right">NOI</span>
                <span className="text-right">Debt Svc</span><span className="text-right">Cash Flow</span><span className="col-span-2 text-right">Cumulative</span>
              </div>
              {pkg.cashFlowProjections.slice(0, 7).map(yr => (
                <div key={yr.year} className="grid grid-cols-7 text-xs px-3 py-2 rounded-lg bg-[hsl(228_20%_6%)] border border-border">
                  <span className="font-bold text-foreground">Y{yr.year}</span>
                  <span className="text-right text-muted-foreground">{formatCurrency(yr.grossRent)}</span>
                  <span className="text-right text-foreground">{formatCurrency(yr.noi)}</span>
                  <span className="text-right text-muted-foreground">{formatCurrency(yr.debtService)}</span>
                  <span className={cn("text-right font-semibold", yr.cashFlow >= 0 ? "text-emerald-400" : "text-red-400")}>{yr.cashFlow >= 0 ? "+" : ""}{formatCurrency(yr.cashFlow)}</span>
                  <span className={cn("col-span-2 text-right", yr.cumCashFlow >= 0 ? "text-emerald-400" : "text-red-400")}>{yr.cumCashFlow >= 0 ? "+" : ""}{formatCurrency(yr.cumCashFlow)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "offer" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {[
                { label: "Aggressive Offer", value: pkg.aggressiveOffer, color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20", description: "Maximum discount — requires distress leverage" },
                { label: "Max Offer", value: pkg.maxOffer, color: "text-sky-400", bg: "bg-sky-500/8 border-sky-500/20", description: "Fair deal threshold — still IRR positive" },
                { label: "Walk-Away Price", value: pkg.walkAwayPrice, color: "text-red-400", bg: "bg-red-500/8 border-red-500/20", description: "Above this, returns deteriorate below threshold" },
              ].map(o => (
                <div key={o.label} className={cn("p-4 rounded-xl border", o.bg)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{o.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{o.description}</p>
                    </div>
                    <p className={cn("text-xl font-black", o.color)}>{formatCurrency(o.value)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-[hsl(228_20%_6%)] border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Acquisition Strategy</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{pkg.acquisitionStrategy}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button className="flex-1 py-2.5 rounded-xl bg-[hsl(258_80%_62%)] text-white text-sm font-semibold hover:bg-[hsl(258_80%_55%)] transition-colors flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          Export Package
        </button>
        <button className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-[hsl(228_20%_7%)] transition-colors flex items-center justify-center gap-2">
          <Send className="w-4 h-4" />
          Submit to Pipeline
        </button>
      </div>
    </div>
  );
}

export default function DealAutopilot() {
  const [stage, setStage] = useState<AutopilotStage>("select");
  const [selectedProperty, setSelectedProperty] = useState<PropertyInput | null>(null);
  const [underwriting, setUnderwriting] = useState<UnderwritingPackage | null>(null);

  const handleLaunch = (property: PropertyInput) => {
    setSelectedProperty(property);
    setStage("analyzing");
    setTimeout(() => {
      setUnderwriting(generateUnderwriting(property));
      setStage("complete");
    }, 3200);
  };

  const handleReset = () => {
    setStage("select");
    setSelectedProperty(null);
    setUnderwriting(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {stage !== "select" && (
              <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-[hsl(228_20%_7%)] text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="text-base font-bold text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-[hsl(258_80%_72%)]" />
                Deal Autopilot
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">AI-generated underwriting package — comps, rehab, ARV, cash flow, offer strategy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(["select", "analyzing", "complete"] as AutopilotStage[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={cn("w-1.5 h-1.5 rounded-full", stage === s ? "bg-[hsl(258_80%_62%)]" : i < ["select", "analyzing", "complete"].indexOf(stage) ? "bg-emerald-400" : "bg-border")} />
                {i < 2 && <div className="w-6 h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {stage === "select" && (
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-4">Select a Distressed Property</p>
          <div className="space-y-3">
            {SAMPLE_PROPERTIES.map(p => (
              <button
                key={p.id}
                onClick={() => handleLaunch(p)}
                className="w-full p-4 rounded-xl bg-[hsl(228_20%_6%)] border border-border hover:border-[hsl(258_80%_62%)]/30 transition-all text-left group hover:translate-x-0.5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[hsl(258_80%_62%)]/10 border border-[hsl(258_80%_62%)]/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-[hsl(258_80%_72%)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{p.address}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.neighborhood} · {p.borough} · {p.propertyType}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400">
                          DISTRESS {p.distressScore}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(258_80%_72%)] transition-colors" />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">Ask: <span className="text-foreground font-medium">{formatCurrency(p.askPrice)}</span></span>
                      {p.units > 0 && <span className="text-xs text-muted-foreground">{p.units} units</span>}
                      <span className="text-xs text-muted-foreground">{p.sqft.toLocaleString()} sqft · {p.yearBuilt}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-[hsl(228_20%_5%)] border border-border border-dashed text-center">
            <p className="text-xs text-muted-foreground">
              Properties sourced from Distress Signal Radar ·{" "}
              <button className="text-[hsl(258_80%_72%)] hover:underline">Add custom property</button>
            </p>
          </div>
        </div>
      )}

      {stage === "analyzing" && selectedProperty && (
        <AnalyzingAnimation property={selectedProperty} />
      )}

      {stage === "complete" && underwriting && (
        <UnderwritingView pkg={underwriting} />
      )}
    </div>
  );
}
