export const CONSENT_VERSION = "2.0";
const STORAGE_KEY = "szl-consent-v2";

export interface ConsentCategories {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export interface ConsentState extends ConsentCategories {
  version: string;
  timestamp: number;
  decided: boolean;
}

const DEFAULT_CONSENT: ConsentState = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
  version: CONSENT_VERSION,
  timestamp: 0,
  decided: false,
};

let _listeners: Array<(state: ConsentState) => void> = [];
let _state: ConsentState = { ...DEFAULT_CONSENT };

function load(): ConsentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONSENT };
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.version !== CONSENT_VERSION) {
      return { ...DEFAULT_CONSENT };
    }
    return {
      essential: true,
      analytics: parsed.analytics ?? false,
      marketing: parsed.marketing ?? false,
      functional: parsed.functional ?? false,
      version: CONSENT_VERSION,
      timestamp: parsed.timestamp ?? 0,
      decided: parsed.decided ?? false,
    };
  } catch {
    return { ...DEFAULT_CONSENT };
  }
}

function save(state: ConsentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function initConsent(): ConsentState {
  _state = load();
  return _state;
}

export function getConsent(): ConsentState {
  return _state;
}

export function setConsent(categories: Partial<ConsentCategories>, action: "granted" | "declined" | "updated"): ConsentState {
  _state = {
    essential: true,
    analytics: categories.analytics ?? _state.analytics,
    marketing: categories.marketing ?? _state.marketing,
    functional: categories.functional ?? _state.functional,
    version: CONSENT_VERSION,
    timestamp: Date.now(),
    decided: true,
  };
  save(_state);
  notifyListeners();
  logConsentToServer(_state, action);
  return _state;
}

export function acceptAll(): ConsentState {
  return setConsent({ analytics: true, marketing: true, functional: true }, "granted");
}

export function declineAll(): ConsentState {
  return setConsent({ analytics: false, marketing: false, functional: false }, "declined");
}

export function onConsentChange(fn: (state: ConsentState) => void): () => void {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

function notifyListeners(): void {
  for (const fn of _listeners) {
    try { fn(_state); } catch {}
  }
}

function getSessionId(): string | undefined {
  try {
    return sessionStorage.getItem("szl-session-id") ?? undefined;
  } catch {
    return undefined;
  }
}

async function logConsentToServer(state: ConsentState, action: string): Promise<void> {
  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    await fetch(`${baseUrl}/api/analytics/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        consentVersion: state.version,
        essential: state.essential,
        analytics: state.analytics,
        marketing: state.marketing,
        functional: state.functional,
        action,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }),
    });
  } catch {}
}
