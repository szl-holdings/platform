import {
  GovernancePanelsBase,
  makeDarkGoldTheme,
} from '@szl-holdings/szl-doctrine/panels';

const THEME = makeDarkGoldTheme({
  bg: '#08090e',
  cardBg: '#0d0e14',
  gold: '#c9b787',
});

export function VesselsGovernancePanels() {
  return (
    <GovernancePanelsBase
      slug="vessels"
      theme={THEME}
      headline="Maritime intelligence — every voyage span flushes a replay-stamped receipt"
      doctrineAnatomyHref="https://a11oy.szlholdings.com/doctrine/anatomy"
    />
  );
}
