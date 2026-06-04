import { ServiceAdapter, type ServiceStatus } from "../base.js";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  provider: "openai" | "anthropic" | "replit-proxy" | "gemini" | "huggingface" | "mock";
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
    return process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  }

  private get replitProxyKey(): string | undefined {
    return process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  }

  private get anthropicKey(): string | undefined {
    return process.env.ANTHROPIC_API_KEY;
  }

  private get openaiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }

  private get geminiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  private get huggingfaceKey(): string | undefined {
    return process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  }

  private get hasReplitProxy(): boolean {
    return !!(this.replitProxyKey && this.replitProxyUrl);
  }

  override get status(): ServiceStatus {
    if (this.hasReplitProxy || this.openaiKey || this.anthropicKey) return "LIVE_CONFIGURED";
    return "MOCKED_DEMO_MODE";
  }

  override get isLive(): boolean {
    return !!(this.hasReplitProxy || this.openaiKey || this.anthropicKey);
  }

  protected override async performHealthCheck(): Promise<void> {
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

  override get presentEnvVars(): string[] {
    const present: string[] = [];
    if (this.replitProxyKey) present.push("AI_INTEGRATIONS_OPENAI_API_KEY");
    if (this.replitProxyUrl) present.push("AI_INTEGRATIONS_OPENAI_BASE_URL");
    if (this.openaiKey) present.push("OPENAI_API_KEY");
    if (this.anthropicKey) present.push("ANTHROPIC_API_KEY");
    return present;
  }

  override get missingEnvVars(): string[] {
    if (this.replitProxyKey || this.openaiKey || this.anthropicKey) return [];
    return ["AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY or ANTHROPIC_API_KEY"];
  }

  async chatCompletionForProvider(
    provider: "replit-proxy" | "openai" | "anthropic" | "gemini" | "huggingface",
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number; signal?: AbortSignal },
  ): Promise<ChatCompletionResult> {
    if (!this.isLive && provider !== "gemini" && provider !== "huggingface") {
      const isProduction =
        process.env.NODE_ENV === "production" ||
        process.env.APP_ENV === "production" ||
        process.env.RUNTIME_MODE === "production";
      if (isProduction) {
        throw new Error(
          `[ai-adapter] Provider "${provider}" is not configured in production mode. ` +
            `Mock responses are not permitted in production. Configure real AI provider credentials.`,
        );
      }
      return this.mockChatCompletion(messages);
    }

    const { signal, ...completionOptions } = options ?? {};

    if (provider === "replit-proxy" && this.hasReplitProxy) {
      return this.replitProxyCompletion(messages, completionOptions, signal);
    }
    if (provider === "openai" && this.openaiKey) {
      return this.openaiCompletion(messages, completionOptions, signal);
    }
    if (provider === "anthropic" && this.anthropicKey) {
      return this.anthropicCompletion(messages, completionOptions, signal);
    }
    if (provider === "gemini" && this.geminiKey) {
      return this.geminiCompletion(messages, completionOptions, signal);
    }
    if (provider === "huggingface" && this.huggingfaceKey) {
      return this.huggingfaceCompletion(messages, completionOptions, signal);
    }

    throw new Error(`Provider "${provider}" is not configured or unavailable`);
  }

  isProviderConfigured(provider: "replit-proxy" | "openai" | "anthropic" | "gemini" | "huggingface"): boolean {
    if (provider === "replit-proxy") return this.hasReplitProxy;
    if (provider === "openai") return !!this.openaiKey;
    if (provider === "anthropic") return !!this.anthropicKey;
    if (provider === "gemini") return !!this.geminiKey;
    if (provider === "huggingface") return !!this.huggingfaceKey;
    return false;
  }

  async chatCompletion(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
  ): Promise<ChatCompletionResult> {
    // Mock mode is opt-in only — set AI_MOCK_MODE=true to enable demo/test mode.
    // In production mode, AI_MOCK_MODE is disallowed: mock AI must never masquerade
    // as real operational behavior in a live customer-facing environment.
    if (process.env.AI_MOCK_MODE === "true") {
      const isProduction =
        process.env.NODE_ENV === "production" ||
        process.env.APP_ENV === "production" ||
        process.env.RUNTIME_MODE === "production";
      if (isProduction) {
        throw new Error(
          "[ai-adapter] AI_MOCK_MODE=true is not permitted in production mode. " +
            "Remove AI_MOCK_MODE or set it to 'false'. Configure real AI provider credentials instead.",
        );
      }
      return this.mockChatCompletion(messages);
    }

    // Try Responses API first (preferred) for OpenAI-compatible providers, then
    // fall back to Chat Completions, then Anthropic if configured.
    const providers: Array<() => Promise<ChatCompletionResult>> = [];

    if (this.hasReplitProxy) {
      const responsesOpts = { model: options?.model, maxOutputTokens: options?.maxTokens };
      providers.push(() => this.replitProxyResponse(messages, responsesOpts));
      providers.push(() => this.replitProxyCompletion(messages, options));
    }
    if (this.openaiKey) {
      const responsesOpts = { model: options?.model, maxOutputTokens: options?.maxTokens };
      providers.push(() => this.openaiResponse(messages, responsesOpts));
      providers.push(() => this.openaiCompletion(messages, options));
    }
    if (this.anthropicKey) {
      providers.push(() => this.anthropicCompletion(messages, options));
    }

    if (providers.length === 0) {
      // In production mode, missing AI credentials is a hard failure — never silently mock.
      // In non-production modes, fall back to mock to keep demos and local dev functional.
      if (process.env.NODE_ENV === "production" || process.env.APP_ENV === "production" || process.env.RUNTIME_MODE === "production") {
        throw new Error(
          "[ai-adapter] No AI providers configured in production mode. " +
            "Set AI_INTEGRATIONS_OPENAI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY to enable AI features. " +
            "Set AI_MOCK_MODE=true to explicitly opt in to demo/mock responses (not recommended in production).",
        );
      }
      // Non-production: fall back to mock to avoid hard crash in dev/demo environments.
      // Set AI_INTEGRATIONS_OPENAI_API_KEY or OPENAI_API_KEY to enable live AI.
      return this.mockChatCompletion(messages);
    }

    const errors: string[] = [];
    for (const tryProvider of providers) {
      try {
        return await tryProvider();
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    // All configured providers failed.
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.APP_ENV === "production" ||
      process.env.RUNTIME_MODE === "production";

    if (isProduction) {
      throw new Error(
        `[ai-adapter] All configured AI providers failed in production mode. ` +
          `Provider errors: ${errors.join("; ")}. ` +
          `Check provider credentials and network connectivity. Mock responses are not permitted in production.`,
      );
    }

    // Non-production: fall back to mock after all providers fail, to keep demos and dev functional.
    return this.mockChatCompletion(messages);
  }

  private async replitProxyCompletion(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
    signal?: AbortSignal,
  ): Promise<ChatCompletionResult> {
    const model = options?.model ?? "gpt-5.2";
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
        signal: signal ?? null,
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
    signal?: AbortSignal,
  ): Promise<ChatCompletionResult> {
    const model = options?.model ?? "gpt-5.2";
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
        signal: signal ?? null,
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

  private async replitProxyResponse(
    messages: ChatMessage[],
    options?: { model?: string; maxOutputTokens?: number },
    signal?: AbortSignal,
  ): Promise<ChatCompletionResult> {
    const model = options?.model ?? "gpt-5.2";
    const systemParts = messages.filter((m) => m.role === "system").map((m) => m.content);
    const instructions = systemParts.length > 0 ? systemParts.join("\n\n") : undefined;
    const input = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const body: Record<string, unknown> = {
      model,
      input: input.length === 1 && input[0]?.role === "user" ? input[0].content : input,
      max_output_tokens: options?.maxOutputTokens ?? 1024,
    };
    if (instructions) body.instructions = instructions;

    const response = await fetch(
      `${this.replitProxyUrl}/responses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.replitProxyKey}`,
        },
        body: JSON.stringify(body),
        signal: signal ?? null,
      },
    );

    if (!response.ok) {
      throw new Error(`Replit OpenAI proxy (Responses API) error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      output_text?: string;
      output?: Array<{ type: string; content?: Array<{ text?: string }> }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const content =
      data.output_text ??
      data.output?.find((o) => o.type === "message")?.content?.find((c) => c.text !== undefined)?.text ??
      "";

    return {
      content,
      model,
      provider: "replit-proxy",
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
      },
    };
  }

  private async openaiResponse(
    messages: ChatMessage[],
    options?: { model?: string; maxOutputTokens?: number },
    signal?: AbortSignal,
  ): Promise<ChatCompletionResult> {
    const model = options?.model ?? "gpt-5.2";
    const systemParts = messages.filter((m) => m.role === "system").map((m) => m.content);
    const instructions = systemParts.length > 0 ? systemParts.join("\n\n") : undefined;
    const input = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const body: Record<string, unknown> = {
      model,
      input: input.length === 1 && input[0]?.role === "user" ? input[0].content : input,
      max_output_tokens: options?.maxOutputTokens ?? 1024,
    };
    if (instructions) body.instructions = instructions;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiKey}`,
        },
        body: JSON.stringify(body),
        signal: signal ?? null,
      },
    );

    if (!response.ok) {
      throw new Error(`OpenAI Responses API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      output_text?: string;
      output?: Array<{ type: string; content?: Array<{ text?: string }> }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const content =
      data.output_text ??
      data.output?.find((o) => o.type === "message")?.content?.find((c) => c.text !== undefined)?.text ??
      "";

    return {
      content,
      model,
      provider: "openai",
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
      },
    };
  }

  async responsesForProvider(
    provider: "replit-proxy" | "openai" | "anthropic" | "gemini" | "huggingface",
    messages: ChatMessage[],
    options?: { model?: string; maxOutputTokens?: number; signal?: AbortSignal },
  ): Promise<ChatCompletionResult> {
    const { signal, ...completionOptions } = options ?? {};
    if (provider === "replit-proxy" && this.hasReplitProxy) {
      return this.replitProxyResponse(messages, completionOptions, signal);
    }
    if (provider === "openai" && this.openaiKey) {
      return this.openaiResponse(messages, completionOptions, signal);
    }
    return this.chatCompletionForProvider(provider, messages, {
      model: completionOptions.model,
      maxTokens: completionOptions.maxOutputTokens,
      signal,
    });
  }

  private async anthropicCompletion(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
    signal?: AbortSignal,
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
      body.system = systemMessage.content;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.anthropicKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: signal ?? null,
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

  private async geminiCompletion(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
    signal?: AbortSignal,
  ): Promise<ChatCompletionResult> {
    const model = options?.model ?? "gemini-2.0-flash";
    const systemMessage = messages.find((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const contents = nonSystemMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: { maxOutputTokens: options?.maxTokens ?? 1024 },
    };
    if (systemMessage) {
      body.systemInstruction = { parts: [{ text: systemMessage.content }] };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: signal ?? null,
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
    };

    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
      model,
      provider: "gemini",
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      },
    };
  }

  private async huggingfaceCompletion(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
    signal?: AbortSignal,
  ): Promise<ChatCompletionResult> {
    const model = options?.model ?? "Qwen/Qwen3-8B";
    const apiBase =
      process.env.HF_API_BASE || "https://router.huggingface.co/hf-inference/v1";

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.huggingfaceKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 1024,
      }),
      signal: signal ?? null,
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    return {
      content: data.choices[0]?.message?.content ?? "",
      model,
      provider: "huggingface",
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }

  async *streamChatCompletion(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
  ): AsyncGenerator<string, void, unknown> {
    const isProduction =
      process.env.NODE_ENV === "production" ||
      process.env.APP_ENV === "production" ||
      process.env.RUNTIME_MODE === "production";

    if (!this.isLive) {
      if (isProduction) {
        throw new Error(
          "[ai-adapter] No AI providers configured in production mode (streaming). " +
            "Configure real AI provider credentials. Mock streaming is not permitted in production.",
        );
      }
      yield* this.mockStreamCompletion();
      return;
    }

    const streamProviders: Array<() => AsyncGenerator<string, void, unknown>> = [];

    if (this.hasReplitProxy) {
      streamProviders.push(() => this.replitProxyStream(messages, options));
    }
    if (this.openaiKey) {
      streamProviders.push(() => this.openaiStream(messages, options));
    }
    if (this.anthropicKey) {
      streamProviders.push(() => this.anthropicStream(messages, options));
    }

    const streamErrors: string[] = [];
    for (const tryProvider of streamProviders) {
      try {
        yield* tryProvider();
        return;
      } catch (err) {
        streamErrors.push(err instanceof Error ? err.message : String(err));
      }
    }

    // All stream providers failed.
    if (isProduction) {
      throw new Error(
        `[ai-adapter] All configured AI streaming providers failed in production mode. ` +
          `Provider errors: ${streamErrors.join("; ")}. ` +
          `Check provider credentials and network connectivity. Mock streaming is not permitted in production.`,
      );
    }

    // Non-production: fall back to mock stream to keep demos and dev functional.
    yield* this.mockStreamCompletion();
  }

  private async *replitProxyStream(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
  ): AsyncGenerator<string, void, unknown> {
    yield* this.openaiCompatibleStream(
      `${this.replitProxyUrl}/chat/completions`,
      this.replitProxyKey!,
      messages,
      options,
    );
  }

  private async *openaiStream(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
  ): AsyncGenerator<string, void, unknown> {
    yield* this.openaiCompatibleStream(
      "https://api.openai.com/v1/chat/completions",
      this.openaiKey!,
      messages,
      options,
    );
  }

  private async *anthropicStream(
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
  ): AsyncGenerator<string, void, unknown> {
    const model = options?.model ?? "claude-sonnet-4-20250514";
    const systemMessage = messages.find((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const body: Record<string, unknown> = {
      model,
      max_tokens: options?.maxTokens ?? 1024,
      messages: nonSystemMessages,
      stream: true,
    };
    if (systemMessage) {
      body.system = systemMessage.content;
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
      throw new Error(`Anthropic stream error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed?.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data) as {
            type?: string;
            delta?: { type?: string; text?: string };
          };
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            yield parsed.delta.text;
          }
          if (parsed.type === "message_stop") return;
        } catch {
        }
      }
    }
  }

  private async *openaiCompatibleStream(
    url: string,
    apiKey: string,
    messages: ChatMessage[],
    options?: { model?: string; maxTokens?: number },
  ): AsyncGenerator<string, void, unknown> {
    const model = options?.model ?? "gpt-5.2";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Stream error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed?.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data) as {
            choices: Array<{ delta: { content?: string } }>;
          };
          const content = parsed.choices[0]?.delta?.content;
          if (content) yield content;
        } catch {
        }
      }
    }
  }

  private async *mockStreamCompletion(): AsyncGenerator<string, void, unknown> {
    const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]!;
    const words = response.split(" ");
    for (const word of words) {
      yield `${word} `;
      await new Promise((r) => setTimeout(r, 50));
    }
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
