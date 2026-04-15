import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    window.location.replace("/aegis/");
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#080e18", color: "#94a3b8", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 14 }}>Redirecting to Aegis…</p>
        <p style={{ fontSize: 12, marginTop: 8 }}>
          <a href="/aegis/" style={{ color: "#f59e0b" }}>Click here if not redirected</a>
        </p>
      </div>
    </div>
  );
}
