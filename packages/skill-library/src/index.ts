export {
  PostgresSkillRegistry,
  type PostgresSkillRegistryOptions,
  PostgresSkillRunStore,
  type PostgresSkillRunStoreOptions,
  type SkillRunsTableLike,
  type SkillsTableLike,
} from './postgres-store.js';
export * from './registry.js';
export {
  getSkill,
  listSkills,
  registerSkill,
  registerSkillStepHandler,
  runSkill,
  SkillDisabledError,
  SkillHandlerNotFoundError,
  SkillNotFoundError,
} from './runner.js';
export { builtinSkills, seedBuiltinSkills } from './seeds.js';
export * from './types.js';

export const SKILL_LIBRARY_VERSION = '1.0.0' as const;

import { defaultSkillRegistry } from './registry.js';
import { seedBuiltinSkills } from './seeds.js';

seedBuiltinSkills(defaultSkillRegistry);
