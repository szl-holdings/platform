import {
  db,
  pcAdjusterProfilesTable,
  pcCommunicationWindowsTable,
  pcCoveragePositionsTable,
  pcDemandPacketsTable,
  pcDemandReadinessSnapshotsTable,
  pcDenialsTable,
  pcDisclaimersTable,
  pcForecastDriversTable,
  pcForecastExplanationsTable,
  pcForecastRunsTable,
  pcInsurerProfilesTable,
  pcMatterClocksTable,
  pcMattersTable,
  pcMediationEventsTable,
  pcNoFaultClaimsTable,
  pcOfferMovementsTable,
  pcReserveMovementsTable,
  pcVenueProfilesTable,
  pcVerificationRequestsTable,
} from '@szl-holdings/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { logger } from './logger';

export type ForecastType =
  | 'deadline_breach_risk'
  | 'no_fault_evidence_lock_risk'
  | 'disclaimer_vulnerability_score'
  | 'demand_readiness_score'
  | 'offer_movement_forecast'
  | 'mediation_conversion_probability'
  | 'venue_velocity_forecast'
  | 'ai_defensibility_score';

export interface ForecastDriver {
  driverName: string;
  driverValue: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  explanation: string;
}

export interface ForecastResult {
  forecastType: ForecastType;
  score: number;
  confidence: number;
  weeklyDelta: number;
  nextBestAction: string;
  drivers: ForecastDriver[];
  explanation: string;
}

/* ── Signal Collectors ── */

async function collectClockSignals(matterId: number) {
  const clocks = await db
    .select()
    .from(pcMatterClocksTable)
    .where(eq(pcMatterClocksTable.matterId, matterId));
  const breached = clocks.filter((c) => c.isBreached);
  const critical = clocks.filter(
    (c) => !c.isBreached && c.daysRemaining !== null && c.daysRemaining < 21,
  );
  return { clocks, breached, critical };
}

async function collectNoFaultSignals(matterId: number) {
  const claims = await db
    .select()
    .from(pcNoFaultClaimsTable)
    .where(eq(pcNoFaultClaimsTable.matterId, matterId));
  const verifications = await db
    .select()
    .from(pcVerificationRequestsTable)
    .where(eq(pcVerificationRequestsTable.matterId, matterId));
  const denials = await db
    .select()
    .from(pcDenialsTable)
    .where(eq(pcDenialsTable.matterId, matterId));
  return { claims, verifications, denials };
}

async function collectCoverageSignals(matterId: number) {
  const disclaimers = await db
    .select()
    .from(pcDisclaimersTable)
    .where(eq(pcDisclaimersTable.matterId, matterId));
  const positions = await db
    .select()
    .from(pcCoveragePositionsTable)
    .where(eq(pcCoveragePositionsTable.matterId, matterId));
  return { disclaimers, positions };
}

async function collectNegotiationSignals(matterId: number) {
  const offers = await db
    .select()
    .from(pcOfferMovementsTable)
    .where(eq(pcOfferMovementsTable.matterId, matterId))
    .orderBy(desc(pcOfferMovementsTable.offeredAt));
  const reserves = await db
    .select()
    .from(pcReserveMovementsTable)
    .where(eq(pcReserveMovementsTable.matterId, matterId))
    .orderBy(desc(pcReserveMovementsTable.reserveDate));
  const silence = await db
    .select()
    .from(pcCommunicationWindowsTable)
    .where(eq(pcCommunicationWindowsTable.matterId, matterId));
  return { offers, reserves, silence };
}

async function collectMediationSignals(matterId: number) {
  const events = await db
    .select()
    .from(pcMediationEventsTable)
    .where(eq(pcMediationEventsTable.matterId, matterId));
  return { events };
}

async function collectDemandSignals(matterId: number) {
  const packets = await db
    .select()
    .from(pcDemandPacketsTable)
    .where(eq(pcDemandPacketsTable.matterId, matterId))
    .orderBy(desc(pcDemandPacketsTable.version));
  const [snapshot] = await db
    .select()
    .from(pcDemandReadinessSnapshotsTable)
    .where(eq(pcDemandReadinessSnapshotsTable.matterId, matterId))
    .orderBy(desc(pcDemandReadinessSnapshotsTable.computedAt))
    .limit(1);
  return { packets, snapshot };
}

async function getPriorScore(matterId: number, forecastType: ForecastType): Promise<number | null> {
  const [prior] = await db
    .select()
    .from(pcForecastRunsTable)
    .where(
      and(
        eq(pcForecastRunsTable.matterId, matterId),
        eq(pcForecastRunsTable.forecastType, forecastType),
      ),
    )
    .orderBy(desc(pcForecastRunsTable.runAt))
    .limit(1);
  return prior ? Number(prior.score) : null;
}

/* ── Forecast Computations ── */

async function computeDeadlineBreachRisk(matterId: number): Promise<ForecastResult> {
  const { clocks, breached, critical } = await collectClockSignals(matterId);
  const prior = await getPriorScore(matterId, 'deadline_breach_risk');

  const drivers: ForecastDriver[] = [];
  let score = 20;

  if (breached.length > 0) {
    score += breached.length * 25;
    drivers.push({
      driverName: 'Breached clocks',
      driverValue: String(breached.length),
      impact: 'negative',
      weight: 0.4,
      explanation: `${breached.length} statutory clock(s) already breached — coverage suspension or forfeiture risk active`,
    });
  }
  if (critical.length > 0) {
    score += critical.length * 18;
    drivers.push({
      driverName: 'Critical clocks (<21d)',
      driverValue: String(critical.length),
      impact: 'negative',
      weight: 0.3,
      explanation: `${critical.length} clock(s) expiring within 21 days — immediate action required`,
    });
  }
  if (clocks.length === 0) {
    score = 15;
    drivers.push({
      driverName: 'No clocks tracked',
      driverValue: '0',
      impact: 'neutral',
      weight: 0.2,
      explanation: 'No statutory clocks registered for this matter',
    });
  } else {
    drivers.push({
      driverName: 'Total clocks tracked',
      driverValue: String(clocks.length),
      impact: 'neutral',
      weight: 0.1,
      explanation: `${clocks.length} clock(s) being monitored`,
    });
  }

  score = Math.min(100, score);
  const weeklyDelta = prior !== null ? +(score - prior).toFixed(1) : 0;
  let nba = 'Review all tracked statutory clocks and update status';
  if (breached.length > 0)
    nba = 'Immediately assess breach consequences and cure options for breached clock(s)';
  else if (critical.length > 0)
    nba = `Complete required action on ${critical.length} critical clock(s) within 72 hours`;

  return {
    forecastType: 'deadline_breach_risk',
    score,
    confidence: clocks.length > 0 ? 82 : 45,
    weeklyDelta,
    nextBestAction: nba,
    drivers,
    explanation: `Deadline breach risk is ${score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'low'}. ${breached.length} breached, ${critical.length} critical clocks.`,
  };
}

async function computeNoFaultEvidenceLockRisk(matterId: number): Promise<ForecastResult> {
  const { claims, verifications, denials } = await collectNoFaultSignals(matterId);
  const prior = await getPriorScore(matterId, 'no_fault_evidence_lock_risk');

  const drivers: ForecastDriver[] = [];
  let score = 10;

  const pendingEuos = verifications.filter(
    (v) => v.requestType === 'euo' && v.status === 'pending',
  );
  const suspensionTriggers = verifications.filter((v) => v.suspensionTrigger === true);
  const imeDenials = denials.filter(
    (d) =>
      d.denialReason?.toLowerCase().includes('ime') ||
      d.denialReason?.toLowerCase().includes('peer review'),
  );
  const unappealed = denials.filter((d) => d.appealStatus === 'not_appealed');

  if (suspensionTriggers.length > 0) {
    score += 30;
    drivers.push({
      driverName: 'EUO suspension trigger active',
      driverValue: String(suspensionTriggers.length),
      impact: 'negative',
      weight: 0.35,
      explanation: 'Pending EUO suspension can lock evidence and suspend no-fault benefits',
    });
  }
  if (pendingEuos.length > 0) {
    score += 15;
    drivers.push({
      driverName: 'Pending EUO requests',
      driverValue: String(pendingEuos.length),
      impact: 'negative',
      weight: 0.2,
      explanation: 'Outstanding EUO requests increase non-cooperation risk',
    });
  }
  if (imeDenials.length > 0) {
    score += imeDenials.length * 12;
    drivers.push({
      driverName: 'IME/peer review denials',
      driverValue: String(imeDenials.length),
      impact: 'negative',
      weight: 0.25,
      explanation: `${imeDenials.length} IME-based denial(s) limit recoverable no-fault amount`,
    });
  }
  if (unappealed.length > 0) {
    score += unappealed.length * 8;
    drivers.push({
      driverName: 'Unappealed denials',
      driverValue: String(unappealed.length),
      impact: 'negative',
      weight: 0.15,
      explanation: `${unappealed.length} denial(s) not appealed — deadline forfeiture risk`,
    });
  }
  if (claims.some((c) => c.noticeStatus === 'timely')) {
    score = Math.max(score - 10, 5);
    drivers.push({
      driverName: 'Notice timely filed',
      driverValue: 'yes',
      impact: 'positive',
      weight: 0.15,
      explanation: 'Timely notice reduces late-notice coverage exposure',
    });
  }

  score = Math.min(100, score);
  const weeklyDelta = prior !== null ? +(score - prior).toFixed(1) : 0;
  const nba =
    suspensionTriggers.length > 0
      ? 'File arbitration on denied bills before deadline; obtain certified IME rebuttal from treating physician'
      : 'Ensure all EUO requests have responses; appeal unappealed denials promptly';

  return {
    forecastType: 'no_fault_evidence_lock_risk',
    score,
    confidence: claims.length > 0 ? 78 : 35,
    weeklyDelta,
    nextBestAction: nba,
    drivers,
    explanation: `No-fault evidence-lock risk is ${score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'low'} based on ${claims.length} claim(s), ${denials.length} denial(s).`,
  };
}

async function computeDisclaimerVulnerabilityScore(matterId: number): Promise<ForecastResult> {
  const { disclaimers, positions } = await collectCoverageSignals(matterId);
  const prior = await getPriorScore(matterId, 'disclaimer_vulnerability_score');

  const drivers: ForecastDriver[] = [];
  let score = 10;

  const lateDisclaimers = disclaimers.filter((d) => d.isTimely === false);
  const challenged = disclaimers.filter(
    (d) => d.challengeStatus === 'challenged' || d.challengeStatus === 'defeated',
  );
  const reservations = positions.filter((p) => p.positionType === 'reservation_of_rights');

  if (lateDisclaimers.length > 0) {
    score += lateDisclaimers.length * 28;
    drivers.push({
      driverName: 'Late disclaimers',
      driverValue: String(lateDisclaimers.length),
      impact: 'positive',
      weight: 0.4,
      explanation: `${lateDisclaimers.length} untimely disclaimer(s) — arguable waiver of coverage defense`,
    });
  }
  if (challenged.length > 0) {
    score = Math.max(score - 12, 5);
    drivers.push({
      driverName: 'Disclaimer challenge filed',
      driverValue: String(challenged.length),
      impact: 'negative',
      weight: 0.2,
      explanation: 'Active disclaimer challenges increase liability exposure',
    });
  }
  if (reservations.length > 0) {
    score += 15;
    drivers.push({
      driverName: 'Reservation of rights issued',
      driverValue: String(reservations.length),
      impact: 'positive',
      weight: 0.3,
      explanation: 'ROR issued — potential for coverage estoppel argument',
    });
  }
  if (disclaimers.length === 0) {
    score = 15;
    drivers.push({
      driverName: 'No disclaimers on record',
      driverValue: '0',
      impact: 'neutral',
      weight: 0.2,
      explanation: 'No coverage disclaimer positions tracked',
    });
  }

  score = Math.min(100, score);
  const weeklyDelta = prior !== null ? +(score - prior).toFixed(1) : 0;

  return {
    forecastType: 'disclaimer_vulnerability_score',
    score,
    confidence: disclaimers.length > 0 ? 75 : 40,
    weeklyDelta,
    nextBestAction:
      lateDisclaimers.length > 0
        ? 'File timely disclaimer challenge motion; request coverage estoppel in pleadings'
        : 'Review all disclaimer positions for timeliness and basis strength',
    drivers,
    explanation: `Disclaimer vulnerability score is ${score >= 70 ? 'high' : score >= 40 ? 'moderate' : 'low'}. ${lateDisclaimers.length} late disclaimer(s) tracked.`,
  };
}

async function computeDemandReadinessScore(matterId: number): Promise<ForecastResult> {
  const { packets, snapshot } = await collectDemandSignals(matterId);
  const prior = await getPriorScore(matterId, 'demand_readiness_score');

  const drivers: ForecastDriver[] = [];
  let score = snapshot ? snapshot.overallScore : 40;

  if (snapshot) {
    if (snapshot.medicalChronologyScore !== null) {
      const mc = snapshot.medicalChronologyScore ?? 0;
      if (mc >= 80)
        drivers.push({
          driverName: 'Medical chronology',
          driverValue: `${mc}%`,
          impact: 'positive',
          weight: 0.2,
          explanation: 'Medical chronology complete',
        });
      else
        drivers.push({
          driverName: 'Medical chronology',
          driverValue: `${mc}%`,
          impact: 'negative',
          weight: 0.2,
          explanation: `Medical chronology ${mc}% complete — gaps may undermine damages`,
        });
    }
    if (snapshot.expertScore !== null && (snapshot.expertScore ?? 0) < 70) {
      score -= 10;
      drivers.push({
        driverName: 'Expert retention',
        driverValue: `${snapshot.expertScore}%`,
        impact: 'negative',
        weight: 0.15,
        explanation: 'Expert engagement below threshold',
      });
    }
    const missingCount = Array.isArray(snapshot.missingItems) ? snapshot.missingItems.length : 0;
    if (missingCount > 0) {
      score -= missingCount * 3;
      drivers.push({
        driverName: 'Missing packet items',
        driverValue: String(missingCount),
        impact: 'negative',
        weight: 0.25,
        explanation: `${missingCount} demand artifact(s) still outstanding`,
      });
    }
  }

  const sentPackets = packets.filter((p) => p.status === 'sent');
  if (sentPackets.length > 0) {
    drivers.push({
      driverName: 'Demand sent',
      driverValue: sentPackets.length.toString(),
      impact: 'positive',
      weight: 0.2,
      explanation: `${sentPackets.length} demand packet(s) already sent`,
    });
    score = Math.max(score, 60);
  }

  score = Math.max(0, Math.min(100, score));
  const weeklyDelta = prior !== null ? +(score - prior).toFixed(1) : 0;

  return {
    forecastType: 'demand_readiness_score',
    score,
    confidence: snapshot ? 85 : 50,
    weeklyDelta,
    nextBestAction:
      score < 70
        ? 'Complete missing demand artifacts and obtain partner review before sending'
        : 'Demand packet ready — set response deadline and track insurer timeline',
    drivers,
    explanation: `Demand readiness is ${score >= 70 ? 'high' : score >= 50 ? 'moderate' : 'low'} at ${score}/100.`,
  };
}

async function computeOfferMovementForecast(matterId: number): Promise<ForecastResult> {
  const { offers, reserves, silence } = await collectNegotiationSignals(matterId);
  const prior = await getPriorScore(matterId, 'offer_movement_forecast');

  const drivers: ForecastDriver[] = [];
  let score = 40;

  const latestOffer = offers[0];
  const latestReserve = reserves[0];
  const silentInsurers = silence.filter(
    (s) => s.partyRole === 'insurer' && (s.daysSilent ?? 0) > 30,
  );

  if (latestReserve && latestOffer) {
    const reserveNum = Number(latestReserve.reserveAmount);
    const offerNum = Number(latestOffer.amount);
    const pctOfReserve = reserveNum > 0 ? (offerNum / reserveNum) * 100 : 0;
    if (pctOfReserve > 80) {
      score += 25;
      drivers.push({
        driverName: 'Offer/reserve ratio',
        driverValue: `${pctOfReserve.toFixed(0)}%`,
        impact: 'positive',
        weight: 0.3,
        explanation: 'Offer is near reserve — carrier approaching authority ceiling',
      });
    } else if (pctOfReserve < 40) {
      score -= 15;
      drivers.push({
        driverName: 'Offer/reserve ratio',
        driverValue: `${pctOfReserve.toFixed(0)}%`,
        impact: 'negative',
        weight: 0.3,
        explanation: 'Large gap between offer and reserve — negotiation runway remains',
      });
    }
  }

  if (latestReserve?.movementType === 'increase') {
    score += 20;
    drivers.push({
      driverName: 'Reserve increased',
      driverValue: latestReserve.delta
        ? `+$${Number(latestReserve.delta).toLocaleString()}`
        : 'yes',
      impact: 'positive',
      weight: 0.25,
      explanation: 'Reserve increase signals carrier acknowledges higher exposure',
    });
  }

  if (silentInsurers.length > 0) {
    score -= 12;
    drivers.push({
      driverName: 'Insurer silence',
      driverValue: `${silentInsurers.length} party silent`,
      impact: 'negative',
      weight: 0.2,
      explanation:
        'Prolonged insurer silence — escalation or motion practice may accelerate movement',
    });
  }

  if (offers.length >= 3) {
    score += 10;
    drivers.push({
      driverName: 'Offer velocity',
      driverValue: `${offers.length} rounds`,
      impact: 'positive',
      weight: 0.15,
      explanation: 'Multiple offer rounds indicate active negotiation',
    });
  }

  score = Math.max(0, Math.min(100, score));
  const weeklyDelta = prior !== null ? +(score - prior).toFixed(1) : 0;

  return {
    forecastType: 'offer_movement_forecast',
    score,
    confidence: offers.length > 0 ? 72 : 40,
    weeklyDelta,
    nextBestAction:
      silentInsurers.length > 0
        ? 'Issue formal demand with 30-day response deadline; file motion to compel if no response'
        : 'Counter with documented damages multiplier and set firm expiration deadline',
    drivers,
    explanation: `Offer movement forecast is ${score >= 65 ? 'favorable' : 'unfavorable'} at ${score}/100.`,
  };
}

async function computeMediationConversionProbability(matterId: number): Promise<ForecastResult> {
  const { events } = await collectMediationSignals(matterId);
  const { snapshot } = await collectDemandSignals(matterId);
  const { offers } = await collectNegotiationSignals(matterId);
  const prior = await getPriorScore(matterId, 'mediation_conversion_probability');

  const drivers: ForecastDriver[] = [];
  let score = 45;

  const scheduled = events.filter((e) => e.status === 'scheduled');
  const settled = events.filter((e) => e.status === 'settled');

  if (settled.length > 0) {
    score = 95;
    drivers.push({
      driverName: 'Prior settlement',
      driverValue: 'yes',
      impact: 'positive',
      weight: 0.5,
      explanation: 'Matter already settled at mediation',
    });
  } else {
    if (scheduled.length > 0) {
      score += 20;
      drivers.push({
        driverName: 'Mediation scheduled',
        driverValue: 'yes',
        impact: 'positive',
        weight: 0.3,
        explanation: 'Active mediation session scheduled — conversion opportunity',
      });
    }
    if (snapshot && snapshot.overallScore >= 70) {
      score += 15;
      drivers.push({
        driverName: 'Demand readiness',
        driverValue: `${snapshot.overallScore}/100`,
        impact: 'positive',
        weight: 0.25,
        explanation: 'Strong demand readiness increases mediation leverage',
      });
    }
    if (offers.length >= 2) {
      score += 10;
      drivers.push({
        driverName: 'Active negotiation',
        driverValue: `${offers.length} offer rounds`,
        impact: 'positive',
        weight: 0.2,
        explanation: 'Ongoing exchange signals both parties motivated to resolve',
      });
    }
    const conversionProb = events[0]?.conversionProbability;
    if (conversionProb !== null && conversionProb !== undefined) {
      const cp = Number(conversionProb) * 100;
      score = Math.round((score + cp) / 2);
      drivers.push({
        driverName: 'Mediator conversion estimate',
        driverValue: `${cp.toFixed(0)}%`,
        impact: cp > 50 ? 'positive' : 'neutral',
        weight: 0.25,
        explanation: "Mediator's pre-session conversion probability estimate",
      });
    }
  }

  score = Math.max(0, Math.min(100, score));
  const weeklyDelta = prior !== null ? +(score - prior).toFixed(1) : 0;

  return {
    forecastType: 'mediation_conversion_probability',
    score,
    confidence: events.length > 0 ? 77 : 42,
    weeklyDelta,
    nextBestAction:
      score < 50
        ? 'Strengthen mediation brief with updated specials and damages projection'
        : 'Prepare opening position with clear authority range and settlement calculator',
    drivers,
    explanation: `Mediation conversion probability is ${score}% — ${score >= 65 ? 'strong' : 'moderate'} conversion outlook.`,
  };
}

async function computeVenueVelocityForecast(
  matterId: number,
  orgId: number,
): Promise<ForecastResult> {
  const prior = await getPriorScore(matterId, 'venue_velocity_forecast');
  const drivers: ForecastDriver[] = [];

  const [matter] = await db
    .select({
      id: pcMattersTable.id,
      jurisdiction: pcMattersTable.jurisdiction,
      courtName: pcMattersTable.courtName,
    })
    .from(pcMattersTable)
    .where(eq(pcMattersTable.id, matterId));

  const county = matter?.jurisdiction?.split(' County')?.[0] ?? null;

  const venues = county
    ? await db.select().from(pcVenueProfilesTable).where(eq(pcVenueProfilesTable.county, county))
    : await db.select().from(pcVenueProfilesTable);

  const venue = venues[0] ?? null;

  const orgInsurerIds = await db
    .select({ id: pcInsurerProfilesTable.id })
    .from(pcInsurerProfilesTable)
    .where(eq(pcInsurerProfilesTable.orgId, orgId));
  const insurerIdList = orgInsurerIds.map((i) => i.id);
  const adjusters =
    insurerIdList.length > 0
      ? await db
          .select()
          .from(pcAdjusterProfilesTable)
          .where(inArray(pcAdjusterProfilesTable.insurerProfileId, insurerIdList))
      : [];

  let score = 50;

  if (venue) {
    if (venue.velocityScore !== null && (venue.velocityScore ?? 0) >= 75) {
      score += 20;
      drivers.push({
        driverName: 'High-velocity venue',
        driverValue: venue.county,
        impact: 'positive',
        weight: 0.3,
        explanation: `${venue.county} is a high-velocity venue (score: ${venue.velocityScore})`,
      });
    }
    if (venue.plaintiffFriendliness === 'very_high' || venue.plaintiffFriendliness === 'high') {
      score += 15;
      drivers.push({
        driverName: 'Plaintiff-friendly venue',
        driverValue: venue.county,
        impact: 'positive',
        weight: 0.25,
        explanation: `${venue.county} has strong plaintiff verdict history`,
      });
    }
    if (venue.county === 'Bronx') {
      score = Math.max(score, 72);
      drivers.push({
        driverName: 'Bronx Premium venue',
        driverValue: 'Bronx',
        impact: 'positive',
        weight: 0.3,
        explanation: 'Bronx historically commands premium verdicts — strong settlement leverage',
      });
    }
    if (venue.medianVerdictAuto !== null) {
      drivers.push({
        driverName: 'Median auto verdict',
        driverValue: `$${Number(venue.medianVerdictAuto).toLocaleString()}`,
        impact: 'neutral',
        weight: 0.15,
        explanation: `Median auto verdict in ${venue.county} is $${Number(venue.medianVerdictAuto).toLocaleString()}`,
      });
    }
  } else {
    drivers.push({
      driverName: 'Venue data',
      driverValue: 'not loaded',
      impact: 'neutral',
      weight: 0.5,
      explanation: "No venue profile matched for this matter's jurisdiction",
    });
  }

  if (adjusters.some((a) => a.negotiationStyle === 'delay_tactics')) {
    score -= 10;
    drivers.push({
      driverName: 'Delay-tactics adjuster',
      driverValue: 'detected',
      impact: 'negative',
      weight: 0.2,
      explanation: 'Adjuster known for delay tactics may slow resolution velocity',
    });
  }

  score = Math.max(0, Math.min(100, score));
  const weeklyDelta = prior !== null ? +(score - prior).toFixed(1) : 0;

  return {
    forecastType: 'venue_velocity_forecast',
    score,
    confidence: venue ? 68 : 35,
    weeklyDelta,
    nextBestAction:
      score >= 65
        ? 'Leverage venue strength in demand letter and mediation brief'
        : 'Research local part assignment and align discovery strategy to court calendar',
    drivers,
    explanation: `Venue velocity forecast score is ${score}/100 — ${score >= 65 ? 'favorable' : 'unfavorable'} resolution momentum.`,
  };
}

async function computeAiDefensibilityScore(matterId: number): Promise<ForecastResult> {
  const prior = await getPriorScore(matterId, 'ai_defensibility_score');
  const drivers: ForecastDriver[] = [];
  let score = 70;

  const { claims } = await collectNoFaultSignals(matterId);
  const { snapshot } = await collectDemandSignals(matterId);

  const documentedClaims = claims.filter(
    (c) => c.evidenceLockRisk !== null && (c.evidenceLockRisk ?? 0) < 50,
  );
  const timelyNotice = claims.filter((c) => c.noticeStatus === 'timely');

  if (timelyNotice.length > 0) {
    score += 12;
    drivers.push({
      driverName: 'Timely notice filed',
      driverValue: 'yes',
      impact: 'positive',
      weight: 0.2,
      explanation: 'Timely notice strengthens no-fault claim defensibility',
    });
  }
  if (documentedClaims.length > 0) {
    score += 8;
    drivers.push({
      driverName: 'Low evidence-lock risk',
      driverValue: String(documentedClaims.length),
      impact: 'positive',
      weight: 0.2,
      explanation: 'Claims with low evidence-lock risk are well-documented',
    });
  }
  if (snapshot && snapshot.overallScore >= 75) {
    score += 10;
    drivers.push({
      driverName: 'Strong demand readiness',
      driverValue: `${snapshot.overallScore}/100`,
      impact: 'positive',
      weight: 0.25,
      explanation: 'High demand readiness underpins AI output defensibility',
    });
  } else if (snapshot && snapshot.overallScore < 60) {
    score -= 8;
    drivers.push({
      driverName: 'Weak demand readiness',
      driverValue: `${snapshot.overallScore ?? 'N/A'}/100`,
      impact: 'negative',
      weight: 0.2,
      explanation: 'Low readiness undermines source grounding for AI outputs',
    });
  }

  drivers.push({
    driverName: 'Human review required',
    driverValue: 'pending',
    impact: 'neutral',
    weight: 0.15,
    explanation: 'All AI outputs require attorney approval before client use',
  });

  score = Math.max(0, Math.min(100, score));
  const weeklyDelta = prior !== null ? +(score - prior).toFixed(1) : 0;

  return {
    forecastType: 'ai_defensibility_score',
    score,
    confidence: 80,
    weeklyDelta,
    nextBestAction:
      score < 70
        ? 'Complete source grounding review and obtain attorney approval on all AI-generated content'
        : 'AI outputs are defensible — proceed with attorney review checkpoint',
    drivers,
    explanation: `AI defensibility score is ${score}/100 — ${score >= 75 ? 'strong' : 'moderate'} source grounding and governance.`,
  };
}

/* ── Orchestrator ── */

export async function runAllForecasts(
  matterId: number,
  orgId: number,
  actorId?: number,
): Promise<ForecastResult[]> {
  const computers: Array<() => Promise<ForecastResult>> = [
    () => computeDeadlineBreachRisk(matterId),
    () => computeNoFaultEvidenceLockRisk(matterId),
    () => computeDisclaimerVulnerabilityScore(matterId),
    () => computeDemandReadinessScore(matterId),
    () => computeOfferMovementForecast(matterId),
    () => computeMediationConversionProbability(matterId),
    () => computeVenueVelocityForecast(matterId, orgId),
    () => computeAiDefensibilityScore(matterId),
  ];

  const results = await Promise.allSettled(computers.map((fn) => fn()));
  const valid: ForecastResult[] = [];
  const errors: string[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      valid.push(r.value);
    } else {
      errors.push(r.reason?.message ?? String(r.reason));
    }
  }
  if (valid.length === 0) {
    throw new Error(`All 8 forecast computations failed: ${errors.join('; ')}`);
  }
  if (errors.length > 0) {
    logger.warn({ errors }, `${errors.length} forecast(s) failed`);
  }

  for (const result of valid) {
    const [run] = await db
      .insert(pcForecastRunsTable)
      .values({
        orgId,
        matterId,
        forecastType: result.forecastType,
        score: String(result.score),
        confidence: String(result.confidence),
        weeklyDelta: String(result.weeklyDelta),
        nextBestAction: result.nextBestAction,
        modelVersion: '2.0.0',
        actorId,
      })
      .returning();

    if (result.drivers.length > 0) {
      await db.insert(pcForecastDriversTable).values(
        result.drivers.map((d) => ({
          forecastRunId: run.id,
          orgId,
          matterId,
          actorId,
          driverName: d.driverName,
          driverValue: d.driverValue,
          impact: d.impact,
          weight: String(d.weight),
          explanation: d.explanation,
          sourceLineage: `forecast:${result.forecastType}`,
          exportFlag: false,
        })),
      );
    }

    await db.insert(pcForecastExplanationsTable).values({
      forecastRunId: run.id,
      orgId,
      matterId,
      actorId,
      headline: result.nextBestAction,
      detail: result.explanation,
      recommendations: result.drivers.map((d) => d.explanation),
      isPrivileged: false,
      sourceLineage: `forecast:${result.forecastType}`,
      exportFlag: false,
    });
  }

  return valid;
}

export async function runSingleForecast(
  matterId: number,
  orgId: number,
  forecastType: ForecastType,
  actorId?: number,
): Promise<ForecastResult> {
  const computers: Record<ForecastType, () => Promise<ForecastResult>> = {
    deadline_breach_risk: () => computeDeadlineBreachRisk(matterId),
    no_fault_evidence_lock_risk: () => computeNoFaultEvidenceLockRisk(matterId),
    disclaimer_vulnerability_score: () => computeDisclaimerVulnerabilityScore(matterId),
    demand_readiness_score: () => computeDemandReadinessScore(matterId),
    offer_movement_forecast: () => computeOfferMovementForecast(matterId),
    mediation_conversion_probability: () => computeMediationConversionProbability(matterId),
    venue_velocity_forecast: () => computeVenueVelocityForecast(matterId, orgId),
    ai_defensibility_score: () => computeAiDefensibilityScore(matterId),
  };

  const result = await computers[forecastType]();

  const [run] = await db
    .insert(pcForecastRunsTable)
    .values({
      orgId,
      matterId,
      forecastType: result.forecastType,
      score: String(result.score),
      confidence: String(result.confidence),
      weeklyDelta: String(result.weeklyDelta),
      nextBestAction: result.nextBestAction,
      modelVersion: '2.0.0',
      actorId,
    })
    .returning();

  if (result.drivers.length > 0) {
    await db.insert(pcForecastDriversTable).values(
      result.drivers.map((d) => ({
        forecastRunId: run.id,
        orgId,
        matterId,
        actorId,
        driverName: d.driverName,
        driverValue: d.driverValue,
        impact: d.impact,
        weight: String(d.weight),
        explanation: d.explanation,
        sourceLineage: `forecast:${forecastType}`,
        exportFlag: false,
      })),
    );
  }

  await db.insert(pcForecastExplanationsTable).values({
    forecastRunId: run.id,
    orgId,
    matterId,
    actorId,
    headline: result.nextBestAction,
    detail: result.explanation,
    recommendations: result.drivers.map((d) => d.explanation),
    isPrivileged: false,
    sourceLineage: `forecast:${forecastType}`,
    exportFlag: false,
  });

  return result;
}
