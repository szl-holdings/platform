import assert from 'node:assert/strict';
import test from 'node:test';

import {
  A11OY_PORT,
  API_PORT,
  CANONICAL_FALLBACK_PORT,
  isAtelierApiPath,
  isTrustedLocalBridgeRequest,
  resolveSharedProxyConfig,
  SHARED_PROXY_A11OY_PORT_ENV,
  SHARED_PROXY_API_PORT_ENV,
  SHARED_PROXY_BIND_HOST_ENV,
  SHARED_PROXY_LOCAL_API_KEY_BRIDGE_ENV,
  SHARED_PROXY_LOCAL_TENANT_ID_ENV,
  SHARED_PROXY_PORT,
  SHARED_PROXY_PORT_ENV,
  sharedProxyPlugin,
} from './index.ts';

test('uses the canonical listener and A11oy/API upstream defaults', () => {
  const config = resolveSharedProxyConfig({});

  assert.equal(config.listenPort, SHARED_PROXY_PORT);
  assert.equal(config.a11oyPort, A11OY_PORT);
  assert.equal(config.apiPort, API_PORT);
  assert.equal(config.bindHost, '0.0.0.0');
  assert.equal(config.localApiKeyBridge, false);
  assert.equal(config.localTenantId, undefined);
  assert.equal(config.routes.find((route) => route.prefix === '/a11oy/')?.port, A11OY_PORT);
  assert.equal(config.routes.find((route) => route.prefix === '/api/')?.port, API_PORT);
  assert.equal(config.routes.find((route) => route.prefix === '/ws/')?.port, API_PORT);
});

test('applies all three namespaced runtime port overrides', () => {
  const config = resolveSharedProxyConfig({
    [SHARED_PROXY_PORT_ENV]: '19090',
    [SHARED_PROXY_A11OY_PORT_ENV]: '14110',
    [SHARED_PROXY_API_PORT_ENV]: '18080',
  });

  assert.equal(config.listenPort, 19090);
  assert.equal(config.a11oyPort, 14110);
  assert.equal(config.apiPort, 18080);
  assert.equal(config.routes.find((route) => route.prefix === '/a11oy/')?.port, 14110);
  assert.equal(config.routes.find((route) => route.prefix === '/api/')?.port, 18080);
  assert.equal(config.routes.find((route) => route.prefix === '/ws/')?.port, 18080);
});

for (const variableName of [
  SHARED_PROXY_PORT_ENV,
  SHARED_PROXY_A11OY_PORT_ENV,
  SHARED_PROXY_API_PORT_ENV,
]) {
  for (const invalidValue of [
    '',
    '0',
    '-1',
    '+9090',
    '09090',
    '9090.5',
    '1e4',
    '65536',
    ' 9090',
    '9090 ',
    'abc',
  ]) {
    test(`rejects malformed ${variableName}=${JSON.stringify(invalidValue)}`, () => {
      assert.throws(
        () => resolveSharedProxyConfig({ [variableName]: invalidValue }),
        new RegExp(`Invalid ${variableName}=`),
      );
    });
  }
}

test('rejects a privileged listener port before server creation', () => {
  assert.throws(
    () => resolveSharedProxyConfig({ [SHARED_PROXY_PORT_ENV]: '80' }),
    /expected an integer from 1024 to 65535/,
  );
});

test('allows a valid privileged upstream port', () => {
  const config = resolveSharedProxyConfig({ [SHARED_PROXY_API_PORT_ENV]: '80' });
  assert.equal(config.apiPort, 80);
});

test('accepts the inclusive listener and upstream port boundaries', () => {
  assert.equal(resolveSharedProxyConfig({ [SHARED_PROXY_PORT_ENV]: '1024' }).listenPort, 1024);
  assert.equal(resolveSharedProxyConfig({ [SHARED_PROXY_API_PORT_ENV]: '65535' }).apiPort, 65535);
});

test('rejects listener collisions with overridden API and A11oy upstreams', () => {
  assert.throws(
    () =>
      resolveSharedProxyConfig({
        [SHARED_PROXY_PORT_ENV]: '19090',
        [SHARED_PROXY_API_PORT_ENV]: '19090',
      }),
    /listener collides with upstream \/api\/, \/ws\//,
  );
  assert.throws(
    () =>
      resolveSharedProxyConfig({
        [SHARED_PROXY_PORT_ENV]: '19090',
        [SHARED_PROXY_A11OY_PORT_ENV]: '19090',
      }),
    /listener collides with upstream \/a11oy\//,
  );
});

test('rejects listener collisions with fixed and fallback upstreams', () => {
  assert.throws(
    () => resolveSharedProxyConfig({ [SHARED_PROXY_PORT_ENV]: '8098' }),
    /listener collides with upstream \/carlota-jo\//,
  );
  assert.throws(
    () =>
      resolveSharedProxyConfig({
        [SHARED_PROXY_PORT_ENV]: String(CANONICAL_FALLBACK_PORT),
      }),
    /listener collides with upstream \/ \(fallback\)/,
  );
});

test('permits API and A11oy to share one intentional upstream', () => {
  const config = resolveSharedProxyConfig({
    [SHARED_PROXY_API_PORT_ENV]: '18080',
    [SHARED_PROXY_A11OY_PORT_ENV]: '18080',
  });

  assert.equal(config.apiPort, config.a11oyPort);
});

test('returns an isolated route table for each resolved configuration', () => {
  const first = resolveSharedProxyConfig({ [SHARED_PROXY_API_PORT_ENV]: '18080' });
  const second = resolveSharedProxyConfig({ [SHARED_PROXY_API_PORT_ENV]: '18081' });

  assert.notStrictEqual(first.routes, second.routes);
  assert.equal(first.routes.find((route) => route.prefix === '/api/')?.port, 18080);
  assert.equal(second.routes.find((route) => route.prefix === '/api/')?.port, 18081);
});

test('sharedProxyPlugin fails closed synchronously on invalid configuration', () => {
  assert.throws(
    () => sharedProxyPlugin({ [SHARED_PROXY_PORT_ENV]: 'not-a-port' }),
    /Invalid SHARED_PROXY_PORT=/,
  );
});

test('sharedProxyPlugin preserves its Vite plugin contract with valid overrides', () => {
  const plugin = sharedProxyPlugin({
    [SHARED_PROXY_PORT_ENV]: '19090',
    [SHARED_PROXY_A11OY_PORT_ENV]: '14110',
    [SHARED_PROXY_API_PORT_ENV]: '18080',
  });

  assert.equal(plugin.name, 'shared-proxy');
  assert.equal(plugin.apply, 'serve');
  assert.equal(typeof plugin.configureServer, 'function');
});

test('enables a server-side API key bridge only on an explicit loopback listener', () => {
  const config = resolveSharedProxyConfig({
    [SHARED_PROXY_BIND_HOST_ENV]: '127.0.0.1',
    [SHARED_PROXY_LOCAL_API_KEY_BRIDGE_ENV]: 'true',
    [SHARED_PROXY_LOCAL_TENANT_ID_ENV]: 'solo-builder',
    ALLOY_API_KEY: 'test-local-key',
  });

  assert.equal(config.bindHost, '127.0.0.1');
  assert.equal(config.localApiKeyBridge, true);
  assert.equal(config.localTenantId, 'solo-builder');
  assert.equal('apiKey' in config, false);
});

test('rejects a local API key bridge on a non-loopback listener', () => {
  assert.throws(
    () =>
      resolveSharedProxyConfig({
        [SHARED_PROXY_LOCAL_API_KEY_BRIDGE_ENV]: 'true',
        [SHARED_PROXY_LOCAL_TENANT_ID_ENV]: 'solo-builder',
        ALLOY_API_KEY: 'test-local-key',
      }),
    /requires SHARED_PROXY_BIND_HOST=127\.0\.0\.1 or ::1/,
  );
});

test('rejects a local API key bridge without a usable server-side key', () => {
  assert.throws(
    () =>
      resolveSharedProxyConfig({
        [SHARED_PROXY_BIND_HOST_ENV]: '::1',
        [SHARED_PROXY_LOCAL_API_KEY_BRIDGE_ENV]: 'yes',
        [SHARED_PROXY_LOCAL_TENANT_ID_ENV]: 'solo-builder',
      }),
    /requires a non-empty, trimmed ALLOY_API_KEY/,
  );
});

test('rejects a local API key bridge without a fixed tenant', () => {
  assert.throws(
    () =>
      resolveSharedProxyConfig({
        [SHARED_PROXY_BIND_HOST_ENV]: '127.0.0.1',
        [SHARED_PROXY_LOCAL_API_KEY_BRIDGE_ENV]: 'true',
        ALLOY_API_KEY: 'test-local-key',
      }),
    /requires a non-empty, trimmed SHARED_PROXY_LOCAL_TENANT_ID/,
  );
});

test('local API key bridge trusts only its loopback host and same origin', () => {
  assert.equal(isTrustedLocalBridgeRequest('127.0.0.1:19090', undefined, 19090), true);
  assert.equal(
    isTrustedLocalBridgeRequest('127.0.0.1:19090', 'http://127.0.0.1:19090', 19090),
    true,
  );
  assert.equal(
    isTrustedLocalBridgeRequest('localhost:19090', 'http://localhost:19090', 19090),
    true,
  );
  assert.equal(isTrustedLocalBridgeRequest('[::1]:19090', 'http://[::1]:19090', 19090), true);
  assert.equal(isTrustedLocalBridgeRequest('attacker.test:19090', undefined, 19090), false);
  assert.equal(
    isTrustedLocalBridgeRequest('127.0.0.1:19090', 'https://attacker.test', 19090),
    false,
  );
  assert.equal(
    isTrustedLocalBridgeRequest('127.0.0.1:19090', 'http://localhost:19090', 19090),
    false,
  );
  assert.equal(
    isTrustedLocalBridgeRequest('127.0.0.1:19090', 'http://127.0.0.1:19090/path', 19090),
    false,
  );
});

test('local API key bridge is scoped to Atelier API paths', () => {
  assert.equal(isAtelierApiPath('/api/a11oy/v1/atelier/ask'), true);
  assert.equal(isAtelierApiPath('/api/a11oy/v1/atelier/health?verbose=true'), true);
  assert.equal(isAtelierApiPath('/api/a11oy/v1/atelier-other/ask'), false);
  assert.equal(isAtelierApiPath('/api/other/ask'), false);
});

test('rejects malformed shared-proxy host and bridge settings', () => {
  assert.throws(
    () => resolveSharedProxyConfig({ [SHARED_PROXY_BIND_HOST_ENV]: 'localhost' }),
    /Invalid SHARED_PROXY_BIND_HOST=/,
  );
  assert.throws(
    () => resolveSharedProxyConfig({ [SHARED_PROXY_LOCAL_API_KEY_BRIDGE_ENV]: 'enabled' }),
    /Invalid SHARED_PROXY_LOCAL_API_KEY_BRIDGE=/,
  );
});
