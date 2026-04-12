import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  TrendingUp, Shield, Lightbulb, Clock, DollarSign,
  Star, ChevronRight, BarChart3, Activity,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOLD = "rgba(196,170,126,1)";
const GOLD_DIM = "rgba(196,170,126,0.08)";
const GOLD_BORDER = "rgba(196,170,126,0.18)";
const CREAM = "rgba(244,237,224,0.88)";
const CREAM_DIM = "rgba(244,237,224,0.45)";
const CREAM_FAINT = "rgba(244,237,224,0.07)";
const MUTED = "rgba(244,237,224,0.25)";
const DEEP = "#0a0906";

type ValueType = "decision" | "opportunity" | "protection" | "time" | "wealth";

interface TimelineEvent {
  id: string;
  date: string;
  quarter: string;
  title: string;
  category: string;
  type: ValueType;
  valueMeta: string;
  quantified: string;
  description: string;
  cumulativeValue: number;
}

const typeConfig: Record<ValueType, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  decision: { color: "#c4aa7e", bg: "rgba(196,170,126,0.10)", icon: Lightbulb, label: "Decision Influenced" },
  opportunity: { color: "#38bdf8", bg: "rgba(56,189,248,0.08)", icon: TrendingUp, label: "Opportunity Surfaced" },
  protection: { color: "#f87171", bg: "rgba(248,113,113,0.08)", icon: Shield, label: "Risk Mitigated" },
  time: { color: "#a78bfa", bg: "rgba(167,139,250,0.08)", icon: Clock, label: "Time Recovered" },
  wealth: { color: "#34d399", bg: "rgba(52,211,153,0.08)", icon: DollarSign, label: "Wealth Protected" },
};

const EVENTS: TimelineEvent[] = [
  {
    id: "e1", date: "Feb 2025", quarter: "Q1 2025",
    title: "Oxfordshire estate vendor dispute resolution",
    category: "Estate Operations", type: "protection",
    valueMeta: "Dispute resolved pre-litigation",
    quantified: "Est. £45,000 legal exposure avoided",
    description: "A landscaping contractor presented an inflated invoice dispute. Carlota Jo reviewed documentation, engaged the correct legal contact, and achieved full resolution without litigation.",
    cumulativeValue: 45,
  },
  {
    id: "e2", date: "Mar 2025", quarter: "Q1 2025",
    title: "Tax domicile documentation — annual review",
    category: "Financial Structure", type: "wealth",
    valueMeta: "Domicile structure preserved",
    quantified: "£1.2M+ in annual tax positioning protected",
    description: "Annual coordination with advisors to maintain correct documentation for non-domicile tax treatment. Paperwork filed correctly, deadlines met, structure preserved for another year.",
    cumulativeValue: 1245,
  },
  {
    id: "e3", date: "Apr 2025", quarter: "Q2 2025",
    title: "St. Barths villa — January 2026 pre-booking",
    category: "Travel & Lifestyle", type: "opportunity",
    valueMeta: "Villa La Banane secured",
    quantified: "6-month lead time captured; suite not otherwise available",
    description: "Identified the optimal booking window for the preferred St. Barths villa before peak demand. Secured January 7–17 before external availability closed.",
    cumulativeValue: 1260,
  },
  {
    id: "e4", date: "May 2025", quarter: "Q2 2025",
    title: "Oxfordshire summer opening — heating issue caught",
    category: "Residence Operations", type: "protection",
    valueMeta: "Pre-season inspection identified boiler fault",
    quantified: "Est. £18,000 emergency repair cost avoided",
    description: "Opening inspection revealed a cracked heat exchanger that would have failed mid-season. Early identification allowed planned replacement vs. emergency callout.",
    cumulativeValue: 1278,
  },
  {
    id: "e5", date: "Jun 2025", quarter: "Q2 2025",
    title: "Summer family gathering — full coordination",
    category: "Events & Hospitality", type: "time",
    valueMeta: "22-person event managed end-to-end",
    quantified: "~60 hours of coordination recovered",
    description: "Complete logistics management for extended family summer weekend — catering, accommodation, staffing, transport, entertainment. Zero client involvement required.",
    cumulativeValue: 1290,
  },
  {
    id: "e6", date: "Aug 2025", quarter: "Q3 2025",
    title: "Discretionary art acquisition — due diligence",
    category: "Wealth Management", type: "decision",
    valueMeta: "Provenance issue identified pre-purchase",
    quantified: "£380,000 acquisition risk averted",
    description: "A proposed art acquisition surfaced with incomplete provenance. Carlota Jo engaged a specialist researcher; undisclosed partial ownership history was discovered. Purchase halted.",
    cumulativeValue: 1670,
  },
  {
    id: "e7", date: "Sep 2025", quarter: "Q3 2025",
    title: "Mayfair apartment — lease renewal negotiation",
    category: "Property", type: "wealth",
    valueMeta: "Lease terms improved",
    quantified: "£28,000 annual saving vs. proposed renewal",
    description: "Coordinated with property advisors to negotiate more favorable lease terms, reducing annual rental by £28K against the landlord's initial position.",
    cumulativeValue: 1698,
  },
  {
    id: "e8", date: "Nov 2025", quarter: "Q4 2025",
    title: "Christmas household event — full production",
    category: "Events & Hospitality", type: "time",
    valueMeta: "16-person Christmas event managed",
    quantified: "~45 hours of coordination recovered",
    description: "Wines sourced, florals arranged, catering confirmed, staff briefed, gifts purchased and wrapped. Delivered without a single client touchpoint required.",
    cumulativeValue: 1705,
  },
  {
    id: "e9", date: "Jan 2026", quarter: "Q1 2026",
    title: "New investment opportunity — private credit",
    category: "Wealth Management", type: "opportunity",
    valueMeta: "Access facilitated via network",
    quantified: "£500K allocation at preferred terms",
    description: "Connected client to a curated private credit opportunity through the advisory network. Allocation secured at institutional pricing.",
    cumulativeValue: 2205,
  },
  {
    id: "e10", date: "Feb 2026", quarter: "Q1 2026",
    title: "Household staff transition — new housekeeper",
    category: "Staffing", type: "time",
    valueMeta: "Replacement hired & onboarded",
    quantified: "~80 hours of search and onboarding recovered",
    description: "After the departure of the senior housekeeper, Carlota Jo managed the full replacement process — search, shortlisting, interviews, reference checks, and onboarding documentation.",
    cumulativeValue: 2220,
  },
  {
    id: "e11", date: "Mar 2026", quarter: "Q1 2026",
    title: "Quarterly operational review delivered",
    category: "Reporting", type: "decision",
    valueMeta: "Board-quality summary prepared",
    quantified: "Full picture across 3 residences, 12 vendors, 6 open matters",
    description: "Comprehensive quarterly review covering all property status, vendor relationships, open action items, upcoming horizon items, and financial obligations.",
    cumulativeValue: 2240,
  },
];

const MAX_VALUE = 2500;

function SparklineBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: 3, background: "rgba(196,170,126,0.12)", borderRadius: 2, overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: "100%", background: `linear-gradient(90deg, rgba(196,170,126,0.4), ${GOLD})`, borderRadius: 2 }}
      />
    </div>
  );
}

function EventCard({ event, index }: { event: TimelineEvent; index: number }) {
  const cfg = typeConfig[event.type];
  const Icon = cfg.icon;
  const isRight = index % 2 === 0;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 0, position: "relative" }}>
      {isRight ? (
        <>
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ flex: 1, paddingRight: 28 }}
          >
            <div style={{
              background: CREAM_FAINT, border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 10, padding: "16px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: cfg.bg, border: `1px solid ${cfg.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={12} style={{ color: cfg.color }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {cfg.label}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: MUTED }}>{event.date}</span>
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 500, color: CREAM, margin: "0 0 6px" }}>{event.title}</h3>
              <p style={{ fontSize: 12, color: CREAM_DIM, margin: "0 0 10px", lineHeight: 1.55 }}>{event.description}</p>
              <div style={{
                background: cfg.bg, border: `1px solid ${cfg.color}20`,
                borderRadius: 6, padding: "8px 10px",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: cfg.color, margin: "0 0 2px" }}>{event.valueMeta}</p>
                <p style={{ fontSize: 11, color: CREAM_DIM, margin: 0 }}>{event.quantified}</p>
              </div>
              <div style={{ marginTop: 10 }}>
                <SparklineBar value={event.cumulativeValue} max={MAX_VALUE} />
                <p style={{ fontSize: 10, color: MUTED, margin: "4px 0 0" }}>Cumulative value: £{event.cumulativeValue.toLocaleString()}K</p>
              </div>
            </div>
          </motion.div>
          <div style={{ width: 48, flexShrink: 0, display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: 0.05 }}
              style={{
                width: 14, height: 14, borderRadius: "50%",
                background: cfg.color, border: `3px solid ${DEEP}`,
                boxShadow: `0 0 0 1px ${cfg.color}40`,
                marginTop: 20,
              }}
            />
          </div>
          <div style={{ flex: 1 }} />
        </>
      ) : (
        <>
          <div style={{ flex: 1 }} />
          <div style={{ width: 48, flexShrink: 0, display: "flex", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: 0.05 }}
              style={{
                width: 14, height: 14, borderRadius: "50%",
                background: cfg.color, border: `3px solid ${DEEP}`,
                boxShadow: `0 0 0 1px ${cfg.color}40`,
                marginTop: 20,
              }}
            />
          </div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ flex: 1, paddingLeft: 28 }}
          >
            <div style={{
              background: CREAM_FAINT, border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 10, padding: "16px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: cfg.bg, border: `1px solid ${cfg.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={12} style={{ color: cfg.color }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {cfg.label}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: MUTED }}>{event.date}</span>
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 500, color: CREAM, margin: "0 0 6px" }}>{event.title}</h3>
              <p style={{ fontSize: 12, color: CREAM_DIM, margin: "0 0 10px", lineHeight: 1.55 }}>{event.description}</p>
              <div style={{
                background: cfg.bg, border: `1px solid ${cfg.color}20`,
                borderRadius: 6, padding: "8px 10px",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: cfg.color, margin: "0 0 2px" }}>{event.valueMeta}</p>
                <p style={{ fontSize: 11, color: CREAM_DIM, margin: 0 }}>{event.quantified}</p>
              </div>
              <div style={{ marginTop: 10 }}>
                <SparklineBar value={event.cumulativeValue} max={MAX_VALUE} />
                <p style={{ fontSize: 10, color: MUTED, margin: "4px 0 0" }}>Cumulative value: £{event.cumulativeValue.toLocaleString()}K</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

export default function EngagementTimeline() {
  usePageMeta({ title: "Engagement Value Timeline — Carlota Jo" });

  const totalValue = EVENTS[EVENTS.length - 1].cumulativeValue;
  const decisions = EVENTS.filter(e => e.type === "decision").length;
  const protections = EVENTS.filter(e => e.type === "protection").length;
  const opportunities = EVENTS.filter(e => e.type === "opportunity").length;

  return (
    <div style={{ minHeight: "100vh", background: DEEP, padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Activity size={16} style={{ color: GOLD }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: GOLD, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Engagement Value
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 300, color: CREAM, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Value Delivered Timeline
          </h1>
          <p style={{ fontSize: 14, color: CREAM_DIM, margin: 0 }}>
            The cumulative story of decisions influenced, risks averted, opportunities captured, and time recovered — quantified.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 48 }}>
          {[
            { label: "Cumulative Value", value: `£${(totalValue / 1000).toFixed(1)}M+`, sub: "since engagement", color: GOLD },
            { label: "Decisions Influenced", value: decisions, sub: "strategic outcomes", color: "#38bdf8" },
            { label: "Risks Mitigated", value: protections, sub: "exposure avoided", color: "#f87171" },
            { label: "Opportunities Surfaced", value: opportunities, sub: "captured for client", color: "#34d399" },
          ].map(stat => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: CREAM_FAINT, border: `1px solid ${GOLD_BORDER}`,
                borderRadius: 10, padding: "16px",
              }}
            >
              <p style={{ fontSize: 22, fontWeight: 700, color: stat.color, margin: "0 0 2px", letterSpacing: "-0.03em" }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: CREAM, margin: "0 0 2px" }}>{stat.label}</p>
              <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 40 }}>
          {Object.entries(typeConfig).map(([type, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={type} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: cfg.bg, border: `1px solid ${cfg.color}25`,
                borderRadius: 20, padding: "4px 10px",
              }}>
                <Icon size={10} style={{ color: cfg.color }} />
                <span style={{ fontSize: 10, color: cfg.color, fontWeight: 500 }}>{cfg.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ position: "relative" }}>
          <div style={{
            position: "absolute", left: "50%", top: 0, bottom: 0,
            width: 1, background: GOLD_BORDER,
            transform: "translateX(-50%)",
          }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {EVENTS.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            textAlign: "center", marginTop: 60, padding: 40,
            background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
            borderRadius: 12,
          }}
        >
          <Star size={20} style={{ color: GOLD, marginBottom: 12 }} />
          <p style={{ fontSize: 20, fontWeight: 300, color: CREAM, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            £{(totalValue / 1000).toFixed(1)}M+ in measurable value delivered
          </p>
          <p style={{ fontSize: 13, color: CREAM_DIM, margin: 0 }}>
            Across {EVENTS.length} documented engagements in the trailing 14 months.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
