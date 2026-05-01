import {
  createBackendModule,
  coreServices,
} from '@backstage/backend-plugin-api';
import {
  techInsightsFactRetrieversExtensionPoint,
} from '@backstage-community/plugin-tech-insights-node';
import type {
  FactRetriever,
  FactRetrieverContext,
} from '@backstage-community/plugin-tech-insights-node';

const SZL_SCORECARD_ANNOTATION = 'szl.io/scorecard-score';
const SZL_PLATFORM_MATURITY_ANNOTATION = 'szl.io/platform-maturity';
const SZL_HEALTH_ENDPOINT_ANNOTATION = 'szl.io/health-endpoint';
const SZL_RUNBOOK_ANNOTATION = 'szl.io/runbook';
const SZL_TRACING_ANNOTATION = 'szl.io/tracing-enabled';
const BACKSTAGE_TECHDOCS_ANNOTATION = 'backstage.io/techdocs-ref';
const BACKSTAGE_RUNBOOK_ANNOTATION = 'backstage.io/runbook-url';

const szlScorecardAnnotationRetriever: FactRetriever = {
  id: 'szl-scorecard-annotations',
  version: '1.0.0',
  entityFilter: [{ kind: 'Component' }],
  schema: {
    scorecardScore: {
      type: 'number',
      description: 'Numeric platform scorecard score (0.0-4.0). Read from szl.io/scorecard-score annotation. Decimal precision preserved (e.g., 1.2, 2.7).',
    },
    platformMaturity: {
      type: 'string',
      description: 'Platform maturity tier. Read from szl.io/platform-maturity annotation.',
    },
    hasHealthEndpoint: {
      type: 'boolean',
      description: 'True if szl.io/health-endpoint annotation is present and non-empty.',
    },
    hasRunbook: {
      type: 'boolean',
      description: 'True if szl.io/runbook or backstage.io/runbook-url annotation is present.',
    },
  },
  handler: async ({ entities }: FactRetrieverContext) => {
    return entities
      .filter(entity => entity.kind === 'Component')
      .map(entity => {
        const annotations = entity.metadata.annotations ?? {};
        const scoreRaw = annotations[SZL_SCORECARD_ANNOTATION];
        const scorecardScore = scoreRaw !== undefined ? parseFloat(scoreRaw) : 0;
        const platformMaturity = annotations[SZL_PLATFORM_MATURITY_ANNOTATION] ?? 'bootstrapped';
        const hasHealthEndpoint = Boolean(annotations[SZL_HEALTH_ENDPOINT_ANNOTATION]);
        const hasRunbook = Boolean(
          annotations[SZL_RUNBOOK_ANNOTATION] || annotations[BACKSTAGE_RUNBOOK_ANNOTATION],
        );

        return {
          entity: {
            namespace: entity.metadata.namespace ?? 'default',
            kind: entity.kind,
            name: entity.metadata.name,
          },
          facts: {
            scorecardScore: isNaN(scorecardScore) ? 0 : scorecardScore,
            platformMaturity,
            hasHealthEndpoint,
            hasRunbook,
          },
        };
      });
  },
};

const szlObservabilityAnnotationRetriever: FactRetriever = {
  id: 'szl-observability-annotations',
  version: '1.0.0',
  entityFilter: [{ kind: 'Component' }],
  schema: {
    hasTechDocs: {
      type: 'boolean',
      description: 'True if backstage.io/techdocs-ref annotation is present.',
    },
    tracingEnabled: {
      type: 'boolean',
      description: 'True if szl.io/tracing-enabled annotation is "true".',
    },
  },
  handler: async ({ entities }: FactRetrieverContext) => {
    return entities
      .filter(entity => entity.kind === 'Component')
      .map(entity => {
        const annotations = entity.metadata.annotations ?? {};
        const hasTechDocs = Boolean(annotations[BACKSTAGE_TECHDOCS_ANNOTATION]);
        const tracingEnabled = annotations[SZL_TRACING_ANNOTATION] === 'true';

        return {
          entity: {
            namespace: entity.metadata.namespace ?? 'default',
            kind: entity.kind,
            name: entity.metadata.name,
          },
          facts: { hasTechDocs, tracingEnabled },
        };
      });
  },
};

const szlOwnershipAnnotationRetriever: FactRetriever = {
  id: 'szl-ownership-annotations',
  version: '1.0.0',
  entityFilter: [{ kind: 'Component' }],
  schema: {
    hasOwner: {
      type: 'boolean',
      description: 'True if spec.owner is set to a non-empty value.',
    },
    hasSystem: {
      type: 'boolean',
      description: 'True if spec.system is set to a non-empty value.',
    },
    lifecycle: {
      type: 'string',
      description: 'Component lifecycle: production | experimental | deprecated.',
    },
  },
  handler: async ({ entities }: FactRetrieverContext) => {
    return entities
      .filter(entity => entity.kind === 'Component')
      .map(entity => {
        const spec = entity.spec ?? {};
        const hasOwner = Boolean(spec.owner);
        const hasSystem = Boolean(spec.system);
        const lifecycle = (spec.lifecycle as string) ?? 'experimental';

        return {
          entity: {
            namespace: entity.metadata.namespace ?? 'default',
            kind: entity.kind,
            name: entity.metadata.name,
          },
          facts: { hasOwner, hasSystem, lifecycle },
        };
      });
  },
};

export const szlTechInsightsModule = createBackendModule({
  pluginId: 'tech-insights',
  moduleId: 'szl-scorecard-fact-retrievers',
  register(reg) {
    reg.registerInit({
      deps: {
        factRetrievers: techInsightsFactRetrieversExtensionPoint,
        logger: coreServices.logger,
      },
      async init({ factRetrievers, logger }) {
        logger.info(
          'Registering SZL scorecard fact retrievers (szl-scorecard-annotations, szl-observability-annotations, szl-ownership-annotations)',
        );
        factRetrievers.addFactRetrievers({
          szlScorecardAnnotationRetriever,
          szlObservabilityAnnotationRetriever,
          szlOwnershipAnnotationRetriever,
        });
      },
    });
  },
});
