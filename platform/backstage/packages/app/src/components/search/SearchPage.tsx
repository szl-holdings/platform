import React from 'react';
import { Grid, Paper } from '@material-ui/core';
import { CatalogSearchResultListItem } from '@backstage/plugin-catalog';
import {
  SearchBar,
  SearchFilter,
  SearchResult,
  SearchType,
  DefaultResultListItem,
} from '@backstage/plugin-search-react';
import {
  CatalogIcon,
  Content,
  DocsIcon,
  Header,
  Page,
} from '@backstage/core-components';
import { TechDocsSearchResultListItem } from '@backstage/plugin-techdocs';

export const searchPage = (
  <Page themeId="home">
    <Header title="Search" />
    <Content>
      <Grid container direction="row">
        <Grid item xs={12}>
          <Paper>
            <SearchBar />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <SearchType.Tabs
            types={[
              {
                value: 'software-catalog',
                name: 'Software Catalog',
                icon: <CatalogIcon />,
              },
              {
                value: 'techdocs',
                name: 'Documentation',
                icon: <DocsIcon />,
              },
            ]}
          />
        </Grid>
        <Grid item xs={3}>
          <SearchFilter.Select
            className=""
            label="Kind"
            name="kind"
            values={['Component', 'Template', 'API', 'Group', 'User', 'System', 'Domain']}
          />
          <SearchFilter.Select
            className=""
            label="Lifecycle"
            name="lifecycle"
            values={['production', 'experimental', 'deprecated']}
          />
        </Grid>
        <Grid item xs={9}>
          <SearchResult>
            <CatalogSearchResultListItem icon={<CatalogIcon />} />
            <TechDocsSearchResultListItem icon={<DocsIcon />} />
            <DefaultResultListItem />
          </SearchResult>
        </Grid>
      </Grid>
    </Content>
  </Page>
);
