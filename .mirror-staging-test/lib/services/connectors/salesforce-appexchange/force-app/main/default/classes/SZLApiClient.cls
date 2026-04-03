/**
 * SZLApiClient - Apex HTTP callout client for the SZL Holdings REST API.
 * Handles authentication, request construction, and response parsing.
 */
public with sharing class SZLApiClient {

    private static final String NAMED_CREDENTIAL = 'SZL_Holdings_API';
    private static final Integer DEFAULT_TIMEOUT = 30000;

    public class SZLApiException extends Exception {}

    public class WorkflowRun {
        @AuraEnabled public Integer id;
        @AuraEnabled public String state;
        @AuraEnabled public String workflowName;
        @AuraEnabled public Long queuedAt;
    }

    public class AlloySignal {
        @AuraEnabled public String type;
        @AuraEnabled public String domain;
        @AuraEnabled public Map<String, Object> metadata;
    }

    public class PrismScore {
        @AuraEnabled public String lens;
        @AuraEnabled public Integer score;
        @AuraEnabled public String trend;
    }

    /**
     * List available Alloy workflows for the given org.
     */
    @AuraEnabled(cacheable=true)
    public static List<Object> listWorkflows(String orgId) {
        HttpResponse res = makeRequest('GET', '/api/alloy/workflows?limit=50&orgId=' + EncodingUtil.urlEncode(orgId, 'UTF-8'), null);
        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        return (List<Object>) body.get('data');
    }

    /**
     * Trigger an Alloy workflow run, passing Salesforce record context as input.
     */
    @AuraEnabled
    public static WorkflowRun triggerWorkflow(Integer workflowId, String recordId, String recordType, String orgId) {
        Map<String, Object> payload = new Map<String, Object>{
            'input' => new Map<String, Object>{
                'source' => 'salesforce',
                'recordId' => recordId,
                'recordType' => recordType,
                'orgId' => orgId
            }
        };
        HttpResponse res = makeRequest('POST', '/api/alloy/workflows/' + workflowId + '/run', JSON.serialize(payload));
        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        WorkflowRun run = new WorkflowRun();
        Map<String, Object> data = (Map<String, Object>) body.get('data');
        run.id = (Integer) data.get('id');
        run.state = (String) data.get('state');
        return run;
    }

    /**
     * Post an Alloy signal from a Salesforce event (e.g. Opportunity stage change).
     */
    @AuraEnabled
    public static void postSignal(String signalType, String domain, Map<String, Object> metadata) {
        Map<String, Object> payload = new Map<String, Object>{
            'type' => signalType,
            'domain' => domain,
            'metadata' => metadata,
            'timestamp' => System.currentTimeMillis()
        };
        makeRequest('POST', '/api/alloy/signals', JSON.serialize(payload));
    }

    /**
     * Fetch PRISM risk scores for the given org.
     */
    @AuraEnabled(cacheable=true)
    public static List<Object> getPrismScores() {
        HttpResponse res = makeRequest('GET', '/api/lyte/prism/summary', null);
        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        Map<String, Object> data = (Map<String, Object>) body.get('data');
        return (List<Object>) data.get('lenses');
    }

    private static HttpResponse makeRequest(String method, String path, String body) {
        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:' + NAMED_CREDENTIAL + path);
        req.setMethod(method);
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('Accept', 'application/json');
        req.setTimeout(DEFAULT_TIMEOUT);
        if (body != null) {
            req.setBody(body);
        }
        Http http = new Http();
        HttpResponse res = http.send(req);
        if (res.getStatusCode() < 200 || res.getStatusCode() >= 300) {
            throw new SZLApiException('SZL API error ' + res.getStatusCode() + ': ' + res.getBody());
        }
        return res;
    }
}
