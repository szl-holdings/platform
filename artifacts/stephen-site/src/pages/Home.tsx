import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { CaseStudiesSection } from "@/components/sections/CaseStudiesSection";
import { PlatformArchitectureSection } from "@/components/sections/PlatformArchitectureSection";
import { ThesisSection } from "@/components/sections/ThesisSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { FounderJourneySection } from "@/components/sections/FounderJourneySection";
import { LivePlatformProofSection } from "@/components/sections/LivePlatformProofSection";
import { TechStackShowcaseSection } from "@/components/sections/TechStackShowcaseSection";
import { NoiseGrain } from "@szl-holdings/shared-ui";

export function Home() {
  return (
    <div className="min-h-screen bg-[#080b12] text-white selection:bg-indigo-500/30 selection:text-white relative">
      <NoiseGrain opacity={0.02} />
      <Navbar />
      <main>
        <HeroSection />
        <FounderJourneySection />
        <LivePlatformProofSection />
        <CaseStudiesSection />
        <PlatformArchitectureSection />
        <ThesisSection />
        <TechStackShowcaseSection />
        <ServicesSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
