import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { m } from "framer-motion";
import { Search, MessageSquare, BookOpen, ArrowRight, CheckCircle2, Clock, Shield, ChevronRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

interface KBArticle {
  id: string | number;
  slug: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }),
};

const QUICK_LINKS = [
  { icon: MessageSquare, label: "Submit a request", desc: "Open a new support ticket", href: "/support/submit", accent: "hsl(192,72%,48%)" },
  { icon: Clock, label: "My tickets", desc: "View status of your requests", href: "/support/tickets", accent: "hsl(260,72%,62%)" },
  { icon: Shield, label: "Security disclosure", desc: "Report a vulnerability responsibly", href: "/legal/security-disclosure", accent: "hsl(0,72%,55%)" },
];

const STATUS_ITEMS = [
  { name: "API & Platform", status: "operational" },
  { name: "Authentication", status: "operational" },
  { name: "KORA — Business Observability", status: "operational" },
  { name: "Counsel — Execution Fabric", status: "operational" },
  { name: "Data Pipelines", status: "operational" },
];

export default function SupportPortalPage() {
  const __pageMeta = usePageMeta({
    title: "Support — SZL Holdings",
    description: "SZL Holdings customer support. Submit requests, track tickets, and browse the knowledge base.",
    canonical: "https://szlholdings.com/support",
  });

  const [search, setSearch] = useState("");

  const { data: kbData, isLoading } = useStandardQuery({
    queryKey: ["support-kb", search],
    queryFn: async () => {
      const params = search ? `?q=${encodeURIComponent(search)}` : "";
      const res = await fetch(`${API}/support/knowledge${params}`);
      if (!res.ok) throw new Error("Failed to load articles");
      return res.json() as Promise<{ articles: KBArticle[] }>;
    },
  });

  const articles = kbData?.articles ?? [];

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <main className="pt-24">
  
          <section style={{ padding: "4rem 0 3rem" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <m.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>Support</p>
                <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,94%)", marginBottom: "1rem" }}>
                  How can we help?
                </h1>
                <p style={{ fontSize: "15px", color: "hsl(210,5%,56%)", maxWidth: "36rem", marginBottom: "2rem" }}>
                  Browse the knowledge base, submit a support request, or track an existing ticket. Enterprise customers can expect responses within 4 business hours.
                </p>
              </m.div>
  
              <m.div initial="hidden" animate="show" variants={fadeUp} custom={1} style={{ display: "flex", alignItems: "center", gap: "0.75rem", maxWidth: "36rem", padding: "0.75rem 1rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.09)" }}>
                <Search size={15} style={{ color: "hsl(210,5%,42%)", flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search the knowledge base…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "14px", color: "hsl(38,12%,88%)", caretColor: "hsl(192,72%,48%)" }}
                />
              </m.div>
            </div>
          </section>
  
          <section style={{ padding: "0 0 3rem", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-8">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                {QUICK_LINKS.map((link, i) => (
                  <m.div key={link.label} custom={i} initial="hidden" animate="show" variants={fadeUp}>
                    <Link href={link.href} style={{ display: "block", padding: "1.5rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)", textDecoration: "none", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${link.accent}30`; (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.07)"; (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)"; }}>
                      <link.icon size={18} style={{ color: link.accent, marginBottom: "0.875rem" }} />
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "hsl(38,12%,88%)", marginBottom: "0.25rem" }}>{link.label}</p>
                      <p style={{ fontSize: "12px", color: "hsl(210,5%,50%)" }}>{link.desc}</p>
                    </Link>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "2rem 0 4rem" }}>
            <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "3rem", alignItems: "start" }}>
  
                <div>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "hsl(38,12%,88%)", marginBottom: "1.25rem" }}>
                    {search ? `Results for "${search}"` : "Knowledge Base"}
                  </h2>
  
                  {isLoading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {[1, 2, 3].map((i) => (
                        <div key={i} style={{ height: "80px", borderRadius: "8px", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.05)" }} />
                      ))}
                    </div>
                  ) : articles.length === 0 ? (
                    <div style={{ padding: "3rem", textAlign: "center", color: "hsl(210,5%,45%)", fontSize: "14px" }}>
                      No articles found for "{search}". <Link href="/support/submit" style={{ color: "hsl(192,72%,48%)", textDecoration: "none" }}>Submit a ticket</Link> and our team will help.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {articles.map((article, i: number) => (
                        <m.div key={article.slug} custom={i} initial="hidden" whileInView="show" variants={fadeUp} viewport={{ once: true }}>
                          <div style={{ padding: "1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)", cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.12)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.07)"; }}>
                            <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "1rem" }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                                  <BookOpen size={12} style={{ color: "hsl(192,72%,48%)", flexShrink: 0 }} />
                                  <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(192,72%,48%)" }}>{article.category}</span>
                                </div>
                                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "hsl(38,12%,88%)", marginBottom: "0.25rem" }}>{article.title}</h3>
                                <p style={{ fontSize: "12px", color: "hsl(210,5%,50%)", lineHeight: 1.5 }}>{article.summary}</p>
                              </div>
                              <ChevronRight size={14} style={{ color: "hsl(210,5%,38%)", flexShrink: 0, marginTop: "0.25rem" }} />
                            </div>
                          </div>
                        </m.div>
                      ))}
                    </div>
                  )}
                </div>
  
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div style={{ padding: "1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,88%)", marginBottom: "1rem" }}>Platform Status</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      {STATUS_ITEMS.map((item) => (
                        <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                          <span style={{ fontSize: "12px", color: "hsl(210,5%,55%)" }}>{item.name}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "11px", color: "hsl(142,60%,50%)" }}>
                            <CheckCircle2 size={10} />
                            Operational
                          </span>
                        </div>
                      ))}
                    </div>
                    <Link href="/status" style={{ display: "block", marginTop: "1rem", fontSize: "12px", color: "hsl(210,5%,45%)", textDecoration: "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,78%)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,45%)"; }}>
                      View full status page →
                    </Link>
                  </div>
  
                  <div style={{ padding: "1.25rem", borderRadius: "8px", background: "hsla(192,72%,48%,0.04)", border: "1px solid hsla(192,72%,48%,0.15)" }}>
                    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,88%)", marginBottom: "0.5rem" }}>Need direct help?</h3>
                    <p style={{ fontSize: "12px", color: "hsl(210,5%,50%)", lineHeight: 1.6, marginBottom: "1rem" }}>
                      Submit a ticket and our team will respond within 4 business hours for enterprise accounts.
                    </p>
                    <Link href="/support/submit" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.625rem 1rem", borderRadius: "6px", fontSize: "12px", fontWeight: 600, color: "hsl(192,72%,50%)", border: "1px solid hsla(192,72%,48%,0.3)", background: "hsla(192,72%,48%,0.08)", textDecoration: "none", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(192,72%,48%,0.14)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(192,72%,48%,0.08)"; }}>
                      Submit a request <ArrowRight size={11} strokeWidth={2.5} />
                    </Link>
                  </div>
  
                  <div style={{ padding: "1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                    <h3 style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,88%)", marginBottom: "0.75rem" }}>Response SLAs</h3>
                    {[
                      { priority: "Urgent", time: "1 hour", desc: "Production outages" },
                      { priority: "High", time: "4 hours", desc: "Major feature impact" },
                      { priority: "Medium", time: "1 business day", desc: "Standard issues" },
                      { priority: "Low", time: "3 business days", desc: "Questions, enhancements" },
                    ].map((row) => (
                      <div key={row.priority} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid hsla(0,0%,100%,0.05)" }}>
                        <div>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,78%)" }}>{row.priority}</span>
                          <span style={{ display: "block", fontSize: "11px", color: "hsl(210,5%,45%)" }}>{row.desc}</span>
                        </div>
                        <span style={{ fontSize: "12px", color: "hsl(210,5%,55%)", alignSelf: "center" }}>{row.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
