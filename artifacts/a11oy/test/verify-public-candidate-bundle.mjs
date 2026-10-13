import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/public', import.meta.url));
assert.ok(existsSync(root), 'public candidate dist is missing');

const files = [];
const visit = (directory) => {
  for (const name of readdirSync(directory).sort()) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) visit(path);
    else files.push(path);
  }
};
visit(root);

const relativeFiles = files.map((path) => relative(root, path).replaceAll('\\', '/'));
assert.ok(relativeFiles.includes('index.html'), 'candidate index is missing');
assert.equal(
  relativeFiles.includes('opengraph.jpg'),
  false,
  'overclaiming social card was emitted',
);
for (const excludedChunk of [
  'AdversarialResilience',
  'AgentViz',
  'FrontierIntelligence',
  'HomePage',
  'VerifierAgent',
]) {
  assert.equal(
    relativeFiles.some((path) => path.includes(excludedChunk)),
    false,
    `excluded route chunk was emitted: ${excludedChunk}`,
  );
}

const text = files
  .filter((path) => ['.html', '.js', '.css', '.json'].includes(extname(path)))
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');

for (const forbidden of [
  '/api/graphql',
  'graphql-ws',
  '/api/omnia',
  '99.7%',
  '99.99%',
  '$2.1M',
  '$4.2B',
  '340 live vessels',
  'OpenAI',
  'Anthropic',
  'Palantir',
  'Datadog',
  'your unfair advantage',
  'Every outcome proven',
]) {
  assert.equal(
    text.includes(forbidden),
    false,
    `forbidden candidate content emitted: ${forbidden}`,
  );
}

assert.match(text, /A11oy is an active prototype/);
assert.match(text, /PUBLICATION HOLD/);
assert.match(text, /No page establishes production operation/);
assert.match(text, /no SIEM or EDR deployment occurs/);
process.stdout.write(`public candidate bundle contract passed: ${relativeFiles.length} files\n`);
