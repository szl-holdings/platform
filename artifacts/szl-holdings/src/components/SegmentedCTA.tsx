import { Link } from "wouter";
import { ArrowRight, TrendingUp, Landmark, Building2, Users } from "lucide-react";
import type { VisitorType } from "@/hooks/useNarrativeRouter";

const CLICK_SIGNAL_MAP: Record<Exclude<VisitorType, "unknown">, string> = {
  investor: "proof_pack_investor",
  lender: "proof_pack_lender",
  buyer: "proof_pack_buyer",
  "design-partner": "proof_pack_design-partner",
};

const CLICK_SIGNAL_WEIGHTS: Record<string, { type: Exclude<VisitorType, "unknown">; weight: number }> = {
  proof_pack_investor: { type: "investor", weight: 0.75 },
  proof_pack_lender: { type: "lender", weight: 0.75 },
  proof_pack_buyer: { type: "buyer", weight: 0.7 },
  "proof_pack_design-partner": { type: "design-partner", weight: 0.75 },
};

function recordSegmentClick(signal: string): void {
  const mapping = CLICK_SIGNAL_WEIGHTS[signal];
  if (!mapping) return;
  try {
    const CLICK_SIGNALS_KEY = "szl_click_signals";
    let data: { counts: Record<string, number>; signals: string[] } = {
      counts: { investor: 0, lender: 0, buyer: 0, "design-partner": 0, unknown: 0 },
      signals: [],
    };
    const raw = sessionStorage.getItem(CLICK_SIGNALS_KEY);
    if (raw) data = JSON.parse(raw);
    data.counts[mapping.type] = (data.counts[mapping.type] ?? 0) + mapping.weight;
    if (!data.signals.includes(signal)) data.signals = [...data.signals, signal].slice(-20);
    sessionStorage.setItem(CLICK_SIGNALS_KEY, JSON.stringify(data));
  } catch {}
}

interface SegmentedCTAProps {
  visitorType?: VisitorType;
  onSelectIntent?: (type: VisitorType) => void;
  compact?: boolean;
}

interface CTAConfig {
  icon: typeof TrendingUp;
  label: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  accentColor: string;
  accentRgb: string;
}

const CTA_CONFIGS: Record<Exclude<VisitorType, "unknown">, CTAConfig> = {
  investor: {
    icon: TrendingUp,
    label: "Investor",
    description: "Thesis, architecture, moat analysis, and data room.",
    primaryHref: "/investors/overview",
    primaryLabel: "View investor materials",
    accentColor: "hsl(38,72%,58%)",
    accentRgb: "212,160,84",
  },
  lender: {
    icon: Landmark,
    label: "Lender / Bank",
    description: "Working capital narrative, repayment discipline, and commercial pipeline.",
    primaryHref: "/investor-relations",
    primaryLabel: "View lender brief",
    accentColor: "hsl(192,72%,48%)",
    accentRgb: "25,180,210",
  },
  buyer: {
    icon: Building2,
    label: "Operator / Buyer",
    description: "Platform demo, how it works, and trust architecture.",
    primaryHref: "/demo",
    primaryLabel: "Request a demo",
    accentColor: "hsl(145,60%,46%)",
    accentRgb: "58,168,90",
  },
  "design-partner": {
    icon: Users,
    label: "Design Partner",
    description: "90-day proof program — instrument one real workflow with the founder.",
    primaryHref: "/design-partners",
    primaryLabel: "See the program",
    accentColor: "hsl(222,60%,60%)",
    accentRgb: "86,112,214",
  },
};

export function SegmentedCTA({ visitorType, onSelectIntent, compact = false }: SegmentedCTAProps) {
  const knownTypes = ["investor", "lender", "buyer", "design-partner"] as const;

  if (visitorType && visitorType !== "unknown") {
    const config = CTA_CONFIGS[visitorType];
    const Icon = config.icon;
    return (
      <div style={{
        padding: compact ? "1.25rem 1.5rem" : "2rem 2.5rem",
        borderRadius: "0.875rem",
        background: `rgba(${config.accentRgb}, 0.05)`,
        border: `1px solid rgba(${config.accentRgb}, 0.18)`,
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{
            width: "32px", height: "32px",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "0.5rem",
            background: `rgba(${config.accentRgb}, 0.12)`,
            border: `1px solid rgba(${config.accentRgb}, 0.25)`,
          }}>
            <Icon size={15} style={{ color: config.accentColor }} />
          </div>
          <div>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: config.accentColor, fontFamily: "var(--font-mono)" }}>
              For {config.label}s
            </p>
          </div>
        </div>
        {!compact && (
          <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,62%)" }}>
            {config.description}
          </p>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", alignItems: "center" }}>
          <Link
            href={config.primaryHref}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.375rem",
              padding: "0.625rem 1.25rem",
              background: `rgba(${config.accentRgb}, 0.12)`,
              border: `1px solid rgba(${config.accentRgb}, 0.28)`,
              borderRadius: "0.375rem",
              fontSize: "0.8125rem", fontWeight: 600,
              color: config.accentColor,
              textDecoration: "none",
              transition: "background 0.18s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${config.accentRgb}, 0.18)`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${config.accentRgb}, 0.12)`; }}
          >
            {config.primaryLabel}
            <ArrowRight size={13} />
          </Link>
          {onSelectIntent && (
            <button
              onClick={() => onSelectIntent("unknown")}
              style={{
                fontSize: "0.75rem", color: "hsl(214,7%,48%)", background: "transparent",
                border: "none", cursor: "pointer", padding: "0.25rem 0",
                textDecoration: "underline", textDecorationColor: "hsl(214,7%,28%)",
              }}
            >
              Not right? Switch view
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: compact ? "1.5rem" : "2.5rem",
      borderRadius: "0.875rem",
      background: "hsla(0,0%,100%,0.025)",
      border: "1px solid hsla(0,0%,100%,0.07)",
    }}>
      {!compact && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(214,7%,45%)", fontFamily: "var(--font-mono)", marginBottom: "0.5rem" }}>
            What brings you here?
          </p>
          <p style={{ fontSize: "0.875rem", color: "hsl(214,7%,60%)", lineHeight: 1.58 }}>
            Select your role and we'll surface the right proof pack for your conversation.
          </p>
        </div>
      )}
      <div style={{ display: "grid", gap: "0.625rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {knownTypes.map((type) => {
          const config = CTA_CONFIGS[type];
          const Icon = config.icon;
          return (
            <button
              key={type}
              onClick={() => {
                recordSegmentClick(CLICK_SIGNAL_MAP[type]);
                onSelectIntent?.(type);
              }}
              style={{
                display: "flex", flexDirection: "column", gap: "0.5rem",
                padding: "1rem",
                background: "hsla(0,0%,100%,0.025)",
                border: "1px solid hsla(0,0%,100%,0.07)",
                borderRadius: "0.5rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.18s ease, border-color 0.18s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = `rgba(${config.accentRgb}, 0.06)`;
                el.style.borderColor = `rgba(${config.accentRgb}, 0.22)`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "hsla(0,0%,100%,0.025)";
                el.style.borderColor = "hsla(0,0%,100%,0.07)";
              }}
            >
              <div style={{
                width: "28px", height: "28px",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "0.375rem",
                background: `rgba(${config.accentRgb}, 0.10)`,
              }}>
                <Icon size={13} style={{ color: config.accentColor }} />
              </div>
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.2rem" }}>{config.label}</p>
                {!compact && (
                  <p style={{ fontSize: "0.75rem", color: "hsl(214,7%,55%)", lineHeight: 1.5 }}>{config.description}</p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "auto" }}>
                <Link
                  href={config.primaryHref}
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: "0.75rem", fontWeight: 600, color: config.accentColor, textDecoration: "none", display: "flex", alignItems: "center", gap: "0.2rem" }}
                >
                  {config.primaryLabel} <ArrowRight size={11} />
                </Link>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface InlineSegmentedCTAProps {
  visitorType: VisitorType;
  context?: string;
}

export function InlineSegmentedCTA({ visitorType, context }: InlineSegmentedCTAProps) {
  if (visitorType === "unknown") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
        <Link href="/demo" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1.25rem", background: "hsl(192,72%,48%)", color: "hsl(214,18%,4%)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
          Request a demo <ArrowRight size={14} />
        </Link>
        <Link href="/investors/overview" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1.25rem", background: "transparent", color: "hsl(38,72%,58%)", border: "1px solid hsla(38,72%,58%,0.28)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
          Investor materials
        </Link>
        <Link href="/design-partners" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1.25rem", background: "transparent", color: "hsl(214,7%,62%)", border: "1px solid hsla(0,0%,100%,0.10)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>
          Design partners
        </Link>
      </div>
    );
  }

  const config = CTA_CONFIGS[visitorType];
  const Icon = config.icon;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", alignItems: "center" }}>
      <Link
        href={config.primaryHref}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.375rem",
          padding: "0.625rem 1.25rem",
          background: `rgba(${config.accentRgb}, 0.12)`,
          border: `1px solid rgba(${config.accentRgb}, 0.28)`,
          borderRadius: "0.375rem",
          fontSize: "0.875rem", fontWeight: 600,
          color: config.accentColor,
          textDecoration: "none",
        }}
      >
        <Icon size={14} />
        {config.primaryLabel}
        <ArrowRight size={13} />
      </Link>
      {context === "investor" ? (
        <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1.25rem", background: "transparent", color: "hsl(214,7%,62%)", border: "1px solid hsla(0,0%,100%,0.10)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>
          Start a conversation
        </Link>
      ) : (
        <Link href="/trust" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1.25rem", background: "transparent", color: "hsl(214,7%,62%)", border: "1px solid hsla(0,0%,100%,0.10)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>
          Trust center
        </Link>
      )}
    </div>
  );
}
