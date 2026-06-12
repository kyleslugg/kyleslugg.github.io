import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One stream for projects and publications alike. Entries with an
// `externalUrl` are link-outs (repos, webmaps, standalone pages);
// entries with a markdown body become on-site essay pages at
// /work/<filename>. `draft: true` keeps an entry out of production
// builds but visible in `npm run dev`.
const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    blurb: z.string(),
    image: z.string().optional(),
    externalUrl: z.string().optional(),
    draft: z.boolean().default(false),
    // at:// URI of the Bluesky announcement post for an essay; when set,
    // replies to that post render as comments at build time.
    bskyPostUri: z.string().optional()
  })
});

export const collections = { work };
