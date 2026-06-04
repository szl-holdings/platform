# Event Taxonomy — SZL Holdings Product Analytics

## Naming Convention
```
{domain}.{object}.{action}
```
Examples: `auth.session.started`, `terra.property.viewed`, `alloy.workflow.approved`

## Core Platform Events

### Authentication
| Event | Category | When Fired |
|-------|----------|-----------|
| auth.session.started | auth | User signs in |
| auth.session.ended | auth | User signs out |
| auth.session.expired | auth | Session timeout |

### Navigation
| Event | Category | When Fired |
|-------|----------|-----------|
| nav.page.viewed | navigation | Route change |
| nav.search.used | navigation | Search executed |
| nav.filter.applied | navigation | Filter changed |
| nav.tab.switched | navigation | Tab changed |

### Entity Interactions
| Event | Category | When Fired |
|-------|----------|-----------|
| entity.detail.opened | interaction | Detail page opened |
| entity.created | interaction | New record created |
| entity.updated | interaction | Record updated |
| entity.deleted | interaction | Record deleted |

### Workflow Actions
| Event | Category | When Fired |
|-------|----------|-----------|
| workflow.triggered | workflow | Workflow started |
| workflow.approved | workflow | Approval granted |
| workflow.rejected | workflow | Approval rejected |
| workflow.completed | workflow | Workflow finished |
| workflow.failed | workflow | Workflow errored |

### AI Actions
| Event | Category | When Fired |
|-------|----------|-----------|
| ai.decision.proposed | ai | AI proposed action |
| ai.decision.approved | ai | Human approved AI action |
| ai.decision.rejected | ai | Human rejected AI action |
| ai.evidence.retrieved | ai | Evidence search completed |

### Content/Distribution
| Event | Category | When Fired |
|-------|----------|-----------|
| content.article.published | content | Article published |
| content.newsletter.sent | content | Newsletter sent |
| content.lead.captured | content | Lead form submitted |
| content.cta.clicked | content | CTA button clicked |

### Support/Feedback
| Event | Category | When Fired |
|-------|----------|-----------|
| support.help.viewed | support | Help article viewed |
| support.bug.reported | support | Bug report submitted |
| support.feature.requested | support | Feature request submitted |
| feedback.survey.completed | feedback | Satisfaction survey completed |

### Export/Download
| Event | Category | When Fired |
|-------|----------|-----------|
| export.report.generated | export | Report exported |
| export.document.downloaded | export | Document downloaded |
| export.data.exported | export | Data exported |

### Errors
| Event | Category | When Fired |
|-------|----------|-----------|
| error.api.failed | error | API request failed |
| error.form.validation | error | Form validation error |
| error.page.not_found | error | 404 page hit |
| error.action.retry | error | User retried failed action |

## Domain-Specific Events

### Lyte
| Event | When Fired |
|-------|-----------|
| lyte.signal.triaged | Signal assigned/prioritized |
| lyte.escalation.triggered | Issue escalated |
| lyte.executive.summary_viewed | Executive summary accessed |

### Terra
| Event | When Fired |
|-------|-----------|
| terra.property.viewed | Property detail opened |
| terra.deal.created | New deal started |
| terra.distress.detected | Distress alert triggered |
| terra.diligence.started | Diligence prep initiated |

### Vessels
| Event | When Fired |
|-------|-----------|
| vessels.fleet.map_viewed | Fleet map opened |
| vessels.vessel.detail_viewed | Vessel detail opened |
| vessels.exception.triaged | Exception assigned |
| vessels.voyage.economics_viewed | Voyage economics opened |

### Aegis
| Event | When Fired |
|-------|-----------|
| aegis.incident.created | New incident |
| aegis.case.investigated | Case investigation started |
| aegis.threat.detected | Threat intel match |
| aegis.simulation.run | Simulation executed |

## Funnel Definitions

### Visitor → Lead
1. nav.page.viewed (any public page)
2. content.cta.clicked
3. content.lead.captured

### Lead → Demo Request
1. content.lead.captured
2. nav.page.viewed (/demo or /contact)
3. support.demo.requested

### User → Active Operator
1. auth.session.started
2. nav.page.viewed (dashboard)
3. entity.detail.opened
4. workflow.triggered or entity.updated
