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

@description('Deploy the substrate GPU fleet (inference + worker Container Apps). Set to true once Azure GPU quota is confirmed.')
param deploySubstrateFleet bool = false

@description('Image tag for substrate fleet images (defaults to apiImageTag)')
param substrateImageTag string = ''

@description('API key for the substrate inference service (required when deploySubstrateFleet=true)')
@secure()
param substrateApiKey string = ''

@description('Maximum Python worker replicas for autoscaling')
param maxWorkerReplicas int = 10

@description('Minimum Python worker replicas (keep at 1 to avoid cold starts)')
param minWorkerReplicas int = 1

@description('Queue depth threshold that triggers KEDA scale-out')
param scaleOutQueueDepth int = 3

@description('API server egress CIDRs for the substrate NSG allow-list (leave empty to allow all VNet traffic)')
param apiServerEgressCidrs array = []

@description('Worker app external FQDN from a previous deployment — used to wire the Python /metrics two-layer autoscaling rule. Empty on the initial deployment.')
param substrateWorkerExternalFqdn string = ''

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
  'szl-holdings'
  'aegis'
  'vessels'
  'terra'
  'carlota-jo'
  'command'
  'counsel'
  'pulse'
  'sentra'
  'lyte'
]

module staticWebApps 'modules/staticwebapp.bicep' = [for app in frontendApps: {
  name: 'swa-${app}'
  params: {
    name: '${baseName}-${app}'
    location: location
  }
}]

@description('Deploy the offline eval runner on a separate App Service Plan (set to true only when deploying the eval environment)')
param deployEvalRunner bool = false

@description('Resource ID of the SEPARATE App Service Plan for the eval runner (not the production plan)')
param evalAppServicePlanId string = ''

@description('Name of the eval-only Key Vault (kv-szl-eval). Must already exist in this resource group.')
param evalKeyVaultName string = ''

@description('Eval database connection string secret URI from the eval Key Vault')
param evalDatabaseUrlSecretUri string = ''

module evalRunner 'modules/eval-runner.bicep' = if (deployEvalRunner) {
  name: 'eval-runner'
  params: {
    location: location
    appServicePlanId: evalAppServicePlanId
    evalKeyVaultName: evalKeyVaultName
    evalDatabaseUrlSecretUri: evalDatabaseUrlSecretUri
    logAnalyticsId: logAnalytics.id
  }
}

// ── Substrate GPU Fleet ────────────────────────────────────────────────────────
// Gated by deploySubstrateFleet=true. When false, the existing deployment is
// entirely unaffected — no substrate resources are created or modified.
var resolvedSubstrateImageTag = !empty(substrateImageTag) ? substrateImageTag : apiImageTag

module substrateNsg 'modules/substrate-nsg.bicep' = if (deploySubstrateFleet) {
  name: 'substrate-nsg'
  params: {
    location: location
    nsgName: '${baseName}-substrate-nsg'
    apiServerEgressCidrs: apiServerEgressCidrs
    logAnalyticsId: logAnalytics.id
    // vnetName lets the module create a dedicated 'substrate' subnet in the
    // existing VNet and associate the NSG at creation time (enforced immediately).
    vnetName: vnetName
  }
}

module substrateFleet 'modules/substrate-gpu.bicep' = if (deploySubstrateFleet) {
  name: 'substrate-fleet'
  params: {
    baseName: baseName
    location: location
    caeId: containerApp.outputs.caeId
    logAnalyticsId: logAnalytics.id
    acrLoginServer: acrLoginServer
    acrName: acrName
    imageTag: resolvedSubstrateImageTag
    substrateApiKey: substrateApiKey
    keyVaultId: keyVault.outputs.vaultId
    minWorkerReplicas: minWorkerReplicas
    maxWorkerReplicas: maxWorkerReplicas
    scaleOutQueueDepth: scaleOutQueueDepth
    // Pass API server egress CIDRs so both Container Apps ingresses are IP-restricted.
    // Empty by default (dev/test); set in prod parameter file to lock down public endpoints.
    allowedIngressCidrs: apiServerEgressCidrs
    // Pass the worker FQDN from the previous deployment to enable the two-layer
    // Python-advisory autoscaling rule (metrics-api scaler on /metrics endpoint).
    workerExternalFqdn: substrateWorkerExternalFqdn
  }
  dependsOn: [substrateNsg]
}

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
output substrateInferenceFqdn string = deploySubstrateFleet ? substrateFleet.outputs.inferenceAppFqdn : ''
output substrateWorkerFqdn string = deploySubstrateFleet ? substrateFleet.outputs.workerAppFqdn : ''
