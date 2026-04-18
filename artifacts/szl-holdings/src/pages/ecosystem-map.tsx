import { useEffect } from "react";
import { EcosystemMap } from "@szl-holdings/shared-ui/ecosystem-map";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function EcosystemMapPage() {
  useEffect(() => {
    document.title = "Ecosystem Architecture — SZL Holdings";
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
              Ecosystem Architecture
            </h1>
            <p style={{
              color: "hsl(210,5%,50%)",
              fontSize: "14px",
              maxWidth: "560px",
            }}>
              Interactive map of the SZL Holdings technology ecosystem — how every product connects, communicates, and reinforces the intelligence loop.
            </p>
          </div>
          <EcosystemMap />
        </div>
      </div>
      <Footer />
    </div>
  );
}
