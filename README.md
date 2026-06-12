# kyleslugg.com

Personal website of Kyle Slugg-Urbino, built with [Astro](https://astro.build).
Fully static — the only client-side JavaScript is the EmailJS call on the
contact page, inlined at build time.

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
