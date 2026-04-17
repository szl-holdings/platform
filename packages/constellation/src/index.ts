export * from "./schema.js";
export * from "./types.ts";
export * from "./adapter.ts";
export * from "./store.js";
export * from "./registry.ts";
export * from "./query.ts";

export { ATLAS_CORE_VERSION } from "@szl-holdings/atlas-core";

export {
  terraAdapter,
} from "./adapters/terra.ts";
export {
  prismAdapter,
} from "./adapters/prism.ts";
export {
  vesselsAdapter,
} from "./adapters/vessels.ts";
export {
  aegisAdapter,
} from "./adapters/aegis.ts";
export {
  lyteAdapter,
} from "./adapters/lyte.ts";
export {
  imperiumAdapter,
} from "./adapters/imperium.ts";
export {
  carlotaJoAdapter,
} from "./adapters/carlota-jo.ts";

export const CONSTELLATION_VERSION = "1.0.0" as const;
