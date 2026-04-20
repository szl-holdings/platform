/**
 * End-to-end logic tests for the Secure Quick Actions screen.
 *
 * Imports the production logic module used at runtime by
 * `app/(shell)/intelligence/secure-quick-actions.tsx` — particularly
 * `executeSecureActionFlow`, which is the exact code path the screen's
 * mutation uses (biometric gate, then Guardian approvals POST).
 */
import {
  ACTION_TEMPLATES,
  GUARDIAN_APPROVALS_PATH,
  RECENT_ACTIVITY_PATH,
  buildGuardianSubmitBody,
  executeSecureActionFlow,
  type ActionTemplate,
} from "../app/(shell)/intelligence/secure-quick-actions.logic";

function biometricTemplate(): ActionTemplate {
  const t = ACTION_TEMPLATES.find((x) => x.requiresBiometric);
  if (!t) throw new Error("Expected at least one biometric template");
  return t;
}

function nonBiometricTemplate(): ActionTemplate {
  const t = ACTION_TEMPLATES.find((x) => !x.requiresBiometric);
  if (!t) throw new Error("Expected at least one non-biometric template");
  return t;
}

describe("secure-quick-actions template catalog", () => {
  it("ships a fixed set of guardian-scoped action templates", () => {
    const ids = ACTION_TEMPLATES.map((t) => t.id).sort();
    expect(ids).toEqual([
      "escalate-approval",
      "flag-entity",
      "freeze-action",
      "request-brief",
      "rollback-request",
      "suspend-agent",
    ]);
  });

  it("has at least one biometric-gated and one non-biometric template", () => {
    expect(ACTION_TEMPLATES.some((t) => t.requiresBiometric)).toBe(true);
    expect(ACTION_TEMPLATES.some((t) => !t.requiresBiometric)).toBe(true);
  });

  it("marks critical-priority templates as biometric-required", () => {
    const critical = ACTION_TEMPLATES.filter((t) => t.priority === "critical");
    expect(critical.length).toBeGreaterThan(0);
    for (const t of critical) {
      expect(t.requiresBiometric).toBe(true);
    }
  });
});

describe("secure-quick-actions endpoints", () => {
  it("submits to the Guardian approvals endpoint", () => {
    expect(GUARDIAN_APPROVALS_PATH).toBe("/api/approvals");
  });
  it("loads recent activity from the approvals feed", () => {
    expect(RECENT_ACTIVITY_PATH).toBe("/api/approvals?status=all&limit=10");
  });
});

describe("buildGuardianSubmitBody", () => {
  it("emits the full Guardian payload shape with rollbackPoint and initiatedFrom", () => {
    const template = biometricTemplate();
    const body = buildGuardianSubmitBody(template, "APR-123", "manual override", "2026-04-20T12:00:00.000Z");
    expect(body).toEqual({
      resourceType: template.resourceType,
      resourceId: "APR-123",
      title: template.title,
      description: "manual override",
      actionClass: template.actionClass,
      priority: template.priority,
      payload: {
        templateId: template.id,
        domain: template.domain,
        requiresBiometric: template.requiresBiometric,
        rollbackPoint: "2026-04-20T12:00:00.000Z",
        initiatedFrom: "mobile:secure-quick-actions",
      },
    });
  });

  it("falls back to the template description when no custom description is supplied", () => {
    const template = nonBiometricTemplate();
    const body = buildGuardianSubmitBody(template, "R-1", "");
    expect(body.description).toBe(template.description);
  });
});

describe("executeSecureActionFlow — biometric happy path", () => {
  it("prompts for biometrics then POSTs the guardian payload", async () => {
    const template = biometricTemplate();
    const biometric = jest.fn().mockResolvedValue(true);
    const api = jest.fn().mockResolvedValue({ id: 999 });

    const res = await executeSecureActionFlow(
      template,
      "APR-42",
      "needs senior review",
      biometric,
      api,
      "2026-04-20T12:00:00.000Z",
    );

    expect(biometric).toHaveBeenCalledTimes(1);
    expect(biometric).toHaveBeenCalledWith("Confirm guardian-scoped action");
    expect(api).toHaveBeenCalledTimes(1);

    const [path, init] = api.mock.calls[0] as [string, { method: string; body: string }];
    expect(path).toBe("/api/approvals");
    expect(init.method).toBe("POST");

    const parsed = JSON.parse(init.body);
    expect(parsed.resourceType).toBe(template.resourceType);
    expect(parsed.resourceId).toBe("APR-42");
    expect(parsed.payload.initiatedFrom).toBe("mobile:secure-quick-actions");
    expect(parsed.payload.rollbackPoint).toBe("2026-04-20T12:00:00.000Z");
    expect(parsed.payload.templateId).toBe(template.id);
    expect(res).toEqual({ id: 999 });
  });
});

describe("executeSecureActionFlow — biometric rejection", () => {
  it("short-circuits when the user cancels the biometric prompt", async () => {
    const template = biometricTemplate();
    const biometric = jest.fn().mockResolvedValue(false);
    const api = jest.fn();

    await expect(
      executeSecureActionFlow(template, "APR-42", "x", biometric, api),
    ).rejects.toThrow(/biometric/i);

    expect(biometric).toHaveBeenCalledTimes(1);
    expect(api).not.toHaveBeenCalled();
  });
});

describe("executeSecureActionFlow — non-biometric template", () => {
  it("submits without prompting when the template does not require biometrics", async () => {
    const template = nonBiometricTemplate();
    const biometric = jest.fn();
    const api = jest.fn().mockResolvedValue({ ok: true });

    await executeSecureActionFlow(template, "BRF-1", "urgent", biometric, api);

    expect(biometric).not.toHaveBeenCalled();
    expect(api).toHaveBeenCalledTimes(1);
    const [, init] = api.mock.calls[0] as [string, { body: string }];
    expect(JSON.parse(init.body).payload.requiresBiometric).toBe(false);
  });
});

describe("executeSecureActionFlow — input validation", () => {
  it("rejects missing resourceId before any network call", async () => {
    const template = nonBiometricTemplate();
    const api = jest.fn();
    await expect(
      executeSecureActionFlow(template, "   ", "x", jest.fn(), api),
    ).rejects.toThrow(/resourceId/);
    expect(api).not.toHaveBeenCalled();
  });

  it("surfaces network failures from apiFetch as-is", async () => {
    const template = nonBiometricTemplate();
    const api = jest.fn().mockRejectedValue(new Error("Network error"));
    await expect(
      executeSecureActionFlow(template, "BRF-1", "x", jest.fn(), api),
    ).rejects.toThrow("Network error");
  });
});
