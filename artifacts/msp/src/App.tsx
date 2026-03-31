import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    const base = import.meta.env.BASE_URL || "/msp/";
    const aegisBase = base.replace("/msp/", "/firestorm/");
    window.location.replace(aegisBase + "ops/dashboard");
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0A0D14", color: "#94a3b8", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "1.25rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "0.5rem" }}>Rosie has been consolidated into Aegis</p>
        <p>Redirecting to Aegis Managed Operations&hellip;</p>
      </div>
    </div>
  );
}
