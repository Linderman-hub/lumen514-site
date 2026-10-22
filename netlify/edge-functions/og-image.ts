// Serves a Drive-hosted share card from our own domain: /og/<file id>.jpg
// Link-preview bots are happier fetching an image from the same host as the page.
import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const m = new URL(request.url).pathname.match(/^\/og\/([A-Za-z0-9_-]{20,})\.jpg$/);
  if (!m) return new Response("Not found", { status: 404 });
  const upstream = await fetch(`https://lh3.googleusercontent.com/d/${m[1]}=w1200`, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; Lumen514/1.0)" },
  });
  if (!upstream.ok) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  headers.set("content-type", upstream.headers.get("content-type") || "image/jpeg");
  headers.set("cache-control", "public, max-age=86400");
  return new Response(upstream.body, { status: 200, headers });
};

export const config = { path: "/og/*" };
