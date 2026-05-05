import { gql, useQuery, useSubscription } from "@apollo/client";

export const GET_AEGIS_INCIDENTS = gql`
  query GetAegisIncidents($limit: Int, $offset: Int) {
    aegisIncidents(limit: $limit, offset: $offset) {
      id
      title
      status
      severity
      detectedAt
      createdAt
    }
  }
`;

export const AEGIS_INCIDENT_UPDATED = gql`
  subscription AegisIncidentUpdated {
    aegisIncidentUpdated {
      id
      title
      status
      severity
      detectedAt
      createdAt
    }
  }
`;

export function useAegisIncidents(variables?: { limit?: number; offset?: number }) {
  return useQuery(GET_AEGIS_INCIDENTS, variables !== undefined ? { variables } : {});
}

export function useAegisIncidentUpdated() {
  return useSubscription(AEGIS_INCIDENT_UPDATED);
}
