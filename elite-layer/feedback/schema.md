# Feedback System Schema

## Feedback Types

| Type | Description | Intake Path |
|------|-------------|-------------|
| Bug Report | Something is broken or not working | /help/report-a-bug, support@ |
| Feature Request | Desired new functionality | /help/request-a-feature, feedback@ |
| General Feedback | Observations, suggestions, praise | /help/feedback, feedback@ |
| Product Satisfaction | Periodic satisfaction pulse | In-app survey |
| Content Feedback | Feedback on docs, articles, help content | In-content widget |
| Demo Feedback | Post-demo impressions | Post-demo form |

## Status Model

| Status | Definition | Next States |
|--------|-----------|-------------|
| new | Received, not yet reviewed | triaged, declined |
| triaged | Reviewed and categorized | planned, declined |
| planned | Added to roadmap | in-progress |
| in-progress | Being implemented | released, declined |
| released | Shipped to production | — |
| declined | Not pursuing (with reason) | — |

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | serial | auto | Unique identifier |
| type | enum | yes | bug / feature / feedback / satisfaction / content / demo |
| status | enum | yes | new / triaged / planned / in-progress / released / declined |
| title | text | yes | Brief description |
| description | text | yes | Full details |
| product | text | no | Which product (lyte / terra / vessels / aegis / carlota / szl) |
| severity | text | no | critical / high / medium / low |
| submitter_email | text | no | Who submitted it |
| assigned_to | text | no | Who owns it |
| tags | text[] | no | Lane-specific tags |
| created_at | timestamp | auto | When submitted |
| updated_at | timestamp | auto | Last update |
| resolved_at | timestamp | no | When resolved |
| decline_reason | text | no | Why declined (if applicable) |

## Tagging Model

### By Product
- `lyte`, `terra`, `vessels`, `aegis`, `carlota`, `szl`, `alloy`, `distribution`

### By Area
- `ui`, `api`, `data`, `auth`, `performance`, `mobile`, `docs`, `content`

### By Priority
- `p0-critical`, `p1-high`, `p2-medium`, `p3-low`
