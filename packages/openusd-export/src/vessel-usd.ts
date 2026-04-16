import { buildExportResult, serializeToUsda } from "./serializer.js";
import type { UsdStage, UsdPrim, UsdExportResult } from "./serializer.js";

export interface VesselUsdState {
  imoNumber: string;
  name: string;
  vesselType?: string;
  position: { lat: number; lon: number };
  heading?: number;
  speedKnots?: number;
  destination?: string;
  eta?: string;
  routeWaypoints?: Array<{ lat: number; lon: number; name?: string }>;
  fuelLevelPercent?: number;
  cargoStatus?: string;
  lengthM?: number;
  beamM?: number;
  draftM?: number;
  deadweightTonnage?: number;
  flagState?: string;
  operator?: string;
  routeRiskLevel?: "low" | "medium" | "high" | "critical";
  simulationScenario?: string;
  metadata?: Record<string, string>;
}

export interface RouteSimulationParams {
  vessel: VesselUsdState;
  originPort?: { lat: number; lon: number; name: string };
  destinationPort?: { lat: number; lon: number; name: string };
  waypoints?: Array<{ lat: number; lon: number; name?: string }>;
  weatherConditions?: { windSpeedKnots?: number; waveHeightM?: number; currentKnots?: number };
  simulatedDurationHours?: number;
  scenario?: "normal" | "storm_diversion" | "chokepoint_delay" | "emergency_deviation";
}

function buildVesselPrim(state: VesselUsdState, allWaypoints: Array<{ lat: number; lon: number; name?: string }>): UsdPrim {
  const vesselId = state.imoNumber.replace(/\W/g, "_");
  const geoPrim: UsdPrim = {
    path: `/${vesselId}/GeoPosition`,
    typeName: "Xform",
    attributes: [
      { name: "xformOp:translate", type: "float3", value: [state.position.lon, 0, state.position.lat] },
      { name: "xformOp:rotateY", type: "float", value: state.heading ?? 0 },
    ],
  };

  const vesselPrim: UsdPrim = {
    path: `/${vesselId}`,
    typeName: "Xform",
    attributes: [
      { name: "szl:imo", type: "string", value: state.imoNumber, custom: true },
      { name: "szl:name", type: "string", value: state.name, custom: true },
      { name: "szl:type", type: "string", value: state.vesselType ?? "cargo", custom: true },
      { name: "szl:speedKnots", type: "float", value: state.speedKnots ?? 0, custom: true },
      { name: "szl:heading", type: "float", value: state.heading ?? 0, custom: true },
      { name: "szl:destination", type: "string", value: state.destination ?? "", custom: true },
      { name: "szl:eta", type: "string", value: state.eta ?? "", custom: true },
      { name: "szl:fuelLevelPct", type: "float", value: state.fuelLevelPercent ?? 100, custom: true },
      { name: "szl:riskLevel", type: "token", value: state.routeRiskLevel ?? "low", custom: true },
      { name: "szl:flagState", type: "string", value: state.flagState ?? "", custom: true },
      { name: "szl:operator", type: "string", value: state.operator ?? "", custom: true },
      { name: "szl:dwt", type: "float", value: state.deadweightTonnage ?? 0, custom: true },
      { name: "szl:cargoStatus", type: "string", value: state.cargoStatus ?? "", custom: true },
      { name: "szl:scenario", type: "token", value: state.simulationScenario ?? "live_state", custom: true },
    ],
    children: [
      geoPrim,
      ...allWaypoints.map((wp, i): UsdPrim => ({
        path: `/${vesselId}/Waypoint_${i}`,
        typeName: "Xform",
        attributes: [
          { name: "xformOp:translate", type: "float3", value: [wp.lon, 0, wp.lat] },
          { name: "szl:waypointName", type: "string", value: wp.name ?? `WP${i}`, custom: true },
          { name: "szl:waypointIndex", type: "int", value: i, custom: true },
        ],
      })),
    ],
  };

  return vesselPrim;
}

export function exportVesselTwin(state: VesselUsdState): UsdExportResult {
  const warnings: string[] = [];

  if (!state.imoNumber) warnings.push("IMO number missing — vessel identity may be incomplete");
  if (state.routeRiskLevel === "critical" || state.routeRiskLevel === "high") {
    warnings.push(`High route risk level (${state.routeRiskLevel}) — simulation scenarios may show deviation`);
  }

  const vesselId = state.imoNumber.replace(/\W/g, "_");
  const vesselPrim = buildVesselPrim(state, state.routeWaypoints ?? []);

  const stage: UsdStage = {
    defaultPrim: vesselId,
    upAxis: "Y",
    metersPerUnit: 1.0,
    prims: [vesselPrim],
    metadata: {
      "szl:exportType": "vessel_digital_twin",
      "szl:exportedAt": new Date().toISOString(),
      "szl:scenario": state.simulationScenario ?? "live_state",
    },
  };

  return buildExportResult(stage, state.imoNumber, "vessel", warnings);
}

export function exportRouteSimulation(params: RouteSimulationParams): UsdExportResult {
  const warnings: string[] = [];
  const vessel = params.vessel;
  const scenario = params.scenario ?? "normal";

  const allWaypoints: Array<{ lat: number; lon: number; name?: string }> = [
    ...(params.originPort ? [{ lat: params.originPort.lat, lon: params.originPort.lon, name: params.originPort.name }] : []),
    ...(params.waypoints ?? vessel.routeWaypoints ?? []),
    ...(params.destinationPort ? [{ lat: params.destinationPort.lat, lon: params.destinationPort.lon, name: params.destinationPort.name }] : []),
  ];

  const vesselId = vessel.imoNumber.replace(/\W/g, "_");
  const vesselPrim = buildVesselPrim(
    { ...vessel, simulationScenario: scenario },
    allWaypoints,
  );

  const routePrim: UsdPrim = {
    path: "/Route",
    typeName: "Xform",
    attributes: [
      { name: "szl:vesselImo", type: "string", value: vessel.imoNumber, custom: true },
      { name: "szl:scenario", type: "token", value: scenario, custom: true },
      { name: "szl:simulatedDurationHours", type: "float", value: params.simulatedDurationHours ?? 0, custom: true },
      { name: "szl:windSpeedKnots", type: "float", value: params.weatherConditions?.windSpeedKnots ?? 0, custom: true },
      { name: "szl:waveHeightM", type: "float", value: params.weatherConditions?.waveHeightM ?? 0, custom: true },
      { name: "szl:currentKnots", type: "float", value: params.weatherConditions?.currentKnots ?? 0, custom: true },
      { name: "szl:waypointCount", type: "int", value: allWaypoints.length, custom: true },
      ...(params.originPort ? [{ name: "szl:originPort", type: "string" as const, value: params.originPort.name, custom: true }] : []),
      ...(params.destinationPort ? [{ name: "szl:destinationPort", type: "string" as const, value: params.destinationPort.name, custom: true }] : []),
    ],
  };

  if (scenario === "storm_diversion") warnings.push("Storm diversion scenario: alternate waypoints may be automatically inserted");
  if (scenario === "chokepoint_delay") warnings.push("Chokepoint delay scenario: ETA extended by simulated queue time");

  const stage: UsdStage = {
    defaultPrim: vesselId,
    upAxis: "Y",
    metersPerUnit: 1.0,
    prims: [vesselPrim, routePrim],
    metadata: {
      "szl:exportType": "vessel_route_simulation",
      "szl:exportedAt": new Date().toISOString(),
      "szl:scenario": scenario,
    },
  };

  return buildExportResult(stage, vessel.imoNumber, "vessel_route", warnings);
}
