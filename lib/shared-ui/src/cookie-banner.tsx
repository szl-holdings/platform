import React, { useState, useEffect, useCallback } from "react";

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

export type CookieConsentState = "accepted" | "declined" | null;

const DEFAULT_CONSENT: ConsentState = {
  essential: true,
  analytics: false,
  marketing: false,
  functional: false,
  version: CONSENT_VERSION,
  timestamp: 0,
  decided: false,
};

let _globalState: ConsentState = { ...DEFAULT_CONSENT };
let _listeners: Array<(s: ConsentState) => void> = [];

function loadConsent(): ConsentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONSENT };
    const p = JSON.parse(raw) as Partial<ConsentState>;
    if (p.version !== CONSENT_VERSION) return { ...DEFAULT_CONSENT };
    return { essential: true, analytics: !!p.analytics, marketing: !!p.marketing, functional: !!p.functional, version: CONSENT_VERSION, timestamp: p.timestamp ?? 0, decided: !!p.decided };
  } catch { return { ...DEFAULT_CONSENT }; }
}

function saveConsent(state: ConsentState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function notify(state: ConsentState): void {
  for (const fn of _listeners) { try { fn(state); } catch {} }
}

async function logConsentServer(state: ConsentState, action: string): Promise<void> {
  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    await fetch(`${baseUrl}/api/analytics/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentVersion: state.version, essential: state.essential, analytics: state.analytics, marketing: state.marketing, functional: state.functional, action, userAgent: navigator.userAgent }),
    });
  } catch {}
}

export function initConsentSystem(): ConsentState {
  _globalState = loadConsent();
  return _globalState;
}

export function getConsentState(): ConsentState {
  return _globalState;
}

export function onConsentChange(fn: (s: ConsentState) => void): () => void {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

function applyConsent(categories: Partial<ConsentCategories>, action: "granted" | "declined" | "updated"): ConsentState {
  _globalState = {
    essential: true,
    analytics: categories.analytics ?? _globalState.analytics,
    marketing: categories.marketing ?? _globalState.marketing,
    functional: categories.functional ?? _globalState.functional,
    version: CONSENT_VERSION,
    timestamp: Date.now(),
    decided: true,
  };
  saveConsent(_globalState);
  notify(_globalState);
  logConsentServer(_globalState, action);
  return _globalState;
}

export function useCookieConsent() {
  const [state, setState] = useState<ConsentState>(() => {
    if (typeof window === "undefined") return { ...DEFAULT_CONSENT };
    _globalState = loadConsent();
    return _globalState;
  });

  useEffect(() => {
    const unsub = onConsentChange(setState);
    return unsub;
  }, []);

  const acceptAll = useCallback(() => {
    const s = applyConsent({ analytics: true, marketing: true, functional: true }, "granted");
    setState(s);
  }, []);

  const declineAll = useCallback(() => {
    const s = applyConsent({ analytics: false, marketing: false, functional: false }, "declined");
    setState(s);
  }, []);

  const updateCategories = useCallback((cats: Partial<ConsentCategories>) => {
    const s = applyConsent(cats, "updated");
    setState(s);
  }, []);

  const consent: CookieConsentState = state.decided ? (state.analytics ? "accepted" : "declined") : null;

  return { state, consent, acceptAll, declineAll, updateCategories };
}

export interface CookieBannerProps {
  privacyUrl?: string;
  accentColor?: string;
}

const CATEGORY_LABELS: Record<keyof ConsentCategories, { label: string; description: string; required?: boolean }> = {
  essential: { label: "Essential", description: "Required for the site to function. Cannot be disabled.", required: true },
  analytics: { label: "Analytics", description: "Helps us understand how visitors use the site so we can improve it." },
  marketing: { label: "Marketing", description: "Enables personalised content and targeted outreach." },
  functional: { label: "Functional", description: "Enables enhanced features like live chat and preference memory." },
};

export function CookieBanner({ privacyUrl = "/legal/privacy", accentColor = "#d4a054" }: CookieBannerProps) {
  const { state, acceptAll, declineAll, updateCategories } = useCookieConsent();
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [localCats, setLocalCats] = useState<ConsentCategories>({ essential: true, analytics: false, marketing: false, functional: false });

  const isDemo = typeof window !== "undefined" && window.location.search.includes("demo=true");

  useEffect(() => {
    if (!state.decided && !isDemo) {
      const t = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(t);
    }
    if (state.decided) setVisible(false);
    return undefined;
  }, [state.decided, isDemo]);

  useEffect(() => {
    setLocalCats({ essential: true, analytics: state.analytics, marketing: state.marketing, functional: state.functional });
  }, [state]);

  if (!visible) return null;

  if (showPreferences) {
    return (
      <div role="dialog" aria-label="Cookie preferences" style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
        <div style={{ background: "rgba(10,14,22,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem", maxWidth: "520px", width: "calc(100vw - 2rem)", padding: "2rem", boxShadow: "0 24px 80px rgba(0,0,0,0.7)", fontFamily: "Inter, system-ui, sans-serif" }}>
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 700, color: "#e8e4de" }}>Cookie Preferences</h2>
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            Choose which cookies you allow. Essential cookies are always active.{" "}
            <a href={privacyUrl} style={{ color: accentColor, textDecoration: "underline" }}>Privacy Policy</a>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
            {(Object.keys(CATEGORY_LABELS) as Array<keyof ConsentCategories>).map(cat => {
              const meta = CATEGORY_LABELS[cat];
              const checked = cat === "essential" ? true : localCats[cat];
              return (
                <div key={cat} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <input
                    type="checkbox"
                    id={`consent-${cat}`}
                    checked={checked}
                    disabled={meta.required}
                    onChange={e => setLocalCats(prev => ({ ...prev, [cat]: e.target.checked }))}
                    style={{ marginTop: "0.125rem", accentColor, cursor: meta.required ? "not-allowed" : "pointer" }}
                  />
                  <label htmlFor={`consent-${cat}`} style={{ flex: 1, cursor: meta.required ? "default" : "pointer" }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {meta.label}
                      {meta.required && <span style={{ fontSize: "0.625rem", background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44`, borderRadius: "0.25rem", padding: "0.1rem 0.4rem", fontWeight: 700 }}>Required</span>}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: "0.25rem" }}>{meta.description}</div>
                  </label>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button onClick={() => setShowPreferences(false)} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={() => { updateCategories(localCats); setVisible(false); setShowPreferences(false); }} style={{ padding: "0.5rem 1.25rem", background: `${accentColor}22`, border: `1px solid ${accentColor}55`, borderRadius: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: accentColor, cursor: "pointer" }}>
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-label="Cookie and privacy notice" style={{ position: "fixed", bottom: "1.25rem", left: "50%", transform: "translateX(-50%)", zIndex: 9999, maxWidth: "580px", width: "calc(100vw - 2rem)", background: "rgba(10,14,22,0.97)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "0.75rem", boxShadow: "0 8px 40px rgba(0,0,0,0.55)", padding: "1.25rem 1.5rem", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", animation: "cookie-slide-up 0.3s ease", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ marginBottom: "0.875rem" }}>
        <p style={{ margin: 0, fontSize: "0.8125rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
          We use cookies for essential site functionality and, with your consent, for analytics and personalization. We do not use advertising or third-party tracking cookies.{" "}
          <a href={privacyUrl} style={{ color: accentColor, textDecoration: "underline", textUnderlineOffset: "2px" }}>Privacy Policy</a>
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={declineAll} style={{ padding: "0.4rem 0.75rem", background: "transparent", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", cursor: "pointer" }}>
          Decline All
        </button>
        <button onClick={() => setShowPreferences(true)} style={{ padding: "0.4rem 0.875rem", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.65)", cursor: "pointer" }}>
          Manage Preferences
        </button>
        <button onClick={acceptAll} style={{ padding: "0.4rem 0.875rem", background: `${accentColor}22`, border: `1px solid ${accentColor}55`, borderRadius: "0.375rem", fontSize: "0.75rem", fontWeight: 600, color: accentColor, cursor: "pointer" }}>
          Accept All
        </button>
      </div>
      <style>{`@keyframes cookie-slide-up { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  );
}

export function ConsentPreferencesButton({ accentColor = "#d4a054", privacyUrl = "/legal/privacy" }: { accentColor?: string; privacyUrl?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", textDecoration: "underline", textUnderlineOffset: "2px", fontFamily: "inherit", padding: 0 }}>
        Cookie Preferences
      </button>
      {open && (
        <CookieConsentModal
          onClose={() => setOpen(false)}
          accentColor={accentColor}
          privacyUrl={privacyUrl}
        />
      )}
    </>
  );
}

export function CookieConsentModal({ onClose, accentColor = "#d4a054", privacyUrl = "/legal/privacy" }: { onClose: () => void; accentColor?: string; privacyUrl?: string }) {
  const { state, acceptAll, declineAll, updateCategories } = useCookieConsent();
  const [localCats, setLocalCats] = useState<ConsentCategories>({ essential: true, analytics: state.analytics, marketing: state.marketing, functional: state.functional });

  return (
    <div role="dialog" aria-label="Cookie preferences" style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "rgba(10,14,22,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1rem", maxWidth: "520px", width: "calc(100vw - 2rem)", padding: "2rem", boxShadow: "0 24px 80px rgba(0,0,0,0.7)", fontFamily: "Inter, system-ui, sans-serif" }}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 700, color: "#e8e4de" }}>Cookie Preferences</h2>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          Manage your privacy choices below.{" "}
          <a href={privacyUrl} style={{ color: accentColor, textDecoration: "underline" }}>Privacy Policy</a>
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
          {(Object.keys(CATEGORY_LABELS) as Array<keyof ConsentCategories>).map(cat => {
            const meta = CATEGORY_LABELS[cat];
            const checked = cat === "essential" ? true : localCats[cat];
            return (
              <div key={cat} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                <input type="checkbox" id={`modal-consent-${cat}`} checked={checked} disabled={meta.required} onChange={e => setLocalCats(prev => ({ ...prev, [cat]: e.target.checked }))} style={{ marginTop: "0.125rem", accentColor, cursor: meta.required ? "not-allowed" : "pointer" }} />
                <label htmlFor={`modal-consent-${cat}`} style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    {meta.label}
                    {meta.required && <span style={{ fontSize: "0.625rem", background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44`, borderRadius: "0.25rem", padding: "0.1rem 0.4rem" }}>Required</span>}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: "0.25rem" }}>{meta.description}</div>
                </label>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button onClick={() => { declineAll(); onClose(); }} style={{ padding: "0.5rem 1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", cursor: "pointer" }}>Decline All</button>
          <button onClick={() => { updateCategories(localCats); onClose(); }} style={{ padding: "0.5rem 1.25rem", background: `${accentColor}22`, border: `1px solid ${accentColor}55`, borderRadius: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: accentColor, cursor: "pointer" }}>Save Preferences</button>
          <button onClick={() => { acceptAll(); onClose(); }} style={{ padding: "0.5rem 1.25rem", background: accentColor, border: "none", borderRadius: "0.375rem", fontSize: "0.8125rem", fontWeight: 700, color: "#0a0e16", cursor: "pointer" }}>Accept All</button>
        </div>
      </div>
    </div>
  );
}
