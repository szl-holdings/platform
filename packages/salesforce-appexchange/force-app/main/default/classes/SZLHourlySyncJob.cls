/**
 * SZLHourlySyncJob
 *
 * Scheduled Apex job — runs every hour to push Salesforce signals to the
 * SZL Holdings platform. Scheduled automatically by SZLPostInstallScript.
 */
global class SZLHourlySyncJob implements Schedulable {
    global void execute(SchedulableContext ctx) {
        SZLPlatformCallout.triggerSync(null);
    }
}
