import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { Building2, MapPin, TrendingUp, ArrowRight, Filter } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const TERRA_ACCENT = "hsl(30,55%,52%)";
const TERRA_ACCENT_DIM = "hsla(30,55%,52%,0.12)";
const TERRA_ACCENT_BORDER = "hsla(30,55%,52%,0.22)";

const DEMO_LISTINGS = [
  {
    id: "L001",
    address: "800 Fifth Avenue, Manhattan, NY 10065",
    type: "Office",
    submarket: "Midtown East",
    status: "Active",
    listPrice: 89500000,
    sqft: 142000,
    pricePerSqft: 630,
    daysOnMarket: 38,
    inquiries: 14,
    agent: "Rivera, K.",
    brokerage: "Terra Commercial",
    score: 87,
    tag: "High Demand",
  },
  {
    id: "L002",
    address: "1420 Harbor Blvd, Brooklyn, NY 11231",
    type: "Mixed-Use",
    submarket: "Red Hook",
    status: "Active",
    listPrice: 24800000,
    sqft: 58000,
    pricePerSqft: 428,
    daysOnMarket: 72,
    inquiries: 7,
    agent: "Chen, M.",
    brokerage: "Terra Commercial",
    score: 62,
    tag: "Price Adjustment",
  },
  {
    id: "L003",
    address: "340 Park Avenue South, Manhattan, NY 10010",
    type: "Office",
    submarket: "Flatiron / NoMad",
    status: "Active",
    listPrice: 47200000,
    sqft: 88000,
    pricePerSqft: 536,
    daysOnMarket: 21,
    inquiries: 22,
    agent: "Torres, A.",
    brokerage: "Terra Commercial",
    score: 94,
    tag: "Trending",
  },
  {
    id: "L004",
    address: "620 Atlantic Ave, Brooklyn, NY 11217",
    type: "Retail",
    submarket: "Boerum Hill",
    status: "Active",
    listPrice: 8900000,
    sqft: 14200,
    pricePerSqft: 627,
    daysOnMarket: 115,
    inquiries: 3,
    agent: "Williams, J.",
    brokerage: "Terra Commercial",
    score: 44,
    tag: "Watch",
  },
  {
    id: "L005",
    address: "1800 Westchester Ave, Bronx, NY 10472",
    type: "Industrial",
    submarket: "Hunts Point",
    status: "Pending",
    listPrice: 12400000,
    sqft: 76000,
    pricePerSqft: 163,
    daysOnMarket: 58,
    inquiries: 11,
    agent: "Rivera, K.",
    brokerage: "Terra Commercial",
    score: 79,
    tag: "Under Contract",
  },
  {
    id: "L006",
    address: "55 Water Street, Manhattan, NY 10041",
    type: "Office",
    submarket: "Financial District",
    status: "Active",
    listPrice: 134000000,
    sqft: 298000,
    pricePerSqft: 450,
    daysOnMarket: 189,
    inquiries: 4,
    agent: "Chen, M.",
    brokerage: "Terra Commercial",
    score: 38,
    tag: "Distress Signal",
  },
];

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "hsl(152,60%,45%)" : score >= 60 ? TERRA_ACCENT : score >= 40 ? "hsl(38,80%,52%)" : "hsl(4,65%,48%)";
  const bg = score >= 80 ? "hsla(152,60%,45%,0.12)" : score >= 60 ? TERRA_ACCENT_DIM : score >= 40 ? "hsla(38,80%,52%,0.12)" : "hsla(4,65%,48%,0.12)";
  return (
    <span style={{
      fontSize: "10.5px", fontWeight: "700",
      padding: "2px 8px", borderRadius: "4px",
      background: bg, color, border: `1px solid ${color}30`,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {score}
    </span>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Active: "hsl(152,55%,45%)",
  Pending: TERRA_ACCENT,
  Closed: "hsl(210,5%,48%)",
};

export default function TerraListingsPage() {
  const [filter, setFilter] = useState<"All" | "Office" | "Mixed-Use" | "Retail" | "Industrial">("All");

  useEffect(() => {
    document.title = "Terra Listings — Broker Command | SZL Holdings";
  }, []);

  const filtered = filter === "All" ? DEMO_LISTINGS : DEMO_LISTINGS.filter(l => l.type === filter);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Navbar />

      <main className="pt-24">
        <section style={{ padding: "5rem 0 2.5rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: TERRA_ACCENT, display: "block", marginBottom: "0.875rem" }}>
                Terra · Listings Intelligence
              </span>
              <h1 style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: "700",
                letterSpacing: "-0.025em",
                color: "hsl(38,12%,94%)",
                lineHeight: "1.08",
                marginBottom: "1rem",
              }}>
                Active listings. Every signal.<br />One command surface.
              </h1>
              <p style={{ fontSize: "0.9375rem", lineHeight: "1.7", color: "hsl(210,5%,56%)", maxWidth: "36rem", marginBottom: "2rem" }}>
                Terra listings are not a property portal. Each card carries days on market, inquiry volume, agent ownership, opportunity score, and status — everything a broker needs to act, not just browse.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <Filter size={12} style={{ color: "hsl(210,5%,40%)" }} />
                {(["All", "Office", "Mixed-Use", "Retail", "Industrial"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      fontSize: "12px", fontWeight: "500",
                      padding: "4px 12px", borderRadius: "4px", cursor: "pointer",
                      border: filter === f ? `1px solid ${TERRA_ACCENT_BORDER}` : "1px solid hsla(0,0%,100%,0.08)",
                      background: filter === f ? TERRA_ACCENT_DIM : "transparent",
                      color: filter === f ? TERRA_ACCENT : "hsl(210,5%,52%)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "1.5rem 0 5rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((listing, i) => (
                <m.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.055 }}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "0.875rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)";
                    (e.currentTarget as HTMLElement).style.borderColor = TERRA_ACCENT_BORDER;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)";
                    (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.06)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem" }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "4px",
                          background: `${STATUS_COLORS[listing.status]}18`,
                          border: `1px solid ${STATUS_COLORS[listing.status]}30`,
                          color: STATUS_COLORS[listing.status],
                        }}>{listing.status}</span>
                        <span style={{
                          fontSize: "10px", fontWeight: "500", padding: "2px 7px", borderRadius: "4px",
                          background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)",
                          color: "hsl(210,5%,52%)",
                        }}>{listing.type}</span>
                        {listing.tag && (
                          <span style={{
                            fontSize: "10px", fontWeight: "500", padding: "2px 7px", borderRadius: "4px",
                            background: TERRA_ACCENT_DIM, border: `1px solid ${TERRA_ACCENT_BORDER}`,
                            color: TERRA_ACCENT,
                          }}>{listing.tag}</span>
                        )}
                      </div>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "hsl(38,12%,90%)", letterSpacing: "-0.007em", lineHeight: "1.3" }}>
                        {listing.address}
                      </p>
                    </div>
                    <ScoreBadge score={listing.score} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "1rem" }}>
                    <MapPin size={11} style={{ color: "hsl(210,5%,40%)", flexShrink: 0 }} />
                    <span style={{ fontSize: "12px", color: "hsl(210,5%,48%)" }}>{listing.submarket}</span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
                    {[
                      { label: "List Price", value: formatPrice(listing.listPrice) },
                      { label: "$/sqft", value: `$${listing.pricePerSqft}` },
                      { label: "DOM", value: `${listing.daysOnMarket}d` },
                      { label: "Inquiries", value: String(listing.inquiries) },
                    ].map(stat => (
                      <div key={stat.label}>
                        <p style={{ fontSize: "9.5px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "hsl(210,5%,36%)", marginBottom: "0.2rem" }}>
                          {stat.label}
                        </p>
                        <p style={{ fontSize: "14px", fontWeight: "700", color: "hsl(38,12%,85%)", fontFamily: "'JetBrains Mono', monospace" }}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "hsl(210,5%,42%)" }}>
                        {listing.agent} · {listing.brokerage}
                      </span>
                    </div>
                    <a
                      href="/terra/"
                      style={{
                        display: "flex", alignItems: "center", gap: "0.375rem",
                        fontSize: "11.5px", fontWeight: "600", color: TERRA_ACCENT,
                        textDecoration: "none", opacity: 0.85,
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"}
                    >
                      View in Platform <ArrowRight size={11} />
                    </a>
                  </div>
                </m.div>
              ))}
            </div>

            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              style={{
                marginTop: "2.5rem",
                padding: "1.75rem",
                borderRadius: "0.875rem",
                background: "hsla(0,0%,100%,0.018)",
                border: `1px solid ${TERRA_ACCENT_BORDER}`,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "13.5px", fontWeight: "600", color: "hsl(38,12%,85%)", marginBottom: "0.5rem" }}>
                See the full command surface
              </p>
              <p style={{ fontSize: "12.5px", color: "hsl(210,5%,50%)", marginBottom: "1.25rem" }}>
                Active listings, inquiry routing, agent performance, and distress engine — all in one platform.
              </p>
              <a
                href="/terra/"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  background: TERRA_ACCENT, color: "hsl(20,10%,10%)",
                  padding: "0.625rem 1.25rem", borderRadius: "6px",
                  fontSize: "12.5px", fontWeight: "600", textDecoration: "none",
                }}
              >
                Open Terra Platform <ArrowRight size={12} />
              </a>
            </m.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
