import type { APIRoute } from 'astro';
import config from '../../../atproto.config.json';

// standard.site domain verification: the body is the AT-URI of this
// site's publication record (set by `npm run atproto:init`).
export const GET: APIRoute = () => {
  if (!config.publicationUri) {
    return new Response('Not Found', { status: 404 });
  }
  return new Response(config.publicationUri, {
    headers: { 'Content-Type': 'text/plain' }
  });
};
