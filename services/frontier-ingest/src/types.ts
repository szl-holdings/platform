export type FrontierProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'nvidia'
  | 'huggingface';

export type ArtifactKind =
  | 'model'
  | 'doctrine'
  | 'dataset'
  | 'paper'
  | 'tool'
  | 'benchmark';

export type RoutingDecision = 'auto-promote' | 'queue' | 'discard';

export interface FrontierArtifact {
  id: string;
  provider: FrontierProvider;
  kind: ArtifactKind;
  externalId: string;
  title: string;
  url: string;
  summary?: string;
  publishedAt?: string;
  tags: string[];
  raw?: Record<string, unknown>;
  discoveredAt: string;
}

export interface CodexScore {
  ouroboros: number;
  lutar: number;
  thesisFit: number;
  costSignal: number;
  safetySignal: number;
  composite: number;
  rationale: string[];
}

export interface EvidencePack {
  artifact: FrontierArtifact;
  score: CodexScore;
  decision: RoutingDecision;
  promotionTarget?: PromotionTarget;
  evaluatedAt: string;
}

export type PromotionTarget =
  | 'operator_model_registry'
  | 'thesis_corpus'
  | 'eval_harness'
  | 'tool_proposals'
  | 'benchmark_registry';

export interface InboxItem {
  id: string;
  evidence: EvidencePack;
  status: 'pending' | 'approved' | 'discarded';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface TimelineEvent {
  id: string;
  at: string;
  kind: 'discovered' | 'promoted' | 'queued' | 'discarded' | 'approved' | 'rejected' | 'pull-started' | 'pull-completed' | 'cap-reached';
  provider?: FrontierProvider;
  artifactId?: string;
  inboxId?: string;
  message: string;
  costUsd?: number;
}

export interface SourceCostMeter {
  provider: FrontierProvider;
  spendUsd: number;
  callCount: number;
  windowStart: string;
}

export interface FrontierStats {
  totalDiscovered: number;
  totalPromoted: number;
  totalQueued: number;
  totalDiscarded: number;
  pendingInbox: number;
  spend: SourceCostMeter[];
  spendCapUsd: number;
  capReached: boolean;
  lastPullAt?: string;
  dailySpend?: DailySpendWindow;
}

export interface DailySpendWindow {
  usd: number;
  capUsd: number;
  windowStart: string;
  msUntilReset: number;
}
