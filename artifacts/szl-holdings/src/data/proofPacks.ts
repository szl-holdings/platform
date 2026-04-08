import type { VisitorType } from "@/hooks/useNarrativeRouter";

export interface ProofAsset {
  id: string;
  title: string;
  description: string;
  type: "deck" | "brief" | "case-study" | "architecture" | "model" | "proposal";
  cta: string;
  ctaHref: string;
  downloadable?: boolean;
  gated?: boolean;
}

export interface ProofPack {
  visitorType: VisitorType;
  headline: string;
  subheadline: string;
  primaryCTA: { label: string; href: string };
  secondaryCTA: { label: string; href: string };
  assets: ProofAsset[];
  nextPath: string;
  nextPathLabel: string;
}

export const PROOF_PACKS: Record<VisitorType, ProofPack> = {
  investor: {
    visitorType: "investor",
    headline: "The investor thesis, structured for diligence.",
    subheadline:
      "SZL Holdings is building the business observability category — Lyte + Alloy as the core, six verticals as the expansion surface. Proof-first company at design-partner stage.",
    primaryCTA: { label: "Request data room access", href: "/investors/data-room" },
    secondaryCTA: { label: "Architecture deep dive", href: "/investors/architecture" },
    assets: [
      {
        id: "investor-overview",
        title: "Investor Overview",
        description: "Company thesis, category positioning, and portfolio map — one structured read.",
        type: "brief",
        cta: "Read the overview",
        ctaHref: "/investors/overview",
      },
      {
        id: "moat-memo",
        title: "Moat & Defensibility",
        description: "Eight layers of defensibility: shared architecture, domain twins, proof chains, and distribution leverage.",
        type: "brief",
        cta: "Read the moat analysis",
        ctaHref: "/investors/moat",
      },
      {
        id: "trust-governance",
        title: "Trust & Governance Proof",
        description: "How governance architecture maps to enterprise buyer requirements — and why it is a commercial moat.",
        type: "architecture",
        cta: "Review trust architecture",
        ctaHref: "/investors/trust",
      },
      {
        id: "data-room",
        title: "Investor Data Room",
        description: "Company overview, product architecture, operating plan, and financial model. Access gated by qualification.",
        type: "deck",
        cta: "Request data room access",
        ctaHref: "/investors/data-room",
        gated: true,
      },
    ],
    nextPath: "/investors/overview",
    nextPathLabel: "View the full investor overview →",
  },

  lender: {
    visitorType: "lender",
    headline: "A disciplined capital story for lenders.",
    subheadline:
      "SZL Holdings is running a focused capital strategy aligned around Lyte + Alloy. Working capital narrative, repayment discipline, and commercial pipeline evidence — all structured for lender conversations.",
    primaryCTA: { label: "Request lender brief", href: "/investor-relations" },
    secondaryCTA: { label: "Start a conversation", href: "/contact" },
    assets: [
      {
        id: "bank-brief",
        title: "Bank / SBA Brief",
        description: "Working capital narrative, repayment discipline, and founder credibility package tailored for lender conversations.",
        type: "brief",
        cta: "Request the lender brief",
        ctaHref: "/investor-relations",
        downloadable: true,
      },
      {
        id: "operating-plan",
        title: "90-Day Operating Plan",
        description: "Milestone tracker, capital allocation framework, and near-term commercial targets.",
        type: "model",
        cta: "Review the operating plan",
        ctaHref: "/investors/data-room",
        gated: true,
      },
      {
        id: "design-partner-pipeline",
        title: "Design Partner Pipeline",
        description: "Evidence of commercial traction — active prospects, structured discovery engagements, and revenue potential.",
        type: "brief",
        cta: "See the commercial strategy",
        ctaHref: "/investors/overview",
      },
      {
        id: "capital-materials",
        title: "Capital Materials Package",
        description: "One-page teaser, bank brief, and financial model — the full lender package in one request.",
        type: "deck",
        cta: "Request the full package",
        ctaHref: "/investor-relations",
        downloadable: true,
      },
    ],
    nextPath: "/investor-relations",
    nextPathLabel: "View capital materials →",
  },

  buyer: {
    visitorType: "buyer",
    headline: "See the platform in your context.",
    subheadline:
      "Lyte surfaces what's stuck, at risk, and about to break — before the damage compounds. Alloy routes the right action with a full audit trail. Every domain, one platform.",
    primaryCTA: { label: "Request a demo", href: "/demo" },
    secondaryCTA: { label: "See the platform", href: "/platform" },
    assets: [
      {
        id: "platform-overview",
        title: "Platform Overview",
        description: "Signal ingestion, observability, action routing, and audit infrastructure — the six-layer architecture explained.",
        type: "architecture",
        cta: "Explore the platform",
        ctaHref: "/platform",
      },
      {
        id: "trust-center",
        title: "Trust & Security",
        description: "How governance, audit trails, and AI accountability are built into the architecture from day one.",
        type: "architecture",
        cta: "Review trust architecture",
        ctaHref: "/trust",
      },
      {
        id: "how-it-works",
        title: "How It Works",
        description: "Signal → interpretation → recommendation → approval → action → audit. The six-stage pipeline explained.",
        type: "case-study",
        cta: "See how it works",
        ctaHref: "/how-it-works",
      },
      {
        id: "demo-request",
        title: "Product Demo",
        description: "See Lyte + Alloy on a staged workflow. Choose your vertical, explore the flagship workflow, request controlled access.",
        type: "deck",
        cta: "See the live demo",
        ctaHref: "/demo",
      },
    ],
    nextPath: "/demo",
    nextPathLabel: "Request a live demo →",
  },

  "design-partner": {
    visitorType: "design-partner",
    headline: "Work with us to instrument one real workflow.",
    subheadline:
      "Design partner engagement: instrument one high-friction workflow in 90 days. Measurable proof, governance from day one, founder-led implementation. Not a trial — a proof.",
    primaryCTA: { label: "Apply as a design partner", href: "/contact" },
    secondaryCTA: { label: "See the program", href: "/design-partners" },
    assets: [
      {
        id: "dp-program",
        title: "Design Partner Program",
        description: "What the engagement looks like — workflow selection, integration setup, proof workflow, measurement and review.",
        type: "brief",
        cta: "Review the program",
        ctaHref: "/design-partners",
      },
      {
        id: "dp-proposal",
        title: "Design Partner Proposal",
        description: "Structured proposal tailored to your operating environment and workflow pain. Available after initial conversation.",
        type: "proposal",
        cta: "Request a proposal",
        ctaHref: "/contact",
        gated: true,
      },
      {
        id: "dp-timeline",
        title: "90-Day Timeline",
        description: "Four phases: workflow selection, integration, proof workflow live, measurement and review. Structured, not open-ended.",
        type: "brief",
        cta: "See the timeline",
        ctaHref: "/design-partners",
      },
      {
        id: "platform-demo",
        title: "Platform Demo",
        description: "See the workflow for your domain before committing. PRISM Counsel, Terra, Vessels, Aegis — all available.",
        type: "deck",
        cta: "See the demo",
        ctaHref: "/demo",
      },
    ],
    nextPath: "/contact",
    nextPathLabel: "Start the application →",
  },

  unknown: {
    visitorType: "unknown",
    headline: "Business observability with explainable execution.",
    subheadline:
      "SZL Holdings builds Lyte — the business observability platform — and Alloy, the execution fabric beneath it. One platform, every high-consequence domain.",
    primaryCTA: { label: "Request a demo", href: "/demo" },
    secondaryCTA: { label: "Explore the platform", href: "/platform" },
    assets: [
      {
        id: "platform-overview",
        title: "Platform Overview",
        description: "Signal ingestion, observability, action routing, and audit infrastructure.",
        type: "architecture",
        cta: "Explore the platform",
        ctaHref: "/platform",
      },
      {
        id: "trust-center",
        title: "Trust Center",
        description: "Security, governance, AI accountability, and audit trail — built in from day one.",
        type: "architecture",
        cta: "Review trust",
        ctaHref: "/trust",
      },
      {
        id: "investor-overview",
        title: "Investor Overview",
        description: "Company thesis, category positioning, and portfolio map.",
        type: "brief",
        cta: "View investor overview",
        ctaHref: "/investors/overview",
      },
      {
        id: "design-partners",
        title: "Design Partner Program",
        description: "Work directly with the founder to instrument one real workflow.",
        type: "brief",
        cta: "See the program",
        ctaHref: "/design-partners",
      },
    ],
    nextPath: "/platform",
    nextPathLabel: "Explore the platform →",
  },
};

export function getProofPack(visitorType: VisitorType): ProofPack {
  return PROOF_PACKS[visitorType] ?? PROOF_PACKS.unknown;
}

export const VISITOR_TYPE_LABELS: Record<VisitorType, string> = {
  investor: "Investor",
  lender: "Lender / Bank",
  buyer: "Operator / Buyer",
  "design-partner": "Design Partner",
  unknown: "Visitor",
};
