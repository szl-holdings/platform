@description('Virtual network name')
param name string

@description('Resource location')
param location string

@description('Address prefix for the VNet (CIDR)')
param vnetAddressPrefix string = '10.0.0.0/16'

resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: name
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [vnetAddressPrefix]
    }
    subnets: [
      {
        name: 'container-apps'
        properties: {
          addressPrefix: '10.0.0.0/23'
          delegations: [
            {
              name: 'container-apps-delegation'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
          serviceEndpoints: [
            { service: 'Microsoft.Storage' }
            { service: 'Microsoft.KeyVault' }
          ]
          networkSecurityGroup: {
            id: caeNsg.id
          }
        }
      }
      {
        name: 'postgres'
        properties: {
          addressPrefix: '10.0.2.0/24'
          delegations: [
            {
              name: 'postgres-delegation'
              properties: {
                serviceName: 'Microsoft.DBforPostgreSQL/flexibleServers'
              }
            }
          ]
          networkSecurityGroup: {
            id: pgNsg.id
          }
        }
      }
      {
        name: 'private-endpoints'
        properties: {
          addressPrefix: '10.0.3.0/24'
          privateEndpointNetworkPolicies: 'Disabled'
          networkSecurityGroup: {
            id: peNsg.id
          }
        }
      }
    ]
  }
}

resource caeNsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: '${name}-cae-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowHttpsInbound'
        properties: {
          priority: 100
          protocol: 'Tcp'
          access: 'Allow'
          direction: 'Inbound'
          sourceAddressPrefix: 'AzureFrontDoor.Backend'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '443'
        }
      }
      {
        name: 'AllowAzureMonitor'
        properties: {
          priority: 110
          protocol: '*'
          access: 'Allow'
          direction: 'Outbound'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: 'AzureMonitor'
          destinationPortRange: '*'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4000
          protocol: '*'
          access: 'Deny'
          direction: 'Inbound'
          sourceAddressPrefix: 'Internet'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

resource pgNsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: '${name}-pg-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowPostgresFromCAE'
        properties: {
          priority: 100
          protocol: 'Tcp'
          access: 'Allow'
          direction: 'Inbound'
          sourceAddressPrefix: '10.0.0.0/23'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '5432'
        }
      }
      {
        name: 'DenyAllOtherInbound'
        properties: {
          priority: 4000
          protocol: '*'
          access: 'Deny'
          direction: 'Inbound'
          sourceAddressPrefix: 'Internet'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

resource peNsg 'Microsoft.Network/networkSecurityGroups@2023-09-01' = {
  name: '${name}-pe-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowFromCAE'
        properties: {
          priority: 100
          protocol: '*'
          access: 'Allow'
          direction: 'Inbound'
          sourceAddressPrefix: '10.0.0.0/23'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
      {
        name: 'DenyAllOtherInbound'
        properties: {
          priority: 4000
          protocol: '*'
          access: 'Deny'
          direction: 'Inbound'
          sourceAddressPrefix: 'Internet'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

resource pgPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.postgres.database.azure.com'
  location: 'global'
}

resource kvPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.vaultcore.azure.net'
  location: 'global'
}

resource storagePrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.blob.core.windows.net'
  location: 'global'
}

resource redisPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.redis.cache.windows.net'
  location: 'global'
}

resource pgDnsVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: pgPrivateDnsZone
  name: '${name}-pg-dns-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: { id: vnet.id }
  }
}

resource kvDnsVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: kvPrivateDnsZone
  name: '${name}-kv-dns-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: { id: vnet.id }
  }
}

resource storageDnsVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: storagePrivateDnsZone
  name: '${name}-storage-dns-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: { id: vnet.id }
  }
}

resource redisDnsVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: redisPrivateDnsZone
  name: '${name}-redis-dns-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: { id: vnet.id }
  }
}

output vnetId string = vnet.id
output containerAppsSubnetId string = vnet.properties.subnets[0].id
output postgresSubnetId string = vnet.properties.subnets[1].id
output privateEndpointsSubnetId string = vnet.properties.subnets[2].id
output pgPrivateDnsZoneId string = pgPrivateDnsZone.id
output kvPrivateDnsZoneId string = kvPrivateDnsZone.id
output storagePrivateDnsZoneId string = storagePrivateDnsZone.id
output redisPrivateDnsZoneId string = redisPrivateDnsZone.id
