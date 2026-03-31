# SZL Holdings — Salesforce AppExchange OAuth & Data Mapping

## OAuth Flow

SZL Holdings uses **Named Credentials** with the Connected App OAuth 2.0 flow. No user passwords are stored by the package.

### Connected App Settings

| Setting | Value |
|---------|-------|
| OAuth Scopes | `api`, `refresh_token` |
| Callback URL | `https://login.salesforce.com/services/oauth2/callback` |
| Token Lifetime | Access: 2h; Refresh: none (rotate on use) |
| IP Relaxation | Enforce IP restrictions |
| Certificate | SHA-256, 2048-bit RSA |

### Token Storage

Tokens are stored in the **Named Credential** vault (`SZL_API_NC`). The package never reads or stores OAuth tokens in custom objects, Apex variables (beyond the callout request), or debug logs.

## Data Mapping

### Objects Read by the Package

| Salesforce Object | Fields Read | Purpose |
|-------------------|-------------|---------|
| `Opportunity` | `Id, Name, StageName, CloseDate, Amount, AccountId` | Workflow trigger payload |
| `Account` | `Id, Name, Industry` | Context enrichment |
| `User` | `Id, Name, Email` | Audit identity |

### Objects Written by the Package

| Salesforce Object | Fields Written | Purpose |
|-------------------|----------------|---------|
| `SZL_Workflow_Log__c` | `WorkflowId__c, Status__c, ErrorMessage__c, RunId__c` | Execution audit trail |

### Data Sent to SZL API

| Field | Source | Classification |
|-------|--------|----------------|
| `recordId` | `Opportunity.Id` | Internal identifier |
| `recordType` | Hardcoded `"Opportunity"` | Metadata |
| `orgId` | Named Credential principal | Internal identifier |
| `workflowId` | Custom metadata | Configuration |
| `stage` | `Opportunity.StageName` | Business data |

### Data Received from SZL API

| Field | Stored To | Classification |
|-------|-----------|----------------|
| `runId` | `SZL_Workflow_Log__c.RunId__c` | Internal identifier |
| `status` | `SZL_Workflow_Log__c.Status__c` | Status metadata |
| `errorMessage` | `SZL_Workflow_Log__c.ErrorMessage__c` | Diagnostic text |

## Data Retention

- Workflow logs (`SZL_Workflow_Log__c`) are retained per the customer's Salesforce data retention policy.
- SZL API stores run records for 90 days, then archives to cold storage.
- No Salesforce field data is persisted beyond the immediate callout; only identifiers are retained.

## Deletion Compliance

- Customers can delete `SZL_Workflow_Log__c` records via Salesforce data management.
- To purge SZL API run history, contact support@szlholdings.com with the orgId.
