import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadAiSource } from './load-ai-source.mjs';

const root = process.env.SOURCE_ROOT ? resolve(process.env.SOURCE_ROOT) : fileURLToPath(new URL('../../', import.meta.url));
const providerPath = 'lib/ai-engine/src/providers/anthropic/chat-with-tools.ts';
const runnerPath = 'lib/ai-engine/src/domain-agent-runner.ts';
const call = (id, name = 'lookup') => ({ role: 'assistant', content: '[native_tool_call:lookup]', toolCallId: id, name, toolArguments: {} });
const result = (id, name = 'lookup') => ({ role: 'tool', content: `result ${id}`, toolCallId: id, name });
const plain = (n) => Array.from({ length: n }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `message ${i}` }));
const json = (value) => JSON.parse(JSON.stringify(value));
const response = (content) => ({ content, stop_reason: 'end_turn', usage: { input_tokens: 7, output_tokens: 11 } });

async function provider(content = [{ type: 'text', text: 'done' }]) {
  const { exports } = await loadAiSource(root, providerPath);
  const requests = [];
  const ai = new exports.AnthropicChatInterface({ messages: {
    async create(request) { requests.push(json(request)); return response(content); },
    async *stream() { throw new Error('Unexpected stream'); },
  } });
  return { ai, requests };
}

async function runnerWithHistory(history) {
  const { exports, deniedImports } = await loadAiSource(root, runnerPath);
  const saved = exports.getOrCreateConversation('synthetic-history', 'system');
  saved.push(...history.map(({ name, ...message }) => ({ ...message, ...(name === undefined ? {} : { toolName: name }) })));
  let executions = 0;
  const runner = new exports.DomainAgentRunner({
    systemPrompt: 'system', tools: [{ name: 'lookup', description: 'synthetic only', parameters: { type: 'object' } }],
    async executeTool() { executions++; throw new Error('Tool execution forbidden in this test'); },
  }, { model: 'synthetic-only', maxCompletionTokens: 64 });
  const requests = [];
  const ai = { async chatCompletionWithTools(messages) {
    requests.push(json(messages));
    return { content: 'done', toolCalls: [], stopReason: 'stop' };
  } };
  return { run: () => runner.chat('current question', 'synthetic-history', ai), requests, saved,
    executions: () => executions, deniedImports };
}

// These two tests are also run unchanged against the pinned baseline.
test('REGRESSION: preserves text after a non-text block and across all text blocks', async () => {
  const { ai } = await provider([
    { type: 'thinking', thinking: 'synthetic internal block', signature: 'synthetic' },
    { type: 'text', text: 'Hello ' }, { type: 'text', text: 'world' },
  ]);
  assert.equal((await ai.chatCompletion([{ role: 'user', content: 'hi' }])).content, 'Hello world');
});

test('REGRESSION: runner retains the complete tool batch at the 20-message boundary', async () => {
  const history = [...plain(2), call('a'), call('b'), result('b'), result('a'), ...plain(17)];
  const harness = await runnerWithHistory(history);
  assert.equal(await harness.run(), 'done');
  const messages = harness.requests[0];
  const calls = messages.filter((m) => m.role === 'assistant' && m.toolCallId).map((m) => m.toolCallId);
  const results = messages.filter((m) => m.role === 'tool').map((m) => m.toolCallId);
  assert.deepEqual(calls, ['a', 'b']);
  assert.deepEqual(results, ['b', 'a']);
  assert.equal(messages.length, 23); // system + four-message batch + 18 recent messages
  assert.equal(harness.executions(), 0);
});

for (const [name, blocks, expected] of [
  ['one text block', [{ type: 'text', text: 'one' }], 'one'],
  ['multiple text blocks', [{ type: 'text', text: 'one ' }, { type: 'text', text: 'two' }], 'one two'],
  ['interleaved blocks', [{ type: 'text', text: 'a' }, { type: 'tool_use', id: 'a', name: 'lookup', input: {} }, { type: 'text', text: 'b' }], 'ab'],
  ['empty content', [], ''],
  ['non-text content only', [{ type: 'thinking', thinking: 'synthetic', signature: 'synthetic' }], ''],
  ['unicode and whitespace', [{ type: 'text', text: ' 🦙\n' }, { type: 'text', text: 'λ ' }], ' 🦙\nλ '],
]) {
  test(`plain completion: ${name}`, async () => {
    const { ai, requests } = await provider(blocks);
    const completion = ai.chatCompletion([{ role: 'system', content: 'system' }, { role: 'user', content: 'hi' }], { model: 'synthetic', maxTokens: 32 });
    if (expected === '') {
      await assert.rejects(completion, { code: 'ANTHROPIC_COMPLETION_RESPONSE_INVALID' });
    } else {
      assert.equal((await completion).content, expected);
    }
    assert.equal(requests[0].model, 'synthetic');
    assert.equal(requests[0].max_tokens, 32);
    assert.equal(requests[0].system, 'system');
  });
}

test('native completion preserves text, tool schemas, usage, tool calls and stop mapping', async () => {
  const { ai, requests } = await provider([
    { type: 'text', text: 'one ' }, { type: 'tool_use', id: 'response-id', name: 'lookup', input: { n: 1 } }, { type: 'text', text: 'two' },
  ]);
  const tools = [{ type: 'function', function: { name: 'lookup', description: 'synthetic', parameters: { type: 'object', properties: {} } } }];
  const answer = await ai.chatCompletionWithTools([{ role: 'user', content: 'hi' }], tools);
  assert.equal(answer.content, 'one two');
  assert.deepEqual(json(answer.toolCalls), [{ id: 'response-id', name: 'lookup', arguments: { n: 1 } }]);
  assert.deepEqual(json(answer.usage), { promptTokens: 7, completionTokens: 11 });
  assert.equal(answer.stopReason, 'stop');
  assert.deepEqual(requests[0].tools, [{ name: 'lookup', description: 'synthetic', input_schema: { type: 'object', properties: {} } }]);
});

test('valid parallel call/result histories are serialized in order without mutation', async () => {
  const { ai, requests } = await provider();
  const messages = [
    { role: 'system', content: 'system' }, { role: 'user', content: 'question' },
    { role: 'assistant', content: 'checking' }, call('a'), call('b', 'lookup2'), result('b', 'lookup2'), result('a'),
    { role: 'user', content: 'continue' },
  ];
  const before = json(messages);
  await ai.chatCompletionWithTools(messages, []);
  assert.deepEqual(messages, before);
  assert.deepEqual(requests[0].messages, [
    { role: 'user', content: 'question' }, { role: 'assistant', content: 'checking' },
    { role: 'assistant', content: [{ type: 'tool_use', id: 'a', name: 'lookup', input: {} }, { type: 'tool_use', id: 'b', name: 'lookup2', input: {} }] },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'b', content: 'result b' }, { type: 'tool_result', tool_use_id: 'a', content: 'result a' }] },
    { role: 'user', content: 'continue' },
  ]);
});

test('omitted optional result name and call arguments remain supported', async () => {
  const { ai, requests } = await provider();
  const c = call('a'); delete c.toolArguments;
  const r = result('a'); delete r.name;
  await ai.chatCompletionWithTools([c, r], []);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].messages[0].content[0].input, {});
});

const invalidHistories = [
  ['orphan result', [result('orphan')]],
  ['missing result ID', [call('a'), { role: 'tool', content: 'x' }]],
  ['empty result ID', [call('a'), result('')]],
  ['whitespace result ID', [call('a'), result('  ')]],
  ['unknown result ID', [call('a'), result('b')]],
  ['missing call ID', [{ role: 'assistant', content: '', name: 'lookup', toolArguments: {} }, result('a')]],
  ['empty call ID', [call(''), result('')]],
  ['whitespace call ID', [call('  '), result('  ')]],
  ['non-string call ID', [call(12), result(12)]],
  ['missing name', [{ ...call('a'), name: undefined }, result('a')]],
  ['empty name', [call('a', ''), result('a', '')]],
  ['second parallel call missing name', [call('a'), { ...call('b'), name: undefined }, result('a'), result('b')]],
  ['duplicate call IDs', [call('a'), call('a'), result('a'), result('a')]],
  ['reused ID across batches', [call('a'), result('a'), call('a'), result('a')]],
  ['duplicate results', [call('a'), call('b'), result('a'), result('a')]],
  ['extra result after completion', [call('a'), result('a'), result('a')]],
  ['missing results', [call('a')]],
  ['missing one parallel result', [call('a'), call('b'), result('a')]],
  ['intervening user message', [call('a'), { role: 'user', content: 'interrupt' }, result('a')]],
  ['intervening assistant text', [call('a'), { role: 'assistant', content: 'interrupt' }, result('a')]],
  ['result name mismatch', [call('a'), result('a', 'other')]],
  ['array arguments', [{ ...call('a'), toolArguments: [] }, result('a')]],
  ['null arguments', [{ ...call('a'), toolArguments: null }, result('a')]],
  ['primitive arguments', [{ ...call('a'), toolArguments: 'invalid' }, result('a')]],
];

for (const [name, messages] of invalidHistories) {
  test(`rejects invalid history before provider call: ${name}`, async () => {
    const { ai, requests } = await provider();
    await assert.rejects(ai.chatCompletionWithTools(messages, []), /Invalid tool history/);
    assert.equal(requests.length, 0);
  });
  test(`runner rejects invalid stored history without provider or tool execution: ${name}`, async () => {
    const harness = await runnerWithHistory(messages);
    await assert.rejects(harness.run(), /Invalid tool history/);
    assert.equal(harness.requests.length, 0);
    assert.equal(harness.executions(), 0);
  });
}

test('history selection retains every boundary batch for multiple batch sizes and suffix lengths', async () => {
  const { exports } = await loadAiSource(root, 'lib/ai-engine/src/tool-message-history.ts');
  let scenarios = 0;
  for (const size of [1, 2, 5, 11, 25]) {
    const batch = [...Array.from({ length: size }, (_, i) => call(`id-${i}`)), ...Array.from({ length: size }, (_, i) => result(`id-${size - i - 1}`))];
    for (let suffix = 0; suffix <= 24; suffix++) {
      const messages = [...plain(25), ...batch, ...plain(suffix)];
      const before = json(messages);
      const selected = exports.selectToolMessageHistory(messages);
      assert.deepEqual(messages, before);
      const selectedCalls = selected.filter((m) => m.role === 'assistant' && m.toolCallId);
      const selectedResults = selected.filter((m) => m.role === 'tool');
      assert.equal(selectedCalls.length, suffix < 20 ? size : 0);
      assert.equal(selectedResults.length, selectedCalls.length);
      const groups = exports.groupToolMessageHistory(selected);
      assert.deepEqual(json(groups.flat()), json(selected));
      assert.equal(selected.at(-1), messages.at(-1));
      scenarios++;
    }
  }
  assert.equal(scenarios, 125);
});

test('plain history keeps the newest 20 messages and drops system messages', async () => {
  const { exports } = await loadAiSource(root, 'lib/ai-engine/src/tool-message-history.ts');
  const messages = [{ role: 'system', content: 'system' }, ...plain(40)];
  assert.deepEqual(json(exports.selectToolMessageHistory(messages)), messages.slice(-20));
  assert.deepEqual(json(exports.selectToolMessageHistory([])), []);
  assert.deepEqual(json(exports.selectToolMessageHistory([{ role: 'system', content: 'system' }])), []);
});

test('history window validates its limit and does not silently repair old malformed data', async () => {
  const { exports } = await loadAiSource(root, 'lib/ai-engine/src/tool-message-history.ts');
  for (const limit of [0, -1, NaN, Infinity, 1.5]) {
    assert.throws(() => exports.selectToolMessageHistory([], limit), /positive safe integer/);
  }
  assert.throws(() => exports.selectToolMessageHistory([result('old-orphan'), ...plain(50)]), /Invalid tool history/);
});

test('runner to Anthropic serialization accepts a retained boundary batch end to end', async () => {
  const harness = await runnerWithHistory([...plain(2), call('a'), call('b'), result('a'), result('b'), ...plain(17)]);
  await harness.run();
  const { ai, requests } = await provider();
  await ai.chatCompletionWithTools(harness.requests[0], []);
  const use = requests[0].messages.flatMap((m) => Array.isArray(m.content) ? m.content.filter((b) => b.type === 'tool_use') : []);
  const results = requests[0].messages.flatMap((m) => Array.isArray(m.content) ? m.content.filter((b) => b.type === 'tool_result') : []);
  assert.deepEqual(use.map((b) => b.id), ['a', 'b']);
  assert.deepEqual(results.map((b) => b.tool_use_id), ['a', 'b']);
  assert.equal(harness.executions(), 0);
  assert.deepEqual(harness.deniedImports, ['@szl-holdings/db']);
});

test('unchanged streaming behavior emits only text deltas in sequence', async () => {
  const { exports } = await loadAiSource(root, providerPath);
  const ai = new exports.AnthropicChatInterface({ messages: {
    async *stream() {
      yield { type: 'message_start' };
      yield { type: 'content_block_delta', delta: { type: 'thinking_delta', thinking: 'synthetic' } };
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'a' } };
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'b' } };
    },
  } });
  const chunks = [];
  for await (const chunk of ai.streamChatCompletion([{ role: 'user', content: 'hi' }])) chunks.push(chunk);
  assert.deepEqual(chunks, ['a', 'b']);
});
