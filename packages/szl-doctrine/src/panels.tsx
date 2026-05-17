/**
 * Shared, themable GovernancePanels component.
 *
 * Every artifact's `src/components/GovernancePanels.tsx` wraps this and
 * supplies its host-landing palette + slug. The component pulls all V8
 * facts from the doctrine constants in this same package — no duplication.
 */
import type { CSSProperties, ReactNode } from "react";
import {
  ANATOMY_FIGURES,
  ARTIFACT_ACCEPTANCE,
  ARXIV_TEXT,
  BYLINE,
  BYTE_IDENTICAL_TEXT,
  DOCTRINE_V6,
  DOCTRINE_VERSION_TEXT,
  GAP_COUNTS,
  HARD_FLOORS_TEXT,
  INGESTION_POLICY_TEXT,
  LAMBDA_FLOOR_TEXT,
  LICENSE_ALLOWLIST_TEXT,
  PAYLOAD_VERSION,
  REPLAY_ROOT_SHORT,
  SLO_STATUS,
  THESIS_LEDGER,
  ZENODO_TEXT,
  type ArtifactSlug,
} from "./index.js";

export interface PanelTheme {
  readonly section: CSSProperties;
  readonly card: CSSProperties;
  readonly kicker: CSSProperties;
  readonly heading: CSSProperties;
  readonly subtle: CSSProperties;
  readonly rowLabel: CSSProperties;
  readonly rowValue: CSSProperties;
  readonly rowMono: CSSProperties;
  readonly divider: string;
  readonly chipFg: string;
  readonly chipBorder: string;
  readonly chipBg: string;
  readonly chipOkFg: string;
  readonly chipWarnFg: string;
}

interface RowProps {
  label: string;
  value: string;
  mono?: boolean;
  theme: PanelTheme;
}

function Row({ label, value, mono, theme }: RowProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        paddingBottom: 8,
        borderBottom: `1px solid ${theme.divider}`,
      }}
    >
      <span style={theme.rowLabel}>{label}</span>
      <span style={mono ? theme.rowMono : theme.rowValue}>{value}</span>
    </div>
  );
}

interface CardProps {
  kicker: string;
  title: string;
  theme: PanelTheme;
  children: ReactNode;
}

function Card({ kicker, title, theme, children }: CardProps) {
  return (
    <div
      style={{
        ...theme.card,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div>
        <p style={theme.kicker}>{kicker}</p>
        <h4 style={theme.heading}>{title}</h4>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

interface ChipProps {
  label: string;
  tone?: "default" | "ok" | "warn";
  theme: PanelTheme;
}

function Chip({ label, tone = "default", theme }: ChipProps) {
  const fg =
    tone === "ok"
      ? theme.chipOkFg
      : tone === "warn"
      ? theme.chipWarnFg
      : theme.chipFg;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 10,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: fg,
        border: `1px solid ${theme.chipBorder}`,
        background: theme.chipBg,
        borderRadius: 2,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: 999,
          background: fg,
        }}
      />
      {label}
    </span>
  );
}

export interface GovernancePanelsProps {
  /** Artifact slug — drives the per-artifact acceptance slice. */
  slug: ArtifactSlug;
  /** Theme tokens sourced from the host landing's palette. */
  theme: PanelTheme;
  /**
   * Optional override headline (kept in case the host landing wants
   * to call out a specific framing).
   */
  headline?: string;
  /**
   * Optional supplementary metadata to render in the ownership card —
   * used by A11oy to surface package + axiom/theorem counts.
   */
  extraOwnershipRows?: ReadonlyArray<{ label: string; value: string; mono?: boolean }>;
}

export function GovernancePanelsBase({
  slug,
  theme,
  headline,
  extraOwnershipRows,
}: GovernancePanelsProps) {
  const acceptance = ARTIFACT_ACCEPTANCE[slug];
  const anatomyForArtifact = ANATOMY_FIGURES.filter((f) =>
    acceptance.anatomyAnchors.includes(f.slug),
  );

  return (
    <section style={theme.section}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <p style={theme.kicker}>
            Governance posture · Doctrine V6 · Payload {PAYLOAD_VERSION}
          </p>
          <h3
            style={{
              ...theme.heading,
              fontSize: 26,
              margin: "8px 0 6px",
            }}
          >
            {headline ?? "Every decision ships with its proof packet"}
          </h3>
          <p style={{ ...theme.subtle, maxWidth: 640 }}>
            {acceptance.acceptanceLine}
          </p>
        </div>

        <div
          style={{
            marginBottom: 22,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Chip label={LAMBDA_FLOOR_TEXT} theme={theme} />
          <Chip label={HARD_FLOORS_TEXT} theme={theme} />
          <Chip label={INGESTION_POLICY_TEXT} theme={theme} />
          <Chip
            label={`Gaps · ${GAP_COUNTS.p0} P0 · ${GAP_COUNTS.p1} P1 · ${GAP_COUNTS.p2} P2`}
            tone={GAP_COUNTS.p0 > 0 ? "warn" : "ok"}
            theme={theme}
          />
          <Chip label={SLO_STATUS.dependabotText} tone="ok" theme={theme} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <Card
            kicker="01 · Provenance"
            title="Replay-anchored, conjunctive Λ"
            theme={theme}
          >
            <Row
              label="Replay root"
              value={REPLAY_ROOT_SHORT}
              mono
              theme={theme}
            />
            <Row
              label="Byte-identical replays"
              value={BYTE_IDENTICAL_TEXT}
              theme={theme}
            />
            <Row
              label="Λ floor"
              value={LAMBDA_FLOOR_TEXT}
              theme={theme}
            />
            <Row
              label="Hard floors"
              value={HARD_FLOORS_TEXT}
              theme={theme}
            />
            <Row
              label="License allowlist"
              value={LICENSE_ALLOWLIST_TEXT}
              theme={theme}
            />
            <Row
              label="Ingestion policy"
              value={INGESTION_POLICY_TEXT}
              theme={theme}
            />
            <Row
              label="Doctrine"
              value={DOCTRINE_VERSION_TEXT}
              theme={theme}
            />
          </Card>

          <Card
            kicker="02 · Thesis ledger"
            title="TH1 → TH8 · VSP · FG"
            theme={theme}
          >
            {THESIS_LEDGER.map((t) => (
              <Row
                key={t.key}
                label={`${t.key} · ${t.name}`}
                value={`${t.testsPass} · ${t.status}`}
                theme={theme}
              />
            ))}
            <Row label="arXiv" value={ARXIV_TEXT} mono theme={theme} />
            <Row label="Zenodo" value={ZENODO_TEXT} theme={theme} />
            {anatomyForArtifact.length > 0 ? (
              <Row
                label="Anatomy figures"
                value={anatomyForArtifact
                  .map((f) => f.title)
                  .join(" · ")}
                theme={theme}
              />
            ) : null}
            <Row
              label="Primary theses for this artifact"
              value={acceptance.primaryTheses.join(" · ")}
              theme={theme}
            />
          </Card>

          <Card
            kicker="03 · Ownership"
            title="Canonical SZL Holdings byline"
            theme={theme}
          >
            <Row label="Author" value={BYLINE.name} theme={theme} />
            <Row label="ORCID" value={BYLINE.orcid} mono theme={theme} />
            <Row
              label="Affiliation"
              value={BYLINE.affiliation}
              theme={theme}
            />
            <Row label="Email" value={BYLINE.email} mono theme={theme} />
            <Row
              label="Scope"
              value={acceptance.scopeLine}
              theme={theme}
            />
            <Row
              label="Doctrine"
              value={DOCTRINE_VERSION_TEXT}
              theme={theme}
            />
            <Row
              label="Payload source"
              value={`SZL_FINAL_PAYLOAD ${PAYLOAD_VERSION}`}
              theme={theme}
            />
            {extraOwnershipRows?.map((row) => (
              <Row
                key={row.label}
                label={row.label}
                value={row.value}
                mono={row.mono}
                theme={theme}
              />
            ))}
          </Card>

          <Card
            kicker="04 · SLO / status"
            title="Org posture, live counters"
            theme={theme}
          >
            <Row
              label="Repos in org"
              value={SLO_STATUS.orgRepoCountText}
              theme={theme}
            />
            <Row
              label="CI failing"
              value={SLO_STATUS.ciFailingText}
              theme={theme}
            />
            <Row
              label="Dependabot · high/critical"
              value={SLO_STATUS.dependabotText}
              theme={theme}
            />
            <Row
              label="Code scanning"
              value={SLO_STATUS.codeScanningText}
              theme={theme}
            />
            <Row
              label="Scorecard"
              value={SLO_STATUS.scorecardText}
              theme={theme}
            />
            <Row
              label="Branch protection"
              value={SLO_STATUS.branchProtectionText}
              theme={theme}
            />
            <Row
              label="Gap report"
              value={`P0 ${GAP_COUNTS.p0} · P1 ${GAP_COUNTS.p1} · P2 ${GAP_COUNTS.p2} · total ${GAP_COUNTS.total}`}
              theme={theme}
            />
            <Row
              label="Build date"
              value={DOCTRINE_V6.buildDate}
              mono
              theme={theme}
            />
          </Card>
        </div>
      </div>
    </section>
  );
}

/**
 * Convenience factory for dark/gold landings (sentra, vessels, counsel,
 * conduit, a11oy). Caller may override individual tokens.
 */
export function makeDarkGoldTheme(overrides: Partial<{
  bg: string;
  cardBg: string;
  gold: string;
  body: string;
  bodyStrong: string;
  muted: string;
  divider: string;
}> = {}): PanelTheme {
  const bg = overrides.bg ?? "#0a0a0a";
  const cardBg = overrides.cardBg ?? "#0e0e0e";
  const gold = overrides.gold ?? "#c9b787";
  const body = overrides.body ?? "#ededed";
  const bodyStrong = overrides.bodyStrong ?? "#f5f5f5";
  const muted = overrides.muted ?? "#888";
  const divider = overrides.divider ?? "rgba(255,255,255,0.04)";
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

  return {
    section: {
      padding: "80px 24px",
      borderTop: `1px solid ${divider}`,
      background: bg,
    },
    card: {
      background: cardBg,
      border: `1px solid ${divider}`,
      padding: 22,
    },
    kicker: {
      margin: 0,
      fontFamily: mono,
      fontSize: 10,
      letterSpacing: "0.25em",
      color: gold,
      textTransform: "uppercase" as const,
    },
    heading: {
      margin: 0,
      fontSize: 15,
      fontWeight: 500,
      color: bodyStrong,
      letterSpacing: "-0.005em",
    },
    subtle: { margin: 0, fontSize: 13, color: muted },
    rowLabel: {
      fontSize: 11,
      color: muted,
      letterSpacing: "0.02em",
    },
    rowValue: {
      fontSize: 12,
      color: body,
      textAlign: "right" as const,
    },
    rowMono: {
      fontSize: 11,
      color: body,
      fontFamily: mono,
      textAlign: "right" as const,
    },
    divider,
    chipFg: gold,
    chipBorder: "rgba(201,183,135,0.30)",
    chipBg: "rgba(201,183,135,0.06)",
    chipOkFg: "#7fb893",
    chipWarnFg: "#d4a853",
  };
}

/**
 * Cream / editorial theme — used by carlota-jo's consulting landing where
 * the host palette is light cream + warm gold rather than the dark default.
 */
export function makeCreamGoldTheme(): PanelTheme {
  const bg = "var(--color-cream-warm, #f9f7f3)";
  const cardBg = "var(--color-cream-light, #faf6ee)";
  const ink = "var(--color-ink-900, #1c1a17)";
  const inkBody = "var(--color-ink-600, #5e5a52)";
  const inkMuted = "var(--color-stone-500, #8c8678)";
  const gold = "var(--color-gold, #9a7d52)";
  const divider = "var(--color-stone-200, rgba(0,0,0,0.08))";
  const mono =
    "'JetBrains Mono', 'SF Mono', ui-monospace, monospace";
  const sans =
    "'Inter', system-ui, -apple-system, sans-serif";

  return {
    section: {
      padding: "80px 24px",
      borderTop: `1px solid ${divider}`,
      background: bg,
    },
    card: {
      background: cardBg,
      border: `1px solid ${divider}`,
      padding: 24,
      borderRadius: 4,
    },
    kicker: {
      margin: 0,
      fontFamily: mono,
      fontSize: 10,
      letterSpacing: "0.18em",
      color: gold,
      textTransform: "uppercase" as const,
      fontWeight: 600,
    },
    heading: {
      margin: 0,
      fontSize: 15,
      fontWeight: 600,
      color: ink,
      letterSpacing: "-0.005em",
      fontFamily: sans,
    },
    subtle: { margin: 0, fontSize: 13, color: inkBody, fontFamily: sans },
    rowLabel: {
      fontSize: 11,
      color: inkMuted,
      letterSpacing: "0.04em",
      textTransform: "uppercase" as const,
      fontFamily: mono,
    },
    rowValue: {
      fontSize: 12,
      color: ink,
      textAlign: "right" as const,
      fontFamily: sans,
    },
    rowMono: {
      fontSize: 11,
      color: ink,
      fontFamily: mono,
      textAlign: "right" as const,
    },
    divider,
    chipFg: gold,
    chipBorder: "var(--color-gold-border, rgba(154,125,82,0.2))",
    chipBg: "var(--color-gold-dim, rgba(154,125,82,0.08))",
    chipOkFg: "var(--color-emerald-700, #2f6b4f)",
    chipWarnFg: "var(--color-amber-700, #a06a14)",
  };
}
