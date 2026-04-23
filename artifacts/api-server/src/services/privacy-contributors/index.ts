/**
 * Privacy contributor registration.
 *
 * Import this module once (call registerAllPrivacyContributors()) to register
 * all domain contributors with the privacy registry.
 *
 * Registration order matters: the AUTH contributor MUST be last because its
 * deleteForUser hard-deletes the user row, which triggers ON DELETE CASCADE
 * for many FK-linked tables. All other contributors clean up non-cascaded data
 * before the auth contributor fires.
 *
 * To add a new domain: create a PrivacyContributor in this directory and call
 * registerPrivacyContributor() here — no other files need to change.
 */

import { registerPrivacyContributor } from '../privacy-registry';
import { auditContributor } from './audit';
import { carlotaContributor } from './carlota';
import { carlotaInquiriesContributor } from './carlota-inquiries';
import { commandContributor } from './command';
import { notificationsContributor } from './notifications';
import { authContributor } from './auth';

let registered = false;

export function registerAllPrivacyContributors(): void {
  if (registered) return;
  registered = true;

  registerPrivacyContributor(auditContributor);
  registerPrivacyContributor(notificationsContributor);
  registerPrivacyContributor(carlotaContributor);
  registerPrivacyContributor(carlotaInquiriesContributor);
  registerPrivacyContributor(commandContributor);
  registerPrivacyContributor(authContributor);
}
