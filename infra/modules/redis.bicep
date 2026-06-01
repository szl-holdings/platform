@description('Redis cache name')
param name string

@description('Resource location')
param location string

@description('Redis SKU')
@allowed(['Basic', 'Standard', 'Premium'])
param sku string = 'Standard'

@description('Log Analytics workspace resource ID for diagnostic settings')
param logAnalyticsId string = ''

@description('Private endpoint subnet resource ID (empty disables private endpoint)')
param privateEndpointSubnetId string = ''

@description('Private DNS zone resource ID for Redis (privatelink.redis.cache.windows.net)')
param privateDnsZoneId string = ''

var skuFamily = sku == 'Premium' ? 'P' : 'C'
var skuCapacity = sku == 'Basic' ? 0 : 1
var usePrivateEndpoint = !empty(privateEndpointSubnetId)

resource redis 'Microsoft.Cache/redis@2023-08-01' = {
  name: name
  location: location
  properties: {
    sku: {
      name: sku
      family: skuFamily
      capacity: skuCapacity
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    publicNetworkAccess: usePrivateEndpoint ? 'Disabled' : 'Enabled'
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
      'maxmemory-reserved': '125'
      'maxfragmentationmemory-reserved': '125'
    }
    replicasPerMaster: sku == 'Standard' || sku == 'Premium' ? 1 : 0
    replicasPerPrimary: sku == 'Standard' || sku == 'Premium' ? 1 : 0
    redisVersion: '6'
  }
}

resource redisPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-09-01' = if (usePrivateEndpoint) {
  name: '${name}-pe'
  location: location
  properties: {
    subnet: { id: privateEndpointSubnetId }
    privateLinkServiceConnections: [
      {
        name: '${name}-pe-connection'
        properties: {
          privateLinkServiceId: redis.id
          groupIds: ['redisCache']
        }
      }
    ]
  }
}

resource redisDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-09-01' = if (usePrivateEndpoint && !empty(privateDnsZoneId)) {
  parent: redisPrivateEndpoint
  name: 'redis-dns-zone-group'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'redis-config'
        properties: {
          privateDnsZoneId: privateDnsZoneId
        }
      }
    ]
  }
}

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsId)) {
  name: 'redis-diagnostics'
  scope: redis
  properties: {
    workspaceId: logAnalyticsId
    logs: [
      {
        category: 'ConnectedClientList'
        enabled: true
        retentionPolicy: { enabled: true; days: 90 }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: { enabled: true; days: 90 }
      }
    ]
  }
}

output hostName string = redis.properties.hostName
output sslPort int = redis.properties.sslPort
output primaryKey string = redis.listKeys().primaryKey
output redisId string = redis.id
