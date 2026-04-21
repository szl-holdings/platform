import { gql, useQuery, useMutation, useSubscription } from "@apollo/client";

export const GET_ALLOY_WORKFLOWS = gql`
  query GetAlloyWorkflows($limit: Int, $offset: Int) {
    alloyWorkflows(limit: $limit, offset: $offset) {
      id
      name
      type
      status
      priority
      createdAt
    }
  }
`;

export const GET_ALLOY_WORKFLOW_RUNS = gql`
  query GetAlloyWorkflowRuns($workflowId: ID, $limit: Int, $offset: Int) {
    alloyWorkflowRuns(workflowId: $workflowId, limit: $limit, offset: $offset) {
      id
      workflowId
      status
      durationMs
      startedAt
      completedAt
    }
  }
`;

export const GET_ALLOY_SIGNALS = gql`
  query GetAlloySignals($limit: Int, $offset: Int) {
    alloySignals(limit: $limit, offset: $offset) {
      id
      source
      sourceType
      domain
      severity
      status
      createdAt
    }
  }
`;

export const GET_ALLOY_ARTIFACTS = gql`
  query GetAlloyArtifacts($limit: Int, $offset: Int) {
    alloyArtifacts(limit: $limit, offset: $offset) {
      id
      type
      title
      content
      confidenceScore
      createdAt
    }
  }
`;

export const CREATE_ALLOY_WORKFLOW = gql`
  mutation CreateAlloyWorkflow($name: String!, $type: String, $priority: String) {
    createAlloyWorkflow(name: $name, type: $type, priority: $priority) {
      id
      name
      type
      status
      priority
      createdAt
    }
  }
`;

export const UPDATE_ALLOY_WORKFLOW_RUN = gql`
  mutation UpdateAlloyWorkflowRun($id: ID!, $status: String!) {
    updateAlloyWorkflowRun(id: $id, status: $status) {
      id
      workflowId
      status
      durationMs
      startedAt
      completedAt
    }
  }
`;

export const ALLOY_WORKFLOW_RUN_UPDATED = gql`
  subscription AlloyWorkflowRunUpdated($workflowId: ID) {
    alloyWorkflowRunUpdated(workflowId: $workflowId) {
      id
      workflowId
      status
      durationMs
      startedAt
      completedAt
    }
  }
`;

export function useAlloyWorkflows(variables?: { limit?: number; offset?: number }) {
  return useQuery(GET_ALLOY_WORKFLOWS, variables !== undefined ? { variables } : {});
}

export function useAlloyWorkflowRuns(variables?: { workflowId?: string; limit?: number; offset?: number }) {
  return useQuery(GET_ALLOY_WORKFLOW_RUNS, variables !== undefined ? { variables } : {});
}

export function useAlloySignals(variables?: { limit?: number; offset?: number }) {
  return useQuery(GET_ALLOY_SIGNALS, variables !== undefined ? { variables } : {});
}

export function useAlloyArtifacts(variables?: { limit?: number; offset?: number }) {
  return useQuery(GET_ALLOY_ARTIFACTS, variables !== undefined ? { variables } : {});
}

export function useCreateAlloyWorkflow() {
  return useMutation(CREATE_ALLOY_WORKFLOW);
}

export function useUpdateAlloyWorkflowRun() {
  return useMutation(UPDATE_ALLOY_WORKFLOW_RUN);
}

export function useAlloyWorkflowRunUpdated(variables?: { workflowId?: string }) {
  return useSubscription(ALLOY_WORKFLOW_RUN_UPDATED, variables !== undefined ? { variables } : {});
}
