import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { resolve, relative, isAbsolute } from 'node:path';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

// Test-only isolation: source is evaluated with no network, credentials, real
// provider client, database or tool implementation. Unexpected imports fail.
export async function loadAiSource(root, entry) {
  const context = createContext({});
  const cache = new Map();
  const allowed = new Set([
    'lib/ai-engine/src/providers/anthropic/chat-with-tools.ts',
    'lib/ai-engine/src/domain-agent-runner.ts',
    'lib/ai-engine/src/tool-message-history.ts',
  ]);
  const deniedImports = [];
  const fail = () => { throw new Error('Real provider execution is disabled in offline tests'); };
  function mock(exports) {
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
  }
  async function load(file) {
    const path = relative(resolve(root), file);
    if (!allowed.has(path) || isAbsolute(path)) throw new Error(`Unexpected source: ${path}`);
    if (cache.has(file)) return cache.get(file);
    const source = await readFile(file, 'utf8');
    const module = new SourceTextModule(stripTypeScriptTypes(source, { mode: 'transform' }), {
      identifier: file,
      context,
      importModuleDynamically(specifier) {
        deniedImports.push(specifier);
        throw new Error(`External import disabled: ${specifier}`);
      },
    });
    cache.set(file, module);
    await module.link(async (specifier, parent) => {
      if (specifier === '@anthropic-ai/sdk') return mock({ default: class {} });
      if (specifier === './client.js' && path.endsWith('/anthropic/chat-with-tools.ts')) {
        return mock({ anthropic: { messages: { create: fail, stream: fail } } });
      }
      if (specifier.endsWith('/tool-message-history.js')) {
        return load(resolve(parent.identifier, '..', specifier.replace(/\.js$/, '.ts')));
      }
      throw new Error(`Unexpected dependency: ${specifier}`);
    });
    return module;
  }
  const module = await load(resolve(root, entry));
  await module.evaluate();
  return { exports: module.namespace, deniedImports };
}
