// One-off importer: replays Last.fm scrobble history into Rocksky via
// app.rocksky.scrobble.createScrobble (bearer-token auth, original
// timestamps). Dependency-free.
//
//   node scripts/lastfm-import.mjs --count   size the job (read-only;
//                                            needs only Last.fm creds)
//   node scripts/lastfm-import.mjs --test    import the single oldest
//                                            play, to verify auth and
//                                            timestamp handling
//   node scripts/lastfm-import.mjs --run     import, oldest first
//
// Credentials (.env or environment):
//   LASTFM_USER            Last.fm username
//   LASTFM_API_KEY         Last.fm API key (the mirror's key works)
//   ROCKSKY_BEARER_TOKEN   bearer token for api.rocksky.app
//
// Progress persists in .lastfm-import-state.json (gitignored): the run
// freezes an upper timestamp bound at start (so the live Last.fm ->
// Rocksky mirror keeps working without shifting pagination) and walks
// from the oldest play forward, checkpointing as it goes. Safe to
// interrupt and re-run — including after a 401 when the bearer token
// expires: regenerate the token and re-run to resume.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const STATE_PATH = path.join(ROOT, '.lastfm-import-state.json');
const PAGE_SIZE = 200; // Last.fm API max
const SCROBBLE_DELAY_MS = 800;

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

async function createScrobble(track, token, attempt = 0) {
  const res = await fetch(
    'https://api.rocksky.app/xrpc/app.rocksky.scrobble.createScrobble',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: track.title,
        artist: track.artist,
        ...(track.album ? { album: track.album } : {}),
        ...(track.mbId ? { mbId: track.mbId } : {}),
        timestamp: track.uts
      })
    }
  );
  if (res.status === 401) {
    throw new Error(
      'Rocksky returned 401 — the bearer token expired. Regenerate it, ' +
        'update .env, and re-run; the import resumes from the checkpoint.'
    );
  }
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 6) throw new Error(`Rocksky ${res.status} after 6 retries`);
    const wait = 5000 * 2 ** attempt;
    console.log(`  ${res.status} from Rocksky; backing off ${wait / 1000}s`);
    await sleep(wait);
    return createScrobble(track, token, attempt + 1);
  }
  if (!res.ok) {
    // Unmatchable tracks are skipped by Rocksky's normalizer; treat a
    // 4xx for a single play as skippable rather than fatal.
    console.log(
      `  skipped "${track.artist} — ${track.title}" (${res.status}: ${(await res.text()).slice(0, 120)})`
    );
    return { skipped: true };
  }
  return res.json().catch(() => ({}));
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
  const { total } = await lastfmPage({ ...lastfm, page: 1 });
  const hours = (total * SCROBBLE_DELAY_MS) / 3600_000;
  console.log(`Last.fm history for ${lastfm.user}: ${total} scrobbles`);
  console.log(
    `Import plan: ~${hours.toFixed(1)}h at ${SCROBBLE_DELAY_MS}ms per play ` +
      '(resumable; safe to interrupt)'
  );
  process.exit(0);
}

const token = env('ROCKSKY_BEARER_TOKEN');

if (mode === 'test') {
  const probe = await lastfmPage({ ...lastfm, page: 1 });
  const oldestPage = await lastfmPage({ ...lastfm, page: probe.totalPages });
  const oldest = oldestPage.tracks[oldestPage.tracks.length - 1];
  console.log(
    `Test-importing oldest play: "${oldest.artist} — ${oldest.title}" ` +
      `at ${new Date(oldest.uts * 1000).toISOString()}`
  );
  const result = await createScrobble(oldest, token);
  console.log('Response:', JSON.stringify(result).slice(0, 300));
  console.log(
    'Check your Rocksky profile: the play should appear with the date above. ' +
      'If the date is wrong, stop and investigate before --run.'
  );
  process.exit(0);
}

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
  for (const track of oldestFirst) {
    await createScrobble(track, token);
    state.cursor = track.uts + 1;
    state.imported += 1;
    writeFileSync(STATE_PATH, JSON.stringify(state));
    if (state.imported % 25 === 0) {
      const when = new Date(track.uts * 1000).toISOString().slice(0, 10);
      console.log(`[import] ${state.imported}/${grandTotal} (up to ${when})`);
    }
    await sleep(SCROBBLE_DELAY_MS);
  }
}

console.log(`[import] done — ${state.imported} scrobbles replayed into Rocksky.`);
