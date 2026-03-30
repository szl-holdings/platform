import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { CaseStudiesSection } from "@/components/sections/CaseStudiesSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { MarketIntelligenceSection } from "@/components/sections/MarketIntelligenceSection";

export function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary relative">
      <main>
        <HeroSection />
        <AboutSection />
        <CaseStudiesSection />
        <ServicesSection />
        <MarketIntelligenceSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
