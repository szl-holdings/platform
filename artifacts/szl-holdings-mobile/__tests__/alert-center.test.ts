/**
 * End-to-end logic tests for the Alert Center screen.
 *
 * Imports the production logic module used at runtime by
 * `app/(shell)/intelligence/alert-center.tsx` so regressions in endpoints,
 * severity filtering, stale-domain synthesis, or tab badge math break these
 * tests immediately.
 */
import {
  ENDPOINTS,
  SEV_COLORS,
  filterCriticalSignals,
  normalizeApprovals,
  synthesizeStaleDomainAlerts,
  computeTabBadges,
  type FusionSignalLike,
  type ApprovalLike,
  type BriefingResponseLike,
} from "../app/(shell)/intelligence/alert-center.logic";

describe("alert-center endpoints", () => {
  it("pulls signals from the cortex intelligence feed", () => {
    expect(ENDPOINTS.signals).toBe("/api/cortex/intelligence-feed");
  });

  it("restricts the escalations tab to status=escalated", () => {
    expect(ENDPOINTS.escalations).toBe("/api/approvals?status=escalated");
  });

  it("uses the cross-domain briefing endpoint for the world-model tab", () => {
    expect(ENDPOINTS.briefing).toBe("/api/briefings");
  });
});

describe("alert-center signal filtering", () => {
  const signals: FusionSignalLike[] = [
    { id: "s1", severity: "critical" },
    { id: "s2", severity: "high" },
    { id: "s3", severity: "medium" },
    { id: "s4", severity: "low" },
    { id: "s5", severity: "info" },
    { id: "s6", severity: "critical" },
  ];

  it("returns only critical and high signals for the top of the Signals tab", () => {
    const result = filterCriticalSignals(signals);
    expect(result.map((s) => s.id)).toEqual(["s1", "s2", "s6"]);
  });

  it("returns an empty list when nothing is urgent (empty-state UI)", () => {
    const quiet = signals.filter((s) => s.severity === "low" || s.severity === "info");
    expect(filterCriticalSignals(quiet)).toEqual([]);
  });
});

describe("alert-center response normalization", () => {
  it("unwraps { data: [...] } envelope from approvals endpoint", () => {
    const items = [{ id: 1, status: "escalated", priority: "high" }];
    expect(normalizeApprovals<ApprovalLike>({ data: items })).toEqual(items);
  });

  it("passes through plain array responses", () => {
    const items = [{ id: 5, status: "escalated", priority: "critical" }] as ApprovalLike[];
    expect(normalizeApprovals<ApprovalLike>(items)).toBe(items);
  });

  it("treats undefined/missing data as empty", () => {
    expect(normalizeApprovals<ApprovalLike>(undefined)).toEqual([]);
  });
});

describe("alert-center stale-domain synthesis", () => {
  const brief: BriefingResponseLike = {
    domains: [
      { domain: "vessels", healthScore: 0.9, staleFraction: 0.1 },
      { domain: "sentra", healthScore: 0.55, staleFraction: 0.4 },
      { domain: "terra", healthScore: 0.2, staleFraction: 0.8 },
    ],
    alerts: [],
  };

  it("emits an alert for each domain whose stale fraction exceeds 30%", () => {
    const alerts = synthesizeStaleDomainAlerts(brief);
    expect(alerts).toHaveLength(2);
    expect(alerts.map((a) => a.domain)).toEqual(["sentra", "terra"]);
  });

  it("escalates to critical when stale fraction exceeds 70%", () => {
    const alerts = synthesizeStaleDomainAlerts(brief);
    expect(alerts.find((a) => a.domain === "terra")?.severity).toBe("critical");
    expect(alerts.find((a) => a.domain === "sentra")?.severity).toBe("warning");
  });

  it("includes the stale percentage and health score in the human message", () => {
    const alerts = synthesizeStaleDomainAlerts(brief);
    const terraMsg = alerts.find((a) => a.domain === "terra")?.message ?? "";
    expect(terraMsg).toContain("80%");
    expect(terraMsg).toContain("20%");
  });

  it("returns empty when briefing is unavailable (error state)", () => {
    expect(synthesizeStaleDomainAlerts(undefined)).toEqual([]);
  });
});

describe("alert-center tab badge counts", () => {
  it("counts critical/high signals, escalations, and critical world-model alerts", () => {
    const badges = computeTabBadges(
      [{ id: "a", severity: "critical" }, { id: "b", severity: "high" }],
      [{ id: 1, status: "escalated", priority: "high" }] as ApprovalLike[],
      [
        { severity: "critical" },
        { severity: "critical" },
        { severity: "warning" },
        { severity: "info" },
      ],
    );
    expect(badges).toEqual({ signals: 2, escalations: 1, worldModel: 2 });
  });

  it("reports zeros when everything is quiet", () => {
    expect(computeTabBadges([], [], [])).toEqual({ signals: 0, escalations: 0, worldModel: 0 });
  });
});

describe("alert-center severity palette", () => {
  it("distinguishes the five severity tiers with unique colors", () => {
    const values = Object.values(SEV_COLORS);
    expect(new Set(values).size).toBe(5);
    expect(SEV_COLORS.critical).toBe("#ef4444");
    expect(SEV_COLORS.info).toBe("#6b7280");
  });
});
