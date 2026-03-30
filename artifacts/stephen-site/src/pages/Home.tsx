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
import { IntelligenceSection } from "@/components/sections/IntelligenceSection";
import { Link } from "wouter";
import { TrendingUp, Briefcase, ArrowRight } from "lucide-react";

function QuickAccessBar() {
  return (
    <section className="relative py-8 border-b border-white/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/financial-research" className="group flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-sm">Financial Research Hub</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Market analysis, portfolio tracking, and investment insights</p>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link href="/hackajob" className="group flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Briefcase className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-sm">Hackajob Profile</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Technical expertise, certifications, and career highlights</p>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary relative">
      <Navbar />
      
      <main>
        <HeroSection />
        <QuickAccessBar />
        <AboutSection />
        <AchievementsSection />
        <ServicesSection />
        <PortfolioSection />
        <CaseStudiesSection />
        <IntelligenceSection />
        <EcosystemSection />
        <PremiumSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
