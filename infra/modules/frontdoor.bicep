@description('Front Door profile name')
param profileName string

@description('WAF policy name')
param wafPolicyName string

@description('API backend address (Container App FQDN)')
param apiBackendAddress string

@description('Custom domain')
param customDomain string = 'szlholdings.com'

@description('Frontend app names for path-based routing')
param frontendAppNames array = []

@description('Static Web App default hostnames (one per frontend, matching frontendAppNames order)')
param swaHostnames array = []

@description('Log Analytics workspace resource ID for diagnostic settings')
param logAnalyticsId string = ''

resource wafPolicy 'Microsoft.Network/FrontDoorWebApplicationFirewallPolicies@2024-02-01' = {
  name: wafPolicyName
  location: 'Global'
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
  properties: {
    policySettings: {
      mode: 'Prevention'
      enabledState: 'Enabled'
      requestBodyCheck: 'Enabled'
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
          ruleSetAction: 'Block'
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.1'
        }
      ]
    }
    customRules: {
      rules: [
        {
          name: 'RateLimitRule'
          priority: 100
          ruleType: 'RateLimitRule'
          rateLimitThreshold: 1000
          rateLimitDurationInMinutes: 1
          action: 'Block'
          matchConditions: [
            {
              matchVariable: 'RequestUri'
              operator: 'RegEx'
              matchValue: ['.*']
            }
          ]
        }
      ]
    }
  }
}

resource frontDoor 'Microsoft.Cdn/profiles@2024-02-01' = {
  name: profileName
  location: 'Global'
  sku: {
    name: 'Premium_AzureFrontDoor'
  }
}

resource endpoint 'Microsoft.Cdn/profiles/afdEndpoints@2024-02-01' = {
  parent: frontDoor
  name: '${profileName}-endpoint'
  location: 'Global'
  properties: {
    enabledState: 'Enabled'
  }
}

resource apiOriginGroup 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = {
  parent: frontDoor
  name: 'api-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/health'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 30
    }
    sessionAffinityState: 'Disabled'
  }
}

resource apiOrigin 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = {
  parent: apiOriginGroup
  name: 'api-origin'
  properties: {
    hostName: apiBackendAddress
    httpPort: 80
    httpsPort: 443
    originHostHeader: apiBackendAddress
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
  }
}

resource swaOriginGroups 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = [for (appName, i) in frontendAppNames: {
  parent: frontDoor
  name: 'swa-${appName}-origin-group'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
      additionalLatencyInMilliseconds: 50
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 60
    }
    sessionAffinityState: 'Disabled'
  }
}]

resource swaOrigins 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = [for (appName, i) in frontendAppNames: {
  parent: swaOriginGroups[i]
  name: 'swa-${appName}-origin'
  properties: {
    hostName: swaHostnames[i]
    httpPort: 80
    httpsPort: 443
    originHostHeader: swaHostnames[i]
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
  }
}]

resource staticAssetRuleSet 'Microsoft.Cdn/profiles/ruleSets@2024-02-01' = {
  parent: frontDoor
  name: 'StaticAssetCaching'
}

resource cacheHashedAssetsRule 'Microsoft.Cdn/profiles/ruleSets/rules@2024-02-01' = {
  parent: staticAssetRuleSet
  name: 'CacheHashedAssets'
  properties: {
    order: 1
    conditions: [
      {
        name: 'UrlPath'
        parameters: {
          typeName: 'DeliveryRuleUrlPathMatchConditionParameters'
          operator: 'RegEx'
          matchValues: ['\\.[a-f0-9]{8,}\\.(js|css|woff2?|ttf|eot|otf|png|jpg|jpeg|gif|webp|avif|svg)$']
          transforms: ['Lowercase']
        }
      }
    ]
    actions: [
      {
        name: 'CacheExpiration'
        parameters: {
          typeName: 'DeliveryRuleCacheExpirationActionParameters'
          cacheBehavior: 'Override'
          cacheType: 'All'
          cacheDuration: '365.00:00:00'
        }
      }
    ]
  }
}

resource cacheStaticAssetsRule 'Microsoft.Cdn/profiles/ruleSets/rules@2024-02-01' = {
  parent: staticAssetRuleSet
  name: 'CacheStaticAssets'
  properties: {
    order: 2
    conditions: [
      {
        name: 'UrlFileExtension'
        parameters: {
          typeName: 'DeliveryRuleUrlFileExtensionMatchConditionParameters'
          operator: 'Contains'
          matchValues: ['js', 'css', 'woff2', 'woff', 'ttf', 'eot', 'otf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico', 'svg']
          transforms: ['Lowercase']
        }
      }
    ]
    actions: [
      {
        name: 'CacheExpiration'
        parameters: {
          typeName: 'DeliveryRuleCacheExpirationActionParameters'
          cacheBehavior: 'Override'
          cacheType: 'All'
          cacheDuration: '1.00:00:00'
        }
      }
    ]
  }
}

resource apiRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: endpoint
  name: 'api-route'
  properties: {
    originGroup: {
      id: apiOriginGroup.id
    }
    patternsToMatch: ['/api/*']
    forwardingProtocol: 'HttpsOnly'
    httpsRedirect: 'Enabled'
    linkToDefaultDomain: 'Enabled'
    supportedProtocols: ['Http', 'Https']
  }
  dependsOn: [apiOrigin]
}

resource swaRoutes 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = [for (appName, i) in frontendAppNames: {
  parent: endpoint
  name: 'swa-${appName}-route'
  properties: {
    originGroup: {
      id: swaOriginGroups[i].id
    }
    patternsToMatch: appName == 'szl-holdings' ? ['/*'] : ['/${appName}/*']
    forwardingProtocol: 'HttpsOnly'
    httpsRedirect: 'Enabled'
    linkToDefaultDomain: 'Enabled'
    supportedProtocols: ['Http', 'Https']
    ruleSets: [
      { id: staticAssetRuleSet.id }
    ]
  }
  dependsOn: [swaOrigins[i], apiRoute]
}]

resource customDomainResource 'Microsoft.Cdn/profiles/customDomains@2024-02-01' = {
  parent: frontDoor
  name: replace(customDomain, '.', '-')
  properties: {
    hostName: customDomain
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
  }
}

resource wwwCustomDomainResource 'Microsoft.Cdn/profiles/customDomains@2024-02-01' = {
  parent: frontDoor
  name: replace('www.${customDomain}', '.', '-')
  properties: {
    hostName: 'www.${customDomain}'
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
  }
}

resource wwwRedirectRuleSet 'Microsoft.Cdn/profiles/ruleSets@2024-02-01' = {
  parent: frontDoor
  name: 'WwwToApexRedirect'
}

resource wwwRedirectRule 'Microsoft.Cdn/profiles/ruleSets/rules@2024-02-01' = {
  parent: wwwRedirectRuleSet
  name: 'RedirectWwwToApex'
  properties: {
    order: 1
    conditions: [
      {
        name: 'RequestHeader'
        parameters: {
          typeName: 'DeliveryRuleRequestHeaderConditionParameters'
          selector: 'Host'
          operator: 'BeginsWith'
          matchValues: ['www.']
          transforms: ['Lowercase']
        }
      }
    ]
    actions: [
      {
        name: 'UrlRedirect'
        parameters: {
          typeName: 'DeliveryRuleUrlRedirectActionParameters'
          redirectType: 'Moved'
          destinationProtocol: 'Https'
          customHostname: customDomain
        }
      }
    ]
  }
}

resource wwwRedirectRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: endpoint
  name: 'www-redirect-route'
  properties: {
    originGroup: {
      id: apiOriginGroup.id
    }
    customDomains: [
      { id: wwwCustomDomainResource.id }
    ]
    patternsToMatch: ['/*']
    forwardingProtocol: 'HttpsOnly'
    httpsRedirect: 'Enabled'
    supportedProtocols: ['Http', 'Https']
    ruleSets: [
      { id: wwwRedirectRuleSet.id }
    ]
  }
  dependsOn: [apiOrigin, wwwRedirectRule]
}

resource customDomainApiRoute 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: endpoint
  name: 'custom-domain-api-route'
  properties: {
    originGroup: {
      id: apiOriginGroup.id
    }
    customDomains: [
      { id: customDomainResource.id }
    ]
    patternsToMatch: ['/api/*']
    forwardingProtocol: 'HttpsOnly'
    httpsRedirect: 'Enabled'
    supportedProtocols: ['Http', 'Https']
  }
  dependsOn: [apiOrigin]
}

resource customDomainSwaRoutes 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = [for (appName, i) in frontendAppNames: {
  parent: endpoint
  name: 'custom-domain-swa-${appName}-route'
  properties: {
    originGroup: {
      id: swaOriginGroups[i].id
    }
    customDomains: [
      { id: customDomainResource.id }
    ]
    patternsToMatch: appName == 'szl-holdings' ? ['/*'] : ['/${appName}/*']
    forwardingProtocol: 'HttpsOnly'
    httpsRedirect: 'Enabled'
    supportedProtocols: ['Http', 'Https']
    ruleSets: [
      { id: staticAssetRuleSet.id }
    ]
  }
  dependsOn: [swaOrigins[i], customDomainApiRoute]
}]

resource securityPolicy 'Microsoft.Cdn/profiles/securityPolicies@2024-02-01' = {
  parent: frontDoor
  name: 'waf-security-policy'
  properties: {
    parameters: {
      type: 'WebApplicationFirewall'
      wafPolicy: {
        id: wafPolicy.id
      }
      associations: [
        {
          domains: [
            { id: endpoint.id }
            { id: customDomainResource.id }
            { id: wwwCustomDomainResource.id }
          ]
          patternsToMatch: ['/*']
        }
      ]
    }
  }
}

resource frontDoorDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (!empty(logAnalyticsId)) {
  name: 'frontdoor-diagnostics'
  scope: frontDoor
  properties: {
    workspaceId: logAnalyticsId
    logs: [
      {
        category: 'FrontDoorAccessLog'
        enabled: true
        retentionPolicy: { enabled: true; days: 90 }
      }
      {
        category: 'FrontDoorWebApplicationFirewallLog'
        enabled: true
        retentionPolicy: { enabled: true; days: 90 }
      }
      {
        category: 'FrontDoorHealthProbeLog'
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

output endpointHostName string = endpoint.properties.hostName
output customDomainValidationToken string = customDomainResource.properties.validationProperties.validationToken
output frontDoorId string = frontDoor.id
