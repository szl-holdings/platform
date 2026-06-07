@description('Container Apps Environment name')
param envName string

@description('Container App name')
param appName string

@description('Resource location')
param location string

@description('Log Analytics workspace resource ID')
param logAnalyticsId string

@description('ACR login server')
param acrLoginServer string

@description('Container image name')
param imageName string = 'szlholdings-api'

@description('Container image tag')
param imageTag string = 'latest'

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('Key Vault URL')
param keyVaultUrl string

@description('Redis host')
param redisHost string

@description('Redis primary key')
@secure()
param redisPrimaryKey string

@description('Storage account name')
param storageAccountName string

@description('PostgreSQL host')
param pgHost string

@description('PostgreSQL admin login')
@secure()
param pgAdminLogin string

@description('PostgreSQL admin password')
@secure()
param pgAdminPassword string

@description('VNet subnet resource ID for Container Apps Environment (empty disables VNet integration)')
param infrastructureSubnetId string = ''

resource cae 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: envName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: reference(logAnalyticsId, '2023-09-01').customerId
        sharedKey: listKeys(logAnalyticsId, '2023-09-01').primarySharedKey
      }
    }
    vnetConfiguration: !empty(infrastructureSubnetId) ? {
      infrastructureSubnetId: infrastructureSubnetId
      internal: false
    } : null
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
  }
}

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: cae.id
    configuration: {
      activeRevisionsMode: 'Single'
      secrets: [
        {
          name: 'redis-url'
          value: 'rediss://:${redisPrimaryKey}@${redisHost}:6380'
        }
        {
          name: 'database-url'
          value: 'postgresql://${pgAdminLogin}:${pgAdminPassword}@${pgHost}:5432/szlholdings?sslmode=require'
        }
      ]
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
        allowInsecure: false
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: [
        {
          server: acrLoginServer
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'api-server'
          image: '${acrLoginServer}/${imageName}:${imageTag}'
          resources: {
            cpu: json('2.0')
            memory: '4Gi'
          }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'PORT', value: '3000' }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsightsConnectionString }
            { name: 'AZURE_KEY_VAULT_URL', value: keyVaultUrl }
            { name: 'AZURE_REDIS_URL', secretRef: 'redis-url' }
            { name: 'AZURE_STORAGE_ACCOUNT_NAME', value: storageAccountName }
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'NODE_OPTIONS', value: '--max-old-space-size=3584' }
            { name: 'DRAIN_TIMEOUT_MS', value: '30000' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 3000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 15
              periodSeconds: 30
              failureThreshold: 3
              timeoutSeconds: 5
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/readyz'
                port: 3000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 10
              periodSeconds: 20
              failureThreshold: 3
              timeoutSeconds: 10
            }
            {
              type: 'Startup'
              httpGet: {
                path: '/health'
                port: 3000
                scheme: 'HTTP'
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              failureThreshold: 15
              timeoutSeconds: 5
            }
          ]
          securityContext: {
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            allowPrivilegeEscalation: false
          }
          volumeMounts: [
            {
              mountPath: '/tmp'
              volumeName: 'tmp-volume'
            }
          ]
        }
      ]
      volumes: [
        {
          name: 'tmp-volume'
          storageType: 'EmptyDir'
        }
      ]
      scale: {
        minReplicas: 2
        maxReplicas: 10
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '25'
              }
            }
          }
          {
            name: 'cpu-scaling'
            custom: {
              type: 'cpu'
              metadata: {
                type: 'Utilization'
                value: '70'
              }
            }
          }
          {
            name: 'memory-scaling'
            custom: {
              type: 'memory'
              metadata: {
                type: 'Utilization'
                value: '80'
              }
            }
          }
        ]
      }
    }
  }
}

resource caeLogsDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'cae-diagnostics'
  scope: cae
  properties: {
    workspaceId: logAnalyticsId
    logs: [
      {
        category: 'ContainerAppConsoleLogs'
        enabled: true
        retentionPolicy: { enabled: true; days: 90 }
      }
      {
        category: 'ContainerAppSystemLogs'
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

output fqdn string = containerApp.properties.configuration.ingress.fqdn
output principalId string = containerApp.identity.principalId
output containerAppId string = containerApp.id
output caeId string = cae.id
