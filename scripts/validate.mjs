#!/usr/bin/env node
/**
 * PluginMesh Validation Script
 * Verifies JSON structure, required fields, duplicate slugs, and catalog counts
 * Run: node scripts/validate.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

let passed = 0;
let failed = 0;
const errors = [];

function pass(msg) {
  console.log(`  ✓ ${msg}`);
  passed++;
}

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  errors.push(msg);
  failed++;
}

function loadJson(relativePath) {
  const fullPath = resolve(rootDir, relativePath);
  if (!existsSync(fullPath)) {
    fail(`File not found: ${relativePath}`);
    return null;
  }
  try {
    const content = readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(content);
    pass(`Valid JSON: ${relativePath}`);
    return data;
  } catch (err) {
    fail(`Invalid JSON in ${relativePath}: ${err.message}`);
    return null;
  }
}

function requireFields(obj, fields, context) {
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null) {
      fail(`Missing required field '${field}' in ${context}`);
    } else {
      pass(`Field '${field}' present in ${context}`);
    }
  }
}

function checkNoDuplicateSlugs(items, slugField, context) {
  const seen = new Set();
  const duplicates = [];
  for (const item of items) {
    const slug = item[slugField];
    if (seen.has(slug)) {
      duplicates.push(slug);
    }
    seen.add(slug);
  }
  if (duplicates.length > 0) {
    fail(`Duplicate ${slugField}s in ${context}: ${duplicates.join(', ')}`);
  } else {
    pass(`No duplicate ${slugField}s in ${context}`);
  }
}

console.log('\nPluginMesh Validation\n' + '='.repeat(40));

// ── 1. data/plugins.json ──────────────────────────────────────────────
console.log('\n[1/6] data/plugins.json');
const plugins = loadJson('data/plugins.json');
if (plugins) {
  requireFields(plugins, ['version', 'categories', 'plugins', 'count'], 'plugins.json root');
  
  if (!Array.isArray(plugins.plugins)) {
    fail('plugins.plugins must be an array');
  } else {
    pass(`Plugin array has ${plugins.plugins.length} entries`);
    
    if (plugins.count !== plugins.plugins.length) {
      fail(`Count mismatch: declared ${plugins.count}, actual ${plugins.plugins.length}`);
    } else {
      pass(`Count matches: ${plugins.count}`);
    }

    checkNoDuplicateSlugs(plugins.plugins, 'slug', 'plugins.json');

    const requiredPluginFields = ['name', 'slug', 'category', 'description', 'tags'];
    let pluginFieldErrors = 0;
    for (const plugin of plugins.plugins) {
      for (const field of requiredPluginFields) {
        if (!plugin[field]) {
          fail(`Plugin '${plugin.slug || '?'}' missing field '${field}'`);
          pluginFieldErrors++;
        }
      }
    }
    if (pluginFieldErrors === 0) {
      pass(`All ${plugins.plugins.length} plugins have required fields`);
    }

    const validCategories = plugins.categories;
    const invalidCats = plugins.plugins.filter(p => !validCategories.includes(p.category));
    if (invalidCats.length > 0) {
      fail(`Plugins with invalid categories: ${invalidCats.map(p => `${p.slug}(${p.category})`).join(', ')}`);
    } else {
      pass('All plugins have valid categories');
    }

    if (plugins.plugins.length < 30) {
      fail(`Plugin catalog has only ${plugins.plugins.length} entries — expected at least 30`);
    } else {
      pass(`Plugin catalog size OK: ${plugins.plugins.length} plugins`);
    }
  }
}

// ── 2. data/automations.json ──────────────────────────────────────────
console.log('\n[2/6] data/automations.json');
const automations = loadJson('data/automations.json');
if (automations) {
  requireFields(automations, ['version', 'automations'], 'automations.json root');
  if (Array.isArray(automations.automations)) {
    pass(`Automations array has ${automations.automations.length} entries`);
    checkNoDuplicateSlugs(automations.automations, 'id', 'automations.json');
    
    const requiredFields = ['id', 'title', 'cadence', 'prompt', 'alloyCommandPrompt'];
    let autoFieldErrors = 0;
    for (const auto of automations.automations) {
      for (const field of requiredFields) {
        if (!auto[field]) {
          fail(`Automation '${auto.id || '?'}' missing field '${field}'`);
          autoFieldErrors++;
        }
      }
    }
    if (autoFieldErrors === 0) {
      pass(`All ${automations.automations.length} automations have required fields`);
    }
  } else {
    fail('automations.automations must be an array');
  }
}

// ── 3. data/szl-ecosystem.json ────────────────────────────────────────
console.log('\n[3/6] data/szl-ecosystem.json');
const ecosystem = loadJson('data/szl-ecosystem.json');
if (ecosystem) {
  requireFields(ecosystem, ['version', 'apps', 'auditScripts', 'githubActions', 'alloyCommands'], 'szl-ecosystem.json root');
  if (Array.isArray(ecosystem.apps)) {
    pass(`Apps array has ${ecosystem.apps.length} entries`);
    checkNoDuplicateSlugs(ecosystem.apps, 'slug', 'szl-ecosystem.json apps');
  }
}

// ── 4. data/hf-trending-models-2026-04-25.json ───────────────────────
console.log('\n[4/6] data/hf-trending-models-2026-04-25.json');
const hfModels = loadJson('data/hf-trending-models-2026-04-25.json');
if (hfModels) {
  requireFields(hfModels, ['version', 'snapshotDate', 'models'], 'hf-trending-models.json root');
  if (Array.isArray(hfModels.models)) {
    pass(`HF models snapshot has ${hfModels.models.length} entries`);
    checkNoDuplicateSlugs(hfModels.models, 'modelId', 'hf-trending-models.json');
  }
}

// ── 5. data/alloy-cognitive-agentic-blueprint.json ───────────────────
console.log('\n[5/6] data/alloy-cognitive-agentic-blueprint.json');
const blueprint = loadJson('data/alloy-cognitive-agentic-blueprint.json');
if (blueprint) {
  requireFields(blueprint, ['version', 'name', 'architecture', 'approvalClasses', 'cognitivePatterns'], 'alloy-blueprint.json root');
}

// ── 6. data/replit-mcp-servers.json ──────────────────────────────────
console.log('\n[6/6] data/replit-mcp-servers.json');
const mcpServers = loadJson('data/replit-mcp-servers.json');
if (mcpServers) {
  requireFields(mcpServers, ['version', 'servers', 'activationPattern'], 'replit-mcp-servers.json root');
  if (Array.isArray(mcpServers.servers)) {
    pass(`MCP servers catalog has ${mcpServers.servers.length} entries`);
    checkNoDuplicateSlugs(mcpServers.servers, 'slug', 'replit-mcp-servers.json');
  }
}

// ── Summary ───────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(40));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error('\nFailures:');
  for (const err of errors) {
    console.error(`  • ${err}`);
  }
  process.exit(1);
} else {
  console.log('\nAll validation checks passed!');
  process.exit(0);
}
