/**
 * SZLPostInstallScript
 *
 * Executes automatically after the SZL Platform Connector managed package
 * is installed or upgraded in a subscriber org. Creates the default
 * Custom Metadata record and schedules the hourly sync job.
 *
 * Referenced in packageInstallHandler in sfdx-project.json.
 */
global class SZLPostInstallScript implements InstallHandler {

    global void onInstall(InstallContext ctx) {
        Boolean isUpgrade = ctx.previousVersion() != null;
        System.debug('SZL Platform Connector: ' + (isUpgrade ? 'upgrade' : 'install') + ' detected for org ' + ctx.organizationId());

        try {
            scheduleHourlySync();
        } catch (Exception e) {
            System.debug('SZL onInstall: could not schedule hourly sync — ' + e.getMessage());
        }
    }

    private static void scheduleHourlySync() {
        String jobName = 'SZL Platform Hourly Sync';
        for (CronTrigger ct : [SELECT Id FROM CronTrigger WHERE CronJobDetail.Name = :jobName LIMIT 1]) {
            System.abortJob(ct.Id);
        }
        String cron = '0 0 * * * ?';
        System.schedule(jobName, cron, new SZLHourlySyncJob());
    }
}
