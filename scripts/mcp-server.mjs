#!/usr/bin/env node
/**
 * PluginMesh MCP Server — Zero-dependency stdio JSON-RPC server
 * Implements MCP protocol version 2024-11-05
 * Supports: initialize, ping, tools/list, tools/call
 *
 * SECURITY: This server never bypasses plugin installation, OAuth, API keys,
 * or user consent. It coordinates installed tools and generates setup templates only.
 */

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

function loadJson(relativePath) {
  try {
    return JSON.parse(readFileSync(resolve(rootDir, relativePath), 'utf-8'));
  } catch (err) {
    return null;
  }
}

const PLUGINS_DATA = loadJson('data/plugins.json');
const AUTOMATIONS_DATA = loadJson('data/automations.json');
const ECOSYSTEM_DATA = loadJson('data/szl-ecosystem.json');
const HF_MODELS_DATA = loadJson('data/hf-trending-models-2026-04-25.json');
const ALLOY_BLUEPRINT_DATA = loadJson('data/alloy-cognitive-agentic-blueprint.json');
const REPLIT_MCP_DATA = loadJson('data/replit-mcp-servers.json');

const SERVER_INFO = {
  name: 'pluginmesh-broker',
  version: '1.0.0',
};

const PROTOCOL_VERSION = '2024-11-05';

const TOOLS = [
  {
    name: 'pluginmesh_search',
    description: 'Search the PluginMesh plugin catalog by query, category, or tags. Returns matching plugins with name, slug, description, category, and required credentials.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term to match against plugin names, descriptions, and tags' },
        category: { type: 'string', enum: ['Featured', 'Coding', 'Design', 'Engineering', 'Lifestyle', 'Productivity', 'Research'], description: 'Filter by plugin category' },
        limit: { type: 'number', description: 'Maximum results to return (default 10)' },
      },
    },
  },
  {
    name: 'pluginmesh_get',
    description: 'Get detailed information about a specific plugin by its slug, including all metadata, required credentials, and MCP compatibility.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The plugin slug identifier (e.g. "github-copilot", "slack")' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'pluginmesh_categories',
    description: 'List all plugin categories with plugin counts and representative examples from each category.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'pluginmesh_route',
    description: 'Given a user goal or task description, returns a decisive routing recommendation: the primary plugin to use, supporting plugins, required credentials, and suggested next steps. Never bypasses authentication — identifies what the user needs to install and configure.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string', description: 'The user goal or task to accomplish (e.g. "send a Slack message when a GitHub PR is merged")' },
        availablePlugins: { type: 'array', items: { type: 'string' }, description: 'Optional list of already-installed plugin slugs to prioritize' },
      },
      required: ['goal'],
    },
  },
  {
    name: 'pluginmesh_app_manifest_template',
    description: 'Generate a .app.json manifest template for a Codex plugin configuration. Returns a ready-to-use JSON structure with placeholders for plugin-specific values.',
    inputSchema: {
      type: 'object',
      properties: {
        pluginSlug: { type: 'string', description: 'Plugin slug to generate the manifest template for' },
        includeAuth: { type: 'boolean', description: 'Whether to include OAuth/API key auth placeholders (default true)' },
      },
      required: ['pluginSlug'],
    },
  },
  {
    name: 'pluginmesh_replit_payload',
    description: 'Generate a Replit deployment payload for a specific plugin. Returns configuration for .mcp.json, environment variable requirements, and activation steps.',
    inputSchema: {
      type: 'object',
      properties: {
        pluginSlug: { type: 'string', description: 'Plugin slug to generate the Replit payload for' },
      },
      required: ['pluginSlug'],
    },
  },
  {
    name: 'pluginmesh_automation_catalog',
    description: 'Returns the full scheduled-chat automation catalog with title, cadence, prompt, and Alloy command for each workflow.',
    inputSchema: {
      type: 'object',
      properties: {
        cadence: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'on-demand', 'event-triggered'], description: 'Filter by automation cadence' },
      },
    },
  },
  {
    name: 'pluginmesh_alloy_commands',
    description: 'Returns the list of available Alloy CLI commands for the SZL Holdings ecosystem, with descriptions and required parameters.',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Optional search term to filter commands' },
      },
    },
  },
  {
    name: 'pluginmesh_replit_ecosystem_payload',
    description: 'Returns the full SZL Holdings ecosystem payload including app routes, audit scripts, GitHub Actions, scheduled chats, and Alloy commands. Use this to onboard Codex agents to the SZL Holdings monorepo.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'pluginmesh_hf_model_router',
    description: 'Given a task description, returns the best-matching Hugging Face model(s) from the trending snapshot, with model IDs, tasks, and download counts.',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'The ML task or capability needed (e.g. "text generation", "image generation", "speech recognition")' },
        preferOpen: { type: 'boolean', description: 'Prefer open-license models (apache-2.0, mit) over proprietary licenses' },
        maxResults: { type: 'number', description: 'Maximum models to return (default 3)' },
      },
      required: ['task'],
    },
  },
  {
    name: 'pluginmesh_alloy_meridian_blueprint',
    description: 'Returns the Alloy Meridian cognitive agentic architecture blueprint, including layer descriptions, approval classes, cognitive patterns, and MCP integration details.',
    inputSchema: {
      type: 'object',
      properties: {
        section: { type: 'string', enum: ['architecture', 'approvalClasses', 'cognitivePatterns', 'skillRegistry', 'mcpIntegration', 'all'], description: 'Specific section to retrieve (default: all)' },
      },
    },
  },
  {
    name: 'pluginmesh_replit_mcp_activation',
    description: 'Returns the complete Replit MCP server reference catalog and activation payload. Includes .mcp.json template, activation steps, and credential requirements for all registered MCP servers.',
    inputSchema: {
      type: 'object',
      properties: {
        serverFilter: { type: 'string', description: 'Optional filter to return details for a specific server by slug' },
      },
    },
  },
];

function sendResponse(id, result) {
  const response = { jsonrpc: '2.0', id, result };
  process.stdout.write(JSON.stringify(response) + '\n');
}

function sendError(id, code, message, data) {
  const response = {
    jsonrpc: '2.0',
    id,
    error: { code, message, ...(data ? { data } : {}) },
  };
  process.stdout.write(JSON.stringify(response) + '\n');
}

function handleInitialize(id, params) {
  sendResponse(id, {
    protocolVersion: PROTOCOL_VERSION,
    capabilities: { tools: { listChanged: false } },
    serverInfo: SERVER_INFO,
  });
}

function handlePing(id) {
  sendResponse(id, {});
}

function handleToolsList(id) {
  sendResponse(id, { tools: TOOLS });
}

function searchPlugins(query, category, limit = 10) {
  if (!PLUGINS_DATA) return [];
  let plugins = PLUGINS_DATA.plugins;
  if (category) plugins = plugins.filter(p => p.category === category);
  if (query) {
    const q = query.toLowerCase();
    plugins = plugins.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q)) ||
      p.slug.includes(q)
    );
  }
  return plugins.slice(0, limit);
}

function routeGoal(goal, availablePlugins = []) {
  if (!PLUGINS_DATA) return null;
  const goalLower = goal.toLowerCase();
  const plugins = PLUGINS_DATA.plugins;
  
  const keywordMap = {
    'slack': ['slack'], 'github': ['github-copilot', 'github-actions'],
    'notion': ['notion'], 'jira': ['jira'], 'linear': ['linear'],
    'stripe': ['stripe'], 'search': ['perplexity-search', 'brave-search'],
    'image': ['dalle', 'figma-mcp'], 'code': ['github-copilot', 'replit-agent'],
    'deploy': ['replit-agent', 'github-actions'], 'test': ['vitest-runner'],
    'database': ['drizzle-orm', 'postgres-mcp'], 'music': ['spotify'],
    'weather': ['weather'], 'research': ['arxiv', 'semantic-scholar'],
    'model': ['hugging-face'], 'incident': ['pagerduty', 'datadog'],
    'monitor': ['datadog', 'pagerduty'], 'calendar': ['google-calendar'],
    'schedule': ['google-calendar', 'zapier'], 'terraform': ['terraform'],
    'figma': ['figma-mcp'], 'tailwind': ['tailwind-palette', 'shadcn-ui'],
    'animation': ['framer-motion', 'lottie'], 'docker': ['docker-compose'],
    'kubernetes': ['kubernetes'], 'openapi': ['openapi-spec'],
    'report': ['alloy-orchestrator', 'notion'], 'workflow': ['alloy-orchestrator', 'zapier'],
    'audit': ['alloy-orchestrator'], 'security': ['datadog', 'pagerduty'],
    'fitness': ['strava'], 'travel': ['weather', 'airbnb'],
    'recipe': ['recipe-finder'], 'paper': ['arxiv', 'semantic-scholar'],
    'huggingface': ['hugging-face'], 'clinical': ['clinical-trials'],
    'sec': ['sec-edgar'], 'canva': ['canva'], 'story': ['storybook'],
  };

  const scoredSlugs = {};
  for (const [keyword, slugs] of Object.entries(keywordMap)) {
    if (goalLower.includes(keyword)) {
      for (const slug of slugs) {
        scoredSlugs[slug] = (scoredSlugs[slug] || 0) + 2;
      }
    }
  }

  for (const plugin of plugins) {
    for (const tag of plugin.tags) {
      if (goalLower.includes(tag)) {
        scoredSlugs[plugin.slug] = (scoredSlugs[plugin.slug] || 0) + 1;
      }
    }
    if (availablePlugins.includes(plugin.slug)) {
      scoredSlugs[plugin.slug] = (scoredSlugs[plugin.slug] || 0) + 3;
    }
  }

  const sorted = Object.entries(scoredSlugs)
    .sort(([, a], [, b]) => b - a)
    .map(([slug]) => slug);

  const primarySlug = sorted[0] || 'pluginmesh-broker';
  const supportSlugs = sorted.slice(1, 4);

  const primaryPlugin = plugins.find(p => p.slug === primarySlug);
  const supportPlugins = supportSlugs.map(s => plugins.find(p => p.slug === s)).filter(Boolean);

  const allCredentials = [
    ...(primaryPlugin?.credentials || []),
    ...supportPlugins.flatMap(p => p?.credentials || []),
  ];
  const uniqueCredentials = [...new Set(allCredentials)];

  return {
    goal,
    primary: primaryPlugin ? { name: primaryPlugin.name, slug: primaryPlugin.slug, reason: `Best match for: ${goal}`, credentials: primaryPlugin.credentials } : null,
    supporting: supportPlugins.map(p => ({ name: p.name, slug: p.slug, role: `Supports: ${p.description.split('.')[0]}` })),
    credentialsRequired: uniqueCredentials,
    nextSteps: [
      uniqueCredentials.length > 0
        ? `Set these credentials in Replit Secrets: ${uniqueCredentials.join(', ')}`
        : 'No credentials required — activate immediately',
      primaryPlugin?.mcpCompatible
        ? `Add "${primarySlug}" to .mcp.json to enable MCP tool access`
        : `Install ${primaryPlugin?.name || primarySlug} and configure via its plugin settings`,
      'Run pluginmesh_app_manifest_template to get a ready-to-use .app.json',
    ],
  };
}

function handleToolCall(id, toolName, toolArgs) {
  try {
    let result;

    switch (toolName) {
      case 'pluginmesh_search': {
        const { query, category, limit } = toolArgs || {};
        const plugins = searchPlugins(query, category, limit || 10);
        result = {
          count: plugins.length,
          plugins: plugins.map(p => ({
            name: p.name, slug: p.slug, category: p.category,
            description: p.description, tags: p.tags,
            credentials: p.credentials, mcpCompatible: p.mcpCompatible,
          })),
        };
        break;
      }

      case 'pluginmesh_get': {
        const { slug } = toolArgs || {};
        const plugin = PLUGINS_DATA?.plugins.find(p => p.slug === slug);
        if (!plugin) {
          return sendError(id, -32602, `Plugin not found: ${slug}`);
        }
        result = plugin;
        break;
      }

      case 'pluginmesh_categories': {
        const categories = PLUGINS_DATA?.categories || [];
        const plugins = PLUGINS_DATA?.plugins || [];
        result = {
          categories: categories.map(cat => {
            const catPlugins = plugins.filter(p => p.category === cat);
            return {
              name: cat, count: catPlugins.length,
              examples: catPlugins.slice(0, 3).map(p => p.name),
            };
          }),
          total: plugins.length,
        };
        break;
      }

      case 'pluginmesh_route': {
        const { goal, availablePlugins } = toolArgs || {};
        if (!goal) return sendError(id, -32602, 'goal is required');
        result = routeGoal(goal, availablePlugins || []);
        break;
      }

      case 'pluginmesh_app_manifest_template': {
        const { pluginSlug, includeAuth = true } = toolArgs || {};
        const plugin = PLUGINS_DATA?.plugins.find(p => p.slug === pluginSlug);
        const appJson = {
          name: plugin?.name || pluginSlug,
          slug: pluginSlug,
          version: '1.0.0',
          description: plugin?.description || `${pluginSlug} Codex plugin`,
          permissions: ['tools'],
          ...(includeAuth && plugin?.credentials?.length > 0 ? {
            auth: {
              type: 'apiKey',
              envVars: plugin.credentials,
            },
          } : {}),
          mcpServer: plugin?.mcpCompatible ? {
            transport: 'stdio',
            command: `npx -y @mcp/${pluginSlug}-server`,
          } : null,
          homepage: plugin?.homepage || null,
        };
        result = { template: appJson, pluginFound: !!plugin };
        break;
      }

      case 'pluginmesh_replit_payload': {
        const { pluginSlug } = toolArgs || {};
        const plugin = PLUGINS_DATA?.plugins.find(p => p.slug === pluginSlug);
        result = {
          pluginSlug,
          pluginName: plugin?.name || pluginSlug,
          mcpJsonEntry: plugin?.mcpCompatible ? {
            [pluginSlug]: {
              command: `npx`,
              args: ['-y', `@mcp/${pluginSlug}-server`],
              env: Object.fromEntries((plugin?.credentials || []).map(c => [c, `\${${c}}`])),
            },
          } : null,
          environmentVariables: plugin?.credentials || [],
          activationSteps: [
            ...(plugin?.credentials?.length > 0 ? [`Set in Replit Secrets: ${plugin.credentials.join(', ')}`] : []),
            plugin?.mcpCompatible ? 'Add the mcpJsonEntry above to .mcp.json' : `Install ${plugin?.name || pluginSlug} via the Replit integrations panel`,
            'Restart Codex to activate the new MCP tools',
          ],
          homepage: plugin?.homepage,
        };
        break;
      }

      case 'pluginmesh_automation_catalog': {
        const { cadence } = toolArgs || {};
        let automations = AUTOMATIONS_DATA?.automations || [];
        if (cadence) automations = automations.filter(a => a.cadence === cadence);
        result = {
          count: automations.length,
          automations: automations.map(a => ({
            id: a.id, title: a.title, cadence: a.cadence,
            schedule: a.schedule, prompt: a.prompt,
            alloyCommandPrompt: a.alloyCommandPrompt,
            plugins: a.plugins, outputFormat: a.outputFormat,
          })),
        };
        break;
      }

      case 'pluginmesh_alloy_commands': {
        const { search } = toolArgs || {};
        let commands = ECOSYSTEM_DATA?.alloyCommands || [];
        if (search) {
          const s = search.toLowerCase();
          commands = commands.filter(c => c.command.toLowerCase().includes(s) || c.description.toLowerCase().includes(s));
        }
        result = { count: commands.length, commands };
        break;
      }

      case 'pluginmesh_replit_ecosystem_payload': {
        result = {
          ecosystem: ECOSYSTEM_DATA,
          summary: {
            appCount: ECOSYSTEM_DATA?.apps?.length || 0,
            auditScriptCount: ECOSYSTEM_DATA?.auditScripts?.length || 0,
            githubActionsCount: ECOSYSTEM_DATA?.githubActions?.length || 0,
            scheduledChatCount: ECOSYSTEM_DATA?.scheduledChats?.length || 0,
            alloyCommandCount: ECOSYSTEM_DATA?.alloyCommands?.length || 0,
          },
        };
        break;
      }

      case 'pluginmesh_hf_model_router': {
        const { task, preferOpen = false, maxResults = 3 } = toolArgs || {};
        if (!task) return sendError(id, -32602, 'task is required');
        const models = HF_MODELS_DATA?.models || [];
        const taskLower = task.toLowerCase();
        
        const scored = models.map(m => {
          let score = 0;
          if (m.task.includes(taskLower.replace(/ /g, '-'))) score += 5;
          if (m.tags.some(t => taskLower.includes(t) || t.includes(taskLower.split(' ')[0]))) score += 3;
          if (m.trending) score += 1;
          if (preferOpen && ['apache-2.0', 'mit'].includes(m.license)) score += 2;
          score += m.downloads / 1000000;
          return { ...m, score };
        }).sort((a, b) => b.score - a.score).slice(0, maxResults);
        
        result = {
          task,
          recommendations: scored.map(m => ({
            modelId: m.modelId, author: m.author, task: m.task,
            description: m.description, license: m.license,
            downloads: m.downloads, likes: m.likes, trending: m.trending,
          })),
          snapshotDate: HF_MODELS_DATA?.snapshotDate,
        };
        break;
      }

      case 'pluginmesh_alloy_meridian_blueprint': {
        const { section = 'all' } = toolArgs || {};
        if (!ALLOY_BLUEPRINT_DATA) {
          return sendError(id, -32603, 'Blueprint data not found');
        }
        if (section === 'all') {
          result = ALLOY_BLUEPRINT_DATA;
        } else {
          result = { [section]: ALLOY_BLUEPRINT_DATA[section] || null };
        }
        break;
      }

      case 'pluginmesh_replit_mcp_activation': {
        const { serverFilter } = toolArgs || {};
        let servers = REPLIT_MCP_DATA?.servers || [];
        if (serverFilter) {
          servers = servers.filter(s => s.slug === serverFilter || s.name.toLowerCase().includes(serverFilter.toLowerCase()));
        }
        result = {
          servers,
          activationPattern: REPLIT_MCP_DATA?.activationPattern,
          mcpConfigFile: '.mcp.json',
          appConfigFile: '.app.json',
        };
        break;
      }

      default:
        return sendError(id, -32601, `Unknown tool: ${toolName}`);
    }

    sendResponse(id, {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    });
  } catch (err) {
    sendError(id, -32603, `Internal error: ${err.message}`);
  }
}

function handleMessage(line) {
  const trimmed = line.trim();
  if (!trimmed) return;
  
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    sendError(null, -32700, 'Parse error');
    return;
  }

  const { jsonrpc, id, method, params } = msg;
  if (jsonrpc !== '2.0') {
    sendError(id ?? null, -32600, 'Invalid Request: jsonrpc must be "2.0"');
    return;
  }

  switch (method) {
    case 'initialize':
      handleInitialize(id, params);
      break;
    case 'ping':
      handlePing(id);
      break;
    case 'tools/list':
      handleToolsList(id);
      break;
    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      if (!toolName) {
        sendError(id, -32602, 'params.name is required');
        return;
      }
      handleToolCall(id, toolName, toolArgs);
      break;
    }
    default:
      if (id !== undefined && id !== null) {
        sendError(id, -32601, `Method not found: ${method}`);
      }
  }
}

let buffer = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', chunk => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    handleMessage(line);
  }
});

process.stdin.on('end', () => {
  if (buffer.trim()) handleMessage(buffer);
  process.exit(0);
});

process.stderr.write(`PluginMesh MCP Server v1.0.0 ready (PID ${process.pid})\n`);
