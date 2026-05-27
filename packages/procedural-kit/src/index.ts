/**
 * @szl-holdings/procedural-kit
 *
 * Procedural part-graph authoring. Re-expressed from kitbash
 * (docs/research/perception-bio-synthesis-2026.md §5).
 *
 * Pipeline: `Part[]` → `PartLibrary` → `seed-generator → Scene` →
 * `openusd-export/from-part-graph` → USD stage.
 */

export type { Part, PartLibrary, Slot, Transform3 } from './part.js';
export { makePartLibrary, IDENTITY_TRANSFORM } from './part.js';

export type { Scene, SceneNode, CompositionError } from './composition.js';
export { rootNode, validateScene, partGraphHash } from './composition.js';

export { generate } from './seed-generator.js';
export type { GenerateConstraints } from './seed-generator.js';

export { bomOf } from './bom.js';
export type { BillOfMaterials } from './bom.js';

export const PROCEDURAL_KIT_VERSION = '0.1.0' as const;
export const SCENE_COMPOSED_RECEIPT_CLASS = 'scene.composed.v1' as const;
