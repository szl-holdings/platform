import { createBackend } from '@backstage/backend-defaults';
import { szlTechInsightsModule } from './plugins/techInsights';

const backend = createBackend();

backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));

backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(import('@backstage/plugin-catalog-backend-module-github'));

backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));

backend.add(import('@backstage/plugin-techdocs-backend'));

backend.add(import('@backstage-community/plugin-tech-insights-backend'));
backend.add(szlTechInsightsModule);

backend.add(import('@backstage/plugin-search-backend'));
backend.add(import('@backstage/plugin-search-backend-module-catalog'));

backend.start();
