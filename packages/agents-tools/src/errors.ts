export class AgentToolsError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'AgentToolsError';
  }
}

export class ToolRegistrationError extends AgentToolsError {
  readonly toolId: string;
  constructor(toolId: string, message: string) {
    super(`[tool:${toolId}] ${message}`);
    this.name = 'ToolRegistrationError';
    this.toolId = toolId;
  }
}

export class ToolInvocationError extends AgentToolsError {
  readonly toolId: string;
  constructor(toolId: string, message: string, cause?: unknown) {
    super(`[tool:${toolId}] ${message}`, cause);
    this.name = 'ToolInvocationError';
    this.toolId = toolId;
  }
}

export class ToolSchemaValidationError extends AgentToolsError {
  readonly toolId: string;
  readonly direction: 'input' | 'output';
  readonly issues: unknown[];
  constructor(toolId: string, direction: 'input' | 'output', issues: unknown[]) {
    super(`[tool:${toolId}] ${direction} schema validation failed`);
    this.name = 'ToolSchemaValidationError';
    this.toolId = toolId;
    this.direction = direction;
    this.issues = issues;
  }
}
