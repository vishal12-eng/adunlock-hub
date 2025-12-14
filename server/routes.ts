import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage.js";
import { insertContentSchema, insertUserSessionSchema } from "../shared/schema.js";
import bcrypt from "bcryptjs";
import { DOMAIN } from "./seo.js";

declare module "express-session" {
  interface SessionData {
    adminId?: string;
    adminEmail?: string;
    adminRole?: string;
  }
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    return res.status(404).json({ error: "Not found" });
  }

  const role = await storage.getAdminRole(req.session.adminId);
  if (!role || role.role !== "admin") {
    req.session.destroy(() => {});
    return res.status(404).json({ error: "Not found" });
  }

  next();
}

export async function registerRoutes(app: Express) {
  app.get("/api/contents", async (_req, res) => {
    const contents = await storage.getActiveContents();
    res.json(contents);
  });

  app.get("/api/contents/:id", async (req, res) => {
    const content = await storage.getContentById(req.params.id);
    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }
    res.json(content);
  });

  app.post("/api/contents/:id/view", async (req, res) => {
    await storage.incrementContentViews(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/sessions/:sessionId/:contentId", async (req, res) => {
    const session = await storage.getSession(req.params.sessionId, req.params.contentId);
    res.json(session || null);
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const data = insertUserSessionSchema.parse(req.body);
      const session = await storage.createSession(data);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid session data" });
    }
  });

  app.patch("/api/sessions/:id", async (req, res) => {
    const { ads_watched, completed } = req.body;
    const session = await storage.updateSession(req.params.id, { ads_watched, completed });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    res.json(session);
  });

  app.post("/api/contents/:id/unlock", async (req, res) => {
    await storage.incrementContentUnlocks(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/settings", async (_req, res) => {
    const settings = await storage.getAllSettings();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value || "";
    });
    res.json(settingsMap);
  });

  app.get("/api/settings/:key", async (req, res) => {
    const setting = await storage.getSetting(req.params.key);
    res.json(setting ? { value: setting.value } : { value: "" });
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        console.log("[AUTH] Login attempt missing email or password");
        return res.status(400).json({ error: "Email and password required" });
      }

      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        console.log(`[AUTH] Admin not found for email: ${email}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, admin.password_hash);
      if (!valid) {
        console.log(`[AUTH] Password mismatch for email: ${email}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const role = await storage.getAdminRole(admin.id);
      if (!role || role.role !== "admin") {
        console.log(`[AUTH] Role mismatch for admin: ${admin.id}, role: ${role?.role}`);
        return res.status(401).json({ error: "Unauthorized" });
      }

      req.session.adminId = admin.id;
      req.session.adminEmail = admin.email;
      req.session.adminRole = role.role;

      console.log(`[AUTH] Login successful for: ${email}`);
      res.json({ id: admin.id, email: admin.email });
    } catch (error) {
      console.error("[AUTH] Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (req.session.adminId) {
      const role = await storage.getAdminRole(req.session.adminId);
      if (role && role.role === "admin") {
        res.json({ id: req.session.adminId, email: req.session.adminEmail });
      } else {
        req.session.destroy(() => {});
        res.json(null);
      }
    } else {
      res.json(null);
    }
  });

  app.get("/api/admin/contents", requireAdmin, async (_req, res) => {
    const contents = await storage.getAllContents();
    res.json(contents);
  });

  app.post("/api/admin/contents", requireAdmin, async (req, res) => {
    try {
      const data = insertContentSchema.parse(req.body);
      const content = await storage.createContent(data);
      res.json(content);
    } catch (error) {
      res.status(400).json({ error: "Invalid content data" });
    }
  });

  app.patch("/api/admin/contents/:id", requireAdmin, async (req, res) => {
    const content = await storage.updateContent(req.params.id, req.body);
    if (!content) {
      return res.status(404).json({ error: "Content not found" });
    }
    res.json(content);
  });

  app.delete("/api/admin/contents/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteContent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Content not found" });
    }
    res.json({ success: true });
  });

  app.get("/api/admin/settings", requireAdmin, async (_req, res) => {
    const settings = await storage.getAllSettings();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value || "";
    });
    res.json(settingsMap);
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ error: "Key required" });
    }
    const setting = await storage.upsertSetting(key, value || "");
    res.json(setting);
  });

  app.post("/api/admin/settings/bulk", requireAdmin, async (req, res) => {
    const settings = req.body;
    const results: unknown[] = [];
    for (const [key, value] of Object.entries(settings)) {
      const setting = await storage.upsertSetting(key, (value as string) || "");
      results.push(setting);
    }
    res.json(results);
  });

  app.get("/sitemap.xml", async (_req, res) => {
    const contents = await storage.getActiveContents();
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

    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  });
}
