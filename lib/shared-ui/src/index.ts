export { NewsletterSubscribe, type NewsletterSubscribeProps, type NewsletterSubscribeVariant } from "./newsletter-subscribe";
export { TimeSeriesChart, type TimeSeriesChartProps } from "./analytics/index";
export { FunnelChart, type FunnelChartProps } from "./analytics/index";
export { CohortMatrix, type CohortMatrixProps } from "./analytics/index";
export { AnomalyFeed, type AnomalyFeedProps } from "./analytics/index";
export { MetricsDashboard, MetricSummaryRow, type MetricsDashboardProps, type MetricSummaryRowProps, type DashboardWidgetConfig, type DashboardWidgetType } from "./analytics/index";
export * from "./pulse";
export * from "./tokens";
export * from "./animations";
export * from "./utils";
export * from "./components";
export * from "./themes";
export * from "./lane-colors";
export * from "./powerbi-embed";
export * from "./premium-components";
export * from "./intelligence-philosophy";
export * from "./lens-bar";
export * from "./doctrine-layer";
export * from "./doctrine-layer-badge";
export * from "./explainability-panel";
export * from "./design-system";
export * from "./command-mode";
export { default as AppObservabilityPage } from "./AppObservabilityPage";
export { apiFetch, graphqlRequest, ApiError, isAuthError, type PaginationMeta, type PaginatedResponse, type ApiFetchOptions, type GraphQLRequestOptions } from "./api-fetch";
export { useNotificationCenter, type LiveNotification, type ApiNotification, type NotificationCenterState } from "./notification-center";
export { AgentInsightsWidget, type KnowledgeEntry as AgentKnowledgeEntry, type AgentRun } from "./agent-insights-widget";
export { ExplainabilityDrawer, useExplainability, ExplainButton, type ExplainabilityMetadata, type ExplainabilityDrawerProps } from "./explainability";
export { DemoModeProvider, useDemoMode, DemoModeSwitcher, type DemoMode, type DemoModeState, MODE_LABELS, MODE_DESCRIPTIONS, MODE_ICONS, MODE_COLORS } from "./demo-mode";
export { SandboxModeProvider, useSandboxMode, SandboxModeBanner, SandboxToggle, type SandboxModeState } from "./sandbox-mode";
export { AppModeBanner, AppModeProvider, useAppMode, type AppMode as PlatformAppMode, type AppModeBannerProps } from "./app-mode-banner";
export { ProductionConfirmProvider, useProductionConfirm, useDestructiveAction, type ConfirmOptions } from "./production-confirm";
export { PrivateAppGuard, type PrivateAppGuardProps } from "./PrivateAppGuard";
export { useRole, RoleGate, type UserRoles, type AppRole } from "./use-role";
export { default as AuthGate, type AuthGateProps } from "./AuthGate";
export { EcosystemMap, ECOSYSTEM_NODES, LAYER_CONFIG, CONNECTION_PAIRS, type EcosystemNode, type EcosystemMapProps } from "./ecosystem-map";
export { CompanyKPIDashboard, DEMO_COMPANY_KPIS, type CompanyKPI, type CompanyKPIDashboardProps } from "./company-kpi-dashboard";
export { DataStateBadge, DataStateBanner, type DataState } from "./data-state-badge";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { ErrorState, type ErrorStateProps } from "./design-system/ErrorState";
export { PageDataSkeleton, InlineDataSkeleton } from "./page-data-skeleton";
export { useRealtimeChannel, type RealtimeConnectionStatus, type RealtimeTransport, type RealtimeChannelMessage, type UseRealtimeChannelOptions, type UseRealtimeChannelResult } from "./use-realtime-channel";
export { usePresence, useRealtimePresence, type PresenceUser, type PresenceState, type UsePresenceOptions, type UsePresenceResult } from "./use-presence";
export { RealtimeStatusIndicator } from "./realtime-status-indicator";
export * from "./document-engine";
export * from "./ontology";
export { DataProvenance, ActionLoop, RoleSelector } from "./data-provenance";
export {
  ReceiptDrawer,
  ProvenanceBadge,
  ExecutiveTrustSummaryPanel,
  ProvenanceViewer,
  type ReceiptDrawerProps,
  type ProvenanceBadgeProps,
  type ExecutiveTrustSummaryPanelProps,
  type ProvenanceViewerProps,
} from "./receipt-graph";
export { LanguageSwitcher, type LanguageSwitcherProps, type SupportedLocale } from "./language-switcher";
export { ContactModal, useContactModal, type ContactModalProps } from "./contact-modal";
export { WelcomeOverlay, useWelcomeState, type WelcomeOverlayProps, type WelcomeFeature } from "./WelcomeOverlay";
export {
  TenantBrandProvider,
  useTenantBrand,
  useTenantCSSVars,
  mergeBranding,
  DEFAULT_BRAND,
  type TenantBranding,
  type TenantBrandConfig,
  type TenantBrandProviderProps,
} from "./use-tenant-brand";
export { NpsSurvey, NpsSurveyOverlay, useNpsSurvey, type NpsSurveyProps, type NpsSurveyOverlayProps } from "./nps-survey";
export { ContextualFeedback, ContextualFeedbackBar, type ContextualFeedbackProps, type ContextualFeedbackBarProps } from "./contextual-feedback";
export { PackBanner, PACK_ACCENT_COLORS, type PackBannerProps, type PackVariant } from "./pack-banner";
export { CookieBanner, useCookieConsent, type CookieBannerProps, type CookieConsentState } from "./cookie-banner";
export { StatusBanner, useStatusBanner, type StatusBannerProps, type StatusBannerConfig, type StatusLevel } from "./status-banner";
export {
  ConfidenceBand,
  EvidencePanel,
  ApprovalBadge,
  HumanReviewBadge,
  RiskBadge,
  PriorityBadge,
  ActionTypeBadge,
  EnvironmentLabel,
  DegradedModeBanner,
  SafeFallbackState,
  DecisionCard,
  AuditTrailDrawer,
  type EvidenceItem as AlloyEvidenceItem,
  type DecisionCardProps,
} from "./alloy-decision-card";
export {
  OutcomeFeedbackBar,
  OutcomeFeedbackCard,
  OutcomeDashboard,
  InlineFeedbackBar,
  type OutcomeDecision,
  type OutcomeFeedbackProps,
  type OutcomeFeedbackBarProps,
  type OutcomeDashboardProps,
  type InlineFeedbackBarProps,
} from "./outcome-feedback";

export {
  AtlasArtifactCard,
  AtlasArtifactViewer,
  AtlasArtifactPanel,
  type AtlasArtifactMeta,
  type AtlasArtifactFull,
  type AtlasArtifactSection,
  type AtlasArtifactCardProps,
  type AtlasArtifactViewerProps,
  type AtlasArtifactPanelProps,
  type AtlasTemplateType,
  type AtlasExportFormat,
} from "./atlas-artifact-panel";

export { FeatureFlagGate, type FeatureFlagGateProps } from "./feature-flag-gate";
export { AnalyticsProvider, useAnalytics } from "./analytics-provider";
export { useFeatureFlag, type FeatureFlag } from "./hooks";

export {
  OperationalStatusBadge,
  OperationalRiskBadge,
  OperationalApprovalBadge,
  OperationalOwnerChip,
  OperationalEvidencePanel,
  OperationalAuditTimeline,
  OperationalEscalationPanel,
  OperationalDetailPane,
  OperationalQueueRow,
  getStatusConfig,
  getRiskConfig,
  getApprovalConfig,
  riskScoreToLevel,
  severityToRiskLevel,
  isTerminalStatus,
  formatAgo,
  formatDuration,
  STATUS_CONFIGS,
  RISK_CONFIGS,
  APPROVAL_CONFIGS,
  type OperationalStatus,
  type RiskLevel,
  type ApprovalState,
  type ActorType,
  type OperationalOwner,
  type EvidenceItem as OperationalEvidenceItem,
  type AuditHistoryEntry,
  type EscalationPath,
  type NextAction,
  type OperationalEntity,
  type StatusConfig,
} from "./operational-primitives";
export { DigitalTwinCard, type TwinCardProps, type TwinAlert, type PredictedState } from "./digital-twin-card";
export {
  KnowledgeGraphViz,
  HierarchicalGraphViz,
  TimelineGraphViz,
  UnifiedKnowledgeGraphViz,
  GraphLegend,
  NodeDetailPanel,
  GraphStatsCard,
  type GraphVizNode,
  type GraphVizEdge,
  type KnowledgeGraphData,
  type KnowledgeGraphVizProps,
  type HierarchicalGraphVizProps,
  type TimelineGraphVizProps,
  type UnifiedKnowledgeGraphVizProps,
  type GraphLayout,
  type GraphLegendProps,
  type NodeDetailPanelProps,
  type GraphStatsCardProps,
} from "./knowledge-graph-viz";

export {
  EcosystemNav,
  useEcosystemNotifications,
  trackRecentItem,
  type EcosystemApp,
  type EcosystemNotification,
  type EcosystemNavProps,
  type BreadcrumbItem,
  type RecentItem,
} from "./ecosystem-nav";

export {
  ProbabilityDensityPlot,
  CumulativeDistributionCurve,
  TornadoDiagram,
  ScenarioComparisonMatrix,
  ConfidenceBandChart,
  SimulationResultCard,
  SimulationProgressTracker,
  type HistogramBucket,
  type CDFPoint,
  type DistributionStats,
  type TornadoEntry,
  type ScenarioComparisonItem,
} from "./monte-carlo-viz";

export {
  SyncStatusBadge,
  SyncStatusBar,
  type SyncStatusBadgeProps,
  type SyncStatusBarProps,
  type SyncState,
} from "./sync-status-badge";

export {
  useWebSyncStatus,
  type WebSyncStatusOptions,
  type WebSyncStatus,
} from "./use-web-sync-status";

export {
  useCrdtEntity,
  type UseCrdtEntityOptions,
  type UseCrdtEntityResult,
  type CrdtMergeEvent,
  type EntitySchema as CrdtEntitySchema,
  type FieldSchema as CrdtFieldSchema,
} from "./use-crdt-entity";

export { MergeNotification, type MergeNotificationProps } from "./merge-notification";

export { CrdtEntityPanel, type CrdtEntityPanelProps } from "./crdt-entity-panel";
export {
  registerWebPush,
  unregisterWebPush,
  checkWebPushSupport,
  registerServiceWorker,
  getVapidPublicKey,
  type WebPushRegistrationOptions,
} from "./web-push-registration";

export {
  AmbientBar,
  useAmbientIntelligence,
  type AmbientSignal,
  type AmbientBarProps,
  type AmbientIntelligenceConfig,
} from "./ambient-intelligence";

export {
  EnergyPulse,
  useEnergyHeartbeat,
  type EnergyMetrics,
  type EnergyHeartbeatConfig,
  type EnergyPulseProps,
} from "./energy-heartbeat";

export {
  DecisionShieldPanel,
  useDecisionShield,
  type DecisionItem,
  type DecisionShieldSummary,
  type DecisionShieldPanelProps,
} from "./decision-shield";

export {
  StakeholderLensProvider,
  StakeholderLensSwitcher,
  StakeholderContent,
  useStakeholderLens,
  STAKEHOLDER_VIEWS,
  type StakeholderView,
  type StakeholderLensConfig,
  type StakeholderLensSwitcherProps,
} from "./stakeholder-lens";

export {
  CorrelationFeed,
  type CrossDomainCorrelation,
  type CorrelationFeedProps,
} from "./cross-domain-correlation";

export {
  CortexVoice,
  CortexVoiceTrigger,
  useCortexVoice,
  type CortexVoiceProps,
  type CortexIntent,
  type CortexResult,
} from "./cortex-voice";

export {
  MorningBriefingCard,
  BriefingHistory,
  DEMO_BRIEFING_HISTORY,
  type DailyBriefing,
  type BriefingSignal,
} from "./morning-briefing";

export {
  SessionPresenceBar,
  EntityCommentThread,
  MultiplayerSessionBanner,
  type SessionParticipant,
  type SessionComment,
  type MultiplayerSessionProps,
} from "./multiplayer-session";

export { MicroFeedbackWidget, type MicroFeedbackWidgetProps, type FeedbackPayload, type FeedbackSentiment } from "./micro-feedback-widget";

export {
  CortexIntelligenceFeed,
  type CortexIntelligenceFeedProps,
  type IntelligenceSignal,
  type CortexFeedStats,
  type CortexSignal,
} from "./cortex-intelligence-feed";

export {
  CortexEntityGraph,
  type CortexEntityGraphProps,
  type EntityGraphNode,
  type EntityGraphEdge,
  type EntityGraphMeta,
} from "./cortex-entity-graph";

export {
  ConstellationGraph,
  type ConstellationGraphProps,
  type ConstellationGraphNode,
  type ConstellationGraphEdge,
  type ConstellationGraphStats,
  type ConstellationGraphResponse,
} from "./constellation-graph";

export {
  CortexActionDrafts,
  type CortexActionDraftsProps,
  type ActionDraft,
  type ActionDraftType,
  type ActionDraftStatus,
  type ActionDraftPriority,
} from "./cortex-action-drafts";

export {
  CortexWhatIf,
  type CortexWhatIfProps,
  type WhatIfResult,
  type WhatIfCascade,
} from "./cortex-what-if";
export * from "./settings-shell";
export * from "./use-user-prefs";
export * from "./onboarding";
export { LiveClock, type LiveClockProps } from "./live-clock";
export { AnimatedCounter, type AnimatedCounterProps } from "./animated-counter";
export { useInterval } from "./use-interval";

export {
  ProofPanel,
  ProofPanelBadge,
  ProofPanelRow,
  type ProofPanelData,
  type ProofPanelProps,
  type ProvenanceSourceClass,
  type ProofReviewState,
  type ProofExportSafetyState,
  type ProofInputSource,
} from "./proof-panel";

export {
  PolicyResult,
  PolicyResultBanner,
  PolicyTimelineEntry,
  type PolicyDecisionRecord,
  type PolicyResultProps,
  type PolicyEffect,
} from "./policy-result";

export {
  SimulationCockpit,
  SimulationCockpitCompact,
  type SimulationCockpitProps,
  type SimulationScenario,
  type ScenarioRange,
  type SensitivityDriver,
  type PredictedVsActual,
} from "./simulation-cockpit";

export {
  AdminAuditTrail,
  type AdminAuditTrailProps,
  type AuditTrailEntry,
  type AuditActorType,
  type AuditActionType,
} from "./admin-audit-trail";

export {
  DecisionReceiptCard,
  DecisionReceiptBadge,
  type DecisionReceiptData,
  type DecisionReceiptCardProps,
  type AiRecommendation as DecisionAiRecommendation,
  type Alternative as DecisionAlternative,
} from "./decision-receipt-card";

// ─── OS Layer ────────────────────────────────────────────────────────────────
export * from "./os-layer";
export {
  PolicyVerdictBadge,
  type PolicyVerdictBadgeProps,
} from "./PolicyVerdictBadge";
export {
  AutonomyDial,
  type AutonomyDialProps,
} from "./AutonomyDial";
export {
  SourceHealthStrip,
  SourceHealthPill,
  FreshnessPill,
  type SourceHealthStripProps,
  type SourceHealthPillProps,
  type FreshnessPillProps,
} from "./SourceHealthStrip";
export {
  DecisionCenter,
  RecommendationCard,
  type DecisionCenterProps,
  type RecommendationCardProps,
} from "./DecisionCenter";
export {
  RunConsole,
  RunDetailPanel,
  EvalsStrip,
  type RunConsoleProps,
  type RunDetailProps,
  type EvalsStripProps,
  type EvalResult,
} from "./RunConsole";
