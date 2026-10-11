import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const app = read('../src/App.tsx');
const main = read('../src/main.tsx');
const routes = read('../src/candidateRoutes.ts');
const home = read('../src/pages/PublicCandidateHome.tsx');
const securityAgents = read('../src/pages/GovernedSecurityAgents.tsx');
const capture = read('../../../scripts/qa/capture-a11oy-candidate-evidence.mjs');

test('admits only the source-bound home and security fixture', () => {
  const reviewedPaths = [...routes.matchAll(/path: '([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(reviewedPaths, ['/', '/security-agents']);
  assert.match(app, /component=\{PublicCandidateHome\}/);
  assert.match(app, /component=\{GovernedSecurityAgents\}/);
  assert.match(app, /<Route component=\{PublicationHoldPage\} \/>/);
  for (const excluded of [
    'AgentViz',
    'AdversarialResilience',
    'FrontierIntelligence',
    'HomePage',
    'VerifierAgent',
  ]) {
    assert.doesNotMatch(app, new RegExp(`\\b${excluded}\\b`));
  }
});

test('keeps the public candidate source free of runtime clients and automatic API calls', () => {
  for (const [name, source] of [
    ['App', app],
    ['main', main],
    ['candidate home', home],
  ]) {
    assert.doesNotMatch(
      source,
      /GraphQLProvider|useAlloyDashboard|solutionsData|blueprint|fetch\s*\(|WebSocket|EventSource|XMLHttpRequest|sendBeacon|\/api\//,
      `${name} must remain network-free`,
    );
  }
  assert.doesNotMatch(main, /OmniaShellProvider/);
  assert.match(capture, /unexpectedSameOriginRequests/);
  assert.match(capture, /request\.method\(\) !== 'GET'/);
  assert.match(capture, /candidateBasePath}assets\//);
  assert.match(capture, /candidate attempted foreign requests/);
  assert.match(capture, /undeclared same-origin request/);
});

test('states the claim boundary locally and keeps fixture language honest', () => {
  assert.match(home, /A11oy is an active prototype/);
  assert.match(home, /makes no runtime API or external-service request/);
  assert.match(home, /production deployment or production readiness/);
  assert.match(home, /customer use, revenue, retention/);
  assert.match(home, /compliance certification or an audit opinion/);
  assert.match(home, /durable signed execution or cryptographic attestation/);
  assert.doesNotMatch(securityAgents, /Autonomous alert investigation/);
  assert.doesNotMatch(securityAgents, /deploys to SIEM\/EDR/);
  assert.match(securityAgents, /no SIEM or EDR deployment occurs/);
});

test('does not ship the overclaiming social card', () => {
  assert.equal(existsSync(new URL('../public/opengraph.jpg', import.meta.url)), false);
});
