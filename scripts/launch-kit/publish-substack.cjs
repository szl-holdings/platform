/**
 * publish-substack.cjs
 *
 * Pushes the first 3 posts from posts.cjs as DRAFTS to a Substack publication.
 *
 * Required env vars:
 *   SUBSTACK_SESSION          — value of the `substack.sid` cookie from a
 *                               logged-in browser session (see PUBLISH.md)
 *   SUBSTACK_PUBLICATION_URL  — e.g. https://szlcommand.substack.com
 *
 * Run: node scripts/launch-kit/publish-substack.cjs
 */

'use strict';

const https = require('https');
const { URL } = require('url');

const { POSTS } = require('./posts.cjs');

// ── helpers ──────────────────────────────────────────────────────────────────

function requireEnv(key) {
  const val = process.env[key];
  if (!val) {
    console.error(`ERROR: missing required env var ${key} — see PUBLISH.md`);
    process.exit(1);
  }
  return val;
}

/**
 * Very lightweight Markdown → HTML converter sufficient for the essay bodies.
 * Handles: ## headings, **bold**, *italic*, bare URLs, and paragraph breaks.
 */
function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let inParagraph = false;
  let listType = null; // 'ul' | 'ol' | null

  const flush = () => {
    if (inParagraph) {
      out.push('</p>');
      inParagraph = false;
    }
  };

  const flushList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  const openList = (type) => {
    if (listType !== type) {
      flushList();
      out.push(`<${type}>`);
      listType = type;
    }
  };

  const inline = (text) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');

  for (const raw of lines) {
    const line = raw.trimEnd();

    // blank line → end paragraph / list
    if (line.trim() === '') {
      flush();
      flushList();
      continue;
    }

    // h2
    if (line.startsWith('## ')) {
      flush();
      flushList();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
      continue;
    }

    // h3
    if (line.startsWith('### ')) {
      flush();
      flushList();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
      continue;
    }

    // numbered list item (1. … )
    const listMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (listMatch) {
      flush();
      openList('ol');
      out.push(`<li>${inline(listMatch[2])}</li>`);
      continue;
    }

    // unordered bullet
    if (line.startsWith('- ') || line.startsWith('* ')) {
      flush();
      openList('ul');
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }

    // paragraph text
    flushList();
    if (!inParagraph) {
      out.push('<p>');
      inParagraph = true;
    } else {
      out.push(' ');
    }
    out.push(inline(line));
  }

  flush();
  flushList();
  return out.join('');
}

function jsonPost(urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const payload = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + (parsed.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const session = requireEnv('SUBSTACK_SESSION');
  const pubUrl = requireEnv('SUBSTACK_PUBLICATION_URL').replace(/\/$/, '');

  const posts = POSTS.slice(0, 3);

  console.log(`\nPublishing ${posts.length} drafts to ${pubUrl}\n`);

  for (const post of posts) {
    console.log(`  → [${post.id}] "${post.title}"`);

    const draftBody = {
      draft_title: post.title,
      draft_subtitle: post.subtitle,
      draft_body: mdToHtml(post.body),
      audience: 'everyone',
      type: 'newsletter',
    };

    const result = await jsonPost(
      `${pubUrl}/api/v1/drafts`,
      {
        Cookie: `substack.sid=${session}`,
        Referer: pubUrl,
        'User-Agent': 'SZL-publish-script/1.0',
      },
      draftBody,
    );

    if (result.status === 200 || result.status === 201) {
      const draft = result.body;
      const id = draft.id ?? draft.draft_id ?? '(unknown)';
      console.log(`     ✓ draft created  id=${id}`);
      console.log(`       ${pubUrl}/publish/post/${id}`);
    } else {
      console.error(`     ✗ HTTP ${result.status}`);
      console.error('       ' + JSON.stringify(result.body, null, 2));
    }

    // small delay between requests
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log('\nDone. Open your Substack drafts dashboard to review before publishing.');
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
