/**
 * seed-ownership.ts
 *
 * Seeds ownership structure for SZL Holdings:
 *   • ownership_scenarios     — capital structure scenarios
 *   • ownership_allocations   — per-person equity/voting rights
 *   • control_roles           — day-to-day and strategic control
 *
 * Idempotent: skips if data already present.
 */

import {
  controlRolesTable,
  db,
  ownershipAllocationsTable,
  ownershipScenariosTable,
} from '@szl-holdings/db';
import { inArray } from 'drizzle-orm';

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}

const SCENARIO_NAMES = [
  'Baseline — Founding Structure (Pre-Seed)',
  'Scenario A — Current Operating Structure',
  'Scenario B — Series A Pro Forma',
  'Scenario C — ESOP Expansion Variant',
  'Certification Template — SBA 8(a) Compliant',
];

export async function seedOwnership() {

  // Look up existing scenarios by name to support partial-failure recovery
  const existingScenarios = await db
    .select({ id: ownershipScenariosTable.id, name: ownershipScenariosTable.name })
    .from(ownershipScenariosTable)
    .where(inArray(ownershipScenariosTable.name, SCENARIO_NAMES));

  const fullySeeded = existingScenarios.length >= SCENARIO_NAMES.length;
  const existingAllocCount = fullySeeded
    ? (
        await db
          .select({ id: ownershipAllocationsTable.id })
          .from(ownershipAllocationsTable)
          .limit(1)
      ).length
    : 0;
  const existingRoleCount = fullySeeded
    ? (await db.select({ id: controlRolesTable.id }).from(controlRolesTable).limit(1)).length
    : 0;

  if (fullySeeded && existingAllocCount > 0 && existingRoleCount > 0) {
    return { skipped: true };
  }

  // Any partial state: delete all existing seed rows and reinsert fresh.
  // This heals missing allocations, missing control roles, and partial scenario sets.
  if (existingScenarios.length > 0) {
    const ids = existingScenarios.map((s) => s.id);
    await db
      .delete(ownershipAllocationsTable)
      .where(inArray(ownershipAllocationsTable.scenarioId, ids));
    await db.delete(controlRolesTable).where(inArray(controlRolesTable.scenarioId, ids));
    await db.delete(ownershipScenariosTable).where(inArray(ownershipScenariosTable.id, ids));
  }

  const scenarios = await db
    .insert(ownershipScenariosTable)
    .values([
      {
        name: 'Baseline — Founding Structure (Pre-Seed)',
        description:
          'Original founding equity split before any external capital. Used as reference point for all dilution modeling.',
        isTemplate: false,
        isActive: false,
        isPreferred: false,
        status: 'approved',
        certificationFitSummary:
          'Simple two-founder structure. Sole citizenship confirmed for both founders. Meets SBA size standards — no foreign ownership concerns.',
        fundraisingFitScore: 62,
        bankFitScore: 78,
        investorClarityScore: 84,
        notes:
          'Pre-seed baseline. Not the current operative structure — retained for cap table history.',
        metadata: {
          version: 1,
          effectiveDate: '2022-01-01',
          authorizedShares: 10_000_000,
          sharesOutstanding: 10_000_000,
          parValue: '0.00001',
        },
        createdAt: daysAgo(730),
        updatedAt: daysAgo(730),
      },
      {
        name: 'Scenario A — Current Operating Structure',
        description:
          'Current capitalization post-Seed round. Reflects $2.1M raised at $8M pre-money valuation. Primary scenario used for all regulatory filings and bank applications.',
        isTemplate: false,
        isActive: true,
        isPreferred: true,
        status: 'approved',
        certificationFitSummary:
          'Majority ownership (51%) held by U.S. citizen and SBA-disadvantaged individual. Minority investors hold 22% combined, all with passive rights only. Structure meets SBA 8(a) and WOSB certification eligibility thresholds.',
        fundraisingFitScore: 85,
        bankFitScore: 91,
        investorClarityScore: 88,
        notes:
          'This is the operative structure. All bank applications, LP decks, and SBA certification filings use Scenario A.',
        metadata: {
          version: 4,
          effectiveDate: '2024-06-15',
          authorizedShares: 15_000_000,
          sharesOutstanding: 12_450_000,
          optionPoolReserved: 2_550_000,
          parValue: '0.00001',
          lastBoardApproved: '2024-06-14',
          seedRound: { amount: 2_100_000, preMoneyValuation: 8_000_000, closingDate: '2024-06-15' },
        },
        createdAt: daysAgo(300),
        updatedAt: daysAgo(14),
      },
      {
        name: 'Scenario B — Series A Pro Forma',
        description:
          'Pro forma cap table assuming $8M Series A at $32M pre-money. Models dilution impact and post-money ownership for LP pitch materials.',
        isTemplate: false,
        isActive: false,
        isPreferred: false,
        status: 'under_review',
        certificationFitSummary:
          'Post-Series A majority ownership drops to 47.2% — falls below SBA 8(a) 51% threshold. WOSB certification would be at risk. Recommend structuring investor rights to preserve certification eligibility.',
        fundraisingFitScore: 92,
        bankFitScore: 73,
        investorClarityScore: 95,
        notes:
          'Series A model. Currently under review by outside counsel. Do not use for external distribution until approved.',
        metadata: {
          version: 2,
          effectiveDate: '2026-07-01',
          proposedRound: { amount: 8_000_000, preMoneyValuation: 32_000_000 },
          authorizedSharesProposed: 20_000_000,
          optionPoolTopUp: 1_500_000,
        },
        createdAt: daysAgo(45),
        updatedAt: daysAgo(3),
      },
      {
        name: 'Scenario C — ESOP Expansion Variant',
        description:
          'Variant of Scenario A with expanded employee option pool from 12% to 18% for Series A recruiting competitiveness. Models double-trigger acceleration and 4-year vesting.',
        isTemplate: false,
        isActive: false,
        isPreferred: false,
        status: 'draft',
        certificationFitSummary:
          'ESOP expansion does not affect certification — unissued options excluded from certification ownership calculation. Certification eligibility maintained.',
        fundraisingFitScore: 80,
        bankFitScore: 88,
        investorClarityScore: 82,
        notes:
          'Created for Series A negotiations. Contingent on Series A closing. Not yet board-approved.',
        metadata: {
          version: 1,
          optionPoolTarget: 0.18,
          vestingSchedule: '4-year, 1-year cliff, monthly thereafter',
          accelerationTrigger: 'double-trigger',
        },
        createdAt: daysAgo(21),
        updatedAt: daysAgo(21),
      },
      {
        name: 'Certification Template — SBA 8(a) Compliant',
        description:
          'Reusable template demonstrating 8(a) certification-compliant ownership structure. Reference document for structuring future capital raises.',
        isTemplate: true,
        isActive: false,
        isPreferred: false,
        status: 'approved',
        certificationFitSummary:
          'Template meets all SBA 8(a) requirements: ≥51% ownership by socially and economically disadvantaged individual(s), U.S. citizenship, unconditional ownership, management control.',
        fundraisingFitScore: 70,
        bankFitScore: 90,
        investorClarityScore: 75,
        notes:
          'Use as reference when structuring new capital raises to preserve certification eligibility.',
        createdAt: daysAgo(180),
        updatedAt: daysAgo(90),
      },
    ])
    .returning();

  const scenarioA = scenarios.find((s) => s.isActive)!;
  const scenarioBaseline = scenarios.find((s) => s.name.includes('Baseline'))!;
  const scenarioB = scenarios.find((s) => s.name.includes('Series A Pro Forma'))!;
  const scenarioC = scenarios.find((s) => s.name.includes('ESOP'))!;

  const allocations: (typeof ownershipAllocationsTable.$inferInsert)[] = [
    // Scenario A — Current
    {
      scenarioId: scenarioA.id,
      personName: 'Stephen Lewis',
      role: 'primary_owner',
      equityPct: '51.000',
      votingRightsPct: '55.000',
      isControlling: true,
      isMajorityOwner: true,
      citizenshipConfirmed: true,
      notes:
        'Founder and CEO. SBA-disadvantaged individual certification filed with SBA June 2024. Unconditional ownership — no put/call provisions.',
    },
    {
      scenarioId: scenarioA.id,
      personName: 'Co-Founder — [Name redacted for LP deck version]',
      role: 'co_owner',
      equityPct: '27.000',
      votingRightsPct: '29.000',
      isControlling: false,
      isMajorityOwner: false,
      citizenshipConfirmed: true,
      notes:
        'Co-founder and CTO. U.S. citizen. Standard co-founder provisions — no disproportionate rights.',
    },
    {
      scenarioId: scenarioA.id,
      personName: 'Seed Investor — [Lead VC]',
      role: 'minority_owner',
      equityPct: '13.800',
      votingRightsPct: '9.600',
      isControlling: false,
      isMajorityOwner: false,
      citizenshipConfirmed: false,
      notes:
        'Lead seed investor. Standard protective provisions: liquidation preference 1x non-participating, pro-rata rights, information rights. No board seat at seed stage.',
    },
    {
      scenarioId: scenarioA.id,
      personName: 'Angel Syndicate — Round 1',
      role: 'minority_owner',
      equityPct: '8.200',
      votingRightsPct: '6.400',
      isControlling: false,
      isMajorityOwner: false,
      citizenshipConfirmed: false,
      notes: '6 angel investors, average $350K. Converted from SAFE. Passive rights only.',
    },
    // Scenario Baseline
    {
      scenarioId: scenarioBaseline.id,
      personName: 'Stephen Lewis',
      role: 'primary_owner',
      equityPct: '60.000',
      votingRightsPct: '60.000',
      isControlling: true,
      isMajorityOwner: true,
      citizenshipConfirmed: true,
      notes: 'Pre-seed founding position.',
    },
    {
      scenarioId: scenarioBaseline.id,
      personName: 'Co-Founder',
      role: 'co_owner',
      equityPct: '40.000',
      votingRightsPct: '40.000',
      isControlling: false,
      isMajorityOwner: false,
      citizenshipConfirmed: true,
      notes: 'Pre-seed founding position.',
    },
    // Scenario B — Series A
    {
      scenarioId: scenarioB.id,
      personName: 'Stephen Lewis',
      role: 'primary_owner',
      equityPct: '38.250',
      votingRightsPct: '42.000',
      isControlling: true,
      isMajorityOwner: false,
      citizenshipConfirmed: true,
      notes:
        'Post Series A — diluted from 51%. Certification risk flagged. Review board control structure.',
    },
    {
      scenarioId: scenarioB.id,
      personName: 'Co-Founder',
      role: 'co_owner',
      equityPct: '20.250',
      votingRightsPct: '22.500',
      isControlling: false,
      isMajorityOwner: false,
      citizenshipConfirmed: true,
    },
    {
      scenarioId: scenarioB.id,
      personName: 'Series A Investor',
      role: 'minority_owner',
      equityPct: '22.220',
      votingRightsPct: '19.000',
      isControlling: false,
      isMajorityOwner: false,
      citizenshipConfirmed: false,
      notes: 'Series A lead — Board seat included. Standard Series A protections.',
    },
    {
      scenarioId: scenarioB.id,
      personName: 'Seed Investor — [Lead VC]',
      role: 'minority_owner',
      equityPct: '10.350',
      votingRightsPct: '8.100',
      isControlling: false,
      isMajorityOwner: false,
      citizenshipConfirmed: false,
    },
    {
      scenarioId: scenarioB.id,
      personName: 'Angel Syndicate — Round 1',
      role: 'minority_owner',
      equityPct: '6.150',
      votingRightsPct: '4.800',
      isControlling: false,
      isMajorityOwner: false,
      citizenshipConfirmed: false,
    },
    // Scenario C
    {
      scenarioId: scenarioC.id,
      personName: 'Stephen Lewis',
      role: 'primary_owner',
      equityPct: '48.450',
      votingRightsPct: '52.100',
      isControlling: true,
      isMajorityOwner: false,
      citizenshipConfirmed: true,
      notes:
        'ESOP expansion variant — option pool increases dilute founder slightly. Certification maintained.',
    },
    {
      scenarioId: scenarioC.id,
      personName: 'Co-Founder',
      role: 'co_owner',
      equityPct: '25.650',
      votingRightsPct: '27.500',
      isControlling: false,
      isMajorityOwner: false,
      citizenshipConfirmed: true,
    },
    {
      scenarioId: scenarioC.id,
      personName: 'Seed Investor — [Lead VC]',
      role: 'minority_owner',
      equityPct: '13.100',
      votingRightsPct: '9.100',
      isControlling: false,
      isMajorityOwner: false,
      citizenshipConfirmed: false,
    },
    {
      scenarioId: scenarioC.id,
      personName: 'Angel Syndicate — Round 1',
      role: 'minority_owner',
      equityPct: '7.800',
      votingRightsPct: '6.100',
      isControlling: false,
      isMajorityOwner: false,
      citizenshipConfirmed: false,
    },
  ];

  await db.insert(ownershipAllocationsTable).values(allocations);

  const controlRoles: (typeof controlRolesTable.$inferInsert)[] = [
    {
      scenarioId: scenarioA.id,
      personName: 'Stephen Lewis',
      hasDayToDayControl: true,
      hasLongTermDecisionAuthority: true,
      hasHiringFiringAuthority: true,
      hasStrategicVeto: true,
      controlDescription:
        'CEO and Managing Director. Exercises full day-to-day operational control. Board chairman. Strategic decisions require CEO signature. Hiring/firing authority up to VP-level.',
    },
    {
      scenarioId: scenarioA.id,
      personName: 'Co-Founder',
      hasDayToDayControl: true,
      hasLongTermDecisionAuthority: false,
      hasHiringFiringAuthority: false,
      hasStrategicVeto: false,
      controlDescription:
        'CTO — exercises day-to-day control over engineering and product only. No strategic or financial veto rights. Reports to CEO.',
    },
    {
      scenarioId: scenarioB.id,
      personName: 'Stephen Lewis',
      hasDayToDayControl: true,
      hasLongTermDecisionAuthority: true,
      hasHiringFiringAuthority: true,
      hasStrategicVeto: false,
      controlDescription:
        'Post Series A — CEO authority maintained for day-to-day. Board composition changes: 2 founders + 1 Series A investor + 1 independent. Strategic decisions now require board majority.',
    },
    {
      scenarioId: scenarioB.id,
      personName: 'Series A Investor',
      hasDayToDayControl: false,
      hasLongTermDecisionAuthority: false,
      hasHiringFiringAuthority: false,
      hasStrategicVeto: true,
      controlDescription:
        'Board seat holder. Standard protective provisions: veto on M&A above threshold, sale of substantially all assets, additional equity issuance.',
    },
  ];

  await db.insert(controlRolesTable).values(controlRoles);

  return {
    scenarios: scenarios.length,
    allocations: allocations.length,
    controlRoles: controlRoles.length,
  };
}
