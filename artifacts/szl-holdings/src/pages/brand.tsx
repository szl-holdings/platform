import { m } from "framer-motion";
import { Link } from "wouter";
import { Palette, ArrowRight, Type, Layout, Zap, Eye } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const COLOR_TOKENS = [
  { name: "SZL Ink", value: "hsl(214,16%,4%)", label: "Background", hex: "#050810" },
  { name: "SZL Surface", value: "hsla(0,0%,100%,0.04)", label: "Card base", hex: "rgba(255,255,255,0.04)" },
  { name: "SZL Border", value: "hsla(0,0%,100%,0.08)", label: "Dividers", hex: "rgba(255,255,255,0.08)" },
  { name: "SZL Accent", value: "hsl(38,52%,58%)", label: "Brand gold", hex: "#c8953c" },
  { name: "KORA Core", value: "hsl(191,92%,44%)", label: "KORA brand", hex: "#09c9de" },
  { name: "Counsel Light", value: "hsl(246,55%,72%)", label: "Counsel brand", hex: "#9b8fd4" },
  { name: "Signal Green", value: "hsl(145,62%,46%)", label: "Success / Security", hex: "#28c76f" },
  { name: "Alert Amber", value: "hsl(40,90%,54%)", label: "Warning / Attention", hex: "#e8a329" },
  { name: "Risk Red", value: "hsl(0,75%,58%)", label: "Danger / Critical", hex: "#e04040" },
];

const TYPOGRAPHY = [
  { scale: "Display", usage: "Hero headlines, page titles", size: "clamp(2.25rem, 5vw, 3.75rem)", weight: "600", tracking: "-0.03em" },
  { scale: "H1", usage: "Section headings", size: "clamp(1.5rem, 3.5vw, 2.25rem)", weight: "600", tracking: "-0.022em" },
  { scale: "H2", usage: "Subsection headings, card titles", size: "clamp(1.25rem, 2.5vw, 1.625rem)", weight: "600", tracking: "-0.018em" },
  { scale: "Body", usage: "Primary body text", size: "0.9375rem", weight: "400", tracking: "0" },
  { scale: "Small", usage: "Supporting text, labels", size: "0.875rem", weight: "400", tracking: "0" },
  { scale: "Mono", usage: "Labels, badges, code, overlines", size: "0.6875rem", weight: "600", tracking: "0.12em" },
];

const MOTION_RULES = [
  { rule: "Entrances", detail: "opacity 0→1 + y 10→0. Duration: 0.35–0.45s. Ease: [0.22, 1, 0.36, 1] or spring." },
  { rule: "Staggered lists", detail: "Delay 0.04–0.08s per item. Never exceed 0.4s for last item in a set." },
  { rule: "Hover states", detail: "Fast: 0.15–0.18s linear or ease-out. Border, background, opacity only." },
  { rule: "Page transitions", detail: "Fade only. No slides on route changes. Duration: 0.3s." },
  { rule: "Never", detail: "Bounce, elastic, or complex transforms on content. Motion should clarify, not decorate." },
];

const UI_PRINCIPLES = [
  { title: "Darkness as canvas", body: "The platform lives in hsl(214,16%,4%) ink. Every color element earns its place against this baseline. Light backgrounds are not the default." },
  { title: "Density without noise", body: "Enterprise information density is a goal. Unnecessary whitespace is waste. But noise — visual clutter without semantic purpose — is the enemy." },
  { title: "Monospace as precision", body: "Monospace type signals precision, measurement, and code. Use it for overlines, badges, statuses, and counts — not for body text." },
  { title: "Border as structure", body: "Cards, tables, and sections use 1px hairline borders at hsla(0,0%,100%,0.08). Not shadows. Not gradients. Borders." },
  { title: "Color means something", body: "Green: confirmed / secure. Amber: attention required. Red: risk or failure. KORA teal: observability signal. Counsel purple: execution. Do not use colors decoratively." },
  { title: "State is explicit", body: "Loading states, empty states, error states, and demo/sandbox modes are always explicitly labeled. Users are never left to guess what they are looking at." },
];

const VOICE_PRINCIPLES = [
  { title: "Honest and controlled", body: "We say what exists. We do not present roadmap items as current capabilities. We do not use words like 'revolutionize' or 'transform' without specificity." },
  { title: "Operational, not aspirational", body: "The audience is operators and investors — people who deal in real constraints. Write for them. Avoid language that sounds like marketing to a general audience." },
  { title: "Direct and dense", body: "SZL copy is information-dense. Short sentences. Active voice. No filler words. Every sentence earns its place." },
  { title: "Technical credibility", body: "Architecture is described precisely. Claims about how the system works are backed by how it actually works. Vagueness is a signal of weakness." },
];

const SCREENSHOT_RULES = [
  "Use dark-background screenshots by default — the platform is a dark-first UI.",
  "Screenshots show real UI state — not empty states, not fabricated data.",
  "Frame screenshots with consistent 1:1.5 or 16:9 aspect ratios.",
  "Apply subtle border radius (8–12px) and a 1px border at hsla(0,0%,100%,0.10) for digital use.",
  "Never crop screenshots mid-component — always capture complete, coherent UI sections.",
];

export default function BrandPage() {
  const __pageMeta = usePageMeta({
    title: "Brand Guide — SZL Holdings",
    description: "SZL Holdings brand guide — logo system, color tokens, typography, motion rules, UI principles, voice, screenshot guidance, and icon use.",
    canonical: "https://szlholdings.com/brand",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid var(--color-szl-border-hover)", background: "hsla(0,0%,100%,0.04)", marginBottom: "1.75rem" }}>
                  <Palette size={13} color="var(--color-szl-text-muted)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-szl-text-secondary)" }}>Brand</span>
                </div>
                <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                  SZL brand system.
                </h1>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch" }}>
                  Logo system, color tokens, typography, motion rules, UI principles, voice/tone,
                  screenshot framing, and icon guidance — for teams building on or communicating
                  about SZL Holdings and its products.
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Logo system</p>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>Spacing and clearance rules</h2>
              </m.div>
              <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
                  {[
                    { label: "Clear space", detail: "Minimum clearance equal to the logo height on all four sides." },
                    { label: "Minimum size", detail: "100px width in digital. 25mm in print. Do not use below these thresholds." },
                    { label: "Dark version", detail: "Use on backgrounds darker than 50% perceived brightness." },
                    { label: "Light version", detail: "Use on white or near-white backgrounds. Do not use on color-saturated backgrounds." },
                    { label: "Forbidden", detail: "No rotation, stretching, color substitution, drop shadows, outlines, or busy backgrounds." },
                    { label: "Trademark", detail: "The SZL wordmark is a registered brand element. Do not recreate it from scratch." },
                  ].map((item) => (
                    <div key={item.label}>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.4rem" }}>{item.label}</p>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,58%)" }}>{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Color tokens</p>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>Platform color palette</h2>
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.875rem" }}>
                {COLOR_TOKENS.map((token, i) => (
                  <m.div key={token.name} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.04 }} className="szl-card" style={{ borderRadius: "0.75rem", overflow: "hidden" }}>
                    <div style={{ height: "52px", background: token.value, borderBottom: "1px solid var(--color-szl-border)" }} />
                    <div style={{ padding: "0.875rem" }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.25rem" }}>{token.name}</p>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(214,7%,50%)", marginBottom: "0.25rem" }}>{token.hex}</p>
                      <p style={{ fontSize: "0.75rem", color: "hsl(214,7%,45%)" }}>{token.label}</p>
                    </div>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                  <Type size={14} color="var(--color-szl-text-muted)" />
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Typography</p>
                </div>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>Type scale and usage</h2>
              </m.div>
              <div className="szl-card" style={{ borderRadius: "0.875rem", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "6rem 10rem 6rem 5rem 8rem", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--color-szl-border)", background: "hsla(214,12%,8%,0.60)" }}>
                  {["Scale", "Usage", "Size", "Weight", "Tracking"].map((h) => (
                    <span key={h} style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>{h}</span>
                  ))}
                </div>
                {TYPOGRAPHY.map((row, i) => (
                  <div key={row.scale} style={{ display: "grid", gridTemplateColumns: "6rem 10rem 6rem 5rem 8rem", padding: "0.875rem 1.25rem", borderBottom: i < TYPOGRAPHY.length - 1 ? "1px solid var(--color-szl-border)" : "none", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,85%)" }}>{row.scale}</span>
                    <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)" }}>{row.usage}</span>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(214,7%,62%)" }}>{row.size}</code>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(214,7%,62%)" }}>{row.weight}</code>
                    <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "hsl(214,7%,62%)" }}>{row.tracking}</code>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                  <Zap size={14} color="var(--color-szl-text-muted)" />
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Motion</p>
                </div>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>Motion rules</h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {MOTION_RULES.map((item, i) => (
                  <m.div key={item.rule} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.32, delay: i * 0.05 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "0.875rem 1.25rem", display: "grid", gridTemplateColumns: "8rem 1fr", gap: "1.5rem", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, color: "hsl(38,8%,78%)", letterSpacing: "0.06em" }}>{item.rule}</span>
                    <span style={{ fontSize: "0.875rem", color: "hsl(214,7%,58%)", lineHeight: 1.55 }}>{item.detail}</span>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                  <Layout size={14} color="var(--color-szl-text-muted)" />
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>UI principles</p>
                </div>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>How we build interfaces</h2>
              </m.div>
              <div className="szl-grid-2" style={{ gap: "1rem" }}>
                {UI_PRINCIPLES.map((item, i) => (
                  <m.div key={item.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "1.25rem" }}>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.5rem" }}>{item.title}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,58%)" }}>{item.body}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                  <Eye size={14} color="var(--color-szl-text-muted)" />
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Screenshot framing</p>
                </div>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>How to capture and use screenshots</h2>
              </m.div>
              <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}>
                <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
                  {SCREENSHOT_RULES.map((item) => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--color-szl-text-muted)", flexShrink: 0, marginTop: "9px" }} />
                      <span style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "hsl(214,7%,60%)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Voice & tone</p>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>How SZL communicates</h2>
              </m.div>
              <div className="szl-grid-2" style={{ gap: "1rem" }}>
                {VOICE_PRINCIPLES.map((item, i) => (
                  <m.div key={item.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "1.25rem" }}>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.5rem" }}>{item.title}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,58%)" }}>{item.body}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "var(--space-section-sm) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/press" className="szl-btn-secondary">Press resources →</Link>
                <Link href="/contact" className="szl-btn-ghost">Brand questions <ArrowRight size={13} /></Link>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
