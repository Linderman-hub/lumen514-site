// Visit ping: /v?src=<tag>&dev=<phone|tablet|computer>
// Adds three things Apps Script cannot see on its own, then forwards the ping to the Visits tab:
//   vid  a first-party cookie, so the same browser coming back shows the same id
//   net  a salted, shortened hash of the visitor's IP (never the raw address), so two devices on one home Wi-Fi match
//   loc  city and region from Netlify's geo lookup
import type { Context } from "@netlify/edge-functions";

const SCRIPT = "https://script.google.com/macros/s/AKfycbx5_22g8v4v8OkC-sIbJKRcuO0enCNSxCIoPz1XXlC49U6nJj7DEttLR42hohW01HsMuQ/exec";
const SALT = "lumen514-visits-2026";

async function short(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(SALT + s));
  return Array.from(new Uint8Array(buf)).slice(0, 4).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const clean = (v: string | null, n: number) => String(v || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, n);
  const src = clean(url.searchParams.get("src"), 40) || "direct";
  const dev = clean(url.searchParams.get("dev"), 10);

  const cookies = request.headers.get("cookie") || "";
  const m = cookies.match(/(?:^|;\s*)l514vid=([A-Za-z0-9]{6,12})/);
  const vid = m ? m[1] : Math.random().toString(36).slice(2, 10);

  const ip = context.ip || request.headers.get("x-nf-client-connection-ip") || request.headers.get("x-forwarded-for") || "";
  const net = ip ? await short(ip) : "";
  const g = context.geo || {};
  const loc = [g.city, g.subdivision?.code].filter(Boolean).join(", ").slice(0, 40);

  const q = new URLSearchParams({ src, ping: "1", dev, vid, net, loc });
  context.waitUntil(fetch(`${SCRIPT}?${q.toString()}`, { redirect: "follow" }).catch(() => {}));

  return new Response(null, {
    status: 204,
    headers: {
      "cache-control": "no-store",
      "set-cookie": `l514vid=${vid}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`,
    },
  });
};

export const config = { path: "/v" };
