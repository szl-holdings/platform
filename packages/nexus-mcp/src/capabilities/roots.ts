/**
 * NEXUS MCP — Roots Capability
 *
 * Defines tenant-scoped filesystem boundary constraints for connected MCP
 * clients. Roots are governed by the existing tenant isolation policy:
 * - Each tenant is confined to their org-scoped storage prefix
 * - Cross-tenant file access is blocked at the roots enforcement layer
 * - Super admins receive expanded roots that include the shared evidence corpus
 */

import type { TenantContext } from '../server.js';

export interface NexusRoot {
  uri: string;
  name?: string;
}

/**
 * Build the tenant-appropriate roots list based on the caller's context.
 * Connected clients that support Roots are expected to confine their
 * filesystem operations to these URIs.
 */
export function buildTenantRoots(ctx: TenantContext): NexusRoot[] {
  const roots: NexusRoot[] = [];

  if (!ctx.tenantId) {
    // Unauthenticated connections get read-only access to public schemas only
    return [
      { uri: 'szl://public/schemas/', name: 'Public Schema Catalog' },
    ];
  }

  // Tenant-scoped storage root
  roots.push({
    uri: `szl://tenants/${ctx.tenantId}/`,
    name: 'Tenant Storage Root',
  });

  // Org-scoped artifact root
  if (ctx.orgId) {
    roots.push({
      uri: `szl://orgs/${ctx.orgId}/artifacts/`,
      name: 'Organization Artifacts',
    });
    roots.push({
      uri: `szl://orgs/${ctx.orgId}/evidence/`,
      name: 'Evidence Corpus',
    });
  }

  // Domain-specific roots
  if (ctx.domain) {
    roots.push({
      uri: `szl://domains/${ctx.domain}/shared/`,
      name: `${ctx.domain} Shared Resources`,
    });
  }

  // Super admins get access to the global evidence corpus and audit trail
  if (ctx.roles?.includes('super_admin') || ctx.roles?.includes('admin')) {
    roots.push({
      uri: 'szl://global/evidence/',
      name: 'Global Evidence Corpus (Admin)',
    });
    roots.push({
      uri: 'szl://global/audit/',
      name: 'Audit Trail (Admin Read-Only)',
    });
  }

  return roots;
}
