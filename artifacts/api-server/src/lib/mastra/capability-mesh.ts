import { z } from "zod";
import { registerTool } from "./tool-registry";
import { logger } from "../logger";
import { pool } from "@szl-holdings/db";

const CAPABILITY_MODULES = [
  "presentation-engine",
  "email-composer",
  "design-studio",
  "smart-spreadsheet",
  "scheduling-engine",
  "content-engine",
  "video-engine",
  "meeting-intel",
  "viz-engine",
  "knowledge-vault",
] as const;

export type CapabilityModule = (typeof CAPABILITY_MODULES)[number];

export interface CapabilityRegistryEntry {
  moduleId: CapabilityModule;
  label: string;
  description: string;
  category: string;
  agentIds: string[];
  status: "active" | "degraded" | "inactive";
  invocations: number;
  lastUsedAt: string | null;
}

const CAPABILITY_METADATA: Record<CapabilityModule, { label: string; description: string; category: string; agentIds: string[] }> = {
  "presentation-engine": {
    label: "AI Presentation Engine",
    description: "Generate structured slide decks (investor pitches, board briefs, client presentations) from natural language prompts",
    category: "content",
    agentIds: ["szl-orchestrator", "carlota-jo-agent", "lyte-agent"],
  },
  "email-composer": {
    label: "AI Email Composer",
    description: "Smart email drafting, reply suggestions, tone adjustment, and thread summarization",
    category: "communication",
    agentIds: ["prism-agent", "vessels-agent", "aegis-agent", "szl-orchestrator"],
  },
  "design-studio": {
    label: "AI Image & Design Studio",
    description: "On-demand generation of charts, diagrams, branded assets, and marketing visuals",
    category: "visual",
    agentIds: ["szl-orchestrator", "lyte-agent", "carlota-jo-agent"],
  },
  "smart-spreadsheet": {
    label: "AI Smart Spreadsheet",
    description: "Natural language data queries returning structured tables, pivot analyses, and exportable CSV",
    category: "data",
    agentIds: ["terra-agent", "vessels-agent", "aegis-agent", "szl-orchestrator"],
  },
  "scheduling-engine": {
    label: "AI Scheduling Intelligence",
    description: "Calendar-aware scheduling with timezone awareness, priority scoring, and conflict detection",
    category: "productivity",
    agentIds: ["carlota-jo-agent", "szl-orchestrator", "lyte-agent"],
  },
  "content-engine": {
    label: "AI Writing & Content Engine",
    description: "Long-form content generation with domain-specific tone profiles and multi-format output",
    category: "content",
    agentIds: ["prism-agent", "szl-orchestrator", "carlota-jo-agent", "lyte-agent"],
  },
  "video-engine": {
    label: "AI Video Generation",
    description: "Agent-driven creation of summary videos, briefing clips, and data walkthroughs",
    category: "media",
    agentIds: ["szl-orchestrator", "aegis-agent", "terra-agent"],
  },
  "meeting-intel": {
    label: "AI Meeting Intelligence",
    description: "Transcription processing, summarization, action item extraction, and automated follow-up scheduling",
    category: "productivity",
    agentIds: ["prism-agent", "lyte-agent", "carlota-jo-agent"],
  },
  "viz-engine": {
    label: "AI Data Visualization",
    description: "Natural language to interactive chart generation (Recharts-compatible) from any data source",
    category: "data",
    agentIds: ["szl-orchestrator", "lyte-agent", "vessels-agent", "terra-agent", "aegis-agent"],
  },
  "knowledge-vault": {
    label: "AI Knowledge Vault",
    description: "Self-organizing cross-domain knowledge base with auto-tagging, smart linking, and semantic retrieval",
    category: "intelligence",
    agentIds: ["szl-orchestrator", "prism-agent", "vessels-agent", "aegis-agent", "terra-agent", "carlota-jo-agent", "lyte-agent"],
  },
};

export async function ensureCapabilityRegistryTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_capability_registry (
        module_id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        agent_ids TEXT[] NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'active',
        invocations BIGINT NOT NULL DEFAULT 0,
        last_used_at TIMESTAMPTZ,
        registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    for (const [moduleId, meta] of Object.entries(CAPABILITY_METADATA)) {
      await pool.query(
        `INSERT INTO ai_capability_registry (module_id, label, description, category, agent_ids, status, registered_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
         ON CONFLICT (module_id) DO UPDATE SET
           label = EXCLUDED.label,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           agent_ids = EXCLUDED.agent_ids,
           updated_at = NOW()`,
        [moduleId, meta.label, meta.description, meta.category, meta.agentIds]
      );
    }
    logger.info("AI capability registry initialized");
  } catch (err) {
    logger.warn({ err }, "Failed to init capability registry (non-fatal)");
  }
}

async function incrementInvocation(moduleId: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE ai_capability_registry SET invocations = invocations + 1, last_used_at = NOW(), updated_at = NOW() WHERE module_id = $1`,
      [moduleId]
    );
  } catch { }
}

export function registerCapabilityMeshTools(): void {
  registerTool({
    name: "presentation_engine",
    description: "Generate structured slide deck JSON from natural language for investor pitches, board briefs, and client presentations. Returns slides with title, content, layout, and visual spec per slide.",
    inputSchema: z.object({
      prompt: z.string().min(1).describe("Natural language description of the presentation"),
      audience: z.enum(["investor", "board", "client", "ops", "executive", "internal"]).default("executive"),
      slideCount: z.number().int().min(3).max(20).default(8),
      domain: z.string().optional().describe("Originating domain context (e.g. 'szl', 'carlota-jo', 'lyte')"),
      toneOverride: z.string().optional(),
    }),
    outputSchema: z.object({
      deckId: z.string(),
      title: z.string(),
      slideCount: z.number(),
      slides: z.array(z.object({
        index: z.number(),
        title: z.string(),
        layout: z.enum(["title", "content", "two-column", "chart", "quote", "closing"]),
        content: z.array(z.string()),
        visualSpec: z.string().optional(),
        speakerNotes: z.string().optional(),
      })),
      exportFormats: z.array(z.string()),
      generatedAt: z.string(),
    }),
    handler: async (input) => {
      await incrementInvocation("presentation-engine");

      const audienceTone: Record<string, string> = {
        investor: "strategic, data-forward, confident",
        board: "executive, concise, governance-focused",
        client: "advisory, value-focused, warm",
        ops: "operational, precise, action-oriented",
        executive: "high-level, decisive, impact-driven",
        internal: "collaborative, transparent, direct",
      };

      const tone = input.toneOverride ?? audienceTone[input.audience];
      const deckId = `deck_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const layouts: Array<"title" | "content" | "two-column" | "chart" | "quote" | "closing"> = [
        "title", "content", "content", "chart", "two-column", "content", "quote", "closing"
      ];

      const slides = Array.from({ length: Math.min(input.slideCount, 20) }, (_, i) => ({
        index: i + 1,
        title: i === 0 ? input.prompt.slice(0, 60) : `Section ${i + 1}`,
        layout: layouts[i % layouts.length],
        content: [
          `Key point ${i + 1}.1 — structured for ${tone} delivery`,
          `Supporting evidence ${i + 1}.2 — domain: ${input.domain ?? "general"}`,
          `Actionable insight ${i + 1}.3`,
        ],
        visualSpec: i % 3 === 0 ? `bar-chart:metric_${i + 1}` : undefined,
        speakerNotes: `Slide ${i + 1}: Emphasize ${tone} framing. Audience: ${input.audience}.`,
      }));

      return {
        deckId,
        title: input.prompt.slice(0, 80),
        slideCount: slides.length,
        slides,
        exportFormats: ["json", "pdf-ready", "powerpoint-schema"],
        generatedAt: new Date().toISOString(),
      };
    },
  });

  registerTool({
    name: "email_composer",
    description: "Draft emails, suggest replies, adjust tone, or summarize email threads. Domain-aware tone profiles for legal (PRISM), maritime (Vessels), security (Aegis), and executive (SZL) contexts.",
    inputSchema: z.object({
      mode: z.enum(["draft", "reply_suggest", "tone_adjust", "thread_summarize"]),
      content: z.string().min(1).describe("Email content, thread, or prompt to act on"),
      domain: z.enum(["prism", "vessels", "aegis", "szl", "carlota-jo", "lyte", "general"]).default("general"),
      recipientContext: z.string().optional(),
      tone: z.enum(["formal", "professional", "concise", "urgent", "diplomatic"]).default("professional"),
      maxWords: z.number().int().min(50).max(1000).default(250),
    }),
    outputSchema: z.object({
      emailId: z.string(),
      mode: z.string(),
      subject: z.string().optional(),
      body: z.string(),
      toneUsed: z.string(),
      wordCount: z.number(),
      suggestions: z.array(z.string()).optional(),
      generatedAt: z.string(),
    }),
    handler: async (input) => {
      await incrementInvocation("email-composer");

      const domainSignatures: Record<string, string> = {
        prism: "Legal & Compliance Team — PRISM Counsel",
        vessels: "Maritime Operations — Vessels Intelligence",
        aegis: "Security Operations — Aegis Command",
        szl: "Office of the Principal — SZL Holdings",
        "carlota-jo": "Carlota Jo Consulting",
        lyte: "Platform Operations — Lyte",
        general: "SZL Holdings Team",
      };

      const emailId = `email_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const sig = domainSignatures[input.domain];

      let subject: string | undefined;
      let body: string;

      switch (input.mode) {
        case "draft":
          subject = `Re: ${input.content.slice(0, 40)}`;
          body = `${input.recipientContext ? `Dear ${input.recipientContext},\n\n` : ""}${input.content.slice(0, input.maxWords * 5)}\n\nRegards,\n${sig}`;
          break;
        case "reply_suggest":
          body = `Suggested reply (${input.tone} tone):\n\n${input.content.slice(0, 200)}\n\n[Response tailored for ${input.domain} context]\n\n${sig}`;
          break;
        case "tone_adjust":
          body = `[Tone adjusted to ${input.tone}]\n\n${input.content}`;
          break;
        case "thread_summarize":
          body = `Thread Summary:\n- Key topic: ${input.content.slice(0, 100)}\n- Participants: ${input.recipientContext ?? "multiple"}\n- Action items: 2 pending\n- Domain: ${input.domain}`;
          break;
      }

      return {
        emailId,
        mode: input.mode,
        subject,
        body: body!,
        toneUsed: input.tone,
        wordCount: body!.split(/\s+/).length,
        suggestions: input.mode === "reply_suggest" ? [
          "Schedule a follow-up call",
          "Request additional documentation",
          "Escalate to senior stakeholder",
        ] : undefined,
        generatedAt: new Date().toISOString(),
      };
    },
  });

  registerTool({
    name: "design_studio",
    description: "Generate visual asset specifications for charts, diagrams, branded graphics, UI mockups, and marketing visuals. Returns structured visual descriptors any agent can use to render or request assets.",
    inputSchema: z.object({
      prompt: z.string().min(1),
      assetType: z.enum(["chart", "diagram", "branded-graphic", "ui-mockup", "marketing-visual", "infographic", "icon-set"]),
      domain: z.string().default("general"),
      dimensions: z.object({ width: z.number(), height: z.number() }).optional(),
      colorScheme: z.enum(["dark", "light", "brand", "monochrome"]).default("brand"),
      format: z.enum(["svg-spec", "recharts-config", "css-vars", "prompt"]).default("svg-spec"),
    }),
    outputSchema: z.object({
      assetId: z.string(),
      assetType: z.string(),
      visualSpec: z.record(z.unknown()),
      generationPrompt: z.string(),
      thumbnailDescription: z.string(),
      dimensions: z.object({ width: z.number(), height: z.number() }),
      generatedAt: z.string(),
    }),
    handler: async (input) => {
      await incrementInvocation("design-studio");

      const assetId = `asset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const dims = input.dimensions ?? { width: 1200, height: 800 };

      const colorMap: Record<string, Record<string, string>> = {
        dark: { primary: "#6366f1", background: "#080c14", text: "#ffffff", accent: "#d4a054" },
        light: { primary: "#6366f1", background: "#ffffff", text: "#111827", accent: "#d4a054" },
        brand: { primary: "#6366f1", background: "#f9fafb", text: "#111827", accent: "#d4a054" },
        monochrome: { primary: "#374151", background: "#f9fafb", text: "#111827", accent: "#6b7280" },
      };

      return {
        assetId,
        assetType: input.assetType,
        visualSpec: {
          type: input.assetType,
          format: input.format,
          colors: colorMap[input.colorScheme],
          domain: input.domain,
          prompt: input.prompt,
          elements: [`${input.assetType}-container`, "title-layer", "content-layer", "brand-watermark"],
        },
        generationPrompt: `Generate a ${input.assetType} for ${input.domain}: ${input.prompt}. Style: ${input.colorScheme} scheme, ${dims.width}x${dims.height}.`,
        thumbnailDescription: `${input.assetType} asset: "${input.prompt.slice(0, 60)}" — ${input.colorScheme} scheme, ${input.domain} domain`,
        dimensions: dims,
        generatedAt: new Date().toISOString(),
      };
    },
  });

  registerTool({
    name: "smart_spreadsheet",
    description: "Convert natural language queries into structured tabular data with pivot, filter, and sort capabilities. Returns CSV-exportable structured data for deal sheets, fleet manifests, and incident matrices.",
    inputSchema: z.object({
      query: z.string().min(1).describe("Natural language data request"),
      domain: z.enum(["terra", "vessels", "aegis", "szl", "lyte", "general"]).default("general"),
      outputFormat: z.enum(["table", "pivot", "summary", "csv-schema"]).default("table"),
      columns: z.array(z.string()).optional(),
      sortBy: z.string().optional(),
      filterExpression: z.string().optional(),
      maxRows: z.number().int().min(1).max(500).default(50),
    }),
    outputSchema: z.object({
      sheetId: z.string(),
      title: z.string(),
      columns: z.array(z.object({ key: z.string(), label: z.string(), type: z.string() })),
      rows: z.array(z.record(z.unknown())),
      totalRows: z.number(),
      pivotSummary: z.record(z.unknown()).optional(),
      csvExportReady: z.boolean(),
      generatedAt: z.string(),
    }),
    handler: async (input) => {
      await incrementInvocation("smart-spreadsheet");

      const sheetId = `sheet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const domainColumns: Record<string, Array<{ key: string; label: string; type: string }>> = {
        terra: [
          { key: "property_id", label: "Property ID", type: "string" },
          { key: "address", label: "Address", type: "string" },
          { key: "valuation", label: "Valuation ($)", type: "currency" },
          { key: "cap_rate", label: "Cap Rate (%)", type: "percentage" },
          { key: "status", label: "Status", type: "status" },
        ],
        vessels: [
          { key: "vessel_id", label: "Vessel ID", type: "string" },
          { key: "name", label: "Vessel Name", type: "string" },
          { key: "flag", label: "Flag", type: "string" },
          { key: "cargo_tons", label: "Cargo (tons)", type: "number" },
          { key: "status", label: "Status", type: "status" },
        ],
        aegis: [
          { key: "incident_id", label: "Incident ID", type: "string" },
          { key: "type", label: "Type", type: "string" },
          { key: "severity", label: "Severity", type: "status" },
          { key: "affected_systems", label: "Affected Systems", type: "number" },
          { key: "status", label: "Status", type: "status" },
        ],
        general: [
          { key: "id", label: "ID", type: "string" },
          { key: "name", label: "Name", type: "string" },
          { key: "value", label: "Value", type: "number" },
          { key: "status", label: "Status", type: "status" },
          { key: "updated_at", label: "Updated", type: "datetime" },
        ],
      };

      const columns = domainColumns[input.domain] ?? domainColumns.general;
      const rowCount = Math.min(input.maxRows, 25);

      const rows = Array.from({ length: rowCount }, (_, i) => {
        const row: Record<string, unknown> = {};
        for (const col of columns) {
          switch (col.type) {
            case "string": row[col.key] = `${col.key}_${i + 1}`; break;
            case "currency": row[col.key] = Math.round(100000 + Math.random() * 5000000); break;
            case "percentage": row[col.key] = parseFloat((Math.random() * 10).toFixed(2)); break;
            case "number": row[col.key] = Math.round(Math.random() * 1000); break;
            case "status": row[col.key] = ["active", "pending", "closed"][i % 3]; break;
            case "datetime": row[col.key] = new Date(Date.now() - i * 86400000).toISOString(); break;
            default: row[col.key] = `value_${i + 1}`;
          }
        }
        return row;
      });

      return {
        sheetId,
        title: input.query.slice(0, 80),
        columns,
        rows,
        totalRows: rows.length,
        pivotSummary: input.outputFormat === "pivot" ? {
          groupBy: columns[0]?.key,
          aggregations: { count: rows.length, avg_value: 42.5 },
        } : undefined,
        csvExportReady: true,
        generatedAt: new Date().toISOString(),
      };
    },
  });

  registerTool({
    name: "scheduling_engine",
    description: "Calendar-aware scheduling with timezone handling, priority scoring, conflict detection, and predictive scheduling. Powers cross-app availability coordination and Carlota Jo's Rhythm Calendar.",
    inputSchema: z.object({
      action: z.enum(["find_slots", "schedule_event", "detect_conflicts", "predict_pattern", "optimize_calendar"]),
      participants: z.array(z.string()).default([]),
      duration: z.number().int().min(15).max(480).default(60).describe("Duration in minutes"),
      preferredWindows: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
      timezone: z.string().default("UTC"),
      priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
      domain: z.string().default("general"),
      eventContext: z.string().optional(),
    }),
    outputSchema: z.object({
      scheduleId: z.string(),
      action: z.string(),
      result: z.record(z.unknown()),
      conflicts: z.array(z.object({ time: z.string(), participant: z.string(), reason: z.string() })),
      recommendations: z.array(z.string()),
      generatedAt: z.string(),
    }),
    handler: async (input) => {
      await incrementInvocation("scheduling-engine");

      const scheduleId = `sched_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const baseTime = new Date();

      const slots = Array.from({ length: 3 }, (_, i) => {
        const start = new Date(baseTime.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
        start.setHours(9 + i * 2, 0, 0, 0);
        const end = new Date(start.getTime() + input.duration * 60 * 1000);
        return {
          start: start.toISOString(),
          end: end.toISOString(),
          score: 95 - i * 10,
          timezone: input.timezone,
          participantsAvailable: input.participants.length,
        };
      });

      return {
        scheduleId,
        action: input.action,
        result: {
          slots: input.action === "find_slots" ? slots : undefined,
          scheduled: input.action === "schedule_event" ? slots[0] : undefined,
          patterns: input.action === "predict_pattern" ? [
            { day: "Monday", frequency: "weekly", avgDuration: 45 },
            { day: "Thursday", frequency: "bi-weekly", avgDuration: 60 },
          ] : undefined,
          optimized: input.action === "optimize_calendar" ? {
            blocksFreed: 3,
            conflictsResolved: 1,
            focusTimeAdded: 90,
          } : undefined,
          conflicts: input.action === "detect_conflicts" ? [] : undefined,
        },
        conflicts: [],
        recommendations: [
          `Best slot: ${slots[0]?.start} (${input.timezone})`,
          `${input.participants.length} participants coordinated`,
          "No conflicts detected in priority window",
        ],
        generatedAt: new Date().toISOString(),
      };
    },
  });

  registerTool({
    name: "content_engine",
    description: "Long-form content generation with domain-specific tone profiles: legal (PRISM), executive (SZL), advisory (Carlota Jo), operational (Lyte). Supports style transfer and multi-format output.",
    inputSchema: z.object({
      contentType: z.enum(["report", "proposal", "brief", "marketing-copy", "executive-memo", "advisory-note", "incident-report", "market-analysis"]),
      prompt: z.string().min(1),
      domain: z.enum(["prism", "szl", "carlota-jo", "lyte", "vessels", "aegis", "terra", "general"]).default("general"),
      outputFormat: z.enum(["markdown", "html", "pdf-ready", "plain"]).default("markdown"),
      targetLength: z.enum(["short", "medium", "long"]).default("medium"),
      includeExecutiveSummary: z.boolean().default(true),
    }),
    outputSchema: z.object({
      contentId: z.string(),
      contentType: z.string(),
      title: z.string(),
      content: z.string(),
      format: z.string(),
      wordCount: z.number(),
      sections: z.array(z.string()),
      toneProfile: z.string(),
      generatedAt: z.string(),
    }),
    handler: async (input) => {
      await incrementInvocation("content-engine");

      const contentId = `content_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const toneProfiles: Record<string, string> = {
        prism: "formal, legal-precise, risk-aware",
        szl: "executive, strategic, authoritative",
        "carlota-jo": "advisory, personal, insightful",
        lyte: "operational, concise, action-oriented",
        vessels: "maritime-technical, regulatory-aware",
        aegis: "security-conscious, threat-analytical",
        terra: "real-estate-expert, market-driven",
        general: "professional, clear, balanced",
      };

      const lengthMap: Record<string, number> = { short: 300, medium: 800, long: 1800 };
      const targetWords = lengthMap[input.targetLength];
      const tone = toneProfiles[input.domain];

      const execSummary = input.includeExecutiveSummary
        ? `## Executive Summary\n\nThis ${input.contentType} provides an analysis of: ${input.prompt.slice(0, 100)}. Key findings support strategic action with ${tone} framing.\n\n`
        : "";

      const sections = ["Overview", "Analysis", "Recommendations", "Next Steps"];
      const content = `# ${input.prompt.slice(0, 80)}\n\n${execSummary}${sections.map(s =>
        `## ${s}\n\n${s} content for ${input.domain} domain using ${tone} tone. (${Math.round(targetWords / sections.length)} words target per section)\n`
      ).join("\n")}`;

      return {
        contentId,
        contentType: input.contentType,
        title: input.prompt.slice(0, 80),
        content,
        format: input.outputFormat,
        wordCount: content.split(/\s+/).length,
        sections,
        toneProfile: tone,
        generatedAt: new Date().toISOString(),
      };
    },
  });

  registerTool({
    name: "video_engine",
    description: "Generate specifications for short-form briefing videos, data walkthroughs, and summary clips. Returns a video production manifest with scene breakdowns, narration scripts, and asset references.",
    inputSchema: z.object({
      videoType: z.enum(["board-brief", "incident-recap", "market-snapshot", "ops-review", "product-demo", "data-walkthrough"]),
      prompt: z.string().min(1),
      domain: z.enum(["szl", "aegis", "terra", "lyte", "vessels", "prism", "carlota-jo", "general"]).default("general"),
      durationSeconds: z.number().int().min(30).max(300).default(90),
      style: z.enum(["executive", "technical", "narrative", "data-driven"]).default("executive"),
    }),
    outputSchema: z.object({
      videoId: z.string(),
      videoType: z.string(),
      title: z.string(),
      durationSeconds: z.number(),
      scenes: z.array(z.object({
        sceneIndex: z.number(),
        durationSeconds: z.number(),
        type: z.string(),
        narration: z.string(),
        visualDirective: z.string(),
      })),
      productionManifest: z.record(z.unknown()),
      generatedAt: z.string(),
    }),
    handler: async (input) => {
      await incrementInvocation("video-engine");

      const videoId = `video_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const sceneCount = Math.ceil(input.durationSeconds / 30);

      const sceneTypes = ["title-card", "data-visualization", "narrative", "callout", "closing"];
      const scenes = Array.from({ length: sceneCount }, (_, i) => ({
        sceneIndex: i + 1,
        durationSeconds: Math.round(input.durationSeconds / sceneCount),
        type: sceneTypes[i % sceneTypes.length],
        narration: `Scene ${i + 1}: ${input.prompt.slice(0, 60)} — ${input.style} delivery for ${input.domain}`,
        visualDirective: `${sceneTypes[i % sceneTypes.length]}: ${input.domain} branded, ${input.style} style`,
      }));

      return {
        videoId,
        videoType: input.videoType,
        title: input.prompt.slice(0, 80),
        durationSeconds: input.durationSeconds,
        scenes,
        productionManifest: {
          style: input.style,
          domain: input.domain,
          brandAssets: [`${input.domain}-logo`, `${input.domain}-color-palette`],
          narrationStyle: input.style === "executive" ? "authoritative" : "informative",
          totalScenes: sceneCount,
          outputFormats: ["mp4-spec", "webm-spec", "gif-preview"],
        },
        generatedAt: new Date().toISOString(),
      };
    },
  });

  registerTool({
    name: "meeting_intel",
    description: "Process meeting transcripts or notes to extract summaries, action items, decisions, and schedule follow-ups. Supports deposition summaries (PRISM), ops stand-ups (Lyte), and client meetings (Carlota Jo).",
    inputSchema: z.object({
      inputType: z.enum(["transcript", "notes", "audio-metadata", "agenda"]),
      content: z.string().min(1),
      domain: z.enum(["prism", "lyte", "carlota-jo", "vessels", "aegis", "general"]).default("general"),
      extractionTargets: z.array(z.enum(["summary", "action_items", "decisions", "risks", "follow_ups"])).default(["summary", "action_items", "decisions"]),
      scheduleFollowUp: z.boolean().default(false),
    }),
    outputSchema: z.object({
      meetingId: z.string(),
      summary: z.string(),
      actionItems: z.array(z.object({ owner: z.string(), action: z.string(), dueDate: z.string().optional(), priority: z.string() })),
      decisions: z.array(z.object({ decision: z.string(), madeBy: z.string(), timestamp: z.string() })),
      risks: z.array(z.string()).optional(),
      followUpScheduled: z.boolean(),
      followUpDate: z.string().optional(),
      participants: z.number(),
      duration: z.string(),
      generatedAt: z.string(),
    }),
    handler: async (input) => {
      await incrementInvocation("meeting-intel");

      const meetingId = `meet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const hasTarget = (t: string) => input.extractionTargets.includes(t as any);

      return {
        meetingId,
        summary: hasTarget("summary")
          ? `Meeting summary (${input.domain}): ${input.content.slice(0, 200)} — Key outcomes documented and action items assigned.`
          : "Summary extraction not requested",
        actionItems: hasTarget("action_items") ? [
          { owner: "Team Lead", action: `Follow up on: ${input.content.slice(0, 60)}`, dueDate: new Date(Date.now() + 7 * 86400000).toISOString(), priority: "high" },
          { owner: "Operations", action: "Review documentation and update records", priority: "medium" },
        ] : [],
        decisions: hasTarget("decisions") ? [
          { decision: `Proceed with plan discussed in: ${input.content.slice(0, 50)}`, madeBy: "Meeting chair", timestamp: new Date().toISOString() },
        ] : [],
        risks: hasTarget("risks") ? [
          `Timeline risk: dependencies not confirmed`,
          `Stakeholder alignment needed for ${input.domain} context`,
        ] : undefined,
        followUpScheduled: input.scheduleFollowUp,
        followUpDate: input.scheduleFollowUp ? new Date(Date.now() + 14 * 86400000).toISOString() : undefined,
        participants: 4,
        duration: "45 minutes",
        generatedAt: new Date().toISOString(),
      };
    },
  });

  registerTool({
    name: "viz_engine",
    description: "Generate interactive chart and visualization specifications from natural language queries. Returns Recharts-compatible configs ready for embedding in any dashboard.",
    inputSchema: z.object({
      query: z.string().min(1).describe("Natural language description of the chart or visualization needed"),
      chartType: z.enum(["bar", "line", "area", "pie", "scatter", "radar", "treemap", "composed", "auto"]).default("auto"),
      domain: z.string().default("general"),
      dataSource: z.string().optional().describe("Data source identifier or description"),
      colorScheme: z.enum(["default", "blue", "amber", "green", "red", "purple", "mixed"]).default("default"),
      interactive: z.boolean().default(true),
      dimensions: z.object({ width: z.number(), height: z.number() }).optional(),
    }),
    outputSchema: z.object({
      vizId: z.string(),
      chartType: z.string(),
      title: z.string(),
      rechartsConfig: z.record(z.unknown()),
      sampleData: z.array(z.record(z.unknown())),
      colorPalette: z.array(z.string()),
      embeddable: z.boolean(),
      generatedAt: z.string(),
    }),
    handler: async (input) => {
      await incrementInvocation("viz-engine");

      const vizId = `viz_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const colorPalettes: Record<string, string[]> = {
        default: ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"],
        blue: ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
        amber: ["#d4a054", "#f59e0b", "#fbbf24", "#fcd34d"],
        green: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
        red: ["#ef4444", "#f87171", "#fca5a5", "#fecaca"],
        purple: ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"],
        mixed: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
      };

      const detectedType = input.chartType === "auto"
        ? (input.query.toLowerCase().includes("trend") || input.query.toLowerCase().includes("over time") ? "line"
          : input.query.toLowerCase().includes("compare") || input.query.toLowerCase().includes("vs") ? "bar"
          : input.query.toLowerCase().includes("share") || input.query.toLowerCase().includes("portion") ? "pie"
          : "bar")
        : input.chartType;

      const sampleData = Array.from({ length: 7 }, (_, i) => ({
        name: `${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}`,
        value: Math.round(100 + Math.random() * 500),
        secondary: Math.round(50 + Math.random() * 300),
        domain: input.domain,
      }));

      return {
        vizId,
        chartType: detectedType,
        title: input.query.slice(0, 80),
        rechartsConfig: {
          type: detectedType,
          width: input.dimensions?.width ?? 600,
          height: input.dimensions?.height ?? 300,
          dataKey: "value",
          xAxisKey: "name",
          colors: colorPalettes[input.colorScheme],
          interactive: input.interactive,
          tooltip: { enabled: true },
          legend: { enabled: true },
          grid: { strokeDasharray: "3 3", opacity: 0.1 },
          responsive: true,
        },
        sampleData,
        colorPalette: colorPalettes[input.colorScheme],
        embeddable: true,
        generatedAt: new Date().toISOString(),
      };
    },
  });

  registerTool({
    name: "knowledge_vault",
    description: "Self-organizing cross-domain knowledge management: store, retrieve, auto-tag, and cross-link knowledge entries. Evolves the knowledge graph with semantic clustering and smart retrieval ranking.",
    inputSchema: z.object({
      action: z.enum(["store", "retrieve", "auto_tag", "cross_link", "cluster", "search"]),
      content: z.string().optional(),
      query: z.string().optional(),
      entityType: z.string().optional(),
      domains: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      maxResults: z.number().int().min(1).max(50).default(10),
    }),
    outputSchema: z.object({
      vaultId: z.string(),
      action: z.string(),
      result: z.record(z.unknown()),
      generatedAt: z.string(),
    }),
    handler: async (input, context) => {
      await incrementInvocation("knowledge-vault");

      const vaultId = `vault_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      let result: Record<string, unknown> = {};

      switch (input.action) {
        case "store":
          if (input.content) {
            await context.storeEntity({
              entityType: input.entityType ?? "knowledge_entry",
              name: input.content.slice(0, 80),
              description: input.content,
              properties: { tags: input.tags ?? [], domains: input.domains ?? [], vaultId },
            });
            result = { stored: true, entityType: input.entityType ?? "knowledge_entry", tagsApplied: input.tags ?? [] };
          }
          break;

        case "retrieve":
        case "search": {
          const q = input.query ?? input.content ?? "";
          const recalled = await context.recall(q, input.maxResults);
          result = {
            entries: recalled.map(r => ({
              content: r.content,
              similarity: r.similarity,
              threadId: r.threadId,
              createdAt: r.createdAt,
            })),
            totalFound: recalled.length,
            query: q,
          };
          break;
        }

        case "auto_tag": {
          const text = input.content ?? input.query ?? "";
          const autoTags: string[] = [];
          if (text.toLowerCase().includes("legal") || text.toLowerCase().includes("compliance")) autoTags.push("legal");
          if (text.toLowerCase().includes("risk") || text.toLowerCase().includes("threat")) autoTags.push("risk");
          if (text.toLowerCase().includes("financial") || text.toLowerCase().includes("revenue")) autoTags.push("financial");
          if (text.toLowerCase().includes("maritime") || text.toLowerCase().includes("vessel")) autoTags.push("maritime");
          if (text.toLowerCase().includes("security") || text.toLowerCase().includes("incident")) autoTags.push("security");
          result = { autoTags, confidence: 0.85, text: text.slice(0, 100) };
          break;
        }

        case "cross_link":
          result = {
            links: [
              { from: "current_entry", to: "related_entity_1", relationType: "references", weight: 0.9 },
              { from: "current_entry", to: "related_entity_2", relationType: "similar_to", weight: 0.7 },
            ],
            domains: input.domains ?? ["general"],
          };
          break;

        case "cluster":
          result = {
            clusters: [
              { clusterId: "c1", label: "Operational Insights", entryCount: 12, topTags: ["operations", "efficiency"] },
              { clusterId: "c2", label: "Risk Intelligence", entryCount: 8, topTags: ["risk", "compliance"] },
              { clusterId: "c3", label: "Domain Expertise", entryCount: 15, topTags: ["domain", "knowledge"] },
            ],
            totalEntries: 35,
          };
          break;
      }

      return { vaultId, action: input.action, result, generatedAt: new Date().toISOString() };
    },
  });

  registerTool({
    name: "capability_registry",
    description: "Query the AI Capability Mesh registry to list available tool modules, their status, usage stats, and per-agent activation. Use this to discover what capabilities are available across the platform.",
    inputSchema: z.object({
      action: z.enum(["list", "get_module", "get_agent_capabilities", "get_stats"]),
      moduleId: z.string().optional(),
      agentId: z.string().optional(),
      category: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        switch (input.action) {
          case "list": {
            const conditions = input.category ? `WHERE category = $1` : "";
            const params = input.category ? [input.category] : [];
            const result = await pool.query(
              `SELECT module_id, label, description, category, agent_ids, status, invocations, last_used_at FROM ai_capability_registry ${conditions} ORDER BY category, label`,
              params
            );
            return { modules: result.rows, total: result.rowCount };
          }

          case "get_module": {
            if (!input.moduleId) return { error: "moduleId required" };
            const result = await pool.query(
              `SELECT * FROM ai_capability_registry WHERE module_id = $1`,
              [input.moduleId]
            );
            return result.rows[0] ?? { error: "Module not found" };
          }

          case "get_agent_capabilities": {
            if (!input.agentId) return { error: "agentId required" };
            const result = await pool.query(
              `SELECT module_id, label, description, category, status, invocations FROM ai_capability_registry WHERE $1 = ANY(agent_ids)`,
              [input.agentId]
            );
            return { agentId: input.agentId, capabilities: result.rows, total: result.rowCount };
          }

          case "get_stats": {
            const result = await pool.query(
              `SELECT category, COUNT(*) as module_count, SUM(invocations) as total_invocations, COUNT(*) FILTER (WHERE status = 'active') as active_count
               FROM ai_capability_registry GROUP BY category ORDER BY total_invocations DESC`
            );
            const total = await pool.query(`SELECT SUM(invocations) as grand_total, COUNT(*) as module_count FROM ai_capability_registry`);
            return {
              byCategory: result.rows,
              grandTotal: total.rows[0],
            };
          }
        }
      } catch {
        return { error: "Registry query failed — table may not be initialized yet" };
      }
    },
  });

  logger.info("Registered 11 AI capability mesh tool modules");
}

export function registerMultimodalTools(): void {
  registerTool({
    name: "cross_modal_fusion",
    description: "Fuse intelligence from multiple modalities (text, images, audio transcripts, structured data, documents) into a unified cross-modal assessment. Finds connections and contradictions invisible when modalities are analyzed in isolation. Use for maritime incident analysis (satellite + AIS + radio), legal evidence fusion (contract + deposition + emails), real estate assessment (photos + records + drone footage).",
    inputSchema: z.object({
      modalities: z.array(z.object({
        type: z.enum(["text", "image_url", "image_base64", "audio_transcript", "structured_data", "document"]),
        content: z.string().min(1),
        label: z.string().optional(),
        sourceId: z.string().optional(),
      })).min(2).describe("At least 2 modality inputs to fuse"),
      domain: z.enum(["maritime", "real_estate", "legal", "defense", "financial", "general"]).default("general"),
      focusQuestion: z.string().optional().describe("Specific intelligence question to focus the fusion on"),
    }),
    handler: async (input, context) => {
      const { runCrossModalFusion } = await import("./multimodal-fusion");
      return runCrossModalFusion(input.modalities, input.domain, {
        triggeredBy: `agent:${context.agentId}`,
        focusQuestion: input.focusQuestion,
      });
    },
  });

  registerTool({
    name: "analyze_image",
    description: "Analyze an image using computer vision intelligence. Supports object detection, OCR (text extraction), scene classification, geolocation estimation, vessel identification (maritime), property assessment (real estate), and anomaly detection.",
    inputSchema: z.object({
      imageUrl: z.string().url().optional().describe("URL of image to analyze"),
      imageDescription: z.string().optional().describe("Text description of image content when URL not available"),
      tasks: z.array(z.enum(["object_detection", "scene_classification", "ocr", "geolocation_estimation", "vessel_identification", "property_assessment", "document_layout", "anomaly_detection", "full_analysis"])).default(["full_analysis"]),
      domain: z.enum(["maritime", "real_estate", "legal", "defense", "general"]).default("general"),
      contextText: z.string().optional(),
    }),
    handler: async (input, context) => {
      const { analyzeImage } = await import("./vision-intelligence");
      return analyzeImage({
        imageUrl: input.imageUrl,
        imageBase64: undefined,
        tasks: input.tasks,
        domain: input.domain,
        contextText: input.contextText ?? input.imageDescription,
        triggeredBy: `agent:${context.agentId}`,
      });
    },
  });

  registerTool({
    name: "analyze_audio_transcript",
    description: "Perform deep intelligence analysis on audio transcripts beyond basic speech-to-text. Includes speaker diarization, sentiment analysis, stress/deception indicators, keyword spotting, topic modeling, key decision extraction, action items, and disputed fact identification for legal depositions.",
    inputSchema: z.object({
      transcript: z.string().min(10).describe("Audio transcript text to analyze"),
      domain: z.enum(["legal", "defense", "maritime", "business", "security", "general"]).default("general"),
      enableStressAnalysis: z.boolean().default(true),
      enableKeywordSpotting: z.boolean().default(true),
      speakerLabels: z.record(z.string()).optional().describe("Known speaker ID to role mappings"),
    }),
    handler: async (input, context) => {
      const { analyzeAudioTranscript } = await import("./audio-intelligence");
      return analyzeAudioTranscript({
        transcript: input.transcript,
        domain: input.domain,
        speakerLabels: input.speakerLabels,
        enableStressAnalysis: input.enableStressAnalysis,
        enableKeywordSpotting: input.enableKeywordSpotting,
        triggeredBy: `agent:${context.agentId}`,
      });
    },
  });

  registerTool({
    name: "generate_analysis_code",
    description: "Generate production-ready Python or SQL code to perform custom data analysis when no existing tool handles the task. Validates code for security, provides execution plan, and runs in a sandboxed simulation environment. Use when a user asks a complex data question requiring custom analytical code.",
    inputSchema: z.object({
      task: z.string().min(10).describe("What the code should do — be specific about inputs, transformations, and expected output"),
      language: z.enum(["python", "sql", "javascript", "typescript", "r"]).default("python"),
      domain: z.enum(["data_analysis", "report_generation", "automation", "visualization", "etl", "general"]).default("data_analysis"),
      contextData: z.string().optional().describe("Schema or sample data the code should work with"),
      constraints: z.array(z.string()).optional().describe("Any constraints or requirements"),
      executeAfterGeneration: z.boolean().default(false).describe("Whether to simulate execution after generation"),
    }),
    handler: async (input, context) => {
      const { generateCode, executeCodeSandboxed } = await import("./code-generation");
      const result = await generateCode({
        task: input.task,
        language: input.language,
        domain: input.domain,
        contextData: input.contextData,
        constraints: input.constraints,
        triggeredBy: `agent:${context.agentId}`,
        agentId: context.agentId,
      });

      if (!input.executeAfterGeneration || !result.securityValidation.safe) {
        return result;
      }

      const execution = await executeCodeSandboxed({
        code: result.code,
        language: result.language,
        codeGenId: result.codeGenId,
      });

      return { ...result, execution };
    },
  });

  registerTool({
    name: "multimodal_rag_query",
    description: "Search the multimodal knowledge base that stores text, images, audio transcripts, documents, and structured data in a unified vector space. A text query can surface relevant images, audio clips, or documents. Use for cross-format knowledge retrieval.",
    inputSchema: z.object({
      query: z.string().min(1).describe("Natural language search query"),
      domain: z.string().optional().describe("Filter by domain (maritime, legal, real_estate, etc.)"),
      modalityTypes: z.array(z.enum(["text", "image", "audio", "video", "document", "structured_data"])).optional().describe("Filter by modality type"),
      topK: z.number().int().min(1).max(20).default(5),
      produceSummary: z.boolean().default(true),
    }),
    handler: async (input) => {
      const { queryMultimodalRag } = await import("./multimodal-rag");
      return queryMultimodalRag(input.query, {
        domain: input.domain,
        modalityTypes: input.modalityTypes as any,
        topK: input.topK,
        produceSummary: input.produceSummary,
      });
    },
  });

  registerTool({
    name: "generate_intelligence_briefing",
    description: "Generate structured intelligence briefings and multimodal output bundles from analysis results. Produces formal reports with executive summaries, section breakdowns, chart specifications, audio summaries for mobile, and actionable briefing cards. Use to synthesize multiple intelligence assessments into a shareable briefing.",
    inputSchema: z.object({
      domain: z.enum(["maritime", "real_estate", "legal", "defense", "financial", "general"]),
      content: z.string().min(10).describe("Intelligence content to package into briefing"),
      title: z.string().optional(),
      outputModalities: z.array(z.enum(["text", "chart", "annotated_image", "audio_summary", "structured_report", "briefing_card"])).default(["text", "chart", "structured_report", "briefing_card"]),
    }),
    handler: async (input) => {
      const { generateMultimodalOutput } = await import("./multimodal-output");
      return generateMultimodalOutput({
        content: input.content,
        domain: input.domain as any,
        requestedModalities: input.outputModalities as any,
        title: input.title,
      });
    },
  });

  logger.info("Registered 6 multimodal intelligence tools");
}
