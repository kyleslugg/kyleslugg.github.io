// Syndicates on-site essays to the user's PDS as standard.site records
// (https://standard.site), dependency-free via XRPC.
//
//   node scripts/atproto-sync.mjs --init   create/update the publication
//                                          record and save its AT-URI into
//                                          atproto.config.json (run once)
//   node scripts/atproto-sync.mjs          sync eligible work entries as
//                                          site.standard.document records
//                                          (runs after `astro build`)
//
// Auth comes from ATPROTO_APP_PASSWORD (environment, or a local .env line).
// When the variable is absent the script exits 0 without doing anything, so
// local builds work without credentials.
//
// Eligible entries: src/content/work/*.md with a markdown body, no
// `externalUrl`, and no `draft: true`. Document rkey = filename slug, so
// re-syncing updates records in place (putRecord) and never duplicates.
// Records created by other apps (e.g. Leaflet, with TID rkeys) are never
// touched; nothing is ever deleted automatically.

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CONFIG_PATH = path.join(ROOT, 'atproto.config.json');
const CONTENT_DIR = path.join(ROOT, 'src/content/work');

const config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));

function appPassword() {
  if (process.env.ATPROTO_APP_PASSWORD) return process.env.ATPROTO_APP_PASSWORD;
  const envPath = path.join(ROOT, '.env');
  if (existsSync(envPath)) {
    // minimal .env lookup: KEY=value lines, optional quotes
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*ATPROTO_APP_PASSWORD\s*=\s*("?)(.*)\1\s*$/);
      if (m) return m[2];
    }
  }
  return undefined;
}

async function xrpc(method, body, token) {
  const res = await fetch(`${config.pdsUrl}/xrpc/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`${method} failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

// Parses the deliberately simple frontmatter this repo uses:
// `key: value` lines only — no quoting, nesting, or multiline values.
function parseEntry(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].trim();
  }
  return { data, body: m[2] };
}

// Rough plain-text rendering of markdown for the textContent field.
function plainText(md) {
  return md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function eligibleEntries() {
  const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith('.md'));
  const entries = [];
  for (const file of files) {
    const { data, body } = parseEntry(
      await readFile(path.join(CONTENT_DIR, file), 'utf8')
    );
    if (data.draft === 'true' || data.externalUrl || !body.trim()) continue;
    entries.push({ slug: file.replace(/\.md$/, ''), data, body: body.trim() });
  }
  return entries;
}

const password = appPassword();
if (!password) {
  console.log('[atproto-sync] ATPROTO_APP_PASSWORD not set; skipping syndication.');
  process.exit(0);
}

const session = await xrpc('com.atproto.server.createSession', {
  identifier: config.handle,
  password
});
console.log(`[atproto-sync] authenticated as ${session.handle} (${session.did})`);

if (process.argv.includes('--init')) {
  const record = {
    $type: 'site.standard.publication',
    url: config.siteUrl,
    name: config.publicationName,
    description: config.publicationDescription
  };
  const result = await xrpc(
    'com.atproto.repo.putRecord',
    {
      repo: session.did,
      collection: 'site.standard.publication',
      rkey: 'self',
      record
    },
    session.accessJwt
  );
  config.publicationUri = result.uri;
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
  console.log(`[atproto-sync] publication record: ${result.uri}`);
  console.log('[atproto-sync] saved publicationUri to atproto.config.json — commit it.');
  process.exit(0);
}

if (!config.publicationUri) {
  console.log(
    '[atproto-sync] no publicationUri in atproto.config.json — run `npm run atproto:init` first. Skipping.'
  );
  process.exit(0);
}

const entries = await eligibleEntries();
if (entries.length === 0) {
  console.log('[atproto-sync] no eligible essays to syndicate.');
  process.exit(0);
}

for (const entry of entries) {
  const record = {
    $type: 'site.standard.document',
    site: config.publicationUri,
    title: entry.data.title,
    ...(entry.data.blurb ? { description: entry.data.blurb } : {}),
    path: `/work/${entry.slug}`,
    content: entry.body,
    textContent: plainText(entry.body),
    publishedAt: new Date(entry.data.date).toISOString()
  };
  const result = await xrpc(
    'com.atproto.repo.putRecord',
    {
      repo: session.did,
      collection: 'site.standard.document',
      rkey: entry.slug,
      record
    },
    session.accessJwt
  );
  console.log(`[atproto-sync] synced /work/${entry.slug} -> ${result.uri}`);
}
console.log(`[atproto-sync] done (${entries.length} document(s)).`);
