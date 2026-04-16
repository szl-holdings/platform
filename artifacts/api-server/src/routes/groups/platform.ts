import type { IRouter } from "express";
import { perUserApiSlidingLimiter, perUserWriteSlidingLimiter } from "../../middlewares/sliding-window-limiter";
import { tenantScope } from "../../middlewares/tenant-scope";

import tenantProvisioningRouter from "../tenant-provisioning";
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
  router.use("/audit", _readLimiter);
  router.use("/audit", tenantScope({ required: false }));
  router.use(auditRouter);

  router.use("/admin/tenants", _writeLimiter);
  router.use(tenantProvisioningRouter);

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
  router.use("/orgs", tenantScope({ required: false }));
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
