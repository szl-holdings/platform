#!/usr/bin/env node

/**
 * Read-only verification of the six Series-A buyer-lane source contracts.
 * Run from any directory: node scripts/qa/verify-cross-lane-source.mjs
 * A verified result describes local source only. It never implies runtime readiness.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), '..', '..');

export const SOURCE_PATH = 'artifacts/a11oy/src/data/seriesASolutions.ts';
export const PINNED_SOURCE_SHA256 =
  '2b832f9b48547752e68f4d1ce74da1fab58f5ecbf4468b77099400e165495011';

const SCHEMA = 'szl.cross-lane.local-source-verification/v1';
const EXPECTED_LANES = [
  'cyber-security',
  'finance',
  'data-governance',
  'enterprise',
  'real-estate',
  'legal',
];
const EXPECTED_LOOP = [
  ['Observe', 'DEMO'],
  ['Gate', 'DEMO'],
  ['Act', 'BLOCKED'],
  ['Prove', 'DEMO'],
];

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function externalEvidence() {
  return {
    hostedCI: 'UNKNOWN',
    protectedMerge: 'UNKNOWN',
    providerPublication: 'UNKNOWN',
    deployment: 'UNKNOWN',
    outsideWitness: 'UNKNOWN',
  };
}

function unwrap(ts, expression) {
  let node = expression;
  while (node && (ts.isAsExpression(node) || ts.isSatisfiesExpression(node))) {
    node = node.expression;
  }
  return node;
}

function properties(ts, node, context) {
  if (!node || !ts.isObjectLiteralExpression(node)) {
    fail('CONTRACT_UNPARSEABLE', `${context} must be a literal object`);
  }
  const result = new Map();
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
      fail('CONTRACT_UNPARSEABLE', `${context} contains a computed or spread property`);
    }
    const name = property.name.text;
    if (result.has(name)) {
      fail('CONTRACT_UNPARSEABLE', `${context} repeats ${name}`);
    }
    result.set(name, property.initializer);
  }
  return result;
}

function stringValue(ts, node, context) {
  if (!node || !ts.isStringLiteral(node)) {
    fail('CONTRACT_UNPARSEABLE', `${context} must be a literal string`);
  }
  return node.text;
}

function declaration(ts, sourceFile, name) {
  const matches = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const entry of statement.declarationList.declarations) {
      if (ts.isIdentifier(entry.name) && entry.name.text === name) matches.push(entry);
    }
  }
  if (matches.length !== 1) {
    fail('CONTRACT_UNPARSEABLE', `expected one ${name} declaration`);
  }
  return matches[0];
}

function parseLoop(ts, sourceFile) {
  const matches = sourceFile.statements.filter(
    (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === 'loop',
  );
  if (matches.length !== 1 || matches[0].body?.statements.length !== 1) {
    fail('CONTRACT_UNPARSEABLE', 'expected one literal loop function');
  }
  const returnStatement = matches[0].body.statements[0];
  const expression = returnStatement.expression;
  if (
    !ts.isReturnStatement(returnStatement) ||
    !expression ||
    !ts.isArrayLiteralExpression(expression)
  ) {
    fail('CONTRACT_UNPARSEABLE', 'loop must return a literal array');
  }
  if (expression.elements.length !== EXPECTED_LOOP.length) {
    fail('CONTRACT_CHANGED', 'loop has a changed number of steps');
  }
  return expression.elements.map((step, index) => {
    const fields = properties(ts, step, `loop step ${index}`);
    const phase = stringValue(ts, fields.get('phase'), `loop step ${index} phase`);
    const state = stringValue(ts, fields.get('state'), `loop step ${index} state`);
    const [expectedPhase, expectedState] = EXPECTED_LOOP[index];
    if (phase !== expectedPhase || state !== expectedState) {
      fail('CONTRACT_CHANGED', `loop step ${index} differs from the declared demo gate`);
    }
    return { phase, state };
  });
}

export function parseLaneContract(sourceText) {
  if (typeof sourceText !== 'string' || sourceText.length === 0) {
    fail('SOURCE_MISSING', 'buyer-lane source is missing or empty');
  }
  let ts;
  try {
    ts = require('typescript');
  } catch {
    fail('PARSER_UNAVAILABLE', 'TypeScript parser is unavailable');
  }
  const sourceFile = ts.createSourceFile(
    SOURCE_PATH,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    fail('CONTRACT_UNPARSEABLE', 'buyer-lane source has TypeScript syntax errors');
  }
  const loop = parseLoop(ts, sourceFile);
  const solutionArray = unwrap(ts, declaration(ts, sourceFile, 'SERIES_A_SOLUTIONS').initializer);
  if (!solutionArray || !ts.isArrayLiteralExpression(solutionArray)) {
    fail('CONTRACT_UNPARSEABLE', 'SERIES_A_SOLUTIONS must be a literal array');
  }
  if (solutionArray.elements.length !== EXPECTED_LANES.length) {
    fail('CONTRACT_CHANGED', 'the six buyer-lane declarations are incomplete');
  }

  const lanes = solutionArray.elements.map((element, index) => {
    const fields = properties(ts, element, `buyer lane ${index}`);
    const id = stringValue(ts, fields.get('id'), `buyer lane ${index} id`);
    const sourceState = stringValue(ts, fields.get('sourceState'), `${id} sourceState`);
    const scenarioState = stringValue(ts, fields.get('scenarioState'), `${id} scenarioState`);
    const liveState = stringValue(ts, fields.get('liveState'), `${id} liveState`);
    const loopCall = fields.get('loop');
    if (
      !loopCall ||
      !ts.isCallExpression(loopCall) ||
      !ts.isIdentifier(loopCall.expression) ||
      loopCall.expression.text !== 'loop' ||
      loopCall.arguments.length !== EXPECTED_LOOP.length ||
      loopCall.arguments.some((argument) => !ts.isStringLiteral(argument))
    ) {
      fail('CONTRACT_UNPARSEABLE', `${id} must use the four-step literal loop`);
    }
    if (
      id !== EXPECTED_LANES[index] ||
      sourceState !== 'DEMO' ||
      scenarioState !== 'DEMO' ||
      liveState !== 'UNAVAILABLE'
    ) {
      fail('CONTRACT_CHANGED', `buyer lane ${index} differs from the declared source state`);
    }
    return {
      id,
      sourceState,
      scenarioState,
      liveState,
      actionState: loop[2].state,
      externalEvidence: externalEvidence(),
    };
  });
  return lanes;
}

export function verifySnapshot({ gitHead, workingSource, committedSource }) {
  if (!/^[0-9a-f]{40}$/.test(gitHead ?? '')) {
    fail('GIT_HEAD_UNAVAILABLE', 'an exact 40-character Git HEAD is required');
  }
  if (!Buffer.isBuffer(workingSource) || workingSource.length === 0) {
    fail('SOURCE_MISSING', 'buyer-lane source is missing or empty');
  }
  if (!Buffer.isBuffer(committedSource) || committedSource.length === 0) {
    fail('COMMITTED_SOURCE_MISSING', 'buyer-lane source is unavailable at Git HEAD');
  }
  if (!workingSource.equals(committedSource)) {
    fail('SOURCE_NOT_AT_HEAD', 'working source differs from the Git HEAD blob');
  }
  const sourceDigest = sha256(workingSource);
  if (sourceDigest !== PINNED_SOURCE_SHA256) {
    fail('SOURCE_DIGEST_CHANGED', 'buyer-lane source differs from the reviewed contract digest');
  }
  return {
    schema: SCHEMA,
    verification: 'VERIFIED_LOCAL_SOURCE',
    runtimeReadiness: 'UNKNOWN',
    source: {
      repository: 'szl-holdings/platform',
      gitHead,
      path: SOURCE_PATH,
      sha256: sourceDigest,
    },
    lanes: parseLaneContract(workingSource.toString('utf8')),
  };
}

function gitOutput(args) {
  try {
    return execFileSync('git', ['-C', repositoryRoot, ...args], {
      encoding: 'buffer',
      maxBuffer: 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    fail('GIT_UNAVAILABLE', 'unable to read the local Git source identity');
  }
}

export function readCommittedSourceAtObservedHead(readGit = gitOutput) {
  const gitHead = readGit(['rev-parse', '--verify', 'HEAD']).toString('utf8').trim();
  if (!/^[0-9a-f]{40}$/.test(gitHead)) {
    fail('GIT_HEAD_UNAVAILABLE', 'an exact 40-character Git HEAD is required');
  }
  // Resolve through this immutable revision; HEAD may move before the next read.
  return { gitHead, committedSource: readGit(['show', `${gitHead}:${SOURCE_PATH}`]) };
}

function runCli() {
  let gitHead = null;
  let sourceDigest = null;
  try {
    if (process.argv.length !== 2) {
      fail('INVALID_ARGUMENTS', 'run without arguments from any directory');
    }
    const observed = readCommittedSourceAtObservedHead();
    gitHead = observed.gitHead;
    let workingSource;
    try {
      workingSource = readFileSync(path.join(repositoryRoot, SOURCE_PATH));
    } catch {
      fail('SOURCE_MISSING', 'buyer-lane source file is unavailable');
    }
    sourceDigest = sha256(workingSource);
    process.stdout.write(
      `${JSON.stringify(verifySnapshot({ gitHead, workingSource, committedSource: observed.committedSource }), null, 2)}\n`,
    );
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify(
        {
          schema: SCHEMA,
          verification: 'FAILED_CLOSED',
          runtimeReadiness: 'UNKNOWN',
          source: {
            repository: 'szl-holdings/platform',
            gitHead,
            path: SOURCE_PATH,
            sha256: sourceDigest,
          },
          lanes: [],
          externalEvidence: externalEvidence(),
          error: {
            code: error?.code ?? 'VERIFICATION_FAILED',
            message: error?.message ?? 'local source verification failed',
          },
        },
        null,
        2,
      )}\n`,
    );
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli();
}
