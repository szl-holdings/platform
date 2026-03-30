export interface AgentDefinition {
  id: string;
  name: string;
  domain: string;
  systemPrompt: string;
  preferredModel: string;
  preferredProvider: "openai" | "anthropic" | "gemini";
  highStakesDomains: string[];
  tools: string[];
}

export interface DomainRoutingRule {
  domain: string;
  keywords: string[];
}

export interface ValidationResult {
  validated: boolean;
  validatorNotes: string;
  adjustedOutput: string;
  status: "APPROVED" | "APPROVED_WITH_NOTES" | "REJECTED";
}

export interface AgentCallResult {
  agentId: string;
  agentName: string;
  response: string;
  confidence: number;
  domain: string;
}

export interface RAGChunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface DomainAgentConfig {
  name: string;
  systemPrompt: string;
  tools: ToolDefinition[];
  executeTool: (name: string, args: Record<string, unknown>) => Promise<string>;
}
