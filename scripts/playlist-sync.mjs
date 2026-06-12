// Syncs src/data/playlist.json from the public Spotify playlist, so the
// editing workflow is: curate in Spotify -> `npm run playlist:sync` ->
// review the diff -> commit.
//
// - Track list, order, titles, and artists mirror the Spotify playlist
//   (read from Spotify's public embed JSON; no credentials needed).
// - Tracks already in playlist.json keep their youtubeId verbatim, so
//   hand corrections survive every sync (including explicit nulls for
//   tracks that aren't on YouTube).
// - New tracks get a best-effort YouTube match from search results —
//   ALWAYS review these in the diff; fix by editing youtubeId by hand.
// - Tracks removed from the Spotify playlist are removed here too.
//
// Note: the embed JSON exposes roughly the first 100 tracks.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PLAYLIST_ID = '3XE1EI1TpQNTJjzD3iD4Fe';
const ROOT = new URL('..', import.meta.url).pathname;
const DATA_PATH = path.join(ROOT, 'src/data/playlist.json');
const UA = { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en' };

async function spotifyTracks() {
  const res = await fetch(
    `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}`,
    { headers: UA }
  );
  if (!res.ok) throw new Error(`Spotify embed fetch failed: ${res.status}`);
  const html = await res.text();
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s
  );
  if (!m) throw new Error('No __NEXT_DATA__ in Spotify embed page');
  const findTrackList = (o) => {
    if (o && typeof o === 'object') {
      if (o.trackList) return o;
      for (const v of Object.values(o)) {
        const r = findTrackList(v);
        if (r) return r;
      }
    }
    return undefined;
  };
  const entity = findTrackList(JSON.parse(m[1]));
  if (!entity) throw new Error('No trackList found in embed data');
  // Spotify's embed uses non-breaking spaces (U+00A0) in artist lists
  const clean = (s) => s.replace(/\u00a0/g, ' ');
  return entity.trackList.map((t) => ({
    title: clean(t.title),
    artists: clean(t.subtitle),
    spotifyTrackId: t.uri.split(':').pop()
  }));
}

async function resolveYouTube(query) {
  const res = await fetch(
    'https://www.youtube.com/results?search_query=' +
      encodeURIComponent(query),
    { headers: UA }
  );
  if (!res.ok) return null;
  const html = await res.text();
  const m = html.match(/var ytInitialData = ({.*?});<\/script>/s);
  if (!m) return null;
  const hit = m[1].match(/"videoRenderer":\{"videoId":"([^"]+)"/);
  return hit ? hit[1] : null;
}

const existing = JSON.parse(await readFile(DATA_PATH, 'utf8'));
const byId = new Map(existing.map((t) => [t.spotifyTrackId, t]));
const fresh = await spotifyTracks();

const out = [];
for (const track of fresh) {
  const record = (youtubeId) => ({
    title: track.title,
    artists: track.artists,
    youtubeId,
    spotifyTrackId: track.spotifyTrackId
  });
  const prior = byId.get(track.spotifyTrackId);
  if (prior) {
    // keep youtubeId verbatim; refresh title/artists from Spotify
    out.push(record(prior.youtubeId));
    continue;
  }
  const youtubeId = await resolveYouTube(
    `${track.artists.split(',')[0]} ${track.title}`
  );
  out.push(record(youtubeId));
  console.log(
    youtubeId
      ? `+ added "${track.title}" -> https://www.youtube.com/watch?v=${youtubeId} (REVIEW THIS MATCH)`
      : `+ added "${track.title}" -> no YouTube match found; youtubeId is null`
  );
  await new Promise((r) => setTimeout(r, 1500));
}

for (const t of existing) {
  if (!fresh.some((f) => f.spotifyTrackId === t.spotifyTrackId)) {
    console.log(`- removed "${t.title}"`);
  }
}

await writeFile(DATA_PATH, JSON.stringify(out, null, 2) + '\n');
console.log(
  `[playlist-sync] ${out.length} tracks; review with \`git diff src/data/playlist.json\``
);
