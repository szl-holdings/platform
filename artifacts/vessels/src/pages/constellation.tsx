import { ConstellationGraph } from "@szl-holdings/shared-ui";

const ACCENT = "#0ea5e9";

export default function ConstellationPage() {
  return (
    <div style={{ padding: "28px 28px 40px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#e0f2fe", margin: 0 }}>
          Constellation
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#7dd3fc", marginTop: 4 }}>
          Vessels, ports, charterers, and cases in Vessels — with cross-domain links into Terra,
          Aegis, Prism, and Lyte highlighted in amber.
        </p>
      </div>
      <ConstellationGraph domain="vessels" accentColor={ACCENT} height={520} />
    </div>
  );
}
