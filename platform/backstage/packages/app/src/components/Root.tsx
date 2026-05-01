import React, { PropsWithChildren } from 'react';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import CategoryIcon from '@material-ui/icons/Category';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import MenuBook from '@material-ui/icons/MenuBook';
import Score from '@material-ui/icons/Score';
import SearchIcon from '@material-ui/icons/Search';
import ExtensionIcon from '@material-ui/icons/Extension';
import {
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
  useSidebarOpenState,
  Link as SidebarLink,
} from '@backstage/core-components';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { Settings as SidebarSettings } from '@backstage/plugin-user-settings';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.iconContainerWidth,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 24,
  },
});

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();

  return (
    <div className={classes.root}>
      <SidebarLink to="/" underline="none" className={classes.link}>
        <strong style={{ color: '#fff', fontSize: isOpen ? 18 : 14 }}>
          {isOpen ? 'SZL Dev Portal' : 'SZL'}
        </strong>
      </SidebarLink>
    </div>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      <SidebarLogo />
      <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
        <SidebarSearchModal />
      </SidebarGroup>
      <SidebarDivider />
      <SidebarGroup label="Menu" icon={<HomeIcon />}>
        <SidebarItem icon={CategoryIcon} to="catalog" text="Catalog" />
        <SidebarItem icon={ExtensionIcon} to="api-docs" text="APIs" />
        <SidebarItem icon={LibraryBooks} to="docs" text="Docs" />
        <SidebarItem icon={CreateComponentIcon} to="create" text="Create..." />
        <SidebarItem icon={Score} to="tech-insights" text="Scorecards" />
        <SidebarItem icon={MenuBook} to="runbooks" text="Runbooks" />
      </SidebarGroup>
      <SidebarSpace />
      <SidebarDivider />
      <SidebarScrollWrapper>
        <SidebarSettings />
      </SidebarScrollWrapper>
    </Sidebar>
    {children}
  </SidebarPage>
);
