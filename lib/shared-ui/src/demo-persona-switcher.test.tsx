// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import {
  DEMO_PERSONAS,
  DemoPersonaProvider,
  DemoPersonaSwitcher,
  PersonaPermissionGate,
  useDemoPersona,
} from "./demo-persona-switcher";

const PERSONA_KEY = "szl-demo-persona";
const ACTIVE_KEY = "szl-demo-mode-active";

beforeEach(() => {
  window.localStorage.clear();
});

function GatedExecuteButton() {
  return (
    <PersonaPermissionGate permission="canExecute" fallback={<span data-testid="gated-locked">locked</span>}>
      <button data-testid="gated-action">Execute</button>
    </PersonaPermissionGate>
  );
}

function ActivePersonaProbe() {
  const { persona, permissions } = useDemoPersona();
  return (
    <div>
      <span data-testid="probe-id">{persona.id}</span>
      <span data-testid="probe-execute">{permissions.canExecute ? "yes" : "no"}</span>
    </div>
  );
}

describe("DemoPersonaSwitcher", () => {
  it("hides itself when demo mode is not active", () => {
    render(
      <DemoPersonaProvider>
        <DemoPersonaSwitcher />
      </DemoPersonaProvider>,
    );
    expect(screen.queryByTestId("demo-persona-switcher")).toBeNull();
  });

  it("renders with all six personas when demo mode is active", () => {
    window.localStorage.setItem(ACTIVE_KEY, "true");
    render(
      <DemoPersonaProvider>
        <DemoPersonaSwitcher />
      </DemoPersonaProvider>,
    );
    const toolbar = screen.getByTestId("demo-persona-switcher");
    expect(toolbar).toBeTruthy();
    DEMO_PERSONAS.forEach((p) => {
      expect(within(toolbar).getByTestId(`demo-persona-card-${p.id}`)).toBeTruthy();
    });
  });

  it("switches persona on click, updates gated UI without reload, and persists to localStorage", () => {
    window.localStorage.setItem(ACTIVE_KEY, "true");
    render(
      <DemoPersonaProvider>
        <DemoPersonaSwitcher />
        <GatedExecuteButton />
        <ActivePersonaProbe />
      </DemoPersonaProvider>,
    );

    // Default persona is the first one (cfo-exec, executive — canExecute: false).
    expect(screen.getByTestId("probe-id").textContent).toBe("cfo-exec");
    expect(screen.getByTestId("probe-execute").textContent).toBe("no");
    expect(screen.queryByTestId("gated-action")).toBeNull();
    expect(screen.getByTestId("gated-locked")).toBeTruthy();

    // Click the SOC analyst card (canExecute: true).
    act(() => {
      fireEvent.click(screen.getByTestId("demo-persona-card-soc-analyst"));
    });

    expect(screen.getByTestId("probe-id").textContent).toBe("soc-analyst");
    expect(screen.getByTestId("probe-execute").textContent).toBe("yes");
    // Gated UI updated immediately (no reload).
    expect(screen.getByTestId("gated-action")).toBeTruthy();
    expect(screen.queryByTestId("gated-locked")).toBeNull();

    // Persisted across reloads via localStorage.
    expect(window.localStorage.getItem(PERSONA_KEY)).toBe("soc-analyst");
  });

  it("uses a separate active-flag storage key from the legacy demo-mode role key", () => {
    // Legacy demo-mode stores role strings under "szl-demo-mode" — make sure
    // the persona switcher does not key off that.
    window.localStorage.setItem("szl-demo-mode", "executive");
    render(
      <DemoPersonaProvider>
        <DemoPersonaSwitcher />
      </DemoPersonaProvider>,
    );
    expect(screen.queryByTestId("demo-persona-switcher")).toBeNull();
  });

  it("activates demo mode via ?demo=1 URL parameter", () => {
    const original = window.location.href;
    window.history.replaceState({}, "", "/?demo=1");
    try {
      render(
        <DemoPersonaProvider>
          <DemoPersonaSwitcher />
        </DemoPersonaProvider>,
      );
      expect(screen.getByTestId("demo-persona-switcher")).toBeTruthy();
      expect(window.localStorage.getItem(ACTIVE_KEY)).toBe("true");
    } finally {
      window.history.replaceState({}, "", original);
    }
  });
});
