@description('Storage account name')
param name string

@description('Resource location')
param location string

@description('Private endpoint subnet resource ID (empty disables private endpoint)')
param privateEndpointSubnetId string = ''

@description('Private DNS zone resource ID for Blob Storage')
param privateDnsZoneId string = ''

@description('Log Analytics workspace resource ID for diagnostic settings')
param logAnalyticsId string = ''

var usePrivateEndpoint = !empty(privateEndpointSubnetId)

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: name
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_GRS'
  }
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    networkAcls: usePrivateEndpoint ? {
      defaultAction: 'Deny'
      bypass: 'AzureServices'
      ipRules: []
      virtualNetworkRules: []
    } : {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          allowedOrigins: ['https://szlholdings.com']
          allowedMethods: ['GET', 'HEAD', 'OPTIONS']
          allowedHeaders: ['*']
          exposedHeaders: ['Content-Length', 'Content-Type']
          maxAgeInSeconds: 3600
        }
      ]
    }
    deleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 7
    }
  }
}

resource assetsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'assets'
  properties: {
    publicAccess: 'None'
  }
}

resource exportsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'exports'
  properties: {
    publicAccess: 'None'
  }
}

resource logsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'logs'
  properties: {
    publicAccess: 'None'
  }
}

resource storagePrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = if (usePrivateEndpoint) {
  name: '${name}-blob-pe'
  location: location
  properties: {
    subnet: { id: privateEndpointSubnetId }
    privateLinkServiceConnections: [
      {
        name: '${name}-blob-pe-connection'
        properties: {
          privateLinkServiceId: storageAccount.id
          groupIds: ['blob']
        }
      }
    ]
  }
}

resource storageDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-09-01' = if (usePrivateEndpoint && !empty(privateDnsZoneId)) {
  parent: storagePrivateEndpoint
  name: 'blob-dns-zone-group'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'blob-config'
        properties: {
          privateDnsZoneId: privateDnsZoneId
        }
      }
    ]
  }
}

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsId)) {
  name: 'storage-diagnostics'
  scope: storageAccount
  properties: {
    workspaceId: logAnalyticsId
    metrics: [
      {
        category: 'Transaction'
        enabled: true
        retentionPolicy: { enabled: true; days: 90 }
      }
    ]
  }
}

output storageAccountName string = storageAccount.name
output primaryEndpoint string = storageAccount.properties.primaryEndpoints.blob
output storageAccountId string = storageAccount.id
