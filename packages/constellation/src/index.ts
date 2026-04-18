export * from "./schema.js";
export * from "./types.js";
export * from "./adapter.js";
export * from "./store.js";
export * from "./registry.js";
export * from "./query.js";
export * from "./entity-resolution.js";
export * from "./relationship-inference.js";
export * from "./contradiction-detection.js";
export * from "./evidence-ranking.js";
export * from "./freshness-decay.js";
export * from "./confidence-fusion.js";
export * from "./cross-domain.js";

export { ATLAS_CORE_VERSION } from "@szl-holdings/atlas-core";

export {
  terraAdapter,
} from "./adapters/terra.js";
export {
  prismAdapter,
} from "./adapters/prism.js";
export {
  vesselsAdapter,
} from "./adapters/vessels.js";
export {
  aegisAdapter,
} from "./adapters/aegis.js";
export {
  lyteAdapter,
} from "./adapters/lyte.js";
export {
  imperiumAdapter,
} from "./adapters/imperium.js";
export {
  carlotaJoAdapter,
} from "./adapters/carlota-jo.js";

export const CONSTELLATION_VERSION = "2.0.0" as const;
