import OpenAI from "openai";
import { getEnv } from "@szl-holdings/env";

const _env = getEnv();

if (!_env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
  throw new Error(
    "AI_INTEGRATIONS_OPENAI_BASE_URL must be set. Did you forget to provision the OpenAI AI integration?",
  );
}

if (!_env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  throw new Error(
    "AI_INTEGRATIONS_OPENAI_API_KEY must be set. Did you forget to provision the OpenAI AI integration?",
  );
}

export const openai = new OpenAI({
  apiKey: _env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: _env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});
