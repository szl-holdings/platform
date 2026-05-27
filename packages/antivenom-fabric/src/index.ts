export {
  type AttackEntry,
  type AntivenomSeverity,
  type AntivenomLayer,
  ANTIVENOM_CATALOGUE,
  SEVERITY_PENALTY,
} from './catalogue.js';

export { match, type MatchResult, type MatchHit } from './match.js';

export const ANTIVENOM_FABRIC_VERSION = '0.1.0' as const;
