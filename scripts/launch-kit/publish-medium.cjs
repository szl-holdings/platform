/**
 * publish-medium.cjs
 *
 * Pushes the first 3 posts from posts.cjs as DRAFTS to a Medium publication.
 * Each draft includes a rel=canonical URL pointing back to the Substack
 * permalink (Substack is the canonical home; Medium is the syndication channel).
 *
 * Required env vars:
 *   MEDIUM_INTEGRATION_TOKEN  — from https://medium.com/me/settings → Integration Token
 *   MEDIUM_PUBLICATION_ID     — ID of the publication to post under
 *   SUBSTACK_PUBLICATION_URL  — e.g. https://szlcommand.substack.com
 *                               (used to build canonical URLs)
 *
 * Run AFTER publish-substack.cjs (24 h later ideally, or immediately for
 * draft staging).  See PUBLISH.md for the recommended workflow.
 *
 * Run: node scripts/launch-kit/publish-medium.cjs
 */

'use strict';

const https = require('node:https');
const { URL } = require('node:url');

const { POSTS } = require('./posts.cjs');

// ── helpers ──────────────────────────────────────────────────────────────────

function requireEnv(key) {
  const val = process.env[key];
  if (!val) {
    process.exit(1);
  }
  return val;
}

/**
 * Derive the Substack URL slug from a post title.
 * Substack slugs are lowercased, spaces → hyphens, special chars stripped.
 */
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build the expected Substack canonical URL for a post.
 * Format: https://<publication>.substack.com/p/<slug>
 */
function substackCanonical(pubUrl, title) {
  return `${pubUrl.replace(/\/$/, '')}/p/${titleToSlug(title)}`;
}

/**
 * Wrap the Markdown body with the canonical note that Medium will render
 * at the top of syndicated posts.
 */
function addCanonicalNote(body, canonicalUrl) {
  return (
    `*This post was originally published on [SZL Command on Substack](${canonicalUrl}).*\n\n` +
    `---\n\n` +
    body
  );
}

function jsonRequest(method, urlStr, token, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const payload = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + (parsed.search || ''),
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
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
    if (body) req.write(payload);
    req.end();
  });
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const token = requireEnv('MEDIUM_INTEGRATION_TOKEN');
  const publicationId = requireEnv('MEDIUM_PUBLICATION_ID');
  const substackUrl = requireEnv('SUBSTACK_PUBLICATION_URL');

  // Fetch the authenticated user to confirm token validity
  const meRes = await jsonRequest('GET', 'https://api.medium.com/v1/me', token);
  if (meRes.status !== 200) {
    process.exit(1);
  }
  const _username = meRes.body.data?.username ?? '(unknown)';

  const posts = POSTS.slice(0, 3);

  for (const post of posts) {
    // Prefer an explicit canonicalUrl on the post object (set after Substack
    // publishes and the real permalink is known); fall back to slug derivation.
    const canonicalUrl = post.canonicalUrl || substackCanonical(substackUrl, post.title);
    const content = addCanonicalNote(post.body, canonicalUrl);

    const payload = {
      title: post.title,
      contentFormat: 'markdown',
      content,
      tags: (post.mediumTags || []).slice(0, 5),
      publishStatus: 'draft',
      canonicalUrl,
    };

    const url = `https://api.medium.com/v1/publications/${publicationId}/posts`;
    const result = await jsonRequest('POST', url, token, payload);

    if (result.status === 200 || result.status === 201) {
      const draft = result.body.data ?? result.body;
      const draftId = draft.id ?? '(unknown)';
      const _draftUrl = draft.url ?? `https://medium.com/p/${draftId}`;
    } else {
    }

    await new Promise((r) => setTimeout(r, 600));
  }
}

main().catch((_err) => {
  process.exit(1);
});
