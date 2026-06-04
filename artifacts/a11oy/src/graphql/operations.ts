import { gql } from 'urql';

export const ALLOY_DASHBOARD_QUERY = gql`
  query AlloyDashboard {
    alloyDashboard {
      totalWorkflows
      totalRuns
      runningRuns
      pendingApprovals
      failedRuns
      successRate
      avgDurationMs
      workflowsByStatus {
        status
        count
      }
      recentActivity {
        id
        entityType
        entityId
        action
        actorUserId
        actorType
        previousState
        newState
        notes
        correlationId
        createdAt
      }
    }
  }
`;

export const ALLOY_SIGNALS_QUERY = gql`
  query AlloySignals($limit: Int, $offset: Int, $severity: String, $status: String, $domain: String) {
    alloySignals(limit: $limit, offset: $offset, severity: $severity, status: $status, domain: $domain) {
      id
      source
      sourceType
      domain
      severity
      status
      title
      description
      confidence
      ownerUserId
      environment
      createdAt
      updatedAt
    }
  }
`;

export const ALLOY_SIGNAL_QUERY = gql`
  query AlloySignal($id: ID!) {
    alloySignal(id: $id) {
      id
      source
      sourceType
      domain
      severity
      status
      title
      description
      confidence
      ownerUserId
      environment
      createdAt
      updatedAt
    }
  }
`;

export const ALLOY_WORKFLOWS_QUERY = gql`
  query AlloyWorkflows($limit: Int, $offset: Int, $status: String, $priority: String, $domain: String) {
    alloyWorkflows(limit: $limit, offset: $offset, status: $status, priority: $priority, domain: $domain) {
      id
      name
      description
      type
      domain
      status
      priority
      requiresApproval
      approvalState
      confidenceScore
      triggerId
      triggerType
      environment
      steps {
        step
        name
        description
        status
        startedAt
        completedAt
        error
      }
      currentStep
      retryCount
      ownerUserId
      startedAt
      completedAt
      errorMessage
      createdAt
      updatedAt
      canRun
      canCancel
      canRetry
      allowedNextStates
    }
  }
`;

export const ALLOY_WORKFLOW_QUERY = gql`
  query AlloyWorkflow($id: ID!) {
    alloyWorkflow(id: $id) {
      id
      name
      description
      type
      domain
      status
      priority
      requiresApproval
      approvalState
      confidenceScore
      steps {
        step
        name
        description
        status
        startedAt
        completedAt
        error
      }
      currentStep
      retryCount
      ownerUserId
      startedAt
      completedAt
      errorMessage
      createdAt
      updatedAt
      canRun
      canCancel
      canRetry
      allowedNextStates
    }
  }
`;

export const ALLOY_WORKFLOW_RUNS_QUERY = gql`
  query AlloyWorkflowRuns($workflowId: ID, $limit: Int, $offset: Int, $status: String) {
    alloyWorkflowRuns(workflowId: $workflowId, limit: $limit, offset: $offset, status: $status) {
      id
      workflowId
      runNumber
      status
      trigger
      durationMs
      errorMessage
      ownerUserId
      approvalState
      stepsExecuted {
        step
        name
        description
        status
        startedAt
        completedAt
        error
      }
      startedAt
      completedAt
    }
  }
`;

export const ALLOY_APPROVALS_QUERY = gql`
  query AlloyApprovals($workflowId: ID, $status: String, $limit: Int, $offset: Int) {
    alloyApprovals(workflowId: $workflowId, status: $status, limit: $limit, offset: $offset) {
      id
      workflowId
      status
      reason
      reviewNote
      requestedByUserId
      reviewerUserId
      requiredRoles
      expiresAt
      reviewedAt
      createdAt
    }
  }
`;

export const ALLOY_ACTIONS_QUERY = gql`
  query AlloyActions($workflowId: ID, $limit: Int, $offset: Int) {
    alloyActions(workflowId: $workflowId, limit: $limit, offset: $offset) {
      id
      workflowId
      type
      status
      description
      outcome
      actorUserId
      actorType
      executedAt
      createdAt
    }
  }
`;

export const ALLOY_ARTIFACTS_QUERY = gql`
  query AlloyArtifacts($workflowId: ID, $domain: String, $limit: Int, $offset: Int) {
    alloyArtifacts(workflowId: $workflowId, domain: $domain, limit: $limit, offset: $offset) {
      id
      workflowId
      signalId
      type
      title
      content
      domain
      format
      confidenceScore
      requiresApproval
      approvalState
      tags
      ownerUserId
      publishedAt
      createdAt
    }
  }
`;

export const ALLOY_AUDIT_LOG_QUERY = gql`
  query AlloyAuditLog($entityType: String, $entityId: ID, $limit: Int, $offset: Int) {
    alloyAuditLog(entityType: $entityType, entityId: $entityId, limit: $limit, offset: $offset) {
      id
      entityType
      entityId
      action
      actorUserId
      actorType
      previousState
      newState
      notes
      correlationId
      createdAt
    }
  }
`;

export const CREATE_ALLOY_WORKFLOW = gql`
  mutation CreateAlloyWorkflow(
    $name: String!
    $type: String
    $priority: String
    $description: String
    $domain: String
    $requiresApproval: Boolean
  ) {
    createAlloyWorkflow(
      name: $name
      type: $type
      priority: $priority
      description: $description
      domain: $domain
      requiresApproval: $requiresApproval
    ) {
      id
      name
      status
      priority
      type
      domain
      requiresApproval
      createdAt
    }
  }
`;

export const SUBMIT_ALLOY_WORKFLOW = gql`
  mutation SubmitAlloyWorkflow($id: ID!) {
    submitAlloyWorkflow(id: $id) {
      id
      status
      allowedNextStates
    }
  }
`;

export const CANCEL_ALLOY_WORKFLOW = gql`
  mutation CancelAlloyWorkflow($id: ID!, $reason: String) {
    cancelAlloyWorkflow(id: $id, reason: $reason) {
      id
      status
    }
  }
`;

export const RETRY_ALLOY_WORKFLOW = gql`
  mutation RetryAlloyWorkflow($id: ID!) {
    retryAlloyWorkflow(id: $id) {
      id
      status
    }
  }
`;

export const REQUEST_ALLOY_APPROVAL = gql`
  mutation RequestAlloyApproval($workflowId: ID!, $reason: String, $reviewerUserId: ID, $expiresInHours: Int) {
    requestAlloyApproval(workflowId: $workflowId, reason: $reason, reviewerUserId: $reviewerUserId, expiresInHours: $expiresInHours) {
      id
      workflowId
      status
      reason
      createdAt
    }
  }
`;

export const REVIEW_ALLOY_APPROVAL = gql`
  mutation ReviewAlloyApproval($approvalId: ID!, $decision: String!, $reviewNote: String, $reviewerUserId: ID!) {
    reviewAlloyApproval(approvalId: $approvalId, decision: $decision, reviewNote: $reviewNote, reviewerUserId: $reviewerUserId) {
      id
      status
      reviewNote
      reviewedAt
    }
  }
`;

export const RUN_ALLOY_WORKFLOW = gql`
  mutation RunAlloyWorkflow($workflowId: ID!, $overrideApproval: Boolean) {
    runAlloyWorkflow(workflowId: $workflowId, overrideApproval: $overrideApproval) {
      id
      workflowId
      runNumber
      status
      startedAt
    }
  }
`;

export const RECORD_ALLOY_ACTION = gql`
  mutation RecordAlloyAction($workflowId: ID!, $type: String!, $description: String, $outcome: String) {
    recordAlloyAction(workflowId: $workflowId, type: $type, description: $description, outcome: $outcome) {
      id
      workflowId
      type
      status
      description
      outcome
      createdAt
    }
  }
`;

export const WORKFLOW_RUN_UPDATED_SUBSCRIPTION = gql`
  subscription AlloyWorkflowRunUpdated($workflowId: ID) {
    alloyWorkflowRunUpdated(workflowId: $workflowId) {
      id
      workflowId
      runNumber
      status
      trigger
      durationMs
      errorMessage
      startedAt
      completedAt
    }
  }
`;

export const APPROVAL_REQUIRED_SUBSCRIPTION = gql`
  subscription AlloyApprovalRequired($reviewerUserId: ID) {
    alloyApprovalRequired(reviewerUserId: $reviewerUserId) {
      id
      workflowId
      status
      reason
      requestedByUserId
      expiresAt
      createdAt
    }
  }
`;

export const WORKFLOW_STATUS_CHANGED_SUBSCRIPTION = gql`
  subscription AlloyWorkflowStatusChanged {
    alloyWorkflowStatusChanged {
      id
      name
      status
      priority
      domain
      updatedAt
    }
  }
`;
