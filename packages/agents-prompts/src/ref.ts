import { z } from "zod";

export const PromptRefSchema = z.object({
  id: z.string().describe("Prompt definition ID in the prompt registry"),
  versionConstraint: z
    .string()
    .optional()
    .describe("Optional semver-style constraint: 'active', 'v2', 'latest'. Defaults to active version."),
});

export type PromptRef = z.infer<typeof PromptRefSchema>;

export function ref(id: string, versionConstraint?: string): PromptRef {
  return PromptRefSchema.parse({ id, versionConstraint });
}

export class PromptRefResolutionError extends Error {
  readonly promptId: string;
  constructor(promptId: string, reason: string) {
    super(`[prompt:${promptId}] ${reason}`);
    this.name = "PromptRefResolutionError";
    this.promptId = promptId;
  }
}
