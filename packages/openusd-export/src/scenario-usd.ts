import { type UsdExportResult, type UsdPrim, type UsdStage, buildExportResult } from './serializer.js';

export interface ThreatActor {
  id: string;
  label: string;
  category: 'apt' | 'ransomware' | 'insider' | 'nation_state' | 'hacktivist' | 'criminal';
  ttp?: string[];
  targetedSystems?: string[];
}

export interface SecurityScenario {
  scenarioId: string;
  name: string;
  description: string;
  type: 'incident_response' | 'threat_simulation' | 'red_team' | 'tabletop' | 'breach_rehearsal';
  domain: 'cyber' | 'physical' | 'hybrid';
  threatActors?: ThreatActor[];
  affectedSystems?: Array<{
    id: string;
    name: string;
    criticality: 'low' | 'medium' | 'high' | 'critical';
  }>;
  phases?: Array<{
    id: string;
    name: string;
    description: string;
    ttps?: string[];
    durationMinutes?: number;
    detectionProbability?: number;
  }>;
  postureScoreBefore?: number;
  postureScoreAfter?: number;
  mttdEstimateMinutes?: number;
  mttrEstimateMinutes?: number;
  blastRadiusPct?: number;
  organizationId?: string;
  classificationLevel?: 'unclassified' | 'confidential' | 'secret';
  simulationParams?: Record<string, unknown>;
}

export function exportSecurityScenario(scenario: SecurityScenario): UsdExportResult {
  const warnings: string[] = [];
  const primId = scenario.scenarioId.replace(/\W/g, '_');

  const scenarioPrim: UsdPrim = {
    path: `/${primId}`,
    typeName: 'Xform',
    attributes: [
      { name: 'szl:scenarioId', type: 'string', value: scenario.scenarioId, custom: true },
      { name: 'szl:name', type: 'string', value: scenario.name, custom: true },
      { name: 'szl:type', type: 'token', value: scenario.type, custom: true },
      { name: 'szl:domain', type: 'token', value: scenario.domain, custom: true },
      {
        name: 'szl:postureScoreBefore',
        type: 'float',
        value: scenario.postureScoreBefore ?? 0,
        custom: true,
      },
      {
        name: 'szl:postureScoreAfter',
        type: 'float',
        value: scenario.postureScoreAfter ?? 0,
        custom: true,
      },
      {
        name: 'szl:mttdMinutes',
        type: 'float',
        value: scenario.mttdEstimateMinutes ?? 0,
        custom: true,
      },
      {
        name: 'szl:mttrMinutes',
        type: 'float',
        value: scenario.mttrEstimateMinutes ?? 0,
        custom: true,
      },
      {
        name: 'szl:blastRadiusPct',
        type: 'float',
        value: scenario.blastRadiusPct ?? 0,
        custom: true,
      },
      {
        name: 'szl:classification',
        type: 'token',
        value: scenario.classificationLevel ?? 'unclassified',
        custom: true,
      },
    ],
    children: [],
  };

  scenario.threatActors?.forEach((actor, i) => {
    scenarioPrim.children?.push({
      path: `${scenarioPrim.path}/ThreatActor_${i}`,
      typeName: 'Xform',
      attributes: [
        { name: 'szl:actorId', type: 'string', value: actor.id, custom: true },
        { name: 'szl:actorLabel', type: 'string', value: actor.label, custom: true },
        { name: 'szl:category', type: 'token', value: actor.category, custom: true },
        { name: 'szl:ttps', type: 'string', value: (actor.ttp ?? []).join(';'), custom: true },
      ],
    });
  });

  scenario.affectedSystems?.forEach((sys, i) => {
    scenarioPrim.children?.push({
      path: `${scenarioPrim.path}/AffectedSystem_${i}`,
      typeName: 'Xform',
      attributes: [
        { name: 'szl:systemId', type: 'string', value: sys.id, custom: true },
        { name: 'szl:systemName', type: 'string', value: sys.name, custom: true },
        { name: 'szl:criticality', type: 'token', value: sys.criticality, custom: true },
      ],
    });
    if (sys.criticality === 'critical')
      warnings.push(`Critical system '${sys.name}' in blast radius`);
  });

  scenario.phases?.forEach((phase, i) => {
    scenarioPrim.children?.push({
      path: `${scenarioPrim.path}/Phase_${i}`,
      typeName: 'Xform',
      attributes: [
        { name: 'szl:phaseId', type: 'string', value: phase.id, custom: true },
        { name: 'szl:phaseName', type: 'string', value: phase.name, custom: true },
        { name: 'szl:duration', type: 'float', value: phase.durationMinutes ?? 0, custom: true },
        {
          name: 'szl:detectionProbability',
          type: 'float',
          value: phase.detectionProbability ?? 0.5,
          custom: true,
        },
        { name: 'szl:ttps', type: 'string', value: (phase.ttps ?? []).join(';'), custom: true },
      ],
    });
  });

  if ((scenario.postureScoreBefore ?? 100) - (scenario.postureScoreAfter ?? 100) > 20) {
    warnings.push('Large posture score drop in scenario — consider defensive controls');
  }

  const stage: UsdStage = {
    defaultPrim: primId,
    upAxis: 'Y',
    metersPerUnit: 1.0,
    prims: [scenarioPrim],
    metadata: {
      'szl:exportType': 'security_scenario',
      'szl:exportedAt': new Date().toISOString(),
      'szl:scenarioType': scenario.type,
    },
  };

  return buildExportResult(stage, scenario.scenarioId, 'security_scenario', warnings);
}
