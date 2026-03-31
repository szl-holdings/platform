import { gql, useQuery, useSubscription } from "@apollo/client";

export const GET_VESSELS = gql`
  query GetVessels($status: String, $limit: Int, $offset: Int) {
    vessels(status: $status, limit: $limit, offset: $offset) {
      id
      name
      imo
      vesselType
      status
      fleetId
      createdAt
    }
  }
`;

export const GET_VESSEL = gql`
  query GetVessel($id: ID!) {
    vessel(id: $id) {
      id
      name
      imo
      vesselType
      status
      fleetId
      createdAt
    }
  }
`;

export const GET_VESSEL_POSITIONS = gql`
  query GetVesselPositions($vesselId: ID, $limit: Int) {
    vesselPositions(vesselId: $vesselId, limit: $limit) {
      vesselId
      latitude
      longitude
      speed
      recordedAt
    }
  }
`;

export const GET_VESSEL_ROUTES = gql`
  query GetVesselRoutes($vesselId: ID, $status: String, $limit: Int, $offset: Int) {
    vesselRoutes(vesselId: $vesselId, status: $status, limit: $limit, offset: $offset) {
      id
      vesselId
      originPort
      destinationPort
      departureAt
      status
    }
  }
`;

export const GET_VESSEL_EVENTS = gql`
  query GetVesselEvents($vesselId: ID, $severity: String, $limit: Int, $offset: Int) {
    vesselEvents(vesselId: $vesselId, severity: $severity, limit: $limit, offset: $offset) {
      id
      vesselId
      eventType
      severity
      status
      occurredAt
    }
  }
`;

export const VESSEL_POSITION_UPDATED = gql`
  subscription VesselPositionUpdated($vesselId: ID) {
    vesselPositionUpdated(vesselId: $vesselId) {
      vesselId
      latitude
      longitude
      speed
      recordedAt
    }
  }
`;

export function useVessels(variables?: { status?: string; limit?: number; offset?: number }) {
  return useQuery(GET_VESSELS, { variables });
}

export function useVessel(id: string) {
  return useQuery(GET_VESSEL, { variables: { id } });
}

export function useVesselPositions(variables?: { vesselId?: string; limit?: number }) {
  return useQuery(GET_VESSEL_POSITIONS, { variables });
}

export function useVesselRoutes(variables?: { vesselId?: string; status?: string; limit?: number; offset?: number }) {
  return useQuery(GET_VESSEL_ROUTES, { variables });
}

export function useVesselEvents(variables?: { vesselId?: string; severity?: string; limit?: number; offset?: number }) {
  return useQuery(GET_VESSEL_EVENTS, { variables });
}

export function useVesselPositionUpdated(variables?: { vesselId?: string }) {
  return useSubscription(VESSEL_POSITION_UPDATED, { variables });
}
