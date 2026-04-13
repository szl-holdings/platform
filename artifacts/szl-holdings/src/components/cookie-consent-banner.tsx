import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Shield, X, ChevronDown } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";
const CONSENT_KEY = "szl_cookie_consent";
const CONSENT_VERSION = "1.0";

interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  version: string;
  timestamp: string;
}

function getStored(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

async function saveConsent(state: ConsentState) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  try {
    await fetch(`${API}/api/distribution-os/cookie-consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analyticsConsent: state.analytics,
        marketingConsent: state.marketing,
        functionalConsent: state.functional,
        consentVersion: state.version,
        sessionId: sessionStorage.getItem("szl_sid") || undefined,
      }),
    });
  } catch {}
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [functional] = useState(true);

  useEffect(() => {
    const stored = getStored();
    if (!stored || stored.version !== CONSENT_VERSION) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  async function acceptAll() {
    const state: ConsentState = { analytics: true, marketing: true, functional: true, version: CONSENT_VERSION, timestamp: new Date().toISOString() };
    await saveConsent(state);
    setVisible(false);
  }

  async function acceptNecessary() {
    const state: ConsentState = { analytics: false, marketing: false, functional: true, version: CONSENT_VERSION, timestamp: new Date().toISOString() };
    await saveConsent(state);
    setVisible(false);
  }

  async function savePreferences() {
    const state: ConsentState = { analytics, marketing, functional, version: CONSENT_VERSION, timestamp: new Date().toISOString() };
    await saveConsent(state);
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          style={{
            position: "fixed",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            width: "min(600px, calc(100vw - 2rem))",
            background: "rgba(12, 12, 16, 0.96)",
            backdropFilter: "blur(12px)",
            border: "1px solid hsla(0,0%,100%,0.08)",
            borderRadius: "12px",
            padding: "1.25rem",
            boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.875rem" }}>
            <Shield size={18} style={{ color: "#5a9c5a", flexShrink: 0, marginTop: "0.125rem" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "0.25rem" }}>
                We value your privacy
              </div>
              <p style={{ fontSize: "0.75rem", color: "#8b8579", lineHeight: 1.6, margin: 0 }}>
                SZL Holdings uses cookies and local analytics to improve your experience. We never share personal data with third parties. You may accept all, decline optional cookies, or customize preferences.
              </p>
            </div>
            <button onClick={acceptNecessary} style={{ padding: "0.25rem", background: "none", border: "none", color: "#4a4540", cursor: "pointer", flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>

          {/* Expanded preferences */}
          {expanded && (
            <div style={{ marginBottom: "0.875rem", padding: "0.875rem", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {[
                { label: "Functional Cookies", desc: "Required for core site functionality.", state: functional, locked: true, onToggle: () => {} },
                { label: "Analytics Cookies", desc: "First-party analytics to understand visit patterns (no third-party trackers).", state: analytics, locked: false, onToggle: () => setAnalytics(a => !a) },
                { label: "Marketing Cookies", desc: "Personalize email content and marketing communications.", state: marketing, locked: false, onToggle: () => setMarketing(m => !m) },
              ].map(({ label, desc, state: s, locked, onToggle }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de" }}>{label}</div>
                    <div style={{ fontSize: "0.6875rem", color: "#6b6560" }}>{desc}</div>
                  </div>
                  <button
                    onClick={locked ? undefined : onToggle}
                    style={{
                      width: "40px", height: "22px", borderRadius: "11px", border: "none", cursor: locked ? "default" : "pointer",
                      background: s ? "#5a9c5a" : "hsla(0,0%,100%,0.1)", position: "relative", transition: "background 0.2s", flexShrink: 0,
                      opacity: locked ? 0.6 : 1,
                    }}
                  >
                    <span style={{ position: "absolute", top: "3px", left: s ? "21px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={acceptAll} style={{ flex: "1 1 auto", padding: "0.5rem 1rem", background: "linear-gradient(135deg, #d4a054, #c8953c)", border: "none", borderRadius: "6px", color: "#070a10", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer" }}>
              Accept All
            </button>
            <button onClick={acceptNecessary} style={{ flex: "1 1 auto", padding: "0.5rem 1rem", background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#8b8579", fontSize: "0.8125rem", cursor: "pointer" }}>
              Necessary Only
            </button>
            {expanded ? (
              <button onClick={savePreferences} style={{ flex: "1 1 auto", padding: "0.5rem 1rem", background: "hsla(0,0%,100%,0.05)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.8125rem", cursor: "pointer", fontWeight: 600 }}>
                Save Preferences
              </button>
            ) : (
              <button onClick={() => setExpanded(true)} style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.5rem 0.75rem", background: "none", border: "none", color: "#6b6560", fontSize: "0.75rem", cursor: "pointer" }}>
                Customize <ChevronDown size={12} />
              </button>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export function hasCookieConsent(type: "analytics" | "marketing"): boolean {
  try {
    const stored = getStored();
    if (!stored) return false;
    return stored[type] === true;
  } catch { return false; }
}
