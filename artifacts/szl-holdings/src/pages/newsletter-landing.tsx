import { useState } from "react";
import { m } from "framer-motion";
import { Mail, ArrowRight, CheckCircle, BookOpen, Cpu, Shield, TrendingUp } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const API = import.meta.env.VITE_API_URL || "";

const PILLARS = [
  { icon: Cpu, label: "AI & Automation Intelligence", desc: "Enterprise AI strategy, model governance, deployment patterns" },
  { icon: Shield, label: "Cybersecurity & SOC Ops", desc: "Threat intelligence, zero-trust architecture, compliance automation" },
  { icon: TrendingUp, label: "Real Estate & Maritime Intel", desc: "Market signals, fleet optimization, distress analysis" },
  { icon: BookOpen, label: "Founder Playbooks", desc: "Scaling frameworks, hiring, fundraising, and operational design" },
];

export default function NewsletterLandingPage() {
  const __pageMeta = usePageMeta({ title: "Newsletter — SZL Holdings", description: "Strategic intelligence briefings for technical founders and enterprise leaders. AI, cybersecurity, real estate, maritime." });
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch(`${API}/api/distribution-os/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "newsletter-landing", medium: "web", interest_area: "newsletter", consent: true }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
    setLoading(false);
  }

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "#070a10" }}>
        <SiteNav />
        <main style={{ maxWidth: "720px", margin: "0 auto", padding: "6rem 1.5rem 4rem" }}>
          <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <Mail size={18} style={{ color: "#d4a054" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#d4a054", letterSpacing: "0.1em", textTransform: "uppercase" }}>Strategic Intelligence</span>
            </div>
  
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700, color: "#e8e4de", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: "1rem" }}>
              The SZL Briefing
            </h1>
            <p style={{ fontSize: "1.125rem", color: "#8b8579", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: "560px" }}>
              Weekly intelligence briefings for technical founders and enterprise leaders.
              Analysis on AI strategy, cybersecurity posture, market signals, and operational frameworks — delivered with precision.
            </p>
  
            {!submitted ? (
              <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.75rem", marginBottom: "3rem", flexWrap: "wrap" }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    flex: "1 1 260px",
                    padding: "0.75rem 1rem",
                    background: "hsla(0,0%,100%,0.04)",
                    border: "1px solid hsla(0,0%,100%,0.1)",
                    borderRadius: "8px",
                    color: "#e8e4de",
                    fontSize: "0.9375rem",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "0.75rem 1.75rem",
                    background: "linear-gradient(135deg, #d4a054, #c8953c)",
                    color: "#070a10",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  Subscribe <ArrowRight size={14} />
                </button>
              </form>
            ) : (
              <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", background: "hsla(120,30%,20%,0.15)", border: "1px solid hsla(120,30%,40%,0.2)", borderRadius: "8px", marginBottom: "3rem" }}>
                <CheckCircle size={20} style={{ color: "#5a9c5a" }} />
                <span style={{ color: "#e8e4de", fontSize: "0.9375rem" }}>You're in. Watch for your first briefing.</span>
              </m.div>
            )}
          </m.div>
  
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <h2 style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b6560", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5rem" }}>What You'll Get</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {PILLARS.map((p, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  style={{
                    padding: "1.25rem",
                    background: "hsla(0,0%,100%,0.03)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                    borderRadius: "10px",
                  }}
                >
                  <p.icon size={20} style={{ color: "#d4a054", marginBottom: "0.75rem" }} />
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#e8e4de", marginBottom: "0.375rem" }}>{p.label}</h3>
                  <p style={{ fontSize: "0.8125rem", color: "#6b6560", lineHeight: 1.5 }}>{p.desc}</p>
                </m.div>
              ))}
            </div>
          </m.div>
  
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} style={{ marginTop: "3rem", padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", lineHeight: 1.6 }}>
              <strong style={{ color: "#8b8579" }}>No spam, ever.</strong> One briefing per week, actionable intelligence only.
              Unsubscribe anytime. Your data stays with SZL Holdings — we never sell or share subscriber information.
            </p>
          </m.div>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
