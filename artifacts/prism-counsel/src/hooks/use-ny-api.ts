import { useQuery } from "@tanstack/react-query";

const API = "/api";

async function nyFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`NY API ${path} failed: ${res.statusText}`);
  const json = await res.json();
  return json.data ?? json;
}

export function useNyMatters() {
  return useQuery({
    queryKey: ["ny-matters"],
    queryFn: () => nyFetch<NyMatterSummary[]>("/prism-counsel/ny/matters"),
    staleTime: 60_000,
  });
}

export function useNyMatterDetail(matterId: number | null) {
  return useQuery({
    queryKey: ["ny-matter", matterId],
    queryFn: () => nyFetch<NyMatterDetail>(`/prism-counsel/ny/matters/${matterId}`),
    enabled: matterId !== null,
    staleTime: 30_000,
  });
}

export function useNyClockRules() {
  return useQuery({
    queryKey: ["ny-clock-rules"],
    queryFn: () => nyFetch<NyClockRule[]>("/prism-counsel/ny/clock-rules"),
    staleTime: 300_000,
  });
}

export function useNyVenueProfiles() {
  return useQuery({
    queryKey: ["ny-venue-profiles"],
    queryFn: () => nyFetch<NyVenueProfile[]>("/prism-counsel/ny/venue-profiles"),
    staleTime: 300_000,
  });
}

export function useNyInsurerProfiles() {
  return useQuery({
    queryKey: ["ny-insurer-profiles"],
    queryFn: () => nyFetch<NyInsurerProfile[]>("/prism-counsel/ny/insurer-profiles"),
    staleTime: 300_000,
  });
}

export function useNyForecasts(matterId: number | null) {
  return useQuery({
    queryKey: ["ny-forecasts", matterId],
    queryFn: () => nyFetch<NyForecastRun[]>(`/prism-counsel/ny/matters/${matterId}/forecasts`),
    enabled: matterId !== null,
    staleTime: 60_000,
  });
}

export function useNyMatterClocks(matterId: number | null) {
  return useQuery({
    queryKey: ["ny-clocks", matterId],
    queryFn: () => nyFetch<NyMatterClock[]>(`/prism-counsel/ny/matters/${matterId}/clocks`),
    enabled: matterId !== null,
    staleTime: 30_000,
  });
}

export function useNyMatterOffers(matterId: number | null) {
  return useQuery({
    queryKey: ["ny-offers", matterId],
    queryFn: () => nyFetch<NyOfferMovement[]>(`/prism-counsel/ny/matters/${matterId}/offers`),
    enabled: matterId !== null,
    staleTime: 30_000,
  });
}

export function useNyMatterMediations(matterId: number | null) {
  return useQuery({
    queryKey: ["ny-mediations", matterId],
    queryFn: () => nyFetch<NyMediationEvent[]>(`/prism-counsel/ny/matters/${matterId}/mediations`),
    enabled: matterId !== null,
    staleTime: 30_000,
  });
}

export function useNyDemandReadiness(matterId: number | null) {
  return useQuery({
    queryKey: ["ny-demand-readiness", matterId],
    queryFn: () => nyFetch<NyDemandReadinessSnapshot>(`/prism-counsel/ny/matters/${matterId}/demand-readiness`),
    enabled: matterId !== null,
    staleTime: 30_000,
  });
}

export function useNyMatterDenials(matterId: number | null) {
  return useQuery({
    queryKey: ["ny-denials", matterId],
    queryFn: () => nyFetch<NyDenial[]>(`/prism-counsel/ny/matters/${matterId}/denials`),
    enabled: matterId !== null,
    staleTime: 30_000,
  });
}

export function useNyPartProfiles() {
  return useQuery({
    queryKey: ["ny-part-profiles"],
    queryFn: () => nyFetch<NyPartProfile[]>("/prism-counsel/ny/part-profiles"),
    staleTime: 300_000,
  });
}

export function useNyDefensibilityScore(matterId: number | null) {
  return useQuery({
    queryKey: ["ny-defensibility", matterId],
    queryFn: () => nyFetch<NyDefensibilityScore>(`/prism-counsel/ny/matters/${matterId}/defensibility`),
    enabled: matterId !== null,
    staleTime: 60_000,
  });
}

export function useNyHealth() {
  return useQuery({
    queryKey: ["ny-health"],
    queryFn: () => nyFetch<{ service: string; status: string; timestamp: string }>("/prism-counsel/ny/health"),
    staleTime: 60_000,
    retry: false,
  });
}

export interface NyMatterSummary {
  id: number;
  orgId: number;
  caseNumber: string;
  title: string;
  status: string;
  matterType: string;
  jurisdiction: string | null;
  courtName: string | null;
  healthScore: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NyMatterDetail extends NyMatterSummary {
  clocks?: NyMatterClock[];
  forecasts?: NyForecastRun[];
}

export interface NyMatterClock {
  id: number;
  matterId: number;
  clockType: string;
  startedAt: string | null;
  deadlineAt: string | null;
  status: string;
  daysRemaining: number | null;
  isBreached: boolean | null;
  breachedAt: string | null;
  ruleRef: string | null;
  notes: string | null;
}

export interface NyForecastRun {
  id: number;
  matterId: number;
  forecastType: string;
  score: string;
  confidence: string | null;
  weeklyDelta: string | null;
  nextBestAction: string | null;
  modelVersion: string | null;
  runAt: string;
  drivers?: NyForecastDriver[];
}

export interface NyForecastDriver {
  id: number;
  driverName: string;
  driverValue: string | null;
  impact: string;
  weight: string | null;
  explanation: string | null;
}

export interface NyVenueProfile {
  id: number;
  county: string;
  courtName: string | null;
  courtType: string | null;
  averageCycleMonths: number | null;
  medianVerdictAuto: string | null;
  medianVerdictPremises: string | null;
  medianVerdictCoverage: string | null;
  plaintiffFriendliness: string | null;
  adrAvailability: string | null;
  conferenceFrequency: string | null;
  velocityScore: number | null;
  filingExpectations: string | null;
}

export interface NyInsurerProfile {
  id: number;
  carrierName: string;
  region: string | null;
  reservingStyle: string | null;
  denialPattern: string | null;
  medianFirstOffer: string | null;
  averageResponseDays: number | null;
  mediationBehavior: string | null;
  escalationThreshold: string | null;
  litigationTolerance: string | null;
  notes: string | null;
}

export interface NyOfferMovement {
  id: number;
  matterId: number;
  offerType: string;
  amount: string;
  offeringParty: string | null;
  offeredAt: string;
  deltaFromPrevious: string | null;
  deltaPct: string | null;
  movementSignal: string | null;
}

export interface NyMediationEvent {
  id: number;
  matterId: number;
  scheduledAt: string | null;
  sessionType: string | null;
  status: string;
  preReadinessScore: number | null;
  conversionProbability: string | null;
  openingDemand: string | null;
  openingOffer: string | null;
  notes: string | null;
}

export interface NyDemandReadinessSnapshot {
  id: number;
  matterId: number;
  overallScore: number;
  medicalChronologyScore: number | null;
  liabilityScore: number | null;
  damagesScore: number | null;
  lienScore: number | null;
  photographicScore: number | null;
  witnessScore: number | null;
  expertScore: number | null;
  missingItems: string[] | null;
  blockingItems: string[] | null;
  createdAt: string;
}

export interface NyDenial {
  id: number;
  matterId: number;
  denialType: string;
  deniedBy: string | null;
  deniedAt: string | null;
  denialReason: string | null;
  amountDenied: string | null;
  appealStatus: string | null;
  appealDeadline: string | null;
}

export interface NyClockRule {
  id: number;
  ruleId: string;
  clockType: string;
  title: string;
  dayLimit: number | null;
  triggerEvent: string | null;
  consequence: string | null;
  citation: string | null;
  isMandatory: boolean | null;
  appliesTo: string | null;
}

export interface NyPartProfile {
  id: number;
  venueId: number | null;
  partName: string;
  judgeName: string | null;
  trackType: string | null;
  conferenceRules: string | null;
  discoveryTimeline: string | null;
  mediationPolicy: string | null;
}

export interface NyDefensibilityScore {
  id: number;
  matterId: number;
  overallScore: number;
  groundingScore: number | null;
  humanApprovalScore: number | null;
  privilegeScore: number | null;
  auditCompleteness: number | null;
  sourceAttributionScore: number | null;
  openFlags: number | null;
  flagDetails: unknown;
}
