import {
  GovernancePanelsBase,
  makeDarkGoldTheme,
} from '@szl-holdings/szl-doctrine/panels';

const THEME = makeDarkGoldTheme({
  bg: '#08090e',
  cardBg: '#0d0e14',
  gold: '#b8943c',
});

export function TerraGovernancePanels() {
  return (
    <GovernancePanelsBase
      slug="terra"
      theme={THEME}
      headline="Real estate intelligence — every valuation is DOI-bound and floor-checked"
    />
  );
}
