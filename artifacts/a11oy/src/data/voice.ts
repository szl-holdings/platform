import { registry } from '@szl-holdings/brand-registry';

export const bannedTerms = [
  ...registry.deprecatedStrings,
  'click here',
  'user-friendly',
  'cutting-edge',
  'innovative',
  'seamless'
];

export const preferredTerms = [
  { avoid: 'click here', prefer: 'descriptive action (e.g. View Report)' },
  { avoid: 'user-friendly', prefer: 'intuitive' },
  { avoid: 'cutting-edge', prefer: 'advanced' },
  { avoid: 'innovative', prefer: 'novel' },
  { avoid: 'seamless', prefer: 'integrated' },
  { avoid: 'utilize', prefer: 'use' },
  { avoid: 'leverage', prefer: 'use' },
  { avoid: 'empower', prefer: 'enable' },
  { avoid: 'synergy', prefer: 'alignment' },
  { avoid: 'next-generation', prefer: 'modern' }
];

export interface BrandTone {
  id: string;
  x: number; // -1 to 1 (warm to formal)
  y: number; // -1 to 1 (plain to technical)
}

export const toneMatrix: BrandTone[] = [
  { id: 'TENAX', x: 0.8, y: 0.9 },
  { id: 'Counsel', x: 0.9, y: 0.6 },
  { id: 'Pulse', x: 0.5, y: 0.8 },
  { id: 'Terra', x: 0.2, y: 0.2 },
  { id: 'Vessels', x: 0.7, y: 0.9 },
  { id: 'Aegis', x: 0.9, y: 0.95 },
  { id: 'Carlota Jo', x: -0.6, y: -0.4 },
  { id: 'Command', x: 0.5, y: 0.5 }
];

export const scriptedRewrites = [
  {
    brand: 'Carlota Jo',
    context: 'Welcome email',
    original: 'Welcome to Carlota Jo! We are excited to leverage our innovative platform to empower you.',
    rewritten: 'Welcome. We are prepared to assist you.'
  },
  {
    brand: 'Aegis',
    context: 'Threat alert',
    original: 'Oops! We found a bad thing in your system. Click here to check it out seamlessly.',
    rewritten: 'Anomaly detected. Review the incident timeline to proceed.'
  },
  {
    brand: 'Terra',
    context: 'Property listing',
    original: 'This cutting-edge property is super user-friendly and next-generation.',
    rewritten: 'Modern property with advanced amenities and integrated systems.'
  },
  {
    brand: 'Vessels',
    context: 'Route optimization',
    original: 'Utilize our seamless synergy to optimize your shipping routes.',
    rewritten: 'Use integrated route analytics to optimize transit paths.'
  },
  {
    brand: 'Counsel',
    context: 'Compliance report',
    original: 'Our telemetry platform shows billions of sentiment signals.',
    rewritten: 'The execution fabric recorded 2.1B signals.'
  }
];
