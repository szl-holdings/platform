import { gql, useQuery, useMutation, useSubscription } from "@apollo/client";

export const GET_LYTE_INCIDENTS = gql`
  query GetLyteIncidents($status: String, $severity: String, $limit: Int, $offset: Int) {
    lyteIncidents(status: $status, severity: $severity, limit: $limit, offset: $offset) {
      id
      severity
      status
      impactArea
      rootCause
      createdAt
    }
  }
`;

export const GET_LYTE_SIGNALS = gql`
  query GetLyteSignals($severity: String, $status: String, $limit: Int, $offset: Int) {
    lyteSignals(severity: $severity, status: $status, limit: $limit, offset: $offset) {
      id
      source
      severity
      title
      status
      createdAt
    }
  }
`;

export const GET_LYTE_ACTIONS = gql`
  query GetLyteActions($state: String, $limit: Int, $offset: Int) {
    lyteActions(state: $state, limit: $limit, offset: $offset) {
      id
      state
      priority
      valueAtRisk
      createdAt
    }
  }
`;

export const GET_LYTE_WORKSPACES = gql`
  query GetLyteWorkspaces($limit: Int, $offset: Int) {
    lyteWorkspaces(limit: $limit, offset: $offset) {
      id
      name
      ownerId
      createdAt
    }
  }
`;

export const UPDATE_LYTE_INCIDENT = gql`
  mutation UpdateLyteIncident($id: ID!, $status: String!) {
    updateLyteIncident(id: $id, status: $status) {
      id
      severity
      status
      impactArea
      rootCause
      createdAt
    }
  }
`;

export const LYTE_INCIDENT_UPDATED = gql`
  subscription LyteIncidentUpdated {
    lyteIncidentUpdated {
      id
      severity
      status
      impactArea
      rootCause
      createdAt
    }
  }
`;

export const LYTE_SIGNAL_UPDATED = gql`
  subscription LyteSignalUpdated {
    lyteSignalUpdated {
      id
      source
      severity
      title
      status
      createdAt
    }
  }
`;

export const LYTE_QUEUE_CHANGED = gql`
  subscription LyteQueueChanged {
    lyteQueueChanged {
      id
      entityType
      entityId
      priority
      status
      severity
      title
      assignee
      createdAt
      updatedAt
    }
  }
`;

export function useLyteIncidents(variables?: { status?: string; severity?: string; limit?: number; offset?: number }) {
  return useQuery(GET_LYTE_INCIDENTS, variables !== undefined ? { variables } : {});
}

export function useLyteSignals(variables?: { severity?: string; status?: string; limit?: number; offset?: number }) {
  return useQuery(GET_LYTE_SIGNALS, variables !== undefined ? { variables } : {});
}

export function useLyteActions(variables?: { state?: string; limit?: number; offset?: number }) {
  return useQuery(GET_LYTE_ACTIONS, variables !== undefined ? { variables } : {});
}

export function useLyteWorkspaces(variables?: { limit?: number; offset?: number }) {
  return useQuery(GET_LYTE_WORKSPACES, variables !== undefined ? { variables } : {});
}

export function useUpdateLyteIncident() {
  return useMutation(UPDATE_LYTE_INCIDENT);
}

export function useLyteIncidentUpdated() {
  return useSubscription(LYTE_INCIDENT_UPDATED);
}

export function useLyteSignalUpdated() {
  return useSubscription(LYTE_SIGNAL_UPDATED);
}

export function useLyteQueueChanged() {
  return useSubscription(LYTE_QUEUE_CHANGED);
}
