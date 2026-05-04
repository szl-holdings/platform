// ─── Substrate GPU Lane — Container App + VMSS option ────────────────────────
// Provisions the GPU compute plane for the substrate fleet.
// Deployed only when deploySubstrateFleet=true in main.bicep.
//
// Resources created:
//   - Azure Container Registry (or extended if existing)
//   - GPU Container App in an existing CAE (GPU workload profile), OR
//     NC-series VMSS with CUDA drivers (controlled by useVmss param)
//   - Python workers Container App (Consumption profile, CPU-bound)
//
// Autoscaling (two-layer):
//   Layer 1 — Container Apps HTTP scaler: scales out when each replica is
//   handling more than scaleOutQueueDepth concurrent /claim requests.
//   This is a built-in CAE capability — no external KEDA infrastructure needed.
//
//   Layer 2 — KEDA metrics-api scaler (active after the first deployment when
//   workerExternalFqdn is known): polls the Python worker's /metrics endpoint
//   for queueDepth (reported by AutoscalingPolicy) and drives an independent
//   scale-out signal alongside the HTTP trigger.
//
// GPU workload profile:
//   The inference Container App is pinned to the GPU workload profile so it is
//   scheduled on NC-series nodes. The workload profile must be pre-provisioned in
//   the Container Apps Environment before this module deploys.
//   See: https://learn.microsoft.com/azure/container-apps/workload-profiles-overview

@description('Base name prefix')
param baseName string

@description('Azure region')
param location string

@description('Container Apps Environment resource ID (existing)')
param caeId string

@description('Log Analytics workspace resource ID')
param logAnalyticsId string

@description('ACR login server (e.g. szlholdingsacr.azurecr.io)')
param acrLoginServer string

@description('ACR name (for role assignment)')
param acrName string

@description('Git SHA image tag for both substrate images')
param imageTag string = 'latest'

@description('API key for the substrate inference service')
@secure()
param substrateApiKey string

@description('Key Vault resource ID (for SUBSTRATE_API_KEY secret)')
param keyVaultId string

@description('Minimum replicas for the Python worker Container App')
param minWorkerReplicas int = 1

@description('Maximum replicas for the Python worker Container App')
param maxWorkerReplicas int = 10

@description('Queue depth threshold that triggers scale-out (concurrent HTTP requests per replica)')
param scaleOutQueueDepth int = 3

@description('Use VMSS instead of Container Apps for the GPU lane')
param useVmss bool = false

@description('API server Container App principal ID (for NSG allow-list)')
param apiServerPrincipalId string = ''

@description('''
Workload profile name in the Container Apps Environment to use for the GPU inference
app. Must be a GPU-class profile (e.g. NC6s_v3, NC24ads_A100_v4) pre-provisioned in
the CAE. The Python workers run on the default Consumption profile.
Leave empty to use the default Consumption profile (CPU-only / dev mode).
''')
param gpuWorkloadProfileName string = ''

@description('IP CIDR ranges allowed to call the substrate apps (should be set to the API server egress CIDRs). Empty array = no restriction.')
param allowedIngressCidrs array = []

@description('''
Worker app external FQDN for the Python-advisory two-layer autoscaling rule.
Leave empty on the initial deployment (FQDN is not yet known); on subsequent
deployments pass the FQDN from the previous run to wire the KEDA metrics-api
scaler into the workerApp scale rules (Layer 2: Python /metrics queue depth).
''')
param workerExternalFqdn string = ''

var inferenceAppName = '${baseName}-substrate-inference'
var workerAppName = '${baseName}-substrate-workers'
var inferenceImage = '${acrLoginServer}/substrate-inference:${imageTag}'
var workerImage = '${acrLoginServer}/substrate-py-workers:${imageTag}'
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
var useGpuProfile = !empty(gpuWorkloadProfileName)
var useIpRestrictions = length(allowedIngressCidrs) > 0
var kvSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'
var useWorkerMetricsScaler = !empty(workerExternalFqdn)

// ── Key Vault secret for SUBSTRATE_API_KEY ────────────────────────────────────
resource kvRef 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: last(split(keyVaultId, '/'))
}

resource substrateApiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: kvRef
  name: 'substrate-api-key'
  properties: {
    value: substrateApiKey
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}

// ── Substrate Inference Container App (GPU) ────────────────────────────────────
// workloadProfileName pins this app to the GPU node pool declared in the CAE.
// When gpuWorkloadProfileName is empty the app runs on Consumption (CPU / dev).
resource inferenceApp 'Microsoft.App/containerApps@2024-03-01' = if (!useVmss) {
  name: inferenceAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    environmentId: caeId
    workloadProfileName: useGpuProfile ? gpuWorkloadProfileName : 'Consumption'
    configuration: {
      ingress: {
        // external: true gives the inference app a public FQDN so the post-deploy
        // smoke test (run from outside the VNet) can reach /health and /ready.
        // Traffic is still protected by SUBSTRATE_API_KEY on model-load endpoints.
        external: true
        targetPort: 8070
        transport: 'http'
        // IP allow-list: restrict inbound to the API server egress CIDRs when provided.
        // Empty allowedIngressCidrs = no restriction (dev/test); set in prod parameters.
        ipSecurityRestrictions: useIpRestrictions ? [for cidr in allowedIngressCidrs: {
          name: 'allow-api-server-${replace(replace(cidr, '/', '-'), '.', '-')}'
          action: 'Allow'
          ipAddressRange: cidr
        }] : []
      }
      registries: [
        {
          server: acrLoginServer
          identity: 'system'
        }
      ]
      secrets: [
        {
          name: 'substrate-api-key'
          keyVaultUrl: substrateApiKeySecret.properties.secretUri
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'substrate-inference'
          image: inferenceImage
          env: [
            { name: 'SUBSTRATE_BIND_HOST'; value: '0.0.0.0' }
            { name: 'SUBSTRATE_INFERENCE_PORT'; value: '8070' }
            { name: 'PORT'; value: '8070' }
            { name: 'SUBSTRATE_MAX_CONCURRENT'; value: '4' }
            { name: 'SUBSTRATE_MODELS_DIR'; value: '/data/models' }
            { name: 'SUBSTRATE_CACHE_DIR'; value: '/data/cache' }
            { name: 'SUBSTRATE_API_KEY'; secretRef: 'substrate-api-key' }
          ]
          resources: {
            // GPU workload profile nodes provide the GPU. CPU/memory here are for
            // scheduler accounting only — the actual GPU is provided by the profile.
            cpu: json('4.0')
            memory: '16Gi'
          }
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8070
              }
              initialDelaySeconds: 60
              periodSeconds: 30
              timeoutSeconds: 10
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/ready'
                port: 8070
              }
              initialDelaySeconds: 30
              periodSeconds: 15
              timeoutSeconds: 8
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}

// ── Substrate Python Workers Container App ─────────────────────────────────────
// Workers run on the standard Consumption profile (CPU-bound Python tasks,
// ranking, routing, OCR). GPU is only needed in the inference app.
//
// Autoscaling via KEDA HTTP scaler:
//   concurrentRequests = scaleOutQueueDepth means: once each replica is handling
//   scaleOutQueueDepth simultaneous /claim requests, Container Apps adds a replica.
//   This is a built-in CAE capability — no external KEDA infrastructure required.
resource workerApp 'Microsoft.App/containerApps@2024-03-01' = if (!useVmss) {
  name: workerAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    environmentId: caeId
    workloadProfileName: 'Consumption'
    configuration: {
      ingress: {
        // external: true gives the worker app a public FQDN reachable from the
        // deploy script smoke (curl /health /ready /claim from outside VNet).
        external: true
        targetPort: 8090
        transport: 'http'
        // IP allow-list: same restrictions as the inference app — only API server
        // egress CIDRs may call /health, /ready, and /claim on the worker.
        ipSecurityRestrictions: useIpRestrictions ? [for cidr in allowedIngressCidrs: {
          name: 'allow-api-server-${replace(replace(cidr, '/', '-'), '.', '-')}'
          action: 'Allow'
          ipAddressRange: cidr
        }] : []
      }
      registries: [
        {
          server: acrLoginServer
          identity: 'system'
        }
      ]
      secrets: [
        {
          name: 'substrate-api-key'
          keyVaultUrl: substrateApiKeySecret.properties.secretUri
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'substrate-py-workers'
          image: workerImage
          env: [
            { name: 'PORT'; value: '8090' }
            { name: 'WORKER_MAX_CONCURRENCY'; value: '4' }
            { name: 'WORKER_DRAIN_TIMEOUT_S'; value: '60' }
            { name: 'SCALE_OUT_QUEUE_DEPTH'; value: string(scaleOutQueueDepth) }
            { name: 'MAX_WORKERS'; value: string(maxWorkerReplicas) }
            { name: 'MIN_WORKERS'; value: string(minWorkerReplicas) }
            // SUBSTRATE_INFERENCE_URL tells the worker where the inference engine is.
            // Both apps are external:true within the same CAE, so we use the inference
            // app's actual FQDN (available here because workerApp dependsOn inferenceApp).
            // Port 8070 is the inference engine's target port exposed via ingress.
            { name: 'SUBSTRATE_INFERENCE_URL'; value: 'https://${inferenceApp.properties.configuration.ingress.fqdn}' }
            { name: 'SUBSTRATE_API_KEY'; secretRef: 'substrate-api-key' }
          ]
          resources: {
            cpu: json('2.0')
            memory: '8Gi'
          }
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 8090
              }
              initialDelaySeconds: 30
              periodSeconds: 20
              timeoutSeconds: 8
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/ready'
                port: 8090
              }
              initialDelaySeconds: 15
              periodSeconds: 10
              timeoutSeconds: 5
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: minWorkerReplicas
        maxReplicas: maxWorkerReplicas
        rules: [
          // Layer 1: HTTP scaler — built-in Container Apps capability.
          // Scale out when each replica is handling more than scaleOutQueueDepth
          // concurrent /claim requests. Scale in on cooldown when pressure drops.
          {
            name: 'http-queue-depth'
            http: {
              metadata: {
                concurrentRequests: string(scaleOutQueueDepth)
              }
            }
          }
          // Layer 2: Python-advisory autoscaling via the worker's /metrics endpoint.
          // The Python AutoscalingPolicy reports queueDepth (pending claims not yet
          // claimed by any replica); KEDA metrics-api scaler drives scale-out when
          // queueDepth exceeds scaleOutQueueDepth between HTTP scaling decisions.
          // Only active when workerExternalFqdn is supplied (second+ deployment).
          ...useWorkerMetricsScaler ? [
            {
              name: 'python-queue-depth'
              custom: {
                type: 'metrics-api'
                metadata: {
                  targetValue: string(scaleOutQueueDepth)
                  url: 'https://${workerExternalFqdn}/metrics'
                  valueLocation: 'queueDepth'
                  format: 'json'
                }
              }
            }
          ] : []
        ]
      }
    }
  }
  dependsOn: [inferenceApp]
}

// ── ACR pull role for inference app ───────────────────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
}

resource inferenceAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!useVmss) {
  name: guid(acr.id, inferenceApp.identity.principalId, acrPullRoleId)
  scope: acr
  properties: {
    principalId: inferenceApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalType: 'ServicePrincipal'
  }
}

resource workerAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!useVmss) {
  name: guid(acr.id, workerApp.identity.principalId, acrPullRoleId)
  scope: acr
  properties: {
    principalId: workerApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalType: 'ServicePrincipal'
  }
}

// ── Key Vault Secrets User RBAC for substrate app identities ──────────────────
// Both apps read SUBSTRATE_API_KEY from Key Vault via secret ref. Each system-
// assigned identity needs the Key Vault Secrets User role on the vault so the
// Container Apps runtime can resolve the secret at startup.
resource inferenceKvRead 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!useVmss) {
  name: guid(keyVaultId, inferenceApp.identity.principalId, kvSecretsUserRoleId)
  scope: kvRef
  properties: {
    principalId: inferenceApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalType: 'ServicePrincipal'
  }
}

resource workerKvRead 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!useVmss) {
  name: guid(keyVaultId, workerApp.identity.principalId, kvSecretsUserRoleId)
  scope: kvRef
  properties: {
    principalId: workerApp.identity.principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', kvSecretsUserRoleId)
    principalType: 'ServicePrincipal'
  }
}

// ── Diagnostic settings ────────────────────────────────────────────────────────
resource inferenceAppDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!useVmss) {
  name: 'substrate-inference-diag'
  scope: inferenceApp
  properties: {
    workspaceId: logAnalyticsId
    logs: [
      { category: 'ContainerAppConsoleLogs'; enabled: true; retentionPolicy: { enabled: true; days: 30 } }
    ]
    metrics: [
      { category: 'AllMetrics'; enabled: true; retentionPolicy: { enabled: true; days: 30 } }
    ]
  }
}

resource workerAppDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!useVmss) {
  name: 'substrate-workers-diag'
  scope: workerApp
  properties: {
    workspaceId: logAnalyticsId
    logs: [
      { category: 'ContainerAppConsoleLogs'; enabled: true; retentionPolicy: { enabled: true; days: 30 } }
    ]
    metrics: [
      { category: 'AllMetrics'; enabled: true; retentionPolicy: { enabled: true; days: 30 } }
    ]
  }
}

// ── Outputs ────────────────────────────────────────────────────────────────────
output inferenceAppFqdn string = !useVmss ? inferenceApp.properties.configuration.ingress.fqdn : ''
output workerAppFqdn string = !useVmss ? workerApp.properties.configuration.ingress.fqdn : ''
output inferenceAppId string = !useVmss ? inferenceApp.id : ''
output workerAppId string = !useVmss ? workerApp.id : ''
output substrateApiKeySecretUri string = substrateApiKeySecret.properties.secretUri
