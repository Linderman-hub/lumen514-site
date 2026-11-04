// Email open pixel: /t/<tag>.gif
// Put <img src="https://lumen514.com/t/dave-flammia.gif" width="1" height="1"> in an email.
// Each load logs an "em-<tag>" row through the same Apps Script that logs site visits, then returns a 1x1 transparent GIF.
import type { Context } from "@netlify/edge-functions";

const SCRIPT = "https://script.google.com/macros/s/AKfycbx5_22g8v4v8OkC-sIbJKRcuO0enCNSxCIoPz1XXlC49U6nJj7DEttLR42hohW01HsMuQ/exec";
const GIF = Uint8Array.from([71,73,70,56,57,97,1,0,1,0,128,0,0,0,0,0,255,255,255,33,249,4,1,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,68,1,0,59]);

export default async (request: Request, context: Context) => {
  const m = new URL(request.url).pathname.match(/^\/t\/([A-Za-z0-9_-]{1,40})\.gif$/);
  if (!m) return new Response("Not found", { status: 404 });
  const ua = request.headers.get("user-agent") || "";
  // Gmail and most clients fetch through an image proxy; Apple Mail Privacy prefetches. Log everything, note the fetcher.
  const via = /GoogleImageProxy/i.test(ua) ? "gmail" : /Apple|iPhone|Macintosh/i.test(ua) ? "apple" : /Outlook|Microsoft/i.test(ua) ? "outlook" : "other";
  const tag = `em-${m[1]}-${via}`.slice(0, 40);
  context.waitUntil(fetch(`${SCRIPT}?src=${encodeURIComponent(tag)}&ping=1`, { redirect: "follow" }).catch(() => {}));
  return new Response(GIF, {
    status: 200,
    headers: {
      "content-type": "image/gif",
      "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
      "pragma": "no-cache",
      "expires": "0",
    },
  });
};

export const config = { path: "/t/*" };
