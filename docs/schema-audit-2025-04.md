# Database Schema Dead Table Audit — April 2025

**Generated:** 2025-04-15
**Scope:** All 88 schema files in `lib/db/src/schema/`
**Total tables found:** 577
**Tables with references in api-server src:** 462
**Tables with no direct references in api-server src:** 115

## Methodology

Searched `artifacts/api-server/src/**/*.ts` (excluding schema files themselves) for each table name.
A "no reference" finding means the table name does not appear in any route, service, or lib file
within the api-server package. Tables may still be referenced in:
- Frontend code (artifacts/*/src/)
- Other lib packages (lib/db, lib/services, lib/ai-engine, etc.)
- Drizzle relation files

**These tables should NOT be deleted without a full cross-package audit.**

## Tables With No Direct Reference in api-server src

> ⚠️ Review before any deletion. Some may be used in frontend queries, migrations, or lib packages.

### A2A / Agent Protocol
- `a2aAgentCards`
- `a2aAgentHeartbeats`
- `a2aDelegationTasks`
- `a2aDiscoveryQueries`
- `a2aTaskLog`

### Agent Infrastructure
- `agentDecisionTraces`
- `agentKernelAuditLog`
- `agentKnowledgeTable`
- `agentRunsTable`
- `agentScopeCertificates`
- `agentSpendRecords`
- `agentTrajectories`

### Alloy (AI Operating System)
- `alloyCaseMemory`
- `alloyChatAdvisories`
- `alloyChatComparisons`
- `alloyChatKbDocuments`
- `alloyConversationSummaries`
- `alloyEvidenceIndex`

### Auth / API Keys
- `apiKeysTable`

### Approvals
- `approvalAuditTrailTable`
- `approvalCommentsTable`
- `approvalRequestsTable`
- `approvalsTable`

### Apps Registry
- `appsRegistryTable`

### Commodity Trading
- `commodityTradingFillsTable`
- `commodityTradingInstrumentsTable`
- `commodityTradingOrdersTable`
- `commodityTradingPositionsTable`

### Creative Workflows (Dreamscape)
- `dreamscapeAssetsTable`
- `dreamscapeProjectsTable`

### Entities (Graph)
- `entitiesTable`
- `entityMetadataTable`
- `entityRelationshipsTable`
- `entityTagsTable`

### Aegis / Firestorm
- `findingsTable`
- `firestormAnalyticsTable`
- `firestormCampaignsTable`
- `firestormLeadsTable`

### Vessels / Fleet
- `fleetsTable`
- `vesselAlertsTable`
- `vesselEventsTable`
- `vesselReportsTable`
- `vesselsAssetsTable`
- `szlVesselsTable`
- `szlVoyagesTable`

### Health Checks
- `healthChecksTable`

### Aegis Intel (INCA)
- `incaAlertsTable`
- `incaReportsTable`

### Investigation / Analysis
- `investigationItemsTable`
- `investigationsTable`
- `journeysTable`

### Marine Insurance
- `marineInsuranceClaimsTable`
- `marineInsurancePoliciesTable`
- `marineInsuranceQuotesTable`

### AI Research
- `multiHypothesisSessionsTable`

### Organizations
- `organizationMembershipsTable`

### Counsel (Pilot / Extended)
- `pcApprovalEvidenceTable`
- `pcApprovalStepsTable`
- `pcExportReadinessSnapshotsTable`
- `pcFeatureFlagsTable`
- `pcGraphqlAuditLogsTable`
- `pcGraphqlAuditTagsTable`
- `pcInconsistencyFlagsTable`
- `pcM365CalendarEventsTable`
- `pcM365SharepointFilesTable`
- `pcM365TeamsMessagesTable`
- `pcManagedReviewMetricsTable`
- `pcManagedReviewSlasTable`
- `pcMatterTagsTable`
- `pcMatterTwinSubpagesTable`
- `pcMovementOpportunitySnapshotsTable`
- `pcOrgRolesTable`
- `pcPartnerActionRequestsTable`
- `pcPartnerDigestRunsTable`
- `pcPartnerInterventionEventsTable`
- `pcPartnerPortfolioSnapshotsTable`
- `pcPersistedQueriesTable`
- `pcPortfolioForecastsTable`
- `pcPressureWatchlistTable`
- `pcPrivilegeFlagsTable`
- `pcRecoveryAmountMarkersTable`
- `pcRecoveryDependencyLinksTable`
- `pcRecoveryDocumentsTable`
- `pcRecoveryFollowupsTable`
- `pcRecoveryItemsTable`
- `pcRecoveryPartiesTable`
- `pcRecoveryRiskSnapshotsTable`
- `pcRecoveryStatusHistoryTable`
- `pcReviewBacklogSnapshotsTable`
- `pcSchemaRegistryTable`
- `pcSettlementBlockerActionsTable`
- `pcSettlementBlockerDriversTable`
- `pcSettlementBlockerSnapshotsTable`
- `pcSettlementBlockersTable`
- `pcSignalQualityScoresTable`
- `pcSignoffBacklogSnapshotsTable`
- `pcWorldlineSourceClassesTable`

### Platform Events
- `platformEventsTable`

### Signals
- `signalsTable`

### SZL Canonical / Platform
- `szlActionsTable`
- `szlApprovalsTable`
- `szlArtifactsTable`
- `szlCommentsTable`
- `szlEventLogTable`
- `szlExceptionsTable`
- `szlPortsTable`
- `szlProductsTable`
- `szlReadinessItemsTable`
- `szlRoutesTable`
- `szlSignalsTable`
- `szlWorkflowRunsTable`
- `szlWorkflowsTable`

### Worldline / Distribution OS
- `workflowBudgets`
- `worldlineFetchLogsTable`
- `worldlineSignalPublicationsTable`

## Recommendation

1. **Do not delete** any tables in this list without a full cross-package search
2. Many `pc*` tables (Counsel) are likely used via the GraphQL subgraph or pilot API layers
3. `szl*` canonical tables may be used by the platform monitoring layer
4. The `a2a*` tables are newly added (post-merge) and will be populated by the A2A protocol routes
5. Schedule a follow-up task to: (a) verify frontend usage, (b) check lib package usage, (c) delete truly dead tables with migration rollback plan
