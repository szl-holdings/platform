import { ServiceAdapter, type ServiceStatus } from "../base.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  provider: "openai" | "anthropic" | "replit-proxy" | "mock";
  usage: { promptTokens: number; completionTokens: number };
}

const MOCK_RESPONSES = [
  "I'd be happy to help with that! Based on the available data, here's what I can tell you...",
  "That's a great question. Let me break it down for you step by step.",
  "Here's a comprehensive overview of what you're looking for.",
  "I've analyzed the information and here are my findings.",
];

export class AIAdapter extends ServiceAdapter {
  readonly name = "ai";
  readonly description =
    "AI chat completions via Replit OpenAI proxy, OpenAI, or Anthropic with automatic fallback";
  readonly requiredEnvVars = ["AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY or ANTHROPIC_API_KEY"];

  private get replitProxyUrl(): string | undefined {
    return process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  }

  private get replitProxyKey(): string | undefined {
    return process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  }

  private get anthropicKey(): string | undefined {
    return process.env["ANTHROPIC_API_KEY"];
  }

  private get openaiKey(): string | undefined {
    return process.env["OPENAI_API_KEY"];
  }

  private get hasReplitProxy(): boolean {
    return !!(this.replitProxyKey && this.replitProxyUrl);
  }

  get status(): ServiceStatus {
    if (this.hasReplitProxy || this.openaiKey || this.anthropicKey) return "LIVE_CONFIGURED";
    return "MOCKED_DEMO_MODE";
  }

  get isLive(): boolean {
    return !!(this.hasReplitProxy || this.openaiKey || this.anthropicKey);
  }

  protected async performHealthCheck(): Promise<void> {
    if (this.replitProxyKey && this.replitProxyUrl) {
      const response = await fetch(`${this.replitProxyUrl}/models`, {
        headers: { Authorization: `Bearer ${this.replitProxyKey}` },
      });
      if (!response.ok) throw new Error(`Replit OpenAI proxy returned ${response.status}`);
    } else if (this.openaiKey) {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${this.openaiKey}` },
      });
      if (!response.ok) throw new Error(`OpenAI API returned ${response.status}`);
    } else if (this.anthropicKey) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.anthropicKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "claude-3-haiku-20240307", max_tokens: 1, messages: [{ role: "user", content: "ping" }] }),
      });
      if (!response.ok && response.status !== 400) throw new Error(`Anthropic API returned ${response.status}`);
    }
  }

  get presentEnvVars(): string[] {
    const present: string[] = [];
    if (this.replitProxyKey) present.push("AI_INTEGRATIONS_OPENAI_API_KEY");
    if (this.replitProxyUrl) present.push("AI_INTEGRATIONS_OPENAI_BASE_URL");
    if (this.openaiKey) present.push("OPENAI_API_KEY");
    if (this.anthropicKey) present.push("ANTHROPIC_API_KEY");
    return present;
  }

  get missingEnvVars(): string[] {
    if (this.replitProxyKey || this.openaiKey || this.anthropicKey) return [];
    return ["AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY or ANTHROPIC_API_KEY"];
  }

  async chatCompletion(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
  ): Promise<ChatCompletionResult> {
    if (!this.isLive) {
      return this.mockChatCompletion(messages);
    }

    const providers: Array<() => Promise<ChatCompletionResult>> = [];

    if (this.hasReplitProxy) {
      providers.push(() => this.replitProxyCompletion(messages, options));
    }
    if (this.openaiKey) {
      providers.push(() => this.openaiCompletion(messages, options));
    }
    if (this.anthropicKey) {
      providers.push(() => this.anthropicCompletion(messages, options));
    }

    for (const tryProvider of providers) {
      try {
        return await tryProvider();
      } catch {
        continue;
      }
    }

    return this.mockChatCompletion(messages);
  }

  private async replitProxyCompletion(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
  ): Promise<ChatCompletionResult> {
    const model = options?.model ?? "gpt-4o-mini";
    const response = await fetch(
      `${this.replitProxyUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.replitProxyKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options?.maxTokens ?? 1024,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Replit OpenAI proxy error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number };
    };

    return {
      content: data.choices[0]?.message?.content ?? "",
      model,
      provider: "replit-proxy",
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }

  private async openaiCompletion(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
  ): Promise<ChatCompletionResult> {
    const model = options?.model ?? "gpt-4o-mini";
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options?.maxTokens ?? 1024,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage: { prompt_tokens: number; completion_tokens: number };
    };

    return {
      content: data.choices[0]?.message?.content ?? "",
      model,
      provider: "openai",
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }

  private async anthropicCompletion(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
  ): Promise<ChatCompletionResult> {
    const model = options?.model ?? "claude-sonnet-4-20250514";
    const systemMessage = messages.find((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const body: Record<string, unknown> = {
      model,
      max_tokens: options?.maxTokens ?? 1024,
      messages: nonSystemMessages,
    };
    if (systemMessage) {
      body["system"] = systemMessage.content;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.anthropicKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      content: Array<{ text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    return {
      content: data.content[0]?.text ?? "",
      model,
      provider: "anthropic",
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
      },
    };
  }

  private async mockChatCompletion(
    _messages: ChatMessage[],
  ): Promise<ChatCompletionResult> {
    const idx = Math.floor(Math.random() * MOCK_RESPONSES.length);
    return {
      content: MOCK_RESPONSES[idx]!,
      model: "mock-model",
      provider: "mock",
      usage: { promptTokens: 0, completionTokens: 0 },
    };
  }
}
