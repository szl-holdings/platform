export { type ProviderMode, type DataProvider, resolveProviderMode, createProvider } from "./factory.js";
export { vesselsMockProvider, type VesselRecord } from "./vessels-mock.js";
export { incaMockProvider, type IncaModel } from "./inca-mock.js";
export { bookingMockProvider, type BookingAppointment } from "./booking-mock.js";
export { holdingsMockProvider, type HoldingsVenture } from "./holdings-mock.js";
export {
  mockData as vesselsDomainMockData,
  type VesselProfile,
  type MaintenanceLog,
  type ComplianceCertificate,
  type PortStateDeficiency,
  type ShipmentRecord,
  type EventLog,
  type EmissionRecord,
  type AIBriefing,
  type PredictiveMaintenance,
  type ForecastModule,
} from "./vessels-domain-mock.js";
export {
  clients as mspClients,
  tickets as mspTickets,
  devices as mspDevices,
  contracts as mspContracts,
  alerts as mspAlerts,
  technicians as mspTechnicians,
  revenueData as mspRevenueData,
  uptimeData as mspUptimeData,
  incidentTimeline as mspIncidentTimeline,
  type Client as MspClient,
  type Ticket as MspTicket,
  type Device as MspDevice,
  type Contract as MspContract,
  type Alert as MspAlert,
  type Technician as MspTechnician,
} from "./msp-mock.js";
export {
  signals as lyteSignals,
  incidents as lyteIncidents,
  recommendations as lyteRecommendations,
  playbooks as lytePlaybooks,
  commandCards as lyteCommandCards,
} from "./lyte-mock.js";
export {
  mockPrograms,
  mockDimensions,
  mockMilestones,
  mockRisks,
  mockAlerts as readinessMockAlerts,
  mockScoreHistory,
  type Program,
  type Dimension,
  type Milestone,
  type Risk,
  type Alert as ReadinessAlert,
  type ScoreHistory,
} from "./readiness-mock.js";
