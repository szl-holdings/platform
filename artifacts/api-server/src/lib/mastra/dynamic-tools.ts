import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { registerTool, listTools } from "./tool-registry";
import { z } from "zod";
import type { AgentExecutionContext } from "./types";

export interface ToolChainUsage {
  chainKey: string;
  toolSequence: string[];
  occurrences: number;
  avgLatencyMs: number;
  lastSeen: string;
}

export interface CompoundToolDefinition {
  compoundToolId: string;
  name: string;
  description: string;
  toolSequence: string[];
  inputMapping: Record<string, string>;
  outputMapping: string;
  proposedBy: string;
  status: "proposed" | "approved" | "active" | "deprecated";
  usageCount: number;
  createdAt: string;
}

export async function ensureDynamicToolTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_tool_chain_usage (
        id BIGSERIAL PRIMARY KEY,
        chain_key TEXT NOT NULL UNIQUE,
        tool_sequence JSONB NOT NULL,
        occurrences INTEGER NOT NULL DEFAULT 1,
        avg_latency_ms INTEGER NOT NULL DEFAULT 0,
        agent_ids JSONB DEFAULT '[]',
        last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_compound_tools (
        id BIGSERIAL PRIMARY KEY,
        compound_tool_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        tool_sequence JSONB NOT NULL,
        input_mapping JSONB DEFAULT '{}',
        output_mapping TEXT,
        proposed_by TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'proposed',
        usage_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    logger.info("Dynamic tool tables ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure dynamic tool tables");
  }
}

export async function recordToolChain(
  toolSequence: string[],
  agentId: string,
  latencyMs: number
): Promise<void> {
  if (toolSequence.length < 2) return;

  const chainKey = toolSequence.join("→");

  try {
    await pool.query(
      `INSERT INTO agent_tool_chain_usage (chain_key, tool_sequence, occurrences, avg_latency_ms, agent_ids, last_seen, created_at)
       VALUES ($1, $2, 1, $3, $4, NOW(), NOW())
       ON CONFLICT (chain_key) DO UPDATE SET
         occurrences = agent_tool_chain_usage.occurrences + 1,
         avg_latency_ms = (agent_tool_chain_usage.avg_latency_ms * agent_tool_chain_usage.occurrences + $3) / (agent_tool_chain_usage.occurrences + 1),
         last_seen = NOW()`,
      [chainKey, JSON.stringify(toolSequence), latencyMs, JSON.stringify([agentId])]
    );
  } catch (err) {
    logger.debug({ err }, "Failed to record tool chain");
  }
}

export async function identifyRepeatedChains(
  minOccurrences = 3
): Promise<ToolChainUsage[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM agent_tool_chain_usage WHERE occurrences >= $1 ORDER BY occurrences DESC LIMIT 20`,
      [minOccurrences]
    );
    return result.rows.map((r: any) => ({
      chainKey: r.chain_key,
      toolSequence: r.tool_sequence || [],
      occurrences: r.occurrences,
      avgLatencyMs: r.avg_latency_ms,
      lastSeen: r.last_seen,
    }));
  } catch {
    return [];
  }
}

export async function proposeCompoundTool(
  chain: ToolChainUsage,
  proposedBy: string
): Promise<CompoundToolDefinition | null> {
  const existingName = await pool.query(
    "SELECT compound_tool_id FROM agent_compound_tools WHERE tool_sequence = $1::jsonb",
    [JSON.stringify(chain.toolSequence)]
  ).then(r => r.rows[0]?.compound_tool_id).catch(() => null);

  if (existingName) return null;

  const availableTools = listTools()
    .filter(t => chain.toolSequence.includes(t.name))
    .map(t => `- ${t.name}: ${t.description}`)
    .join("\n");

  try {
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are an AI tool architect. Create a compound tool definition for a commonly used tool sequence.
Respond with JSON:
{
  "name": "compound_tool_name_snake_case",
  "description": "what this compound tool does in one sentence",
  "inputMapping": {"param": "description"},
  "outputMapping": "what the final output represents"
}`,
        },
        {
          role: "user",
          content: `Tool sequence used ${chain.occurrences} times: ${chain.toolSequence.join(" → ")}

Tool descriptions:
${availableTools}

Design a compound tool that packages this sequence:`,
        },
      ],
      maxTokens: 400,
      strategy: "cheapest",
    });

    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    const compoundToolId = `compound_${parsed.name || chain.toolSequence.join("_")}_${Date.now()}`;

    const def: CompoundToolDefinition = {
      compoundToolId,
      name: parsed.name || `compound_${chain.toolSequence[0]}_${chain.toolSequence.length}step`,
      description: parsed.description || `Compound tool: ${chain.toolSequence.join(" → ")}`,
      toolSequence: chain.toolSequence,
      inputMapping: parsed.inputMapping || {},
      outputMapping: parsed.outputMapping || "final tool output",
      proposedBy,
      status: "proposed",
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };

    await pool.query(
      `INSERT INTO agent_compound_tools
       (compound_tool_id, name, description, tool_sequence, input_mapping, output_mapping, proposed_by, status, usage_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'proposed', 0, NOW(), NOW())`,
      [def.compoundToolId, def.name, def.description, JSON.stringify(def.toolSequence), JSON.stringify(def.inputMapping), def.outputMapping, proposedBy]
    );

    logger.info({ compoundToolId, name: def.name }, "Compound tool proposed");
    return def;
  } catch (err) {
    logger.error({ err }, "Failed to propose compound tool");
    return null;
  }
}

export async function activateCompoundTool(compoundToolId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      "SELECT * FROM agent_compound_tools WHERE compound_tool_id = $1",
      [compoundToolId]
    );
    if (result.rows.length === 0) return false;

    const def = result.rows[0];
    const toolSequence: string[] = def.tool_sequence || [];

    registerTool({
      name: def.name,
      description: def.description,
      inputSchema: z.object({
        input: z.record(z.unknown()).optional().default({}),
      }),
      handler: async (input: any, context: AgentExecutionContext) => {
        const results: Record<string, unknown> = { ...input.input };
        for (const toolName of toolSequence) {
          const { executeTool } = await import("./tool-registry");
          const toolResult = await executeTool(toolName, results, context);
          if (toolResult.error) {
            return { error: toolResult.error, completedSteps: Object.keys(results) };
          }
          Object.assign(results, { [`${toolName}_result`]: toolResult.output });
        }
        return results;
      },
    });

    await pool.query(
      "UPDATE agent_compound_tools SET status = 'active', updated_at = NOW() WHERE compound_tool_id = $1",
      [compoundToolId]
    );

    logger.info({ compoundToolId, name: def.name }, "Compound tool activated and registered");
    return true;
  } catch (err) {
    logger.error({ err }, "Failed to activate compound tool");
    return false;
  }
}

export async function listCompoundTools(status?: string): Promise<CompoundToolDefinition[]> {
  try {
    const params: any[] = [];
    let query = "SELECT * FROM agent_compound_tools";
    if (status) { query += " WHERE status = $1"; params.push(status); }
    query += " ORDER BY created_at DESC LIMIT 50";

    const result = await pool.query(query, params);
    return result.rows.map((r: any) => ({
      compoundToolId: r.compound_tool_id, name: r.name, description: r.description,
      toolSequence: r.tool_sequence || [], inputMapping: r.input_mapping || {},
      outputMapping: r.output_mapping, proposedBy: r.proposed_by,
      status: r.status, usageCount: r.usage_count, createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

export async function runPeriodicToolAnalysis(): Promise<{ proposed: number; chains: number }> {
  const chains = await identifyRepeatedChains(3);
  let proposed = 0;

  for (const chain of chains.slice(0, 5)) {
    const proposal = await proposeCompoundTool(chain, "system-auto");
    if (proposal) proposed++;
  }

  return { proposed, chains: chains.length };
}
