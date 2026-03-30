import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { m } from "framer-motion";
import {
  Settings, Edit3, Shield, CheckCircle2, AlertCircle, Loader2, Save, Plus, Trash2,
  ChevronRight, Eye, EyeOff, Building2, BarChart3, Mail, FileText, Globe, Layers,
  Lock, ArrowLeft, RefreshCw,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface HeroConfig {
  headline: string;
  headlineAccent: string;
  subheadline: string;
  badge: string;
  cta: string;
}

interface Inquiry {
  id: number;
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

const defaultHero: HeroConfig = {
  headline: "The Future",
  headlineAccent: "Is Engineered",
  subheadline: "SZL Holdings deploys capital and talent across six frontier technology platforms — engineering compound returns at the intersection of deep tech and critical infrastructure.",
  badge: "Est. 2021 · $180M+ Deployed Capital",
  cta: "Explore the Ecosystem",
};

const DEFAULT_PIN = "szl2026";

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === DEFAULT_PIN) {
      onUnlock();
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground">Admin Access</h1>
          <p className="text-sm text-muted-foreground mt-1">SZL Holdings Content Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter access PIN"
              className={cn(
                "w-full bg-card border rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all",
                error ? "border-red-500/60 ring-2 ring-red-500/20" : "border-border"
              )}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Incorrect PIN. Try again.
            </p>
          )}
          <button
            type="submit"
            disabled={!pin}
            className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Unlock Admin
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Default PIN: szl2026 (change in production)
        </p>
      </m.div>
    </div>
  );
}

function HeroEditor() {
  const [form, setForm] = useState<HeroConfig>(defaultHero);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("szl_hero_override", JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Hero Copy
        </h3>
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            saved ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
            "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? "Saved" : "Save Changes"}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(Object.keys(form) as Array<keyof HeroConfig>).map(key => (
          <div key={key} className={key === "subheadline" ? "sm:col-span-2" : ""}>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </label>
            {key === "subheadline" ? (
              <textarea
                value={form[key]}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                rows={3}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
              />
            ) : (
              <input
                value={form[key]}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 p-4 bg-muted/30 rounded-lg">
        <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wider">Preview</p>
        <p className="text-xs inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-background text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {form.badge}
        </p>
        <h2 className="text-lg font-bold text-foreground mt-2">{form.headline} <span className="text-primary">{form.headlineAccent}</span></h2>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{form.subheadline}</p>
      </div>
    </div>
  );
}

function InquiriesPanel() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/holdings/inquiries`);
      if (!res.ok) throw new Error("Failed to fetch inquiries");
      return res.json();
    },
  });

  const inquiries: Inquiry[] = data?.data || [];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" /> Inquiries
          {inquiries.length > 0 && (
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{inquiries.length}</span>
          )}
        </h3>
        <button onClick={() => refetch()} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />)}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-8">
          <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No inquiries yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {inquiries.map((inq) => (
            <div key={inq.id} className="p-3 bg-background border border-border rounded-lg">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <p className="text-xs font-semibold text-foreground">{inq.name}</p>
                  <p className="text-[10px] text-muted-foreground">{inq.email}{inq.company ? ` · ${inq.company}` : ""}</p>
                </div>
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0",
                  inq.status === "new" ? "bg-blue-500/10 text-blue-500" :
                  inq.status === "read" ? "bg-muted text-muted-foreground" :
                  inq.status === "replied" ? "bg-emerald-500/10 text-emerald-500" :
                  "bg-muted text-muted-foreground"
                )}>{inq.status}</span>
              </div>
              <p className="text-xs font-medium text-foreground">{inq.subject}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{inq.message}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1.5">{new Date(inq.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiEditor() {
  const [kpis, setKpis] = useState([
    { label: "Portfolio ARR", value: "$35M+", note: "Q1 2026" },
    { label: "Addressable Market", value: "$2.4B+", note: "Combined" },
    { label: "YoY Revenue Growth", value: "142%", note: "Aggregate" },
    { label: "Daily AI Inferences", value: "18M+", note: "Via Lyte" },
  ]);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("szl_kpi_override", JSON.stringify(kpis));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> KPI Strip
        </h3>
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            saved ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
            "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      <div className="space-y-3">
        {kpis.map((kpi, i) => (
          <div key={i} className="grid grid-cols-3 gap-2">
            <input
              value={kpi.label}
              onChange={e => setKpis(prev => prev.map((k, j) => j === i ? { ...k, label: e.target.value } : k))}
              placeholder="Label"
              className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              value={kpi.value}
              onChange={e => setKpis(prev => prev.map((k, j) => j === i ? { ...k, value: e.target.value } : k))}
              placeholder="Value"
              className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <input
              value={kpi.note}
              onChange={e => setKpis(prev => prev.map((k, j) => j === i ? { ...k, note: e.target.value } : k))}
              placeholder="Note"
              className="bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapEditor() {
  const [items, setItems] = useState([
    { title: "Series B Financing", quarter: "Q2 2026", status: "planned", description: "Target $45M to fund international expansion and accelerate INCA/Carlota Jo to GA." },
    { title: "INCA General Availability", quarter: "Q3 2026", status: "planned", description: "Public launch of INCA AI Research platform following successful Series A." },
    { title: "Federal Sector Expansion", quarter: "Q3 2026", status: "planned", description: "Firestorm expansion into federal agency accounts and CMMC compliance program." },
    { title: "Ecosystem API Platform", quarter: "Q4 2026", status: "planned", description: "Public API layer enabling third-party integrations with the SZL intelligence fabric." },
  ]);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("szl_roadmap_override", JSON.stringify(items));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addItem = () => {
    setItems(prev => [...prev, { title: "", quarter: "Q1 2027", status: "planned", description: "" }]);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" /> Roadmap Items
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={addItem} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              saved ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
              "bg-primary text-white hover:bg-primary/90"
            )}
          >
            {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-background border border-border rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={item.title}
                onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, title: e.target.value } : it))}
                placeholder="Milestone title"
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <div className="flex gap-2">
                <input
                  value={item.quarter}
                  onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, quarter: e.target.value } : it))}
                  placeholder="Q1 2027"
                  className="flex-1 bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
                <button
                  onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={item.description}
              onChange={e => setItems(prev => prev.map((it, j) => j === i ? { ...it, description: e.target.value } : it))}
              placeholder="Description..."
              rows={2}
              className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const sections = [
  { id: "hero", label: "Hero Copy", icon: FileText },
  { id: "kpis", label: "KPI Strip", icon: BarChart3 },
  { id: "roadmap", label: "Roadmap", icon: Layers },
  { id: "inquiries", label: "Inquiries", icon: Mail },
];

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs">
              <ArrowLeft className="w-4 h-4" /> Command Center
            </Link>
            <span className="text-border">/</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                <Settings className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Authenticated
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <aside className="space-y-1">
            {sections.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                    activeSection === s.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {s.label}
                </button>
              );
            })}
          </aside>

          <div className="md:col-span-3">
            <m.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === "hero" && <HeroEditor />}
              {activeSection === "kpis" && <KpiEditor />}
              {activeSection === "roadmap" && <RoadmapEditor />}
              {activeSection === "inquiries" && <InquiriesPanel />}
            </m.div>
          </div>
        </div>
      </main>
    </div>
  );
}
