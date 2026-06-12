// One-off importer: replays Last.fm scrobble history into Rocksky via
// Rocksky's Last.fm-compatible Audioscrobbler 2.0 endpoint
// (https://docs.rocksky.app/migrations/from-lastfm), batched 50 plays
// per request with original timestamps. Dependency-free.
//
//   node scripts/lastfm-import.mjs --count   size the job (read-only;
//                                            needs only Last.fm creds)
//   node scripts/lastfm-import.mjs --run     import, oldest first
//
// Credentials (.env or environment):
//   LASTFM_USER             Last.fm username
//   LASTFM_API_KEY          Last.fm API key (the mirror's key works)
//   ROCKSKY_API_KEY         from https://rocksky.app/apikeys
//   ROCKSKY_SHARED_SECRET   from https://rocksky.app/apikeys
//   ROCKSKY_SESSION_KEY     session key for the Audioscrobbler API
//
// Progress persists in .lastfm-import-state.json (gitignored): the run
// freezes an upper timestamp bound at start (so the live Last.fm->
// Rocksky mirror keeps working without shifting pagination) and walks
// from the oldest play forward, checkpointing after every batch. Safe
// to interrupt and re-run; Rocksky dedups plays within a +/-120s window
// in any case.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const STATE_PATH = path.join(ROOT, '.lastfm-import-state.json');
const BATCH = 50;
const BATCH_DELAY_MS = 2500;

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

async function lastfmPage({ user, apiKey, from, to, page }) {
  const params = new URLSearchParams({
    method: 'user.getrecenttracks',
    user,
    api_key: apiKey,
    format: 'json',
    limit: String(BATCH * 4), // 200, the API max
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
      track: t.name,
      album: t.album?.['#text'] || undefined,
      mbid: t.mbid || undefined,
      uts: Number(t.date.uts)
    }));
  return {
    tracks,
    total: Number(rt['@attr'].total),
    totalPages: Number(rt['@attr'].totalPages)
  };
}

function sign(params, secret) {
  const base = Object.keys(params)
    .filter((k) => k !== 'format')
    .sort()
    .map((k) => k + params[k])
    .join('');
  return createHash('md5').update(base + secret, 'utf8').digest('hex');
}

async function scrobbleBatch(batch, creds, attempt = 0) {
  const params = {
    method: 'track.scrobble',
    api_key: creds.apiKey,
    sk: creds.sessionKey,
    format: 'json'
  };
  batch.forEach((t, i) => {
    params[`artist[${i}]`] = t.artist;
    params[`track[${i}]`] = t.track;
    params[`timestamp[${i}]`] = String(t.uts);
    if (t.album) params[`album[${i}]`] = t.album;
    if (t.mbid) params[`mbid[${i}]`] = t.mbid;
  });
  params.api_sig = sign(params, creds.sharedSecret);
  const res = await fetch('https://audioscrobbler.rocksky.app/2.0', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params)
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 5) throw new Error(`Rocksky ${res.status} after 5 retries`);
    const wait = 5000 * 2 ** attempt;
    console.log(`  rate-limited/unavailable (${res.status}); waiting ${wait / 1000}s`);
    await sleep(wait);
    return scrobbleBatch(batch, creds, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`Rocksky scrobble failed (${res.status}): ${await res.text()}`);
  }
  return res.json().catch(() => ({}));
}

const lastfm = {
  user: env('LASTFM_USER'),
  apiKey: env('LASTFM_API_KEY')
};

if (process.argv.includes('--count')) {
  const { total } = await lastfmPage({ ...lastfm, page: 1 });
  const batches = Math.ceil(total / BATCH);
  const hours = (batches * BATCH_DELAY_MS) / 3600_000;
  console.log(`Last.fm history for ${lastfm.user}: ${total} scrobbles`);
  console.log(
    `Import plan: ${batches} batches of ${BATCH}, ~${hours.toFixed(1)}h at ` +
      `${BATCH_DELAY_MS / 1000}s/batch (resumable; safe to interrupt)`
  );
  process.exit(0);
}

if (!process.argv.includes('--run')) {
  console.log('Usage: node scripts/lastfm-import.mjs --count | --run');
  process.exit(1);
}

const rocksky = {
  apiKey: env('ROCKSKY_API_KEY'),
  sharedSecret: env('ROCKSKY_SHARED_SECRET'),
  sessionKey: env('ROCKSKY_SESSION_KEY')
};

const state = existsSync(STATE_PATH)
  ? JSON.parse(readFileSync(STATE_PATH, 'utf8'))
  : { cursor: 0, frozenTo: Math.floor(Date.now() / 1000), imported: 0 };
writeFileSync(STATE_PATH, JSON.stringify(state));
console.log(
  `[import] starting from cursor=${state.cursor} (already imported: ${state.imported})`
);

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
    await scrobbleBatch(batch, rocksky);
    state.cursor = batch[batch.length - 1].uts + 1;
    state.imported += batch.length;
    writeFileSync(STATE_PATH, JSON.stringify(state));
    const when = new Date(batch[batch.length - 1].uts * 1000)
      .toISOString()
      .slice(0, 10);
    console.log(
      `[import] ${state.imported}/${probe.total + state.imported} up to ${when}`
    );
    await sleep(BATCH_DELAY_MS);
  }
}

console.log(`[import] done — ${state.imported} scrobbles replayed into Rocksky.`);
