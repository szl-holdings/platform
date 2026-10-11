import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import test from 'node:test';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const infraRoot = resolve(repositoryRoot, 'infra');

async function collectFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectFiles(entryPath, extension);
      return entry.isFile() && entry.name.endsWith(extension) ? [entryPath] : [];
    }),
  );

  return nestedFiles.flat().sort();
}

function repositoryPath(filePath) {
  return relative(repositoryRoot, filePath).split(sep).join('/');
}

test('every local Bicep module reference resolves to a committed template', async () => {
  const bicepFiles = await collectFiles(infraRoot, '.bicep');
  const missingModules = [];
  let referenceCount = 0;

  for (const sourcePath of bicepFiles) {
    const source = await readFile(sourcePath, 'utf8');
    const moduleReferences = source.matchAll(
      /\bmodule\s+[A-Za-z_][A-Za-z0-9_]*\s+'([^']+\.bicep)'/g,
    );

    for (const match of moduleReferences) {
      referenceCount += 1;
      const modulePath = resolve(dirname(sourcePath), match[1]);
      const staysInsideInfra =
        modulePath === infraRoot || modulePath.startsWith(`${infraRoot}${sep}`);
      if (!staysInsideInfra) {
        missingModules.push(
          `${repositoryPath(sourcePath)} references a template outside infra/: ${match[1]}`,
        );
        continue;
      }

      try {
        await readFile(modulePath);
      } catch {
        missingModules.push(
          `${repositoryPath(sourcePath)} references missing ${repositoryPath(modulePath)}`,
        );
      }
    }
  }

  assert.ok(referenceCount > 0, 'expected at least one local Bicep module reference');
  assert.deepEqual(missingModules, []);
});

test('the incomplete substrate fleet deployment surface is absent', async () => {
  const mainTemplate = await readFile(resolve(infraRoot, 'main.bicep'), 'utf8');
  const retiredSymbols = [
    'deploySubstrateFleet',
    'substrateImageTag',
    'substrateApiKey',
    'maxWorkerReplicas',
    'minWorkerReplicas',
    'scaleOutQueueDepth',
    'apiServerEgressCidrs',
    'substrateWorkerExternalFqdn',
    'substrateNsg',
    'substrateFleet',
    'substrateInferenceFqdn',
    'substrateWorkerFqdn',
  ];

  for (const symbol of retiredSymbols) {
    assert.equal(
      mainTemplate.includes(symbol),
      false,
      `infra/main.bicep still exposes incomplete substrate symbol ${symbol}`,
    );
  }
});

test('the API image contract requires and propagates an immutable sha256 digest', async () => {
  const mainTemplate = await readFile(resolve(infraRoot, 'main.bicep'), 'utf8');
  const containerTemplate = await readFile(
    resolve(infraRoot, 'modules/containerapp.bicep'),
    'utf8',
  );
  const parameters = JSON.parse(await readFile(resolve(infraRoot, 'parameters.json'), 'utf8'));

  const requiredDigestParameter =
    /@minLength\(71\)\s+@maxLength\(71\)\s+param apiImageDigest string\s*(?:\r?\n|$)/;
  const requiredModuleDigestParameter =
    /@minLength\(71\)\s+@maxLength\(71\)\s+param imageDigest string\s*(?:\r?\n|$)/;

  assert.match(mainTemplate, requiredDigestParameter);
  assert.match(containerTemplate, requiredModuleDigestParameter);
  assert.match(
    mainTemplate,
    /assert apiImageDigestUsesSha256 = startsWith\(apiImageDigest, 'sha256:'\)/,
  );
  assert.match(
    containerTemplate,
    /assert imageDigestUsesSha256 = startsWith\(imageDigest, 'sha256:'\)/,
  );
  assert.match(mainTemplate, /imageDigest:\s*apiImageDigest/);
  assert.match(
    containerTemplate,
    /image:\s*'\$\{acrLoginServer\}\/\$\{imageName\}@\$\{imageDigest\}'/,
  );
  assert.equal(
    Object.hasOwn(parameters.parameters, 'apiImageDigest'),
    false,
    'the shared parameters file must not bake in a placeholder digest',
  );
});

test('infrastructure deployment sources contain no mutable container image tags', async () => {
  const deploymentFiles = [
    ...(await collectFiles(infraRoot, '.bicep')),
    resolve(infraRoot, 'parameters.json'),
  ];
  const violations = [];

  for (const filePath of deploymentFiles) {
    const source = await readFile(filePath, 'utf8');
    if (/\b(?:api|substrate)?ImageTag\b/i.test(source)) {
      violations.push(`${repositoryPath(filePath)} declares or uses an image tag parameter`);
    }
    if (/:latest(?:['"\s,}]|$)/i.test(source)) {
      violations.push(`${repositoryPath(filePath)} contains a latest image tag`);
    }

    if (filePath.endsWith('.bicep')) {
      for (const match of source.matchAll(/^\s*image:\s*(.+)$/gm)) {
        if (!/@\$\{[A-Za-z_][A-Za-z0-9_]*Digest\}/.test(match[1])) {
          violations.push(
            `${repositoryPath(filePath)} has a container image that is not digest-bound: ${match[1]}`,
          );
        }
      }
    }
  }

  assert.deepEqual(violations, []);
});
