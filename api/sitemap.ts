import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../server/db";
import { DOMAIN } from "../server/seo";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const result = await pool.query(
      `SELECT id, title, updated_at FROM contents WHERE status = 'active' ORDER BY created_at DESC`
    );
    const contents = result.rows;
    const now = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    for (const content of contents) {
      const lastmod = content.updated_at
        ? new Date(content.updated_at).toISOString().split("T")[0]
        : now;
      xml += `
  <url>
    <loc>${DOMAIN}/unlock/${content.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
}
