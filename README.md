# kyleslugg.co

Personal website of Kyle Slugg-Urbino, built with [Astro](https://astro.build).
Fully static — the only client-side JavaScript is the EmailJS call on the
contact page, inlined at build time. Canonical domain is **kyleslugg.co**
(also the owner's ATProto handle: `@kyleslugg.co`); kyleslugg.com serves
the same deployment.

Every update follows the same rhythm: **edit → preview with `npm run dev`
→ push to `main` → Cloudflare deploys automatically (~1 minute).**

## Updating the site

### Add a project (link-out)

1. Create `src/content/work/<slug>.md` with frontmatter only — no body:

   ```markdown
   ---
   title: Project Name
   date: 2026-06-12
   blurb: One-sentence description shown on the Work page.
   image: /post_images/Project_Name.jpg
   externalUrl: https://github.com/kyleslugg/project
   ---
   ```

2. Drop the image (square-ish) in `public/post_images/`. Omit `image`
   to render a full-width text row.
3. Push.

### Publish an essay

1. Create `src/content/work/<slug>.md` with the same frontmatter but
   **no `externalUrl`**, and write markdown below the second `---`.
   The slug becomes the URL: `/work/<slug>`.
2. While drafting, set `draft: true` — drafts render in `npm run dev`
   but never in production. `src/content/work/draft-template.md` is a
   ready-made scaffold showing the supported markdown.
3. To publish: remove `draft: true` and push. The essay appears on the
   Work page and at `/work/<slug>`, and the build syndicates it to the
   ATProto network as a [standard.site](https://standard.site) document
   record (see below — this is PDS data, **never** an automatic Bluesky
   post).

### Enable comments on an essay

1. Post about the essay on Bluesky yourself (this is the only thing
   that ever appears on Bluesky, and it's always manual).
2. Get the post's `at://` URI (from its URL:
   `bsky.app/profile/HANDLE/post/RKEY` →
   `at://DID-or-HANDLE/app.bsky.feed.post/RKEY`).
3. Add `bskyPostUri: at://...` to the essay's frontmatter and push.
   Replies to that post render as static comments under the essay;
   each subsequent build refreshes them.

### Update the playlist

1. Edit the playlist in Spotify as usual (add / remove / reorder).
2. Run `npm run playlist:sync` — mirrors `src/data/playlist.json` from
   the public Spotify playlist (no credentials) and resolves a YouTube
   link for each new track.
3. **Review the diff.** New tracks are flagged `REVIEW THIS MATCH` —
   YouTube search sometimes picks the wrong video. Fix by editing the
   `youtubeId` in `src/data/playlist.json`; hand edits (including
   `null` for tracks not on YouTube) survive all future syncs.
4. Push.

### Edit fixed pages

Home, About, Contact, and the 404 page are plain markup in
`src/pages/*.astro`. Header nav and footer links live in
`src/components/Header.astro` / `Footer.astro`.

## Commands

| Command                 | Action                                            |
| ----------------------- | ------------------------------------------------- |
| `npm install`           | Install dependencies (Node 22 — see `.nvmrc`)     |
| `npm run dev`           | Dev server at `localhost:4321` (drafts visible)   |
| `npm run build`         | Build to `./dist/`, then run the ATProto sync     |
| `npm run preview`       | Serve the production build locally                |
| `npm run playlist:sync` | Mirror the playlist from Spotify (review diff!)   |
| `npm run atproto:init`  | One-time: create the standard.site publication    |

## Structure

- `src/pages/` — one `.astro` file per fixed page, plus
  `work/[slug].astro` (essay pages) and `.well-known/` endpoints
- `src/layouts/Base.astro` — shared shell (head, header, footer)
- `src/content/work/` — the Work stream (projects + essays), one
  markdown file per entry
- `src/data/playlist.json` — the `/playlist` tracklist
- `src/styles/` — global SCSS; `theme.scss` reproduces the rendered look
  of the MUI components the previous React version used; `essay.scss`
  is the serif reading style for essay pages
- `scripts/` — `atproto-sync.mjs` and `playlist-sync.mjs`, both
  dependency-free Node
- `public/` — static assets copied verbatim (post images, PDFs,
  standalone project pages, `.well-known/atproto-did`, `_headers`)
- `Archive/` — the pre-2023 static site, kept for reference; not built

## ATProto integration (reference)

Identity: the domain is the handle. `/.well-known/atproto-did` asserts
the DID (`did:plc:dctgmhkntcks7b2fofti5yxa`, PDS: `eurosky.social`);
`/.well-known/site.standard.publication` asserts the standard.site
publication; each essay carries a `<link rel="site.standard.document">`
tag. Static identity values live in `atproto.config.json`.

Syndication: `scripts/atproto-sync.mjs` runs after every build. It
upserts one `site.standard.document` record per published essay (slug
as rkey, so re-syncs update in place). Guarantees: link-out entries and
drafts never syndicate, nothing is ever auto-posted to Bluesky, and
nothing is ever deleted from the PDS.

Credentials: `ATPROTO_APP_PASSWORD` (an app password, not the account
password) is read from the environment or a local `.env` (gitignored).
It is set as a production build secret in Cloudflare Pages; without it
the sync skips silently, so local builds need no credentials. Revoke or
rotate it anytime in the account's App Passwords settings.

### One-off: Last.fm history import (Rocksky)

`scripts/lastfm-import.mjs` replays Last.fm scrobble history into
[Rocksky](https://rocksky.app) through its Audioscrobbler-compatible
API. `--count` sizes the job (read-only); `--run` imports oldest-first,
checkpointing to a gitignored state file, so it's safe to interrupt and
resume. Credentials in `.env`: `LASTFM_USER`, `LASTFM_API_KEY`,
`ROCKSKY_API_KEY`, `ROCKSKY_SHARED_SECRET`, `ROCKSKY_SESSION_KEY`.

## Deployment

Cloudflare Pages, connected to this repository: build command
`npm run build`, output directory `dist`, Node from `.nvmrc`. Pushes to
`main` deploy automatically. Domains: kyleslugg.co (canonical, per-page
`rel=canonical` tags) and kyleslugg.com (same deployment).
`build.format: 'file'` in `astro.config.mjs` emits `about.html` etc. so
Cloudflare serves the same clean URLs (`/about`) the old SPA router
handled. `public/_headers` sets content types for the `.well-known`
files; `dist/404.html` keeps unmatched paths returning real 404s.

## History

Originally a hand-written static site (see `Archive/`), then a
Vite + React + MUI single-page app, migrated to Astro in June 2026 with
pixel-identical output (verified by Playwright screenshot diffing
against the live site at desktop and mobile viewports). The Work page
was reformatted as a writing-focused index, and ATProto identity and
standard.site syndication were added, in the same month.
