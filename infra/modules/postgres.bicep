@description('PostgreSQL server name')
param name string

@description('Resource location')
param location string

@description('Administrator login')
@secure()
param adminLogin string

@description('Administrator password')
@secure()
param adminPassword string

@description('SKU tier')
@allowed(['Burstable', 'GeneralPurpose', 'MemoryOptimized'])
param skuTier string = 'GeneralPurpose'

@description('SKU name')
param skuName string = 'Standard_D2s_v3'

@description('Storage size in GB')
param storageSizeGB int = 128

@description('Subnet resource ID for VNet integration (empty string disables private networking)')
param delegatedSubnetResourceId string = ''

@description('Private DNS zone resource ID for VNet integration')
param privateDnsZoneArmResourceId string = ''

@description('Log Analytics workspace resource ID for diagnostic settings')
param logAnalyticsId string = ''

var haMode = skuTier == 'GeneralPurpose' || skuTier == 'MemoryOptimized' ? 'ZoneRedundant' : 'Disabled'
var useVnet = !empty(delegatedSubnetResourceId)

resource pgServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: name
  location: location
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {
    version: '16'
    administratorLogin: adminLogin
    administratorLoginPassword: adminPassword
    storage: {
      storageSizeGB: storageSizeGB
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Enabled'
    }
    highAvailability: {
      mode: haMode
    }
    network: useVnet ? {
      delegatedSubnetResourceId: delegatedSubnetResourceId
      privateDnsZoneArmResourceId: privateDnsZoneArmResourceId
    } : {}
    maintenanceWindow: {
      customWindow: 'Enabled'
      dayOfWeek: 0
      startHour: 2
      startMinute: 0
    }
  }
}

resource defaultDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: pgServer
  name: 'szlholdings'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsId)) {
  name: 'pg-diagnostics'
  scope: pgServer
  properties: {
    workspaceId: logAnalyticsId
    logs: [
      {
        category: 'PostgreSQLLogs'
        enabled: true
        retentionPolicy: { enabled: true; days: 90 }
      }
      {
        category: 'PostgreSQLFlexSessions'
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

output fqdn string = pgServer.properties.fullyQualifiedDomainName
output serverName string = pgServer.name
output serverId string = pgServer.id
