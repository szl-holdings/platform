@description('Eval runner app name')
param name string = 'szl-eval-runner'

@description('Resource location')
param location string

@description('App Service Plan resource ID — must be a SEPARATE plan from production')
param appServicePlanId string

@description('Name of the eval-only Key Vault (kv-szl-eval, not kv-szl-prod). Must already exist in this resource group.')
param evalKeyVaultName string

@description('Eval database connection string secret URI from eval Key Vault')
param evalDatabaseUrlSecretUri string

@description('Log Analytics workspace resource ID for diagnostic settings')
param logAnalyticsId string = ''

resource evalKeyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: evalKeyVaultName
}

resource evalApp 'Microsoft.Web/sites@2022-03-01' = {
  name: name
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: false
      appSettings: [
        {
          name: 'RUN_MODE'
          value: 'eval'
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'ALLOW_INFERENCE_ROUTES'
          value: 'false'
        }
        {
          name: 'DATABASE_URL_EVAL'
          value: '@Microsoft.KeyVault(SecretUri=${evalDatabaseUrlSecretUri})'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ]
    }
  }
}

@description('Grant the eval runner read access to the eval Key Vault only (scoped to the vault resource, not the resource group)')
resource evalKvSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(evalKeyVault.id, evalApp.id, 'KeyVaultSecretsUser')
  scope: evalKeyVault
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '4633458b-17de-408a-b874-0445c86b69e6'
    )
    principalId: evalApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource diagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsId)) {
  name: 'eval-runner-diag'
  scope: evalApp
  properties: {
    workspaceId: logAnalyticsId
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
        retentionPolicy: { enabled: true, days: 90 }
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
        retentionPolicy: { enabled: true, days: 90 }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: { enabled: true, days: 30 }
      }
    ]
  }
}

output evalAppName string = evalApp.name
output evalAppPrincipalId string = evalApp.identity.principalId
