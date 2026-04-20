import {
  db,
  stephenBookingRequestsTable,
  stephenCaseStudiesTable,
  stephenContentBlocksTable,
} from '../lib/db/src/index.js';

async function seed() {
  console.log('Seeding Stephen Lutar site data...');

  await db
    .insert(stephenContentBlocksTable)
    .values([
      {
        type: 'achievement',
        title: 'Founded SZL Holdings',
        content:
          'Established SZL Holdings as a portfolio company building interconnected technology products across fintech, logistics, and enterprise SaaS.',
        icon: 'Building2',
        date: '2019-03',
        sortOrder: 1,
        featured: true,
      },
      {
        type: 'achievement',
        title: 'Launched Vessels Platform',
        content:
          'Deployed a maritime fleet tracking and logistics platform serving 200+ vessels across three continents with real-time AIS integration.',
        icon: 'Ship',
        date: '2020-06',
        sortOrder: 2,
        featured: true,
      },
      {
        type: 'achievement',
        title: 'Firestorm v2.0 Release',
        content:
          'Released the second major version of Firestorm — a real-time incident response system processing 10,000+ alerts per minute with 99.99% uptime.',
        icon: 'Flame',
        date: '2021-01',
        sortOrder: 3,
        featured: true,
      },
      {
        type: 'achievement',
        title: 'Enterprise Partnership with DOD',
        content:
          'Secured a multi-year contract with the Department of Defense for readiness assessment tooling, deploying Readiness Report across 15 installations.',
        icon: 'Shield',
        date: '2022-04',
        sortOrder: 4,
        featured: true,
      },
      {
        type: 'achievement',
        title: 'Lyte Smart Energy Launch',
        content:
          'Launched Lyte — an IoT-driven energy management platform reducing commercial building energy consumption by an average of 32%.',
        icon: 'Lightbulb',
        date: '2023-02',
        sortOrder: 5,
        featured: true,
      },
      {
        type: 'achievement',
        title: 'Dreamscape AR/VR Platform',
        content:
          'Began development of Dreamscape — an immersive AR/VR experience platform for enterprise training and simulation environments.',
        icon: 'Glasses',
        date: '2024-08',
        sortOrder: 6,
        featured: false,
      },
      {
        type: 'service',
        title: 'Full-Stack Architecture',
        content:
          'End-to-end system design from database schema to distributed microservices, with emphasis on scalability and maintainability.',
        icon: 'Layers',
        sortOrder: 1,
        featured: true,
      },
      {
        type: 'service',
        title: 'Cloud Infrastructure & DevOps',
        content:
          'Multi-cloud deployment strategies, CI/CD pipelines, infrastructure as code, and container orchestration with Kubernetes.',
        icon: 'Cloud',
        sortOrder: 2,
        featured: true,
      },
      {
        type: 'service',
        title: 'AI & Machine Learning Integration',
        content:
          'Production ML pipelines, natural language processing, computer vision systems, and AI-powered automation workflows.',
        icon: 'Brain',
        sortOrder: 3,
        featured: true,
      },
      {
        type: 'service',
        title: 'Enterprise Security & Compliance',
        content:
          'SOC 2 compliance, zero-trust architecture, penetration testing, and security audit frameworks for regulated industries.',
        icon: 'Lock',
        sortOrder: 4,
        featured: true,
      },
      {
        type: 'service',
        title: 'Product Strategy & Leadership',
        content:
          'Technical product roadmap development, cross-functional team leadership, stakeholder management, and go-to-market strategy.',
        icon: 'Target',
        sortOrder: 5,
        featured: true,
      },
      {
        type: 'service',
        title: 'Real-Time Systems',
        content:
          'WebSocket architectures, event-driven systems, streaming data pipelines, and low-latency communication platforms.',
        icon: 'Zap',
        sortOrder: 6,
        featured: true,
      },
      {
        type: 'stat',
        title: 'Years Experience',
        content: '15+',
        sortOrder: 1,
        featured: true,
      },
      {
        type: 'stat',
        title: 'Projects Delivered',
        content: '50+',
        sortOrder: 2,
        featured: true,
      },
      {
        type: 'stat',
        title: 'Enterprise Clients',
        content: '12',
        sortOrder: 3,
        featured: true,
      },
      {
        type: 'stat',
        title: 'Uptime SLA',
        content: '99.9%',
        sortOrder: 4,
        featured: true,
      },
      {
        type: 'skill',
        title: 'TypeScript',
        content: 'Expert',
        sortOrder: 1,
        featured: true,
      },
      {
        type: 'skill',
        title: 'React / Next.js',
        content: 'Expert',
        sortOrder: 2,
        featured: true,
      },
      {
        type: 'skill',
        title: 'Node.js',
        content: 'Expert',
        sortOrder: 3,
        featured: true,
      },
      {
        type: 'skill',
        title: 'Python',
        content: 'Advanced',
        sortOrder: 4,
        featured: true,
      },
      {
        type: 'skill',
        title: 'PostgreSQL',
        content: 'Expert',
        sortOrder: 5,
        featured: true,
      },
      {
        type: 'skill',
        title: 'AWS / GCP',
        content: 'Advanced',
        sortOrder: 6,
        featured: true,
      },
      {
        type: 'skill',
        title: 'Kubernetes',
        content: 'Advanced',
        sortOrder: 7,
        featured: true,
      },
      {
        type: 'skill',
        title: 'Rust',
        content: 'Intermediate',
        sortOrder: 8,
        featured: false,
      },
      {
        type: 'skill',
        title: 'GraphQL',
        content: 'Advanced',
        sortOrder: 9,
        featured: true,
      },
      {
        type: 'skill',
        title: 'Docker',
        content: 'Expert',
        sortOrder: 10,
        featured: true,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(stephenCaseStudiesTable)
    .values([
      {
        title: 'Vessels: Maritime Fleet Intelligence Platform',
        slug: 'vessels-maritime-fleet',
        summary:
          'Built a real-time maritime tracking platform integrating AIS data, weather overlays, and predictive analytics for a fleet of 200+ commercial vessels.',
        content:
          'The Vessels platform was designed to provide comprehensive maritime domain awareness for commercial shipping operators. Key challenges included processing high-frequency AIS position reports, integrating multiple weather data providers, and building a predictive ETA model that accounted for currents, weather, and port congestion.\n\nThe solution leverages a microservices architecture with dedicated services for data ingestion, geospatial processing, and real-time client updates via WebSocket connections. The frontend provides an interactive map with vessel tracks, weather overlays, and fleet analytics dashboards.\n\nKey technologies: React, Node.js, PostgreSQL with PostGIS, Redis, Kubernetes, MapboxGL.',
        tags: ['Maritime', 'Real-Time', 'IoT', 'Geospatial'],
        featured: true,
        client: 'Global Shipping Corp',
        duration: '8 months',
        outcome:
          '40% reduction in fuel costs through optimized routing, 99.99% uptime over 18 months of operation.',
      },
      {
        title: 'Firestorm: Enterprise Incident Response System',
        slug: 'firestorm-incident-response',
        summary:
          'Developed a high-throughput incident response platform processing 10,000+ alerts per minute with intelligent triage and automated escalation workflows.',
        content:
          'Firestorm was built to address the challenge of alert fatigue in enterprise security operations centers. The platform ingests alerts from multiple sources (SIEM, IDS, endpoint agents), applies ML-based correlation and deduplication, and presents operators with prioritized incident queues.\n\nThe system architecture uses Apache Kafka for event streaming, a custom rules engine for alert correlation, and a React-based war room dashboard with real-time collaboration features. Automated playbooks handle common incident types, reducing mean time to resolution by 65%.\n\nKey technologies: TypeScript, React, Kafka, Elasticsearch, Python (ML), Kubernetes.',
        tags: ['Security', 'Real-Time', 'ML', 'Enterprise'],
        featured: true,
        client: 'Fortune 500 Financial Services',
        duration: '12 months',
        outcome:
          '65% reduction in MTTR, 80% decrease in false positive escalations, SOC 2 Type II certified.',
      },
      {
        title: 'Readiness Report: Defense Readiness Assessment',
        slug: 'readiness-report-defense',
        summary:
          'Created a comprehensive organizational readiness assessment platform deployed across 15 military installations with offline-first capabilities.',
        content:
          'Readiness Report was designed to digitize and standardize the readiness assessment process for military organizations. The platform supports both connected and disconnected operations, with automatic synchronization when connectivity is restored.\n\nThe offline-first architecture uses service workers and IndexedDB for local data persistence, with conflict resolution algorithms for multi-user concurrent editing. The reporting engine generates compliance dashboards and trend analysis across installations.\n\nKey technologies: React, Node.js, PostgreSQL, Service Workers, PWA, PDF Generation.',
        tags: ['Defense', 'PWA', 'Offline-First', 'Compliance'],
        featured: true,
        client: 'U.S. Department of Defense',
        duration: '18 months',
        outcome:
          'Deployed to 15 installations serving 5,000+ users, 90% reduction in paper-based assessments.',
      },
      {
        title: 'Lyte: Smart Energy Management Platform',
        slug: 'lyte-energy-management',
        summary:
          'Built an IoT-driven energy management system that reduced commercial building energy consumption by an average of 32% through intelligent automation.',
        content:
          'Lyte integrates with building management systems, smart meters, and IoT sensors to provide real-time energy monitoring and automated optimization. The platform uses machine learning models to predict energy demand and automatically adjust HVAC, lighting, and equipment schedules.\n\nThe IoT gateway handles thousands of sensor readings per second, with edge computing for latency-sensitive control decisions. The cloud platform provides analytics, benchmarking, and ROI tracking across building portfolios.\n\nKey technologies: TypeScript, React, Python, MQTT, TimescaleDB, TensorFlow, Kubernetes.',
        tags: ['IoT', 'Energy', 'ML', 'Sustainability'],
        featured: false,
        client: 'National Property Group',
        duration: '10 months',
        outcome:
          '32% average energy reduction, $2.4M annual savings across 45 buildings, LEED certification support.',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(stephenBookingRequestsTable)
    .values([
      {
        name: 'Sarah Chen',
        email: 'sarah.chen@techcorp.io',
        company: 'TechCorp Industries',
        role: 'VP of Engineering',
        type: 'consultation',
        message:
          "We're looking for guidance on migrating our monolithic application to a microservices architecture. Would love to discuss your approach and availability for a 3-month engagement.",
        preferredDate: '2026-04-15',
        status: 'pending',
      },
      {
        name: 'Marcus Johnson',
        email: 'marcus@defensetech.gov',
        company: 'DefenseTech Solutions',
        role: 'Program Manager',
        type: 'project',
        message:
          'Interested in a custom deployment of the Readiness Report platform for our organization. Need to discuss security requirements and timeline.',
        preferredDate: '2026-04-20',
        status: 'confirmed',
      },
      {
        name: 'Emily Rivera',
        email: 'emily.r@recruitplus.com',
        company: 'RecruitPlus',
        role: 'Senior Recruiter',
        type: 'recruitment',
        message:
          'We have a CTO position at a Series B startup that matches your profile. Would you be open to a brief conversation about the opportunity?',
        status: 'declined',
      },
    ])
    .onConflictDoNothing();

  console.log('Stephen site seed data inserted successfully!');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
