import { gql, useQuery, useMutation, useSubscription } from "@apollo/client";

export const GET_FIRESTORM_INCIDENTS = gql`
  query GetFirestormIncidents($status: String, $severity: String, $limit: Int, $offset: Int) {
    firestormIncidents(status: $status, severity: $severity, limit: $limit, offset: $offset) {
      id
      title
      severity
      status
      detectedAt
      createdAt
    }
  }
`;

export const GET_FIRESTORM_ASSESSMENTS = gql`
  query GetFirestormAssessments($limit: Int, $offset: Int) {
    firestormAssessments(limit: $limit, offset: $offset) {
      id
      name
      assessmentType
      status
      overallRiskScore
      createdAt
    }
  }
`;

export const GET_FIRESTORM_FINDINGS = gql`
  query GetFirestormFindings($assessmentId: ID, $severity: String, $limit: Int, $offset: Int) {
    firestormFindings(assessmentId: $assessmentId, severity: $severity, limit: $limit, offset: $offset) {
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

export const GET_FIRESTORM_ASSETS = gql`
  query GetFirestormAssets($limit: Int, $offset: Int) {
    firestormAssets(limit: $limit, offset: $offset) {
      id
      name
      assetType
      riskScore
      exposureLevel
      createdAt
    }
  }
`;

export const UPDATE_FIRESTORM_INCIDENT = gql`
  mutation UpdateFirestormIncident($id: ID!, $status: String!) {
    updateFirestormIncident(id: $id, status: $status) {
      id
      title
      severity
      status
      detectedAt
      createdAt
    }
  }
`;

export const FIRESTORM_INCIDENT_UPDATED = gql`
  subscription FirestormIncidentUpdated {
    firestormIncidentUpdated {
      id
      title
      severity
      status
      detectedAt
      createdAt
    }
  }
`;

export function useFirestormIncidents(variables?: { status?: string; severity?: string; limit?: number; offset?: number }) {
  return useQuery(GET_FIRESTORM_INCIDENTS, { variables });
}

export function useFirestormAssessments(variables?: { limit?: number; offset?: number }) {
  return useQuery(GET_FIRESTORM_ASSESSMENTS, { variables });
}

export function useFirestormFindings(variables?: { assessmentId?: string; severity?: string; limit?: number; offset?: number }) {
  return useQuery(GET_FIRESTORM_FINDINGS, { variables });
}

export function useFirestormAssets(variables?: { limit?: number; offset?: number }) {
  return useQuery(GET_FIRESTORM_ASSETS, { variables });
}

export function useUpdateFirestormIncident() {
  return useMutation(UPDATE_FIRESTORM_INCIDENT);
}

export function useFirestormIncidentUpdated() {
  return useSubscription(FIRESTORM_INCIDENT_UPDATED);
}
