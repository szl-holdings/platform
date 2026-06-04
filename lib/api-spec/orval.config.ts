import { defineConfig, type InputTransformerFn } from 'orval';
import path from 'node:path';

const root = path.resolve(__dirname, '..', '..');
const apiClientReactSrc = path.resolve(root, 'lib', 'api-client-react', 'src');
const apiZodSrc = path.resolve(root, 'lib', 'api-zod', 'src');

// Stamps the spec description so every generated file's JSDoc reflects when
// types were last regenerated — makes regeneration runs traceable in git.
// Also normalises the API title to "Api" so generated output lands in `api.ts`.
const regeneratedOn = new Date().toISOString().slice(0, 10);

const withRegenerationStamp: InputTransformerFn = (config) => {
  config.info ??= {};
  config.info.title = 'Api';
  config.info.description = (config.info.description ?? '')
    .replace(/\ntypes-regenerated: \d{4}-\d{2}-\d{2}/, '')
    .trimEnd()
    + `\ntypes-regenerated: ${regeneratedOn}`;
  return config;
};

export default defineConfig({
  'api-client-react': {
    input: {
      target: './openapi.yaml',
      override: {
        transformer: withRegenerationStamp,
      },
    },
    output: {
      workspace: apiClientReactSrc,
      target: 'generated',
      client: 'react-query',
      mode: 'split',
      baseUrl: '/api',
      clean: false,
      prettier: true,
      override: {
        fetch: {
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: path.resolve(apiClientReactSrc, 'custom-fetch.ts'),
          name: 'customFetch',
        },
      },
    },
  },
  zod: {
    input: {
      target: './openapi.yaml',
      override: {
        transformer: withRegenerationStamp,
      },
    },
    output: {
      workspace: apiZodSrc,
      client: 'zod',
      target: 'generated',
      schemas: { path: 'generated/types', type: 'typescript' },
      mode: 'split',
      clean: false,
      prettier: true,
      override: {
        zod: {
          coerce: {
            query: ['boolean', 'number', 'string'],
            param: ['boolean', 'number', 'string'],
          },
        },
        useDates: true,
      },
    },
  },
});
