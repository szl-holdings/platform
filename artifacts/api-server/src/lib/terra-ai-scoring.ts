import type { TerraDistressProperty } from '@szl-holdings/db';

export interface ScoringResult {
  score: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  recommended_action: string;
  breakdown: {
    distressType: number;
    timeInDistress: number;
    equityPosition: number;
    locationDemand: number;
    filingRecency: number;
    duplicateHistory: number;
  };
}

const DISTRESS_TYPE_WEIGHT: Record<string, number> = {
  auction: 30,
  'pre-foreclosure': 26,
  foreclosure: 24,
  'tax-lien': 20,
  reo: 18,
  'expired-listing': 10,
};

const BOROUGH_DEMAND: Record<string, number> = {
  Manhattan: 18,
  Brooklyn: 16,
  Queens: 14,
  Bronx: 12,
  'Staten Island': 10,
};

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function computeScore(prop: TerraDistressProperty): ScoringResult {
  const today = new Date();

  // 1. Distress type score (0–30)
  const distressTypeScore = DISTRESS_TYPE_WEIGHT[prop.distressType] ?? 15;

  // 2. Time in distress score (0–20): peaks around 90–180 days
  const daysInDistress = prop.daysInDistress ?? 0;
  let timeScore: number;
  if (daysInDistress < 30) timeScore = 5;
  else if (daysInDistress < 90) timeScore = 12;
  else if (daysInDistress < 180) timeScore = 20;
  else if (daysInDistress < 365) timeScore = 16;
  else timeScore = 10;

  // 3. Equity position (0–25)
  let equityScore = 10;
  if (prop.estimatedValue && prop.debtAmount) {
    const estVal = Number(prop.estimatedValue);
    const debtAmt = Number(prop.debtAmount);
    if (estVal > 0) {
      const equityPct = (estVal - debtAmt) / estVal;
      if (equityPct >= 0.5) equityScore = 25;
      else if (equityPct >= 0.35) equityScore = 20;
      else if (equityPct >= 0.2) equityScore = 15;
      else if (equityPct >= 0.1) equityScore = 10;
      else equityScore = 5;
    }
  }

  // 4. Location demand (0–18)
  const locationScore = BOROUGH_DEMAND[prop.borough] ?? 10;

  // 5. Filing recency (0–15): higher for very recent filings
  let filingScore = 7;
  if (prop.filingDate) {
    const filingDate = new Date(prop.filingDate);
    const daysSinceFiling = Math.ceil((today.getTime() - filingDate.getTime()) / 86400000);
    if (daysSinceFiling <= 30) filingScore = 15;
    else if (daysSinceFiling <= 90) filingScore = 12;
    else if (daysSinceFiling <= 180) filingScore = 8;
    else filingScore = 5;
  }

  // 6. Auction urgency bonus (0–15 extra for auction proximity)
  let auctionBonus = 0;
  if (prop.distressType === 'auction' && prop.auctionDate) {
    const auctionDate = new Date(prop.auctionDate);
    const daysToAuction = Math.ceil((auctionDate.getTime() - today.getTime()) / 86400000);
    if (daysToAuction >= 0 && daysToAuction <= 7) auctionBonus = 15;
    else if (daysToAuction <= 14) auctionBonus = 12;
    else if (daysToAuction <= 30) auctionBonus = 8;
  }

  const rawScore =
    distressTypeScore + timeScore + equityScore + locationScore + filingScore + auctionBonus;
  const maxPossible = 30 + 20 + 25 + 18 + 15 + 15;
  const normalizedScore = clamp(Math.round((rawScore / maxPossible) * 100));

  // Confidence based on data completeness
  const hasAll = !!(
    prop.estimatedValue &&
    prop.debtAmount &&
    prop.filingDate &&
    prop.ownerName &&
    prop.ownerType
  );
  const hasMost = !!(prop.estimatedValue && prop.filingDate && prop.ownerName);
  const confidence: 'low' | 'medium' | 'high' = hasAll ? 'high' : hasMost ? 'medium' : 'low';

  // Reasoning
  const equityPct =
    prop.debtAmount && prop.estimatedValue
      ? Math.round(
          ((Number(prop.estimatedValue) - Number(prop.debtAmount)) / Number(prop.estimatedValue)) *
            100,
        )
      : null;

  const reasoningParts: string[] = [];

  if (prop.distressType === 'auction' && prop.auctionDate) {
    const daysToAuction = Math.ceil(
      (new Date(prop.auctionDate).getTime() - today.getTime()) / 86400000,
    );
    reasoningParts.push(`Auction scheduled in ${daysToAuction} days — high urgency window`);
  } else {
    reasoningParts.push(
      `${prop.distressType.replace(/-/g, ' ')} distress signal — ${distressTypeScore >= 25 ? 'high' : distressTypeScore >= 18 ? 'moderate' : 'lower'}-priority distress type`,
    );
  }

  if (equityPct !== null) {
    reasoningParts.push(
      `${equityPct}% estimated equity position (${equityPct >= 35 ? 'strong acquisition opportunity' : equityPct >= 20 ? 'workable margin' : 'thin equity — negotiate carefully'})`,
    );
  }

  reasoningParts.push(
    `${prop.borough} location — ${locationScore >= 16 ? 'top-tier' : locationScore >= 13 ? 'strong' : 'moderate'} NYC demand market`,
  );
  reasoningParts.push(
    `${daysInDistress} days in distress — ${daysInDistress >= 90 && daysInDistress <= 180 ? 'motivated seller likely' : daysInDistress > 180 ? 'extended distress, seller pressure high' : 'early stage, window opening'}`,
  );

  const reasoning = `${reasoningParts.join('. ')}.`;

  // Recommended action
  let recommended_action: string;
  if (normalizedScore >= 85) {
    recommended_action =
      'Immediate direct outreach — certified mail + attorney of record. Priority acquisition candidate.';
  } else if (normalizedScore >= 70) {
    recommended_action =
      'Schedule direct owner contact within 5 business days. Add to investor queue.';
  } else if (normalizedScore >= 55) {
    recommended_action = 'Monitor and follow up within 30 days. Add to watchlist.';
  } else if (normalizedScore >= 40) {
    recommended_action = 'Low priority. Add to watchlist. Revisit if distress stage escalates.';
  } else {
    recommended_action =
      'Hold — insufficient opportunity signal. Re-evaluate at next data refresh.';
  }

  return {
    score: normalizedScore,
    confidence,
    reasoning,
    recommended_action,
    breakdown: {
      distressType: distressTypeScore,
      timeInDistress: timeScore,
      equityPosition: equityScore,
      locationDemand: locationScore,
      filingRecency: filingScore,
      duplicateHistory: auctionBonus,
    },
  };
}

export async function scoreDistressProperty(prop: TerraDistressProperty): Promise<ScoringResult> {
  return computeScore(prop);
}

export async function scoreDistressProperties(
  props: TerraDistressProperty[],
): Promise<Array<ScoringResult & { id: string; address: string }>> {
  return props.map((prop) => ({
    id: prop.externalId ?? String(prop.id),
    address: prop.address,
    ...computeScore(prop),
  }));
}
