import type {
  MemoryItem,
  PatternFamily,
  ProtocolTool,
  Skill,
  ThirdPartyLeader,
} from './nexus-types';

export const SEED_SKILLS_DATA: Array<Omit<Skill, 'isCustom'>> = [
    {
      id: 'sk_claude_mem_001',
      name: 'Persistent Entity Graph',
      description:
        'Extract and persist named entities across sessions using a graph-based memory store.',
      sourceRepo: 'claude-mem',
      sourceUrl: 'https://github.com/anthropics/claude-mem',
      license: 'MIT',
      pattern: 'Memory',
      primitiveType: 'MemorySchema',
      enabled: true,
      usageCount: 47,
      nexusAdaptation:
        'Integrated with PRAXIS memory-fabric multi-tier store. Entities are classified by sensitivity level and expire according to retention policy. Automatically populated by Research Swarm Gatherer lane.',
      originalSummary:
        'Simple JSON-based entity memory that stores structured facts about people, places, and organizations mentioned in conversations.',
      tags: ['memory', 'entity', 'graph', 'persistence'],
    },
    {
      id: 'sk_superpowers_001',
      name: 'Structured Decomposition Prompt',
      description:
        'Feynman-style query decomposition that breaks complex questions into atomic sub-questions before answering.',
      sourceRepo: 'claude-superpowers',
      sourceUrl: 'https://github.com/anthropics/claude-superpowers',
      license: 'Apache-2.0',
      pattern: 'Structured Thinking',
      primitiveType: 'Skill',
      enabled: true,
      usageCount: 134,
      nexusAdaptation:
        'Powers the Research Swarm Peer-Reviewer lane. Decomposed sub-questions are distributed to Gatherer for parallel evidence collection. Results feed back into the Drafter with structured context.',
      originalSummary:
        'A system prompt pattern that encourages step-by-step reasoning by explicitly separating question decomposition from answer synthesis.',
      tags: ['reasoning', 'decomposition', 'prompt-engineering'],
    },
    {
      id: 'sk_lightrag_001',
      name: 'Graph+Vector Hybrid RAG',
      description:
        'Combines graph-based knowledge retrieval with dense vector similarity for context-aware document retrieval.',
      sourceRepo: 'LightRAG',
      sourceUrl: 'https://github.com/HKUDS/LightRAG',
      license: 'MIT',
      pattern: 'Graph+Vector RAG',
      primitiveType: 'RAGStrategy',
      enabled: true,
      usageCount: 23,
      nexusAdaptation:
        'Backs the PRAXIS skills search and memory search. Graph edges represent relationships between memory items and skills; vector similarity handles free-text recall. Falls back to lexical (pg_trgm) if pgvector unavailable.',
      originalSummary:
        'A RAG framework that builds a knowledge graph from ingested documents and uses both graph traversal and embedding similarity at query time.',
      tags: ['rag', 'vector', 'graph', 'retrieval'],
    },
    {
      id: 'sk_feynman_001',
      name: 'Parallel Research Pipeline',
      description:
        'Spawn multiple specialized agents concurrently to research a topic from different angles, then merge findings.',
      sourceRepo: 'feynman-agent',
      sourceUrl: 'https://github.com/SylphAI-Inc/AdalFlow',
      license: 'MIT',
      pattern: 'Parallel Research',
      primitiveType: 'Agent',
      enabled: true,
      usageCount: 89,
      nexusAdaptation:
        'The entire PRAXIS Research Swarm (Gatherer, Peer-Reviewer, Drafter, Verifier) is a PRAXIS-native expression of this pattern. Added: Verifier lane with HEAD-check URL validation, SSE streaming per lane, and automatic memory write on completion.',
      originalSummary:
        'A four-agent system where each agent has a distinct research role. Agents run in parallel and their outputs are merged by a synthesis agent.',
      tags: ['agents', 'parallel', 'research', 'synthesis'],
    },
    {
      id: 'sk_n8n_mcp_001',
      name: 'Workflow-to-Tool MCP Bridge',
      description:
        'Exposes n8n workflow automations as MCP tools callable by language model agents.',
      sourceRepo: 'n8n-mcp',
      sourceUrl: 'https://github.com/leonvanzyl/n8n-mcp-server',
      license: 'MIT',
      pattern: 'MCP Connectors',
      primitiveType: 'Tool',
      enabled: true,
      usageCount: 12,
      nexusAdaptation:
        'Pattern absorbed into the Protocol Bridge MCP adapter. Any workflow automation can now be registered as an MCP tool with a typed JSON schema. PRAXIS adds policy tier enforcement so autonomous agents cannot invoke write-path workflows without human approval.',
      originalSummary:
        'An MCP server that registers n8n webhook-triggered workflows as callable tools, enabling LLMs to trigger complex automation flows.',
      tags: ['mcp', 'workflow', 'automation', 'bridge'],
    },
    {
      id: 'sk_voice_mcp_001',
      name: 'Voice Loop MCP Tool',
      description:
        'Adds speak() and listen() primitives to the agent tool palette, enabling voice interaction flows.',
      sourceRepo: 'voice-mode-mcp',
      sourceUrl: 'https://github.com/anthropics/anthropic-quickstarts',
      license: 'MIT',
      pattern: 'MCP Connectors',
      primitiveType: 'Tool',
      enabled: false,
      usageCount: 0,
      nexusAdaptation:
        'Registered as a loopback MCP tool in the Protocol Bridge. When enabled, Research Swarm Drafter can generate voice-ready output. Full audio pipeline (STT/TTS) is web-only and out of scope for v1.',
      originalSummary:
        'An MCP server providing text-to-speech and speech-to-text tool calls so agents can participate in voice conversations.',
      tags: ['mcp', 'voice', 'audio', 'tts'],
    },
    {
      id: 'sk_openclaw_001',
      name: 'Local Autonomous Agent Shell',
      description:
        'Runs shell commands, edits files, and manages local processes autonomously with rollback support.',
      sourceRepo: 'openclaw',
      sourceUrl: 'https://github.com/anthropics/claude-code',
      license: 'MIT',
      pattern: 'Local Autonomy',
      primitiveType: 'Agent',
      enabled: false,
      usageCount: 3,
      nexusAdaptation:
        'Mapped to the autonomous-reversible tool policy tier in PRAXIS. Commands are sandboxed and every mutation is recorded in the audit trail before execution. Human approval required for irreversible operations.',
      originalSummary:
        'An agent pattern that gives Claude full shell access with a rollback mechanism based on git snapshots. Designed for autonomous code generation and refactoring tasks.',
      tags: ['autonomy', 'shell', 'local', 'code'],
    },
    {
      id: 'sk_antigravity_001',
      name: 'Domain-Specific Prompt Pack',
      description:
        'Pre-baked prompt chains for maritime, legal, real-estate, and defense analysis domains.',
      sourceRepo: 'antigravity-awesome-skills',
      sourceUrl: 'https://github.com/anthropics/anthropic-cookbook',
      license: 'MIT',
      pattern: 'Skill Packs',
      primitiveType: 'Skill',
      enabled: true,
      usageCount: 56,
      nexusAdaptation:
        'Domain prompts are exposed as callable PRAXIS Skills. The Cross-App Orchestrator selects the appropriate domain skill automatically based on which SZL artifact is targeted (Vessels→maritime, Terra→real-estate, Aegis→defense, Counsel→legal).',
      originalSummary:
        'A curated collection of domain-specialized prompt templates covering finance, law, science, and engineering use cases.',
      tags: ['domain', 'prompts', 'templates', 'skills'],
    },
    {
      id: 'sk_agent_blueprints_001',
      name: 'Tool-Use Agent Blueprint',
      description:
        'A reference agent architecture with tool routing, retry logic, context window management, and observability hooks.',
      sourceRepo: 'claude-agent-blueprints',
      sourceUrl: 'https://github.com/anthropics/anthropic-cookbook',
      license: 'MIT',
      pattern: 'Agent Blueprints',
      primitiveType: 'Agent',
      enabled: true,
      usageCount: 38,
      nexusAdaptation:
        'Base architecture for all PRAXIS swarm lanes. Retry logic, context truncation, and observability hooks from this blueprint are wired into every agent lane. Traces emit to cognitive-observability.',
      originalSummary:
        'A production-ready agent loop with tool calling, streaming output, max-retries, and token budget management.',
      tags: ['agents', 'architecture', 'blueprint', 'tool-use'],
    },
    {
      id: 'sk_ui_ux_pro_001',
      name: 'Command-Deck Design System',
      description:
        'Dark, high-contrast UI component tokens optimized for real-time data surfaces and agentic consoles.',
      sourceRepo: 'ui-ux-pro-max',
      sourceUrl: 'https://github.com/anthropics/claude-code',
      license: 'MIT',
      pattern: 'Design System',
      primitiveType: 'Skill',
      enabled: true,
      usageCount: 0,
      nexusAdaptation:
        'The PRAXIS visual identity (dark navy, cyan accent, monospace data, status strips, lane cards) is the native PRAXIS expression of this pattern. Tokens are captured in index.css as CSS custom properties.',
      originalSummary:
        'A Tailwind-based design system optimized for developer tools, monitoring dashboards, and AI copilots. Includes dark-mode-first tokens, scan-line animations, and data-dense layouts.',
      tags: ['design', 'ui', 'tokens', 'dark-mode'],
    },
    {
      id: 'sk_awesome_claude_001',
      name: 'Slash Command Registry',
      description:
        'Register and invoke named slash commands (e.g. /summarize, /translate, /diff) as first-class agent capabilities.',
      sourceRepo: 'awesome-claude-code',
      sourceUrl: 'https://github.com/anthropics/awesome-claude-code',
      license: 'MIT',
      pattern: 'Skill Packs',
      primitiveType: 'Command',
      enabled: true,
      usageCount: 29,
      nexusAdaptation:
        'Slash commands are registered in the PRAXIS skill store as Command primitives. The Research Swarm Drafter can invoke them during synthesis. Commands are also exposed through the Protocol Bridge as MCP tools.',
      originalSummary:
        'A curated list of useful Claude slash commands with examples and chaining patterns for common developer workflows.',
      tags: ['commands', 'slash', 'registry', 'developer'],
    },
    {
      id: 'sk_everything_claude_001',
      name: 'Context-Aware Prompt Optimizer',
      description:
        'Dynamically adapts system prompts based on task type, token budget, and prior conversation context.',
      sourceRepo: 'everything-claude-code',
      sourceUrl: 'https://github.com/anthropics/claude-code',
      license: 'MIT',
      pattern: 'Skill Packs',
      primitiveType: 'Hook',
      enabled: true,
      usageCount: 72,
      nexusAdaptation:
        'Runs as a pre-call Hook before each Research Swarm agent invocation. Reads from the PRAXIS memory fabric to inject relevant context. Manages token budgets across all four swarm lanes to prevent context overflow.',
      originalSummary:
        'A collection of prompt engineering techniques covering system prompt optimization, context injection, tool selection hints, and few-shot example selection.',
      tags: ['prompts', 'optimization', 'context', 'hooks'],
    },
  ];

export const PATTERNS_DATA: PatternFamily[] = [
    {
      id: 'pf_memory',
      name: 'Memory',
      description:
        'Persistent, multi-tier agent memory with retention policies and sensitivity classification.',
      icon: '🧠',
      repos: ['claude-mem', 'MemGPT'],
      nexusCapability:
        'PRAXIS memory-fabric provides working, session, episodic, and semantic tiers. All Research Swarm outputs automatically write entities and claims. Memory powers context injection for every subsequent run.',
      skills: 3,
    },
    {
      id: 'pf_structured_thinking',
      name: 'Structured Thinking',
      description:
        'Explicit reasoning decomposition patterns that improve accuracy on complex multi-step problems.',
      icon: '🔬',
      repos: ['claude-superpowers', 'Awesome Claude Code'],
      nexusCapability:
        'PRAXIS Peer-Reviewer lane uses structured decomposition to challenge Gatherer output. Every research run gets automatic chain-of-thought scaffolding before synthesis.',
      skills: 4,
    },
    {
      id: 'pf_graph_rag',
      name: 'Graph+Vector RAG',
      description:
        'Hybrid retrieval combining knowledge graph traversal with dense vector similarity search.',
      icon: '🕸️',
      repos: ['LightRAG', 'GraphRAG'],
      nexusCapability:
        'PRAXIS search (skills, memory, pattern atlas) uses pg_trgm for lexical fallback and pgvector for semantic similarity. Graph edges connect related memory items and skills for relationship-aware retrieval.',
      skills: 2,
    },
    {
      id: 'pf_skill_packs',
      name: 'Skill Packs',
      description:
        'Curated, domain-specific prompt libraries and command registries for repeatable agent behaviors.',
      icon: '📦',
      repos: ['Awesome Claude Code', 'Antigravity Skills', 'Everything Claude Code'],
      nexusCapability:
        'PRAXIS Skills Library holds 50+ adapted skills as first-class typed primitives (Skill, Command, Hook). Enabled skills are callable by Research Swarm agents and the Cross-App Orchestrator.',
      skills: 12,
    },
    {
      id: 'pf_agent_blueprints',
      name: 'Agent Blueprints',
      description:
        'Production-ready agent loop architectures with tool routing, retry, streaming, and observability.',
      icon: '🤖',
      repos: ['Claude Agent Blueprints', 'OpenClaw'],
      nexusCapability:
        'Every PRAXIS swarm lane is built on the blueprint pattern: retry backoff, context window management, SSE streaming, and cognitive-observability trace emission. Agents are parameterized by tier (advisory → autonomous).',
      skills: 4,
    },
    {
      id: 'pf_mcp_connectors',
      name: 'MCP Connectors',
      description:
        'Model Context Protocol servers that expose external services and workflows as callable agent tools.',
      icon: '🔌',
      repos: ['n8n-MCP', 'VoiceMode MCP', 'Awesome Claude Plugins'],
      nexusCapability:
        'PRAXIS Protocol Bridge normalizes MCP tool definitions into the internal ToolDefinition shape. Any MCP server can be registered and called through the unified invokeTool() facade. Policy tier governs approval requirements.',
      skills: 8,
    },
    {
      id: 'pf_parallel_research',
      name: 'Parallel Research',
      description:
        'Multi-agent concurrent research with role specialization, cross-lane verification, and merged synthesis.',
      icon: '⚡',
      repos: ['Feynman', 'AdalFlow'],
      nexusCapability:
        'The PRAXIS Research Swarm IS this pattern, natively. Additions: URL HEAD-check verification by the Verifier lane, SSE real-time streaming per lane, automatic memory write on completion, and citation status table (verified/killed).',
      skills: 3,
    },
    {
      id: 'pf_local_autonomy',
      name: 'Local Autonomy',
      description:
        'Agents that can execute shell commands, edit files, and manage processes with rollback safety.',
      icon: '🖥️',
      repos: ['OpenClaw'],
      nexusCapability:
        'Mapped to the autonomous-reversible policy tier in the AI Control Plane. PRAXIS adds: full audit trail, human-approval-mandatory gate for irreversible ops, and Guardian policy enforcement before any system call.',
      skills: 2,
    },
    {
      id: 'pf_design_system',
      name: 'Design System',
      description:
        'Dark, data-dense UI component tokens and patterns for agentic consoles and monitoring surfaces.',
      icon: '🎨',
      repos: ['UI UX Pro Max'],
      nexusCapability:
        'The PRAXIS command-deck aesthetic (dark navy, cyan accent, lane cards, scan animations, status strip, monospace data) is a native PRAXIS design system. Tokens live in index.css as CSS custom properties for reuse across the SZL portfolio.',
      skills: 1,
    },
    {
      id: 'pf_docs_curriculum',
      name: 'Docs & Curriculum',
      description:
        'Structured learning resources, best practices guides, and reference implementations for agent development.',
      icon: '📚',
      repos: ['Claude Code Ultimate Guide', 'Everything Claude Code'],
      nexusCapability:
        'Curriculum content is ingested as semantic memory items, making best practices retrievable during agent runs. The Research Swarm can cite from the internal knowledge base as a verified source.',
      skills: 5,
    },
  ];

export const TOOLS_DATA: Array<Omit<ProtocolTool, 'isCustom'>> = [
    // MCP tools
    {
      id: 'mcp_web_search',
      name: 'web_search',
      description: 'Search the web and return structured results with titles, URLs, and snippets.',
      protocol: 'MCP',
      domain: 'research',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          maxResults: { type: 'number', description: 'Maximum number of results (default: 10)' },
        },
        required: ['query'],
      },
      tags: ['search', 'web', 'research'],
    },
    {
      id: 'mcp_memory_read',
      name: 'memory_read',
      description: 'Read items from the PRAXIS memory fabric by key or semantic search.',
      protocol: 'MCP',
      domain: 'memory',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Semantic search query or exact key' },
          tier: {
            type: 'string',
            enum: ['working', 'session', 'episodic', 'semantic'],
            description: 'Memory tier to search',
          },
        },
        required: ['query'],
      },
      tags: ['memory', 'retrieval', 'search'],
    },
    {
      id: 'mcp_document_parse',
      name: 'document_parse',
      description:
        'Extract text, tables, and structured data from PDFs, Word documents, and web pages.',
      protocol: 'MCP',
      domain: 'documents',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL or file path to parse' },
          extractTables: { type: 'boolean', description: 'Whether to extract tables as JSON' },
        },
        required: ['url'],
      },
      tags: ['documents', 'parsing', 'extraction'],
    },
    // A2A tools
    {
      id: 'a2a_delegate_research',
      name: 'delegate_research',
      description: 'Delegate a research subtask to a specialized research agent via A2A protocol.',
      protocol: 'A2A',
      domain: 'research',
      inputSchema: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'Research task description' },
          agentRole: {
            type: 'string',
            enum: ['gatherer', 'analyst', 'verifier'],
            description: 'Target agent specialization',
          },
          context: { type: 'object', description: 'Shared context to pass to the agent' },
        },
        required: ['task', 'agentRole'],
      },
      tags: ['a2a', 'delegation', 'multi-agent'],
    },
    {
      id: 'a2a_negotiate_result',
      name: 'negotiate_result',
      description:
        'Send a result back to a calling agent and negotiate on quality or completeness via A2A.',
      protocol: 'A2A',
      domain: 'coordination',
      inputSchema: {
        type: 'object',
        properties: {
          result: { type: 'object', description: 'Result payload to transmit' },
          confidence: { type: 'number', minimum: 0, maximum: 1, description: 'Confidence score' },
          requestFeedback: { type: 'boolean', description: 'Request quality feedback from caller' },
        },
        required: ['result', 'confidence'],
      },
      tags: ['a2a', 'negotiation', 'quality'],
    },
    {
      id: 'a2a_broadcast_event',
      name: 'broadcast_event',
      description:
        'Broadcast a domain event to all subscribed agents in the swarm via A2A pub/sub.',
      protocol: 'A2A',
      domain: 'events',
      inputSchema: {
        type: 'object',
        properties: {
          eventType: { type: 'string', description: 'Event type identifier' },
          payload: { type: 'object', description: 'Event payload' },
          targetAgents: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific agent IDs (empty = all)',
          },
        },
        required: ['eventType', 'payload'],
      },
      tags: ['a2a', 'events', 'pub-sub'],
    },
    // ACP tools
    {
      id: 'acp_enterprise_query',
      name: 'enterprise_query',
      description:
        'Query an enterprise data source using the ACP structured query envelope format.',
      protocol: 'ACP',
      domain: 'enterprise',
      inputSchema: {
        type: 'object',
        properties: {
          dataSource: {
            type: 'string',
            description: 'Data source identifier (e.g. salesforce, sap, oracle)',
          },
          query: { type: 'object', description: 'ACP-formatted query object' },
          pagination: {
            type: 'object',
            properties: { page: { type: 'number' }, size: { type: 'number' } },
          },
        },
        required: ['dataSource', 'query'],
      },
      tags: ['acp', 'enterprise', 'query'],
    },
    {
      id: 'acp_workflow_trigger',
      name: 'workflow_trigger',
      description: 'Trigger a named enterprise workflow with typed parameters via ACP.',
      protocol: 'ACP',
      domain: 'automation',
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: { type: 'string', description: 'Workflow identifier' },
          parameters: { type: 'object', description: 'Workflow parameters' },
          async: { type: 'boolean', description: 'Execute asynchronously (default: false)' },
        },
        required: ['workflowId', 'parameters'],
      },
      tags: ['acp', 'workflow', 'automation'],
    },
    {
      id: 'acp_capability_discover',
      name: 'capability_discover',
      description: 'Discover available capabilities from an ACP-compliant agent registry.',
      protocol: 'ACP',
      domain: 'discovery',
      inputSchema: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Capability domain to search (e.g. finance, legal, logistics)',
          },
          minVersion: { type: 'string', description: 'Minimum ACP version requirement' },
        },
      },
      tags: ['acp', 'discovery', 'registry'],
    },
    // ANP tools
    {
      id: 'anp_agent_discover',
      name: 'agent_discover',
      description: 'Discover agents published on the ANP decentralized network by capability tags.',
      protocol: 'ANP',
      domain: 'discovery',
      inputSchema: {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Capability tags to filter by',
          },
          maxResults: { type: 'number', description: 'Maximum agents to return' },
          verifiedOnly: {
            type: 'boolean',
            description: 'Only return cryptographically verified agents',
          },
        },
        required: ['tags'],
      },
      tags: ['anp', 'discovery', 'decentralized'],
    },
    {
      id: 'anp_handshake',
      name: 'anp_handshake',
      description: 'Perform a DID-based mutual authentication handshake with a remote ANP agent.',
      protocol: 'ANP',
      domain: 'auth',
      inputSchema: {
        type: 'object',
        properties: {
          agentDid: { type: 'string', description: 'DID of the target agent' },
          nonce: { type: 'string', description: 'Nonce for challenge-response authentication' },
        },
        required: ['agentDid'],
      },
      tags: ['anp', 'auth', 'did', 'handshake'],
    },
    {
      id: 'anp_publish_capability',
      name: 'publish_capability',
      description: 'Publish a PRAXIS tool or skill as a discoverable ANP capability on the network.',
      protocol: 'ANP',
      domain: 'registry',
      inputSchema: {
        type: 'object',
        properties: {
          skillId: { type: 'string', description: 'PRAXIS skill ID to publish' },
          endpoint: { type: 'string', description: 'Publicly reachable endpoint URL' },
          pricingModel: {
            type: 'string',
            enum: ['free', 'metered', 'subscription'],
            description: 'Pricing model',
          },
        },
        required: ['skillId', 'endpoint'],
      },
      tags: ['anp', 'publish', 'capability', 'network'],
    },
  ];

export const SEED_MEMORY_DATA: MemoryItem[] = [
    {
      id: 'mem_001',
      key: 'nexus.version',
      value:
        'PRAXIS v1.0 — Four pillars: Research Swarm, Memory Fabric, Protocol Bridge, Cross-App Orchestrator.',
      type: 'fact',
      tier: 'semantic',
      pinned: true,
      confidence: 1.0,
      source: 'system',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['nexus', 'system'],
    },
    {
      id: 'mem_002',
      key: 'user.preferred_brief_format',
      value:
        'Executive summaries should be ≤300 words, structured as: Context → Key Findings → Risk Flags → Recommended Actions.',
      type: 'preference',
      tier: 'session',
      pinned: true,
      confidence: 0.92,
      source: 'research_swarm',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['preference', 'format', 'research'],
    },
    {
      id: 'mem_003',
      key: 'entity.szl_portfolio',
      value:
        'SZL Holdings portfolio includes: Aegis (defense/intel), Vessels (maritime), Terra (real estate), Pulse (executive briefing), Command (unified HQ), Counsel (legal), Lyte (platform), Imperium (enterprise), Carlota Jo (consulting).',
      type: 'entity',
      tier: 'semantic',
      pinned: false,
      confidence: 1.0,
      source: 'system',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['entity', 'portfolio', 'szl'],
    },
  ];

export const THIRD_PARTY_LEADERS_DATA: ThirdPartyLeader[] = [
  {
    id: 'tpl_hyperframes',
    name: 'HyperFrames',
    sourceRepo: 'HyperFrames',
    sourceUrl: 'https://github.com/hyperframes/hyperframes',
    licenseSpdx: 'MIT',
    capabilitySummary:
      'Programmatic video rendering engine that composes React-based frame sequences into MP4/WebM output with timeline-aware animations, voiceover sync, and export pipelines.',
    capabilityTags: ['video.render', 'animation', 'export', 'react'],
    integrationMode: 'in-process',
    policyState: 'allowed',
    policyNote: 'MIT license; no bundling restrictions. In-process import approved.',
    lastFetchedCommit: 'pending',
    lastFetchedAt: new Date().toISOString(),
    enabled: false,
    logicalCapability: 'video.render',
  },
  {
    id: 'tpl_camofox',
    name: 'Camofox',
    sourceRepo: 'Camofox',
    sourceUrl: 'https://github.com/camofox/camofox',
    licenseSpdx: 'Apache-2.0',
    capabilitySummary:
      'Stealth-browser toolkit that runs headless Chromium with fingerprint randomization, residential proxy rotation, and CAPTCHA-solver hooks — designed for large-scale web intelligence gathering without detection.',
    capabilityTags: ['web.stealth', 'browser', 'scraping', 'fingerprint'],
    integrationMode: 'in-process',
    policyState: 'requires-review',
    policyNote:
      'Apache-2.0 approved for bundling. Policy gate required: stealth-browsing carries legal and ethical risk depending on target domains. Each invocation must pass the PRAXIS policy engine with an explicit use-case justification.',
    lastFetchedCommit: 'pending',
    lastFetchedAt: new Date().toISOString(),
    enabled: false,
    logicalCapability: 'web.stealth',
  },
  {
    id: 'tpl_claude_ads',
    name: 'claude-ads',
    sourceRepo: 'claude-ads',
    sourceUrl: 'https://github.com/anthropics/claude-ads',
    licenseSpdx: 'MIT',
    capabilitySummary:
      'Ad-creative audit and generation skill pack that evaluates copy against brand guidelines, scores emotional resonance, and produces multi-variant ad candidates optimized for platform-specific formats.',
    capabilityTags: ['marketing.audit', 'ad-creative', 'brand', 'copy'],
    integrationMode: 'in-process',
    policyState: 'allowed',
    policyNote: 'MIT license; no bundling restrictions. In-process import approved.',
    lastFetchedCommit: 'pending',
    lastFetchedAt: new Date().toISOString(),
    enabled: false,
    logicalCapability: 'marketing.audit',
  },
  {
    id: 'tpl_toprank',
    name: 'Toprank',
    sourceRepo: 'Toprank',
    sourceUrl: 'https://github.com/toprank/toprank',
    licenseSpdx: 'MIT',
    capabilitySummary:
      'SEO audit and competitive ranking intelligence skill pack: keyword gap analysis, SERP feature detection, backlink scoring, and AI-generated on-page recommendations.',
    capabilityTags: ['seo.audit', 'ranking', 'keywords', 'competitive'],
    integrationMode: 'in-process',
    policyState: 'allowed',
    policyNote: 'MIT license; no bundling restrictions. In-process import approved.',
    lastFetchedCommit: 'pending',
    lastFetchedAt: new Date().toISOString(),
    enabled: false,
    logicalCapability: 'seo.audit',
  },
  {
    id: 'tpl_fincept_terminal',
    name: 'Fincept Terminal',
    sourceRepo: 'fincept-terminal',
    sourceUrl: 'https://github.com/Fincept-Corporation/FinceptTerminal',
    licenseSpdx: 'AGPL-3.0',
    capabilitySummary:
      'Open-source financial data terminal providing real-time market quotes, economic indicators, portfolio analytics, and AI-powered macro research — comparable to Bloomberg Terminal for quantitative workflows.',
    capabilityTags: ['finance.terminal', 'market-data', 'portfolio', 'macro'],
    integrationMode: 'external-service',
    policyState: 'allowed',
    policyNote:
      'AGPL-3.0 — do not bundle. Must be invoked as a remote MCP target (external-service mode). Any modifications must be open-sourced. Approved for external-service integration only.',
    lastFetchedCommit: 'pending',
    lastFetchedAt: new Date().toISOString(),
    enabled: false,
    logicalCapability: 'finance.terminal',
  },
  {
    id: 'tpl_cloudflare_agents',
    name: 'Cloudflare Agents',
    sourceRepo: 'cloudflare-agents',
    sourceUrl: 'https://github.com/cloudflare/agents',
    licenseSpdx: 'Apache-2.0',
    capabilitySummary:
      'Pattern reference for building durable, hibernating per-session agents on Cloudflare Durable Objects. Agents persist state across calls, resume after hibernation, and scale to millions of concurrent sessions without a central orchestrator.',
    capabilityTags: ['pattern-reference', 'durable-objects', 'hibernation', 'edge'],
    integrationMode: 'pattern-reference',
    policyState: 'allowed',
    policyNote:
      'Pattern reference only — no runtime swap in this task. Architecture feeds the PRAXIS Workcell roadmap for durable per-session agent state.',
    lastFetchedCommit: 'pending',
    lastFetchedAt: new Date().toISOString(),
    enabled: false,
    logicalCapability: undefined,
  },
];


