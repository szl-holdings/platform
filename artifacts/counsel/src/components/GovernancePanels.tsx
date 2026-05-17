import {
  GovernancePanelsBase,
  makeDarkGoldTheme,
} from '@szl-holdings/szl-doctrine/panels';

const THEME = makeDarkGoldTheme({
  bg: '#0a0a0a',
  cardBg: '#0e0e0e',
  gold: '#c9b787',
});

export function CounselGovernancePanels() {
  return (
    <GovernancePanelsBase
      slug="counsel"
      theme={THEME}
      headline="Legal matter command — every clause carries a DOI-bound proof envelope"
    />
  );
}
