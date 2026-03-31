/**
 * OpportunitySZLSync — fires Alloy signals when Opportunity stage changes.
 * Also triggers Alloy workflow automation for key stage transitions.
 */
trigger OpportunitySZLSync on Opportunity (after update) {

    Set<Id> changedIds = new Set<Id>();
    Map<Id, String> oldStages = new Map<Id, String>();
    Map<Id, String> newStages = new Map<Id, String>();

    for (Opportunity opp : Trigger.new) {
        Opportunity oldOpp = Trigger.oldMap.get(opp.Id);
        if (opp.StageName != oldOpp.StageName) {
            changedIds.add(opp.Id);
            oldStages.put(opp.Id, oldOpp.StageName);
            newStages.put(opp.Id, opp.StageName);
        }
    }

    if (changedIds.isEmpty()) return;

    List<Opportunity> opps = [
        SELECT Id, Name, StageName, Amount, AccountId, Account.Name, OwnerId, Owner.Name
        FROM Opportunity
        WHERE Id IN :changedIds
    ];

    for (Opportunity opp : opps) {
        Map<String, Object> metadata = new Map<String, Object>{
            'opportunityId' => opp.Id,
            'opportunityName' => opp.Name,
            'accountId' => opp.AccountId,
            'accountName' => opp.Account?.Name,
            'amount' => opp.Amount,
            'ownerId' => opp.OwnerId,
            'ownerName' => opp.Owner?.Name,
            'fromStage' => oldStages.get(opp.Id),
            'toStage' => newStages.get(opp.Id),
            'source' => 'salesforce_opportunity_trigger'
        };

        System.enqueueJob(new SZLSignalQueueable('opportunity_stage_changed', 'crm', metadata));

        String toStage = newStages.get(opp.Id);
        if (toStage == 'Closed Won' || toStage == 'Closed Lost') {
            String szlOrgId = [SELECT SZL_Org_Id__c FROM Organization LIMIT 1]?.SZL_Org_Id__c ?? '';
            System.enqueueJob(new SZLWorkflowQueueable(1, opp.Id, 'Opportunity', szlOrgId));
        }
    }
}
