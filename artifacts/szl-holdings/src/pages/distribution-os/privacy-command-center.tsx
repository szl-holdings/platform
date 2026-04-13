import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { m } from "framer-motion";
import {
  Shield, Download, Trash2, Mail, Settings, CheckCircle,
  AlertCircle, Eye, EyeOff, Lock, Globe, FileText
} from "lucide-react";
import { DistributionOsLayout } from "./admin-dashboard";

const API = import.meta.env.VITE_API_URL || "";
function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
function writeHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() };
}

type Tab = "overview" | "preferences" | "gdpr";

export default function PrivacyCommandCenterPage() {
  const [location] = useLocation();
  const [tab, setTab] = useState<Tab>("overview");
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupResult, setLookupResult] = useState<{
    gdprConsentGivenAt?: string | null;
    globalUnsubscribe?: boolean;
    marketingEmails?: boolean;
    newsletterEmails?: boolean;
    productUpdates?: boolean;
    frequency?: string;
    hasUnsubscribeToken?: boolean;
    dataExportRequestedAt?: string | null;
    dataDeletionRequestedAt?: string | null;
  } | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [searching, setSearching] = useState(false);

  const [exportEmail, setExportEmail] = useState("");
  const [exportResult, setExportResult] = useState<Record<string, unknown> | null>(null);
  const [exporting, setExporting] = useState(false);

  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteToken, setDeleteToken] = useState("");
  const [deleteResult, setDeleteResult] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function lookupPreferences() {
    if (!lookupEmail) return;
    setSearching(true);
    setLookupError("");
    setLookupResult(null);
    try {
      const res = await fetch(`${API}/api/distribution-os/preferences`, {
        method: "POST",
        credentials: "include",
        headers: writeHeaders(),
        body: JSON.stringify({ email: lookupEmail }),
      });
      if (res.status === 401 || res.status === 403) {
        setLookupError("Admin authentication required.");
        setSearching(false);
        return;
      }
      const data = await res.json();
      setLookupResult(data);
    } catch {
      setLookupError("Could not find preferences for this email.");
    }
    setSearching(false);
  }

  async function requestDataExport() {
    if (!exportEmail) return;
    setExporting(true);
    setExportResult(null);
    try {
      const res = await fetch(`${API}/api/distribution-os/privacy/data-export`, {
        method: "POST",
        credentials: "include",
        headers: writeHeaders(),
        body: JSON.stringify({ email: exportEmail }),
      });
      setExportResult(await res.json());
    } catch {}
    setExporting(false);
  }

  async function requestDataDeletion() {
    if (!deleteEmail) return;
    if (!confirm(`This will anonymize all personal data for ${deleteEmail}. Are you sure?`)) return;
    setDeleting(true);
    setDeleteResult(null);
    try {
      const res = await fetch(`${API}/api/distribution-os/privacy/data-delete`, {
        method: "POST",
        headers: writeHeaders(),
        body: JSON.stringify({ email: deleteEmail, token: deleteToken || undefined }),
      });
      const data = await res.json();
      setDeleteResult(data.message || data.error || "Request processed.");
    } catch {
      setDeleteResult("Request failed. Please try again.");
    }
    setDeleting(false);
  }

  const tabStyle = (t: Tab) => ({
    padding: "0.5rem 1rem",
    background: tab === t ? "hsla(0,0%,100%,0.08)" : "transparent",
    border: `1px solid ${tab === t ? "hsla(0,0%,100%,0.12)" : "transparent"}`,
    borderRadius: "6px",
    color: tab === t ? "#e8e4de" : "#6b6560",
    fontSize: "0.8125rem",
    fontWeight: tab === t ? 600 : 400,
    cursor: "pointer",
  });

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <Shield size={22} style={{ color: "#5a9c5a" }} />
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#e8e4de" }}>Privacy Command Center</h1>
            <p style={{ fontSize: "0.8125rem", color: "#6b6560", marginTop: "0.25rem" }}>GDPR/CCPA compliance, email preferences, and data rights management</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button style={tabStyle("overview")} onClick={() => setTab("overview")}><Shield size={12} style={{ display: "inline", marginRight: "0.375rem" }} />Overview</button>
          <button style={tabStyle("preferences")} onClick={() => setTab("preferences")}><Settings size={12} style={{ display: "inline", marginRight: "0.375rem" }} />Email Preferences</button>
          <button style={tabStyle("gdpr")} onClick={() => setTab("gdpr")}><Lock size={12} style={{ display: "inline", marginRight: "0.375rem" }} />Data Rights</button>
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Compliance status */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              {[
                { label: "Cookie Consent Banner", status: "active", icon: Globe },
                { label: "Email Unsubscribe Links", status: "active", icon: Mail },
                { label: "Do Not Track Respected", status: "active", icon: EyeOff },
                { label: "Data Export Endpoint", status: "active", icon: Download },
                { label: "Data Deletion Endpoint", status: "active", icon: Trash2 },
                { label: "Preference Center", status: "active", icon: Settings },
              ].map(({ label, status, icon: Icon }) => (
                <div key={label} style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Icon size={16} style={{ color: "#5a9c5a" }} />
                  <div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de" }}>{label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                      <CheckCircle size={10} style={{ color: "#5a9c5a" }} />
                      <span style={{ fontSize: "0.6875rem", color: "#5a9c5a" }}>Active</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Data retention policy */}
            <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Data Retention Policy</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[
                  { category: "Lead & Contact Data", retention: "3 years from last interaction", basis: "Legitimate Interest" },
                  { category: "Analytics & Session Data", retention: "2 years from creation", basis: "Legitimate Interest" },
                  { category: "Email Engagement Data", retention: "2 years from last open/click", basis: "Consent" },
                  { category: "Cookie Consent Records", retention: "5 years", basis: "Legal Obligation" },
                  { category: "Transactional Emails", retention: "7 years", basis: "Legal Obligation" },
                ].map(({ category, retention, basis }) => (
                  <div key={category} style={{ display: "flex", gap: "1rem", padding: "0.75rem 1rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "6px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "150px" }}>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de" }}>{category}</div>
                      <div style={{ fontSize: "0.6875rem", color: "#4a4540", marginTop: "0.125rem" }}>Basis: {basis}</div>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#8b8579", alignSelf: "center" }}>{retention}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DNT notice */}
            <div style={{ padding: "1rem 1.25rem", background: "hsla(120,30%,20%,0.08)", border: "1px solid hsla(120,30%,40%,0.15)", borderRadius: "8px", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <EyeOff size={16} style={{ color: "#5a9c5a", flexShrink: 0, marginTop: "0.125rem" }} />
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "0.25rem" }}>Do Not Track Compliance</div>
                <p style={{ fontSize: "0.8125rem", color: "#8b8579", lineHeight: 1.6 }}>
                  When a visitor sends a DNT header, analytics tracking is disabled. No session, page view, or behavior data is collected.
                  Marketing cookies are not set. Email tracking pixels are suppressed. No dark patterns — no pre-checked boxes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* EMAIL PREFERENCES */}
        {tab === "preferences" && (
          <div style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "0.5rem" }}>Look up Subscriber Preferences</h3>
              <p style={{ fontSize: "0.75rem", color: "#6b6560", marginBottom: "1rem" }}>View and manage email preferences for any subscriber by email address.</p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input value={lookupEmail} onChange={e => setLookupEmail(e.target.value)} placeholder="subscriber@example.com" type="email" style={{ flex: 1, padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem" }} />
                <button onClick={lookupPreferences} disabled={searching || !lookupEmail} style={{ padding: "0.625rem 1.25rem", background: "#4a90b8", border: "none", borderRadius: "6px", color: "white", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", opacity: searching ? 0.7 : 1 }}>
                  {searching ? "Searching…" : "Look Up"}
                </button>
              </div>
              {lookupError && <p style={{ fontSize: "0.75rem", color: "#c45a4a", marginTop: "0.5rem" }}>{lookupError}</p>}
            </div>

            {lookupResult && (
              <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "1rem" }}>Preferences for {lookupEmail}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {[
                    { label: "Global Unsubscribe", key: "globalUnsubscribe", value: lookupResult.globalUnsubscribe },
                    { label: "Marketing Emails", key: "marketingEmails", value: lookupResult.marketingEmails },
                    { label: "Newsletter Emails", key: "newsletterEmails", value: lookupResult.newsletterEmails },
                    { label: "Product Updates", key: "productUpdates", value: lookupResult.productUpdates },
                  ].map(({ label, key, value }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.625rem 0.875rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "6px" }}>
                      <span style={{ fontSize: "0.8125rem", color: "#8b8579" }}>{label}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: value === false || key === "globalUnsubscribe" && value ? "#c45a4a" : "#5a9c5a" }}>
                        {key === "globalUnsubscribe" ? (value ? "Unsubscribed" : "Subscribed") : (value === false ? "Disabled" : "Enabled")}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0.875rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "6px" }}>
                    <span style={{ fontSize: "0.8125rem", color: "#8b8579" }}>Send Frequency</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#e8e4de", textTransform: "capitalize" }}>{lookupResult.frequency}</span>
                  </div>
                  {lookupResult.gdprConsentGivenAt && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.625rem 0.875rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "6px" }}>
                      <span style={{ fontSize: "0.8125rem", color: "#8b8579" }}>GDPR Consent</span>
                      <span style={{ fontSize: "0.8125rem", color: "#5a9c5a" }}>{new Date(lookupResult.gdprConsentGivenAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {lookupResult.hasUnsubscribeToken && (
                    <div style={{ padding: "0.625rem 0.875rem", background: "hsla(0,0%,100%,0.02)", borderRadius: "6px" }}>
                      <span style={{ fontSize: "0.6875rem", color: "#5a9c5a" }}>✓ Unsubscribe token exists (sent in email footer links, not exposed to admin UI)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subscriber preference center info */}
            <div style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de", marginBottom: "0.5rem" }}>Email Preference Center</h3>
              <p style={{ fontSize: "0.75rem", color: "#6b6560", lineHeight: 1.6 }}>
                Every outbound email includes a unique unsubscribe link in the footer. Subscribers can use this to:
              </p>
              <ul style={{ fontSize: "0.75rem", color: "#8b8579", lineHeight: 2, margin: "0.5rem 0 0 1rem", padding: 0 }}>
                <li>Unsubscribe from all emails immediately</li>
                <li>Choose topics and frequency</li>
                <li>Pause emails temporarily</li>
                <li>Request their data export</li>
                <li>Request account deletion</li>
              </ul>
            </div>
          </div>
        )}

        {/* DATA RIGHTS (GDPR) */}
        {tab === "gdpr" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "600px" }}>
            {/* Data export */}
            <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                <Download size={16} style={{ color: "#4a90b8" }} />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de" }}>Data Export Request (Right to Access)</h3>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#6b6560", marginBottom: "1rem", lineHeight: 1.6 }}>
                Generate a data export for a subscriber. Returns all stored personal data including lead profile, email preferences, and consent history.
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input value={exportEmail} onChange={e => setExportEmail(e.target.value)} placeholder="subscriber@example.com" type="email" style={{ flex: 1, padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem" }} />
                <button onClick={requestDataExport} disabled={exporting || !exportEmail} style={{ padding: "0.625rem 1.25rem", background: "#4a90b8", border: "none", borderRadius: "6px", color: "white", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", opacity: exporting ? 0.7 : 1 }}>
                  {exporting ? "Generating…" : "Export Data"}
                </button>
              </div>
              {exportResult && (
                <div style={{ marginTop: "1rem", padding: "1rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "6px" }}>
                  <pre style={{ fontSize: "0.6875rem", color: "#8b8579", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                    {JSON.stringify(exportResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Data deletion */}
            <div style={{ padding: "1.5rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(10,30%,30%,0.15)", borderRadius: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                <Trash2 size={16} style={{ color: "#c45a4a" }} />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de" }}>Data Deletion Request (Right to Erasure)</h3>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#6b6560", marginBottom: "1rem", lineHeight: 1.6 }}>
                Anonymize all personal data for a subscriber per GDPR Article 17 (Right to Erasure). This replaces name/company/message with "[deleted]" and sets global unsubscribe. This action is irreversible.
              </p>
              <div style={{ padding: "0.75rem", background: "hsla(0,30%,20%,0.1)", border: "1px solid hsla(0,30%,40%,0.15)", borderRadius: "6px", marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
                <AlertCircle size={14} style={{ color: "#c45a4a", flexShrink: 0, marginTop: "0.125rem" }} />
                <p style={{ fontSize: "0.75rem", color: "#c45a4a", margin: 0 }}>
                  Warning: This operation is irreversible. Personal data will be permanently anonymized.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input value={deleteEmail} onChange={e => setDeleteEmail(e.target.value)} placeholder="subscriber@example.com" type="email" style={{ padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem" }} />
                <input value={deleteToken} onChange={e => setDeleteToken(e.target.value)} placeholder="Unsubscribe token (optional verification)" style={{ padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "6px", color: "#e8e4de", fontSize: "0.875rem" }} />
                <button onClick={requestDataDeletion} disabled={deleting || !deleteEmail} style={{ padding: "0.625rem 1.25rem", background: "hsla(0,30%,30%,0.2)", border: "1px solid hsla(0,30%,50%,0.3)", borderRadius: "6px", color: "#c45a4a", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", alignSelf: "flex-start", opacity: deleting ? 0.7 : 1 }}>
                  {deleting ? "Processing…" : "Delete Personal Data"}
                </button>
              </div>
              {deleteResult && (
                <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "6px" }}>
                  <p style={{ fontSize: "0.8125rem", color: deleteResult.includes("failed") ? "#c45a4a" : "#5a9c5a", margin: 0 }}>{deleteResult}</p>
                </div>
              )}
            </div>

            {/* Retention policy summary */}
            <div style={{ padding: "1.25rem", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)", borderRadius: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.75rem" }}>
                <FileText size={16} style={{ color: "#8b7ac8" }} />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e8e4de" }}>Data Retention Statement</h3>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#8b8579", lineHeight: 1.7, margin: 0 }}>
                SZL Holdings retains personal data only as long as necessary for the stated purpose. Lead and contact data is retained for 3 years from last interaction, or until an erasure request is honored. Email engagement data (opens, clicks) is retained for 2 years. Analytics session data is retained for 2 years. All data is stored within our own database infrastructure — no third-party analytics vendors receive personal data.
              </p>
            </div>
          </div>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
