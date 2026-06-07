# SZL Holdings — Database Schema Inventory

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Scope:** All schema files in `lib/db/src/schema/`

---

## Summary

| Metric | Value |
|---|---|
| Total schema files | 165 |
| ORM | Drizzle ORM v0.45.2 |
| Database | PostgreSQL 16 |
| Schema organization | Domain-namespaced files |
| Drizzle migrations | 115 |
| Hand-authored migrations | 24 |
| Total migrations | 139 |

---

## Schema Domain Groups

### Authentication & Authorization (3 files)
| File | Key Tables |
|---|---|
| `auth.ts` | `users`, `sessions`, `organizations`, `org_members`, `roles`, `user_roles`, `api_keys`, `mfa_secrets` |
| `scim.ts` | `scim_tokens`, `scim_groups`, `scim_users` |
| `organizations.ts` | Extended org tables |

### Alloy (AI Execution Fabric) (11 files)
| File | Key Tables |
|---|---|
| `alloy.ts` | `alloy_workflows`, `alloy_runs`, `alloy_actions` |
| `alloy_ai_decisions.ts` | `alloy_ai_decisions` |
| `alloy_autonomy_modes.ts` | `alloy_autonomy_modes` |
| `alloy_chat.ts` | `alloy_conversations`, `alloy_messages` |
| `alloy_comms.ts` | `alloy_comms`, `alloy_comms_threads` |
| `alloy_platform.ts` | `alloy_platform_config` |
| `alloy_policy_versions.ts` | `alloy_policy_versions` |
| `alloy_run_notifications.ts` | `alloy_run_notifications` |
| `alloy_runtime.ts` | `alloy_runtime_state` |
| `alloy_governance_policies.ts` | (via migration 0016) |

### Agent / AI Layer (8 files)
| File | Key Tables |
|---|---|
| `agent_mesh.ts` | `agent_mesh_nodes`, `agent_mesh_edges` |
| `agent_os.ts` | `agent_os_state` |
| `agent_skills.ts` | `agent_skills`, `agent_skill_assignments` |
| `agent_training.ts` | `agent_training_runs` |
| `ai_evals.ts` | `ai_eval_runs`, `ai_eval_results` |
| `aef_profiles.ts` | AEF agent profiles |
| `ml_pipeline.ts` | `ml_pipeline_runs` |
| `knowledge_graph.ts` | `knowledge_graph_nodes`, `knowledge_graph_edges` |

### Aegis / Security (6 files)
| File | Key Tables |
|---|---|
| `aegis_modules.ts` | `aegis_modules`, `aegis_module_configs` |
| `ot_ics.ts` | `ot_ics_assets`, `ot_ics_events` |
| `msp.ts` | `msp_clients`, `msp_alerts` |
| `msp_rmm.ts` | `msp_rmm_agents`, `msp_rmm_alerts` |
| `signal_mesh.ts` | `signal_mesh_sources`, `signal_mesh_events` |

### Vessels / Maritime (5 files)
| File | Key Tables |
|---|---|
| `vessels.ts` | `vessels`, `vessel_voyages`, `vessel_positions` |
| `vessels_bol.ts` | `vessels_bills_of_lading` |
| `vessels_intelligence.ts` | `vessels_intel_reports` |
| `vessels_product.ts` | `vessels_product_records` |
| `vessels_trading.ts` | `vessels_trading_orders` |
| `maritime.ts` | `maritime_ports`, `maritime_routes` |
| `marine_insurance.ts` | `marine_insurance_policies` |

### Terra / Real Estate (2 files)
| File | Key Tables |
|---|---|
| `terra.ts` | `terra_properties`, `terra_distress_events`, `terra_deals` |
| `terra-portfolio-modules.ts` | Pro forma, waterfall, lease abstraction, 1031 exchange |

### PRISM Counsel / Legal (11 files)
| File | Key Tables |
|---|---|
| `prism_counsel.ts` | Core matter management |
| `prism_counsel_gc.ts` | General counsel operations |
| `prism_counsel_ny.ts` | New York-specific courts |
| `prism_counsel_omega.ts` | Omega matter operations |
| `prism_counsel_ops.ts` | Operational tables |
| `prism_counsel_p2.ts` | Phase 2 tables |
| `prism_counsel_pilot.ts` | Pilot operations |
| `prism_counsel_pilot_one.ts` | Pilot one-specific |
| `prism_counsel_purview.ts` | Purview integration |
| `prism_counsel_recovery.ts` | Recovery operations |
| `prism_counsel_review.ts` | Review workflows |
| `prism_counsel_s31.ts` | S31 matter tables |
| `prism_counsel_p2_graphql_subgraph.ts` | GraphQL subgraph |

### Lyte / Decision Intelligence (3 files)
| File | Key Tables |
|---|---|
| `lyte.ts` | `lyte_dashboards`, `lyte_signals`, `lyte_recommendations` |
| `lyte_product.ts` | `lyte_product_configs` |
| `lyte_surfaces.ts` | `lyte_surface_configs` |

### Platform Core (15 files)
| File | Key Tables |
|---|---|
| `platform_events.ts` | `platform_events` |
| `platform_ops.ts` | `platform_ops_records` |
| `platform_status.ts` | `platform_status_checks` |
| `analytics.ts` | `analytics_events` |
| `audit_logs.ts` | `audit_logs` |
| `audit_chain_events.ts` | `audit_chain_events` |
| `proof_chain.ts` | `proof_chain_events` |
| `notifications.ts` | `notifications`, `notification_preferences` |
| `approvals.ts` | `approval_requests`, `approval_decisions` |
| `billing.ts` | `billing_invoices`, `billing_subscriptions` |
| `metering.ts` | `usage_metering_events` |
| `settings.ts` | `platform_settings` |
| `job_queue.ts` | `job_queue` |
| `reports.ts` | `reports` |
| `projects.ts` | `projects` |

### Atlas / Scene Export (4 files)
| File | Key Tables |
|---|---|
| `atlas_artifacts.ts` | `atlas_artifacts` |
| `atlas_runs.ts` | `atlas_runs` |
| `atlas_spatial_runtime.ts` | `atlas_spatial_runtime_nodes` |
| `apps_registry.ts` | `apps_registry` |

### Memory / Cognitive (4 files)
| File | Key Tables |
|---|---|
| `memory_fabric.ts` | `memory_fabric_entries` |
| `nexus_memory.ts` | `nexus_memory_entries` |
| `nexus_state.ts` | `nexus_state_records` |
| `nuro_mesh.ts` | `nuro_mesh_nodes` |

### Other Domains (misc)
| File | Domain | Notes |
|---|---|---|
| `a2a.ts` | Agent-to-Agent federation | |
| `activity.ts` | User activity tracking | |
| `azure_tenants.ts` | Azure tenant management | |
| `carlota_time_billing.ts` | Carlota Jo billing | |
| `outcome_graph.ts` | Decision outcome tracking | |
| `simulation.ts` | Scenario simulation | |
| `trace_graph.ts` | Distributed trace graph | |
| `worldline.ts` | Timeline/worldline events | |
| `stephen.ts` | ⚠️ Legacy — personal site tables? | Likely dead |
| `stephen_site.ts` | ⚠️ Legacy — personal site? | Likely dead |

---

## Dead / Legacy Tables (Flagged)

| File | Assessment | Recommended Action |
|---|---|---|
| `stephen.ts` | Appears to be personal site tables unrelated to SZL platform | Flag for deletion; verify no active references |
| `stephen_site.ts` | Same as above | Flag for deletion |

---

## Schema Confidence Assessment

| Domain | Coverage | FK Discipline | Index Coverage | Notes |
|---|---|---|---|---|
| Auth | High | ✅ | ✅ | Well-defined; all foreign keys explicit |
| Alloy | High | ✅ | ✅ | Comprehensive workflow tracking |
| Vessels | Medium | ⚠️ | ⚠️ | New modules recently added; FK coverage may be incomplete |
| Terra | High | ✅ | ✅ | Portfolio module tables well-structured |
| PRISM Counsel | Medium | ✅ | ⚠️ | 11 files for one domain — consolidation opportunity |
| Lyte | High | ✅ | ✅ | Clean domain |
| Platform Core | High | ✅ | ✅ | Audit chain well-indexed |
| Security / Aegis | Medium | ⚠️ | ⚠️ | MSP and OT tables need index review |
| Legacy (stephen*) | Low | Unknown | Unknown | Dead tables — remove |

---

*Index and query risk details: `audit/db/indexing-and-query-risk.md`*  
*Migration integrity: `audit/db/migration-integrity.md`*  
*Tenant isolation: `audit/db/tenant-isolation-audit.md`*
