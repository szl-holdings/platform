import { DARK_FLEET_VESSELS } from './dark-fleet-vessels-data';
import { DISRUPTION_ZONES } from './disruption-zones-data';

export function computeLiveMetrics() {
  const hormuzZone = DISRUPTION_ZONES.find((z) => z.id === 'DZ-001');
  const maxHormuzProbability = hormuzZone?.probability72h ?? 0;
  const criticalZoneCount = DISRUPTION_ZONES.filter(
    (z) => z.severity === 'Critical' && z.probability72h >= 80,
  ).length;
  const suspicionScores = DARK_FLEET_VESSELS.map((v) => v.suspicionScore);
  const avgSuspicionScore =
    suspicionScores.length > 0
      ? Math.round(suspicionScores.reduce((a, b) => a + b, 0) / suspicionScores.length)
      : 0;
  return { maxHormuzProbability, avgSuspicionScore, criticalZoneCount, hormuzZone };
}
