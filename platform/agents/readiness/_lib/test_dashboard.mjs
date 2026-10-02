import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');
const scriptOpen = '<script>';
const scriptClose = '</script>';
const scriptStart = html.indexOf(scriptOpen);
assert.ok(scriptStart >= 0, 'dashboard script opening tag must be present');
const bodyStart = scriptStart + scriptOpen.length;
const bodyEnd = html.indexOf(scriptClose, bodyStart);
assert.ok(bodyEnd > bodyStart, 'dashboard script closing tag must be present');
const script = html.slice(bodyStart, bodyEnd);

function element(tagName) {
  let text = '';
  const node = {
    tagName,
    className: '',
    value: '',
    children: [],
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    replaceChildren(...children) {
      this.children = children;
    },
  };
  Object.defineProperty(node, 'textContent', {
    get() {
      return text + this.children.map((child) => child.textContent).join('');
    },
    set(value) {
      text = String(value);
      this.children = [];
    },
  });
  Object.defineProperty(node, 'innerHTML', {
    set() {
      throw new Error('Untrusted dashboard data must not enter innerHTML');
    },
  });
  return node;
}

async function render({ receipt, unavailable = false }) {
  const dataset = element('input');
  dataset.value = 'SZLHOLDINGS/readiness-runs';
  const rows = element('tbody');
  const status = element('span');
  const nodes = { dataset, rows, status };
  const document = {
    getElementById(id) {
      return nodes[id];
    },
    createElement: element,
  };
  const fetch = async (url) => {
    if (url.includes('/tree/main/receipts/')) {
      if (unavailable) return { ok: false };
      const match = url.includes('/receipts/readiness-reliability');
      return {
        ok: true,
        json: async () =>
          match && receipt
            ? [{ type: 'file', path: 'receipts/readiness-reliability/latest.json' }]
            : [],
      };
    }
    if (url.includes('/resolve/main/')) {
      return { ok: true, json: async () => receipt };
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  };
  const atob = (value) => Buffer.from(value, 'base64').toString('binary');
  await vm.runInNewContext(script, { document, fetch, atob });
  return { rows, status };
}

function envelope(body, signed = true) {
  return { signed, payload: Buffer.from(JSON.stringify(body)).toString('base64') };
}

test('self-claimed signed GREEN is unverified and malicious timestamp stays text', async () => {
  const timestamp = '<img src=x onerror="alert(1)">';
  const receipt = envelope({
    emitted_at_utc: timestamp,
    payload: { flagships: [{ verdict: 'GREEN' }] },
  });
  const { rows, status } = await render({ receipt });
  const cells = rows.children[0].children;
  assert.equal(cells[1].textContent, 'UNVERIFIED');
  assert.equal(cells[2].textContent, '1 claimed');
  assert.equal(cells[3].textContent, `claimed ${timestamp}`);
  assert.equal(cells[3].children[0].children.length, 0);
  assert.equal(cells[4].textContent, 'claimed signed · unverified');
  assert.match(status.textContent, /signer unverified/);
});

test('unsigned receipt cannot display its claimed GREEN verdict', async () => {
  const { rows } = await render({
    receipt: envelope(
      {
        payload: { flagships: [{ verdict: 'GREEN' }] },
      },
      false,
    ),
  });
  assert.equal(rows.children[0].children[1].textContent, 'UNVERIFIED');
  assert.equal(rows.children[0].children[4].textContent, 'unsigned');
});

test('Hub fetch failure is not presented as no receipts', async () => {
  const { rows, status } = await render({ unavailable: true });
  assert.equal(rows.children.length, 8);
  assert.ok(rows.children.every((row) => row.children[1].textContent === 'FETCH-ERROR'));
  assert.match(status.textContent, /8 fetch error/);
});
