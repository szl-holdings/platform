import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { COOKBOOK, COOKBOOK_CATEGORIES } from '../data/cookbookData';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

const SDK_PRIMITIVES = [
  { name: 'Agent', desc: 'LLM configured with instructions, tools, guardrails, and handoffs. Supports Python and TypeScript runtimes.', status: 'stable', lang: 'py + ts' },
  { name: 'Runner', desc: 'Manages the agent loop — tool invocation, result routing, turn management, and session persistence.', status: 'stable', lang: 'py + ts' },
  { name: 'Handoff', desc: 'Atomic context transfer between agents. Conversation history, tool state, and proof chain move as one unit.', status: 'stable', lang: 'py + ts' },
  { name: 'Guardrail', desc: 'Input/output validation that runs in parallel with agent execution. Fail-fast on policy violations.', status: 'stable', lang: 'py + ts' },
  { name: 'FunctionTool', desc: 'Turn any function into an agent tool with automatic schema generation and Pydantic/Zod validation.', status: 'stable', lang: 'py + ts' },
  { name: 'ResponsesAPI', desc: 'Unified API for text, images, audio, tools, and structured output. Replaces chat completions. Background mode for long-running tasks.', status: 'stable', lang: 'py + ts' },
  { name: 'SandboxAgent', desc: 'Container-based agent with files, commands, packages, ports, snapshots, and memory. Manifest-defined workspace.', status: 'stable', lang: 'py' },
  { name: 'RealtimeAgent', desc: 'Voice agent on WebRTC, WebSocket, or SIP transport. Semantic VAD, interrupt handling, mid-stream tools, transcription.', status: 'stable', lang: 'py + ts' },
  { name: 'Session', desc: 'Persistent memory layer for maintaining working context across turns and agent handoffs.', status: 'stable', lang: 'py + ts' },
  { name: 'Tracer', desc: 'Built-in tracing for visualization, debugging, evaluation, fine-tuning, and distillation.', status: 'stable', lang: 'py + ts' },
  { name: 'MCPServer', desc: 'Model Context Protocol — connect remote MCP servers and OpenAI Connectors as native agent tools.', status: 'stable', lang: 'py + ts' },
  { name: 'Connector', desc: 'OpenAI-maintained MCP wrappers for Google Workspace, Dropbox, Slack, and enterprise services. Governed access.', status: 'stable', lang: 'py + ts' },
  { name: 'BackgroundMode', desc: 'Long-running tasks execute asynchronously. Poll or webhook for completion. Background agent runs with full tool access.', status: 'stable', lang: 'py + ts' },
  { name: 'StructuredOutput', desc: 'Constrained JSON generation with Pydantic/Zod schemas. Guaranteed valid output matching your type definitions.', status: 'stable', lang: 'py + ts' },
  { name: 'EvalRunner', desc: 'Evaluation framework — LLM graders, code graders, human review. Prompt optimizer. External model support.', status: 'stable', lang: 'py + ts' },
  { name: 'FineTuner', desc: 'Supervised fine-tuning, vision fine-tuning, DPO, and reinforcement fine-tuning (RFT). Proof-chained training.', status: 'stable', lang: 'py' },
  { name: 'SkillPack', desc: 'Curated instruction sets that extend agent capabilities. Progressive disclosure — name/desc loaded first, full SKILL.md on use.', status: 'stable', lang: 'py + ts' },
  { name: 'DocsMCP', desc: 'Documentation-as-a-tool-server. Agents query official docs, citations flow back through proof chain.', status: 'stable', lang: 'py + ts' },
  { name: 'CodexThread', desc: 'Programmatic Codex control via SDK. Start threads, run prompts, resume sessions, spawn subagents — all governed.', status: 'stable', lang: 'py + ts' },
  { name: 'HookEngine', desc: 'Extensibility hooks for the agentic loop. PreToolUse, PostToolUse, PermissionRequest, Stop, SessionStart events.', status: 'stable', lang: 'py + ts' },
  { name: 'Subagent', desc: 'Parallel agent spawning for concurrent work. Exploration, review, triage — results summarized back to main thread.', status: 'stable', lang: 'py + ts' },
  { name: 'Chronicle', desc: 'Persistent memory across agent sessions. Governed recall with proof chain on every memory write and retrieval.', status: 'beta', lang: 'py + ts' },
  { name: 'AgentBuilder', desc: 'Visual workflow editor — drag-and-drop agent graphs with ChatKit embeddable UI. No-code to full-code continuum.', status: 'stable', lang: 'web' },
  { name: 'DeepResearch', desc: 'Multi-step autonomous research agent. Searches web, reads documents, synthesizes findings with citations.', status: 'stable', lang: 'py + ts' },
  { name: 'Compactor', desc: 'Context window management — automatic compaction, token counting, and prompt caching for long conversations.', status: 'stable', lang: 'py + ts' },
];

const TOOL_TYPES = [
  {
    name: 'Function Tools',
    desc: 'Any Python function becomes a governed tool. Schema auto-generated from type hints. Pydantic validation on inputs/outputs. Proof chain on every invocation.',
    protocol: 'Native SDK',
    status: 'stable',
    examples: ['vessel_lookup', 'eta_calc', 'sanctions_check', 'deal_score', 'cap_rate'],
    code: `from a11oy import Agent, function_tool

@function_tool
def vessel_lookup(imo: str) -> dict:
    """Look up vessel by IMO number."""
    return fleet_db.get(imo)

agent = Agent(
    name="Maritime Ops",
    tools=[vessel_lookup],
    guardrails=["sanctions_check"],
)`,
  },
  {
    name: 'Hosted Tools',
    desc: 'Pre-built tools: web search, file search, code interpreter, image generation, shell, computer use, apply patch — all governed by proof chain with require_approval control.',
    protocol: 'Responses API',
    status: 'stable',
    examples: ['web_search', 'file_search', 'code_interpreter', 'image_gen', 'shell', 'computer_use'],
    code: `from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5.5",
    tools=[
        {"type": "web_search_preview"},
        {"type": "file_search", "vector_store_ids": ["vs_maritime"]},
        {"type": "code_interpreter"},
    ],
    input="Analyze sanctions risk for vessel IMO 9434761",
)`,
  },
  {
    name: 'Remote MCP Servers',
    desc: 'Connect any remote MCP server via Streamable HTTP or SSE. Tool discovery, allowed_tools filtering, require_approval control, and governed by the Connector Firewall.',
    protocol: 'MCP (Streamable HTTP / SSE)',
    status: 'stable',
    examples: ['github_mcp', 'postgres_mcp', 'slack_mcp', 'a11oy_docs', 'codex_mcp'],
    code: `from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5.5",
    tools=[{
        "type": "mcp",
        "server_label": "a11oy-docs",
        "server_url": "https://mcp.a11oy.dev/docs/sse",
        "require_approval": "never",
        "allowed_tools": ["search_docs", "get_page"],
    }],
    input="How do I configure guardrails?",
)`,
  },
  {
    name: 'Connectors',
    desc: 'OpenAI-maintained MCP wrappers for enterprise services — Google Workspace, Dropbox, SharePoint, Confluence, Notion. OAuth-authenticated, governed by proof chain.',
    protocol: 'Connector API',
    status: 'stable',
    examples: ['connector_google_drive', 'connector_dropbox', 'connector_sharepoint', 'connector_confluence'],
    code: `from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5.5",
    tools=[{
        "type": "mcp",
        "server_label": "Google Drive",
        "connector_id": "connector_google_drive",
        "authorization": google_oauth_token,
        "require_approval": "never",
    }],
    input="Summarize the Q2 earnings report.",
)`,
  },
  {
    name: 'Agents as Tools',
    desc: 'Any agent can be used as a callable tool by another agent. The caller invokes the specialist, receives structured output, and retains control. Different from handoffs.',
    protocol: 'Native SDK',
    status: 'stable',
    examples: ['legal_reviewer', 'code_auditor', 'risk_scorer', 'deep_researcher'],
    code: `from a11oy import Agent

legal_review = Agent(
    name="Legal Reviewer",
    instructions="Review contracts for compliance",
    output_type=RiskReport,
)

deal_agent = Agent(
    name="Deal Processor",
    tools=[legal_review.as_tool(
        description="Get legal risk assessment",
    )],
)`,
  },
  {
    name: 'Shell & Computer Use',
    desc: 'Agents run shell commands in governed sandboxes and interact with UIs via computer use — screenshots, mouse/keyboard, DOM interaction. Full proof chain audit trail.',
    protocol: 'Responses API',
    status: 'stable',
    examples: ['shell_exec', 'computer_use', 'apply_patch', 'browser_action'],
    code: `from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5.5",
    tools=[
        {"type": "shell", "container": {"image": "a11oy/sandbox:latest"}},
        {"type": "computer_use_preview", "display_width": 1280},
    ],
    input="Run the test suite and fix any failures",
)`,
  },
  {
    name: 'Deep Research',
    desc: 'Multi-step autonomous research agent. Searches the web, reads documents, synthesizes findings with citations. Background mode for long-running queries.',
    protocol: 'Responses API',
    status: 'stable',
    examples: ['market_research', 'competitive_intel', 'regulatory_scan', 'tech_landscape'],
    code: `from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="o3-deep-research",
    input="Research maritime sanctions enforcement "
          "trends across OFAC, EU, and UK regimes. "
          "Include case studies from 2024-2026.",
    tools=[{"type": "web_search_preview"}],
)`,
  },
  {
    name: 'Image & Video Generation',
    desc: 'Generate images (gpt-image-1) and video (sora) as governed tool calls. Proof chain on every generation. Content moderation and safety checks built in.',
    protocol: 'Responses API',
    status: 'stable',
    examples: ['image_gen', 'video_gen', 'image_edit', 'background_remove'],
    code: `from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5.5",
    tools=[{"type": "image_generation"}],
    input="Generate an architectural visualization "
          "of the portfolio property at 200 Park Ave",
)`,
  },
];

const EVAL_FRAMEWORK = {
  graderTypes: [
    { name: 'LLM Grader', desc: 'Use an LLM to judge output quality against criteria. Supports multi-dimension scoring.', usage: 847, accuracy: '94.2%' },
    { name: 'Code Grader', desc: 'Programmatic evaluation — exact match, regex, custom scoring functions. Fastest and most deterministic.', usage: 2341, accuracy: '99.8%' },
    { name: 'Human Grader', desc: 'Queue outputs for human evaluation. Supports rating scales, binary accept/reject, and comparative ranking.', usage: 312, accuracy: '97.1%' },
    { name: 'MirrorEval', desc: 'a11oy\'s proprietary continuous evaluator. Runs automatically on every agent output. Detects bias, drift, and regression.', usage: 12847, accuracy: '96.3%' },
  ],
  evalSuites: [
    { name: 'Maritime Compliance', tests: 847, passing: 841, type: 'Domain', lastRun: '2h ago' },
    { name: 'Legal Risk Accuracy', tests: 423, passing: 419, type: 'Domain', lastRun: '4h ago' },
    { name: 'Threat Intel Classification', tests: 1203, passing: 1198, type: 'Domain', lastRun: '1h ago' },
    { name: 'Guardrail Effectiveness', tests: 2847, passing: 2847, type: 'Safety', lastRun: '30m ago' },
    { name: 'Handoff Correctness', tests: 634, passing: 632, type: 'System', lastRun: '1h ago' },
    { name: 'Proof Chain Integrity', tests: 4201, passing: 4201, type: 'System', lastRun: '15m ago' },
    { name: 'Bias Detection', tests: 1847, passing: 1839, type: 'Fairness', lastRun: '3h ago' },
    { name: 'Cost Efficiency', tests: 312, passing: 308, type: 'Operations', lastRun: '6h ago' },
  ],
};

const FINETUNE_REGISTRY = [
  { name: 'maritime-sanctions-v4', baseModel: 'gpt-4o-mini', method: 'SFT', dataset: '12,847 examples', status: 'deployed', accuracy: '97.8%', cost: '$42', proofHash: '0x4a2f...c891' },
  { name: 'legal-risk-classifier-v3', baseModel: 'gpt-4o-mini', method: 'SFT', dataset: '8,421 examples', status: 'deployed', accuracy: '96.2%', cost: '$31', proofHash: '0x7b3e...d412' },
  { name: 'threat-triage-v2', baseModel: 'gpt-4o-mini', method: 'SFT', dataset: '6,203 examples', status: 'deployed', accuracy: '95.4%', cost: '$28', proofHash: '0x2c81...f7a3' },
  { name: 'compliance-dpo-v1', baseModel: 'gpt-4o', method: 'DPO', dataset: '4,128 pairs', status: 'deployed', accuracy: '98.1%', cost: '$89', proofHash: '0x9d4a...e207' },
  { name: 'vessel-vision-v2', baseModel: 'gpt-4o', method: 'Vision FT', dataset: '6,842 images', status: 'deployed', accuracy: '96.7%', cost: '$124', proofHash: '0x1f8b...a341' },
  { name: 'deal-scorer-v5', baseModel: 'gpt-4o-mini', method: 'SFT', dataset: '4,892 examples', status: 'training', accuracy: '—', cost: '$19', proofHash: '—' },
  { name: 'threat-rft-v1', baseModel: 'o3-mini', method: 'RFT', dataset: '2,847 trajectories', status: 'evaluating', accuracy: '94.3%', cost: '$203', proofHash: '—' },
  { name: 'vessel-anomaly-v1', baseModel: 'gpt-4o-mini', method: 'SFT', dataset: '3,412 examples', status: 'evaluating', accuracy: '93.1%', cost: '$14', proofHash: '—' },
  { name: 'portfolio-dpo-v1', baseModel: 'gpt-4o', method: 'DPO', dataset: '3,204 pairs', status: 'training', accuracy: '—', cost: '$67', proofHash: '—' },
];

const SKILLS_REGISTRY = [
  { name: 'openai-docs', desc: 'Query OpenAI documentation. Agents consult docs before answering API questions. Citation-backed.', source: 'OpenAI', installed: true, version: '1.2.0', tools: ['search_docs', 'get_page', 'list_sections'], branch: 'vb/add-openai-docs-skill' },
  { name: 'migrate-to-codex', desc: 'Automated migration skill — convert existing agent codebases to use OpenAI Codex SDK patterns, sandbox manifests, and governed execution.', source: 'OpenAI', installed: true, version: '1.0.0', tools: ['analyze_codebase', 'generate_manifest', 'migrate_agent', 'validate_sandbox'], branch: 'baumann-oai/add-migrate-to-codex-skill' },
  { name: 'codex-chrome-native', desc: 'Chrome-native Codex integration — run Codex agents inside browser context with DOM access, screenshot capture, and governed web interaction.', source: 'OpenAI', installed: true, version: '0.9.0', tools: ['chrome_exec', 'dom_query', 'screenshot', 'navigate'], branch: 'codex/setup-codex-chrome-native-skill' },
  { name: 'shadcn-system', desc: 'ShadCN/UI component system — agents generate, customize, and compose ShadCN components with proper Tailwind tokens and accessibility.', source: 'OpenAI', installed: true, version: '1.1.0', tools: ['create_component', 'customize_theme', 'compose_layout', 'a11y_check'], branch: 'vb/add-shadcn-system-skill' },
  { name: 'figma-update', desc: 'Figma integration — agents read Figma designs, extract tokens, generate code from frames, and push updates back.', source: 'OpenAI', installed: true, version: '1.0.0', tools: ['read_frame', 'extract_tokens', 'generate_code', 'push_update'], branch: 'vb/figma-update-skills' },
  { name: 'sentry-ops', desc: 'Sentry error tracking — agents query errors, analyze stack traces, suggest fixes, and auto-triage incidents.', source: 'OpenAI', installed: true, version: '1.0.0', tools: ['query_errors', 'analyze_trace', 'suggest_fix', 'auto_triage'], branch: 'vb/add-sentry-skill' },
  { name: 'pet-creator', desc: 'Generative AI pet creator — multi-modal image generation with guided prompts, style transfer, and breed-specific templates.', source: 'OpenAI', installed: false, version: '0.8.0', tools: ['generate_pet', 'apply_style', 'breed_template'], branch: 'guinness/pet-creator-skill' },
  { name: 'fax-machine', desc: 'Document processing pipeline — OCR extraction, fax-to-digital conversion, structured data output, and compliance archival.', source: 'OpenAI', installed: true, version: '0.9.0', tools: ['ocr_extract', 'convert_fax', 'structure_data', 'archive_doc'], branch: 'codex/fax-machine-skill' },
  { name: 'huggingface-hub', desc: 'HuggingFace Hub integration — model discovery, inference endpoints, dataset management, model evaluation, GGUF quantization, Spaces deployment.', source: 'HuggingFace', installed: true, version: '2.0.0', tools: ['search_models', 'create_endpoint', 'upload_dataset', 'run_eval', 'quantize_model', 'deploy_space'] },
  { name: 'hf-transformers', desc: 'Transformers pipeline — run local inference, tokenization, embedding generation, and model comparison using HuggingFace Transformers.', source: 'HuggingFace', installed: true, version: '1.8.0', tools: ['run_pipeline', 'tokenize', 'embed_text', 'compare_models', 'load_adapter'] },
  { name: 'hf-datasets', desc: 'HuggingFace Datasets — load, filter, split, and stream datasets for fine-tuning and evaluation pipelines.', source: 'HuggingFace', installed: true, version: '1.5.0', tools: ['load_dataset', 'filter_rows', 'create_split', 'stream_batch'] },
  { name: 'maritime-ops', desc: 'Maritime domain knowledge — vessel tracking, port operations, sanctions screening, route optimization.', source: 'a11oy', installed: true, version: '4.1.0', tools: ['vessel_lookup', 'port_info', 'route_calc', 'sanctions_check'] },
  { name: 'legal-compliance', desc: 'Legal domain — contract review, deadline tracking, risk assessment, obligation extraction.', source: 'a11oy', installed: true, version: '3.2.0', tools: ['contract_review', 'deadline_scan', 'risk_score', 'obligation_graph'] },
  { name: 'threat-intel', desc: 'Cybersecurity — STIX/TAXII feeds, CVE analysis, posture assessment, incident triage.', source: 'a11oy', installed: true, version: '2.8.0', tools: ['stix_parse', 'cve_lookup', 'posture_assess', 'incident_triage'] },
  { name: 'real-estate', desc: 'Real estate intelligence — cap rates, portfolio analysis, valuation models, market comparables.', source: 'a11oy', installed: true, version: '2.1.0', tools: ['cap_rate', 'valuation', 'market_comp', 'portfolio_analysis'] },
  { name: 'github-ops', desc: 'GitHub integration — PR management, issue tracking, code review, repository analysis.', source: 'Community', installed: true, version: '1.4.0', tools: ['create_pr', 'list_issues', 'review_code', 'repo_stats'] },
  { name: 'postgres-admin', desc: 'PostgreSQL administration — query execution, schema inspection, performance analysis.', source: 'Community', installed: true, version: '1.1.0', tools: ['run_query', 'inspect_schema', 'explain_plan'] },
  { name: 'slack-notify', desc: 'Slack integration — send messages, create channels, manage threads, file uploads.', source: 'Community', installed: true, version: '1.3.0', tools: ['send_message', 'create_channel', 'upload_file'] },
  { name: 'data-viz', desc: 'Data visualization — chart generation, dashboard components, CSV/JSON analysis.', source: 'Community', installed: false, version: '0.9.0', tools: ['create_chart', 'analyze_csv', 'build_dashboard'] },
  { name: 'email-compose', desc: 'Email composition — draft generation, template management, compliance review.', source: 'Community', installed: false, version: '0.7.0', tools: ['draft_email', 'apply_template', 'compliance_check'] },
];

const MCP_SERVERS = [
  { name: 'a11oy-docs', transport: 'stdio', status: 'active', tools: 6, calls: 4892, desc: 'a11oy platform documentation — agents query docs first for platform questions' },
  { name: 'openai-docs', transport: 'sse', status: 'active', tools: 4, calls: 2341, desc: 'OpenAI official documentation via MCP — citation-backed answers traceable to docs sources' },
  { name: 'github', transport: 'sse', status: 'active', tools: 12, calls: 8921, desc: 'GitHub API — PR management, issue tracking, code search, repository operations' },
  { name: 'postgres', transport: 'stdio', status: 'active', tools: 5, calls: 3412, desc: 'PostgreSQL — governed query execution, schema inspection, migration planning' },
  { name: 'slack', transport: 'sse', status: 'active', tools: 8, calls: 2103, desc: 'Slack — message dispatch, channel management, thread operations' },
  { name: 'jira', transport: 'sse', status: 'active', tools: 7, calls: 1847, desc: 'Jira — issue CRUD, sprint management, backlog grooming' },
  { name: 'stripe', transport: 'sse', status: 'active', tools: 9, calls: 892, desc: 'Stripe — payment processing, subscription management, invoice generation' },
  { name: 'browserbase', transport: 'sse', status: 'active', tools: 4, calls: 567, desc: 'Browser automation — web scraping, screenshot capture, form filling' },
  { name: 'sentry', transport: 'sse', status: 'standby', tools: 5, calls: 234, desc: 'Sentry — error tracking, performance monitoring, release management' },
  { name: 'linear', transport: 'sse', status: 'standby', tools: 6, calls: 189, desc: 'Linear — issue tracking, project management, cycle planning' },
  { name: 'huggingface-hub', transport: 'sse', status: 'active', tools: 12, calls: 6847, desc: 'HuggingFace Hub — model discovery, inference endpoints, dataset hosting, model evaluation, GGUF quantization' },
  { name: 'hf-inference', transport: 'sse', status: 'active', tools: 8, calls: 4231, desc: 'HuggingFace Inference — serverless inference, dedicated endpoints, embedding generation, multimodal pipelines' },
  { name: 'figma', transport: 'sse', status: 'active', tools: 6, calls: 1203, desc: 'Figma — design token extraction, frame reading, code generation, component introspection' },
  { name: 'chrome-native', transport: 'stdio', status: 'active', tools: 5, calls: 892, desc: 'Chrome DevTools — DOM query, screenshot capture, network inspection, governed browser automation' },
  { name: 'codex', transport: 'stdio', status: 'active', tools: 3, calls: 8421, desc: 'OpenAI Codex as MCP server — codex tool (run sessions), codex_memory tool (Chronicle), approval-policy control' },
  { name: 'google-drive', transport: 'connector', status: 'active', tools: 8, calls: 3847, desc: 'Google Drive connector — search, read, create, update documents and spreadsheets via OAuth' },
  { name: 'dropbox', transport: 'connector', status: 'active', tools: 6, calls: 1203, desc: 'Dropbox connector — file search, read, upload, and share with governed access control' },
  { name: 'sharepoint', transport: 'connector', status: 'active', tools: 7, calls: 2104, desc: 'SharePoint connector — site search, document libraries, list items, and page content' },
  { name: 'confluence', transport: 'connector', status: 'active', tools: 5, calls: 1892, desc: 'Confluence connector — space search, page content, attachments, and inline comments' },
  { name: 'notion', transport: 'connector', status: 'standby', tools: 6, calls: 421, desc: 'Notion connector — database queries, page content, block manipulation, and workspace search' },
];

const GUIDES = [
  { title: 'Quickstart', desc: 'Build your first governed agent in 5 minutes', category: 'Getting Started', difficulty: 'Beginner' },
  { title: 'Function Tools', desc: 'Turn any function into an agent tool with automatic schema generation', category: 'Tools', difficulty: 'Beginner' },
  { title: 'Hosted Tools', desc: 'Web search, file search, code interpreter — pre-built and governed', category: 'Tools', difficulty: 'Beginner' },
  { title: 'MCP Integration', desc: 'Connect Model Context Protocol servers as native tool providers', category: 'Tools', difficulty: 'Intermediate' },
  { title: 'Agents as Tools', desc: 'Use specialist agents as callable tools within other agents', category: 'Tools', difficulty: 'Intermediate' },
  { title: 'Tool Governance', desc: 'Access control, rate limiting, cost tracking, and proof chains for tools', category: 'Tools', difficulty: 'Advanced' },
  { title: 'Evaluation Basics', desc: 'Score agent outputs with LLM, code, and human graders', category: 'Evals', difficulty: 'Beginner' },
  { title: 'Custom Graders', desc: 'Build domain-specific evaluation criteria and scoring rubrics', category: 'Evals', difficulty: 'Intermediate' },
  { title: 'Continuous Evals', desc: 'Run MirrorEval on every agent output — detect drift and regression', category: 'Evals', difficulty: 'Advanced' },
  { title: 'Eval-Driven Development', desc: 'Write evals first, then build agents — test-driven agentic development', category: 'Evals', difficulty: 'Advanced' },
  { title: 'Fine-Tuning Basics', desc: 'Fine-tune models on governed datasets with proof-chained training runs', category: 'Fine-Tuning', difficulty: 'Intermediate' },
  { title: 'Dataset Curation', desc: 'Build training datasets from agent traces, eval results, and human feedback', category: 'Fine-Tuning', difficulty: 'Intermediate' },
  { title: 'Distillation Pipeline', desc: 'Distill expensive model outputs into smaller, faster, cheaper models', category: 'Fine-Tuning', difficulty: 'Advanced' },
  { title: 'Skills & Skill Packs', desc: 'Install, compose, and version-control domain skills for agents', category: 'Skills', difficulty: 'Beginner' },
  { title: 'Building Custom Skills', desc: 'Create reusable skill packs with instructions, tools, and guardrails', category: 'Skills', difficulty: 'Intermediate' },
  { title: 'Docs MCP Server', desc: 'Give agents access to official documentation via MCP — citation-backed answers', category: 'Skills', difficulty: 'Intermediate' },
  { title: 'Multi-Agent Orchestration', desc: 'Manager pattern vs. handoff pattern — when to use each', category: 'Architecture', difficulty: 'Advanced' },
  { title: 'Guardrails & Safety', desc: 'Input validation, output filtering, PII redaction, cost limits', category: 'Safety', difficulty: 'Intermediate' },
  { title: 'Sandbox Agents', desc: 'Run agents in isolated workspaces with manifest-defined files', category: 'Architecture', difficulty: 'Advanced' },
  { title: 'Realtime Voice', desc: 'Build low-latency voice agents with semantic VAD and tool execution', category: 'Voice', difficulty: 'Advanced' },
  { title: 'Sessions & Memory', desc: 'Persistent context across turns, handoffs, and resumable runs', category: 'Architecture', difficulty: 'Intermediate' },
  { title: 'Tracing & Observability', desc: 'Visualize agent flows, debug decisions, monitor in production', category: 'Observability', difficulty: 'Intermediate' },
  { title: 'Proof Chain Integration', desc: 'Attach cryptographic proofs to every agent decision and action', category: 'Governance', difficulty: 'Advanced' },
  { title: 'Vertical Domain Packs', desc: 'Pre-configured agent teams for Maritime, Defense, Legal, Real Estate', category: 'Verticals', difficulty: 'Intermediate' },
  { title: 'HuggingFace Hub Integration', desc: 'Connect to 800K+ open models — discovery, inference endpoints, governed model selection', category: 'HuggingFace', difficulty: 'Beginner' },
  { title: 'HuggingFace Inference Endpoints', desc: 'Deploy fine-tuned models as governed inference endpoints with auto-scaling and proof chain', category: 'HuggingFace', difficulty: 'Intermediate' },
  { title: 'Open Model Fine-Tuning', desc: 'Fine-tune open models on HuggingFace with governed datasets and proof-chained training', category: 'HuggingFace', difficulty: 'Advanced' },
  { title: 'GGUF Quantization Pipeline', desc: 'Quantize models to GGUF format for edge deployment with governed quality validation', category: 'HuggingFace', difficulty: 'Advanced' },
  { title: 'Migrate to Codex', desc: 'Convert existing agent codebases to use OpenAI Codex SDK patterns and sandbox manifests', category: 'Skills', difficulty: 'Intermediate' },
  { title: 'ShadCN Component System', desc: 'Generate and compose ShadCN/UI components from agent instructions with a11y compliance', category: 'Skills', difficulty: 'Beginner' },
  { title: 'Figma-to-Code Pipeline', desc: 'Extract design tokens from Figma frames and generate governed React components', category: 'Skills', difficulty: 'Intermediate' },
  { title: 'Sentry Error Triage', desc: 'Auto-triage production errors — agents analyze stack traces and suggest governed fixes', category: 'Skills', difficulty: 'Intermediate' },
  { title: 'Chrome Native Agents', desc: 'Run agents inside browser context with DOM access and governed web interaction', category: 'Skills', difficulty: 'Advanced' },
  { title: 'Document Processing (Fax)', desc: 'OCR extraction, fax-to-digital conversion, and compliance archival pipeline', category: 'Skills', difficulty: 'Intermediate' },
  { title: 'Codex SDK Integration', desc: 'Control Codex programmatically via TypeScript/Python SDK — thread.run(), resume, and CI/CD pipelines', category: 'Codex', difficulty: 'Intermediate' },
  { title: 'Codex as MCP Server', desc: 'Run Codex as an MCP server (codex mcp-server) — any Agents SDK agent can call Codex as a tool', category: 'Codex', difficulty: 'Advanced' },
  { title: 'Codex Subagent Workflows', desc: 'Spawn parallel subagents for concurrent exploration, review, and triage — keep main thread clean', category: 'Codex', difficulty: 'Advanced' },
  { title: 'Codex Hooks & Governance', desc: 'Inject proof chain via hooks.json — PreToolUse, PostToolUse, PermissionRequest, Stop events', category: 'Codex', difficulty: 'Advanced' },
  { title: 'Codex Skills & Plugins', desc: 'Package governed workflows as installable Codex skills with SKILL.md and openai.yaml', category: 'Codex', difficulty: 'Intermediate' },
  { title: 'Codex Memories & Chronicle', desc: 'Persistent memory across sessions — Chronicle summarizes decisions for governed recall', category: 'Codex', difficulty: 'Intermediate' },
  { title: 'Codex Cloud Environments', desc: 'Configure sandboxed cloud environments — setup scripts, internet access, worktree isolation', category: 'Codex', difficulty: 'Intermediate' },
  { title: 'Codex Enterprise Governance', desc: 'Admin setup, managed config, agent approvals, security policies, and audit trails', category: 'Codex', difficulty: 'Advanced' },
  { title: 'Codex Non-Interactive Mode', desc: 'Run Codex headless in CI/CD — GitHub Actions, batch processing, automated PR workflows', category: 'Codex', difficulty: 'Intermediate' },
  { title: 'Codex Computer Use', desc: 'Browser automation, screenshot capture, DOM interaction — agents see and interact with UIs', category: 'Codex', difficulty: 'Advanced' },
  { title: 'Responses API', desc: 'Unified API for text, images, audio, tools, and structured output — replaces chat completions', category: 'Core API', difficulty: 'Beginner' },
  { title: 'Structured Output', desc: 'Constrained JSON generation with Pydantic/Zod schemas — guaranteed valid output', category: 'Core API', difficulty: 'Beginner' },
  { title: 'Function Calling', desc: 'Let models invoke your functions with auto-generated schemas and validation', category: 'Core API', difficulty: 'Beginner' },
  { title: 'Streaming & Webhooks', desc: 'Server-sent events, WebSocket mode, and webhook delivery for agent outputs', category: 'Core API', difficulty: 'Intermediate' },
  { title: 'Conversation State', desc: 'Manage multi-turn conversations with previous_response_id and context persistence', category: 'Core API', difficulty: 'Intermediate' },
  { title: 'Background Mode', desc: 'Long-running agentic tasks — async execution with polling or webhook completion', category: 'Core API', difficulty: 'Intermediate' },
  { title: 'Prompt Caching', desc: 'Automatic context caching for repeated prompts — reduce latency and cost by 50-80%', category: 'Core API', difficulty: 'Intermediate' },
  { title: 'Reasoning Models', desc: 'o3, o4-mini, o3-deep-research — chain-of-thought reasoning with safety summaries', category: 'Core API', difficulty: 'Advanced' },
  { title: 'Connectors', desc: 'OpenAI-maintained MCP wrappers — Google Drive, Dropbox, SharePoint, Confluence, Notion', category: 'Connectors', difficulty: 'Beginner' },
  { title: 'Connector OAuth Flow', desc: 'Implement OAuth token exchange for enterprise connectors with governed access', category: 'Connectors', difficulty: 'Intermediate' },
  { title: 'Connector Approval Flow', desc: 'Configure require_approval for connector tool calls — always, never, or per-tool', category: 'Connectors', difficulty: 'Intermediate' },
  { title: 'Realtime WebRTC', desc: 'Build voice agents with WebRTC — lowest latency, browser-native, peer-to-peer', category: 'Realtime', difficulty: 'Advanced' },
  { title: 'Realtime WebSocket', desc: 'Server-side voice agents over WebSocket — full control, tool execution mid-stream', category: 'Realtime', difficulty: 'Advanced' },
  { title: 'Realtime SIP', desc: 'Connect agents to telephony via SIP — IVR, call centers, voice assistants over PSTN', category: 'Realtime', difficulty: 'Advanced' },
  { title: 'Realtime Transcription', desc: 'Low-latency speech-to-text with semantic VAD, partial results, and speaker diarization', category: 'Realtime', difficulty: 'Intermediate' },
  { title: 'Web Search Tool', desc: 'Ground agent responses in live web data — search, crawl, and cite sources', category: 'Built-in Tools', difficulty: 'Beginner' },
  { title: 'File Search & Retrieval', desc: 'Vector-based search over uploaded documents — RAG with governed vector stores', category: 'Built-in Tools', difficulty: 'Intermediate' },
  { title: 'Code Interpreter', desc: 'Execute Python code in sandboxed environments — data analysis, visualization, computation', category: 'Built-in Tools', difficulty: 'Beginner' },
  { title: 'Shell Tool', desc: 'Run shell commands in governed containers — build, test, deploy, and automate', category: 'Built-in Tools', difficulty: 'Intermediate' },
  { title: 'Computer Use', desc: 'Agents interact with GUIs — screenshots, mouse, keyboard, DOM actions', category: 'Built-in Tools', difficulty: 'Advanced' },
  { title: 'Apply Patch', desc: 'Agents make targeted code changes using unified diff format with governed review', category: 'Built-in Tools', difficulty: 'Intermediate' },
  { title: 'Tool Search', desc: 'Dynamic tool discovery — agents search available tools by capability description', category: 'Built-in Tools', difficulty: 'Intermediate' },
  { title: 'DPO Fine-Tuning', desc: 'Direct Preference Optimization — train models on preference pairs for alignment', category: 'Model Optimization', difficulty: 'Advanced' },
  { title: 'Reinforcement Fine-Tuning', desc: 'RFT — train reasoning models on multi-step trajectories with grader rewards', category: 'Model Optimization', difficulty: 'Advanced' },
  { title: 'Vision Fine-Tuning', desc: 'Fine-tune vision models on image-text pairs for domain-specific visual understanding', category: 'Model Optimization', difficulty: 'Advanced' },
  { title: 'Prompt Optimizer', desc: 'Automatically improve prompts using eval results — systematic prompt engineering', category: 'Model Optimization', difficulty: 'Intermediate' },
  { title: 'Image Generation API', desc: 'Generate and edit images with gpt-image-1 — text-to-image, inpainting, style transfer', category: 'Specialized Models', difficulty: 'Beginner' },
  { title: 'Video Generation API', desc: 'Generate video with Sora — text-to-video, image-to-video, storyboard sequences', category: 'Specialized Models', difficulty: 'Intermediate' },
  { title: 'Text to Speech', desc: 'Generate natural speech with gpt-4o-mini-tts — voice cloning, emotion, streaming', category: 'Specialized Models', difficulty: 'Beginner' },
  { title: 'Speech to Text', desc: 'Transcribe audio with gpt-4o-transcribe — real-time, multi-language, timestamps', category: 'Specialized Models', difficulty: 'Beginner' },
  { title: 'Embeddings', desc: 'Generate text embeddings for semantic search, clustering, and classification', category: 'Specialized Models', difficulty: 'Beginner' },
  { title: 'Moderation API', desc: 'Content moderation for text and images — categories, scores, and policy enforcement', category: 'Safety', difficulty: 'Beginner' },
  { title: 'Safety Best Practices', desc: 'System prompts, guardrails, and output filtering for production agent safety', category: 'Safety', difficulty: 'Intermediate' },
  { title: 'Production Deployment', desc: 'Deployment checklist, latency optimization, cost optimization, and scaling', category: 'Going Live', difficulty: 'Intermediate' },
  { title: 'Batch & Flex Processing', desc: 'Cost-optimized batch processing — 50% savings with 24h SLA, Flex for variable load', category: 'Going Live', difficulty: 'Intermediate' },
  { title: 'Predicted Outputs', desc: 'Reduce latency by providing expected output structure — model confirms or corrects', category: 'Going Live', difficulty: 'Advanced' },
];

const API_ENDPOINTS = [
  { method: 'POST', path: '/v1/responses', desc: 'Create a model response (Responses API)', auth: 'Bearer' },
  { method: 'GET', path: '/v1/responses/{id}', desc: 'Retrieve a response by ID', auth: 'Bearer' },
  { method: 'DELETE', path: '/v1/responses/{id}', desc: 'Delete a stored response', auth: 'Bearer' },
  { method: 'POST', path: '/v1/responses/{id}/cancel', desc: 'Cancel a background response', auth: 'Bearer' },
  { method: 'GET', path: '/v1/responses/{id}/input_items', desc: 'List input items for a response', auth: 'Bearer' },
  { method: 'POST', path: '/v1/agents', desc: 'Register a governed agent', auth: 'Bearer' },
  { method: 'POST', path: '/v1/agents/{id}/run', desc: 'Execute an agent run', auth: 'Bearer' },
  { method: 'POST', path: '/v1/agents/{id}/stream', desc: 'Stream agent execution events', auth: 'Bearer' },
  { method: 'POST', path: '/v1/handoffs', desc: 'Execute a governed handoff', auth: 'Bearer' },
  { method: 'GET', path: '/v1/sessions/{id}', desc: 'Retrieve session state', auth: 'Bearer' },
  { method: 'POST', path: '/v1/guardrails/check', desc: 'Run guardrail validation', auth: 'Bearer' },
  { method: 'GET', path: '/v1/traces/{run_id}', desc: 'Get execution trace', auth: 'Bearer' },
  { method: 'POST', path: '/v1/realtime/sessions', desc: 'Create realtime session (WebRTC/WebSocket)', auth: 'Bearer' },
  { method: 'POST', path: '/v1/realtime/transcription_sessions', desc: 'Create transcription session', auth: 'Bearer' },
  { method: 'GET', path: '/v1/tools', desc: 'List registered tools', auth: 'Bearer' },
  { method: 'POST', path: '/v1/tools/mcp/connect', desc: 'Connect a remote MCP server', auth: 'Bearer' },
  { method: 'POST', path: '/v1/connectors/{id}/authorize', desc: 'Authorize a connector (OAuth)', auth: 'Bearer' },
  { method: 'POST', path: '/v1/evals', desc: 'Create an evaluation', auth: 'Bearer' },
  { method: 'POST', path: '/v1/evals/{id}/runs', desc: 'Create an evaluation run', auth: 'Bearer' },
  { method: 'GET', path: '/v1/evals/{id}/runs/{run_id}', desc: 'Get eval run results', auth: 'Bearer' },
  { method: 'POST', path: '/v1/fine_tuning/jobs', desc: 'Create fine-tuning job (SFT/DPO/RFT)', auth: 'Bearer' },
  { method: 'GET', path: '/v1/fine_tuning/jobs/{id}', desc: 'Get fine-tuning job status', auth: 'Bearer' },
  { method: 'GET', path: '/v1/fine_tuning/jobs/{id}/checkpoints', desc: 'List fine-tuning checkpoints', auth: 'Bearer' },
  { method: 'POST', path: '/v1/images/generations', desc: 'Generate images (gpt-image-1)', auth: 'Bearer' },
  { method: 'POST', path: '/v1/images/edits', desc: 'Edit images with inpainting/masking', auth: 'Bearer' },
  { method: 'POST', path: '/v1/video/generations', desc: 'Generate video (Sora)', auth: 'Bearer' },
  { method: 'POST', path: '/v1/audio/speech', desc: 'Text-to-speech (gpt-4o-mini-tts)', auth: 'Bearer' },
  { method: 'POST', path: '/v1/audio/transcriptions', desc: 'Speech-to-text transcription', auth: 'Bearer' },
  { method: 'POST', path: '/v1/embeddings', desc: 'Generate text embeddings', auth: 'Bearer' },
  { method: 'POST', path: '/v1/moderations', desc: 'Content moderation check', auth: 'Bearer' },
  { method: 'POST', path: '/v1/vector_stores', desc: 'Create a vector store for file search', auth: 'Bearer' },
  { method: 'POST', path: '/v1/vector_stores/{id}/files', desc: 'Upload files to vector store', auth: 'Bearer' },
  { method: 'POST', path: '/v1/skills/install', desc: 'Install a skill pack', auth: 'Bearer' },
  { method: 'GET', path: '/v1/skills', desc: 'List installed skills', auth: 'Bearer' },
  { method: 'POST', path: '/v1/skills/create', desc: 'Create a custom skill pack', auth: 'Bearer' },
  { method: 'POST', path: '/v1/proofs/verify', desc: 'Verify proof chain hash', auth: 'Bearer' },
  { method: 'POST', path: '/v1/hf/models/search', desc: 'Search HuggingFace model hub', auth: 'Bearer' },
  { method: 'POST', path: '/v1/hf/endpoints', desc: 'Create governed inference endpoint', auth: 'Bearer' },
  { method: 'POST', path: '/v1/hf/inference', desc: 'Run inference on HF model', auth: 'Bearer' },
  { method: 'POST', path: '/v1/hf/datasets', desc: 'Upload governed training dataset', auth: 'Bearer' },
  { method: 'POST', path: '/v1/mesh/route', desc: 'Route task through Agent Mesh', auth: 'Bearer' },
  { method: 'GET', path: '/v1/mesh/agents', desc: 'List mesh-connected agents', auth: 'Bearer' },
  { method: 'POST', path: '/v1/codex/threads', desc: 'Start a Codex thread (SDK)', auth: 'Bearer' },
  { method: 'POST', path: '/v1/codex/threads/{id}/run', desc: 'Run prompt on Codex thread', auth: 'Bearer' },
  { method: 'POST', path: '/v1/codex/threads/{id}/resume', desc: 'Resume a past Codex thread', auth: 'Bearer' },
  { method: 'POST', path: '/v1/codex/subagents', desc: 'Spawn parallel Codex subagents', auth: 'Bearer' },
  { method: 'POST', path: '/v1/codex/hooks', desc: 'Register governance hooks', auth: 'Bearer' },
  { method: 'GET', path: '/v1/codex/memories', desc: 'Query Chronicle memories', auth: 'Bearer' },
  { method: 'POST', path: '/v1/batches', desc: 'Create batch processing job (50% cost)', auth: 'Bearer' },
  { method: 'GET', path: '/v1/batches/{id}', desc: 'Get batch job status', auth: 'Bearer' },
];

export function DevPlatform() {
  const [tab, setTab] = useState<'primitives' | 'tools' | 'evals' | 'finetune' | 'skills' | 'mcp' | 'guides' | 'api' | 'cookbook'>('primitives');
  const [catFilter, setCatFilter] = useState<string>('All');
  const [skillsFilter, setSkillsFilter] = useState<string>('All');
  const [selectedToolType, setSelectedToolType] = useState(0);
  const [cookbookFilter, setCookbookFilter] = useState<string>('All');
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);
  const filteredCookbook = cookbookFilter === 'All' ? COOKBOOK : COOKBOOK.filter(r => r.category === cookbookFilter);
  const categories = ['All', ...Array.from(new Set(GUIDES.map(g => g.category)))];
  const filteredGuides = catFilter === 'All' ? GUIDES : GUIDES.filter(g => g.category === catFilter);
  const totalEvalTests = EVAL_FRAMEWORK.evalSuites.reduce((a, s) => a + s.tests, 0);
  const totalPassing = EVAL_FRAMEWORK.evalSuites.reduce((a, s) => a + s.passing, 0);
  const totalMcpTools = MCP_SERVERS.reduce((a, s) => a + s.tools, 0);
  const totalMcpCalls = MCP_SERVERS.reduce((a, s) => a + s.calls, 0);

  return (
    <Layout>
      <PageHeader
        label="DEVELOPER PLATFORM"
        title="a11oy SDK"
        subtitle="Build governed agentic applications. Python-first, TypeScript-native. Tools, evals, fine-tuning, skills, MCP servers, and proof chains — the complete developer platform."
        status="LIVE"
      />

      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 mb-8">
        <KpiCard label="PRIMITIVES" value={SDK_PRIMITIVES.length} sub="available" accent={T.accent} />
        <KpiCard label="TOOL TYPES" value={TOOL_TYPES.length} sub="supported" accent={T.accent} />
        <KpiCard label="EVAL TESTS" value={totalEvalTests.toLocaleString()} sub={`${((totalPassing / totalEvalTests) * 100).toFixed(1)}% pass`} accent={T.accent} />
        <KpiCard label="FINE-TUNES" value={FINETUNE_REGISTRY.length} sub="models" accent={T.dim} />
        <KpiCard label="SKILLS" value={SKILLS_REGISTRY.length} sub="registered" accent={T.accent} />
        <KpiCard label="MCP SERVERS" value={MCP_SERVERS.length} sub={`${totalMcpTools} tools`} accent={T.dim} />
        <KpiCard label="GUIDES" value={GUIDES.length} sub="published" accent={T.accent} />
        <KpiCard label="COOKBOOK" value={COOKBOOK.length} sub="recipes" accent={T.accent} />
        <KpiCard label="API" value={API_ENDPOINTS.length} sub="endpoints" accent={T.dim} />
      </div>

      <div className="flex flex-wrap gap-1 mb-6">
        {(['primitives', 'tools', 'evals', 'finetune', 'skills', 'mcp', 'guides', 'cookbook', 'api'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all" style={{ background: tab === t ? 'rgba(201,183,135,0.1)' : 'transparent', color: tab === t ? T.accent : T.muted, border: `1px solid ${tab === t ? 'rgba(201,183,135,0.2)' : 'transparent'}` }}>
            {t === 'finetune' ? 'fine-tune' : t}
          </button>
        ))}
      </div>

      {tab === 'primitives' && (
        <>
          <SectionTitle>SDK Primitives</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            The a11oy SDK absorbs every pattern from the OpenAI Agents SDK — agents, handoffs, guardrails, tools, sessions, tracing, MCP, realtime — then adds governed orchestration, proof chains, evals, fine-tuning, skills, and multi-vertical domain packs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SDK_PRIMITIVES.map(p => (
              <Card key={p.name}>
                <div className="flex justify-between items-start mb-1.5">
                  <div className="text-xs font-mono font-medium" style={{ color: T.text }}>{p.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: p.status === 'stable' ? 'rgba(201,183,135,0.08)' : 'rgba(138,138,138,0.08)', color: p.status === 'stable' ? T.accent : T.dim, border: `1px solid ${p.status === 'stable' ? 'rgba(201,183,135,0.12)' : 'rgba(138,138,138,0.12)'}` }}>{p.status}</span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>{p.lang}</span>
                  </div>
                </div>
                <div className="text-[10px] leading-relaxed" style={{ color: T.dim }}>{p.desc}</div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'tools' && (
        <>
          <SectionTitle>Tool System</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            Eight tool types — function tools, hosted tools (web search, shell, computer use, code interpreter), remote MCP servers, OpenAI Connectors, agents-as-tools, deep research, and image/video generation. All governed by proof chain with require_approval control.
          </p>
          <div className="flex flex-wrap gap-1 mb-4">
            {TOOL_TYPES.map((tt, i) => (
              <button key={tt.name} onClick={() => setSelectedToolType(i)} className="px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-md transition-all" style={{ background: selectedToolType === i ? 'rgba(201,183,135,0.1)' : 'transparent', color: selectedToolType === i ? T.accent : T.muted, border: `1px solid ${selectedToolType === i ? 'rgba(201,183,135,0.15)' : 'transparent'}` }}>
                {tt.name}
              </button>
            ))}
          </div>
          {(() => {
            const tt = TOOL_TYPES[selectedToolType];
            return (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium" style={{ color: T.text }}>{tt.name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}>{tt.status}</span>
                      <span className="text-[9px] font-mono" style={{ color: T.muted }}>{tt.protocol}</span>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed mb-4" style={{ color: T.dim }}>{tt.desc}</p>
                  <div className="text-[9px] font-mono uppercase tracking-wider mb-1.5" style={{ color: T.muted }}>Examples</div>
                  <div className="flex flex-wrap gap-1">
                    {tt.examples.map(e => (
                      <span key={e} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.06)', color: T.accent, border: '1px solid rgba(201,183,135,0.1)' }}>{e}</span>
                    ))}
                  </div>
                </Card>
                <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                  <div className="flex items-center justify-between px-4 py-2" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${T.border}` }}>
                    <span className="text-[10px] font-mono font-medium" style={{ color: T.text }}>{tt.name}</span>
                    <span className="text-[9px] font-mono" style={{ color: T.accent }}>Python</span>
                  </div>
                  <pre className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto" style={{ background: '#050505', color: T.dim }}>{tt.code}</pre>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {tab === 'evals' && (
        <>
          <SectionTitle>Evaluation Framework</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Score every agent output. LLM graders, code graders, human graders, and MirrorEval — a11oy's proprietary continuous evaluator. Eval-driven development: write evals first, then build agents.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {EVAL_FRAMEWORK.graderTypes.map(g => (
              <Card key={g.name}>
                <div className="text-xs font-medium mb-1" style={{ color: T.text }}>{g.name}</div>
                <div className="text-[10px] mb-3" style={{ color: T.dim }}>{g.desc}</div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span style={{ color: T.muted }}>{g.usage.toLocaleString()} runs</span>
                  <span style={{ color: T.accent }}>{g.accuracy} acc</span>
                </div>
              </Card>
            ))}
          </div>

          <SectionTitle>Eval Suites</SectionTitle>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Suite', 'Type', 'Tests', 'Passing', 'Rate', 'Last Run'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EVAL_FRAMEWORK.evalSuites.map(s => (
                  <tr key={s.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: T.text }}>{s.name}</td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(201,183,135,0.06)', color: T.accent }}>{s.type}</span></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{s.tests.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>{s.passing.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: s.passing === s.tests ? T.accent : T.text }}>{((s.passing / s.tests) * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.muted }}>{s.lastRun}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'finetune' && (
        <>
          <SectionTitle>Model Optimization Pipeline</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Full model optimization suite — Supervised Fine-Tuning (SFT), Vision Fine-Tuning, Direct Preference Optimization (DPO), and Reinforcement Fine-Tuning (RFT). Every training run is proof-chained. Distill expensive model outputs into smaller, faster, cheaper models.
          </p>

          <div className="rounded-lg overflow-hidden mb-8" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Model', 'Base', 'Method', 'Dataset', 'Status', 'Accuracy', 'Cost', 'Proof'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FINETUNE_REGISTRY.map(f => (
                  <tr key={f.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-3 py-2.5 font-mono font-medium" style={{ color: T.text }}>{f.name}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: T.dim }}>{f.baseModel}</td>
                    <td className="px-3 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: f.method === 'DPO' ? 'rgba(201,183,135,0.12)' : f.method === 'RFT' ? 'rgba(201,183,135,0.15)' : f.method === 'Vision FT' ? 'rgba(201,183,135,0.1)' : 'rgba(255,255,255,0.04)', color: f.method === 'SFT' ? T.dim : T.accent }}>{f.method}</span></td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: T.dim }}>{f.dataset}</td>
                    <td className="px-3 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: f.status === 'deployed' ? 'rgba(201,183,135,0.08)' : f.status === 'training' ? 'rgba(245,245,245,0.05)' : 'rgba(138,138,138,0.06)', color: f.status === 'deployed' ? T.accent : f.status === 'training' ? T.text : T.dim }}>{f.status}</span></td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: T.accent }}>{f.accuracy}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: T.dim }}>{f.cost}</td>
                    <td className="px-3 py-2.5 font-mono text-[9px]" style={{ color: T.muted }}>{f.proofHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card>
            <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Distillation Pipeline</div>
            <div className="font-mono text-[11px] space-y-1" style={{ color: T.dim }}>
              <div><span style={{ color: T.accent }}>1.</span> Collect high-quality outputs from expensive models (claude-sonnet-4, gpt-4o)</div>
              <div><span style={{ color: T.accent }}>2.</span> Score outputs with MirrorEval — keep only 95th+ percentile quality</div>
              <div><span style={{ color: T.accent }}>3.</span> Build training dataset with input/output pairs + proof chain metadata</div>
              <div><span style={{ color: T.accent }}>4.</span> Fine-tune smaller model (gpt-4o-mini) on curated dataset</div>
              <div><span style={{ color: T.accent }}>5.</span> Evaluate fine-tuned model against same eval suite as original</div>
              <div><span style={{ color: T.accent }}>6.</span> Deploy if accuracy meets threshold — proof-chain the entire pipeline</div>
              <div><span style={{ color: T.accent }}>7.</span> Route future tasks to fine-tuned model — 10x cost reduction, &lt;2% accuracy loss</div>
            </div>
          </Card>
        </>
      )}

      {tab === 'skills' && (
        <>
          <SectionTitle>Skills Registry</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Skills are curated instruction sets that extend agent capabilities. Each skill bundles instructions, tools, guardrails, and domain knowledge into an installable, versionable package. a11oy absorbs skills from OpenAI's open-source skills repo, HuggingFace hub, and the a11oy domain library — all governed by the proof chain.
          </p>
          <div className="flex gap-1 mb-4">
            {['All', 'OpenAI', 'HuggingFace', 'a11oy', 'Community'].map(s => {
              const count = s === 'All' ? SKILLS_REGISTRY.length : SKILLS_REGISTRY.filter(sk => sk.source === s).length;
              return (
                <button key={s} onClick={() => setSkillsFilter(s)} className="px-3 py-1 text-[9px] font-mono uppercase tracking-wider rounded transition-all" style={{ background: skillsFilter === s ? 'rgba(201,183,135,0.08)' : 'transparent', color: skillsFilter === s ? T.accent : T.muted }}>
                  {s} ({count})
                </button>
              );
            })}
          </div>
          <div className="space-y-2 mb-8">
            {(skillsFilter === 'All' ? SKILLS_REGISTRY : SKILLS_REGISTRY.filter(sk => sk.source === skillsFilter)).map(sk => (
              <div key={sk.name} className="rounded-lg p-4 flex items-center gap-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: sk.installed ? T.accent : T.muted }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium" style={{ color: T.text }}>{sk.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: sk.installed ? 'rgba(201,183,135,0.08)' : 'rgba(255,255,255,0.03)', color: sk.installed ? T.accent : T.muted }}>{sk.installed ? 'installed' : 'available'}</span>
                    <span className="text-[9px] font-mono" style={{ color: T.muted }}>v{sk.version} · {sk.source}</span>
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: T.dim }}>{sk.desc}</div>
                </div>
                <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                  {sk.tools.slice(0, 3).map(t => (
                    <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.dim }}>{t}</span>
                  ))}
                  {sk.tools.length > 3 && <span className="text-[9px] font-mono" style={{ color: T.muted }}>+{sk.tools.length - 3}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>How Skills Work</div>
              <div className="font-mono text-[11px] space-y-1" style={{ color: T.dim }}>
                <div><span style={{ color: T.accent }}>1.</span> Skill installed via <span style={{ color: T.text }}>a11oy skill install maritime-ops</span></div>
                <div><span style={{ color: T.accent }}>2.</span> SKILL.md loaded into agent context at session start</div>
                <div><span style={{ color: T.accent }}>3.</span> Skill tools registered in agent tool registry</div>
                <div><span style={{ color: T.accent }}>4.</span> Skill guardrails activated alongside agent guardrails</div>
                <div><span style={{ color: T.accent }}>5.</span> Agent consults skill instructions before acting</div>
                <div><span style={{ color: T.accent }}>6.</span> All skill tool calls governed by proof chain</div>
              </div>
            </Card>
            <Card>
              <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Docs MCP + Skills Pattern</div>
              <div className="text-[11px] leading-relaxed" style={{ color: T.dim }}>
                <p className="mb-2">The OpenAI Docs Skill tells agents: <span style={{ color: T.accent }}>"Use the Docs MCP server first for OpenAI questions, then fall back to official domains."</span></p>
                <p className="mb-2">a11oy extends this pattern to every domain. The maritime-ops skill tells Cascade Navigator to query the maritime MCP server first. The legal-compliance skill tells Counsel Sentinel to check the legal MCP server.</p>
                <p style={{ color: T.text }}>Skills + MCP = agents that always consult authoritative sources before answering, with citations traceable through the proof chain.</p>
              </div>
            </Card>
          </div>
        </>
      )}

      {tab === 'mcp' && (
        <>
          <SectionTitle>MCP Server Registry</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            Model Context Protocol — the universal standard for tool interop. {MCP_SERVERS.length} servers connected, {totalMcpTools} tools available, {totalMcpCalls.toLocaleString()} calls today. Every MCP tool call flows through the Connector Firewall with proof chain verification.
          </p>
          <div className="rounded-lg overflow-hidden mb-8" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Server', 'Transport', 'Status', 'Tools', 'Calls', 'Description'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MCP_SERVERS.map(s => (
                  <tr key={s.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5 font-mono font-medium" style={{ color: T.text }}>{s.name}</td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.dim }}>{s.transport}</span></td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: s.status === 'active' ? 'rgba(201,183,135,0.08)' : 'rgba(138,138,138,0.06)', color: s.status === 'active' ? T.accent : T.dim }}>{s.status}</span></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>{s.tools}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{s.calls.toLocaleString()}</td>
                    <td className="px-4 py-2.5" style={{ color: T.dim, maxWidth: 300 }}>{s.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card>
            <div className="text-[9px] font-mono uppercase tracking-wider mb-3" style={{ color: T.muted }}>Connector Firewall</div>
            <div className="text-[11px] leading-relaxed" style={{ color: T.dim }}>
              <p className="mb-2">Every MCP tool call passes through the Connector Firewall before execution. The firewall enforces:</p>
              <div className="font-mono space-y-1 mt-2">
                <div><span style={{ color: T.accent }}>access_control</span> — agent must be authorized for the specific tool</div>
                <div><span style={{ color: T.accent }}>rate_limiting</span> — per-agent, per-tool, per-server call limits</div>
                <div><span style={{ color: T.accent }}>cost_tracking</span> — real-time cost attribution per agent per tool</div>
                <div><span style={{ color: T.accent }}>input_sanitization</span> — validate and sanitize tool inputs</div>
                <div><span style={{ color: T.accent }}>output_governance</span> — screen tool outputs through guardrails</div>
                <div><span style={{ color: T.accent }}>proof_chain</span> — every tool call anchored to a cryptographic proof hash</div>
                <div><span style={{ color: T.accent }}>audit_trail</span> — complete log of who called what, when, and why</div>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === 'guides' && (
        <>
          <SectionTitle>Developer Guides</SectionTitle>
          <div className="flex flex-wrap gap-1 mb-4">
            {categories.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-md transition-all" style={{ background: catFilter === c ? 'rgba(201,183,135,0.1)' : 'transparent', color: catFilter === c ? T.accent : T.muted, border: `1px solid ${catFilter === c ? 'rgba(201,183,135,0.15)' : 'transparent'}` }}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredGuides.map(g => (
              <Card key={g.title}>
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs font-medium" style={{ color: T.text }}>{g.title}</div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: g.difficulty === 'Beginner' ? 'rgba(201,183,135,0.08)' : g.difficulty === 'Advanced' ? 'rgba(245,245,245,0.05)' : 'rgba(138,138,138,0.08)', color: g.difficulty === 'Advanced' ? T.text : g.difficulty === 'Beginner' ? T.accent : T.dim }}>{g.difficulty}</span>
                </div>
                <div className="text-[10px] mb-2" style={{ color: T.dim }}>{g.desc}</div>
                <div className="text-[9px] font-mono" style={{ color: T.muted }}>{g.category}</div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'api' && (
        <>
          <SectionTitle>API Reference</SectionTitle>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Method', 'Endpoint', 'Description', 'Auth'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {API_ENDPOINTS.map((ep, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: ep.method === 'POST' ? 'rgba(201,183,135,0.08)' : 'rgba(138,138,138,0.08)', color: ep.method === 'POST' ? T.accent : T.dim }}>{ep.method}</span></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.text }}>{ep.path}</td>
                    <td className="px-4 py-2.5" style={{ color: T.dim }}>{ep.desc}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.muted }}>{ep.auth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'cookbook' && (
        <>
          <SectionTitle>a11oy Cookbook</SectionTitle>
          <p className="text-xs mb-6" style={{ color: T.dim }}>
            {COOKBOOK.length} production-ready recipes — every pattern from the OpenAI API platform, rewritten as a11oy-governed Python code. Agents, evals, fine-tuning, realtime voice, MCP, connectors, deep research, structured output, and more.
          </p>

          <div className="flex flex-wrap gap-1 mb-6">
            {COOKBOOK_CATEGORIES.map(c => (
              <button key={c} onClick={() => { setCookbookFilter(c); setExpandedRecipe(null); }} className="px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-md transition-all" style={{ background: cookbookFilter === c ? 'rgba(201,183,135,0.1)' : 'transparent', color: cookbookFilter === c ? T.accent : T.muted, border: `1px solid ${cookbookFilter === c ? 'rgba(201,183,135,0.15)' : 'transparent'}` }}>
                {c} {c !== 'All' ? `(${COOKBOOK.filter(r => r.category === c).length})` : `(${COOKBOOK.length})`}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredCookbook.map((recipe, i) => {
              const globalIdx = COOKBOOK.indexOf(recipe);
              const isExpanded = expandedRecipe === globalIdx;
              return (
                <div key={`${recipe.title}-${i}`} className="rounded-lg overflow-hidden transition-all" style={{ border: `1px solid ${isExpanded ? 'rgba(201,183,135,0.2)' : T.border}`, background: isExpanded ? 'rgba(201,183,135,0.02)' : T.surface }}>
                  <button onClick={() => setExpandedRecipe(isExpanded ? null : globalIdx)} className="w-full text-left px-4 py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-medium truncate" style={{ color: T.text }}>{recipe.title}</span>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}>{recipe.category}</span>
                      </div>
                      <div className="text-[10px] truncate" style={{ color: T.dim }}>{recipe.desc}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      {recipe.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: T.muted }}>{tag}</span>
                      ))}
                      <span className="text-[10px] font-mono" style={{ color: T.muted }}>{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${T.border}` }}>
                      <div className="flex items-center justify-between px-4 py-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <span className="text-[9px] font-mono" style={{ color: T.muted }}>a11oy SDK</span>
                        <span className="text-[9px] font-mono" style={{ color: T.accent }}>Python</span>
                      </div>
                      <pre className="p-4 font-mono text-[11px] leading-relaxed overflow-x-auto" style={{ background: '#050505', color: T.dim }}>{recipe.code}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
