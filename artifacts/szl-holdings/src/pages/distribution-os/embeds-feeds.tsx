import { useState } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import {
  Rss, Code2, Copy, Check, Globe, Link2, FileCode, Tag, Layers,
  ChevronRight, ExternalLink, Eye, Zap, BookOpen,
} from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const BASE_URL = "https://szlholdings.com";
const API_BASE = "https://szlholdings.com/api";

function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      {label && <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#6b6560", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>{label}</div>}
      <div style={{ position: "relative", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "8px", overflow: "hidden" }}>
        <pre style={{ padding: "1rem", margin: 0, fontSize: "0.75rem", color: "#c8c2ba", overflowX: "auto", lineHeight: 1.65, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>{code}</pre>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ position: "absolute", top: "0.5rem", right: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", background: "hsla(0,0%,100%,0.08)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "4px", color: copied ? "#5a9c5a" : "#6b6560", cursor: "pointer", fontSize: "0.6875rem" }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, color, children }: {
  icon: typeof Globe; title: string; subtitle: string; color: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid hsla(0,0%,100%,0.05)", display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <div style={{ width: 38, height: 38, borderRadius: "8px", background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#e8e4de" }}>{title}</h2>
          <p style={{ fontSize: "0.75rem", color: "#6b6560", marginTop: "0.125rem" }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ padding: "1.5rem" }}>{children}</div>
    </div>
  );
}

function FeedRow({ icon: Icon, label, url, color, desc }: { icon: typeof Rss; label: string; url: string; color: string; desc: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem 0", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
      <Icon size={16} style={{ color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de" }}>{label}</div>
        <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.125rem" }}>{desc}</div>
        <div style={{ fontSize: "0.6875rem", color: "#6b6560", fontFamily: "monospace", marginTop: "0.25rem" }}>{url}</div>
      </div>
      <div style={{ display: "flex", gap: "0.375rem" }}>
        <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.625rem", background: "none", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: copied ? "#5a9c5a" : "#4a4540", cursor: "pointer", fontSize: "0.6875rem" }}>
          {copied ? <Check size={11} /> : <Copy size={11} />} Copy
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.375rem 0.625rem", background: "none", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "5px", color: "#4a4540", fontSize: "0.6875rem", textDecoration: "none" }}>
          <ExternalLink size={11} /> Preview
        </a>
      </div>
    </div>
  );
}

export default function EmbeedsFeedsPage() {
  const [location] = useLocation();
  const [widgetType, setWidgetType] = useState<"content-card" | "newsletter-signup" | "content-feed">("newsletter-signup");
  const [widgetTheme, setWidgetTheme] = useState<"dark" | "light">("dark");
  const [articleSlug, setArticleSlug] = useState("enterprise-ai-adoption-2025");

  const oembedUrl = `${API_BASE}/oembed?url=${encodeURIComponent(`${BASE_URL}/insights/${articleSlug}`)}&format=json`;
  const widgetScript = `<!-- SZL Holdings Widget -->
<script>
  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "${BASE_URL}/widget.js";
    js.dataset.type = "${widgetType}";
    js.dataset.theme = "${widgetTheme}";
    js.dataset.slug = "${articleSlug}";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'szl-widget'));
</script>`;

  const iframeEmbed = `<iframe
  src="${BASE_URL}/embed/${widgetType}?theme=${widgetTheme}&slug=${articleSlug}"
  width="100%"
  height="${widgetType === "content-feed" ? "600" : "280"}"
  frameborder="0"
  style="border-radius: 12px; overflow: hidden;"
  loading="lazy"
></iframe>`;

  const oembedProviderConfig = `{
  "provider_name": "SZL Holdings",
  "provider_url": "${BASE_URL}",
  "endpoints": [
    {
      "schemes": [
        "${BASE_URL}/insights/*",
        "${BASE_URL}/newsletter/*",
        "${BASE_URL}/posts/*"
      ],
      "url": "${API_BASE}/oembed",
      "formats": ["json", "xml"],
      "discovery": true
    }
  ]
}`;

  const ogMetaTags = `<!-- Auto-generated Open Graph + Twitter Card tags -->
<meta property="og:title" content="Why Enterprise AI Adoption Fails" />
<meta property="og:description" content="The 3 root causes that derail 70% of enterprise AI initiatives." />
<meta property="og:image" content="${BASE_URL}/og/enterprise-ai-adoption-2025.png" />
<meta property="og:url" content="${BASE_URL}/insights/enterprise-ai-adoption-2025" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="SZL Holdings" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Why Enterprise AI Adoption Fails" />
<meta name="twitter:description" content="The 3 root causes that derail 70% of enterprise AI initiatives." />
<meta name="twitter:image" content="${BASE_URL}/og/enterprise-ai-adoption-2025.png" />
<meta name="twitter:site" content="@SZLHoldings" />`;

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Embeds, Feeds & Distribution</h1>
          <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>
            oEmbed provider · RSS/Atom feeds · Embeddable widgets · Open Graph meta tags
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
          {[
            { label: "oEmbed Endpoint", icon: Code2, color: "#8b7ac8", value: "Active" },
            { label: "RSS Feeds", icon: Rss, color: "#d4a054", value: "4 feeds" },
            { label: "Widget Installs", icon: Layers, color: "#5a9c5a", value: "12" },
            { label: "OG Tags Generated", icon: Tag, color: "#4a90b8", value: "38" },
          ].map(s => (
            <div key={s.label} style={{ padding: "1rem 1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <s.icon size={14} style={{ color: s.color, marginBottom: "0.5rem" }} />
              <div style={{ fontSize: "1.125rem", fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.125rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          <SectionCard icon={Rss} title="RSS & Atom Feeds" subtitle="Auto-generated feeds for every content type — syndicate anywhere" color="#d4a054">
            <div>
              <FeedRow icon={Rss} label="All Articles (RSS)" url={`${API_BASE}/feeds/articles.rss`} color="#d4a054" desc="All published flagship essays and articles" />
              <FeedRow icon={Rss} label="Newsletters (RSS)" url={`${API_BASE}/feeds/newsletters.rss`} color="#d4a054" desc="Every published newsletter issue" />
              <FeedRow icon={BookOpen} label="X Posts (Atom)" url={`${API_BASE}/feeds/posts.atom`} color="#1a8cd8" desc="Published X posts and threads" />
              <FeedRow icon={Rss} label="All Content (Combined)" url={`${API_BASE}/feeds/all.rss`} color="#5a9c5a" desc="Combined feed of all published content types" />
              <div style={{ paddingTop: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Zap size={12} style={{ color: "#d4a054" }} />
                <span style={{ fontSize: "0.75rem", color: "#6b6560" }}>Feeds auto-update within 2 minutes of publishing. Add to Feedly, Inoreader, or any RSS aggregator.</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Code2} title="oEmbed Provider" subtitle="Paste a content URL anywhere — WordPress, Ghost, Notion, Slack auto-embed it" color="#8b7ac8">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ padding: "0.875rem 1rem", background: "hsla(270,40%,50%,0.06)", border: "1px solid hsla(270,40%,50%,0.15)", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#8b7ac8", textTransform: "uppercase", marginBottom: "0.375rem" }}>How it works</div>
                <p style={{ fontSize: "0.8125rem", color: "#6b6560", lineHeight: 1.55 }}>
                  Any platform that supports oEmbed (WordPress, Ghost, Notion, Slack, Discord) will automatically show a rich embed when someone pastes a SZL Holdings content URL. No plugin required.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 700, color: "#6b6560", textTransform: "uppercase", marginBottom: "0.375rem" }}>Test with Article Slug</label>
                <input
                  value={articleSlug}
                  onChange={e => setArticleSlug(e.target.value)}
                  placeholder="article-slug"
                  style={{ padding: "0.5rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", width: "100%", boxSizing: "border-box", marginBottom: "0.875rem" }}
                />
                <CopyBlock code={`GET ${oembedUrl}`} label="oEmbed endpoint URL" />
              </div>

              <CopyBlock code={oembedProviderConfig} label="oEmbed provider registration (for CMS platforms)" />
            </div>
          </SectionCard>

          <SectionCard icon={Layers} title="Embeddable Widgets" subtitle="Drop a <script> tag on any site to show live content from Distribution OS" color="#5a9c5a">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                {(["newsletter-signup", "content-card", "content-feed"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setWidgetType(type)}
                    style={{ padding: "0.75rem", background: widgetType === type ? "hsla(120,30%,40%,0.12)" : "hsla(0,0%,100%,0.03)", border: `1px solid ${widgetType === type ? "hsla(120,30%,40%,0.3)" : "hsla(0,0%,100%,0.08)"}`, borderRadius: "8px", color: widgetType === type ? "#5a9c5a" : "#6b6560", fontSize: "0.75rem", fontWeight: widgetType === type ? 700 : 400, cursor: "pointer", textAlign: "center" }}
                  >
                    {type === "newsletter-signup" ? "Newsletter Signup" : type === "content-card" ? "Content Card" : "Content Feed"}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["dark", "light"] as const).map(theme => (
                  <button key={theme} onClick={() => setWidgetTheme(theme)} style={{ padding: "0.375rem 0.75rem", background: widgetTheme === theme ? "hsla(0,0%,100%,0.08)" : "none", border: `1px solid ${widgetTheme === theme ? "hsla(0,0%,100%,0.15)" : "hsla(0,0%,100%,0.06)"}`, borderRadius: "6px", color: widgetTheme === theme ? "#e8e4de" : "#4a4540", fontSize: "0.75rem", cursor: "pointer", textTransform: "capitalize", fontWeight: widgetTheme === theme ? 600 : 400 }}>
                    {theme}
                  </button>
                ))}
              </div>

              <CopyBlock code={widgetScript} label="JavaScript widget (recommended)" />
              <CopyBlock code={iframeEmbed} label="iFrame embed (fallback)" />

              <div style={{ padding: "0.75rem 1rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#5a9c5a", textTransform: "uppercase", marginBottom: "0.375rem" }}>Widget Capabilities</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem 1.5rem" }}>
                  {["Magic link email capture", "Live content updates", "No cookie banner required", "Respects prefers-color-scheme", "CSP-friendly", "Lazy-loaded performance"].map(feat => (
                    <div key={feat} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#5a9c5a", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.75rem", color: "#8b8579" }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Tag} title="Open Graph & Twitter Cards" subtitle="Auto-generated meta tags for every piece of published content" color="#4a90b8">
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ padding: "0.875rem 1rem", background: "hsla(210,50%,50%,0.06)", border: "1px solid hsla(210,50%,50%,0.15)", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.75rem", color: "#6b6560", lineHeight: 1.55 }}>
                  Every article, newsletter, and X post published through Distribution OS automatically gets Open Graph and Twitter Card meta tags. No manual configuration needed.
                </div>
              </div>
              <CopyBlock code={ogMetaTags} label="Example — auto-generated for every content URL" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {[
                  { label: "OG Image Size", value: "1200 × 630px" },
                  { label: "Image Format", value: "PNG (auto-generated)" },
                  { label: "Twitter Card", value: "summary_large_image" },
                  { label: "Update Delay", value: "< 1 minute post-publish" },
                ].map(item => (
                  <div key={item.label} style={{ padding: "0.75rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "6px" }}>
                    <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginBottom: "0.125rem" }}>{item.label}</div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
