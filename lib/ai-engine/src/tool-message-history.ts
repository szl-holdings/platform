export interface ToolHistoryMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
  toolArguments?: Record<string, unknown>;
}

function hasToolMetadata(message: ToolHistoryMessage): boolean {
  return (
    message.toolCallId !== undefined ||
    message.name !== undefined ||
    message.toolArguments !== undefined
  );
}

function requireNonEmpty(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid tool history: ${field} must be a non-empty string`);
  }
}

/** Validate native call/result batches without executing or authorizing tools. */
export function groupToolMessageHistory<T extends ToolHistoryMessage>(messages: readonly T[]): T[][] {
  const history = messages.filter((message) => message.role !== 'system');
  const groups: T[][] = [];
  const seenIds = new Set<string>();
  let i = 0;

  while (i < history.length) {
    const message = history[i]!;
    if (message.role === 'tool') {
      throw new Error('Invalid tool history: orphan or duplicate tool result');
    }
    if (message.role !== 'assistant' || !hasToolMetadata(message)) {
      groups.push([message]);
      i++;
      continue;
    }

    const group: T[] = [];
    const pending = new Map<string, string>();
    while (i < history.length) {
      const call = history[i]!;
      if (call.role !== 'assistant' || !hasToolMetadata(call)) break;
      requireNonEmpty(call.toolCallId, 'tool call ID');
      requireNonEmpty(call.name, 'tool name');
      if (seenIds.has(call.toolCallId)) {
        throw new Error('Invalid tool history: duplicate tool call ID');
      }
      if (
        call.toolArguments !== undefined &&
        (call.toolArguments === null ||
          typeof call.toolArguments !== 'object' ||
          Array.isArray(call.toolArguments))
      ) {
        throw new Error('Invalid tool history: tool arguments must be an object');
      }
      seenIds.add(call.toolCallId);
      pending.set(call.toolCallId, call.name);
      group.push(call);
      i++;
    }

    while (i < history.length && history[i]!.role === 'tool') {
      const result = history[i]!;
      requireNonEmpty(result.toolCallId, 'tool result ID');
      const name = pending.get(result.toolCallId);
      if (name === undefined) {
        throw new Error('Invalid tool history: orphan or duplicate tool result');
      }
      if (result.name !== undefined && result.name !== name) {
        throw new Error('Invalid tool history: tool result name does not match its call');
      }
      pending.delete(result.toolCallId);
      group.push(result);
      i++;
    }
    if (pending.size > 0) {
      throw new Error('Invalid tool history: tool calls must be followed by all their results');
    }
    groups.push(group);
  }

  return groups;
}

/** Keep the latest messages, extending the window to retain a whole boundary batch. */
export function selectToolMessageHistory<T extends ToolHistoryMessage>(
  messages: readonly T[],
  maxMessages = 20,
): T[] {
  if (!Number.isSafeInteger(maxMessages) || maxMessages < 1) {
    throw new Error('maxMessages must be a positive safe integer');
  }
  const groups = groupToolMessageHistory(messages);
  let start = groups.length;
  let count = 0;
  while (start > 0 && count < maxMessages) {
    start--;
    count += groups[start]!.length;
  }
  return groups.slice(start).flat();
}
