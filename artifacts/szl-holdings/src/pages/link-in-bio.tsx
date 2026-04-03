import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { ExternalLink, ArrowRight, Globe, Briefcase, FileText, Mail, Shield, Anchor, Building2, Cpu } from "lucide-react";
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
};

const FALLBACK_LINKS: LinkItem[] = [
  { id: 1, label: "SZL Holdings — Enterprise Platform", destination: "/", campaignTag: null, contentTag: "website", sortOrder: 0 },
  { id: 2, label: "Latest Insights & Analysis", destination: "/insights", campaignTag: null, contentTag: "insights", sortOrder: 1 },
  { id: 3, label: "PRISM Counsel — Legal Intelligence", destination: "/solutions/prism-counsel", campaignTag: null, contentTag: "ai", sortOrder: 2 },
  { id: 4, label: "Vessels — Maritime Intelligence", destination: "/solutions/vessels", campaignTag: null, contentTag: "maritime", sortOrder: 3 },
  { id: 5, label: "Terra — Real Estate Intelligence", destination: "/solutions/terra", campaignTag: null, contentTag: "real-estate", sortOrder: 4 },
  { id: 6, label: "Aegis — Unified Defense & SOC", destination: "/solutions/aegis", campaignTag: null, contentTag: "security", sortOrder: 5 },
  { id: 7, label: "Subscribe to Newsletter", destination: "/newsletter", campaignTag: null, contentTag: "newsletter", sortOrder: 6 },
  { id: 8, label: "Book a Consultation", destination: "/contact", campaignTag: null, contentTag: "portfolio", sortOrder: 7 },
];

export default function LinkInBioPage() {
  usePageMeta({ title: "Stephen Lutar — Links", description: "Quick links to SZL Holdings platforms, insights, and consulting." });
  const [links, setLinks] = useState<LinkItem[]>(FALLBACK_LINKS);

  useEffect(() => {
    fetch(`${API}/api/distribution-os/linktree`)
      .then(r => r.json())
      .then(data => { if (data?.length) setLinks(data); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #070a10 0%, #0c1018 50%, #070a10 100%)" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #d4a054, #c8953c)", margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, color: "#070a10" }}>
            SL
          </div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#e8e4de", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>Stephen Lutar</h1>
          <p style={{ fontSize: "0.8125rem", color: "#8b8579", lineHeight: 1.5 }}>Founder & CEO, SZL Holdings</p>
          <p style={{ fontSize: "0.75rem", color: "#6b6560", marginTop: "0.25rem" }}>AI-Powered Enterprise Intelligence</p>
        </m.div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {links.map((link, i) => {
            const Icon = ICON_MAP[link.contentTag || ""] || Globe;
            return (
              <m.a
                key={link.id}
                href={link.destination}
                target={link.destination.startsWith("http") ? "_blank" : undefined}
                rel={link.destination.startsWith("http") ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.875rem",
                  padding: "0.875rem 1.25rem",
                  background: "hsla(0,0%,100%,0.04)",
                  border: "1px solid hsla(0,0%,100%,0.08)",
                  borderRadius: "10px",
                  color: "#e8e4de",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                whileHover={{ scale: 1.02, backgroundColor: "hsla(0,0%,100%,0.07)" }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={18} style={{ color: "#d4a054", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{link.label}</span>
                <ArrowRight size={14} style={{ color: "#6b6560" }} />
              </m.a>
            );
          })}
        </div>

        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ textAlign: "center", marginTop: "3rem" }}>
          <p style={{ fontSize: "0.6875rem", color: "#4a4540", letterSpacing: "0.05em", textTransform: "uppercase" }}>SZL Holdings &copy; {new Date().getFullYear()}</p>
        </m.div>
      </div>
    </div>
  );
}
