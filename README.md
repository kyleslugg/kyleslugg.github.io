# kyleslugg.co

Personal website of Kyle Slugg-Urbino, built with [Astro](https://astro.build).
Fully static — the only client-side JavaScript is the EmailJS call on the
contact page, inlined at build time. Canonical domain is **kyleslugg.co**
(also the owner's ATProto handle); kyleslugg.com serves the same deployment.

## Commands

| Command           | Action                                       |
| ----------------- | -------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Start dev server at `localhost:4321`         |
| `npm run build`   | Build the static site to `./dist/`           |
| `npm run preview` | Serve the production build locally           |

## Structure

- `src/pages/` — one `.astro` file per page (`/`, `/about`, `/work`, `/contact`),
  plus `work/[slug].astro` for on-site essay pages
- `src/layouts/Base.astro` — shared shell (head, header, footer)
- `src/components/` — header, footer, image grid
- `src/content/work/` — one markdown file per Work entry (projects and
  writing share the stream). **To add an entry, add a file here.**
  Frontmatter: `title`, `date`, `blurb`, optional `image` (drop the file
  in `public/post_images/`), optional `externalUrl`. An entry *with* an
  `externalUrl` is a link-out; an entry *with a markdown body* becomes an
  essay at `/work/<filename>`; `draft: true` hides it from production
  builds (still visible in `npm run dev`). See `draft-template.md`.
- `src/styles/` — global SCSS. `theme.scss` reproduces the look of the MUI
  components the previous React version of this site used; values were
  measured from the rendered MUI output.
- `public/` — static assets copied verbatim (post images, PDFs, standalone
  project pages)
- `Archive/` — the pre-2023 static site, kept for reference; not built

## ATProto syndication

Essays (work entries with a markdown body) syndicate to the owner's PDS
as [standard.site](https://standard.site) records via
`scripts/atproto-sync.mjs` (dependency-free XRPC). It runs after every
build; without `ATPROTO_APP_PASSWORD` (environment or local `.env`) it
skips silently, so local builds need no credentials. In Cloudflare Pages
the variable is set as a production build secret.

- `npm run atproto:init` — one-time: creates the `site.standard.publication`
  record and writes its AT-URI into `atproto.config.json` (commit that).
- Document records use the entry slug as rkey, so re-syncs update in
  place. Nothing is ever auto-posted to Bluesky and nothing is deleted.
- To enable comments on an essay: post about it on Bluesky, put the
  post's `at://` URI in the essay's `bskyPostUri` frontmatter; replies
  render as static comments at next build.
- Identity/verification: `/.well-known/atproto-did` (handle),
  `/.well-known/site.standard.publication` (publication), and a
  `<link rel="site.standard.document">` tag on each essay.

## Playlist

`/playlist` renders `src/data/playlist.json`. To edit the playlist:
curate it in Spotify as usual, then run `npm run playlist:sync` — the
script mirrors the track list/order from the public Spotify playlist
(no credentials), resolves YouTube links for new tracks (best-effort:
**review the flagged matches in the diff**), and preserves hand-edited
`youtubeId` values (including `null` for tracks not on YouTube). Review
`git diff`, fix any bad match by editing the `youtubeId` directly, and
push.

## Deployment

Deployed via Cloudflare Pages connected to this repository
(custom domain: kyleslugg.com). Build command `npm run build`,
output directory `dist`. Pushes to `main` deploy automatically.
`build.format: 'file'` in `astro.config.mjs` emits `about.html` etc. so
Cloudflare serves the same clean URLs (`/about`) the old SPA router handled.

## History

Originally a hand-written static site (see `Archive/`), then a
Vite + React + MUI single-page app, migrated to Astro in June 2026 with
pixel-identical output (verified by Playwright screenshot diffing against
the live site at desktop and mobile viewports).
