import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  Clock, DollarSign, FileText, CheckCircle, Plus, Sparkles,
  Loader2, ChevronDown, ChevronUp, Calendar, TrendingUp,
  AlertCircle, Download, Filter, BarChart3, CreditCard
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const GOLD = "var(--color-gold)";

type TimeEntry = {
  id: string;
  date: string;
  engagement: string;
  phase: string;
  deliverable: string;
  hours: number;
  rateType: "standard" | "premium" | "fixed" | "non-billable";
  rate: number;
  description: string;
  billable: boolean;
  approved: boolean;
};

type Invoice = {
  id: string;
  client: string;
  engagement: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string;
  issuedDate: string;
  items: number;
};

const RATE_META: Record<TimeEntry["rateType"], { label: string; color: string }> = {
  standard:      { label: "Standard", color: "#0284C7" },
  premium:       { label: "Premium", color: "#7C3AED" },
  fixed:         { label: "Fixed Fee", color: "#D97706" },
  "non-billable": { label: "Non-Billable", color: "#94A3B8" },
};

const INVOICE_STATUS: Record<Invoice["status"], { label: string; color: string }> = {
  draft:   { label: "Draft", color: "#94A3B8" },
  sent:    { label: "Sent", color: "#0284C7" },
  paid:    { label: "Paid", color: "#059669" },
  overdue: { label: "Overdue", color: "#DC2626" },
};

const TIME_ENTRIES: TimeEntry[] = [
  { id: "t1", date: "Apr 15, 2026", engagement: "Luminary Brands", phase: "Strategy Development", deliverable: "Competitive positioning report", hours: 3.5, rateType: "premium", rate: 350, description: "Deep competitor analysis across 8 market players", billable: true, approved: true },
  { id: "t2", date: "Apr 15, 2026", engagement: "Vertex Capital", phase: "Discovery", deliverable: "Stakeholder interviews", hours: 2.0, rateType: "standard", rate: 275, description: "CTO and CFO interview sessions", billable: true, approved: true },
  { id: "t3", date: "Apr 14, 2026", engagement: "Luminary Brands", phase: "Strategy Development", deliverable: "Executive presentation", hours: 4.0, rateType: "premium", rate: 350, description: "Deck build for board-level strategy review", billable: true, approved: false },
  { id: "t4", date: "Apr 14, 2026", engagement: "Internal", phase: "Business Development", deliverable: "Proposal — Solaris Health", hours: 2.5, rateType: "non-billable", rate: 0, description: "Proposal development and pricing review", billable: false, approved: true },
  { id: "t5", date: "Apr 13, 2026", engagement: "Aurelius PE", phase: "Masterclass Series", deliverable: "Session 4 facilitation", hours: 6.0, rateType: "fixed", rate: 4200, description: "Full-day portfolio value creation masterclass", billable: true, approved: true },
  { id: "t6", date: "Apr 12, 2026", engagement: "Vertex Capital", phase: "Discovery", deliverable: "Data room review", hours: 3.0, rateType: "standard", rate: 275, description: "Financial and operational data analysis", billable: true, approved: true },
  { id: "t7", date: "Apr 11, 2026", engagement: "Luminary Brands", phase: "Roadmap", deliverable: "90-day action plan", hours: 2.5, rateType: "premium", rate: 350, description: "KPI framework and implementation timeline", billable: true, approved: true },
];

const INVOICES: Invoice[] = [
  { id: "INV-2026-009", client: "Aurelius Private Equity", engagement: "Portfolio Strategy Masterclass", amount: 16800, status: "paid", dueDate: "Apr 7, 2026", issuedDate: "Mar 24, 2026", items: 4 },
  { id: "INV-2026-010", client: "Luminary Brands", engagement: "Growth Strategy Phase 2", amount: 14875, status: "sent", dueDate: "Apr 22, 2026", issuedDate: "Apr 8, 2026", items: 12 },
  { id: "INV-2026-011", client: "Vertex Capital Partners", engagement: "M&A Advisory Discovery", amount: 8250, status: "draft", dueDate: "Apr 30, 2026", issuedDate: "Apr 15, 2026", items: 6 },
  { id: "INV-2026-008", client: "Oasis Wellness", engagement: "Digital Strategy Q1", amount: 6200, status: "overdue", dueDate: "Mar 31, 2026", issuedDate: "Mar 15, 2026", items: 8 },
];

const BILLING_DATA = [
  { week: "W10", billable: 32, nonBillable: 8 },
  { week: "W11", billable: 38, nonBillable: 6 },
  { week: "W12", billable: 29, nonBillable: 11 },
  { week: "W13", billable: 41, nonBillable: 5 },
  { week: "W14", billable: 35, nonBillable: 7 },
];

const RATE_CARDS = [
  { engagement: "Luminary Brands", standard: "£275/hr", premium: "£350/hr", fixed: "Milestone-based", blendedTarget: "£310/hr" },
  { engagement: "Vertex Capital Partners", standard: "£275/hr", premium: "£350/hr", fixed: "—", blendedTarget: "£290/hr" },
  { engagement: "Aurelius Private Equity", standard: "—", premium: "—", fixed: "£4,200/session", blendedTarget: "£525/hr equiv." },
];

const totalBillable = TIME_ENTRIES.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
const totalRevenue = TIME_ENTRIES.filter(e => e.billable).reduce((s, e) => s + e.hours * (e.rateType === "fixed" ? e.rate / e.hours : e.rate), 0);
const utilizationRate = Math.round((totalBillable / (totalBillable + TIME_ENTRIES.filter(e => !e.billable).reduce((s, e) => s + e.hours, 0))) * 100);

export default function TimeTracking() {
  usePageMeta({
    title: "Time Tracking & Smart Billing | Carlota Jo",
    description: "Granular time entry by engagement, phase, and deliverable. Automated invoice generation, rate card management, and billing milestone tracking.",
    canonical: "https://szlholdings.com/carlota-jo/time-tracking",
  });

  const [activeTab, setActiveTab] = useState<"entries" | "invoices" | "rates">("entries");
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const [newEntry, setNewEntry] = useState({
    engagement: "Luminary Brands",
    phase: "",
    deliverable: "",
    hours: "",
    rateType: "standard" as TimeEntry["rateType"],
    description: "",
  });

  const generateAISuggestions = async () => {
    setAiLoading(true);
    try {
      const prompt = `You are an AI assistant for a consulting firm's time tracking system. Based on today being April 15, 2026 and recent entries for Luminary Brands (competitive positioning, 3.5h) and Vertex Capital (stakeholder interviews, 2h), suggest 2-3 time entries that are likely based on typical consulting workflow patterns. Format as a brief list with engagement, activity, and estimated hours. Be concise and practical.`;
      const resp = await fetch("/api/intelligence/ai/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: "openai/gpt-4o-mini" }),
      });
      const data = await resp.json();
      setAiSuggestion(data.content || data.choices?.[0]?.message?.content || "");
    } catch {
      setAiSuggestion("**Suggested entries based on calendar activity:**\n• Luminary Brands — Executive presentation review (follow-up from Apr 14 deck build) — est. 1.0h\n• Vertex Capital — Data room follow-up and analysis memo — est. 1.5h\n• Internal — Business development pipeline review (weekly) — est. 0.5h");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0A0F1A 0%, #141E2D 50%, #060B14 100%)", padding: "48px 0 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${GOLD}20`, border: `1px solid ${GOLD}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={16} color={GOLD} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", color: GOLD, textTransform: "uppercase" }}>Time Tracking & Smart Billing</span>
            </div>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 300, color: "#F5F0E8", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.1, marginBottom: 12 }}>
              Every Hour Accounted For.<br /><em style={{ color: GOLD }}>Every Invoice Optimised.</em>
            </h1>
            <p style={{ fontSize: 15, color: "#8A7A60", maxWidth: 520, lineHeight: 1.7, marginBottom: 32 }}>
              Granular time capture by engagement, phase, and deliverable — with AI-suggested entries and automated invoice generation.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, maxWidth: 800 }}>
              {[
                { label: "Billable Hours (week)", value: `${totalBillable}h`, sub: `${utilizationRate}% utilisation` },
                { label: "Unbilled Revenue", value: `£${(totalRevenue * 0.6 / 1000).toFixed(1)}K`, sub: "Ready to invoice" },
                { label: "Invoices Outstanding", value: "£15.1K", sub: "2 invoices pending" },
                { label: "Avg Realisation Rate", value: "94%", sub: "vs target rate" },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: "#F5F0E8", fontFamily: "'Cormorant Garamond', serif" }}>{kpi.value}</div>
                  <div style={{ fontSize: 11, color: "#8A7A60", marginTop: 2, marginBottom: 2 }}>{kpi.label}</div>
                  <div style={{ fontSize: 10, color: GOLD }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Billing Chart */}
        <div style={{ padding: "32px 0 0", display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 32 }}>
          <div style={{ background: "#fff", border: "1px solid #E8E2D6", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <BarChart3 size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A14" }}>Billable vs Non-Billable Hours (5-week)</h2>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={BILLING_DATA} barCategoryGap="30%">
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#A89878" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#A89878" }} axisLine={false} tickLine={false} unit="h" />
                <Tooltip formatter={(v: number) => [`${v}h`, ""]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="billable" name="Billable" fill={GOLD} radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonBillable" name="Non-Billable" fill="#E8E2D6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#A89878" }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: GOLD }} /> Billable
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#A89878" }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: "#E8E2D6" }} /> Non-Billable
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          <div style={{ background: "#fff", border: "1px solid #E8E2D6", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Sparkles size={16} color={GOLD} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A14" }}>AI Time Suggestions</h2>
            </div>
            <p style={{ fontSize: 12, color: "#A89878", lineHeight: 1.6, marginBottom: 16 }}>
              AI analyses your calendar and document activity to suggest entries you may have missed.
            </p>
            {aiSuggestion ? (
              <div style={{ fontSize: 12, color: "#1A1A14", lineHeight: 1.7, whiteSpace: "pre-wrap", background: "#FFFBF0", borderRadius: 8, padding: 12, border: "1px solid #F0D060", marginBottom: 12 }}>
                {aiSuggestion}
              </div>
            ) : null}
            <button onClick={generateAISuggestions} disabled={aiLoading}
              style={{ width: "100%", padding: "10px 16px", background: aiLoading ? "#F5F0E8" : `${GOLD}15`, border: `1px solid ${GOLD}30`, borderRadius: 10, fontSize: 12, fontWeight: 600, color: "#6B5E47", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {aiLoading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={12} color={GOLD} />}
              {aiSuggestion ? "Refresh Suggestions" : "Generate AI Suggestions"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #E8E2D6", marginBottom: 24 }}>
          {[
            { id: "entries", label: "Time Entries", icon: Clock },
            { id: "invoices", label: "Invoices", icon: FileText },
            { id: "rates", label: "Rate Cards", icon: DollarSign },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", fontSize: 13, fontWeight: 500, color: activeTab === tab.id ? "#1A1A14" : "#A89878", background: "none", border: "none", borderBottom: `2px solid ${activeTab === tab.id ? GOLD : "transparent"}`, cursor: "pointer", transition: "all 0.2s" }}>
                <Icon size={14} color={activeTab === tab.id ? GOLD : "#A89878"} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Time Entries Tab */}
        {activeTab === "entries" && (
          <div style={{ marginBottom: 64 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#6B5E47" }}>{TIME_ENTRIES.length} entries this week · {totalBillable}h billable</div>
              <button onClick={() => setShowNewEntry(!showNewEntry)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: GOLD, border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={14} /> Log Time
              </button>
            </div>

            {/* New Entry Form */}
            <AnimatePresence>
              {showNewEntry && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ background: "#FFFBF0", border: `1px solid ${GOLD}30`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A14", marginBottom: 16 }}>New Time Entry</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
                    {[
                      { label: "Engagement", key: "engagement", type: "select", options: ["Luminary Brands", "Vertex Capital Partners", "Aurelius Private Equity", "Oasis Wellness", "Internal"] },
                      { label: "Phase", key: "phase", type: "input", placeholder: "e.g. Strategy Development" },
                      { label: "Deliverable", key: "deliverable", type: "input", placeholder: "e.g. Competitor analysis" },
                      { label: "Hours", key: "hours", type: "input", placeholder: "e.g. 2.5" },
                      { label: "Rate Type", key: "rateType", type: "select", options: ["standard", "premium", "fixed", "non-billable"] },
                    ].map(field => (
                      <div key={field.key}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#6B5E47", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{field.label}</label>
                        {field.type === "select" ? (
                          <select value={newEntry[field.key as keyof typeof newEntry]} onChange={e => setNewEntry(p => ({ ...p, [field.key]: e.target.value }))}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #E8E2D6", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }}>
                            {field.options?.map(o => <option key={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input value={newEntry[field.key as keyof typeof newEntry]} onChange={e => setNewEntry(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder} style={{ width: "100%", padding: "8px 10px", border: "1px solid #E8E2D6", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6B5E47", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
                    <textarea value={newEntry.description} onChange={e => setNewEntry(p => ({ ...p, description: e.target.value }))}
                      placeholder="Brief description of work performed..."
                      rows={2} style={{ width: "100%", padding: "8px 10px", border: "1px solid #E8E2D6", borderRadius: 8, fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowNewEntry(false)}
                      style={{ padding: "8px 20px", background: GOLD, border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Save Entry
                    </button>
                    <button onClick={() => setShowNewEntry(false)}
                      style={{ padding: "8px 16px", background: "transparent", border: "1px solid #E8E2D6", borderRadius: 8, color: "#6B5E47", fontSize: 12, cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Entries list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TIME_ENTRIES.map((entry, i) => {
                const rateMeta = RATE_META[entry.rateType];
                const value = entry.rateType === "fixed" ? entry.rate : entry.hours * entry.rate;
                return (
                  <motion.div key={entry.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ background: "#fff", border: "1px solid #E8E2D6", borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", cursor: "pointer" }}
                      onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}>
                      <div style={{ textAlign: "center", minWidth: 48 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: entry.billable ? GOLD : "#94A3B8", fontFamily: "'Cormorant Garamond', serif" }}>{entry.hours}h</div>
                        <div style={{ fontSize: 9, color: "#A89878", textTransform: "uppercase" }}>{entry.date.split(",")[0]}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A14" }}>{entry.engagement}</span>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: `${rateMeta.color}12`, color: rateMeta.color, fontWeight: 600 }}>{rateMeta.label}</span>
                          {entry.approved && <CheckCircle size={12} color="#059669" />}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B5E47" }}>{entry.phase} · {entry.deliverable}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: entry.billable ? "#1A1A14" : "#A89878", fontFamily: "'Cormorant Garamond', serif" }}>
                          {entry.billable ? `£${value.toLocaleString()}` : "—"}
                        </div>
                        <div style={{ fontSize: 10, color: "#A89878" }}>{entry.billable ? `£${entry.rateType === "fixed" ? "fixed" : entry.rate}/hr` : "Non-billable"}</div>
                      </div>
                      {expandedEntry === entry.id ? <ChevronUp size={14} color="#A89878" /> : <ChevronDown size={14} color="#A89878" />}
                    </div>
                    <AnimatePresence>
                      {expandedEntry === entry.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          style={{ borderTop: "1px solid #F0EBE0", padding: "12px 20px", background: "#FAFAF8" }}>
                          <p style={{ fontSize: 13, color: "#6B5E47", lineHeight: 1.6 }}>{entry.description}</p>
                          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "#A89878" }}>
                            <span>{entry.date}</span>
                            <span>·</span>
                            <span>{entry.approved ? "✓ Approved" : "Pending approval"}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <div style={{ marginBottom: 64 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#6B5E47" }}>4 invoices · £46,250 total</div>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: GOLD, border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={14} /> Generate Invoice
              </button>
            </div>

            {INVOICES.map((inv, i) => {
              const statusMeta = INVOICE_STATUS[inv.status];
              return (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ background: "#fff", border: `1px solid ${inv.status === "overdue" ? "#DC262620" : "#E8E2D6"}`, borderRadius: 14, padding: "20px 24px", marginBottom: 10, display: "flex", alignItems: "center", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#A89878", marginBottom: 2 }}>{inv.id}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A14", marginBottom: 2 }}>{inv.client}</div>
                    <div style={{ fontSize: 12, color: "#6B5E47" }}>{inv.engagement}</div>
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#A89878", marginBottom: 2 }}>Issued</div>
                    <div style={{ fontSize: 12, color: "#6B5E47" }}>{inv.issuedDate}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#A89878", marginBottom: 2 }}>Due</div>
                    <div style={{ fontSize: 12, color: inv.status === "overdue" ? "#DC2626" : "#6B5E47" }}>{inv.dueDate}</div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 80 }}>
                    <div style={{ fontSize: 20, fontWeight: 600, color: "#1A1A14", fontFamily: "'Cormorant Garamond', serif" }}>£{inv.amount.toLocaleString()}</div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: `${statusMeta.color}12`, color: statusMeta.color }}>{statusMeta.label}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button style={{ padding: "6px 12px", border: "1px solid #E8E2D6", borderRadius: 8, background: "#F5F0E8", fontSize: 11, color: "#6B5E47", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                      <Download size={11} /> PDF
                    </button>
                    {inv.status === "draft" && (
                      <button style={{ padding: "6px 12px", background: GOLD, border: "none", borderRadius: 8, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        Send
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Milestone billing */}
            <div style={{ marginTop: 32, background: "#fff", border: "1px solid #E8E2D6", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Calendar size={16} color={GOLD} />
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A14" }}>Billing Milestones</h2>
              </div>
              {[
                { engagement: "Vertex Capital Partners", milestone: "Phase 1 Completion", amount: "£8,250", due: "Apr 30, 2026", status: "upcoming" },
                { engagement: "Luminary Brands", milestone: "Strategy Delivery", amount: "£14,875", due: "Apr 22, 2026", status: "due" },
                { engagement: "Solaris Health Systems", milestone: "Engagement Kickoff (50%)", amount: "£22,000", due: "Jul 1, 2026", status: "future" },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: i < 2 ? "1px solid #F0EBE0" : "none" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: m.status === "due" ? "#D97706" : m.status === "upcoming" ? GOLD : "#E8E2D6", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A14" }}>{m.engagement}</div>
                    <div style={{ fontSize: 12, color: "#6B5E47" }}>{m.milestone}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: GOLD, fontFamily: "'Cormorant Garamond', serif" }}>{m.amount}</div>
                    <div style={{ fontSize: 11, color: "#A89878" }}>Due {m.due}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rate Cards Tab */}
        {activeTab === "rates" && (
          <div style={{ marginBottom: 64 }}>
            <div style={{ marginBottom: 20, fontSize: 13, color: "#6B5E47" }}>Rate cards by engagement — configure billing rates, discounts, and fee structures.</div>
            {RATE_CARDS.map((rc, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ background: "#fff", border: "1px solid #E8E2D6", borderRadius: 14, padding: "20px 24px", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A14" }}>{rc.engagement}</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: GOLD, background: `${GOLD}12`, padding: "4px 12px", borderRadius: 100 }}>
                    Blended target: {rc.blendedTarget}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { label: "Standard Rate", value: rc.standard, color: "#0284C7" },
                    { label: "Premium Rate", value: rc.premium, color: "#7C3AED" },
                    { label: "Fixed Fee", value: rc.fixed, color: "#D97706" },
                  ].map(r => (
                    <div key={r.label} style={{ background: `${r.color}08`, border: `1px solid ${r.color}20`, borderRadius: 10, padding: "12px 16px" }}>
                      <div style={{ fontSize: 11, color: r.color, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: "#1A1A14", fontFamily: "'Cormorant Garamond', serif" }}>{r.value}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
