import { useEffect } from "react";
import { CompanyKPIDashboard, DEMO_COMPANY_KPIS } from "@workspace/shared-ui";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function KpiDashboardPage() {
  useEffect(() => {
    document.title = "Company KPIs — SZL Holdings";
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-8">
            <h1 style={{
              color: "hsl(38,12%,94%)",
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
              fontWeight: "700",
              letterSpacing: "-0.03em",
              marginBottom: "0.5rem",
            }}>
              Company KPI Dashboard
            </h1>
            <p style={{
              color: "hsl(210,5%,50%)",
              fontSize: "14px",
              maxWidth: "560px",
            }}>
              Doctrine-aligned performance metrics across all portfolio companies and product lines. Real-time signals from Beacon, Vessels, Firestorm, Lyte, and INCA.
            </p>
          </div>
          <CompanyKPIDashboard kpis={DEMO_COMPANY_KPIS} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
