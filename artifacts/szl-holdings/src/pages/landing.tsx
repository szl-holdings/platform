import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Hero } from "@/components/Hero";
import { FeaturedPlatforms } from "@/components/FeaturedPlatforms";
import { EcosystemLogic } from "@/components/EcosystemLogic";
import { InvestorThesis } from "@/components/InvestorThesis";
import { AlloyBackbone } from "@/components/AlloyBackbone";
import { FounderBlock } from "@/components/FounderBlock";
import { ProofGrid } from "@/components/ProofGrid";
import { WhatItSolves } from "@/components/WhatItSolves";
import { ContactSegments } from "@/components/ContactSegments";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main>
        <Hero />
        <FeaturedPlatforms />
        <EcosystemLogic />
        <InvestorThesis />
        <AlloyBackbone />
        <FounderBlock />
        <ProofGrid />
        <WhatItSolves />
        <ContactSegments />
      </main>
      <SiteFooter />
    </div>
  );
}
