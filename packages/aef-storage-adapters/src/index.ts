export * from "./interfaces.js";
export * from "./local-fs.js";
export * from "./sqlite.js";
export * from "./stubs.js";

export { createLocalFsStorageBundle } from "./local-fs.js";
export { createSqliteStorageBundle } from "./sqlite.js";
export { InMemoryStorageBundle } from "./stubs.js";

export const AEF_STORAGE_ADAPTERS_VERSION = "0.1.0" as const;
