import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    const base = import.meta.env.BASE_URL || "/inca/";
    const aegisBase = base.replace("/inca/", "/firestorm/");
    window.location.replace(aegisBase + "intel/dashboard");
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0A0D14", color: "#94a3b8", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "1.25rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "0.5rem" }}>INCA has been consolidated into Aegis</p>
        <p>Redirecting to Aegis Intelligence Engine&hellip;</p>
      </div>
    </div>
  );
}
