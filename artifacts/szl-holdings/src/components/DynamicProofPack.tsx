import { useState } from "react";
import { Link } from "wouter";
import { m } from "framer-motion";
import { ArrowRight, FileText, Layers, BookOpen, Briefcase, Lock, Download, ChevronDown, ChevronUp } from "lucide-react";
import type { VisitorType } from "@/hooks/useNarrativeRouter";
import { getProofPack, type ProofAsset } from "@/data/proofPacks";
import { AssetGate } from "@/components/AssetGate";

interface DynamicProofPackProps {
  visitorType: VisitorType;
  onChangeIntent?: () => void;
  compact?: boolean;
}

const ASSET_TYPE_ICONS = {
  deck: Briefcase,
  brief: FileText,
  "case-study": BookOpen,
  architecture: Layers,
  model: Layers,
  proposal: Briefcase,
};

function AssetCard({ asset, accent }: { asset: ProofAsset; accent: string }) {
  const Icon = ASSET_TYPE_ICONS[asset.type] ?? FileText;

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      style={{
        padding: "1.25rem",
        borderRadius: "0.625rem",
        background: "hsla(0,0%,100%,0.025)",
        border: "1px solid hsla(0,0%,100%,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: "0.625rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{
          width: "28px", height: "28px",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: "0.375rem",
          background: "hsla(0,0%,100%,0.04)",
          border: "1px solid hsla(0,0%,100%,0.07)",
        }}>
          <Icon size={13} style={{ color: accent }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          {asset.gated && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
              <Lock size={10} style={{ color: "hsl(214,7%,45%)" }} />
              <span style={{ fontSize: "0.6875rem", color: "hsl(214,7%,45%)", fontFamily: "var(--font-mono)" }}>Gated</span>
            </div>
          )}
          {asset.downloadable && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
              <Download size={10} style={{ color: "hsl(145,60%,46%)" }} />
              <span style={{ fontSize: "0.6875rem", color: "hsl(145,60%,46%)", fontFamily: "var(--font-mono)" }}>Downloadable</span>
            </div>
          )}
        </div>
      </div>
      <div>
        <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,90%)", marginBottom: "0.25rem", letterSpacing: "-0.01em" }}>
          {asset.title}
        </h4>
        <p style={{ fontSize: "0.8125rem", lineHeight: 1.58, color: "hsl(214,7%,58%)" }}>
          {asset.description}
        </p>
      </div>
      {(asset.gated || asset.downloadable) ? (
        <AssetGate
          assetTitle={asset.title}
          assetDescription={asset.description}
          assetType={asset.gated ? "gated" : "downloadable"}
          nextHref={asset.ctaHref}
        >
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              fontSize: "0.8125rem", fontWeight: 600,
              color: accent,
              cursor: "pointer",
              marginTop: "auto",
            }}
          >
            {asset.cta}
            {asset.gated ? <Lock size={11} /> : <Download size={11} />}
          </span>
        </AssetGate>
      ) : (
        <Link
          href={asset.ctaHref}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.3rem",
            fontSize: "0.8125rem", fontWeight: 600,
            color: accent,
            textDecoration: "none",
            marginTop: "auto",
            transition: "opacity 0.18s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          {asset.cta}
          <ArrowRight size={12} />
        </Link>
      )}
    </m.div>
  );
}

export function DynamicProofPack({ visitorType, onChangeIntent, compact = false }: DynamicProofPackProps) {
  const [expanded, setExpanded] = useState(!compact);
  const pack = getProofPack(visitorType);

  const accentColors: Record<VisitorType, string> = {
    investor: "hsl(38,72%,58%)",
    lender: "hsl(192,72%,48%)",
    buyer: "hsl(145,60%,46%)",
    "design-partner": "hsl(222,60%,60%)",
    unknown: "hsl(192,72%,48%)",
  };

  const accent = accentColors[visitorType];

  if (compact) {
    return (
      <div style={{
        borderRadius: "0.875rem",
        background: "hsla(0,0%,100%,0.025)",
        border: "1px solid hsla(0,0%,100%,0.07)",
        overflow: "hidden",
      }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "1rem 1.25rem",
            background: "transparent", border: "none",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: accent }} />
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,88%)" }}>
              Proof pack: {pack.visitorType === "unknown" ? "All materials" : pack.visitorType.replace("-", " ")}
            </span>
          </div>
          {expanded ? <ChevronUp size={14} style={{ color: "hsl(214,7%,50%)" }} /> : <ChevronDown size={14} style={{ color: "hsl(214,7%,50%)" }} />}
        </button>

        {expanded && (
          <div style={{ padding: "0 1.25rem 1.25rem", display: "grid", gap: "0.625rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {pack.assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} accent={accent} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.875rem" }}>
          <div>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(214,7%,45%)", fontFamily: "var(--font-mono)", marginBottom: "0.375rem" }}>
              Proof pack
            </p>
            <h3 style={{ fontSize: "clamp(1.1rem,2vw,1.375rem)", fontWeight: 600, letterSpacing: "-0.018em", color: "hsl(38,8%,92%)" }}>
              {pack.headline}
            </h3>
          </div>
          {onChangeIntent && (
            <button
              onClick={onChangeIntent}
              style={{
                fontSize: "0.75rem", color: "hsl(214,7%,50%)", background: "transparent",
                border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "0.375rem",
                cursor: "pointer", padding: "0.375rem 0.75rem",
                transition: "border-color 0.18s ease, color 0.18s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.18)";
                (e.currentTarget as HTMLElement).style.color = "hsl(214,7%,70%)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.08)";
                (e.currentTarget as HTMLElement).style.color = "hsl(214,7%,50%)";
              }}
            >
              Change intent
            </button>
          )}
        </div>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "hsl(214,7%,60%)", maxWidth: "56ch" }}>
          {pack.subheadline}
        </p>
      </div>

      <div style={{ display: "grid", gap: "0.875rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: "1.75rem" }}>
        {pack.assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} accent={accent} />
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <Link
          href={pack.primaryCTA.href}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.375rem",
            padding: "0.625rem 1.25rem",
            background: accent,
            color: "hsl(214,18%,4%)",
            borderRadius: "0.375rem",
            fontSize: "0.875rem", fontWeight: 600,
            textDecoration: "none",
            transition: "opacity 0.18s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          {pack.primaryCTA.label}
          <ArrowRight size={14} />
        </Link>
        <Link
          href={pack.secondaryCTA.href}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.375rem",
            padding: "0.625rem 1.25rem",
            background: "transparent",
            color: "hsl(214,7%,62%)",
            border: "1px solid hsla(0,0%,100%,0.10)",
            borderRadius: "0.375rem",
            fontSize: "0.875rem", fontWeight: 500,
            textDecoration: "none",
            transition: "border-color 0.18s ease, color 0.18s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.22)";
            (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,88%)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.10)";
            (e.currentTarget as HTMLElement).style.color = "hsl(214,7%,62%)";
          }}
        >
          {pack.secondaryCTA.label}
        </Link>
      </div>
    </div>
  );
}
