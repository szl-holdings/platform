import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Send, BookOpen, X, ThumbsUp } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

const CATEGORIES = [
  { value: "technical", label: "Technical issue" },
  { value: "billing", label: "Billing & account" },
  { value: "account", label: "Account access" },
  { value: "feature_request", label: "Feature request" },
  { value: "data_privacy", label: "Data & privacy" },
  { value: "security", label: "Security concern" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low", desc: "Question or non-urgent request" },
  { value: "medium", label: "Medium", desc: "Feature not working as expected" },
  { value: "high", label: "High", desc: "Significant feature or workflow impact" },
  { value: "urgent", label: "Urgent", desc: "Production outage or data loss" },
];

interface KbArticle {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  score: number;
}

export default function SupportSubmitPage() {
  const __pageMeta = usePageMeta({
    title: "Submit a Request — SZL Holdings Support",
    description: "Submit a support request to the SZL Holdings team.",
  });

  const [form, setForm] = useState({
    submitterName: "",
    submitterEmail: "",
    category: "technical",
    priority: "medium",
    subject: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ ticketRef: string } | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [kbSuggestions, setKbSuggestions] = useState<KbArticle[]>([]);
  const [deflectedWith, setDeflectedWith] = useState<string | null>(null);
  const deflectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = form.subject.trim();
    if (q.length < 5) {
      setKbSuggestions([]);
      return;
    }
    if (deflectTimer.current) clearTimeout(deflectTimer.current);
    deflectTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/support/knowledge/deflect?q=${encodeURIComponent(q)}&limit=3`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setKbSuggestions(data.articles ?? []);
      } catch {
        // silently ignore
      }
    }, 600);
    return () => {
      if (deflectTimer.current) clearTimeout(deflectTimer.current);
    };
  }, [form.subject]);

  const handleDeflectionConfirm = async (slug: string, title: string) => {
    try {
      await fetch(`${API}/support/knowledge/deflect/${slug}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      setDeflectedWith(title);
      setKbSuggestions([]);
    } catch {
      toast.error("Could not record your confirmation. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;

    const name = form.submitterName.trim();
    const email = form.submitterEmail.trim();
    const subject = form.subject.trim();
    const description = form.description.trim();

    if (!name || !email || !subject || !description) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (subject.length < 5) {
      toast.error("Please provide a more descriptive subject line.");
      return;
    }
    if (description.length < 20) {
      toast.error("Please provide more detail in the description (at least 20 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/support/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed");
      const data = await res.json();
      setSubmitted({ ticketRef: data.ticket.ticketRef });
    } catch {
      toast.error("Failed to submit your request. Please try again or email support@szlholdings.com.");
    } finally {
      setSubmitting(false);
    }
  };

  const _ACCENT = "hsl(192,72%,48%)";

  if (deflectedWith) {
    return (
      <>
        {__pageMeta}
        <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
          <SiteNav />
          <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 200px)", padding: "6rem 1.5rem 4rem" }}>
            <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ textAlign: "center", maxWidth: "480px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "hsla(192,72%,48%,0.1)", border: "1px solid hsla(192,72%,48%,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <ThumbsUp size={24} style={{ color: "hsl(192,72%,48%)" }} />
              </div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "hsl(38,12%,94%)", marginBottom: "0.75rem" }}>Great — glad that helped!</h1>
              <p style={{ fontSize: "14px", color: "hsl(210,5%,55%)", lineHeight: 1.7, marginBottom: "0.75rem" }}>
                The article <strong style={{ color: "hsl(38,12%,80%)" }}>"{deflectedWith}"</strong> answered your question. No ticket has been created.
              </p>
              <p style={{ fontSize: "13px", color: "hsl(210,5%,45%)", lineHeight: 1.6, marginBottom: "2rem" }}>
                If you still need help, you can submit a ticket any time.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => { setDeflectedWith(null); setKbSuggestions([]); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)", border: "none", cursor: "pointer" }}
                >
                  Submit a ticket anyway
                </button>
                <Link href="/support" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 500, color: "hsl(210,5%,55%)", border: "1px solid hsla(0,0%,100%,0.09)", textDecoration: "none" }}>
                  Back to support
                </Link>
              </div>
            </m.div>
          </main>
          <SiteFooter />
        </div>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        {__pageMeta}
        <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 200px)", padding: "6rem 1.5rem 4rem" }}>
          <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ textAlign: "center", maxWidth: "480px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "hsla(142,60%,50%,0.1)", border: "1px solid hsla(142,60%,50%,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <CheckCircle2 size={24} style={{ color: "hsl(142,60%,50%)" }} />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "hsl(38,12%,94%)", marginBottom: "0.75rem" }}>Request submitted</h1>
            <p style={{ fontSize: "14px", color: "hsl(210,5%,55%)", lineHeight: 1.7, marginBottom: "1rem" }}>
              Your support request has been received. You'll receive an email confirmation and our team will respond within the timeframe for your priority level.
            </p>
            <div style={{ display: "inline-block", padding: "0.625rem 1.25rem", borderRadius: "6px", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", marginBottom: "2rem" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(210,5%,42%)" }}>Reference: </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "hsl(192,72%,48%)", fontFamily: "var(--font-mono)" }}>{submitted.ticketRef}</span>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/support/tickets" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)", textDecoration: "none" }}>
                View my tickets
              </Link>
              <Link href="/support" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 500, color: "hsl(210,5%,55%)", border: "1px solid hsla(0,0%,100%,0.09)", textDecoration: "none" }}>
                Back to support
              </Link>
            </div>
          </m.div>
        </main>
        <SiteFooter />
      </div>
      </>
    );
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "6px",
    background: "hsla(0,0%,100%,0.04)",
    border: "1px solid hsla(0,0%,100%,0.1)",
    color: "hsl(38,12%,88%)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "hsl(210,5%,50%)",
    marginBottom: "0.5rem",
  };

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main style={{ maxWidth: "660px", margin: "0 auto", padding: "7rem 1.5rem 4rem" }}>
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/support" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "hsl(210,5%,45%)", textDecoration: "none", marginBottom: "2rem" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,72%)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,45%)"; }}>
            <ArrowLeft size={12} /> Back to support
          </Link>

          <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.625rem" }}>Support</p>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,94%)", marginBottom: "0.625rem" }}>Submit a request</h1>
          <p style={{ fontSize: "14px", color: "hsl(210,5%,55%)", lineHeight: 1.6, marginBottom: "2.5rem" }}>
            Describe your issue and we'll get back to you. Enterprise customers receive responses within 4 business hours for standard priority.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Your name *</label>
                <input type="text" required value={form.submitterName} onChange={(e) => setForm((f) => ({ ...f, submitterName: e.target.value }))} placeholder="Full name" style={fieldStyle} maxLength={100} />
              </div>
              <div>
                <label style={labelStyle}>Email address *</label>
                <input type="email" required value={form.submitterEmail} onChange={(e) => setForm((f) => ({ ...f, submitterEmail: e.target.value }))} placeholder="you@company.com" style={fieldStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={{ ...fieldStyle, appearance: "none", cursor: "pointer" }}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} style={{ ...fieldStyle, appearance: "none", cursor: "pointer" }}>
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Subject *</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Brief description of your issue"
                style={fieldStyle}
                maxLength={200}
                minLength={5}
              />
              <AnimatePresence>
                {kbSuggestions.length > 0 && (
                  <m.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    style={{ marginTop: "0.75rem", padding: "1rem", borderRadius: "8px", background: "hsla(192,72%,48%,0.06)", border: "1px solid hsla(192,72%,48%,0.2)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <BookOpen size={13} style={{ color: "hsl(192,72%,48%)" }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "hsl(192,72%,48%)" }}>We found articles that may help</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setKbSuggestions([])}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: "hsl(210,5%,42%)", display: "flex" }}
                        aria-label="Dismiss suggestions"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {kbSuggestions.map((article) => (
                        <div
                          key={article.id}
                          style={{ padding: "0.75rem", borderRadius: "6px", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.07)" }}
                        >
                          <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "0.75rem" }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,88%)", marginBottom: "0.25rem" }}>{article.title}</p>
                              {article.summary && (
                                <p style={{ fontSize: "12px", color: "hsl(210,5%,48%)", lineHeight: 1.5, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{article.summary}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeflectionConfirm(article.slug, article.title)}
                              style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "5px", padding: "0.4rem 0.75rem", borderRadius: "5px", fontSize: "11px", fontWeight: 600, background: "hsla(192,72%,48%,0.12)", border: "1px solid hsla(192,72%,48%,0.3)", color: "hsl(192,72%,52%)", cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              <ThumbsUp size={10} />
                              This helped
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: "11px", color: "hsl(210,5%,38%)", marginTop: "0.625rem", marginBottom: 0 }}>
                      If an article answers your question, click "This helped" to close without creating a ticket.
                    </p>
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label style={labelStyle}>Description *</label>
              <textarea required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Please describe the issue in detail. Include steps to reproduce, expected vs actual behaviour, and any error messages." rows={7} style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.6 }} maxLength={5000} minLength={20} />
              <p style={{ fontSize: "11px", color: "hsl(210,5%,38%)", marginTop: "0.375rem" }}>{form.description.length}/5000 characters</p>
            </div>

            <button type="submit" disabled={submitting} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "0.875rem 1.5rem", borderRadius: "6px", fontSize: "14px", fontWeight: 700, color: "hsl(210,12%,6%)", background: submitting ? "hsl(210,5%,40%)" : "hsl(210,8%,88%)", border: "none", cursor: submitting ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
              <Send size={14} />
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          </form>
        </m.div>
      </main>
      <SiteFooter />
    </div>
    </>
  );
}
