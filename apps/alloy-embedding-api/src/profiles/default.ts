import type { ProfileDescriptor } from '@workspace/aef-contracts';

export const DEFAULT_PROFILE: ProfileDescriptor = {
  profileId: 'default',
  version: '0.1.0',
  domain: 'general',
  displayName: 'Default Profile',
  description: 'General-purpose embedding profile for AEF development and testing.',
  boostRuleIds: [],
  defaultMetadataFilters: {},
  rerankEnabled: false,
  maxCandidates: 100,
  maxResults: 10,
};

const profileRegistry = new Map<string, ProfileDescriptor>([
  [DEFAULT_PROFILE.profileId, DEFAULT_PROFILE],
]);

export function getProfile(profileId: string): ProfileDescriptor {
  const profile = profileRegistry.get(profileId);
  if (!profile) {
    throw new Error(
      `Profile '${profileId}' is not registered. Available profiles: ${[...profileRegistry.keys()].join(', ')}`,
    );
  }
  return profile;
}

export function registerProfile(profile: ProfileDescriptor): void {
  profileRegistry.set(profile.profileId, profile);
}

export function listProfiles(): ProfileDescriptor[] {
  return [...profileRegistry.values()];
}
