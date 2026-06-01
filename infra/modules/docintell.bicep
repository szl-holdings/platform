@description('Base name prefix')
param baseName string

@description('Azure region')
param location string

@description('Document Intelligence SKU')
@allowed(['F0', 'S0'])
param sku string = 'S0'

resource docIntelligence 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: '${baseName}-docintell'
  location: location
  kind: 'FormRecognizer'
  sku: {
    name: sku
  }
  properties: {
    customSubDomainName: '${baseName}-docintell'
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

output endpoint string = docIntelligence.properties.endpoint
output accountName string = docIntelligence.name
output accountId string = docIntelligence.id
