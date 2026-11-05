// A page answers in Markdown to whoever asks for it, at its normal address. The
// site is still static: this only chooses which built file to serve, and only for
// pages. wrangler.jsonc keeps .md, .txt, .xml and built assets away from here.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

// The rule of prefersMarkdown in the client's apps/web/worker/seo.ts: a browser
// navigation names text/html, so it never gets Markdown, whatever else it accepts.
export function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  return /\btext\/markdown\b/i.test(accept) && !/\btext\/html\b/i.test(accept);
}

const twinOf = (pathname: string) => {
  const path = pathname.replace(/\/+$/, '');
  return path === '' ? '/index.md' : `${path}.md`;
};

const isFile = (pathname: string) => /\.[a-z0-9]+$/i.test(pathname);
const isAnswer = (response: Response) => response.ok || response.status === 304;

function varyOnAccept(response: Response): Response {
  const varied = new Response(response.body, response);
  varied.headers.append('Vary', 'Accept');
  return varied;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const readable = request.method === 'GET' || request.method === 'HEAD';
    if (!readable || isFile(url.pathname)) return env.ASSETS.fetch(request);

    if (prefersMarkdown(request.headers.get('Accept'))) {
      const twin = await env.ASSETS.fetch(new Request(new URL(twinOf(url.pathname), url), request));
      if (isAnswer(twin)) return varyOnAccept(twin);
    }

    // A 404 or a redirect is the same under either header, so it stays as it is.
    const page = await env.ASSETS.fetch(request);
    return isAnswer(page) ? varyOnAccept(page) : page;
  },
};
