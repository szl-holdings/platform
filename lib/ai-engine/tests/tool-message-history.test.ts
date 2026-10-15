import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnthropicChatInterface } from '../src/providers/anthropic/chat-with-tools.js';
import {
  DomainAgentRunner,
  getOrCreateConversation,
  type ChatInterface,
} from '../src/domain-agent-runner.js';
import {
  groupToolMessageHistory,
  selectToolMessageHistory,
  type ToolHistoryMessage,
} from '../src/tool-message-history.js';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('../src/providers/anthropic/client.js', () => ({
  anthropic: { messages: { create } },
}));
vi.mock('@szl-holdings/db', () => {
  throw new Error('Database access is disabled in synthetic normalization tests');
});

const call = (id: string): ToolHistoryMessage => ({
  role: 'assistant', content: '', toolCallId: id, name: 'lookup', toolArguments: {},
});
const result = (id: string): ToolHistoryMessage => ({
  role: 'tool', content: 'synthetic result', toolCallId: id,
});

describe('Anthropic message normalization', () => {
  beforeEach(() => {
    create.mockReset();
  });

  it('keeps every text block even when the first block is non-text', async () => {
    create.mockResolvedValue({ stop_reason: 'end_turn', content: [
      { type: 'thinking', thinking: 'synthetic', signature: 'synthetic' },
      { type: 'text', text: 'Hello ' }, { type: 'text', text: 'world' },
    ] });
    const ai = new AnthropicChatInterface({ messages: { create } } as never);
    await expect(ai.chatCompletion([{ role: 'user', content: 'hi' }]))
      .resolves.toEqual({ content: 'Hello world' });
  });

  it('retains complete parallel batches across the history window', () => {
    const tail: ToolHistoryMessage[] = Array.from({ length: 18 }, (_, i) => ({
      role: i % 2 ? 'assistant' : 'user', content: String(i),
    }));
    const batch = [call('a'), call('b'), result('b'), result('a')];
    const history: ToolHistoryMessage[] = [{ role: 'user', content: 'old' }, ...batch, ...tail];
    expect(selectToolMessageHistory(history)).toEqual([...batch, ...tail]);
  });

  it('the runner sends complete boundary batches without invoking an executor', async () => {
    const id = 'synthetic-native-history-boundary';
    const messages = getOrCreateConversation(id, 'system');
    const batch = [call('a'), call('b'), result('b'), result('a')];
    const history: ToolHistoryMessage[] = [
      { role: 'user', content: 'old' },
      ...batch,
      ...Array.from({ length: 17 }, (_, i): ToolHistoryMessage => ({
        role: i % 2 ? 'assistant' : 'user', content: String(i),
      })),
    ];
    messages.push(...history.map(({ name, ...message }) => ({
      ...message, ...(name === undefined ? {} : { toolName: name }),
    })));
    const executeTool = vi.fn(async () => {
      throw new Error('Tool execution is disabled in synthetic normalization tests');
    });
    const runner = new DomainAgentRunner({
      name: 'synthetic', systemPrompt: 'system', executeTool,
      tools: [{ name: 'lookup', description: 'synthetic', parameters: {} }],
    }, { model: 'synthetic', maxCompletionTokens: 64 });
    const complete = vi.fn<NonNullable<ChatInterface['chatCompletionWithTools']>>()
      .mockResolvedValue({ content: 'done', toolCalls: [], stopReason: 'stop' });
    const ai: ChatInterface = {
      chatCompletion: vi.fn(), streamChatCompletion: vi.fn(), chatCompletionWithTools: complete,
    };
    await expect(runner.chat('current question', id, ai)).resolves.toBe('done');
    const sent = complete.mock.calls[0]![0];
    expect(sent.filter((message) => message.role === 'assistant' && message.toolCallId)
      .map((message) => message.toolCallId)).toEqual(['a', 'b']);
    expect(sent.filter((message) => message.role === 'tool')
      .map((message) => message.toolCallId)).toEqual(['b', 'a']);
    expect(executeTool).not.toHaveBeenCalled();
  });

  it.each([
    [result('orphan')],
    [call(''), result('')],
    [call('a')],
    [call('a'), call('a'), result('a')],
    [call('a'), call('b'), result('a'), result('a')],
    [call('a'), { role: 'user', content: 'interrupt' }, result('a')],
  ] as ToolHistoryMessage[][])('rejects malformed batches before a provider call: %j', async (...history) => {
    expect(() => groupToolMessageHistory(history)).toThrow('Invalid tool history');
    const ai = new AnthropicChatInterface({ messages: { create } } as never);
    await expect(ai.chatCompletionWithTools(history, [])).rejects.toThrow('Invalid tool history');
    expect(create).not.toHaveBeenCalled();
  });
});
