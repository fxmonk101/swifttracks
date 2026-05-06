// Dynamic sitemap.xml generator. Includes static public routes + all live shipments
// so each /track/:trackingId becomes individually crawlable as it's created.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://transporthaven.com";

const STATIC_ROUTES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/track", changefreq: "daily", priority: "0.9" },
  { path: "/quote", changefreq: "monthly", priority: "0.8" },
  { path: "/schedule-pickup", changefreq: "monthly", priority: "0.8" },
  { path: "/create-shipment", changefreq: "monthly", priority: "0.8" },
  { path: "/international", changefreq: "monthly", priority: "0.7" },
  { path: "/business", changefreq: "monthly", priority: "0.7" },
  { path: "/services", changefreq: "monthly", priority: "0.7" },
  { path: "/services-guide", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/careers", changefreq: "monthly", priority: "0.5" },
  { path: "/press", changefreq: "monthly", priority: "0.5" },
  { path: "/sustainability", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/support", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/reviews", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/cookies", changefreq: "yearly", priority: "0.3" },
];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const urls: string[] = STATIC_ROUTES.map(
    (r) =>
      `<url><loc>${SITE}${r.path}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
  );

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data, error } = await supabase
      .from("shipments")
      .select("tracking_id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5000);

    if (!error && data) {
      for (const row of data as Array<{ tracking_id: string; updated_at: string | null }>) {
        if (!row.tracking_id) continue;
        const lastmod = row.updated_at ? `<lastmod>${esc(row.updated_at)}</lastmod>` : "";
        urls.push(
          `<url><loc>${SITE}/track/${esc(row.tracking_id)}</loc>${lastmod}<changefreq>hourly</changefreq><priority>0.6</priority></url>`
        );
      }
    }
  } catch (e) {
    console.error("[sitemap] failed to load shipments", e);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new Response(xml, {
    headers: {
      ...cors,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
});
