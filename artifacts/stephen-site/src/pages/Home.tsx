import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { CaseStudiesSection } from "@/components/sections/CaseStudiesSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { WritingSection } from "@/components/sections/WritingSection";
import { ContactSection } from "@/components/sections/ContactSection";

export function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary relative">
      <main>
        <HeroSection />
        <CaseStudiesSection />
        <ServicesSection />
        <WritingSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
