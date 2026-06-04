import type { ToolManifest } from '@workspace/tool-mesh';
import type { ZodTypeAny, z } from 'zod';
import { AgentToolsError } from './errors.js';

export type ToolHandler<TInput, TOutput> = (
  input: TInput,
  manifest: ToolManifest,
) => Promise<TOutput>;

export interface TypedTool<TInput = unknown, TOutput = unknown> {
  manifest: ToolManifest;
  inputSchema: ZodTypeAny;
  outputSchema: ZodTypeAny;
  handler: ToolHandler<TInput, TOutput>;
}

export function defineTool<
  TInputSchema extends ZodTypeAny,
  TOutputSchema extends ZodTypeAny,
>(params: {
  manifest: ToolManifest;
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
  handler: ToolHandler<z.infer<TInputSchema>, z.infer<TOutputSchema>>;
}): TypedTool<z.infer<TInputSchema>, z.infer<TOutputSchema>> {
  if (!params.manifest.id) {
    throw new AgentToolsError('Tool manifest must have an id');
  }
  if (!params.inputSchema) {
    throw new AgentToolsError(`Tool '${params.manifest.id}' must define an inputSchema`);
  }
  if (!params.outputSchema) {
    throw new AgentToolsError(`Tool '${params.manifest.id}' must define an outputSchema`);
  }
  return {
    manifest: params.manifest,
    inputSchema: params.inputSchema,
    outputSchema: params.outputSchema,
    handler: params.handler,
  };
}

export function isTypedTool(value: unknown): value is TypedTool {
  return (
    typeof value === 'object' &&
    value !== null &&
    'manifest' in value &&
    'inputSchema' in value &&
    'outputSchema' in value &&
    'handler' in value &&
    typeof (value as TypedTool).handler === 'function'
  );
}
