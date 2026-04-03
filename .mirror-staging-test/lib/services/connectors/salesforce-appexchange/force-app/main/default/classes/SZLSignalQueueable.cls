/**
 * SZLSignalQueueable
 * Sends a signal payload to the SZL Holdings API asynchronously via a Queueable job.
 * Calls SZLApiClient.postSignal(signalType, domain, metadata).
 *
 * Usage:
 *   Map<String,Object> meta = new Map<String,Object>{'opportunityId' => opp.Id};
 *   System.enqueueJob(new SZLSignalQueueable('deal_stage_change', 'salesforce', meta));
 */
public class SZLSignalQueueable implements Queueable, Database.AllowsCallouts {
    private final String signalType;
    private final String domain;
    private final Map<String, Object> metadata;

    public SZLSignalQueueable(String signalType, String domain, Map<String, Object> metadata) {
        this.signalType = signalType;
        this.domain = domain;
        this.metadata = metadata != null ? metadata : new Map<String, Object>();
    }

    public void execute(QueueableContext ctx) {
        try {
            SZLApiClient.postSignal(this.signalType, this.domain, this.metadata);
        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'SZLSignalQueueable.execute failed: ' + e.getMessage());
        }
    }
}
