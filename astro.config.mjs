import { defineConfig } from 'astro/config';

// build.format 'file' emits /about.html (not /about/index.html) so
// Cloudflare Pages serves the same clean URLs the SPA router handled.
export default defineConfig({
  build: { format: 'file' },
  markdown: {
    shikiConfig: { theme: 'github-light' }
  }
});
