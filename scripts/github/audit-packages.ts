#!/usr/bin/env tsx
/**
 * SZL Holdings — GitHub Packages Audit Script
 *
 * Lists and audits published packages across all registries for the
 * szl-holdings organization on GitHub Packages.
 *
 * Usage:
 *   pnpm tsx scripts/github/audit-packages.ts
 *   GITHUB_TOKEN=ghp_xxx pnpm tsx scripts/github/audit-packages.ts
 *   pnpm tsx scripts/github/audit-packages.ts --registry npm
 *   pnpm tsx scripts/github/audit-packages.ts --json > packages-audit.json
 *
 * Requirements:
 *   - GITHUB_TOKEN environment variable with read:packages scope
 *   - Network access to api.github.com
 */

const ORG = 'szl-holdings';
const GITHUB_API = 'https://api.github.com';

type PackageType = 'npm' | 'container' | 'maven' | 'nuget' | 'rubygems';

const REGISTRY_URLS: Record<PackageType, string> = {
  npm: 'https://npm.pkg.github.com',
  container: 'https://ghcr.io',
  maven: 'https://maven.pkg.github.com/szl-holdings/szl-holdings-platform',
  nuget: 'https://nuget.pkg.github.com/szl-holdings',
  rubygems: 'https://rubygems.pkg.github.com/szl-holdings',
};

interface GitHubPackage {
  id: number;
  name: string;
  package_type: PackageType;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
  version_count?: number;
  url: string;
  html_url: string;
}

interface PackageVersion {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  metadata?: {
    package_type: PackageType;
    container?: { tags: string[] };
    npm?: { name: string; version: string };
  };
}

interface AuditResult {
  timestamp: string;
  org: string;
  registries: Record<PackageType, PackageInfo[]>;
  summary: {
    total_packages: number;
    by_registry: Record<PackageType, number>;
    public_packages: number;
    private_packages: number;
  };
}

interface PackageInfo {
  name: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  latest_version?: string;
  version_count: number;
  registry_url: string;
  html_url: string;
}

async function githubFetch(path: string): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      'GITHUB_TOKEN environment variable is required.\n' +
        'Get a token at https://github.com/settings/tokens with read:packages scope.',
    );
  }

  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (response.status === 401) {
    throw new Error(
      'GitHub token is invalid or expired. Generate a new token at https://github.com/settings/tokens',
    );
  }

  if (response.status === 403) {
    throw new Error('GitHub token lacks required permissions. Ensure it has read:packages scope.');
  }

  return response;
}

async function fetchPackagesForRegistry(packageType: PackageType): Promise<PackageInfo[]> {
  try {
    const response = await githubFetch(
      `/orgs/${ORG}/packages?package_type=${packageType}&per_page=100`,
    );

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      console.warn(`  Warning: Could not fetch ${packageType} packages (HTTP ${response.status})`);
      return [];
    }

    const packages: GitHubPackage[] = await response.json();

    const packageInfos: PackageInfo[] = await Promise.all(
      packages.map(async (pkg): Promise<PackageInfo> => {
        let latestVersion: string | undefined;
        let versionCount = 0;

        try {
          const versionsResponse = await githubFetch(
            `/orgs/${ORG}/packages/${packageType}/${encodeURIComponent(pkg.name)}/versions?per_page=1`,
          );
          if (versionsResponse.ok) {
            const versions: PackageVersion[] = await versionsResponse.json();
            if (versions.length > 0) {
              latestVersion = versions[0].name;
            }

            const linkHeader = versionsResponse.headers.get('Link');
            if (linkHeader) {
              const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
              if (lastPageMatch) {
                versionCount = parseInt(lastPageMatch[1], 10);
              }
            } else {
              versionCount = versions.length;
            }
          }
        } catch {
          // Version count not critical
        }

        return {
          name: pkg.name,
          visibility: pkg.visibility,
          created_at: pkg.created_at,
          updated_at: pkg.updated_at,
          latest_version: latestVersion,
          version_count: versionCount,
          registry_url: REGISTRY_URLS[packageType],
          html_url: pkg.html_url,
        };
      }),
    );

    return packageInfos;
  } catch (error) {
    if (error instanceof Error && error.message.includes('GITHUB_TOKEN')) {
      throw error;
    }
    console.warn(`  Warning: Failed to fetch ${packageType} packages:`, error);
    return [];
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function printTable(packages: PackageInfo[], registryType: PackageType): void {
  if (packages.length === 0) {
    console.log('    No packages published yet.');
    return;
  }

  const maxNameLen = Math.max(...packages.map((p) => p.name.length), 10);
  const header = `    ${'Package'.padEnd(maxNameLen)}  ${'Visibility'.padEnd(10)}  ${'Version'.padEnd(15)}  Updated`;
  console.log(header);
  console.log('    ' + '-'.repeat(header.length - 4));

  for (const pkg of packages) {
    const name = pkg.name.padEnd(maxNameLen);
    const visibility = pkg.visibility.padEnd(10);
    const version = (pkg.latest_version ?? '—').padEnd(15);
    const updated = formatDate(pkg.updated_at);
    console.log(`    ${name}  ${visibility}  ${version}  ${updated}`);
  }
}

async function runAudit(options: { registry?: PackageType; json?: boolean }): Promise<void> {
  const registriesToAudit: PackageType[] = options.registry
    ? [options.registry]
    : ['npm', 'container', 'maven', 'nuget', 'rubygems'];

  if (!options.json) {
    console.log('\n========================================');
    console.log('  SZL Holdings — GitHub Packages Audit');
    console.log(`  Organization: ${ORG}`);
    console.log(`  Timestamp: ${new Date().toISOString()}`);
    console.log('========================================\n');
  }

  const result: AuditResult = {
    timestamp: new Date().toISOString(),
    org: ORG,
    registries: {} as Record<PackageType, PackageInfo[]>,
    summary: {
      total_packages: 0,
      by_registry: {} as Record<PackageType, number>,
      public_packages: 0,
      private_packages: 0,
    },
  };

  for (const registryType of registriesToAudit) {
    if (!options.json) {
      console.log(`  ${registryType.toUpperCase()} — ${REGISTRY_URLS[registryType]}`);
    }

    const packages = await fetchPackagesForRegistry(registryType);
    result.registries[registryType] = packages;
    result.summary.by_registry[registryType] = packages.length;
    result.summary.total_packages += packages.length;
    result.summary.public_packages += packages.filter((p) => p.visibility === 'public').length;
    result.summary.private_packages += packages.filter((p) => p.visibility === 'private').length;

    if (!options.json) {
      printTable(packages, registryType);
      console.log();
    }
  }

  if (!options.json) {
    console.log('========================================');
    console.log('  Summary');
    console.log('========================================');
    console.log(`  Total packages: ${result.summary.total_packages}`);
    console.log(`  Public: ${result.summary.public_packages}`);
    console.log(`  Private: ${result.summary.private_packages}`);
    console.log();
    console.log('  By registry:');
    for (const [reg, count] of Object.entries(result.summary.by_registry)) {
      console.log(`    ${reg.padEnd(12)}: ${count} package${count !== 1 ? 's' : ''}`);
    }
    console.log();
    console.log(`  View all: https://github.com/orgs/${ORG}/packages`);
    console.log('========================================\n');
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const jsonFlag = args.includes('--json');
const registryFlag = args.find((a) => a === '--registry')
  ? (args[args.indexOf('--registry') + 1] as PackageType)
  : undefined;

const validRegistries: PackageType[] = ['npm', 'container', 'maven', 'nuget', 'rubygems'];
if (registryFlag && !validRegistries.includes(registryFlag)) {
  console.error(`Invalid registry: ${registryFlag}. Must be one of: ${validRegistries.join(', ')}`);
  process.exit(1);
}

runAudit({ registry: registryFlag, json: jsonFlag }).catch((error) => {
  console.error('\nAudit failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
