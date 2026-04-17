export * from "./types.js";
export * from "./registry.js";
export {
  runSkill,
  registerSkill,
  getSkill,
  listSkills,
  registerSkillStepHandler,
  SkillHandlerNotFoundError,
  SkillNotFoundError,
  SkillDisabledError,
} from "./runner.js";
export { builtinSkills, seedBuiltinSkills } from "./seeds.js";
export {
  PostgresSkillRegistry,
  PostgresSkillRunStore,
  type PostgresSkillRegistryOptions,
  type PostgresSkillRunStoreOptions,
  type SkillsTableLike,
  type SkillRunsTableLike,
} from "./postgres-store.js";

export const SKILL_LIBRARY_VERSION = "1.0.0" as const;

import { defaultSkillRegistry } from "./registry.js";
import { seedBuiltinSkills } from "./seeds.js";

seedBuiltinSkills(defaultSkillRegistry);
