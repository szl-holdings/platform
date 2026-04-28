import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { ExternalLink, ArrowRight, Globe, Briefcase, FileText, Mail, Shield, Anchor, Building2, Cpu, Twitter, BookOpen, Link2, Zap, Users, BarChart3 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const API = import.meta.env.VITE_API_URL || "";

interface LinkItem {
  id: number;
  label: string;
  destination: string;
  campaignTag: string | null;
  contentTag: string | null;
  sortOrder: number;
}

const ICON_MAP: Record<string, typeof Globe> = {
  website: Globe,
  portfolio: Briefcase,
  insights: FileText,
  newsletter: Mail,
  security: Shield,
  maritime: Anchor,
  "real-estate": Building2,
  ai: Cpu,
  twitter: Twitter,
  x: Twitter,
  substack: BookOpen,
  medium: FileText,
  linkedin: Users,
  linktree: Link2,
  consulting: Briefcase,
  analytics: BarChart3,
  automation: Zap,
};

const SOCIAL_LINKS = [
  { label: "X (Twitter)", url: "https://x.com/szlholdings", icon: Twitter },
  { label: "LinkedIn", url: "https://linkedin.com/company/szl-holdings", icon: Users },
  { label: "Medium", url: "https://medium.com/@stephen_38454", icon: FileText },
  { label: "Substack", url: "https://szlholdings.substack.com", icon: BookOpen },
];

const FALLBACK_LINKS: LinkItem[] = [
  { id: 1, label: "SZL Holdings — Enterprise Platform", destination: "/", campaignTag: null, contentTag: "website", sortOrder: 0 },
  { id: 2, label: "Latest Insights & Analysis", destination: "/insights", campaignTag: null, contentTag: "insights", sortOrder: 1 },
  { id: 3, label: "Counsel — Legal Intelligence", destination: "/counsel", campaignTag: null, contentTag: "ai", sortOrder: 2 },
  { id: 4, label: "SEXTANT — Maritime Intelligence", destination: "/solutions/vessels", campaignTag: null, contentTag: "maritime", sortOrder: 3 },
  { id: 5, label: "DOMAINE — Real Estate Intelligence", destination: "/solutions/terra", campaignTag: null, contentTag: "real-estate", sortOrder: 4 },
  { id: 6, label: "PARAGON — Unified Defense & SOC", destination: "/solutions/aegis", campaignTag: null, contentTag: "security", sortOrder: 5 },
  { id: 7, label: "Subscribe to Newsletter", destination: "/newsletter", campaignTag: null, contentTag: "newsletter", sortOrder: 6 },
  { id: 8, label: "Book a Consultation", destination: "/contact", campaignTag: null, contentTag: "portfolio", sortOrder: 7 },
];

function trackClick(linkId: number) {
  fetch(`${API}/api/distribution-os/linktree/${linkId}/click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).catch(() => {});
}

export default function LinkInBioPage() {
  const __pageMeta = usePageMeta({ title: "Stephen Lutar — Links", description: "Quick links to SZL Holdings platforms, insights, and consulting." });
  const [links, setLinks] = useState<LinkItem[]>(FALLBACK_LINKS);

  useEffect(() => {
    fetch(`${API}/api/distribution-os/linktree`)
      .then(r => r.json())
      .then(data => { if (data?.length) setLinks(data); })
      .catch(() => {});
  }, []);

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #070a10 0%, var(--gi-bg-surface) 50%, #070a10 100%)" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", padding: "3rem 1.5rem 2rem" }}>
  
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{
              width: 88, height: 88, borderRadius: "1.125rem",
              background: "linear-gradient(135deg, #d4a054 0%, #c8953c 50%, #b8862c 100%)",
              margin: "0 auto 1.25rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.25rem", fontWeight: 800, color: "#070a10", letterSpacing: "-0.02em",
              boxShadow: "0 0 0 1px hsla(38,50%,52%,0.2), 0 12px 40px hsla(0,0%,0%,0.5), 0 0 80px hsla(38,50%,52%,0.08)",
            }}>
              SZL
            </div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#e8e4de", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>Stephen Lutar</h1>
            <p style={{ fontSize: "0.8125rem", color: "#8b8579", lineHeight: 1.5 }}>Founder & CEO, SZL Holdings</p>
            <p style={{ fontSize: "0.75rem", color: "#6b6560", marginTop: "0.375rem", lineHeight: 1.5 }}>AI-Powered Enterprise Intelligence &middot; Maritime &middot; Defense &middot; Real Estate</p>
          </m.div>
  
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{ display: "flex", justifyContent: "center", gap: "0.625rem", marginBottom: "2rem" }}
          >
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                title={s.label}
                aria-label={s.label}
                style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "hsla(0,0%,100%,0.05)",
                  border: "1px solid hsla(0,0%,100%,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#d4a054", transition: "all 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "hsla(38,50%,52%,0.15)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(38,50%,52%,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.05)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.1)"; }}
              >
                <s.icon size={18} />
              </a>
            ))}
          </m.div>
  
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {links.map((link, i) => {
              const Icon = ICON_MAP[link.contentTag || ""] || Globe;
              return (
                <m.a
                  key={link.id}
                  href={link.destination}
                  target={link.destination.startsWith("http") ? "_blank" : undefined}
                  rel={link.destination.startsWith("http") ? "noopener noreferrer" : undefined}
                  onClick={() => trackClick(link.id)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.05 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    padding: "0.9375rem 1.25rem",
                    background: "hsla(0,0%,100%,0.035)",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                    borderRadius: "12px",
                    color: "#e8e4de",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  whileHover={{ scale: 1.015, backgroundColor: "hsla(0,0%,100%,0.06)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "8px",
                    background: "hsla(38,50%,52%,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={17} style={{ color: "#d4a054" }} />
                  </div>
                  <span style={{ flex: 1, lineHeight: 1.4 }}>{link.label}</span>
                  {link.destination.startsWith("http")
                    ? <ExternalLink size={14} style={{ color: "#4a4540", flexShrink: 0 }} />
                    : <ArrowRight size={14} style={{ color: "#4a4540", flexShrink: 0 }} />
                  }
                </m.a>
              );
            })}
          </div>
  
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <div style={{ width: 32, height: 2, background: "linear-gradient(90deg, transparent, #d4a054, transparent)", margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "0.6875rem", color: "#4a4540", letterSpacing: "0.08em", textTransform: "uppercase" }}>SZL Holdings &copy; {new Date().getFullYear()}</p>
          </m.div>
        </div>
      </div>
        </>
  );
}
