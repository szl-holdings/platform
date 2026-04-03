/**
 * SZLPlatformCallout
 *
 * Handles outbound HTTP callouts from Salesforce to the SZL Holdings
 * platform API. Uses Custom Metadata for configuration so no hard-coded
 * credentials are stored in code.
 *
 * Authentication: All callouts use the Webhook_Secret__c field as a
 * shared HMAC secret, sent as the x-szl-webhook-secret header. This
 * is set by the SZL platform during OAuth setup and must match the
 * value registered on the platform side.
 *
 * All callout methods are @future(callout=true) or invocable so they can
 * be triggered from Flows, Triggers, or scheduled jobs.
 */
public with sharing class SZLPlatformCallout {

    private static final String CONFIG_RECORD = 'Default';

    private static SZL_Config__mdt getConfig() {
        return SZL_Config__mdt.getInstance(CONFIG_RECORD);
    }

    /**
     * Sends a signal payload to the SZL platform signal ingest endpoint.
     * Called from triggers and flows when notable Salesforce events occur.
     */
    @future(callout=true)
    public static void sendSignal(
        String signalType,
        String title,
        String description,
        String severity,
        String recordId
    ) {
        SZL_Config__mdt cfg = getConfig();
        if (cfg == null || !cfg.Sync_Enabled__c) return;
        if (String.isBlank(cfg.Webhook_Secret__c)) {
            System.debug('SZLPlatformCallout.sendSignal: Webhook_Secret__c not configured — skipping callout');
            return;
        }

        Map<String, Object> payload = new Map<String, Object>{
            'type'        => signalType,
            'title'       => title,
            'description' => description,
            'severity'    => severity,
            'metadata'    => new Map<String, Object>{ 'recordId' => recordId, 'source' => 'salesforce' },
            'occurredAt'  => DateTime.now().format('yyyy-MM-dd\'T\'HH:mm:ss\'Z\'')
        };

        HttpRequest req = new HttpRequest();
        req.setEndpoint(cfg.API_Endpoint__c + '/api/integrations/salesforce/webhook');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('x-szl-webhook-secret', cfg.Webhook_Secret__c);
        req.setBody(JSON.serialize(payload));
        req.setTimeout(10000);

        try {
            HttpResponse resp = new Http().send(req);
            if (resp.getStatusCode() >= 400) {
                System.debug('SZLPlatformCallout.sendSignal: non-2xx response ' + resp.getStatusCode());
            }
        } catch (CalloutException e) {
            System.debug('SZLPlatformCallout.sendSignal: callout error — ' + e.getMessage());
        }
    }

    /**
     * Invocable method: trigger a full sync from a Flow or Process Builder.
     * Uses Webhook_Secret__c for authentication — the platform accepts this
     * on the /api/integrations/salesforce/sync endpoint without requiring a
     * user session token.
     */
    @InvocableMethod(label='Trigger SZL Platform Sync' description='Initiates a full data sync from Salesforce to the SZL platform.')
    public static void triggerSync(List<String> unused) {
        SZL_Config__mdt cfg = getConfig();
        if (cfg == null || !cfg.Sync_Enabled__c) return;
        if (String.isBlank(cfg.Webhook_Secret__c)) {
            System.debug('SZLPlatformCallout.triggerSync: Webhook_Secret__c not configured — skipping callout');
            return;
        }

        HttpRequest req = new HttpRequest();
        req.setEndpoint(cfg.API_Endpoint__c + '/api/integrations/salesforce/sync');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('x-szl-webhook-secret', cfg.Webhook_Secret__c);
        req.setBody('{}');
        req.setTimeout(15000);

        try {
            new Http().send(req);
        } catch (CalloutException e) {
            System.debug('SZLPlatformCallout.triggerSync: callout error — ' + e.getMessage());
        }
    }
}
