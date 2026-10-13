import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  AtelierProviderResponseError,
  XaiResponsesProvider,
} from '../../packages/a11oy-atelier/src/provider.ts';
import {
  AnthropicChatInterface,
  AnthropicCompletionResponseError,
} from '../../lib/ai-engine/src/providers/anthropic/chat-with-tools.ts';

const fixtures = JSON.parse(
  readFileSync(new URL('./fixtures/xai-final-output-vectors.json', import.meta.url), 'utf8'),
);
const request = {
  prompt: 'offline fixture',
  provider: 'xai' as const,
  reasoningEffort: 'medium' as const,
  maxOutputTokens: 2048,
  capabilities: { tools: false, search: false, durableStorage: false, subagents: false },
};

for (const vector of fixtures.vectors) {
  test(`xAI source contract: ${vector.name}`, async () => {
    let calls = 0;
    const provider = new XaiResponsesProvider('offline-fixture', async () => {
      calls += 1;
      return Response.json(vector.document);
    });
    if (vector.expected.accepted) {
      const result = await provider.generate({ ...request, model: vector.model });
      assert.equal(result.text, vector.expected.text);
      assert.equal(result.model, vector.model);
      assert.equal(result.providerRequestId ?? null, vector.expected.providerRequestId);
    } else {
      await assert.rejects(
        provider.generate({ ...request, model: vector.model }),
        AtelierProviderResponseError,
      );
    }
    assert.equal(calls, 1, 'invalid/ambiguous success must not cause an automatic second request');
  });
}

function completedDocument(text: string) {
  return {
    model: 'grok-4.7',
    status: 'completed',
    output: [
      {
        type: 'message',
        role: 'assistant',
        status: 'completed',
        content: [{ type: 'output_text', text }],
      },
    ],
  };
}

test('xAI counts the 32768 code-point bound consistently with Python', async () => {
  const text = '😀'.repeat(32_768);
  const provider = new XaiResponsesProvider('offline-fixture', async () =>
    Response.json(completedDocument(text)),
  );
  assert.equal((await provider.generate(request)).text, text);
  const oversized = new XaiResponsesProvider('offline-fixture', async () =>
    Response.json(completedDocument(`${text}😀`)),
  );
  await assert.rejects(oversized.generate(request), AtelierProviderResponseError);
});

test('xAI sanitizes the request-header fallback without exposing private identifiers', async () => {
  for (const identifier of ['header-safe:1', 'bad identifier', 'x'.repeat(201)]) {
    const provider = new XaiResponsesProvider('offline-fixture', async () =>
      Response.json(completedDocument('safe'), { headers: { 'x-request-id': identifier } }),
    );
    const result = await provider.generate(request);
    assert.equal(result.providerRequestId, identifier === 'header-safe:1' ? identifier : undefined);
  }
});

function injectedAnthropic(content: unknown[], stopReason: string | null = 'end_turn') {
  const calls: unknown[] = [];
  const client = {
    messages: {
      async create(input: unknown) {
        calls.push(input);
        return { content, stop_reason: stopReason, usage: { input_tokens: 2, output_tokens: 3 } };
      },
      async *stream(input: unknown) {
        calls.push(input);
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'stream text' } };
      },
    },
  };
  return { interface: new AnthropicChatInterface(client as never), calls };
}

const messages = [
  { role: 'system' as const, content: 'first system' },
  { role: 'user' as const, content: 'offline fixture' },
  { role: 'system' as const, content: 'second system' },
];

for (const [name, content, expected] of [
  [
    'all text blocks',
    [
      { type: 'text', text: 'A' },
      { type: 'text', text: 'B' },
    ],
    'AB',
  ],
  [
    'nontext before text',
    [
      { type: 'thinking', thinking: 'private' },
      { type: 'text', text: 'B' },
    ],
    'B',
  ],
] as const) {
  test(`Anthropic injected completion: ${name}`, async () => {
    const mock = injectedAnthropic([...content]);
    assert.deepEqual(await mock.interface.chatCompletion(messages), { content: expected });
    assert.equal((mock.calls[0] as { system: string }).system, 'first system\n\nsecond system');
    assert.equal(mock.calls.length, 1);
  });
}

for (const [name, content, stopReason] of [
  ['empty', [], 'end_turn'],
  ['nontext only', [{ type: 'thinking', thinking: 'private' }], 'end_turn'],
  ['blank only', [{ type: 'text', text: '  ' }], 'end_turn'],
  ['truncated text', [{ type: 'text', text: 'partial' }], 'max_tokens'],
  ['unexpected tool stop', [{ type: 'text', text: 'not final' }], 'tool_use'],
  ['missing stop reason', [{ type: 'text', text: 'unknown' }], null],
] as const) {
  test(`Anthropic incomplete completion is explicit: ${name}`, async () => {
    const mock = injectedAnthropic([...content], stopReason);
    await assert.rejects(mock.interface.chatCompletion(messages), AnthropicCompletionResponseError);
    assert.equal(mock.calls.length, 1);
  });
}

test('Anthropic tool metadata remains proposal data, all text/system blocks survive', async () => {
  const mock = injectedAnthropic(
    [
      { type: 'text', text: 'A' },
      { type: 'text', text: 'B' },
      { type: 'tool_use', id: 'tool_fixture', name: 'proposal', input: { value: 1 } },
    ],
    'tool_use',
  );
  const result = await mock.interface.chatCompletionWithTools(messages, []);
  assert.equal(result.content, 'AB');
  assert.equal(result.stopReason, 'tool_calls');
  assert.deepEqual(result.toolCalls, [
    { id: 'tool_fixture', name: 'proposal', arguments: { value: 1 } },
  ]);
  assert.equal((mock.calls[0] as { system: string }).system, 'first system\n\nsecond system');
});

test('Anthropic streaming retains all system messages using only the injected client', async () => {
  const mock = injectedAnthropic([]);
  const chunks: string[] = [];
  for await (const chunk of mock.interface.streamChatCompletion(messages)) chunks.push(chunk);
  assert.deepEqual(chunks, ['stream text']);
  assert.equal((mock.calls[0] as { system: string }).system, 'first system\n\nsecond system');
});
