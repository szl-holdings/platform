import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { AchievementsSection } from "@/components/sections/AchievementsSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { PortfolioSection } from "@/components/sections/PortfolioSection";
import { CaseStudiesSection } from "@/components/sections/CaseStudiesSection";
import { EcosystemSection } from "@/components/sections/EcosystemSection";
import { PremiumSection } from "@/components/sections/PremiumSection";
import { ContactSection } from "@/components/sections/ContactSection";

export function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary">
      <Navbar />
      
      <main>
        <HeroSection />
        <AboutSection />
        <AchievementsSection />
        <ServicesSection />
        <PortfolioSection />
        <CaseStudiesSection />
        <EcosystemSection />
        <PremiumSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
