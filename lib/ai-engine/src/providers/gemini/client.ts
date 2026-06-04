import { GoogleGenAI } from '@google/genai';
import { getEnv } from '@szl-holdings/env';

const _env = getEnv();

if (!_env.AI_INTEGRATIONS_GEMINI_BASE_URL) {
  throw new Error(
    'AI_INTEGRATIONS_GEMINI_BASE_URL must be set. Did you forget to provision the Gemini AI integration?',
  );
}

if (!_env.AI_INTEGRATIONS_GEMINI_API_KEY) {
  throw new Error(
    'AI_INTEGRATIONS_GEMINI_API_KEY must be set. Did you forget to provision the Gemini AI integration?',
  );
}

export const ai = new GoogleGenAI({
  apiKey: _env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: '',
    baseUrl: _env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});
