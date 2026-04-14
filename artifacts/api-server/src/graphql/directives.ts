/**
 * GraphQL Schema Auth Directives & Audit Middleware
 *
 * Implements field-level authorization and audit tagging for the GraphQL schema:
 * - applyAuthDirectives — wraps resolvers to enforce role/tenant checks
 * - auditSensitiveMutation — middleware that logs sensitive mutation access
 *
 * Rather than using SDL directive transform (which requires @graphql-tools/utils),
 * these helpers work directly with the resolver map, making them compatible with
 * the existing makeExecutableSchema setup.
 */

import { logger } from "../lib/logger.js";

export const directiveTypeDefs = `#graphql
  directive @requireRole(roles: [String!]!) on FIELD_DEFINITION
  directive @tenantOnly on FIELD_DEFINITION
  directive @auditSensitive(actionClass: String) on FIELD_DEFINITION | OBJECT
  directive @requireApproval(actionClass: String!) on FIELD_DEFINITION
`;

export type GraphQLContext = {
  req?: {
    user?: { id?: number; roles?: string[]; orgs?: Array<{ orgId: number }> };
    correlationId?: string;
    headers?: Record<string, string | string[] | undefined>;
  };
};

function getUserRoles(context: GraphQLContext): string[] {
  return context?.req?.user?.roles ?? [];
}

function getUserOrgIds(context: GraphQLContext): number[] {
  return context?.req?.user?.orgs?.map(o => o.orgId) ?? [];
}

function isAdmin(context: GraphQLContext): boolean {
  return getUserRoles(context).some(r => ["super_admin", "admin"].includes(r));
}

/**
 * Wraps a resolver to require one of the specified roles.
 */
export function requireRole<TSource, TArgs, TContext extends GraphQLContext>(
  roles: string[],
  resolver: (source: TSource, args: TArgs, context: TContext, info: unknown) => unknown,
) {
  return async (source: TSource, args: TArgs, context: TContext, info: unknown) => {
    const user = context?.req?.user;
    if (!user) throw new Error("AUTHENTICATION_REQUIRED");
    const userRoles = getUserRoles(context);
    if (!roles.some(r => userRoles.includes(r))) {
      throw new Error(`PERMISSION_DENIED: requires one of [${roles.join(", ")}]`);
    }
    return resolver(source, args, context, info);
  };
}

/**
 * Wraps a resolver to require tenant scope (non-empty org membership).
 */
export function requireTenantScope<TSource, TArgs, TContext extends GraphQLContext>(
  resolver: (source: TSource, args: TArgs, context: TContext, info: unknown) => unknown,
) {
  return async (source: TSource, args: TArgs, context: TContext, info: unknown) => {
    if (!isAdmin(context) && getUserOrgIds(context).length === 0) {
      throw new Error("TENANT_SCOPE_REQUIRED: No organization membership");
    }
    return resolver(source, args, context, info);
  };
}

/**
 * Wraps a resolver to log sensitive field access as an audit event.
 */
export function auditField<TSource, TArgs, TContext extends GraphQLContext>(
  actionClass: string,
  resolver: (source: TSource, args: TArgs, context: TContext, info: unknown) => unknown,
) {
  return async (source: TSource, args: TArgs, context: TContext, info: unknown) => {
    const user = context?.req?.user;
    const correlationId = context?.req?.correlationId;
    const fieldName = (info as { fieldName?: string })?.fieldName;

    logger.info({
      msg: "GraphQL sensitive field accessed",
      actionClass,
      field: fieldName,
      userId: user?.id,
      correlationId,
    });

    try {
      const { writeEnrichedAudit } = await import("@szl-holdings/audit");
      await writeEnrichedAudit({
        orgId: user?.orgs?.[0]?.orgId ?? null,
        userId: user?.id ?? null,
        action: actionClass,
        resourceType: "graphql_field",
        resourceId: fieldName,
        correlationId,
        serviceAttribution: "graphql",
        adminActionClass: "security_action",
      });
    } catch {
    }

    return resolver(source, args, context, info);
  };
}

/**
 * Wraps a resolver to enforce approval gate.
 * In development/test, bypasses the check.
 * In production, requires approvalId in args or header.
 */
export function requireApproval<TSource, TArgs extends Record<string, unknown>, TContext extends GraphQLContext>(
  actionClass: string,
  resolver: (source: TSource, args: TArgs, context: TContext, info: unknown) => unknown,
) {
  return async (source: TSource, args: TArgs, context: TContext, info: unknown) => {
    const isDev = process.env["NODE_ENV"] === "development" || process.env["NODE_ENV"] === "test";
    const approvalId = args?.approvalId ?? context?.req?.headers?.["x-approval-id"];
    const user = context?.req?.user;

    if (!approvalId && !isDev) {
      logger.warn({
        msg: "GraphQL @requireApproval: no approvalId",
        actionClass,
        userId: user?.id,
      });
      throw new Error(`APPROVAL_REQUIRED: Action '${actionClass}' requires an approved approvalId`);
    }

    return resolver(source, args, context, info);
  };
}

/**
 * GraphQL context audit middleware — logs every mutation field access to the audit trail.
 * Attach to sensitive mutations using auditField() wrapper.
 */
export async function auditMutationContext(
  context: GraphQLContext,
  mutationName: string,
  resourceType: string,
  resourceId?: string,
): Promise<void> {
  try {
    const user = context?.req?.user;
    const { writeEnrichedAudit } = await import("@szl-holdings/audit");
    await writeEnrichedAudit({
      orgId: user?.orgs?.[0]?.orgId ?? null,
      userId: user?.id ?? null,
      action: mutationName,
      resourceType,
      resourceId,
      correlationId: context?.req?.correlationId,
      serviceAttribution: "graphql",
      adminActionClass: "system_action",
    });
  } catch {
  }
}
