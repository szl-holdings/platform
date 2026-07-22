const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const widgetPath = path.join(__dirname, '..', 'assets', 'szl_verify_widget.js');
const source = fs.readFileSync(widgetPath, 'utf8');
const widget = require(widgetPath);

test('uses only the canonical a11oy receipt verifier route', () => {
  assert.equal(widget.verifyPath, '/api/a11oy/v1/verify/receipt');
  assert.match(source, /VERIFY_PATH\s*=\s*'\/api\/a11oy\/v1\/verify\/receipt'/);
  assert.doesNotMatch(source, /\/api\/a11oy\/v1\/verify\?url=/);
  assert.doesNotMatch(source, /base\+'\/api\/a11oy\/v1\/verify'/);
});

test('preserves DSSE envelopes and receipt ids in the canonical body', () => {
  const dsse = {payloadType: 'application/test', payload: 'e30=', signatures: []};
  assert.deepEqual(widget._verifyBody(dsse), {envelope: dsse});
  assert.deepEqual(widget._verifyBody({envelope: dsse, receipt_id: 'abc'}), {
    envelope: dsse,
    receipt_id: 'abc',
  });
  assert.deepEqual(widget._verifyBody({receipt_id: 'deadbeef'}), {receipt_id: 'deadbeef'});
});

test('plain statements become explicitly unsigned DSSE envelopes', () => {
  const statement = {_type: 'https://in-toto.io/Statement/v1', subject: []};
  const body = widget._verifyBody(statement);
  assert.equal(body.envelope.payloadType, 'application/vnd.in-toto+json');
  assert.deepEqual(body.envelope.signatures, []);
  assert.deepEqual(JSON.parse(Buffer.from(body.envelope.payload, 'base64').toString('utf8')), statement);
});

test('public URL mode fetches in the browser and never delegates a URL to a11oy', () => {
  assert.match(source, /p\s*=\s*pull\(u,\s*\{method:'GET'\}\)/);
  assert.match(source, /return postForVerification\(remote\.data\)/);
  assert.doesNotMatch(source, /VERIFY_PATH\s*\+\s*'\?url='/);
});

test('unavailable and unsigned checks are never styled green', () => {
  assert.match(source, /st==='unsigned-local' \|\| st==='unavailable'/);
  assert.match(source, /\? 'warn' : 'muted'/);
});
