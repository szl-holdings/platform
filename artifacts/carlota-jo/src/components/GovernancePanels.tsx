import {
  GovernancePanelsBase,
  makeCreamGoldTheme,
} from '@szl-holdings/szl-doctrine/panels';

const THEME = makeCreamGoldTheme();

export function CarlotaJoGovernancePanels() {
  return (
    <GovernancePanelsBase
      slug="carlota-jo"
      theme={THEME}
      headline="Consulting engagements ship under the same doctrine as everything else"
    />
  );
}
