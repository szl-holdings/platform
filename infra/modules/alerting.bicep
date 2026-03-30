@description('Resource location')
param location string

@description('Log Analytics workspace resource ID')
param logAnalyticsId string

@description('Container App resource ID (for metric-based alerts)')
param containerAppId string

@description('Action group email address for notifications')
param alertEmailAddress string = 'ops@szlholdings.com'

@description('Optional webhook URL for alert notifications')
param webhookUrl string = ''

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'szlholdings-ops-alerts'
  location: 'global'
  properties: {
    groupShortName: 'SZLOps'
    enabled: true
    emailReceivers: [
      {
        name: 'OpsTeam'
        emailAddress: alertEmailAddress
        useCommonAlertSchema: true
      }
    ]
    webhookReceivers: !empty(webhookUrl) ? [
      {
        name: 'OpsWebhook'
        serviceUri: webhookUrl
        useCommonAlertSchema: true
      }
    ] : []
  }
}

resource cpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'szlholdings-high-cpu'
  location: 'global'
  properties: {
    description: 'Fires when Container App CPU usage exceeds 80% for 10 minutes'
    severity: 2
    enabled: true
    scopes: [containerAppId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT10M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighCpu'
          criterionType: 'StaticThresholdCriterion'
          metricName: 'UsageNanoCores'
          metricNamespace: 'Microsoft.App/containerapps'
          operator: 'GreaterThan'
          threshold: 800000000
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      { actionGroupId: actionGroup.id }
    ]
  }
}

resource memoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'szlholdings-high-memory'
  location: 'global'
  properties: {
    description: 'Fires when Container App memory usage exceeds 800 MiB'
    severity: 2
    enabled: true
    scopes: [containerAppId]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT10M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HighMemory'
          criterionType: 'StaticThresholdCriterion'
          metricName: 'WorkingSetBytes'
          metricNamespace: 'Microsoft.App/containerapps'
          operator: 'GreaterThan'
          threshold: 838860800
          timeAggregation: 'Average'
        }
      ]
    }
    actions: [
      { actionGroupId: actionGroup.id }
    ]
  }
}

resource http5xxAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'szlholdings-5xx-spike'
  location: location
  properties: {
    displayName: 'API 5xx Error Spike'
    description: 'Fires when 5xx error count exceeds 10 in 5 minutes'
    severity: 1
    enabled: true
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    scopes: [logAnalyticsId]
    criteria: {
      allOf: [
        {
          query: '''
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(5m)
| where Log_s has_any ("statusCode\":5", "status\":5", " 500 ", " 502 ", " 503 ", " 504 ")
| summarize errorCount = count()
| where errorCount > 10
'''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [actionGroup.id]
    }
  }
}

resource latencyAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'szlholdings-high-latency'
  location: location
  properties: {
    displayName: 'API P95 Latency > 2s'
    description: 'Fires when P95 request latency exceeds 2000ms over 15 minutes'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    scopes: [logAnalyticsId]
    criteria: {
      allOf: [
        {
          query: '''
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(15m)
| where Log_s has "responseTime"
| extend responseTimeMs = toint(extract('"responseTime":(\\d+)', 1, Log_s))
| where isnotnull(responseTimeMs) and responseTimeMs > 0
| summarize p95 = percentile(responseTimeMs, 95)
| where p95 > 2000
'''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 2
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [actionGroup.id]
    }
  }
}

resource dbConnectionAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'szlholdings-db-connection-saturation'
  location: location
  properties: {
    displayName: 'PostgreSQL Connection Pool Saturation'
    description: 'Fires when pool waiting count exceeds 5 for two consecutive windows'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT5M'
    windowSize: 'PT10M'
    scopes: [logAnalyticsId]
    criteria: {
      allOf: [
        {
          query: '''
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(10m)
| where Log_s has "pool" and Log_s has "waiting"
| extend waitingCount = toint(extract('"waiting":(\\d+)', 1, Log_s))
| where isnotnull(waitingCount) and waitingCount > 5
| summarize overloadWindows = count()
| where overloadWindows > 0
'''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 2
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [actionGroup.id]
    }
  }
}

output actionGroupId string = actionGroup.id
