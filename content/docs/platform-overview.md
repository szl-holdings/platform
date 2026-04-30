# Platform Overview — SZL Holdings

## Company Architecture

SZL Holdings is the parent company operating eight domain vertical platforms sharing a common operating spine.

### Product Family

| Product | Domain | Purpose |
|---------|--------|---------|
| **Lyte** | Business Observability | Executive command plane — see everything, decide fast |
| **Alloy** | Execution Fabric | Workflow orchestration with human-in-the-loop governance |
| **Aegis** | Defense & Intelligence | SOC operations, threat intel, incident response |
| **Sentra** | Cyber Resilience | Cyber posture management, recovery readiness, incident command |
| **Terra** | Real Estate | Portfolio intelligence, distress detection, deal tracking |
| **Vessels** | Maritime | Fleet command, voyage economics, compliance monitoring |
| **Counsel** | Legal Matter Command | Matter tracking, obligation mapping, legal exposure management |
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
- **798 database tables** across all domains
- **2,816 API endpoints** with auth middleware
- **14 registered artifacts** (11 web + 1 mobile + 1 video + 1 design)
- **23 GitHub CI/CD workflows** with security scanning
- **TypeScript throughout** — full type safety

## Surface Map
- **Web apps**: szl-holdings, lyte-command-center, sentra, aegis, terra, vessels, carlota-jo, counsel, pulse, command, api-server
- **Mobile**: szl-holdings-mobile (Expo / React Native — iOS + Android)
- **Admin**: /admin/* for platform administration
- **Public**: /insights, /link-in-bio, /newsletter, /trust, /docs
