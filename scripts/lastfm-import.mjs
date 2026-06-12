// One-off importer: replays Last.fm scrobble history into Rocksky via
// Rocksky's legacy Audioscrobbler submission protocol
// (https://docs.rocksky.app/migrations/from-lastfm — "Username: your
// API key, Password: shared secret"), which batches 50 plays per
// request with original timestamps. Dependency-free.
//
//   node scripts/lastfm-import.mjs --count   size the job (read-only;
//                                            needs only Last.fm creds)
//   node scripts/lastfm-import.mjs --test    import the single oldest
//                                            play, to verify auth and
//                                            timestamp handling
//   node scripts/lastfm-import.mjs --run     import, oldest first
//
// Credentials (.env or environment):
//   LASTFM_USER             Last.fm username
//   LASTFM_API_KEY          Last.fm API key (the mirror's key works)
//   ROCKSKY_API_KEY         from https://rocksky.app/apikeys
//   ROCKSKY_SHARED_SECRET   from https://rocksky.app/apikeys
//
// Progress persists in .lastfm-import-state.json (gitignored): the run
// freezes an upper timestamp bound at start (so the live Last.fm ->
// Rocksky mirror keeps working without shifting pagination) and walks
// from the oldest play forward, checkpointing after every batch. Safe
// to interrupt and re-run.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const STATE_PATH = path.join(ROOT, '.lastfm-import-state.json');
const PAGE_SIZE = 200; // Last.fm API max
const BATCH = Number(process.env.IMPORT_BATCH ?? 50); // Audioscrobbler submission max
const BATCH_DELAY_MS = 2500;
const HANDSHAKE_URL = 'https://audioscrobbler.rocksky.app/';
// Plays timestamped before this are Last.fm data artifacts (bulk
// imports that lost their dates land at the Unix epoch) and are
// excluded — importing them would permanently skew listening stats.
const TIMESTAMP_FLOOR = Date.UTC(2002, 0, 1) / 1000;

function env(name, required = true) {
  if (process.env[name]) return process.env[name];
  const envPath = path.join(ROOT, '.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*("?)(.*)\\1\\s*$`));
      if (m) return m[2];
    }
  }
  if (required) {
    console.error(`Missing ${name} (set it in the environment or .env)`);
    process.exit(1);
  }
  return undefined;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const md5 = (s) => createHash('md5').update(s, 'utf8').digest('hex');

// Tracks Rocksky's backend persistently 500s on. Once a play is
// isolated as poison, every other play of the same track is skipped
// up front instead of re-bisected (persisted in the state file).
const poisonSet = new Set();
const poisonKey = (t) => `${t.artist}||${t.title}`.toLowerCase();

async function lastfmPage({ user, apiKey, from, to, page }) {
  const params = new URLSearchParams({
    method: 'user.getrecenttracks',
    user,
    api_key: apiKey,
    format: 'json',
    limit: String(PAGE_SIZE),
    page: String(page)
  });
  if (from) params.set('from', String(from));
  if (to) params.set('to', String(to));
  const res = await fetch(`https://ws.audioscrobbler.com/2.0/?${params}`);
  if (!res.ok) throw new Error(`Last.fm fetch failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Last.fm error ${data.error}: ${data.message}`);
  const rt = data.recenttracks;
  const tracks = (Array.isArray(rt.track) ? rt.track : [rt.track])
    .filter(Boolean)
    .filter((t) => t.date?.uts) // skip the "now playing" pseudo-entry
    .map((t) => ({
      artist: t.artist?.['#text'] ?? t.artist?.name ?? '',
      title: t.name,
      album: t.album?.['#text'] || undefined,
      mbId: t.mbid || undefined,
      uts: Number(t.date.uts)
    }));
  return {
    tracks,
    total: Number(rt['@attr'].total),
    totalPages: Number(rt['@attr'].totalPages)
  };
}

// Legacy Audioscrobbler 1.2 handshake: auth = md5(md5(password) + ts)
async function handshake(creds) {
  const t = Math.floor(Date.now() / 1000);
  const params = new URLSearchParams({
    hs: 'true',
    p: '1.2',
    c: 'tst', // generic test-client id, per protocol convention
    v: '1.0',
    u: creds.apiKey,
    t: String(t),
    a: md5(md5(creds.sharedSecret) + t)
  });
  const res = await fetch(`${HANDSHAKE_URL}?${params}`);
  const body = (await res.text()).trim().split('\n');
  if (body[0] !== 'OK') {
    throw new Error(`Handshake failed: ${body.join(' | ').slice(0, 200)}`);
  }
  return { session: body[1], submitUrl: body[3] };
}

async function submitOnce(batch, hs) {
  const params = new URLSearchParams({ s: hs.session });
  batch.forEach((t, i) => {
    params.set(`a[${i}]`, t.artist);
    params.set(`t[${i}]`, t.title);
    params.set(`i[${i}]`, String(t.uts));
    params.set(`o[${i}]`, 'P');
    params.set(`r[${i}]`, '');
    params.set(`l[${i}]`, '');
    params.set(`b[${i}]`, t.album ?? '');
    params.set(`n[${i}]`, '');
    params.set(`m[${i}]`, t.mbId ?? '');
  });
  const res = await fetch(hs.submitUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  return (await res.text()).trim();
}

// Submits a batch, retrying transient failures; if a batch keeps
// failing, bisects it to isolate the poison track, which is skipped
// with a log line instead of sinking its whole batch.
async function submitBatch(batch, hs, creds) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const body = await submitOnce(batch, hs);
    if (body.startsWith('OK')) return hs;
    if (body.startsWith('BADSESSION')) {
      console.log('  session expired; re-handshaking');
      hs = await handshake(creds);
      continue;
    }
    const wait = 4000 * 2 ** attempt;
    console.log(`  submission not OK (${body.slice(0, 160)}); retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
  if (batch.length === 1) {
    const t = batch[0];
    poisonSet.add(poisonKey(t));
    console.log(
      `  POISON TRACK skipped: "${t.artist} — ${t.title}" (${new Date(t.uts * 1000).toISOString()}) — all future plays of it will be skipped`
    );
    return hs;
  }
  console.log(`  batch of ${batch.length} keeps failing; bisecting`);
  const mid = Math.ceil(batch.length / 2);
  hs = await submitBatch(batch.slice(0, mid), hs, creds);
  await sleep(1000);
  return submitBatch(batch.slice(mid), hs, creds);
}

const lastfm = { user: env('LASTFM_USER'), apiKey: env('LASTFM_API_KEY') };
const mode = process.argv.includes('--run')
  ? 'run'
  : process.argv.includes('--test')
    ? 'test'
    : process.argv.includes('--count')
      ? 'count'
      : null;

if (!mode) {
  console.log('Usage: node scripts/lastfm-import.mjs --count | --test | --run');
  process.exit(1);
}

if (mode === 'count') {
  const all = await lastfmPage({ ...lastfm, page: 1 });
  const real = await lastfmPage({ ...lastfm, from: TIMESTAMP_FLOOR, page: 1 });
  const batches = Math.ceil(real.total / BATCH);
  const mins = (batches * BATCH_DELAY_MS) / 60_000;
  console.log(`Last.fm history for ${lastfm.user}: ${all.total} scrobbles`);
  console.log(
    `  junk-dated (before ${new Date(TIMESTAMP_FLOOR * 1000).toISOString().slice(0, 10)}, skipped): ${all.total - real.total}`
  );
  console.log(`  importable: ${real.total}`);
  console.log(
    `Import plan: ${batches} batches of ${BATCH}, ~${mins.toFixed(0)}min at ` +
      `${BATCH_DELAY_MS / 1000}s/batch (resumable; safe to interrupt)`
  );
  process.exit(0);
}

const creds = {
  apiKey: env('ROCKSKY_API_KEY'),
  sharedSecret: env('ROCKSKY_SHARED_SECRET')
};

if (mode === 'test') {
  const probe = await lastfmPage({ ...lastfm, from: TIMESTAMP_FLOOR, page: 1 });
  const oldestPage = await lastfmPage({
    ...lastfm,
    from: TIMESTAMP_FLOOR,
    page: probe.totalPages
  });
  const oldest = oldestPage.tracks[oldestPage.tracks.length - 1];
  console.log(
    `Test-importing oldest play: "${oldest.artist} — ${oldest.title}" ` +
      `at ${new Date(oldest.uts * 1000).toISOString()}`
  );
  const hs = await handshake(creds);
  console.log('Handshake OK');
  await submitBatch([oldest], hs, creds);
  console.log(
    'Submission accepted. Verify the play appears with the date above ' +
      '(getActorScrobbles / your profile) before --run.'
  );
  process.exit(0);
}

const state = existsSync(STATE_PATH)
  ? JSON.parse(readFileSync(STATE_PATH, 'utf8'))
  : {
      cursor: TIMESTAMP_FLOOR,
      frozenTo: Math.floor(Date.now() / 1000),
      imported: 0
    };
state.cursor = Math.max(state.cursor, TIMESTAMP_FLOOR);
for (const k of state.poisons ?? []) poisonSet.add(k);
const saveState = () =>
  writeFileSync(
    STATE_PATH,
    JSON.stringify({ ...state, poisons: [...poisonSet] })
  );
saveState();
console.log(
  `[import] starting from cursor=${state.cursor} (already imported: ${state.imported})`
);

let hs = await handshake(creds);
console.log('[import] handshake OK');

for (;;) {
  // Always fetch the OLDEST remaining page; the window shrinks from the
  // bottom as the cursor advances, so live scrobbling never shifts it.
  const probe = await lastfmPage({
    ...lastfm,
    from: state.cursor,
    to: state.frozenTo,
    page: 1
  });
  if (probe.total === 0) break;
  const grandTotal = probe.total + state.imported;
  const page =
    probe.totalPages === 1
      ? probe
      : await lastfmPage({
          ...lastfm,
          from: state.cursor,
          to: state.frozenTo,
          page: probe.totalPages
        });
  const oldestFirst = [...page.tracks].reverse();
  for (let i = 0; i < oldestFirst.length; i += BATCH) {
    const batch = oldestFirst.slice(i, i + BATCH);
    const sendable = batch.filter((t) => !poisonSet.has(poisonKey(t)));
    if (sendable.length < batch.length) {
      state.skippedPoison = (state.skippedPoison ?? 0) + (batch.length - sendable.length);
    }
    if (sendable.length > 0) {
      hs = await submitBatch(sendable, hs, creds);
    }
    state.cursor = batch[batch.length - 1].uts + 1;
    state.imported += sendable.length;
    saveState();
    const when = new Date(batch[batch.length - 1].uts * 1000)
      .toISOString()
      .slice(0, 10);
    console.log(`[import] ${state.imported}/${grandTotal} (up to ${when})`);
    await sleep(BATCH_DELAY_MS);
  }
}

console.log(
  `[import] done — ${state.imported} scrobbles replayed into Rocksky` +
    (state.skippedPoison
      ? `; ${state.skippedPoison} plays of ${poisonSet.size} poison track(s) skipped`
      : '.')
);
