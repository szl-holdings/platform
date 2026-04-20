import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "@szl-holdings/env";

const _env = getEnv();

if (!_env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL) {
  throw new Error(
    "AI_INTEGRATIONS_ANTHROPIC_BASE_URL must be set. Did you forget to provision the Anthropic AI integration?",
  );
}

if (!_env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
  throw new Error(
    "AI_INTEGRATIONS_ANTHROPIC_API_KEY must be set. Did you forget to provision the Anthropic AI integration?",
  );
}

export const anthropic = new Anthropic({
  apiKey: _env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: _env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});
