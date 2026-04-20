# API Catalogue — SZL Holdings DreamStack API

> **Auto-generated** from `lib/api-spec/openapi.yaml` — do not edit by hand.
> Last generated: **2026-04-17** | Spec version: **0.2.0** | Base URL: `/api`

Run `pnpm docs:generate` to refresh after editing the spec.

## Summary

| Metric | Value |
|--------|-------|
| Total paths | 75 |
| Total operations | 92 |
| Tag groups | 19 |
| Spec version | 0.2.0 |

## Table of Contents

- [health](#health) (7 endpoints)
- [ai-engine](#ai-engine) (6 endpoints)
- [projects](#projects) (5 endpoints)
- [auth](#auth) (8 endpoints)
- [connectors](#connectors) (5 endpoints)
- [notifications](#notifications) (3 endpoints)
- [audit](#audit) (2 endpoints)
- [billing](#billing) (9 endpoints)
- [feature-flags](#feature-flags) (4 endpoints)
- [files](#files) (3 endpoints)
- [Storage](#storage) (3 endpoints)
- [stephen](#stephen) (17 endpoints)
- [vessels](#vessels) (2 endpoints)
- [firestorm](#firestorm) (3 endpoints)
- [lyte](#lyte) (2 endpoints)
- [dreamscape](#dreamscape) (1 endpoint)
- [readiness](#readiness) (1 endpoint)
- [observability](#observability) (5 endpoints)
- [Auth](#auth-2) (6 endpoints)

<a id="health"></a>

## health

Health operations

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /health/ai | `aiProviderHealthCheck` | AI provider health |
| `GET` | /health/billing | `billingHealthCheck` | Billing provider health |
| `GET` | /health/detailed | `detailedHealthCheck` | Detailed health status |
| `GET` | /health/live | `livenessCheck` | Liveness probe |
| `GET` | /health/ready | `readinessCheck` | Readiness probe |
| `GET` | /health/websocket | `websocketHealthCheck` | WebSocket server health |
| `GET` | /healthz | `healthCheck` | Health check |

<a id="ai-engine"></a>

## ai-engine

Alloy AI engine — decisions, approvals, audit, retrieval

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /ai/approval-matrix | `getApprovalMatrix` | Get decision approval matrix |
| `GET` | /ai/decision | `listDecisions` | List Alloy decisions |
| `POST` | /ai/decision | `createDecision` | Create an Alloy decision |
| `GET` | /ai/decision/{id} | `getDecision` | Get a single Alloy decision |
| `POST` | /ai/decision/{id}/approve | `approveDecision` | Approve a pending Alloy decision |
| `POST` | /ai/decision/{id}/reject | `rejectDecision` | Reject a pending Alloy decision |

<a id="projects"></a>

## projects

Project operations

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /projects | `listProjects` | List all projects |
| `POST` | /projects | `createProject` | Create a new project |
| `GET` | /projects/{id} | `getProject` | Get a project by ID |
| `PATCH` | /projects/{id} | `updateProject` | Update a project |
| `DELETE` | /projects/{id} | `deleteProject` | Delete a project |

<a id="auth"></a>

## auth

Authentication and user management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /auth/login | `login` | Authenticate with a credential and receive a session token |
| `GET` | /auth/me | `getCurrentUser` | Get current authenticated user |
| `GET` | /auth/providers | `getAuthProviders` | List available authentication providers |
| `GET` | /auth/roles | `listRoles` | List all roles |
| `POST` | /auth/sessions | `createSession` | Create a new session token |
| `DELETE` | /auth/sessions/{id} | `deleteSession` | Revoke a session by ID |
| `DELETE` | /auth/sessions/current | `deleteCurrentSession` | Revoke the current session (from Authorization header) |
| `GET` | /auth/users | `listUsers` | List all users |

<a id="connectors"></a>

## connectors

Integration connector management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /connectors | `listConnectors` | List all connectors |
| `POST` | /connectors | `createConnector` | Create a new connector |
| `GET` | /connectors/{id} | `getConnector` | Get a connector by ID |
| `PATCH` | /connectors/{id} | `updateConnector` | Update a connector |
| `DELETE` | /connectors/{id} | `deleteConnector` | Delete a connector |

<a id="notifications"></a>

## notifications

Notification management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /notifications | `listNotifications` | List notifications |
| `POST` | /notifications | `createNotification` | Create a notification |
| `PATCH` | /notifications/{id}/read | `markNotificationRead` | Mark notification as read |

<a id="audit"></a>

## audit

Activity logs and audit events

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /audit/activity | `listActivityLogs` | List activity logs |
| `GET` | /audit/events | `listAuditEvents` | List audit events |

<a id="billing"></a>

## billing

Billing plans, subscriptions, and invoices

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `POST` | /billing/checkout | `createCheckoutSession` | Create a Stripe Checkout Session |
| `GET` | /billing/checkout-session/{sessionId} | `getCheckoutSession` | Get a checkout session by ID |
| `POST` | /billing/customer-portal | `createCustomerPortal` | Create a Stripe Customer Portal session |
| `GET` | /billing/invoices | `listInvoices` | List invoices |
| `GET` | /billing/plans | `listBillingPlans` | List billing plans |
| `GET` | /billing/products | `listStripeProducts` | List Stripe products with prices |
| `GET` | /billing/stripe-invoices | `listStripeInvoices` | List Stripe invoices |
| `GET` | /billing/subscription-status | `getSubscriptionStatus` | Get subscription status for a customer |
| `GET` | /billing/subscriptions | `listSubscriptions` | List subscriptions |

<a id="feature-flags"></a>

## feature-flags

Feature flag management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /feature-flags | `listFeatureFlags` | List feature flags |
| `POST` | /feature-flags | `createFeatureFlag` | Create a feature flag |
| `PATCH` | /feature-flags/{id} | `updateFeatureFlag` | Update a feature flag |
| `DELETE` | /feature-flags/{id} | `deleteFeatureFlag` | Delete a feature flag |

<a id="files"></a>

## files

File and asset management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /assets | `listAssets` | List assets |
| `GET` | /files | `listFiles` | List files |
| `GET` | /files/{id} | `getFile` | Get a file by ID |

<a id="storage"></a>

## Storage

Object storage upload and serving endpoints.

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /storage/objects/{objectPath} | `getStorageObject` | Serve an object entity from PRIVATE_OBJECT_DIR |
| `GET` | /storage/public-objects/{filePath} | `getPublicObject` | Serve a public asset from PUBLIC_OBJECT_SEARCH_PATHS |
| `POST` | /storage/uploads/request-url | `requestUploadUrl` | Request a presigned URL for file upload |

<a id="stephen"></a>

## stephen

Stephen L. portfolio site

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /stephen/booking-requests | `listStephenBookingRequests` | List booking requests |
| `POST` | /stephen/booking-requests | `createStephenBookingRequest` | Submit a booking request |
| `GET` | /stephen/case-studies | `listStephenCaseStudies` | List case studies |
| `GET` | /stephen/contacts | `listStephenContacts` | List contact submissions |
| `POST` | /stephen/contacts | `createStephenContact` | Submit a contact form |
| `GET` | /stephen/content-blocks | `listStephenContentBlocks` | List all content blocks |
| `POST` | /stephen/content-blocks | `createStephenContentBlock` | Create a content block |
| `PATCH` | /stephen/content-blocks/{id} | `updateStephenContentBlock` | Update a content block |
| `DELETE` | /stephen/content-blocks/{id} | `deleteStephenContentBlock` | Delete a content block |
| `GET` | /stephen/ecosystem-status | `getStephenEcosystemStatus` | Get ecosystem status |
| `GET` | /stephen/portfolio-case-studies | `listStephenPortfolioCaseStudies` | List portfolio case studies |
| `POST` | /stephen/portfolio-case-studies | `createStephenPortfolioCaseStudy` | Create a portfolio case study |
| `GET` | /stephen/portfolio-case-studies/{slug} | `getStephenPortfolioCaseStudy` | Get a portfolio case study by slug |
| `PATCH` | /stephen/portfolio-case-studies/{slug} | `updateStephenPortfolioCaseStudy` | Update a portfolio case study |
| `DELETE` | /stephen/portfolio-case-studies/{slug} | `deleteStephenPortfolioCaseStudy` | Delete a portfolio case study |
| `GET` | /stephen/profile | `getStephenProfile` | Get Stephen's profile data |
| `GET` | /stephen/testimonials | `listStephenTestimonials` | List testimonials |

<a id="vessels"></a>

## vessels

Vessel tracking and cargo management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /vessels | `listVessels` | List all vessels |
| `GET` | /vessels/{id} | `getVessel` | Get vessel details |

<a id="firestorm"></a>

## firestorm

Campaign and lead management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /firestorm/analytics | `listFirestormAnalytics` | List campaign analytics |
| `GET` | /firestorm/campaigns | `listFirestormCampaigns` | List campaigns |
| `GET` | /firestorm/leads | `listFirestormLeads` | List leads |

<a id="lyte"></a>

## lyte

E-commerce products and orders

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /lyte/orders | `listLyteOrders` | List orders |
| `GET` | /lyte/products | `listLyteProducts` | List products |

<a id="dreamscape"></a>

## dreamscape

Creative project management

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /dreamscape/projects | `listDreamscapeProjects` | List creative projects |

<a id="readiness"></a>

## readiness

Readiness assessments and compliance

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /readiness/assessments | `listReadinessAssessments` | List readiness assessments |

<a id="observability"></a>

## observability

Platform telemetry, web vitals, alerts, and health monitoring

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /observability | `listObservabilityApps` | List all app observability snapshots |
| `GET` | /observability/{appSlug} | `getAppObservability` | Get observability snapshot for a specific app |
| `GET` | /observability/alerts | `getActiveAlerts` | Get all active system alerts |
| `GET` | /observability/business-events | `getBusinessEvents` | Get business event counts and domain breakdown |
| `POST` | /observability/vitals | `recordWebVitals` | Record web vital metrics |

<a id="auth-2"></a>

## Auth

| Method | Path | Operation ID | Summary |
|--------|------|-------------|---------|
| `GET` | /auth/user | `getCurrentAuthUser` | Get the currently authenticated user |
| `GET` | /callback | `handleBrowserLoginCallback` | Complete the browser OIDC login flow |
| `GET` | /login | `beginBrowserLogin` | Start the browser OIDC login flow |
| `GET` | /logout | `logoutBrowserSession` | Clear the session and begin OIDC logout |
| `POST` | /mobile-auth/logout | `logoutMobileSession` | Delete a mobile session token |
| `POST` | /mobile-auth/token-exchange | `exchangeMobileAuthorizationCode` | Exchange a mobile OIDC code for a session token |

---

_This file is auto-generated. Edit `lib/api-spec/openapi.yaml` to update the spec, then run `pnpm docs:generate`._
