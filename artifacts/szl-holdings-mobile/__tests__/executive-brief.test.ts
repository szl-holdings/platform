/**
 * End-to-end logic tests for the Executive Brief screen.
 *
 * Imports the production logic module used at runtime by
 * `app/(shell)/intelligence/executive-brief.tsx`.
 */
import {
  ENDPOINTS,
  healthColor,
  riskColor,
  confidenceColor,
  confidenceLabel,
  filterAlertsBySeverity,
  buildPulseWebUrl,
} from "../app/(shell)/intelligence/executive-brief.logic";

describe("executive-brief endpoints", () => {
  it("fetches the cross-domain briefing from /api/briefings", () => {
    expect(ENDPOINTS.briefing).toBe("/api/briefings");
  });

  it("fetches the daily pulse brief from /api/pulse/today", () => {
    expect(ENDPOINTS.pulseToday).toBe("/api/pulse/today");
  });
});

describe("executive-brief health color scale", () => {
  it("shows green when health is strong (>= 0.8)", () => {
    expect(healthColor(0.8)).toBe("#22c55e");
    expect(healthColor(0.95)).toBe("#22c55e");
  });

  it("shows amber when health is borderline (0.5-0.8)", () => {
    expect(healthColor(0.5)).toBe("#f59e0b");
    expect(healthColor(0.79)).toBe("#f59e0b");
  });

  it("shows red when health is poor (< 0.5)", () => {
    expect(healthColor(0.49)).toBe("#ef4444");
    expect(healthColor(0)).toBe("#ef4444");
  });
});

describe("executive-brief risk color scale", () => {
  it("maps CRITICAL to red", () => {
    expect(riskColor("CRITICAL")).toBe("#ef4444");
  });
  it("maps HIGH to orange and MEDIUM to amber", () => {
    expect(riskColor("HIGH")).toBe("#f97316");
    expect(riskColor("MEDIUM")).toBe("#f59e0b");
  });
  it("falls back to green for unknown or LOW risk", () => {
    expect(riskColor("LOW")).toBe("#22c55e");
    expect(riskColor("")).toBe("#22c55e");
    expect(riskColor("UNKNOWN")).toBe("#22c55e");
  });
});

describe("executive-brief confidence scale", () => {
  it("labels >= 0.75 as HC (high confidence) in green", () => {
    expect(confidenceLabel(0.9)).toBe("HC");
    expect(confidenceColor(0.9)).toBe("#22c55e");
  });

  it("labels 0.5-0.75 as MC (medium) in accent gold", () => {
    expect(confidenceLabel(0.5)).toBe("MC");
    expect(confidenceLabel(0.74)).toBe("MC");
    expect(confidenceColor(0.6)).toBe("#c9a84c");
  });

  it("labels < 0.5 as LC (low confidence) in red", () => {
    expect(confidenceLabel(0.3)).toBe("LC");
    expect(confidenceColor(0.3)).toBe("#ef4444");
  });
});

describe("executive-brief alert filtering", () => {
  const alerts = [
    { severity: "critical" as const, domain: "vessels", message: "m1" },
    { severity: "warning" as const, domain: "sentra", message: "m2" },
    { severity: "critical" as const, domain: "terra", message: "m3" },
    { severity: "info" as const, domain: "pulse", message: "m4" },
  ];

  it("separates critical alerts for the top-of-brief callout", () => {
    const critical = filterAlertsBySeverity(alerts, "critical");
    expect(critical.map((a) => a.domain)).toEqual(["vessels", "terra"]);
  });

  it("separates warning alerts for the secondary callout", () => {
    const warning = filterAlertsBySeverity(alerts, "warning");
    expect(warning.map((a) => a.domain)).toEqual(["sentra"]);
  });
});

describe("executive-brief full-brief web link", () => {
  it("strips /api suffix and points to /pulse/", () => {
    expect(buildPulseWebUrl("https://app.example.com/api")).toBe("https://app.example.com/pulse/");
    expect(buildPulseWebUrl("https://app.example.com/api/")).toBe("https://app.example.com/pulse/");
  });

  it("appends /pulse/ to a bare origin", () => {
    expect(buildPulseWebUrl("https://app.example.com")).toBe("https://app.example.com/pulse/");
  });

  it("falls back to a relative URL when no API base is configured", () => {
    expect(buildPulseWebUrl(null)).toBe("/pulse/");
    expect(buildPulseWebUrl("")).toBe("/pulse/");
    expect(buildPulseWebUrl(undefined)).toBe("/pulse/");
  });
});
