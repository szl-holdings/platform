@description('Base name prefix')
param baseName string

@description('Azure region')
param location string

@description('Service Bus SKU')
@allowed(['Basic', 'Standard', 'Premium'])
param sku string = 'Standard'

resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2022-10-01-preview' = {
  name: '${baseName}-sb'
  location: location
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
    zoneRedundant: sku == 'Premium'
  }
}

resource connectorEventsQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'connector-events'
  properties: {
    lockDuration: 'PT5M'
    maxSizeInMegabytes: 1024
    requiresDuplicateDetection: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    maxDeliveryCount: 5
    deadLetteringOnMessageExpiration: true
    enableBatchedOperations: true
    defaultMessageTimeToLive: 'P14D'
  }
}

resource documentIngestQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'document-ingest'
  properties: {
    lockDuration: 'PT5M'
    maxSizeInMegabytes: 5120
    maxDeliveryCount: 3
    deadLetteringOnMessageExpiration: true
    enableBatchedOperations: true
    defaultMessageTimeToLive: 'P7D'
  }
}

resource documentExtractQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'document-extract'
  properties: {
    lockDuration: 'PT10M'
    maxSizeInMegabytes: 1024
    maxDeliveryCount: 3
    deadLetteringOnMessageExpiration: true
    enableBatchedOperations: true
    defaultMessageTimeToLive: 'P7D'
  }
}

resource forecastRecomputeQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'forecast-recompute'
  properties: {
    lockDuration: 'PT5M'
    maxSizeInMegabytes: 1024
    maxDeliveryCount: 5
    deadLetteringOnMessageExpiration: true
    enableBatchedOperations: true
    defaultMessageTimeToLive: 'P3D'
  }
}

resource deadlineEvaluateQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'deadline-evaluate'
  properties: {
    lockDuration: 'PT2M'
    maxSizeInMegabytes: 1024
    maxDeliveryCount: 5
    deadLetteringOnMessageExpiration: true
    enableBatchedOperations: true
    defaultMessageTimeToLive: 'P1D'
  }
}

resource notificationsSendQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'notifications-send'
  properties: {
    lockDuration: 'PT2M'
    maxSizeInMegabytes: 1024
    maxDeliveryCount: 3
    deadLetteringOnMessageExpiration: true
    enableBatchedOperations: true
    defaultMessageTimeToLive: 'P3D'
  }
}

resource exportGenerateQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'export-generate'
  properties: {
    lockDuration: 'PT10M'
    maxSizeInMegabytes: 5120
    maxDeliveryCount: 3
    deadLetteringOnMessageExpiration: true
    enableBatchedOperations: true
    defaultMessageTimeToLive: 'P7D'
  }
}

resource webhookEventsTopic 'Microsoft.ServiceBus/namespaces/topics@2022-10-01-preview' = if (sku != 'Basic') {
  parent: serviceBusNamespace
  name: 'webhook-events'
  properties: {
    maxSizeInMegabytes: 1024
    requiresDuplicateDetection: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    enableBatchedOperations: true
    defaultMessageTimeToLive: 'P14D'
  }
}

resource webhookProcessorSubscription 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2022-10-01-preview' = if (sku != 'Basic') {
  parent: webhookEventsTopic
  name: 'webhook-processor'
  properties: {
    lockDuration: 'PT5M'
    maxDeliveryCount: 5
    deadLetteringOnMessageExpiration: true
    enableBatchedOperations: true
    defaultMessageTimeToLive: 'P14D'
  }
}

resource manualReviewQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'manual-review'
  properties: {
    lockDuration: 'PT5M'
    maxSizeInMegabytes: 1024
    maxDeliveryCount: 10
    deadLetteringOnMessageExpiration: true
    enableBatchedOperations: true
    defaultMessageTimeToLive: 'P30D'
  }
}

resource replayJobsQueue 'Microsoft.ServiceBus/namespaces/queues@2022-10-01-preview' = {
  parent: serviceBusNamespace
  name: 'replay-jobs'
  properties: {
    lockDuration: 'PT5M'
    maxSizeInMegabytes: 1024
    maxDeliveryCount: 3
    deadLetteringOnMessageExpiration: true
    enableBatchedOperations: true
    defaultMessageTimeToLive: 'P7D'
  }
}

output namespaceName string = serviceBusNamespace.name
output namespaceId string = serviceBusNamespace.id
output connectionString string = listKeys('${serviceBusNamespace.id}/AuthorizationRules/RootManageSharedAccessKey', '2022-10-01-preview').primaryConnectionString
