/**
 * SZLWorkflowQueueable
 * Triggers an Alloy workflow via the SZL Holdings API asynchronously.
 * Calls SZLApiClient.triggerWorkflow(workflowId, recordId, recordType, orgId).
 *
 * Usage:
 *   System.enqueueJob(new SZLWorkflowQueueable(42, opp.Id, 'Opportunity', orgId));
 */
public class SZLWorkflowQueueable implements Queueable, Database.AllowsCallouts {
    private final Integer workflowId;
    private final String recordId;
    private final String recordType;
    private final String orgId;

    public SZLWorkflowQueueable(Integer workflowId, String recordId, String recordType, String orgId) {
        this.workflowId = workflowId;
        this.recordId = recordId;
        this.recordType = recordType;
        this.orgId = orgId != null ? orgId : '';
    }

    public void execute(QueueableContext ctx) {
        try {
            SZLApiClient.triggerWorkflow(this.workflowId, this.recordId, this.recordType, this.orgId);
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'SZLWorkflowQueueable.execute failed: ' + e.getMessage());
        }
    }
}
