import { z } from "zod";

export const PolicyTierSchema = z.enum([
  "advisory-only",
  "internal-workflow",
  "operator-assisted",
  "executive-facing",
  "regulated-workflow",
  "external-client-facing",
  "autonomous-reversible",
  "human-approval-mandatory",
]);

export type PolicyTier = z.infer<typeof PolicyTierSchema>;

export const POLICY_TIER_DESCRIPTIONS: Record<PolicyTier, string> = {
  "advisory-only":
    "Agent produces recommendations only; no system state is changed. Zero approval required.",
  "internal-workflow":
    "Agent executes internal-only steps (data reads, drafts). No external or financial effects. Operator oversight recommended.",
  "operator-assisted":
    "Agent acts but a human operator reviews and confirms before commit. Suitable for routine ops tasks.",
  "executive-facing":
    "Output or action is visible to or initiated by executive stakeholders. Elevated scrutiny required.",
  "regulated-workflow":
    "Action touches regulated domains (financial, legal, health, privacy). Compliance gate mandatory.",
  "external-client-facing":
    "Output or action reaches external clients or third parties. Legal review may apply.",
  "autonomous-reversible":
    "Agent acts autonomously but action is fully reversible. Rollback capability must be verified before execution.",
  "human-approval-mandatory":
    "No action may proceed without explicit human approval. Deny-by-default; approval record required.",
};

export const TIER_RISK_LEVEL: Record<PolicyTier, number> = {
  "advisory-only": 1,
  "internal-workflow": 2,
  "operator-assisted": 3,
  "executive-facing": 4,
  "regulated-workflow": 5,
  "external-client-facing": 6,
  "autonomous-reversible": 7,
  "human-approval-mandatory": 8,
};
