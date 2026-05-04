declare module '@huggingface/tiny-agents' {
  export interface AgentServerConfig {
    name: string;
    url: string;
    transport: 'sse' | 'stdio';
  }

  export interface AgentConfig {
    provider?: string;
    model: string;
    servers?: AgentServerConfig[];
    endpointUrl?: string;
  }

  export class Agent {
    constructor(config: AgentConfig);
    loadAgent(params: { name: string; provider?: string }): Promise<void>;
    run(input: string): AsyncIterable<{ type: string; content?: string }>;
  }
}
