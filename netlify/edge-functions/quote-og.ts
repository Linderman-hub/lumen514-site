// Per-link share card for lumen514.com/quote.
// The client link can carry ?c=<drive file id> (a "Your quote is ready" card built on the rep's phone
// from the customer's own house photo). Text-message previews only read the plain URL, so this swaps the
// og:image / twitter:image on the page for that card. No ?c, nothing changes: the default card stays.
import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("c") || "";
  const res = await context.next();
  if (!/^[A-Za-z0-9_-]{20,}$/.test(id)) return res;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return res;
  const html = await res.text();
  const img = `https://lumen514.com/og/${id}.jpg`;
  const out = html
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${img}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${img}$2`);
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  return new Response(out, { status: res.status, headers });
};

export const config = { path: ["/quote", "/quote.html"] };
