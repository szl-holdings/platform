import { useState } from "react";
import { Bell, Clock, Globe, Shield, Zap, Check } from "lucide-react";

type Toggle = { key: string; label: string; description: string; value: boolean };

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [toggles, setToggles] = useState<Toggle[]>([
    { key: "daily_brief", label: "Daily Brief Auto-Generation", description: "Automatically generate the Morning Brief at 5:30 AM UTC every day", value: true },
    { key: "push_notify", label: "Push Notification on Daily Drop", description: "Receive a push notification when the daily brief is published (mobile)", value: true },
    { key: "dissent_alerts", label: "Dissent Resolution Alerts", description: "Get notified when your dissents are acknowledged or resolved", value: true },
    { key: "confidence_warnings", label: "Low Confidence Warnings", description: "Alert when any domain drops below 60% confidence", value: true },
    { key: "custom_brief_complete", label: "Custom Brief Complete Alerts", description: "Notify when a custom brief request has been synthesized", value: true },
    { key: "offline_cache", label: "Offline Cache (Mobile)", description: "Cache the latest brief for offline reading on mobile", value: true },
  ]);

  const [briefTime, setBriefTime] = useState("05:30");
  const [classification, setClassification] = useState("SZL-EXEC-RESTRICTED");
  const [defaultView, setDefaultView] = useState("today");

  const handleToggle = (key: string) => {
    setToggles(prev => prev.map(t => t.key === key ? { ...t, value: !t.value } : t));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ padding: "28px 28px 40px", maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--pulse-text)", marginBottom: 6 }}>Settings</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--pulse-text-muted)" }}>
          Configure Pulse briefing preferences, notification settings, and classification defaults.
        </p>
      </div>

      {/* Brief generation */}
      <div className="section-card" style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Clock size={15} color="var(--pulse-text-muted)" />
          <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pulse-text)" }}>Brief Generation</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--pulse-text-muted)", marginBottom: 6 }}>Daily Brief Time (UTC)</label>
            <input type="time" value={briefTime} onChange={e => setBriefTime(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 6, background: "var(--pulse-bg)", border: "1px solid var(--pulse-border)", color: "var(--pulse-text)", fontSize: "0.88rem", outline: "none", fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--pulse-text-muted)", marginBottom: 6 }}>Default View</label>
            <select value={defaultView} onChange={e => setDefaultView(e.target.value)}
              style={{ padding: "9px 12px", borderRadius: 6, background: "var(--pulse-bg)", border: "1px solid var(--pulse-border)", color: "var(--pulse-text)", fontSize: "0.85rem", cursor: "pointer", width: "100%" }}
            >
              <option value="today">Today's Brief</option>
              <option value="library">Briefing Library</option>
              <option value="confidence">Confidence Dashboard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className="section-card" style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Shield size={15} color="var(--pulse-text-muted)" />
          <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pulse-text)" }}>Classification & Access</h3>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--pulse-text-muted)", marginBottom: 6 }}>Default Classification Label</label>
          <select value={classification} onChange={e => setClassification(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 6, background: "var(--pulse-bg)", border: "1px solid var(--pulse-border)", color: "var(--pulse-gold)", fontSize: "0.85rem", cursor: "pointer", width: "100%" }}
          >
            <option value="SZL-EXEC-RESTRICTED">SZL-EXEC-RESTRICTED</option>
            <option value="SZL-BOARD-CONFIDENTIAL">SZL-BOARD-CONFIDENTIAL</option>
            <option value="SZL-INTERNAL">SZL-INTERNAL</option>
            <option value="SZL-UNRESTRICTED">SZL-UNRESTRICTED</option>
          </select>
        </div>
      </div>

      {/* Notifications & features */}
      <div className="section-card" style={{ padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Bell size={15} color="var(--pulse-text-muted)" />
          <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pulse-text)" }}>Notifications & Features</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {toggles.map(toggle => (
            <div key={toggle.key} style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
              padding: "10px 14px", borderRadius: 6,
              background: "rgba(0,0,0,0.15)", border: "1px solid var(--pulse-border)",
            }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--pulse-text)", marginBottom: 2 }}>{toggle.label}</div>
                <div style={{ fontSize: "0.76rem", color: "var(--pulse-text-muted)", lineHeight: 1.4 }}>{toggle.description}</div>
              </div>
              <button
                onClick={() => handleToggle(toggle.key)}
                style={{
                  width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", flexShrink: 0,
                  background: toggle.value ? "rgba(200,168,75,0.3)" : "rgba(255,255,255,0.06)",
                  position: "relative", transition: "background 0.2s",
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: toggle.value ? "#c8a84b" : "#546078",
                  position: "absolute", top: 3,
                  left: toggle.value ? 21 : 3,
                  transition: "left 0.2s, background 0.2s",
                }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Nuro Mesh agents info */}
      <div className="section-card" style={{ padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Zap size={15} color="var(--pulse-text-muted)" />
          <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--pulse-text)" }}>Nuro Mesh Agents</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { agent: "Alloy", role: "Orchestration & synthesis", domain: "Executive" },
            { agent: "Helmsman", role: "Maritime intelligence", domain: "Fleet" },
            { agent: "Sentinel", role: "Security & threats", domain: "Aegis" },
            { agent: "Terra", role: "Real estate analytics", domain: "Property" },
            { agent: "Lexis", role: "Legal & compliance", domain: "Counsel" },
            { agent: "Atlas", role: "Financial & portfolio", domain: "Holdings" },
            { agent: "Beacon", role: "Platform health", domain: "Operations" },
          ].map(a => (
            <div key={a.agent} style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(0,0,0,0.2)", border: "1px solid var(--pulse-border)" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--pulse-text)", marginBottom: 2 }}>{a.agent}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--pulse-text-muted)" }}>{a.role}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "10px 20px", borderRadius: 6,
          background: saved ? "rgba(78,202,139,0.1)" : "rgba(200,168,75,0.12)",
          border: `1px solid ${saved ? "rgba(78,202,139,0.35)" : "rgba(200,168,75,0.35)"}`,
          color: saved ? "#4eca8b" : "var(--pulse-gold)",
          fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        {saved ? <Check size={15} /> : <Zap size={15} />}
        {saved ? "Saved" : "Save Settings"}
      </button>
    </div>
  );
}
