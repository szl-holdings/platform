export const LICENSE_ALLOWLIST = [
  'Apache-2.0',
  'MIT',
  'BSD-3-Clause',
  'CC-BY-4.0',
] as const;

export type AllowedLicense = (typeof LICENSE_ALLOWLIST)[number];

export function assertAllowedLicense(license: string): AllowedLicense {
  if (!(LICENSE_ALLOWLIST as readonly string[]).includes(license)) {
    throw new Error(
      `agi-forecast: license "${license}" is not in the allowlist (${LICENSE_ALLOWLIST.join(', ')})`,
    );
  }
  return license as AllowedLicense;
}
