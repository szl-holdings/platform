import assert from 'node:assert/strict';
import test from 'node:test';
import { stringify } from 'yaml';
import { SECURE_OVERRIDES, validateRetiredSigningGraph } from './check-retired-signing-graph.mjs';

function fixture() {
  const overrides = { ...SECURE_OVERRIDES, braces: 'link:packages/braces-safe' };
  const packages = {};
  const snapshots = {};
  for (const [name, policy] of Object.entries(SECURE_OVERRIDES)) {
    const version = /\d+\.\d+\.\d+/.exec(policy)[0];
    packages[`${name}@${version}`] = { resolution: { integrity: 'fixture-only' } };
    snapshots[`${name}@${version}`] = {};
  }
  return {
    workspace: { packages: ['apps/*', 'lib/*', 'packages/*'], overrides },
    lock: {
      lockfileVersion: '9.0',
      settings: { autoInstallPeers: false },
      overrides: { ...overrides },
      importers: { '.': {}, 'lib/mobile-shared': {}, 'packages/braces-safe': {} },
      packages,
      snapshots,
    },
    manifests: [
      { path: 'package.json', value: { name: 'workspace' } },
      { path: 'lib/mobile-shared/package.json', value: { name: '@workspace/mobile-shared' } },
      {
        path: 'packages/braces-safe/package.json',
        value: { name: '@szl-holdings/braces-safe', version: '0.2.0', private: true },
      },
    ],
  };
}
function inputs(f) {
  return {
    workspaceText: stringify(f.workspace),
    lockText: stringify(f.lock),
    manifests: f.manifests.map(({ path, value }) => ({ path, text: JSON.stringify(value) })),
  };
}
function blocked(mutator, pattern) {
  const f = fixture();
  mutator(f);
  assert.throws(() => validateRetiredSigningGraph(inputs(f)), pattern);
}

test('source/lock fixture passes without claiming scanner or installed compatibility', () => {
  assert.deepEqual(validateRetiredSigningGraph(inputs(fixture())), {
    evidenceClass: 'MEASURED',
    manifestCount: 3,
    retirementContract: 'PASS',
    lockedPolicyFamilies: Object.keys(SECURE_OVERRIDES),
    policyOnlyFamilies: [],
    vulnerabilityScan: 'NOT_RUN',
    installedCompatibility: 'NOT_RUN',
  });
});

for (const retired of ['node-forge', '@expo/cli', '@expo/code-signing-certificates']) {
  test(`rejects declared retired package identity ${retired}`, () =>
    blocked((f) => {
      f.manifests[1].value.name = retired;
    }, /retired/));
  for (const group of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
  ]) {
    test(`rejects ${retired} manifest ${group}`, () =>
      blocked((f) => {
        f.manifests[1].value[group] = { [retired]: '^1.0.0' };
      }, /retired/));
  }
  for (const graph of ['packages', 'snapshots']) {
    test(`rejects ${retired} ${graph} node`, () =>
      blocked((f) => {
        f.lock[graph][`${retired}@1.0.0`] = {};
      }, /retired/));
    test(`rejects aliased ${retired} ${graph} edge`, () =>
      blocked((f) => {
        f.lock[graph]['fixture@1.0.0'] = { dependencies: { renamed: `npm:${retired}@1.0.0` } };
      }, /retired/));
  }
  test(`rejects ${retired} importer edge`, () =>
    blocked((f) => {
      f.lock.importers['.'].dependencies = { [retired]: { specifier: '^1.0.0', version: '1.0.0' } };
    }, /retired/));
  test(`rejects aliased ${retired} manifest declaration`, () =>
    blocked((f) => {
      f.manifests[0].value.dependencies = { renamed: `npm:${retired}@1.0.0` };
    }, /retired/));
}

test('rejects malformed declared package identities without requiring names on templates', () => {
  for (const name of [null, 1, [], {}, '', ' ', ' workspace', 'workspace ']) {
    blocked((f) => {
      f.manifests[1].value.name = name;
    }, /nonempty package name string/);
  }
  const f = fixture();
  delete f.manifests[1].value.name;
  assert.equal(validateRetiredSigningGraph(inputs(f)).retirementContract, 'PASS');
});

test('allows historical retired-package mentions in descriptive metadata only', () => {
  const f = fixture();
  f.manifests[1].value.description = 'Retires node-forge and @expo/cli; historical source only.';
  assert.equal(validateRetiredSigningGraph(inputs(f)).retirementContract, 'PASS');
});

for (const place of ['workspace', 'lock', 'manifest']) {
  test(`rejects retired forge patch at ${place}`, () =>
    blocked((f) => {
      const patchedDependencies = { 'node-forge@1.4.0': 'patches/node-forge@1.4.0.patch' };
      if (place === 'manifest') f.manifests[0].value.pnpm = { patchedDependencies };
      else f[place].patchedDependencies = patchedDependencies;
    }, /retired/));
}

for (const name of Object.keys(SECURE_OVERRIDES)) {
  for (const source of ['workspace', 'lock']) {
    test(`rejects missing or changed ${name} override in ${source}`, () => {
      blocked((f) => {
        delete f[source].overrides[name];
      }, /canonical override/);
      blocked((f) => {
        f[source].overrides[name] = '0.0.1';
      }, /canonical override/);
    });
  }
  for (const graph of ['packages', 'snapshots']) {
    test(`rejects downgraded ${name} ${graph} resolution`, () =>
      blocked((f) => {
        f.lock[graph][`${name}@0.0.1`] = {};
      }, /secure policy/));
  }
  test(`rejects downgraded ${name} importer resolution`, () =>
    blocked((f) => {
      f.lock.importers['.'].dependencies = {
        [name]: { specifier: SECURE_OVERRIDES[name], version: '0.0.1' },
      };
    }, /secure policy/));
  test(`rejects downgraded ${name} snapshot edge despite correct node and overrides`, () =>
    blocked((f) => {
      f.lock.snapshots['fixture@1.0.0'] = { dependencies: { [name]: '0.0.1' } };
    }, /secure policy/));
}

test('rejects an out-of-policy undici major', () =>
  blocked((f) => {
    f.lock.packages['undici@7.0.0'] = {};
  }, /secure policy/));
test('rejects an edge with no actual package node', () =>
  blocked((f) => {
    delete f.lock.packages['tar@7.5.21'];
    delete f.lock.snapshots['tar@7.5.21'];
    f.lock.importers['.'].dependencies = { tar: { specifier: '7.5.21', version: '7.5.21' } };
  }, /no actual locked node/));
test('reports an unused retained override as policy-only, not installed evidence', () => {
  const f = fixture();
  delete f.lock.packages['undici@6.28.1'];
  delete f.lock.snapshots['undici@6.28.1'];
  assert.deepEqual(validateRetiredSigningGraph(inputs(f)).policyOnlyFamilies, ['undici']);
});

for (const source of ['workspace', 'lock']) {
  test(`rejects missing/registry braces mapping in ${source}`, () => {
    blocked((f) => {
      delete f[source].overrides.braces;
    }, /braces must resolve/);
    blocked((f) => {
      f[source].overrides.braces = '3.0.3';
    }, /braces must resolve/);
  });
}
test('rejects registry braces nodes and non-maintained edges', () => {
  blocked((f) => {
    f.lock.packages['braces@3.0.3'] = {};
  }, /registry braces/);
  blocked((f) => {
    f.lock.snapshots['fixture@1.0.0'] = { dependencies: { braces: '3.0.3' } };
  }, /non-maintained/);
});
for (const group of [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
]) {
  test(`rejects registry or misdirected importer braces ${group}`, () => {
    for (const version of ['3.0.3', 'link:packages/other', 'link:../../outside']) {
      blocked((f) => {
        f.lock.importers['.'][group] = { braces: { specifier: '^3.0.3', version } };
      }, /must link to the maintained/);
    }
  });
}
test('accepts canonical importer-relative local braces links', () => {
  const f = fixture();
  f.lock.importers['.'].dependencies = {
    braces: { specifier: '^3.0.3', version: 'link:packages/braces-safe' },
  };
  f.lock.importers['lib/mobile-shared'].devDependencies = {
    braces: { specifier: '^3.0.3', version: 'link:../../packages/braces-safe' },
  };
  assert.equal(validateRetiredSigningGraph(inputs(f)).retirementContract, 'PASS');
});
test('rejects wrong or nonprivate local braces package identity', () => {
  blocked((f) => {
    f.manifests[2].value.name = 'braces';
  }, /canonical.*closure/);
  blocked((f) => {
    f.manifests[2].value.private = false;
  }, /canonical.*closure/);
});

test('rejects an absent or superseded maintained braces package version', () => {
  blocked((f) => {
    delete f.manifests[2].value.version;
  }, /canonical.*closure/);
  blocked((f) => {
    f.manifests[2].value.version = '0.1.0';
  }, /canonical.*closure/);
});

for (const section of ['settings', 'importers', 'packages', 'snapshots', 'overrides']) {
  test(`rejects missing/malformed lock ${section}`, () => {
    blocked((f) => {
      delete f.lock[section];
    }, /mapping/);
    blocked((f) => {
      f.lock[section] = [];
    }, /mapping/);
  });
}
test('rejects empty package/snapshot graphs, unsupported version and malformed edges', () => {
  blocked((f) => {
    f.lock.packages = {};
  }, /nonempty/);
  blocked((f) => {
    f.lock.snapshots = {};
  }, /nonempty/);
  blocked((f) => {
    f.lock.lockfileVersion = '8.0';
  }, /unsupported lockfile/);
  blocked((f) => {
    f.lock.importers['.'].dependencies = { fixture: { specifier: '1.0.0' } };
  }, /invalid dependency edge/);
  blocked((f) => {
    f.lock.snapshots['fixture@1.0.0'] = { dependencies: { fixture: {} } };
  }, /invalid edge/);
});
test('rejects absent/duplicate/malformed manifest inventory', () => {
  blocked((f) => {
    f.manifests = [];
  }, /manifests missing/);
  blocked((f) => {
    f.manifests.push(f.manifests[0]);
  }, /duplicated/);
  blocked((f) => {
    f.manifests[0].value.dependencies = [];
  }, /mapping/);
  blocked((f) => {
    f.manifests[0].value.dependencies = { fixture: 1 };
  }, /non-string/);
});
for (const field of ['workspaceText', 'lockText']) {
  for (const [label, text] of [
    ['syntax', '['],
    ['duplicate', 'a: 1\na: 2\n'],
    ['alias', 'a: &a 1\nb: *a\n'],
    ['tag', 'a: !unknown value\n'],
    ['shape', '[]'],
    ['empty', ''],
  ]) {
    test(`rejects ${field} ${label}`, () => {
      const value = inputs(fixture());
      value[field] = text;
      assert.throws(() => validateRetiredSigningGraph(value));
    });
  }
}
test('rejects invalid and duplicate-key JSON manifest source', () => {
  for (const text of ['{', '{"name":"a","name":"b"}']) {
    const value = inputs(fixture());
    value.manifests[0].text = text;
    assert.throws(() => validateRetiredSigningGraph(value));
  }
});
