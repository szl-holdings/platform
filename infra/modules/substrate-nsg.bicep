// ─── Substrate NSG + dedicated subnet ─────────────────────────────────────────
// Creates an NSG that locks inbound traffic to API server egress IPs and
// provisions a dedicated 'substrate' subnet in the existing VNet, associating
// the NSG so the rules are actually enforced (not just declared).
//
// The substrate subnet is used by the VMSS path (NC-series GPU nodes).
// For the Container Apps path the inference and worker apps share the existing
// CAE subnet; the NSG is still deployed as a governance artifact that can be
// applied to the CAE subnet via the Azure Portal or a follow-up pipeline step.

@description('Resource location')
param location string

@description('NSG name')
param nsgName string

@description('CIDR blocks of the API server Container Apps environment (egress IPs)')
param apiServerEgressCidrs array = []

@description('Log Analytics workspace resource ID')
param logAnalyticsId string

@description('Name of the existing VNet to add the substrate subnet to')
param vnetName string

@description('Address prefix for the dedicated substrate subnet (must not overlap existing subnets)')
param substrateSubnetAddressPrefix string = '10.0.5.0/24'

var substrateInferencePort = '8070'
var substrateWorkerPort = '8090'

resource nsg 'Microsoft.Network/networkSecurityGroups@2023-11-01' = {
  name: nsgName
  location: location
  properties: {
    securityRules: [
      // ── Allow inference port from API server egress ─────────────────────────
      {
        name: 'Allow-Substrate-Inference-From-API'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: substrateInferencePort
          sourceAddressPrefixes: length(apiServerEgressCidrs) > 0 ? apiServerEgressCidrs : ['10.0.0.0/8']
          destinationAddressPrefix: 'VirtualNetwork'
          description: 'Allow substrate inference from API server egress CIDRs'
        }
      }
      // ── Allow worker port from API server egress ────────────────────────────
      {
        name: 'Allow-Substrate-Workers-From-API'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: substrateWorkerPort
          sourceAddressPrefixes: length(apiServerEgressCidrs) > 0 ? apiServerEgressCidrs : ['10.0.0.0/8']
          destinationAddressPrefix: 'VirtualNetwork'
          description: 'Allow substrate worker port from API server egress CIDRs'
        }
      }
      // ── Allow internal VNet (inference ↔ worker) ────────────────────────────
      {
        name: 'Allow-Internal-VNet'
        properties: {
          priority: 200
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRanges: [substrateInferencePort, substrateWorkerPort]
          sourceAddressPrefix: 'VirtualNetwork'
          destinationAddressPrefix: 'VirtualNetwork'
          description: 'Allow internal VNet communication between substrate services'
        }
      }
      // ── Allow Azure health probes ───────────────────────────────────────────
      {
        name: 'Allow-AzureLoadBalancer-Probes'
        properties: {
          priority: 300
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: 'AzureLoadBalancer'
          destinationAddressPrefix: 'VirtualNetwork'
          description: 'Allow Azure Load Balancer health probes'
        }
      }
      // ── Deny all other inbound ──────────────────────────────────────────────
      {
        name: 'Deny-All-Inbound'
        properties: {
          priority: 4000
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          description: 'Deny all other inbound traffic'
        }
      }
    ]
  }
}

// ── Dedicated substrate subnet — NSG is associated here at creation time ──────
// Using a child resource of the existing VNet means only this subnet is touched;
// all other subnets (container-apps, postgres, private-endpoints) are unaffected.
resource existingVnet 'Microsoft.Network/virtualNetworks@2023-09-01' existing = {
  name: vnetName
}

resource substrateSubnet 'Microsoft.Network/virtualNetworks/subnets@2023-09-01' = {
  parent: existingVnet
  name: 'substrate'
  properties: {
    addressPrefix: substrateSubnetAddressPrefix
    networkSecurityGroup: {
      id: nsg.id
    }
    // No service endpoint delegation — substrate GPU VMSS nodes are plain VMs.
    // Container Apps path: apps use the existing container-apps subnet in the CAE;
    // this subnet is for VMSS NC-series nodes on the VMSS deployment path.
    serviceEndpoints: [
      { service: 'Microsoft.Storage' }
      { service: 'Microsoft.KeyVault' }
    ]
  }
}

resource nsgDiag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'substrate-nsg-diag'
  scope: nsg
  properties: {
    workspaceId: logAnalyticsId
    logs: [
      {
        category: 'NetworkSecurityGroupEvent'
        enabled: true
        retentionPolicy: { enabled: true; days: 30 }
      }
      {
        category: 'NetworkSecurityGroupRuleCounter'
        enabled: true
        retentionPolicy: { enabled: true; days: 30 }
      }
    ]
  }
}

output nsgId string = nsg.id
output nsgName string = nsg.name
output substrateSubnetId string = substrateSubnet.id
