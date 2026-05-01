import React, { useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';
import {
  Content,
  ContentHeader,
  Page,
  Progress,
  ResponseErrorPanel,
  Table,
  TableColumn,
} from '@backstage/core-components';

const SZL_RUNBOOK_ANNOTATION = 'szl.io/runbook';
const BACKSTAGE_RUNBOOK_ANNOTATION = 'backstage.io/runbook-url';
const GITHUB_PROJECT_SLUG_ANNOTATION = 'github.com/project-slug';
const DEFAULT_PROJECT_SLUG = 'szl-holdings/monorepo';
const DEFAULT_BRANCH = 'main';

/**
 * Resolve a runbook annotation value to a usable URL.
 *
 * Handles three cases:
 *   1. Absolute URL (https?://...) — returned as-is.
 *   2. backstage.io/runbook-url — already a URL by spec.
 *   3. szl.io/runbook with a relative path (e.g. infra/runbooks/foo.md or
 *      docs/runbook.md) — resolved against the entity's
 *      github.com/project-slug annotation as a GitHub blob URL on the default
 *      branch. Falls back to szl-holdings/monorepo if the annotation is missing.
 */
function getRunbookUrl(entity: Entity): string | undefined {
  const annotations = entity.metadata.annotations ?? {};
  const raw =
    annotations[BACKSTAGE_RUNBOOK_ANNOTATION] ??
    annotations[SZL_RUNBOOK_ANNOTATION];
  if (!raw) return undefined;

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const projectSlug =
    annotations[GITHUB_PROJECT_SLUG_ANNOTATION] ?? DEFAULT_PROJECT_SLUG;
  const cleanPath = raw.replace(/^\/+/, '');
  return `https://github.com/${projectSlug}/blob/${DEFAULT_BRANCH}/${cleanPath}`;
}

const columns: TableColumn<Entity>[] = [
  {
    title: 'Name',
    field: 'metadata.name',
    highlight: true,
    render: (entity: Entity) => entity.metadata.name,
  },
  {
    title: 'System',
    field: 'spec.system',
    render: (entity: Entity) => String(entity.spec?.system ?? '—'),
  },
  {
    title: 'Owner',
    field: 'spec.owner',
    render: (entity: Entity) => String(entity.spec?.owner ?? '—'),
  },
  {
    title: 'Lifecycle',
    field: 'spec.lifecycle',
    render: (entity: Entity) => String(entity.spec?.lifecycle ?? '—'),
  },
  {
    title: 'Runbook',
    render: (entity: Entity) => {
      const url = getRunbookUrl(entity);
      return url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open Runbook
        </a>
      ) : (
        <span style={{ color: '#888' }}>No runbook</span>
      );
    },
  },
];

/**
 * RunbooksPage
 *
 * Displays all catalog Component entities that have either:
 *   - backstage.io/runbook-url — standard Backstage runbook annotation
 *   - szl.io/runbook          — SZL platform convention (path relative to repo root)
 *
 * Runbook docs live at docs/runbook.md within each service directory and are
 * scaffolded automatically by the golden-path templates.
 */
export function RunbooksPage() {
  const catalogApi = useApi(catalogApiRef);
  const [entities, setEntities] = useState<Entity[] | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    catalogApi
      .getEntities({
        filter: { kind: 'Component' },
        fields: [
          'kind',
          'metadata.name',
          'metadata.namespace',
          'metadata.annotations',
          'spec.owner',
          'spec.system',
          'spec.lifecycle',
        ],
      })
      .then(response => {
        if (!cancelled) {
          setEntities(response.items);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err as Error);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [catalogApi]);

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;

  const withRunbooks = (entities ?? []).filter(e => !!getRunbookUrl(e));
  const withoutRunbooks = (entities ?? []).filter(e => !getRunbookUrl(e));

  return (
    <Page themeId="tool">
      <Content>
        <ContentHeader title="Operational Runbooks" />
        <p style={{ color: '#aaa', marginBottom: 16 }}>
          Services with a documented runbook ({withRunbooks.length} of{' '}
          {(entities ?? []).length} components). Golden-path templates scaffold{' '}
          <code>docs/runbook.md</code> automatically.
        </p>
        <Table
          title={`Services with runbooks (${withRunbooks.length})`}
          options={{ search: true, pageSize: 20, padding: 'dense' }}
          columns={columns}
          data={withRunbooks}
        />
        {withoutRunbooks.length > 0 && (
          <Table
            title={`Services missing runbooks (${withoutRunbooks.length})`}
            options={{ search: true, pageSize: 10, padding: 'dense' }}
            columns={columns}
            data={withoutRunbooks}
            style={{ marginTop: 32 }}
          />
        )}
      </Content>
    </Page>
  );
}
