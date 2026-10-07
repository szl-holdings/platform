import { describe, expect, it, vi } from 'vitest';
import {
  AnthropicChatInterface,
  AnthropicCompletionResponseError,
} from '../src/providers/anthropic/chat-with-tools.js';

// An injected client must never initialize the configured credential singleton.
vi.mock('../src/providers/anthropic/client.js', () => {
  throw new Error('Offline tests must not initialize the default provider client.');
});

const messages = [
  { role: 'system' as const, content: 'first system' },
  { role: 'user' as const, content: 'fixture' },
  { role: 'system' as const, content: 'second system' },
];

function injected(content: unknown[], stopReason: string | null = 'end_turn') {
  const create = vi.fn(async () => ({
    content,
    stop_reason: stopReason,
    usage: { input_tokens: 2, output_tokens: 3 },
  }));
  const stream = vi.fn(async function* () {
    yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'stream text' } };
  });
  const client = { messages: { create, stream } };
  return { interface: new AnthropicChatInterface(client as never), create, stream };
}

describe('Anthropic injected completion normalization', () => {
  it.each([
    [
      [
        { type: 'text', text: 'A' },
        { type: 'text', text: 'B' },
      ],
      'AB',
    ],
    [
      [
        { type: 'thinking', thinking: 'private' },
        { type: 'text', text: 'B' },
      ],
      'B',
    ],
  ])('retains supported text after every block', async (content, expected) => {
    const mock = injected(content as unknown[]);
    expect(await mock.interface.chatCompletion(messages)).toEqual({ content: expected });
    expect(mock.create).toHaveBeenCalledTimes(1);
    expect(mock.create).toHaveBeenCalledWith(
      expect.objectContaining({ system: 'first system\n\nsecond system' }),
    );
  });

  it.each([
    [[], 'end_turn'],
    [[{ type: 'thinking', thinking: 'private' }], 'end_turn'],
    [[{ type: 'text', text: ' ' }], 'end_turn'],
    [[{ type: 'text', text: 'partial' }], 'max_tokens'],
    [[{ type: 'text', text: 'not final' }], 'tool_use'],
    [[{ type: 'text', text: 'unknown' }], null],
  ])('makes absent/nonfinal text explicit', async (content, stopReason) => {
    const mock = injected(content as unknown[], stopReason as string | null);
    await expect(mock.interface.chatCompletion(messages)).rejects.toBeInstanceOf(
      AnthropicCompletionResponseError,
    );
    expect(mock.create).toHaveBeenCalledTimes(1);
  });

  it('retains tool proposal metadata without executing it', async () => {
    const mock = injected(
      [
        { type: 'text', text: 'A' },
        { type: 'text', text: 'B' },
        { type: 'tool_use', id: 'tool_fixture', name: 'proposal', input: { value: 1 } },
      ],
      'tool_use',
    );
    expect(await mock.interface.chatCompletionWithTools(messages, [])).toMatchObject({
      content: 'AB',
      stopReason: 'tool_calls',
      toolCalls: [{ id: 'tool_fixture', name: 'proposal', arguments: { value: 1 } }],
    });
    expect(mock.create).toHaveBeenCalledWith(
      expect.objectContaining({ system: 'first system\n\nsecond system' }),
    );
  });

  it('retains all system messages in injected streaming requests', async () => {
    const mock = injected([]);
    const chunks = [];
    for await (const chunk of mock.interface.streamChatCompletion(messages)) chunks.push(chunk);
    expect(chunks).toEqual(['stream text']);
    expect(mock.stream).toHaveBeenCalledWith(
      expect.objectContaining({ system: 'first system\n\nsecond system' }),
    );
  });
});
