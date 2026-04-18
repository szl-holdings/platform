import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";

import * as tenantProvisioning from "../tenant-provisioning";
import dataverseRouter from "../dataverse";
import scimRouter from "../scim";
import orgSettingsRouter from "../org-settings";
import onboardingRouter from "../onboarding";
import invitationsRouter from "../invitations";
import tenantHealthRouter from "../tenant-health";
import unifiedSettingsRouter from "../unified-settings";
import changelogRouter from "../changelog";
import changesRouter from "../changes";
import deltaSyncRouter from "../delta-sync";
import gdprRouter from "../gdpr";
import privacyRouter from "../privacy";
import complianceRouter from "../compliance";
import approvalsRouter from "../approvals";
import proofChainRouter from "../proof-chain";
import auditChainRouter from "../audit-chain";
import worldlineRouter from "../worldline";
import auditRouter from "../audit";

const _readLimiter = perUserApiSlidingLimiter;
const _writeLimiter = perUserWriteSlidingLimiter;

export function register(router: IRouter): void {
  // Org-member–required paths: these are only accessible once a user belongs
  // to an organization. required: true returns 403 for no-org users.
  router.use("/audit", tenantScope({ required: true }));
  router.use("/tenant-health", tenantScope({ required: true }));
  router.use("/settings", tenantScope({ required: true }));
  router.use("/changelog", tenantScope({ required: true }));
  router.use("/aegis/sync", tenantScope({ required: true }));
  router.use("/vessels/sync", tenantScope({ required: true }));
  router.use("/alloy/sync", tenantScope({ required: true }));
  router.use("/compliance", tenantScope({ required: true }));
  router.use("/approvals", tenantScope({ required: true }));
  router.use("/proof-chain", tenantScope({ required: true }));
  router.use("/audit-chain", tenantScope({ required: true }));
  router.use("/worldline", tenantScope({ required: true }));
  router.use("/dataverse", tenantScope({ required: true }));

  // Bootstrap / pre-membership paths: these are used before an org is joined
  // (invitation acceptance, onboarding, password-reset). required: false resolves
  // org context when present but does not block users with zero org memberships.
  router.use("/orgs", tenantScope({ required: false }));
  router.use("/user", tenantScope({ required: false }));
  router.use("/onboarding", tenantScope({ required: false }));

  router.use("/audit", _readLimiter);
  router.use(auditRouter);

  router.use("/admin/tenants", _writeLimiter);
  tenantProvisioning.register(router);

  router.use("/dataverse", _readLimiter);
  router.use("/dataverse", dataverseRouter);

  router.use(scimRouter);

  router.use("/orgs", _readLimiter);
  router.use("/orgs", _writeLimiter);
  router.use("/user", _readLimiter);
  router.use("/user", _writeLimiter);
  router.use(orgSettingsRouter);

  router.use("/onboarding", _writeLimiter);
  router.use(onboardingRouter);

  router.use("/orgs", _writeLimiter);
  router.use(invitationsRouter);

  router.use("/tenant-health", _readLimiter);
  router.use("/tenant-health", _writeLimiter);
  router.use(tenantHealthRouter);

  router.use("/settings", _readLimiter);
  router.use("/settings", _writeLimiter);
  router.use(unifiedSettingsRouter);

  router.use("/changelog", _readLimiter);
  router.use("/changelog", _writeLimiter);
  router.use(changelogRouter);

  router.use("/aegis/sync", _readLimiter);
  router.use("/vessels/sync", _readLimiter);
  router.use("/alloy/sync", _readLimiter);
  router.use(deltaSyncRouter);
  router.use(changesRouter);

  router.use(gdprRouter);
  router.use(privacyRouter);

  router.use("/compliance", _readLimiter);
  router.use("/compliance", _writeLimiter);
  router.use(complianceRouter);

  router.use("/approvals", _writeLimiter);
  router.use(approvalsRouter);

  router.use("/proof-chain", _readLimiter);
  router.use(proofChainRouter);

  router.use("/audit-chain", _readLimiter);
  router.use("/audit-chain", _writeLimiter);
  router.use(auditChainRouter);

  router.use("/worldline", _writeLimiter);
  router.use(worldlineRouter);
}
