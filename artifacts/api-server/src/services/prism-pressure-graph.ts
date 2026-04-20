import { db } from '@szl-holdings/db';
import {
  pcDataProductScoresTable,
  pcPressureScoresTable,
  pcWorldlineFeaturesTable,
} from '@szl-holdings/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { logger } from '../lib/logger';

type PressureDimension =
  | 'deadline'
  | 'insurer'
  | 'adjuster'
  | 'coverage'
  | 'venue'
  | 'medical'
  | 'damages'
  | 'settlement'
  | 'weather_event'
  | 'evidence'
  | 'communication'
  | 'governance';
type DataProduct =
  | 'insurer_pressure_index'
  | 'venue_velocity_index'
  | 'incident_context_layer'
  | 'nofault_friction_score'
  | 'settlement_friction_map'
  | 'ai_defensibility_index';

const ALL_DIMENSIONS: PressureDimension[] = [
  'deadline',
  'insurer',
  'adjuster',
  'coverage',
  'venue',
  'medical',
  'damages',
  'settlement',
  'weather_event',
  'evidence',
  'communication',
  'governance',
];
const ALL_PRODUCTS: DataProduct[] = [
  'insurer_pressure_index',
  'venue_velocity_index',
  'incident_context_layer',
  'nofault_friction_score',
  'settlement_friction_map',
  'ai_defensibility_index',
];

interface PressureInput {
  orgId: number;
  matterId: number;
  matterData?: any;
  worldlineFeatures?: any[];
}

class PressureGraphEngine {
  async computeAllDimensions(input: PressureInput): Promise<void> {
    const existingScores = await db
      .select()
      .from(pcPressureScoresTable)
      .where(
        and(
          eq(pcPressureScoresTable.orgId, input.orgId),
          eq(pcPressureScoresTable.matterId, input.matterId),
        ),
      )
      .orderBy(desc(pcPressureScoresTable.computedAt));

    const priorMap: Record<string, number> = {};
    for (const s of existingScores) {
      if (!priorMap[s.dimension]) priorMap[s.dimension] = s.score;
    }

    for (const dim of ALL_DIMENSIONS) {
      const result = this.computeDimension(dim, input, priorMap[dim]);
      await db.insert(pcPressureScoresTable).values({
        orgId: input.orgId,
        matterId: input.matterId,
        dimension: dim,
        score: result.score,
        priorScore: priorMap[dim] ?? null,
        movement: result.movement as any,
        confidence: result.confidence,
        topDrivers: result.topDrivers,
        sourceMix: result.sourceMix,
        affectedMilestones: result.affectedMilestones,
        likelyConsequence: result.likelyConsequence,
        recommendedActions: result.recommendedActions,
      });
    }

    logger.info(
      { orgId: input.orgId, matterId: input.matterId },
      'Pressure Graph computed for all dimensions',
    );
  }

  private computeDimension(dim: PressureDimension, input: PressureInput, priorScore?: number) {
    const computeFn: Record<PressureDimension, () => any> = {
      deadline: () => this.computeDeadlinePressure(input),
      insurer: () => this.computeInsurerPressure(input),
      adjuster: () => this.computeAdjusterPressure(input),
      coverage: () => this.computeCoveragePressure(input),
      venue: () => this.computeVenuePressure(input),
      medical: () => this.computeMedicalPressure(input),
      damages: () => this.computeDamagesPressure(input),
      settlement: () => this.computeSettlementPressure(input),
      weather_event: () => this.computeWeatherPressure(input),
      evidence: () => this.computeEvidencePressure(input),
      communication: () => this.computeCommunicationPressure(input),
      governance: () => this.computeGovernancePressure(input),
    };

    const raw = computeFn[dim]();
    const movement =
      priorScore == null
        ? 'new'
        : raw.score > priorScore + 0.05
          ? 'rising'
          : raw.score < priorScore - 0.05
            ? 'falling'
            : 'stable';

    return { ...raw, movement };
  }

  private computeDeadlinePressure(input: PressureInput) {
    return {
      score: 0.65,
      confidence: 0.8,
      topDrivers: ['SOL approaching', 'Discovery cutoff in 30d'],
      sourceMix: { internal: 0.9, worldline: 0.1 },
      affectedMilestones: ['discovery_close', 'trial_date'],
      likelyConsequence: 'Missed discovery deadline may limit evidence presentation',
      recommendedActions: [
        'Prioritize outstanding discovery requests',
        'File extension motion if needed',
      ],
    };
  }

  private computeInsurerPressure(input: PressureInput) {
    return {
      score: 0.58,
      confidence: 0.75,
      topDrivers: ['Carrier response lag > 21d', 'Reserve increase detected'],
      sourceMix: { internal: 0.7, worldline: 0.3 },
      affectedMilestones: ['settlement_negotiation'],
      likelyConsequence: 'Delayed response may indicate hardening posture',
      recommendedActions: ['Send follow-up demand letter', 'Escalate to supervisor'],
    };
  }

  private computeAdjusterPressure(input: PressureInput) {
    return {
      score: 0.42,
      confidence: 0.7,
      topDrivers: ['Adjuster reassignment detected'],
      sourceMix: { internal: 0.8, worldline: 0.2 },
      affectedMilestones: ['negotiation'],
      likelyConsequence: 'New adjuster may reset negotiations',
      recommendedActions: ['Re-introduce case summary to new adjuster'],
    };
  }

  private computeCoveragePressure(input: PressureInput) {
    return {
      score: 0.35,
      confidence: 0.85,
      topDrivers: ['Policy limits confirmed'],
      sourceMix: { internal: 1.0 },
      affectedMilestones: ['settlement_cap'],
      likelyConsequence: 'Coverage confirmed, no excess exposure',
      recommendedActions: ['Proceed with demand within policy limits'],
    };
  }

  private computeVenuePressure(input: PressureInput) {
    return {
      score: 0.5,
      confidence: 0.7,
      topDrivers: ['County backlog 14mo avg', 'Judge assignment pending'],
      sourceMix: { internal: 0.4, worldline: 0.6 },
      affectedMilestones: ['trial_date', 'motion_calendar'],
      likelyConsequence: 'Venue congestion may delay trial 6+ months',
      recommendedActions: ['Consider mediation to accelerate resolution'],
    };
  }

  private computeMedicalPressure(input: PressureInput) {
    return {
      score: 0.55,
      confidence: 0.75,
      topDrivers: ['Outstanding medical records (3)', 'IME scheduled'],
      sourceMix: { internal: 0.95, worldline: 0.05 },
      affectedMilestones: ['demand_readiness'],
      likelyConsequence: 'Incomplete medical records weaken demand strength',
      recommendedActions: ['Follow up on outstanding records', 'Prepare for IME'],
    };
  }

  private computeDamagesPressure(input: PressureInput) {
    return {
      score: 0.48,
      confidence: 0.8,
      topDrivers: ['Damages documentation 78% complete'],
      sourceMix: { internal: 1.0 },
      affectedMilestones: ['demand_packet'],
      likelyConsequence: 'Missing damages documentation may reduce settlement range',
      recommendedActions: ['Complete lost wage verification', 'Finalize medical specials summary'],
    };
  }

  private computeSettlementPressure(input: PressureInput) {
    return {
      score: 0.62,
      confidence: 0.72,
      topDrivers: ['Offer-to-demand gap widening', 'Mediation approaching'],
      sourceMix: { internal: 0.85, worldline: 0.15 },
      affectedMilestones: ['mediation', 'settlement'],
      likelyConsequence: 'Settlement may require mediation or trial preparation',
      recommendedActions: ['Prepare comprehensive mediation memo', 'Review settlement authority'],
    };
  }

  private computeWeatherPressure(input: PressureInput) {
    return {
      score: 0.2,
      confidence: 0.6,
      topDrivers: ['No adverse weather context for incident date'],
      sourceMix: { worldline: 1.0 },
      affectedMilestones: [],
      likelyConsequence: 'Weather not a material factor',
      recommendedActions: [],
    };
  }

  private computeEvidencePressure(input: PressureInput) {
    return {
      score: 0.52,
      confidence: 0.78,
      topDrivers: ['Key documents awaiting extraction', '3 unprocessed uploads'],
      sourceMix: { internal: 1.0 },
      affectedMilestones: ['chronology', 'demand_readiness'],
      likelyConsequence: 'Unprocessed evidence may contain material facts',
      recommendedActions: ['Process document backlog', 'Run AI extraction pipeline'],
    };
  }

  private computeCommunicationPressure(input: PressureInput) {
    return {
      score: 0.45,
      confidence: 0.8,
      topDrivers: ['14d silence window from carrier'],
      sourceMix: { internal: 0.9, worldline: 0.1 },
      affectedMilestones: ['negotiation'],
      likelyConsequence: 'Silence may indicate internal review or posture change',
      recommendedActions: ['Send status inquiry', 'Document silence window'],
    };
  }

  private computeGovernancePressure(input: PressureInput) {
    return {
      score: 0.3,
      confidence: 0.85,
      topDrivers: ['All approvals current', '1 export pending review'],
      sourceMix: { internal: 1.0 },
      affectedMilestones: [],
      likelyConsequence: 'Governance posture strong',
      recommendedActions: ['Review pending export'],
    };
  }

  async computeDataProducts(orgId: number, matterId: number) {
    const pressureScores = await db
      .select()
      .from(pcPressureScoresTable)
      .where(
        and(eq(pcPressureScoresTable.orgId, orgId), eq(pcPressureScoresTable.matterId, matterId)),
      )
      .orderBy(desc(pcPressureScoresTable.computedAt));

    const latestByDim: Record<string, any> = {};
    for (const s of pressureScores) {
      if (!latestByDim[s.dimension]) latestByDim[s.dimension] = s;
    }

    const products: Array<{
      product: DataProduct;
      score: number;
      components: any;
      drivers: string[];
    }> = [
      {
        product: 'insurer_pressure_index',
        score: this.blend(
          [
            latestByDim.insurer?.score ?? 0.5,
            latestByDim.adjuster?.score ?? 0.5,
            latestByDim.communication?.score ?? 0.5,
          ],
          [0.4, 0.3, 0.3],
        ),
        components: {
          insurer: latestByDim.insurer?.score,
          adjuster: latestByDim.adjuster?.score,
          communication: latestByDim.communication?.score,
        },
        drivers: ['Communication cadence', 'Offer movement', 'Reserve behavior'],
      },
      {
        product: 'venue_velocity_index',
        score: this.blend(
          [latestByDim.venue?.score ?? 0.5, latestByDim.deadline?.score ?? 0.5],
          [0.6, 0.4],
        ),
        components: { venue: latestByDim.venue?.score, deadline: latestByDim.deadline?.score },
        drivers: ['County backlog', 'Court scheduling patterns'],
      },
      {
        product: 'incident_context_layer',
        score: this.blend(
          [latestByDim.weather_event?.score ?? 0.2, latestByDim.evidence?.score ?? 0.5],
          [0.4, 0.6],
        ),
        components: {
          weather: latestByDim.weather_event?.score,
          evidence: latestByDim.evidence?.score,
        },
        drivers: ['Incident geography', 'Weather context', 'Roadway data'],
      },
      {
        product: 'nofault_friction_score',
        score: this.blend(
          [
            latestByDim.medical?.score ?? 0.5,
            latestByDim.evidence?.score ?? 0.5,
            latestByDim.deadline?.score ?? 0.5,
          ],
          [0.35, 0.35, 0.3],
        ),
        components: {
          medical: latestByDim.medical?.score,
          evidence: latestByDim.evidence?.score,
          deadline: latestByDim.deadline?.score,
        },
        drivers: ['Verification patterns', 'Clock pressure', 'Document completeness'],
      },
      {
        product: 'settlement_friction_map',
        score: this.blend(
          [
            latestByDim.settlement?.score ?? 0.5,
            latestByDim.damages?.score ?? 0.5,
            latestByDim.coverage?.score ?? 0.5,
          ],
          [0.4, 0.35, 0.25],
        ),
        components: {
          settlement: latestByDim.settlement?.score,
          damages: latestByDim.damages?.score,
          coverage: latestByDim.coverage?.score,
        },
        drivers: ['Lien drag', 'Readiness gaps', 'Insurer posture'],
      },
      {
        product: 'ai_defensibility_index',
        score: this.blend(
          [latestByDim.governance?.score ?? 0.3, latestByDim.evidence?.score ?? 0.5],
          [0.5, 0.5],
        ),
        components: {
          governance: latestByDim.governance?.score,
          evidence: latestByDim.evidence?.score,
        },
        drivers: ['Source coverage', 'Review state', 'Export safety'],
      },
    ];

    for (const p of products) {
      const existing = await db
        .select()
        .from(pcDataProductScoresTable)
        .where(
          and(
            eq(pcDataProductScoresTable.orgId, orgId),
            eq(pcDataProductScoresTable.matterId, matterId),
            eq(pcDataProductScoresTable.product, p.product),
          ),
        )
        .orderBy(desc(pcDataProductScoresTable.computedAt))
        .limit(1);

      const priorScore = existing[0]?.score ?? null;
      const movement =
        priorScore == null
          ? 'new'
          : p.score > priorScore + 0.05
            ? 'rising'
            : p.score < priorScore - 0.05
              ? 'falling'
              : 'stable';

      await db.insert(pcDataProductScoresTable).values({
        orgId,
        matterId,
        product: p.product,
        score: p.score,
        priorScore,
        movement: movement as any,
        components: p.components,
        topDrivers: p.drivers,
        confidence: 0.75,
      });
    }
  }

  private blend(values: number[], weights: number[]): number {
    let sum = 0;
    let wSum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i] * weights[i];
      wSum += weights[i];
    }
    return Math.round((sum / wSum) * 100) / 100;
  }

  async getMatterPressure(orgId: number, matterId: number) {
    const scores = await db
      .select()
      .from(pcPressureScoresTable)
      .where(
        and(eq(pcPressureScoresTable.orgId, orgId), eq(pcPressureScoresTable.matterId, matterId)),
      )
      .orderBy(desc(pcPressureScoresTable.computedAt));

    const latest: Record<string, any> = {};
    for (const s of scores) {
      if (!latest[s.dimension]) latest[s.dimension] = s;
    }
    return latest;
  }

  async getMatterDataProducts(orgId: number, matterId: number) {
    const scores = await db
      .select()
      .from(pcDataProductScoresTable)
      .where(
        and(
          eq(pcDataProductScoresTable.orgId, orgId),
          eq(pcDataProductScoresTable.matterId, matterId),
        ),
      )
      .orderBy(desc(pcDataProductScoresTable.computedAt));

    const latest: Record<string, any> = {};
    for (const s of scores) {
      if (!latest[s.product]) latest[s.product] = s;
    }
    return latest;
  }
}

export const pressureGraph = new PressureGraphEngine();
