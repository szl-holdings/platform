import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";
import { executeTool, listTools } from "./tool-registry";
import { emitTrace } from "./agentops";
import type { AgentExecutionContext } from "./types";
import type { ChatMessage } from "@szl-holdings/services";

export interface CompoundStep {
  stepId: string;
  type: "llm" | "tool" | "branch" | "parallel" | "aggregate" | "transform" | "search";
  config: Record<string, any>;
  dependsOn?: string[];
}

export interface CompoundPipeline {
  pipelineId: string;
  name: string;
  steps: CompoundStep[];
  routing: "fastest" | "cheapest" | "quality";
}

export interface CompoundResult {
  pipelineId: string;
  status: "completed" | "failed";
  results: Record<string, any>;
  totalLatencyMs: number;
  totalTokens: number;
  totalCost: number;
  stepTimings: { stepId: string; latencyMs: number; tokens: number }[];
}

export async function executeCompoundPipeline(
  pipeline: CompoundPipeline,
  input: Record<string, any>,
  context: AgentExecutionContext
): Promise<CompoundResult> {
  const startTime = Date.now();
  const results: Record<string, any> = { input };
  const stepTimings: { stepId: string; latencyMs: number; tokens: number }[] = [];
  let totalTokens = 0;
  let totalCost = 0;

  const completed = new Set<string>();

  function getReadySteps(): CompoundStep[] {
    return pipeline.steps.filter(step => {
      if (completed.has(step.stepId)) return false;
      if (!step.dependsOn?.length) return true;
      return step.dependsOn.every(d => completed.has(d));
    });
  }

  let iterations = 0;
  let hasFailure = false;
  while (completed.size < pipeline.steps.length && iterations < pipeline.steps.length * 2) {
    iterations++;
    const ready = getReadySteps();
    if (ready.length === 0) break;

    const parallelSteps = ready.length > 1 ? ready : [ready[0]];

    const stepResults = await Promise.allSettled(
      parallelSteps.map(async (step) => {
        const stepStart = Date.now();
        let stepResult: any;
        let tokens = 0;

        switch (step.type) {
          case "llm": {
            const model = selectModel(pipeline.routing, step.config.model);
            const messages: ChatMessage[] = resolveMessages(step.config.messages || [], results);
            const response = await gatewayInfer({
              model,
              preferredProvider: step.config.provider || "openai",
              messages,
              maxTokens: step.config.maxTokens ?? 1000,
              strategy: mapRouting(pipeline.routing),
            });
            stepResult = response.content;
            tokens = response.usage?.totalTokens ?? 0;
            break;
          }

          case "tool": {
            const toolInput = resolveTemplate(step.config.input || {}, results);
            const result = await executeTool(step.config.toolName, toolInput, context);
            stepResult = result.output;
            break;
          }

          case "branch": {
            const condition = resolveTemplate(step.config.condition, results);
            const evaluatedCondition = evaluateCondition(condition, results);
            stepResult = {
              branch: evaluatedCondition ? "true" : "false",
              next: evaluatedCondition ? step.config.trueStep : step.config.falseStep,
            };
            break;
          }

          case "parallel": {
            const subSteps = step.config.steps || [];
            const subResults = await Promise.all(
              subSteps.map(async (subStep: any) => {
                const resp = await gatewayInfer({
                  model: selectModel(pipeline.routing, subStep.model),
                  preferredProvider: subStep.provider || "openai",
                  messages: resolveMessages(subStep.messages || [], results) as ChatMessage[],
                  maxTokens: 500,
                  strategy: mapRouting(pipeline.routing),
                });
                return resp.content;
              })
            );
            stepResult = subResults;
            break;
          }

          case "aggregate": {
            const inputs = (step.config.sourceSteps || []).map((s: string) => results[s]);
            stepResult = step.config.strategy === "concat"
              ? inputs.join("\n\n")
              : step.config.strategy === "best"
                ? inputs.sort((a: string, b: string) => b.length - a.length)[0]
                : inputs;
            break;
          }

          case "transform": {
            const sourceData = results[step.config.sourceStep] || "";
            if (step.config.transform === "json") {
              try { stepResult = JSON.parse(sourceData); } catch { stepResult = sourceData; }
            } else if (step.config.transform === "extract-entities") {
              const entityResp = await gatewayInfer({
                model: "gpt-4o-mini",
                preferredProvider: "openai",
                messages: [
                  { role: "system" as const, content: "Extract key entities (people, organizations, locations, dates, amounts) from the text. Respond with JSON array." },
                  { role: "user" as const, content: String(sourceData).slice(0, 3000) },
                ],
                maxTokens: 500,
                strategy: "cheapest",
              });
              try { stepResult = JSON.parse(entityResp.content || "[]"); } catch { stepResult = []; }
              tokens += entityResp.usage?.totalTokens ?? 0;
            } else if (step.config.transform === "summarize") {
              const sumResp = await gatewayInfer({
                model: "gpt-4o-mini",
                preferredProvider: "openai",
                messages: [
                  { role: "system" as const, content: "Summarize the following text concisely." },
                  { role: "user" as const, content: String(sourceData).slice(0, 4000) },
                ],
                maxTokens: 300,
                strategy: "cheapest",
              });
              stepResult = sumResp.content;
              tokens += sumResp.usage?.totalTokens ?? 0;
            } else {
              stepResult = sourceData;
            }
            break;
          }

          case "search": {
            const query = resolveTemplate(step.config.query, results);
            const searchResult = await pool.query(
              `SELECT content, 1 - (embedding <=> (SELECT embedding FROM ai_embeddings WHERE content ILIKE '%' || $1 || '%' LIMIT 1)) as similarity
               FROM ai_embeddings WHERE content ILIKE '%' || $1 || '%' ORDER BY similarity DESC LIMIT $2`,
              [String(query).slice(0, 100), step.config.topK || 5]
            ).catch(() => ({ rows: [] }));
            stepResult = searchResult.rows;
            break;
          }
        }

        const latencyMs = Date.now() - stepStart;
        totalTokens += tokens;
        stepTimings.push({ stepId: step.stepId, latencyMs, tokens });

        return { stepId: step.stepId, result: stepResult };
      })
    );

    for (const r of stepResults) {
      if (r.status === "fulfilled") {
        const { stepId, result } = r.value;
        results[stepId] = result;
        completed.add(stepId);
      } else {
        const failedStep = parallelSteps[stepResults.indexOf(r)];
        results[failedStep.stepId] = { error: (r.reason as Error).message };
        completed.add(failedStep.stepId);
        hasFailure = true;
      }
    }
  }

  return {
    pipelineId: pipeline.pipelineId,
    status: hasFailure ? "failed" : "completed",
    results,
    totalLatencyMs: Date.now() - startTime,
    totalTokens,
    totalCost,
    stepTimings,
  };
}

function mapRouting(routing: string): "fastest" | "cheapest" | "preferred" | "fallback" {
  switch (routing) {
    case "fastest": return "fastest";
    case "cheapest": return "cheapest";
    case "quality": return "preferred";
    default: return "fastest";
  }
}

function selectModel(routing: string, preferredModel?: string): string {
  if (preferredModel) return preferredModel;
  switch (routing) {
    case "fastest": return "gpt-4o-mini";
    case "cheapest": return "gpt-4o-mini";
    case "quality": return "gpt-4o";
    default: return "gpt-4o-mini";
  }
}

function resolveMessages(messages: any[], context: Record<string, any>): ChatMessage[] {
  return messages.map(m => ({
    role: m.role,
    content: resolveTemplate(m.content, context),
  }));
}

function resolveTemplate(template: any, context: Record<string, any>): any {
  if (typeof template !== "string") return template;
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_: string, path: string) => {
    const parts = path.split(".");
    let value: any = context;
    for (const part of parts) {
      value = value?.[part];
    }
    return value !== undefined ? String(value) : `{{${path}}}`;
  });
}

function evaluateCondition(condition: any, context: Record<string, any>): boolean {
  if (typeof condition === "boolean") return condition;
  if (typeof condition === "string") {
    const value = context[condition];
    return !!value;
  }
  return true;
}

export function buildAnalysisPipeline(query: string, domains: string[]): CompoundPipeline {
  return {
    pipelineId: `pipe_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: "Cross-Domain Analysis",
    routing: "cheapest",
    steps: [
      {
        stepId: "research",
        type: "llm",
        config: {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: `You are a research analyst for SZL Holdings covering domains: ${domains.join(", ")}. Provide structured analysis.` },
            { role: "user", content: query },
          ],
          temperature: 0.3,
          maxTokens: 1500,
        },
      },
      {
        stepId: "entities",
        type: "transform",
        config: { sourceStep: "research", transform: "extract-entities" },
        dependsOn: ["research"],
      },
      {
        stepId: "summary",
        type: "transform",
        config: { sourceStep: "research", transform: "summarize" },
        dependsOn: ["research"],
      },
      {
        stepId: "synthesis",
        type: "llm",
        config: {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Synthesize the research, entities, and summary into a concise executive brief with action items." },
            { role: "user", content: "Research: {{research}}\n\nEntities: {{entities}}\n\nSummary: {{summary}}" },
          ],
          temperature: 0.5,
          maxTokens: 800,
        },
        dependsOn: ["entities", "summary"],
      },
    ],
  };
}
