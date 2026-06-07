export {
  type AdapterHealthStatus,
  type CostRecord,
  computeFreshness,
  type DataFabricAdapter,
  dataFabricRegistry,
  type DataFreshnessLevel,
  type DataProvenance,
  type Domain,
  type NormalizedEntity,
  type OntologyMapping,
  type RefreshSchedule,
} from './adapter-registry.js';

export {
  type ComparableTransaction,
  propertyMarketAdapter,
  type RentComp,
  SEED_RENT_COMPS,
  SEED_TRANSACTIONS,
  SEED_VACANCY,
  type VacancyData,
} from './adapters/property-market.js';

export {
  type DarkFleetAlert,
  type RfDetection,
  satelliteAisRfAdapter,
  type SatellitePass,
  SEED_DARK_FLEET_ALERTS,
  SEED_PASSES,
  SEED_RF_DETECTIONS,
} from './adapters/satellite-ais-rf.js';

export {
  macroIndicatorsAdapter,
  type MacroIndicator,
  SEED_INDICATORS,
} from './adapters/macro-indicators.js';

export {
  type PepScreeningResult,
  sanctionsPepAdapter,
  type SanctionsHit,
  SEED_PEP_RESULTS,
  SEED_SANCTIONS_HITS,
} from './adapters/sanctions-pep.js';

import { dataFabricRegistry } from './adapter-registry.js';
import { propertyMarketAdapter } from './adapters/property-market.js';
import { satelliteAisRfAdapter } from './adapters/satellite-ais-rf.js';
import { macroIndicatorsAdapter } from './adapters/macro-indicators.js';
import { sanctionsPepAdapter } from './adapters/sanctions-pep.js';

dataFabricRegistry.register(propertyMarketAdapter);
dataFabricRegistry.register(satelliteAisRfAdapter);
dataFabricRegistry.register(macroIndicatorsAdapter);
dataFabricRegistry.register(sanctionsPepAdapter);
