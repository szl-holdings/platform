export * from "./tiers.js";
export * from "./schema.js";
export * from "./decision-engine.js";

export { checkAction, registerPolicy, getRegisteredPolicies } from "@szl-holdings/policy-engine";

export const GUARDIAN_VERSION = "2.0.0" as const;
