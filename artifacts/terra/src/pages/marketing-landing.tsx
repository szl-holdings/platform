import { ArrowRight, Building2, MapPin, TrendingUp, DollarSign, Flame, BarChart3, Users, Search, FileText, Zap, Shield } from "lucide-react";

const stats = [
  { value: "1,200+", label: "Distress properties tracked" },
  { value: "$4.8B", label: "Deal pipeline value" },
  { value: "5", label: "Boroughs covered" },
  { value: "89K+", label: "Market data points" },
];

const features = [
  {
    icon: Flame,
    title: "Distress Intelligence Engine",
    desc: "Real-time NYC foreclosure tracking, lis pendens filings, auction calendars, and tax lien discovery — across all five boroughs. AI-scored opportunity ranking with confidence levels.",
  },
  {
    icon: TrendingUp,
    title: "Deal Pipeline",
    desc: "Acquisitions and dispositions tracked from lead to close. Stage-gated pipeline with ownership assignments, priority scoring, and Alloy-driven workflow automation.",
  },
  {
    icon: BarChart3,
    title: "Market Intelligence",
    desc: "Comparable sales, price-per-sqft analysis, borough-level market dynamics, and off-market opportunity discovery — updated continuously from primary data sources.",
  },
  {
    icon: Users,
    title: "CRM & Lead Management",
    desc: "Broker-native CRM with contact management, deal history, tenant profiles, lease schedules, payment tracking, and renewal forecasting built into one platform.",
  },
  {
    icon: Search,
    title: "Ownership Intelligence",
    desc: "LLC unmask using Reonomy-style entity resolution. Identify real beneficial owners, debt maturity timelines, hold duration, and off-market propensity scores.",
  },
  {
    icon: DollarSign,
    title: "Investment Tools",
    desc: "IRR modeling, cap rate analysis, and scenario planning with conservative/base/aggressive assumptions. Climate risk overlays and FEMA zone cross-referencing.",
  },
];

const distressTypes = [
  { label: "Pre-Foreclosure", count: "340+", color: "#f59e0b" },
  { label: "Foreclosure", count: "180+", color: "#ef4444" },
  { label: "Tax Lien", count: "290+", color: "#f97316" },
  { label: "Auction Imminent", count: "95", color: "#a855f7" },
  { label: "REO / Bank-Owned", count: "120+", color: "#3b82f6" },
  { label: "Expired Listings", count: "175+", color: "#64748b" },
];

const navLinks = [
  { label: "Platform", href: "#platform" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Markets", href: "#markets" },
  { label: "Pricing", href: "#pricing" },
];

export default function TerraMarketingLanding({ onSignIn }: { onSignIn?: () => void }) {
  const accent = "#5e9a32";
  const accentLight = "#74b844";
  const accentGold = "#b89840";

  return (
    <div style={{ minHeight: "100vh", background: "#0b1009", color: "#e6ead6", fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(11,16,9,0.94)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${accent}14`,
        height: "60px", display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: `${accent}1a`, border: `1px solid ${accent}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={14} style={{ color: accentLight }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: "15px", letterSpacing: "-0.02em", color: "#e6ead6" }}>Terra</span>
            <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#4e6042", marginLeft: "4px" }}>by SZL Holdings</span>
          </div>
          <div style={{ display: "none", alignItems: "center", gap: "28px" }} className="terra-nav-links">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                style={{ fontSize: "13px", color: "#92a478", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e6ead6"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#92a478"; }}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <a href="/" style={{ fontSize: "13px", color: "#4e6042", textDecoration: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#92a478"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4e6042"; }}>
              SZL Holdings
            </a>
            <button
              onClick={onSignIn}
              style={{
                padding: "6px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                background: `${accent}1a`, border: `1px solid ${accent}40`, color: accentLight,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${accent}30`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${accent}1a`; }}
            >
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: "120px", paddingBottom: "80px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 70% 55% at 50% -5%, ${accent}0e 0%, transparent 65%)`,
        }} />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(94,154,50,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(94,154,50,0.015) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%, black 0%, transparent 100%)",
        }} />
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.5rem", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "1.5rem",
            padding: "4px 12px 4px 8px", borderRadius: "4px",
            background: `${accent}0f`, border: `1px solid ${accent}28`,
          }}>
            <MapPin size={11} style={{ color: accentLight }} />
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: accentLight }}>NYC Real Estate Intelligence</span>
          </div>

          <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.75rem)", fontWeight: 700, letterSpacing: "-0.032em", lineHeight: 1.05, color: "#f0f4e6", marginBottom: "1.25rem" }}>
            The distress intelligence platform<br />built for NYC real estate.
          </h1>
          <p style={{ fontSize: "1.0625rem", lineHeight: 1.72, color: "#4e6042", maxWidth: "36rem", margin: "0 auto 2.5rem" }}>
            Terra surfaces distressed properties, tracks the deal pipeline, delivers market intelligence, and manages broker workflow — all from one command surface built for operators who move fast.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={onSignIn}
              style={{
                padding: "12px 28px", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
                background: accentLight, color: "#0b1009", border: "none", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accent; (e.currentTarget as HTMLButtonElement).style.color = "#f0f4e6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accentLight; (e.currentTarget as HTMLButtonElement).style.color = "#0b1009"; }}
            >
              Sign in to Platform
            </button>
            <a
              href="mailto:inquiries@szlholdings.com"
              style={{
                padding: "12px 28px", borderRadius: "6px", fontSize: "14px", fontWeight: 500, cursor: "pointer", textDecoration: "none",
                background: "rgba(255,255,255,0.03)", color: "#92a478", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.15s",
                display: "inline-flex", alignItems: "center", gap: "6px",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)"; (e.currentTarget as HTMLElement).style.color = "#e6ead6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "#92a478"; }}
            >
              Request a Demo
              <ArrowRight size={13} strokeWidth={2} />
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderTop: `1px solid ${accent}10`, borderBottom: `1px solid ${accent}10`, padding: "2.5rem 0", background: `${accent}07` }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2rem" }} className="terra-stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 700, fontFamily: "monospace", color: accentLight, marginBottom: "4px" }}>{stat.value}</p>
                <p style={{ fontSize: "11px", color: "#4e6042", letterSpacing: "0.06em", textTransform: "uppercase" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Distress Intelligence Section */}
      <section id="platform" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }} className="terra-two-col">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
                <Flame size={14} style={{ color: "#f59e0b" }} />
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#f59e0b" }}>Distress Engine</p>
              </div>
              <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f0f4e6", lineHeight: 1.08, marginBottom: "1.25rem" }}>
                Find deals before<br />the market does.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#4e6042", marginBottom: "1rem" }}>
                Terra's Distress Intelligence Engine tracks every pre-foreclosure filing, lis pendens action, auction calendar event, and tax lien across all five NYC boroughs — updated in real time from county court systems.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#4e6042" }}>
                Each distressed property receives an AI-scored opportunity rating (0–100) based on distress type, equity position, debt maturity, location, and time in distress — so you know where to focus before the opportunity closes.
              </p>
            </div>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4e6042", marginBottom: "1rem" }}>Distress Type Coverage</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {distressTypes.map((dt) => (
                  <div
                    key={dt.label}
                    style={{
                      padding: "14px 16px", borderRadius: "6px",
                      background: `${dt.color}08`, border: `1px solid ${dt.color}18`,
                    }}
                  >
                    <p style={{ fontSize: "18px", fontWeight: 700, fontFamily: "monospace", color: dt.color, marginBottom: "2px" }}>{dt.count}</p>
                    <p style={{ fontSize: "11.5px", color: "#92a478" }}>{dt.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section id="capabilities" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "5rem 0", background: `${accent}07` }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4e6042", marginBottom: "0.75rem" }}>Key Capabilities</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f0f4e6", lineHeight: 1.08, marginBottom: "2.5rem" }}>
            Every layer of the deal, in one platform.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }} className="terra-caps-grid">
            {features.map((feat) => (
              <div
                key={feat.title}
                style={{
                  padding: "1.5rem", borderRadius: "6px",
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `${accent}0d`;
                  el.style.borderColor = `${accent}25`;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = `0 8px 24px ${accent}10`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.02)";
                  el.style.borderColor = "rgba(255,255,255,0.055)";
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "none";
                }}
              >
                <feat.icon size={15} style={{ color: accentLight, marginBottom: "10px" }} />
                <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#e6ead6", marginBottom: "6px" }}>{feat.title}</p>
                <p style={{ fontSize: "12px", lineHeight: 1.6, color: "#4e6042" }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Intelligence — NYC Focus */}
      <section id="markets" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="terra-two-col">
            <div>
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: accentLight, marginBottom: "0.75rem" }}>Market Coverage</p>
              <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f0f4e6", lineHeight: 1.08, marginBottom: "1.25rem" }}>
                All five boroughs.<br />One intelligence layer.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#4e6042", marginBottom: "1.5rem" }}>
                Terra delivers real-time market intelligence across Manhattan, Brooklyn, Queens, the Bronx, and Staten Island — with price-per-sqft analysis, comparable sales data, borough-level trends, and ownership unmask across the entire NYC metro.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { label: "Ownership Unmask", desc: "LLC → beneficial owner entity resolution with confidence scoring" },
                  { label: "Debt Maturity Tracking", desc: "Loan maturity calendars and refinancing risk across tracked properties" },
                  { label: "Climate Risk Overlay", desc: "Flood, fire, and heat risk scoring with FEMA zone cross-referencing" },
                  { label: "Off-Market Scoring", desc: "Propensity model combining hold duration, equity, debt, and owner signals" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", gap: "12px", padding: "12px 14px", borderRadius: "6px", background: `${accent}0a`, border: `1px solid ${accent}18` }}>
                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: accentLight, flexShrink: 0, marginTop: "6px" }} />
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5d1", marginBottom: "2px" }}>{item.label}</p>
                      <p style={{ fontSize: "12px", lineHeight: 1.55, color: "#4e6042" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: `${accent}07`, border: `1px solid ${accent}14`, borderRadius: "10px", padding: "1.75rem" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4e6042", marginBottom: "1.25rem" }}>Borough Snapshot</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { borough: "Manhattan", listings: 214, distress: 180, avgScore: 82 },
                  { borough: "Brooklyn", listings: 318, distress: 295, avgScore: 76 },
                  { borough: "Queens", listings: 276, distress: 260, avgScore: 71 },
                  { borough: "Bronx", listings: 198, distress: 340, avgScore: 68 },
                  { borough: "Staten Island", listings: 94, distress: 125, avgScore: 63 },
                ].map((b) => (
                  <div key={b.borough}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#e6ead6" }}>{b.borough}</span>
                      <div style={{ display: "flex", gap: "16px", fontSize: "11px", fontFamily: "monospace" }}>
                        <span style={{ color: "#4e6042" }}>{b.listings} listings</span>
                        <span style={{ color: "#f59e0b" }}>{b.distress} distress</span>
                        <span style={{ color: accentLight }}>Avg score: {b.avgScore}</span>
                      </div>
                    </div>
                    <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${b.avgScore}%`, background: `linear-gradient(90deg, ${accent}, ${accentLight})`, borderRadius: "2px" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "5rem 0", background: `${accent}07` }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4e6042", marginBottom: "0.75rem" }}>Built For</p>
          <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f0f4e6", lineHeight: 1.08, marginBottom: "2.5rem" }}>
            Brokers who operate at scale.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }} className="terra-roles-grid">
            {[
              {
                role: "Investment Brokers",
                headline: "Source deals others don't see.",
                desc: "Distress intelligence, off-market scoring, and LLC unmask — with a deal pipeline that converts distress leads to closings without leaving the platform.",
              },
              {
                role: "Brokerage Teams",
                headline: "Manage listings, pipeline, and leads — unified.",
                desc: "Active listings, deal stages, CRM contacts, and team performance in one command surface. No spreadsheets, no context switching.",
              },
              {
                role: "Real Estate Investors",
                headline: "Buy from data, not rumors.",
                desc: "IRR modeling, scenario planning, cap rate analysis, and risk overlays — with live market data from 89K+ data points across the NYC metro.",
              },
            ].map((r) => (
              <div
                key={r.role}
                style={{
                  padding: "1.75rem", borderRadius: "6px",
                  background: `${accent}08`, border: `1px solid ${accent}15`,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `${accent}12`;
                  el.style.borderColor = `${accent}28`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `${accent}08`;
                  el.style.borderColor = `${accent}15`;
                }}
              >
                <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: accentLight, marginBottom: "0.5rem" }}>{r.role}</p>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "#e6ead6", marginBottom: "0.75rem", letterSpacing: "-0.012em" }}>{r.headline}</p>
                <p style={{ fontSize: "13px", lineHeight: 1.65, color: "#4e6042" }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Tech Block */}
      <section id="pricing" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="terra-two-col">
            <div>
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4e6042", marginBottom: "0.75rem" }}>Platform</p>
              <h2 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.026em", color: "#f0f4e6", lineHeight: 1.08, marginBottom: "1rem" }}>
                Built for brokers.<br />Powered by Alloy.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "#4e6042", marginBottom: "1.5rem" }}>
                Terra runs on the Alloy orchestration engine. Every distress lead, deal stage transition, and market signal is backed by the same intelligence layer powering the entire SZL ecosystem — with full audit trail and governance gates on every automated action.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { icon: Shield, label: "Audit trail on every action", desc: "Every deal stage, lead conversion, and alert resolved with full attribution" },
                  { icon: Zap, label: "Real-time data ingestion", desc: "County court filings, MLS feeds, and market data updated continuously" },
                  { icon: FileText, label: "Export-ready intelligence", desc: "Deal briefs, ownership reports, and pipeline summaries ready to share" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", gap: "12px", padding: "12px 14px", borderRadius: "6px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)" }}>
                    <item.icon size={14} style={{ color: accentLight, flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#cbd5d1", marginBottom: "2px" }}>{item.label}</p>
                      <p style={{ fontSize: "12px", color: "#4e6042" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: "10px", padding: "1.75rem" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4e6042", marginBottom: "1.25rem" }}>Platform Activity</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { label: "Distress alerts processed today", value: "347" },
                  { label: "Active deal pipeline value", value: "$4.8B" },
                  { label: "Properties in watchlist", value: "1,240" },
                  { label: "Leads converted this month", value: "84" },
                  { label: "Avg opportunity score", value: "71 / 100" },
                  { label: "Auction calendar events (30d)", value: "95" },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${accent}0d`, paddingBottom: "12px" }}>
                    <span style={{ fontSize: "13px", color: "#4e6042" }}>{item.label}</span>
                    <span style={{ fontSize: "14px", fontFamily: "monospace", fontWeight: 700, color: "#e6ead6" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Powered by Alloy */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "2rem 0", background: "rgba(0,212,255,0.02)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "4px", height: "32px", borderRadius: "2px", background: "#00d4ff", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#00d4ff", marginBottom: "3px" }}>Powered by Alloy</p>
            <p style={{ fontSize: "13px", color: "#4e6042" }}>Terra runs on the Alloy orchestration engine — every distress signal, deal workflow, and market data point is acquired, normalized, and acted upon by the same intelligence layer powering the entire SZL ecosystem.</p>
          </div>
          <a
            href="/alloy"
            style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 600, color: "#00d4ff", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px", flexShrink: 0, transition: "opacity 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          >
            View Alloy <ArrowRight size={12} />
          </a>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "5rem 0" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.022em", color: "#f0f4e6", marginBottom: "1rem" }}>
            Access Terra
          </h2>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "#4e6042", marginBottom: "2rem" }}>
            Sign in to access the Terra real estate intelligence platform, or request a demonstration for your brokerage.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={onSignIn}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "12px 28px", borderRadius: "6px",
                fontSize: "14px", fontWeight: 600, cursor: "pointer", background: accentLight, color: "#0b1009", border: "none", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accent; (e.currentTarget as HTMLButtonElement).style.color = "#f0f4e6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = accentLight; (e.currentTarget as HTMLButtonElement).style.color = "#0b1009"; }}
            >
              Sign in to Terra
              <ArrowRight size={14} />
            </button>
            <a
              href="mailto:inquiries@szlholdings.com"
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "12px 28px", borderRadius: "6px",
                fontSize: "14px", fontWeight: 500, cursor: "pointer", textDecoration: "none",
                background: "rgba(255,255,255,0.03)", color: "#92a478", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)"; (e.currentTarget as HTMLElement).style.color = "#e6ead6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "#92a478"; }}
            >
              Request a Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "3rem", marginBottom: "2.5rem" }} className="terra-footer-grid">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "5px", background: `${accent}1a`, border: `1px solid ${accent}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Building2 size={12} style={{ color: accentLight }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#e6ead6" }}>Terra</span>
              </div>
              <p style={{ fontSize: "12px", color: "#4e6042", lineHeight: 1.65 }}>Real estate intelligence and brokerage platform by SZL Holdings. Built for NYC distress and deal command.</p>
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4e6042", marginBottom: "1rem" }}>Platform</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {["Distress Engine", "Deal Pipeline", "Market Intel", "CRM & Leads"].map(l => (
                  <span key={l} style={{ fontSize: "13px", color: "#4e6042", cursor: "pointer", transition: "color 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#92a478"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4e6042"; }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4e6042", marginBottom: "1rem" }}>Markets</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"].map(l => (
                  <span key={l} style={{ fontSize: "13px", color: "#4e6042", cursor: "pointer", transition: "color 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#92a478"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4e6042"; }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4e6042", marginBottom: "1rem" }}>Ecosystem</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {["SZL Holdings", "Alloy", "Lyte", "Vessels", "Aegis"].map(l => (
                  <span key={l} style={{ fontSize: "13px", color: "#4e6042", cursor: "pointer", transition: "color 0.15s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#92a478"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4e6042"; }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${accent}10`, paddingTop: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontSize: "11px", color: "#2e3d26", fontFamily: "monospace" }}>© {new Date().getFullYear()} SZL Holdings. All rights reserved.</p>
            <p style={{ fontSize: "11px", color: "#2e3d26", fontFamily: "monospace" }}>inquiries@szlholdings.com</p>
          </div>
        </div>
      </footer>

      <style>{`
        @media (min-width: 768px) {
          .terra-nav-links { display: flex !important; }
        }
        @media (max-width: 768px) {
          .terra-stats-grid, .terra-caps-grid, .terra-roles-grid { grid-template-columns: 1fr 1fr !important; }
          .terra-two-col { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .terra-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 2rem !important; }
        }
        @media (max-width: 480px) {
          .terra-stats-grid, .terra-caps-grid, .terra-roles-grid { grid-template-columns: 1fr !important; }
          .terra-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
