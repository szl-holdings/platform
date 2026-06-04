# Platform Overview — SZL Holdings

## Company Architecture

SZL Holdings is the parent company operating six vertical platforms sharing a common operating spine.

### Product Family

| Product | Domain | Purpose |
|---------|--------|---------|
| **Lyte** | Business Observability | Executive command plane — see everything, decide fast |
| **Alloy** | Execution Fabric | Workflow orchestration with human-in-the-loop governance |
| **Aegis** | Defense & Intelligence | SOC operations, threat intel, incident response |
| **Terra** | Real Estate | Portfolio intelligence, distress detection, deal tracking |
| **Vessels** | Maritime | Fleet command, voyage economics, compliance monitoring |
| **Carlota Jo** | Advisory | Premium advisory services for high-net-worth clients |

### Shared Operating Spine

Every product shares:
- **Evidence-backed AI**: Decisions are grounded in retrieved evidence, not hallucinations
- **Policy-gated execution**: Every AI action passes through policy checks before execution
- **Human-in-the-loop approval**: Critical actions require human approval
- **Immutable audit trail**: Every decision, action, and approval is permanently logged
- **Role-based access**: Granular permissions per user and organization

### Distribution OS
The SZL Holdings platform includes a built-in content publishing and distribution system:
- Articles CMS, Newsletter management, Carousel Lab
- X Studio, Campaign/UTM management, Lead tracking
- Content Calendar, Analytics, Automations
- Public link-in-bio and newsletter subscription pages

## Technical Foundation
- **442 PostgreSQL tables** across all domains
- **1,618 API endpoints** with auth middleware
- **16 deployed applications** (8 web + 8 mobile)
- **14 GitHub CI/CD workflows** with security scanning
- **TypeScript throughout** — full type safety

## Surface Map
- **Web apps**: szl-holdings, lyte-command-center, firestorm (Aegis), terra, vessels, carlota-jo, stephen-site
- **Mobile apps**: Matching Expo apps for each product
- **Admin**: /admin/* for platform administration
- **Public**: /insights, /link-in-bio, /newsletter, /trust, /docs
