/**
 * @workspace/vessels-perception-viz
 *
 * Single-source visualization layer shared by Vessels web and
 * Vessels-Pitch slides. Each component wraps one perception/bio
 * primitive so the deck and the live product render the same code.
 *
 *   - DeterministicTrajectory  → @szl-holdings/sim-kit (verlet step)
 *   - ShipPortScene            → @szl-holdings/procedural-kit + @szl-holdings/openusd-export
 *   - RankedSignalMesh         → @workspace/anomaly-fabric/peak-detector
 *   - VoyagePipelineTrace      → @szl-holdings/sequence-pipeline (Λ-receipts per stage)
 *
 * The `pipeline` and `ship-library` modules are non-React helpers so
 * fixtures and server code can drive the same logic the UI renders.
 */

export { DeterministicTrajectory } from './trajectory.js';
export type {
  DeterministicTrajectoryProps,
  TrajectoryWaypoint,
  TrajectoryFrame,
} from './trajectory.js';

export { ShipPortScene } from './ship-port-scene.js';
export type { ShipPortSceneProps } from './ship-port-scene.js';

export { RankedSignalMesh } from './ranked-signal-mesh.js';
export type {
  RankedSignalMeshProps,
  SignalSeriesInput,
  RankedSignal,
} from './ranked-signal-mesh.js';

export { VoyagePipelineTrace } from './voyage-pipeline-trace.js';
export type {
  VoyagePipelineTraceProps,
  VoyagePipelineStageView,
} from './voyage-pipeline-trace.js';

export {
  buildVesselTrajectory,
  hashVoyageSeed,
} from './trajectory.js';

export {
  rankSignalsByPeak,
} from './ranked-signal-mesh.js';

export {
  runVoyagePipeline,
  type VoyagePipelineInput,
  type VoyagePipelineResult,
} from './pipeline.js';

export {
  buildShipPortScene,
  shipPortMeshResolver,
  defaultShipPartLibrary,
} from './ship-library.js';

export const VESSELS_PERCEPTION_VIZ_VERSION = '0.1.0' as const;
