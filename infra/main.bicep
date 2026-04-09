targetScope = 'resourceGroup'

@description('Base name prefix for all resources')
param baseName string = 'szlholdings'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('PostgreSQL administrator login')
@secure()
param pgAdminLogin string

@description('PostgreSQL administrator password')
@secure()
param pgAdminPassword string

@description('Custom domain for Front Door (e.g. szlholdings.com)')
param customDomain string = 'szlholdings.com'

@description('Container image tag for the API server')
param apiImageTag string = 'latest'

@description('Azure Container Registry login server')
param acrLoginServer string = '${baseName}acr.azurecr.io'

@description('Azure Container Registry name (for role assignment)')
param acrName string = '${baseName}acr'

@description('SKU for Redis Cache')
@allowed(['Basic', 'Standard', 'Premium'])
param redisSku string = 'Standard'

@description('SKU for PostgreSQL')
@allowed(['Burstable', 'GeneralPurpose', 'MemoryOptimized'])
param pgSkuTier string = 'GeneralPurpose'

@description('PostgreSQL compute size')
param pgSkuName string = 'Standard_D2s_v3'

@description('PostgreSQL storage size in GB')
param pgStorageSizeGB int = 128

@description('Enable VNet integration for private networking')
param enableVnet bool = true

@description('Email address for operations alerts')
param alertEmailAddress string = 'ops@szlholdings.com'

@description('Optional webhook URL for alerting')
param alertWebhookUrl string = ''

var uniqueSuffix = uniqueString(resourceGroup().id, baseName)
var vaultName = '${baseName}-kv-${take(uniqueSuffix, 6)}'
var pgServerName = '${baseName}-pg-${take(uniqueSuffix, 6)}'
var redisName = '${baseName}-redis-${take(uniqueSuffix, 6)}'
var storageName = '${baseName}stor${take(uniqueSuffix, 8)}'
var logAnalyticsName = '${baseName}-logs-${take(uniqueSuffix, 6)}'
var appInsightsName = '${baseName}-ai-${take(uniqueSuffix, 6)}'
var caeEnvName = '${baseName}-cae-${take(uniqueSuffix, 6)}'
var containerAppName = '${baseName}-api'
var frontDoorName = '${baseName}-fd'
var wafPolicyName = '${baseName}waf'
var vnetName = '${baseName}-vnet'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 90
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    RetentionInDays: 90
    SamplingPercentage: 100
  }
}

module vnet 'modules/vnet.bicep' = if (enableVnet) {
  name: 'vnetDeploy'
  params: {
    name: vnetName
    location: location
  }
}

module keyVault 'modules/keyvault.bicep' = {
  name: 'keyVaultDeploy'
  params: {
    name: vaultName
    location: location
    containerAppPrincipalId: containerApp.outputs.principalId
    privateEndpointSubnetId: enableVnet ? vnet.outputs.privateEndpointsSubnetId : ''
    privateDnsZoneId: enableVnet ? vnet.outputs.kvPrivateDnsZoneId : ''
    logAnalyticsId: logAnalytics.id
  }
}

module postgres 'modules/postgres.bicep' = {
  name: 'postgresDeploy'
  params: {
    name: pgServerName
    location: location
    adminLogin: pgAdminLogin
    adminPassword: pgAdminPassword
    skuTier: pgSkuTier
    skuName: pgSkuName
    storageSizeGB: pgStorageSizeGB
    delegatedSubnetResourceId: enableVnet ? vnet.outputs.postgresSubnetId : ''
    privateDnsZoneArmResourceId: enableVnet ? vnet.outputs.pgPrivateDnsZoneId : ''
    logAnalyticsId: logAnalytics.id
  }
}

module redis 'modules/redis.bicep' = {
  name: 'redisDeploy'
  params: {
    name: redisName
    location: location
    sku: redisSku
    logAnalyticsId: logAnalytics.id
    privateEndpointSubnetId: enableVnet ? vnet.outputs.privateEndpointsSubnetId : ''
    privateDnsZoneId: enableVnet ? vnet.outputs.redisPrivateDnsZoneId : ''
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storageDeploy'
  params: {
    name: storageName
    location: location
    privateEndpointSubnetId: enableVnet ? vnet.outputs.privateEndpointsSubnetId : ''
    privateDnsZoneId: enableVnet ? vnet.outputs.storagePrivateDnsZoneId : ''
    logAnalyticsId: logAnalytics.id
  }
}

module containerApp 'modules/containerapp.bicep' = {
  name: 'containerAppDeploy'
  params: {
    envName: caeEnvName
    appName: containerAppName
    location: location
    logAnalyticsId: logAnalytics.id
    acrLoginServer: acrLoginServer
    imageTag: apiImageTag
    appInsightsConnectionString: appInsights.properties.ConnectionString
    keyVaultUrl: 'https://${vaultName}.${environment().suffixes.keyvaultDns}'
    redisHost: '${redisName}.redis.cache.windows.net'
    redisPrimaryKey: redis.outputs.primaryKey
    storageAccountName: storageName
    pgHost: postgres.outputs.fqdn
    pgAdminLogin: pgAdminLogin
    pgAdminPassword: pgAdminPassword
    infrastructureSubnetId: enableVnet ? vnet.outputs.containerAppsSubnetId : ''
  }
}

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
}

var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, containerApp.outputs.principalId, acrPullRoleId)
  scope: acr
  properties: {
    principalId: containerApp.outputs.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalType: 'ServicePrincipal'
  }
}

module serviceBus 'modules/servicebus.bicep' = {
  name: 'serviceBusDeploy'
  params: {
    baseName: baseName
    location: location
    sku: 'Standard'
  }
}

module docIntelligence 'modules/docintell.bicep' = {
  name: 'docIntelligenceDeploy'
  params: {
    baseName: baseName
    location: location
    sku: 'S0'
  }
}

module prismBlobStorage 'modules/blobstorage.bicep' = {
  name: 'prismBlobStorageDeploy'
  params: {
    baseName: baseName
    location: location
    sku: 'Standard_ZRS'
  }
}

module alerting 'modules/alerting.bicep' = {
  name: 'alertingDeploy'
  params: {
    location: location
    logAnalyticsId: logAnalytics.id
    containerAppId: containerApp.outputs.containerAppId
    alertEmailAddress: alertEmailAddress
    webhookUrl: alertWebhookUrl
  }
}

module frontDoor 'modules/frontdoor.bicep' = {
  name: 'frontDoorDeploy'
  params: {
    profileName: frontDoorName
    wafPolicyName: wafPolicyName
    apiBackendAddress: containerApp.outputs.fqdn
    customDomain: customDomain
    frontendAppNames: frontendApps
    swaHostnames: [for (app, i) in frontendApps: staticWebApps[i].outputs.defaultHostname]
    logAnalyticsId: logAnalytics.id
  }
  dependsOn: [staticWebApps]
}

var frontendApps = [
  'aegis-ops'
  'aegis'
  'terra'
  'firestorm'
  'vessels'
  'lyte'
  'carlota-jo'
  'szl-holdings'
  'alloy'
  'prism-counsel'
  'stephen'
]

module staticWebApps 'modules/staticwebapp.bicep' = [for app in frontendApps: {
  name: 'swa-${app}'
  params: {
    name: '${baseName}-${app}'
    location: location
  }
}]

output apiUrl string = 'https://${containerApp.outputs.fqdn}'
output keyVaultUrl string = keyVault.outputs.vaultUri
output storageAccountName string = storageName
output frontDoorEndpoint string = frontDoor.outputs.endpointHostName
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output pgServerFqdn string = postgres.outputs.fqdn
output redisFqdn string = '${redisName}.redis.cache.windows.net'
output logAnalyticsWorkspaceId string = logAnalytics.id
output serviceBusConnectionString string = serviceBus.outputs.connectionString
output docIntelligenceEndpoint string = docIntelligence.outputs.endpoint
output prismBlobEndpoint string = prismBlobStorage.outputs.primaryBlobEndpoint
