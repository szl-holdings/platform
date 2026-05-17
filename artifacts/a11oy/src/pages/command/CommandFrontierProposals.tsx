import { CommandShell } from './CommandShell';
import { HeliosProposalsInbox } from './HeliosProposalsInbox';

export function CommandFrontierProposals() {
  return (
    <CommandShell active="proposals">
      <HeliosProposalsInbox />
    </CommandShell>
  );
}

export default CommandFrontierProposals;
