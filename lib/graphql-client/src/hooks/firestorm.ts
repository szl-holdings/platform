import { gql, useQuery, useMutation, useSubscription } from "@apollo/client";

export const GET_AEGIS_INCIDENTS = gql`
  query GetAegisIncidents($status: String, $severity: String, $limit: Int, $offset: Int) {
    aegisIncidents(status: $status, severity: $severity, limit: $limit, offset: $offset) {
      id
      title
      severity
      status
      detectedAt
      createdAt
    }
  }
`;

export const GET_AEGIS_ASSESSMENTS = gql`
  query GetAegisAssessments($limit: Int, $offset: Int) {
    aegisAssessments(limit: $limit, offset: $offset) {
      id
      name
      assessmentType
      status
      overallRiskScore
      createdAt
    }
  }
`;

export const GET_AEGIS_FINDINGS = gql`
  query GetAegisFindings($assessmentId: ID, $severity: String, $limit: Int, $offset: Int) {
    aegisFindings(assessmentId: $assessmentId, severity: $severity, limit: $limit, offset: $offset) {
      id
      assessmentId
      severity
      status
      affectedAsset
      recommendation
      createdAt
    }
  }
`;

export const GET_AEGIS_ASSETS = gql`
  query GetAegisAssets($limit: Int, $offset: Int) {
    aegisAssets(limit: $limit, offset: $offset) {
      id
      name
      assetType
      riskScore
      exposureLevel
      createdAt
    }
  }
`;

export const UPDATE_AEGIS_INCIDENT = gql`
  mutation UpdateAegisIncident($id: ID!, $status: String!) {
    updateAegisIncident(id: $id, status: $status) {
      id
      title
      severity
      status
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
      severity
      status
      detectedAt
      createdAt
    }
  }
`;

export function useAegisIncidents(variables?: { status?: string; severity?: string; limit?: number; offset?: number }) {
  return useQuery(GET_AEGIS_INCIDENTS, variables !== undefined ? { variables } : {});
}

export function useAegisAssessments(variables?: { limit?: number; offset?: number }) {
  return useQuery(GET_AEGIS_ASSESSMENTS, variables !== undefined ? { variables } : {});
}

export function useAegisFindings(variables?: { assessmentId?: string; severity?: string; limit?: number; offset?: number }) {
  return useQuery(GET_AEGIS_FINDINGS, variables !== undefined ? { variables } : {});
}

export function useAegisAssets(variables?: { limit?: number; offset?: number }) {
  return useQuery(GET_AEGIS_ASSETS, variables !== undefined ? { variables } : {});
}

export function useUpdateAegisIncident() {
  return useMutation(UPDATE_AEGIS_INCIDENT);
}

export function useAegisIncidentUpdated() {
  return useSubscription(AEGIS_INCIDENT_UPDATED);
}

/** @deprecated Use useAegisIncidents */
export const useFirestormIncidents = useAegisIncidents;
/** @deprecated Use useAegisAssessments */
export const useFirestormAssessments = useAegisAssessments;
/** @deprecated Use useAegisFindings */
export const useFirestormFindings = useAegisFindings;
/** @deprecated Use useAegisAssets */
export const useFirestormAssets = useAegisAssets;
/** @deprecated Use useUpdateAegisIncident */
export const useUpdateFirestormIncident = useUpdateAegisIncident;
/** @deprecated Use useAegisIncidentUpdated */
export const useFirestormIncidentUpdated = useAegisIncidentUpdated;
