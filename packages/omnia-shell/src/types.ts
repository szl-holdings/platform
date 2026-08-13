export type OmniaArtifact =
  | 'command'
  | 'holdings'
  | 'aegis'
  | 'sentra'
  | 'terra'
  | 'vessels'
  | 'counsel'
  | 'a11oy'
  | 'pulse'
  | 'carlota-jo'
  | 'lyte'
  | 'praxis';

export interface OmniaArtifactMeta {
  id: OmniaArtifact;
  name: string;
  subtitle: string;
  path: string;
  accent: string;
  icon: string;
  domain: string;
}

export interface WorldModelEntity {
  id: string;
  label: string;
  type: 'domain' | 'entity' | 'concept' | 'agent' | 'signal' | 'property' | 'threat' | 'matter' | 'vessel';
  domain: OmniaArtifact | string;
  confidence: number;
  freshness: number;
  provenance: string[];
  description: string;
  lastSeen: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface WorldModelRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  type: 'causal' | 'associative' | 'hierarchical' | 'temporal' | 'dependency' | 'governs';
  confidence: number;
  strength: number;
  lastActive: string;
}

export interface WorldModelGraph {
  entities: WorldModelEntity[];
  relationships: WorldModelRelationship[];
  meta: {
    totalEntities: number;
    totalRelationships: number;
    lastRefreshed: string;
    staleDomains: string[];
    activeDomains: string[];
  };
}

export interface SynthesisNarrative {
  id: string;
  generatedAt: string;
  version: number;
  headline: string;
  summary: string;
  paragraphs: NarrativeParagraph[];
  signals: NarrativeSignal[];
}

export interface NarrativeParagraph {
  id: string;
  text: string;
  domain: string;
  entityRefs: string[];
  confidence: number;
  deepLink?: string;
}

export interface NarrativeSignal {
  id: string;
  label: string;
  domain: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  deepLink?: string;
}

export interface ProvenanceLink {
  id: string;
  label: string;
  type: 'signal' | 'derivation' | 'policy' | 'approval' | 'raw-data';
  value?: string | number;
  timestamp: string;
  author?: string;
  confidence?: number;
  domain?: string;
  url?: string;
}

export interface ProvenanceChain {
  claimId: string;
  claimLabel: string;
  claimValue: string | number;
  domain: string;
  links: ProvenanceLink[];
  approvedBy?: string;
  approvedAt?: string;
  policyTier?: string;
}

export interface OmniaNotification {
  id: string;
  artifactId: OmniaArtifact | string;
  artifactName: string;
  title: string;
  message: string;
  level: 'info' | 'warning' | 'critical' | 'success';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  entityRef?: string;
}

export interface RippleEffect {
  sourceEntityId: string;
  sourceEntityLabel: string;
  affected: RippleAffected[];
  propagatedAt: string;
}

export interface RippleAffected {
  entityId: string;
  entityLabel: string;
  domain: string;
  impactType: 'direct' | 'indirect' | 'potential';
  severity: 'low' | 'medium' | 'high';
  description: string;
  deepLink?: string;
}

export interface ShellAdoptionMetric {
  artifactId: string;
  artifactName: string;
  shellVersion: string | null;
  commandPaletteWired: boolean;
  provenanceCoverage: number;
  omniaProviderAdopted: boolean;
  lastChecked: string;
}

export interface OmniaShellConfig {
  artifactId: OmniaArtifact;
  artifactName?: string;
  accentColor: string;
  apiBase?: string;
  shellVersion?: string;
  networkState?: 'AVAILABLE' | 'UNAVAILABLE';
}

export interface OmniaShellContextValue {
  config: OmniaShellConfig;
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  notifications: OmniaNotification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  showProvenance: (chain: ProvenanceChain) => void;
  closeProvenance: () => void;
  activeProvenanceChain: ProvenanceChain | null;
}
