import { useState } from "react";
import { useLocation } from "wouter";
import {
  AEEP_NAV_ITEMS,
  AppShell,
  AuditTrailList,
  EvidencePanel,
  MetricStat,
  MetricStatGrid,
  PageHeader,
  SectionPanel,
  StatusBadge,
  Timeline,
  useScreenMode,
  type AuditEntry,
  type NavItem,
  type TimelineEvent,
} from "@szl-holdings/design-system";

const NAV_ROUTES: Record<string, string> = {
  overview: "/aeep",
  operations: "/aeep/operations",
  search: "/aeep/search",
  workflows: "/aeep/workflows",
  evidence: "/aeep/evidence",
  memory: "/aeep/memory",
  reports: "/aeep/reports",
  admin: "/aeep/admin",
};

const NAV_BADGES: Record<string, string | number> = {
  workflows: 7,
  evidence: 142,
};

const PROOF_ENVELOPE = {
  traceId: "trace_aeep_2026-04-21_a8f3c2",
  sources: [
    {
      sourceId: "ledger:run_4821",
      title: "Portfolio NAV reconciliation Q1 2026",
      sourceUri: "ledger://runs/4821/output",
      score: 0.94,
      retrievalPath: "covenant-policy → evidence-ledger",
    },
    {
      sourceId: "doc:lp_letter_drafts",
      title: "LP letter draft — Apr 2026",
      sourceUri: "memory://docs/lp_letter_drafts.md",
      score: 0.81,
      retrievalPath: "semantic-hybrid",
    },
    {
      sourceId: "policy:tier-2-approval",
      title: "Tier-2 disbursement policy",
      sourceUri: "policy://covenant/tier-2.yaml",
      score: 0.76,
      retrievalPath: "policy-guard",
    },
  ],
  policyChecks: [
    { policyId: "covenant.tier-2", verdict: "requires-approval" as const, reason: "amount > $250k" },
    { policyId: "freshness.nav", verdict: "allowed" as const, reason: "snapshot < 12h" },
    { policyId: "audit.actor-role", verdict: "allowed" as const },
  ],
  toolsUsed: ["evidence-ledger", "covenant-policy", "monte-carlo", "graphql-client"],
  approvalStatus: "pending" as const,
  approvalReason: "Awaiting CFO sign-off — disbursement above Tier-2 threshold.",
};

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "evt_1",
    label: "NAV snapshot ingested",
    description: "Custodian feed reconciled across 14 funds.",
    status: "complete",
    timestamp: "08:42",
    duration: "1.2s",
  },
  {
    id: "evt_2",
    label: "Capital call drafted",
    description: "Auto-generated draft for Vessels Fund III.",
    status: "complete",
    timestamp: "08:44",
    duration: "3.8s",
    traceId: "trace_aeep_2026-04-21_a8f3c2",
  },
  {
    id: "evt_3",
    label: "Tier-2 policy invoked",
    description: "Disbursement amount exceeded $250k threshold.",
    status: "approval-required",
    timestamp: "08:45",
  },
  {
    id: "evt_4",
    label: "Awaiting CFO approval",
    status: "pending",
    timestamp: "—",
  },
];

const AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: "audit_1",
    action: "approve.disbursement",
    actor: "M. Chen",
    actorRole: "CFO",
    resourceType: "disbursement",
    resourceId: "4783",
    timestamp: "08:21",
    policyResult: "allowed",
    traceId: "trace_d_4783",
  },
  {
    id: "audit_2",
    action: "override.freshness",
    actor: "S. Park",
    actorRole: "Ops Lead",
    resourceType: "report",
    resourceId: "lp-q1",
    timestamp: "07:58",
    policyResult: "override",
    traceId: "trace_r_lpq1",
  },
  {
    id: "audit_3",
    action: "block.export",
    actor: "agent:exporter",
    actorRole: "service",
    resourceType: "dataset",
    resourceId: "lp-roster",
    timestamp: "07:43",
    policyResult: "blocked",
    traceId: "trace_x_9921",
  },
];

function ScreenModeToggle() {
  const { mode, setScreenMode } = useScreenMode();
  return (
    <div
      style={{
        display: "inline-flex",
        background: "hsla(0,0%,100%,0.04)",
        border: "1px solid hsla(0,0%,100%,0.08)",
        borderRadius: "6px",
        padding: "2px",
        height: "30px",
      }}
    >
      {(["executive", "operator"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setScreenMode(m)}
          style={{
            padding: "0 10px",
            fontSize: "11px",
            fontWeight: 500,
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
            textTransform: "capitalize",
            background: mode === m ? "hsla(0,0%,100%,0.10)" : "transparent",
            color: mode === m ? "hsl(38,8%,92%)" : "hsl(214,7%,60%)",
          }}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

export default function AeepCommandPage() {
  const [location, setLocation] = useLocation();
  const { isExecutive, isOperator } = useScreenMode();
  const [showInspector, setShowInspector] = useState(true);

  const activeId =
    Object.entries(NAV_ROUTES).find(([, href]) =>
      href === "/aeep" ? location === "/aeep" || location === "/aeep/" : location.startsWith(href),
    )?.[0] ?? "overview";

  const navItems: NavItem[] = AEEP_NAV_ITEMS.map((item) => ({
    ...item,
    href: NAV_ROUTES[item.id] ?? item.href,
    badge: NAV_BADGES[item.id],
  }));

  const navOverride = (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "0 8px" }}>
      {navItems.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setLocation(item.href)}
            style={{
              height: "34px",
              display: "flex",
              alignItems: "center",
              padding: "0 8px",
              border: "none",
              cursor: "pointer",
              borderRadius: "4px",
              fontSize: "13px",
              textAlign: "left",
              background: active ? "hsla(0,0%,100%,0.08)" : "transparent",
              color: active ? "hsl(38,8%,92%)" : "hsl(214,7%,68%)",
            }}
          >
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge !== undefined && (
              <span
                style={{
                  fontSize: "10px",
                  background: "hsla(0,0%,100%,0.08)",
                  color: "hsl(214,7%,68%)",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  minWidth: "20px",
                  textAlign: "center",
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const inspector = showInspector ? (
    <div>
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid hsla(0,0%,100%,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,8%,92%)" }}>
          Proof Envelope
        </span>
        <button
          type="button"
          onClick={() => setShowInspector(false)}
          style={{
            background: "transparent",
            border: "none",
            color: "hsl(214,7%,55%)",
            cursor: "pointer",
            fontSize: "14px",
          }}
          aria-label="Hide inspector"
        >
          ×
        </button>
      </div>
      <EvidencePanel {...PROOF_ENVELOPE} />
    </div>
  ) : null;

  return (
    <AppShell
      navItems={navItems}
      activeNavItem={activeId}
      nav={navOverride}
      tenantLabel="SZL Holdings · prod"
      topBarRight={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ScreenModeToggle />
          {!showInspector && (
            <button
              type="button"
              onClick={() => setShowInspector(true)}
              style={{
                height: "30px",
                padding: "0 10px",
                background: "hsla(0,0%,100%,0.04)",
                border: "1px solid hsla(0,0%,100%,0.08)",
                borderRadius: "6px",
                color: "hsl(214,7%,68%)",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Show evidence
            </button>
          )}
        </div>
      }
      rightInspector={inspector}
    >
      <PageHeader
        title="Governed Intelligence — Overview"
        subtitle={
          isExecutive
            ? "Top risks, approvals, and capital posture across SZL Holdings."
            : "Active runs, freshness signals, and policy verdicts across the fleet."
        }
        badge={<StatusBadge variant="active" label="Live" />}
        meta={[
          { label: "Tenant", value: "SZL Holdings" },
          { label: "Mode", value: isOperator ? "Operator" : "Executive" },
          { label: "Refreshed", value: "08:46 UTC" },
        ]}
      />

      <MetricStatGrid className="mb-6">
        <MetricStat
          label="Open approvals"
          value={7}
          delta="+2 vs yesterday"
          trend="up"
          deltaPositive={false}
        />
        <MetricStat
          label="Active runs"
          value={23}
          delta="-4"
          trend="down"
          deltaPositive
          unit="runs"
        />
        <MetricStat
          label="Avg confidence"
          value="0.91"
          delta="+0.03"
          trend="up"
          deltaPositive
          footnote="hybrid retrieval"
        />
        <MetricStat
          label="Freshness"
          value="98%"
          delta="stable"
          trend="flat"
          footnote="< 12h snapshots"
        />
        <MetricStat
          label="Policy blocks (24h)"
          value={3}
          delta="+1"
          trend="up"
          deltaPositive={false}
        />
        <MetricStat
          label="NAV reconciled"
          value="$1.84B"
          delta="+1.2%"
          trend="up"
          deltaPositive
        />
      </MetricStatGrid>

      <div
        className="mb-6"
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: isExecutive ? "1fr" : "minmax(0, 1.4fr) minmax(0, 1fr)",
        }}
      >
        <SectionPanel
          title="Active workflow"
          subtitle="Vessels Fund III · capital call draft"
          actions={<StatusBadge variant="pending" label="Approval required" />}
        >
          <Timeline events={isExecutive ? TIMELINE_EVENTS.slice(-3) : TIMELINE_EVENTS} />
        </SectionPanel>

        <SectionPanel
          title="Recent audit trail"
          subtitle={isOperator ? "Last 24h · all actors" : "Last 24h"}
          actions={<StatusBadge variant="info" label={`${AUDIT_ENTRIES.length} entries`} />}
          noPadding
        >
          <AuditTrailList
            entries={isExecutive ? AUDIT_ENTRIES.slice(0, 2) : AUDIT_ENTRIES}
          />
        </SectionPanel>
      </div>

      <SectionPanel
        title="Pending approvals"
        subtitle="Items awaiting tier-2 sign-off"
        actions={
          <div style={{ display: "flex", gap: "6px" }}>
            <StatusBadge variant="pending" label="2 pending" />
            <StatusBadge variant="escalated" label="1 escalated" />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            {
              id: "appr_1",
              label: "Vessels Fund III — capital call $312k",
              actor: "drafted by agent:fund-ops",
              status: "pending" as const,
              statusLabel: "Awaiting CFO",
            },
            {
              id: "appr_2",
              label: "Terra — NAV restatement Q1",
              actor: "drafted by agent:terra-nav",
              status: "pending" as const,
              statusLabel: "Awaiting Controller",
            },
            {
              id: "appr_3",
              label: "Aegis — LP exception override",
              actor: "drafted by S. Park",
              status: "escalated" as const,
              statusLabel: "Escalated to Risk",
            },
          ].map((row) => (
            <div
              key={row.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                border: "1px solid hsla(0,0%,100%,0.06)",
                borderRadius: "6px",
                background: "hsla(0,0%,100%,0.02)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "13px", color: "hsl(38,8%,92%)" }}>{row.label}</span>
                <span style={{ fontSize: "11px", color: "hsl(214,7%,55%)" }}>{row.actor}</span>
              </div>
              <StatusBadge variant={row.status} label={row.statusLabel} />
            </div>
          ))}
        </div>
      </SectionPanel>
    </AppShell>
  );
}
