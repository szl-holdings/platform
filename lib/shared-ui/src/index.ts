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
export { PrivateAppGuard, type PrivateAppGuardProps } from "./PrivateAppGuard";
export { useRole, RoleGate, type UserRoles, type AppRole } from "./use-role";
export { default as AuthGate, type AuthGateProps } from "./AuthGate";
export { EcosystemMap, ECOSYSTEM_NODES, LAYER_CONFIG, CONNECTION_PAIRS, type EcosystemNode, type EcosystemMapProps } from "./ecosystem-map";
export { CompanyKPIDashboard, DEMO_COMPANY_KPIS, type CompanyKPI, type CompanyKPIDashboardProps } from "./company-kpi-dashboard";
export { DataStateBadge, DataStateBanner, type DataState } from "./data-state-badge";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
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
export {
  OnboardingWizard,
  GettingStartedChecklist,
  OnboardingReplayButton,
  useOnboardingState,
  useChecklistState,
  type OnboardingStep,
  type OnboardingChecklistItem,
  type OnboardingConfig,
  type OnboardingWizardProps,
  type GettingStartedChecklistProps,
} from "./onboarding";
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
  type OutcomeDecision,
  type OutcomeFeedbackProps,
  type OutcomeFeedbackBarProps,
  type OutcomeDashboardProps,
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
