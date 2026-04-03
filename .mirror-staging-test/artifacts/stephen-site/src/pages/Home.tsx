import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { CaseStudiesSection } from "@/components/sections/CaseStudiesSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { ThesisSection } from "@/components/sections/ThesisSection";
import { EcosystemRoleSection } from "@/components/sections/EcosystemRoleSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { StephenGraphQLPanel } from "@/components/graphql-data-panel";

export function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary relative">
      <Navbar />
      <main>
        <HeroSection />
        <CaseStudiesSection />
        <ServicesSection />
        <ThesisSection />
        <EcosystemRoleSection />
        <ContactSection />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <StephenGraphQLPanel />
        </div>
      </main>
      <Footer />
    </div>
  );
}
