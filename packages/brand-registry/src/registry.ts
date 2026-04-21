import type { BrandRegistry } from './types.js';

export const registry: BrandRegistry = {
  version: '1.0.0',

  company: {
    name: 'SZL Holdings',
    legalEntity: 'SZL Holdings Ltd',
    jurisdiction: 'England and Wales',
    founded: '2021',
    foundedQuarter: 'Q2 2021',
    headquarters: ['Washington, D.C.', 'London', 'Singapore'],
    email: 'inquiries@szlholdings.com',
    privacyEmail: 'privacy@szlholdings.com',
    website: 'https://szlholdings.com',
  },

  founder: {
    name: 'Stephen Lutar',
    title: 'Founder & CEO',
    shortBio:
      'Stephen Lutar is the founder and CEO of SZL Holdings. He architects, ships, and scales technology that creates structural advantage across fintech, maritime intelligence, and enterprise AI.',
    longBio:
      'Stephen Lutar is the founder and CEO of SZL Holdings. He builds the systems that power enterprises — from fintech platforms to maritime intelligence to governed decision infrastructure. His work sits at the intersection of operational design, AI governance, and systems architecture, shipping technology that creates durable structural advantage at enterprise scale.',
    linkedin: 'https://linkedin.com/in/stephen-l-279315240',
    quote:
      "The next generation of durable businesses won't be built on a single product — they'll emerge from intelligently orchestrated ecosystems where data flows between verticals, AI compounds across domains, and every platform makes the others exponentially more valuable. That's not a vision. It's an engineering problem.",
    quoteAttribution: 'Stephen Lutar, Founder & CEO, SZL Holdings',
  },

  metrics: {
    platformCount: {
      label: 'Portfolio platforms',
      value: '6',
      asOf: '2026-Q1',
    },
    seedRound: {
      label: 'Seed funding',
      value: '$2.4M',
      asOf: '2021-Q2',
    },
    seriesA: {
      label: 'Series A',
      value: '$14.5M',
      asOf: '2022-Q2',
    },
    seriesAValuation: {
      label: 'Series A pre-money valuation',
      value: '$62M',
      asOf: '2022-Q2',
    },
    seriesBTarget: {
      label: 'Series B target',
      value: '$45M',
      asOf: '2026-Q1',
    },
    targetArr: {
      label: 'Target ARR',
      value: '$35M+',
      asOf: '2026',
    },
    alloyConnectors: {
      label: 'FORGE connectors',
      value: '35+',
      asOf: '2026-Q1',
    },
    terraDistressProperties: {
      label: 'DOMAINE distress properties tracked',
      value: '340+',
      asOf: '2026-Q1',
    },
    terraDealPipeline: {
      label: 'DOMAINE deal pipeline',
      value: '$4.8B',
      asOf: '2026-Q1',
    },
  },

  funding: [
    {
      round: 'Seed',
      amount: '$2.4M',
      date: 'Q2 2021',
      detail: 'Angel investors; founding team of four engineers and operators.',
    },
    {
      round: 'Series A',
      amount: '$14.5M',
      date: 'Q2 2022',
      detail:
        'Institutional consortium; $62M pre-money valuation. Earmarked for engineering headcount, cloud infrastructure, and new portfolio companies.',
    },
    {
      round: 'Series B (target)',
      amount: '$45M',
      date: '2026',
      detail:
        'International expansion, Counsel and Carlota Jo to GA, triple PARAGON defense presence.',
    },
  ],

  products: [
    {
      id: 'lyte',
      name: 'KORA',
      tagline: 'Decision Intelligence Platform',
      category: 'Decision Intelligence',
      oneLiner:
        'Governed decision intelligence that detects operational risk, surfaces ownership gaps, and routes human action before business damage occurs.',
      description:
        'Governed decision intelligence platform that detects operational risk, surfaces ownership gaps, and routes human action before business damage occurs. Built on the PRAXIS framework — Pulse, Risk, Action, eXecution, Intelligence, Signals.',
      status: 'live',
      doctrineRole: 'OBSERVE',
      link: '/command/operations/',
      color: '#f59e0b',
    },
    {
      id: 'alloy',
      name: 'FORGE',
      tagline: 'Execution Fabric & Predictive Intelligence Engine',
      category: 'Execution Fabric',
      oneLiner:
        'The execution backbone of the SZL platform — orchestrating connectors, automations, and the predictive intelligence layer across every subsidiary.',
      description:
        'FORGE is the execution engine of the SZL platform — orchestrating connectors, DAGs, automations, and the predictive intelligence layer across every subsidiary. Scenario modeling, confidence scoring, agent coordination, and workflow automation are embedded capabilities, not bolted-on tools.',
      status: 'live',
      doctrineRole: 'EXECUTE',
      link: '/alloy/',
      color: '#6366f1',
    },
    {
      id: 'aegis',
      name: 'PARAGON',
      tagline: 'Unified Defense & Intelligence Command',
      category: 'Defense & Intelligence',
      oneLiner:
        'One platform, three workspaces — Command, Defense, and Labs — for unified operator overview with cross-module correlations and investigation timelines.',
      description:
        'One platform, three workspaces — Command (managed operations), Defense (security operations), and Labs (intelligence engine). Unified operator overview with cross-module correlations, severity tracking, and investigation timelines.',
      status: 'live',
      doctrineRole: 'DEFEND',
      link: '/aegis/',
      color: '#6366f1',
    },
    {
      id: 'vessels',
      name: 'SEXTANT',
      tagline: 'Maritime Intelligence Platform',
      category: 'Maritime',
      oneLiner:
        'Full-spectrum maritime domain awareness integrating AIS data, satellite imagery, and multi-source sensor fusion for real-time vessel tracking and predictive risk analytics.',
      description:
        'Full-spectrum maritime domain awareness integrating AIS data, satellite imagery, and multi-source sensor fusion to deliver real-time vessel tracking, route optimization, dark vessel detection, and predictive risk analytics across global shipping lanes.',
      status: 'live',
      doctrineRole: 'OBSERVE',
      link: '/vessels/',
      color: '#3b82f6',
    },
    {
      id: 'terra',
      name: 'DOMAINE',
      tagline: 'NYC Real Estate Intelligence',
      category: 'Real Estate Intelligence',
      oneLiner:
        'Property intelligence platform surfacing distressed properties, tracking ownership structures, and delivering market intelligence for brokers, investors, and portfolio teams.',
      description:
        'Property intelligence platform surfacing distressed properties, tracking ownership structures, managing deal pipelines, and delivering market intelligence — all from one operating surface built for brokers, investors, and portfolio teams who move fast.',
      status: 'live',
      doctrineRole: 'OBSERVE',
      link: '/terra/',
      color: '#4d7c0f',
    },
    {
      id: 'carlota-jo',
      name: 'Carlota Jo',
      tagline: 'Private Advisory',
      category: 'Advisory',
      oneLiner:
        'A private advisory practice delivering thoughtful, tailored support for principals who value discretion, precision, and calm execution.',
      description:
        'A private advisory brand delivering thoughtful, tailored support for clients who value discretion, precision, and calm execution.',
      status: 'live',
      link: '/carlota-jo/',
      color: '#ec4899',
    },
    {
      id: 'prism-counsel',
      name: 'Counsel',
      tagline: 'Legal Matter Command',
      category: 'Legal Tech',
      oneLiner:
        'Structured legal matter management and counsel intelligence for organizations that need traceable, governed legal operations.',
      description:
        'Legal matter command platform delivering structured matter management, counsel intelligence, and governed legal operations for organizations where legal risk is a strategic variable.',
      status: 'development',
      color: '#8b5cf6',
    },
    {
      id: 'rosie',
      name: 'Rosie',
      tagline: 'Threat & Anomaly Visibility — Incident Command',
      category: 'Security',
      oneLiner:
        'Evidence-backed incident command platform delivering threat detection, anomaly visibility, and MSP-grade operational intelligence.',
      description:
        'Evidence-backed incident command platform delivering threat detection, anomaly visibility, and MSP-grade operational intelligence. Integrates government contract intelligence, FedRAMP compliance tracking, and CMMC maturity scoring for defense-aware operators.',
      status: 'live',
      doctrineRole: 'OBSERVE',
      link: '/aegis/ops/dashboard',
      color: '#ef4444',
    },
  ],

  boilerplate: {
    aboutSzl:
      'SZL Holdings is a technology holding company building a governed portfolio of enterprise intelligence platforms. Founded in 2021, our six operating platforms — KORA, FORGE, PARAGON, SEXTANT, DOMAINE, and Carlota Jo — share a common execution fabric, compounding intelligence across every vertical. Every AI agent we deploy advises; humans confirm; the proof chain records everything.',
    footerRightsReserved: 'All rights reserved.',
    footerTagline: 'Governed Autonomy',
    governancePhilosophy: 'AI agents advise; humans confirm; the proof chain records everything.',
    missionStatement:
      'The enterprises that win the next decade are not the ones with the most data. They are the ones that can reason across their data, connect operational signal to strategic decision, and act with confidence.',
    prismExpansion: 'Pulse, Risk, Action, eXecution, Intelligence, Signals',
    alloyDescription:
      'FORGE is the shared intelligence and automation backbone that handles workflow orchestration, AI processing, and signal collection across the SZL ecosystem.',
    ecosystemThesis:
      'Six operating companies. One intelligence fabric. Each platform commands its vertical. Shared infrastructure compounds the advantage across all of them.',
  },

  legal: {
    entityName: 'SZL Holdings Ltd',
    jurisdiction: 'England and Wales',
    copyrightHolder: 'SZL Holdings',
    privacyController: 'SZL Holdings Ltd',
    privacyEmail: 'privacy@szlholdings.com',
    termsContact: 'inquiries@szlholdings.com',
  },

  deprecatedStrings: [
    'Alloy Creative Engine',
    'Nuro Mesh',
    'INCA',
    'Beacon',
    'Business telemetry platform',
    'Alloy Predict',
    'Alloy is the execution engine of the SZL platform — orchestrating connectors, DAGs, automations',
    '2.1B+ Sentiment Data Points',
    '4,800+ workflows/day',
  ],
};
