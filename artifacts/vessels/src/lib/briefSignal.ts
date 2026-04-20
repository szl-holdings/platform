import { computeLiveMetrics } from '../data/vessels-thresholds';

const STORAGE_KEY = 'vessels_brief_signal';
const AUTO_FIRED_KEY = 'vessels_auto_brief_fired';

export interface BriefSignal {
  query: string;
  context: string;
  source: string;
  firedAt: string;
  autonomous?: boolean;
}

export function fireBriefSignal(signal: Omit<BriefSignal, 'firedAt'>) {
  const payload: BriefSignal = { ...signal, firedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

export function consumeBriefSignal(): BriefSignal | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    localStorage.removeItem(STORAGE_KEY);
    return JSON.parse(raw) as BriefSignal;
  } catch {
    return null;
  }
}

export function getAutonomousSignal(): BriefSignal | null {
  try {
    const alreadyFired = localStorage.getItem(AUTO_FIRED_KEY);
    if (alreadyFired) return null;

    const { maxHormuzProbability, avgSuspicionScore, hormuzZone } = computeLiveMetrics();

    if (maxHormuzProbability >= 80 && hormuzZone) {
      localStorage.setItem(AUTO_FIRED_KEY, 'hormuz-probability');
      return {
        query: `Generate a maritime intelligence brief for: ${hormuzZone.name} — ${hormuzZone.severity} disruption zone with ${hormuzZone.probability72h}% probability of impact in the next 72 hours. ${hormuzZone.affectedVessels} commercial vessels affected. Aggregate cargo value ${hormuzZone.cargoValue}. Provide situation summary, affected parties, dollar impact estimate, and 3 recommended actions for charterers and P&I clubs.`,
        context: `Autonomous rule trigger — ${hormuzZone.name} disruption probability exceeded 80% threshold (live value: ${maxHormuzProbability}%)`,
        source: `Autonomous Alert — Disruption Forecast Engine (${hormuzZone.name} ${maxHormuzProbability}% ≥ 80% threshold)`,
        firedAt: new Date().toISOString(),
        autonomous: true,
      };
    }

    if (avgSuspicionScore >= 85) {
      localStorage.setItem(AUTO_FIRED_KEY, 'dark-fleet-suspicion');
      return {
        query: `Generate a maritime intelligence brief for: Dark fleet monitoring alert — average vessel suspicion score is ${avgSuspicionScore}/100 across active monitoring, exceeding the 85/100 high-risk threshold. Multiple vessels with extended AIS gaps detected. Provide a sanctions compliance briefing, insurance implications, and 3 recommended actions for compliance officers and P&I underwriters.`,
        context: `Autonomous rule trigger — dark fleet average suspicion score ${avgSuspicionScore}/100 exceeded threshold 85/100 (live value from active vessel monitoring)`,
        source: `Autonomous Alert — Dark Fleet Economics (avg suspicion ${avgSuspicionScore}/100 ≥ 85 threshold)`,
        firedAt: new Date().toISOString(),
        autonomous: true,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function resetAutonomousSignals() {
  try {
    localStorage.removeItem(AUTO_FIRED_KEY);
  } catch {}
}
