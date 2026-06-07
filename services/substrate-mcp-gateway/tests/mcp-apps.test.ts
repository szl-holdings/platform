/**
 * MCP Apps — Integration Tests
 *
 * Verifies:
 *   1. All five ui:// resources are registered and return valid HTML
 *   2. Tool descriptors include correct _meta.ui references
 *   3. The postMessage bridge pattern is present in each HTML bundle
 *   4. CSP directives are set on each app
 *   5. Approval app declares tools/call permission
 *   6. handleResourceRead returns HTML content for ui:// URIs
 *   7. getMcpApp lookup works correctly
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { handleResourceRead } from '../src/handlers.js';
import { getMcpApp, MCP_APP_REGISTRY, TOOL_UI_MAP } from '../src/mcp-apps/apps.js';
import { SUBSTRATE_TOOLS, UI_RESOURCES } from '../src/descriptor.js';

// ─── App Registry Tests ────────────────────────────────────────────────────────

describe('MCP App Registry', () => {
  it('registers exactly five apps', () => {
    assert.equal(MCP_APP_REGISTRY.length, 5);
  });

  it('all apps have valid ui:// URIs', () => {
    for (const app of MCP_APP_REGISTRY) {
      assert.ok(
        app.uri.startsWith('ui://szl/'),
        `Expected ui://szl/ prefix, got: ${app.uri}`,
      );
    }
  });

  it('all apps have mimeType text/html', () => {
    for (const app of MCP_APP_REGISTRY) {
      assert.equal(app.mimeType, 'text/html');
    }
  });

  it('all apps include the postMessage bridge', () => {
    for (const app of MCP_APP_REGISTRY) {
      assert.ok(
        app.html.includes('mcp/callTool') && app.html.includes('parent.postMessage'),
        `App ${app.uri} is missing postMessage bridge code`,
      );
    }
  });

  it('all apps declare mcp/ready on load', () => {
    for (const app of MCP_APP_REGISTRY) {
      assert.ok(
        app.html.includes('mcp/ready'),
        `App ${app.uri} does not call mcp/ready`,
      );
    }
  });

  it('all apps handle mcp/initialize via __onMcpInit', () => {
    for (const app of MCP_APP_REGISTRY) {
      assert.ok(
        app.html.includes('__onMcpInit') || app.html.includes('mcp/initialize'),
        `App ${app.uri} does not handle mcp/initialize`,
      );
    }
  });

  it('all apps have a CSP directive', () => {
    for (const app of MCP_APP_REGISTRY) {
      assert.ok(
        app.csp && app.csp.includes("default-src 'none'"),
        `App ${app.uri} has weak or missing CSP`,
      );
    }
  });

  it('approval-form app declares tools/call permission', () => {
    const app = getMcpApp('ui://szl/approval-form');
    assert.ok(app, 'Approval form app not found');
    assert.ok(
      Array.isArray(app.permissions) && app.permissions.includes('tools/call'),
      'Approval form must declare tools/call permission',
    );
  });

  it('approval app calls substrate_approve and substrate_reject', () => {
    const app = getMcpApp('ui://szl/approval-form');
    assert.ok(app, 'Approval form app not found');
    assert.ok(app.html.includes('substrate_approve'), 'Missing substrate_approve call');
    assert.ok(app.html.includes('substrate_reject'), 'Missing substrate_reject call');
  });

  it('data-table app has CSV export functionality', () => {
    const app = getMcpApp('ui://szl/data-table');
    assert.ok(app, 'Data table app not found');
    assert.ok(app.html.includes('exportCsv'), 'Missing CSV export function');
    assert.ok(app.html.includes('data:text/csv'), 'Missing CSV data URL generation');
  });

  it('data-table app has sorting and filtering', () => {
    const app = getMcpApp('ui://szl/data-table');
    assert.ok(app, 'Data table app not found');
    assert.ok(app.html.includes('sortBy'), 'Missing sort function');
    assert.ok(app.html.includes('applyFilter'), 'Missing filter function');
  });

  it('chart app supports all six chart types', () => {
    const app = getMcpApp('ui://szl/chart');
    assert.ok(app, 'Chart app not found');
    for (const t of ['bar', 'line', 'area', 'pie', 'donut', 'scatter']) {
      assert.ok(app.html.includes(`'${t}'`), `Chart app missing support for type: ${t}`);
    }
  });

  it('timeline app supports severity filtering', () => {
    const app = getMcpApp('ui://szl/timeline');
    assert.ok(app, 'Timeline app not found');
    assert.ok(app.html.includes('filterSev'), 'Missing severity filter function');
    for (const sev of ['critical', 'warning', 'info', 'success']) {
      assert.ok(app.html.includes(sev), `Timeline missing severity: ${sev}`);
    }
  });

  it('metrics app renders severity-coded cards', () => {
    const app = getMcpApp('ui://szl/metrics');
    assert.ok(app, 'Metrics app not found');
    assert.ok(app.html.includes('success'), 'Missing success severity card');
    assert.ok(app.html.includes('warning'), 'Missing warning severity card');
    assert.ok(app.html.includes('danger'), 'Missing danger severity card');
  });

  it('getMcpApp returns undefined for unknown URIs', () => {
    const app = getMcpApp('ui://szl/nonexistent');
    assert.equal(app, undefined);
  });

  it('getMcpApp returns undefined for non-ui:// URIs', () => {
    assert.equal(getMcpApp('substrate://schema/run'), undefined);
    assert.equal(getMcpApp('https://example.com'), undefined);
  });
});

// ─── Resource Handler Tests ────────────────────────────────────────────────────

describe('handleResourceRead — ui:// resources', () => {
  const UI_URIS = [
    'ui://szl/data-table',
    'ui://szl/chart',
    'ui://szl/approval-form',
    'ui://szl/metrics',
    'ui://szl/timeline',
  ];

  for (const uri of UI_URIS) {
    it(`returns HTML content for ${uri}`, async () => {
      const result = await handleResourceRead(uri);
      assert.ok(result && typeof result === 'object', 'Expected object result');
      assert.ok(!('error' in result), `Expected no error for ${uri}, got: ${JSON.stringify(result)}`);
      const r = result as { contents: Array<{ uri: string; mimeType: string; text: string }> };
      assert.ok(Array.isArray(r.contents), 'Expected contents array');
      assert.equal(r.contents.length, 1);
      const content = r.contents[0];
      assert.ok(content, 'Expected content item');
      assert.equal(content.mimeType, 'text/html');
      assert.ok(typeof content.text === 'string' && content.text.length > 100, 'Expected non-trivial HTML string');
      assert.ok(content.text.includes('<!DOCTYPE html>'), 'Expected HTML document');
    });
  }

  it('returns error for unknown uri:// resource', async () => {
    const result = await handleResourceRead('ui://szl/nonexistent');
    assert.ok(result && typeof result === 'object', 'Expected object');
    assert.ok('error' in result, 'Expected error for unknown UI resource');
  });
});

// ─── Descriptor Tests ──────────────────────────────────────────────────────────

describe('SUBSTRATE_TOOLS _meta.ui wiring', () => {
  const UI_WIRED_TOOLS = [
    { name: 'substrate_submit_run', expectedUri: 'ui://szl/metrics' },
    { name: 'substrate_get_run', expectedUri: 'ui://szl/timeline' },
    { name: 'substrate_counterfactual', expectedUri: 'ui://szl/chart' },
    { name: 'substrate_list_approvals', expectedUri: 'ui://szl/approval-form' },
    { name: 'substrate_list_workflows', expectedUri: 'ui://szl/data-table' },
  ];

  for (const { name, expectedUri } of UI_WIRED_TOOLS) {
    it(`${name} has _meta.ui.resourceUri = ${expectedUri}`, () => {
      const tool = SUBSTRATE_TOOLS.find((t) => t.name === name);
      assert.ok(tool, `Tool ${name} not found in SUBSTRATE_TOOLS`);
      assert.ok(tool._meta?.ui?.resourceUri, `Tool ${name} missing _meta.ui.resourceUri`);
      assert.equal(
        tool._meta.ui.resourceUri,
        expectedUri,
        `Expected ${expectedUri}, got ${tool._meta.ui.resourceUri}`,
      );
    });

    it(`${name} _meta.ui.csp restricts default-src`, () => {
      const tool = SUBSTRATE_TOOLS.find((t) => t.name === name);
      assert.ok(tool?._meta?.ui?.csp, `Tool ${name} missing CSP`);
      assert.ok(
        tool._meta.ui.csp.includes("default-src 'none'"),
        `Tool ${name} CSP should restrict default-src`,
      );
    });
  }

  it('substrate_list_approvals declares tools/call permission', () => {
    const tool = SUBSTRATE_TOOLS.find((t) => t.name === 'substrate_list_approvals');
    assert.ok(tool?._meta?.ui?.permissions?.includes('tools/call'), 'Expected tools/call permission');
  });
});

// ─── UI Resources in Descriptor ───────────────────────────────────────────────

describe('UI_RESOURCES', () => {
  it('contains five ui:// resource entries', () => {
    assert.equal(UI_RESOURCES.length, 5);
  });

  it('all entries have text/html mimeType', () => {
    for (const r of UI_RESOURCES) {
      assert.equal(r.mimeType, 'text/html', `${r.uri} should be text/html`);
    }
  });

  it('URIs match the app registry', () => {
    const registryUris = new Set(MCP_APP_REGISTRY.map((a) => a.uri));
    for (const r of UI_RESOURCES) {
      assert.ok(registryUris.has(r.uri), `UI_RESOURCES contains ${r.uri} not in MCP_APP_REGISTRY`);
    }
  });
});

// ─── TOOL_UI_MAP ──────────────────────────────────────────────────────────────

describe('TOOL_UI_MAP', () => {
  it('maps substrate_list_workflows to data-table', () => {
    assert.equal(TOOL_UI_MAP['substrate_list_workflows'], 'ui://szl/data-table');
  });

  it('maps substrate_list_approvals to approval-form', () => {
    assert.equal(TOOL_UI_MAP['substrate_list_approvals'], 'ui://szl/approval-form');
  });

  it('maps substrate_get_run to timeline', () => {
    assert.equal(TOOL_UI_MAP['substrate_get_run'], 'ui://szl/timeline');
  });

  it('all mapped URIs exist in the app registry', () => {
    for (const [tool, uri] of Object.entries(TOOL_UI_MAP)) {
      const app = getMcpApp(uri);
      assert.ok(app, `TOOL_UI_MAP['${tool}'] maps to ${uri} which is not in the app registry`);
    }
  });
});
