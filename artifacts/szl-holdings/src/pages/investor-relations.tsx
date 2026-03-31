import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { ArrowRight, Download, TrendingUp, Shield, Globe, Layers, BarChart3, CheckCircle, FileText, Users, Loader2, BookOpen, Zap } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

async function downloadPDF(template: string, data: Record<string, unknown>, filename: string): Promise<void> {
  const res = await fetch("/api/documents/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ template, data }),
  });
  if (!res.ok) throw new Error("PDF generation failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API_BASE = `${BASE}/api`;

interface CmsPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  contentType: string;
  publishedAt: string | null;
  createdAt: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const REVENUE_TRACKS = [
  {
    label: "Carlota Jo",
    tag: "Immediate",
    description: "Premium private advisory services generating immediate, recurring revenue through high-trust, high-margin client engagements. Cash flow positive from day one.",
    accent: "hsl(38,55%,58%)",
    colorRgb: "191,152,82",
    icon: Globe,
    metrics: ["High-margin service contracts", "Recurring retainer model", "Low capital intensity"],
  },
  {
    label: "Terra",
    tag: "Wedge",
    description: "Real estate intelligence platform serving brokers, investors, and operators with distress property data, deal pipeline tools, and market intelligence. NYC as the beachhead.",
    accent: "hsl(88,42%,44%)",
    colorRgb: "85,140,48",
    icon: BarChart3,
    metrics: ["Subscription SaaS model", "Distress data moat", "Broker + investor segments"],
  },
  {
    label: "Aegis",
    tag: "Enterprise",
    description: "Unified defense and intelligence command platform for enterprise security teams, MSPs, and AI operators. High-ACV contracts with strong expansion revenue.",
    accent: "hsl(232,68%,60%)",
    colorRgb: "99,102,241",
    icon: Shield,
    metrics: ["Enterprise contract model", "Multi-module expansion", "SOC + MSP + AI intelligence"],
  },
];

const MARKET_POINTS = [
  {
    title: "Business Observability is a $12B+ market",
    body: "Organizations of every scale suffer from invisible risk — approval latency, ownership gaps, workflow friction that compounds into operational failure. Lyte addresses this from first principles.",
  },
  {
    title: "Maritime intelligence is systematically underserved",
    body: "Fleet operators, charterers, and commodity traders depend on fragmented data sources with no operational command layer. Vessels is the first purpose-built maritime command platform.",
  },
  {
    title: "Cybersecurity consolidation creates the enterprise MSP opportunity",
    body: "Enterprises and MSPs are collapsing their security stacks. Aegis provides unified SOC, XDR, managed operations, and AI intelligence — replacing four fragmented vendors with one command surface.",
  },
  {
    title: "Real estate intelligence is data-rich and workflow-poor",
    body: "Sophisticated operators have access to more data than ever and fewer tools to act on it. Terra converts distress signals, ownership data, and deal intelligence into structured workflow.",
  },
];

const TEAM = [
  {
    name: "Stephen Lutar",
    title: "Founder & Chief Executive",
    bio: "Builder, operator, and systems architect. Designed and operates the full SZL ecosystem across six platforms. Background in workflow design, command systems, and multi-domain intelligence. Link to full profile below.",
    href: "/founder",
  },
];

const DOCUMENTS = [
  { name: "SZL Holdings One-Pager", type: "Overview", date: "Q1 2026" },
  { name: "Platform Architecture Brief", type: "Technical", date: "Q1 2026" },
  { name: "Market Opportunity Summary", type: "Strategic", date: "Q1 2026" },
];

export default function InvestorRelationsPage() {
  const [requestSent, setRequestSent] = useState(false);
  const [requestEmail, setRequestEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [docError, setDocError] = useState("");
  const [downloadingLetter, setDownloadingLetter] = useState(false);
  const [downloadingPortfolio, setDownloadingPortfolio] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const handleDownloadLetter = async () => {
    setDownloadingLetter(true);
    setDownloadError("");
    try {
      await downloadPDF("szl-investor-letter", { quarter: "Q1 2026" }, "szl-investor-letter-q1-2026.pdf");
    } catch {
      setDownloadError("PDF generation failed. Please try again.");
    } finally {
      setDownloadingLetter(false);
    }
  };

  const handleDownloadPortfolio = async () => {
    setDownloadingPortfolio(true);
    setDownloadError("");
    try {
      await downloadPDF("szl-portfolio-report", { asOf: "March 31, 2026" }, "szl-portfolio-report-q1-2026.pdf");
    } catch {
      setDownloadError("PDF generation failed. Please try again.");
    } finally {
      setDownloadingPortfolio(false);
    }
  };

  const [investorLetters, setInvestorLetters] = useState<CmsPost[]>([]);
  const [platformUpdates, setPlatformUpdates] = useState<CmsPost[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/cms/posts?content_type=investor-letter`)
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.data) setInvestorLetters(json.data); })
      .catch(() => {});
    fetch(`${API_BASE}/cms/posts?content_type=update`)
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.data) setPlatformUpdates(json.data.slice(0, 4)); })
      .catch(() => {});
  }, []);

  usePageMeta({
    title: "Investor Relations — SZL Holdings",
    description: "SZL Holdings investor information: market opportunity, revenue model, platform architecture, and team. Request materials or start a conversation.",
    canonical: "https://szlholdings.com/investor-relations",
  });

  const handleDocRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail.trim()) return;
    setDocError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/holdings/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Document Request",
          email: requestEmail.trim(),
          subject: "Investor Document Request",
          message: `Investor document request from ${requestEmail.trim()}`,
        }),
      });
      if (response.status === 201 || response.ok) {
        setRequestSent(true);
      } else {
        setDocError("Request failed. Please try again or email hello@szlholdings.com directly.");
      }
    } catch {
      setDocError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main className="pt-24">

        <section style={{ padding: "4rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                Investor Relations
              </p>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.08, marginBottom: "1.25rem" }}>
                One disciplined company.<br />Three monetization tracks.
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(210,5%,58%)", maxWidth: "38rem", marginBottom: "2rem" }}>
                SZL Holdings is building the command-layer infrastructure for organizations where unreliability is not a recoverable condition. Six platforms. One architecture. Compounding institutional knowledge across every domain we touch.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link
                  href="/contact"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.625rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)", textDecoration: "none", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,88%)"; }}
                >
                  Start a Conversation <ArrowRight size={13} strokeWidth={2.5} />
                </Link>
                <a
                  href="mailto:hello@szlholdings.com?subject=Investor Inquiry"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.625rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 500, color: "hsl(210,5%,56%)", border: "1px solid hsla(0,0%,100%,0.09)", textDecoration: "none", background: "transparent", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,88%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.18)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,56%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.09)"; }}
                >
                  hello@szlholdings.com
                </a>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.5rem" }}>
              Revenue Model
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {REVENUE_TRACKS.map((track, i) => {
                const Icon = track.icon;
                return (
                  <m.div
                    key={track.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      padding: "1.5rem",
                      borderRadius: "12px",
                      background: `rgba(${track.colorRgb}, 0.04)`,
                      border: `1px solid rgba(${track.colorRgb}, 0.16)`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${track.colorRgb}, 0.12)`, border: `1px solid rgba(${track.colorRgb}, 0.22)` }}>
                          <Icon size={13} style={{ color: track.accent }} />
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,90%)", letterSpacing: "-0.008em" }}>{track.label}</span>
                      </div>
                      <span style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 8px", borderRadius: "4px", background: `rgba(${track.colorRgb}, 0.12)`, color: track.accent }}>
                        {track.tag}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", lineHeight: 1.65, color: "hsl(210,5%,56%)", marginBottom: "1rem" }}>
                      {track.description}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      {track.metrics.map((m) => (
                        <div key={m} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <CheckCircle size={11} style={{ color: track.accent, flexShrink: 0, opacity: 0.8 }} />
                          <span style={{ fontSize: "11.5px", color: "hsl(210,5%,52%)" }}>{m}</span>
                        </div>
                      ))}
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)", background: "hsl(210,12%,6%)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.5rem" }}>
              Market Opportunity
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {MARKET_POINTS.map((point, i) => (
                <m.div
                  key={point.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  style={{ padding: "1.375rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                >
                  <div style={{ width: "4px", height: "20px", borderRadius: "2px", background: "hsl(190,80%,55%)", opacity: 0.5, marginBottom: "0.75rem" }} />
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "hsl(38,12%,88%)", marginBottom: "0.5rem", letterSpacing: "-0.008em" }}>{point.title}</p>
                  <p style={{ fontSize: "12.5px", lineHeight: 1.65, color: "hsl(210,5%,55%)" }}>{point.body}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
                  The SZL Thesis
                </p>
                <div className="space-y-4" style={{ maxWidth: "520px" }}>
                  {[
                    { heading: "Systems over features", body: "Features are copied. Systems — the interconnected logic of how an organization actually works — are not. Every SZL platform is designed around the operational system, not the feature request." },
                    { heading: "Operators, not advisors", body: "SZL Holdings does not deliver recommendations. It builds systems, operates them, and owns the outcomes. Skin in the game is a design constraint, not a philosophy." },
                    { heading: "Compounding architecture", body: "Six platforms on one backbone means every platform gets smarter as the others grow. Data from Vessels informs Aegis. Terra patterns inform Alloy's normalization layer. The whole is structurally greater than the sum." },
                  ].map((item, i) => (
                    <m.div
                      key={item.heading}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      style={{ padding: "1.125rem 1.25rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)" }}
                    >
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,86%)", marginBottom: "0.35rem" }}>{item.heading}</p>
                      <p style={{ fontSize: "12.5px", lineHeight: 1.6, color: "hsl(210,5%,52%)" }}>{item.body}</p>
                    </m.div>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
                  Team
                </p>
                {TEAM.map((person) => (
                  <m.div
                    key={person.name}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{ padding: "1.5rem", borderRadius: "12px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)", marginBottom: "1rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "hsla(0,0%,100%,0.08)", border: "1px solid hsla(0,0%,100%,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Users size={16} style={{ color: "hsl(210,5%,52%)" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "hsl(38,12%,90%)", letterSpacing: "-0.008em" }}>{person.name}</p>
                        <p style={{ fontSize: "11px", color: "hsl(210,5%,46%)" }}>{person.title}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: "12.5px", lineHeight: 1.65, color: "hsl(210,5%,54%)", marginBottom: "0.875rem" }}>{person.bio}</p>
                    <Link href={person.href} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, color: "hsl(190,90%,55%)", textDecoration: "none" }}>
                      Full Profile <ArrowRight size={11} strokeWidth={2.5} />
                    </Link>
                  </m.div>
                ))}

                <div style={{ marginTop: "2rem" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1rem" }}>
                    Request Materials
                  </p>
                  {requestSent ? (
                    <div style={{ padding: "1.25rem", borderRadius: "10px", background: "hsla(142,62%,46%,0.07)", border: "1px solid hsla(142,62%,46%,0.2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <CheckCircle size={16} style={{ color: "hsl(142,62%,46%)" }} />
                        <p style={{ fontSize: "13px", color: "hsl(142,62%,62%)", fontWeight: 500 }}>Request received. We will follow up within 24 hours.</p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleDocRequest}>
                      <div style={{ display: "flex", gap: "0.625rem" }}>
                        <input
                          type="email"
                          value={requestEmail}
                          onChange={(e) => setRequestEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          style={{
                            flex: 1, padding: "0.625rem 0.875rem", background: "hsla(0,0%,100%,0.04)",
                            border: "1px solid hsla(0,0%,100%,0.09)", borderRadius: "6px",
                            color: "hsl(38,12%,88%)", fontSize: "13px", outline: "none",
                          }}
                        />
                        <button
                          type="submit"
                          disabled={submitting}
                          style={{ padding: "0.625rem 1rem", background: "hsla(0,0%,100%,0.08)", border: "1px solid hsla(0,0%,100%,0.12)", borderRadius: "6px", color: "hsl(38,12%,84%)", fontSize: "12px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "5px", flexShrink: 0, transition: "all 0.18s" }}
                        >
                          <FileText size={12} />
                          {submitting ? "…" : "Request"}
                        </button>
                      </div>
                      {docError && <p style={{ fontSize: "11.5px", color: "hsl(0,72%,65%)", marginTop: "0.4rem" }}>{docError}</p>}
                      {!docError && <p style={{ fontSize: "11px", color: "hsl(210,5%,40%)", marginTop: "0.5rem" }}>One-pager, architecture brief, and market summary.</p>}
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {investorLetters.length > 0 && (
          <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)", background: "hsl(210,12%,6%)" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <BookOpen size={13} style={{ color: "hsl(210,5%,42%)" }} />
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)" }}>
                  Quarterly Letters
                </p>
              </div>
              <div className="space-y-2">
                {investorLetters.map((letter, i) => (
                  <m.div
                    key={letter.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    style={{ padding: "1.25rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,86%)" }}>{letter.title}</p>
                      </div>
                      {letter.excerpt && (
                        <p style={{ fontSize: "12px", color: "hsl(210,5%,52%)", lineHeight: 1.6 }}>{letter.excerpt}</p>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", flexShrink: 0 }}>
                      <span style={{ fontSize: "10.5px", color: "hsl(210,5%,40%)" }}>{formatDate(letter.publishedAt)}</span>
                      <span style={{ fontSize: "10px", color: "hsl(210,5%,38%)", display: "flex", alignItems: "center", gap: "3px" }}>
                        <FileText size={11} /> Investor Update
                      </span>
                    </div>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {platformUpdates.length > 0 && (
          <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <Zap size={13} style={{ color: "hsl(210,5%,42%)" }} />
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)" }}>
                  Platform Updates
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {platformUpdates.map((update, i) => (
                  <m.div
                    key={update.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    style={{ padding: "1.25rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.5rem" }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "hsl(190,80%,55%)", opacity: 0.7, flexShrink: 0 }} />
                      <span style={{ fontSize: "10px", color: "hsl(210,5%,40%)" }}>{formatDate(update.publishedAt)}</span>
                    </div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,86%)", marginBottom: "0.375rem", lineHeight: 1.4 }}>{update.title}</p>
                    {update.excerpt && (
                      <p style={{ fontSize: "12px", color: "hsl(210,5%,52%)", lineHeight: 1.6 }}>{update.excerpt}</p>
                    )}
                  </m.div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section style={{ padding: "3rem 0 5rem", borderTop: "1px solid hsla(0,0%,100%,0.04)", background: "hsl(210,12%,6%)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.5rem" }}>
              Platform Documents
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              {DOCUMENTS.map((doc, i) => (
                <m.div
                  key={doc.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                  style={{ padding: "1.125rem 1.25rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <div>
                    <p style={{ fontSize: "12.5px", fontWeight: 600, color: "hsl(38,12%,84%)", marginBottom: "0.25rem" }}>{doc.name}</p>
                    <p style={{ fontSize: "10.5px", color: "hsl(210,5%,40%)" }}>{doc.type} · {doc.date}</p>
                  </div>
                  {i === 0 ? (
                    <button
                      onClick={handleDownloadLetter}
                      disabled={downloadingLetter}
                      style={{ fontSize: "10px", color: "hsl(190,90%,55%)", display: "flex", alignItems: "center", gap: "4px", background: "transparent", border: "none", cursor: downloadingLetter ? "not-allowed" : "pointer", opacity: downloadingLetter ? 0.6 : 1 }}
                    >
                      {downloadingLetter ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={12} />}
                      {downloadingLetter ? "Generating..." : "Download PDF"}
                    </button>
                  ) : i === 1 ? (
                    <button
                      onClick={handleDownloadPortfolio}
                      disabled={downloadingPortfolio}
                      style={{ fontSize: "10px", color: "hsl(190,90%,55%)", display: "flex", alignItems: "center", gap: "4px", background: "transparent", border: "none", cursor: downloadingPortfolio ? "not-allowed" : "pointer", opacity: downloadingPortfolio ? 0.6 : 1 }}
                    >
                      {downloadingPortfolio ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Download size={12} />}
                      {downloadingPortfolio ? "Generating..." : "Download PDF"}
                    </button>
                  ) : (
                    <span style={{ fontSize: "10px", color: "hsl(210,5%,38%)", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Download size={12} />
                      On request
                    </span>
                  )}
                </m.div>
              ))}
            </div>
            {downloadError && <p style={{ fontSize: "11px", color: "hsl(0,72%,51%)", marginTop: "8px" }}>{downloadError}</p>}
            <p style={{ fontSize: "12px", color: "hsl(210,5%,38%)", lineHeight: 1.65, maxWidth: "38rem" }}>
              SZL Holdings is a private operating company. This page describes our business model and platform strategy for qualified investors and strategic partners. Detailed financials are available under NDA. Contact <a href="mailto:hello@szlholdings.com" style={{ color: "hsl(210,5%,52%)" }}>hello@szlholdings.com</a> to begin a conversation.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
