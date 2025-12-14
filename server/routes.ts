import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage.js";
import { insertContentSchema, insertUserSessionSchema } from "../shared/schema.js";
import bcrypt from "bcryptjs";
import { DOMAIN } from "./seo.js";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: string;
      email: string;
    };
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateSessionSchema = z.object({
  ads_watched: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
});

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string().optional(),
});

async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.session.user) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const role = await storage.getAdminRole(req.session.user.id);
  if (!role || role.role !== "admin") {
    req.session.destroy(() => {});
    res.status(404).json({ error: "Not found" });
    return;
  }

  next();
}

export function registerRoutes(app: Express): void {
  app.get("/api/contents", async (_req: Request, res: Response) => {
    const contents = await storage.getActiveContents();
    res.json(contents);
  });

  app.get("/api/contents/:id", async (req: Request, res: Response) => {
    const content = await storage.getContentById(req.params.id);
    if (!content) {
      res.status(404).json({ error: "Content not found" });
      return;
    }
    res.json(content);
  });

  app.post("/api/contents/:id/view", async (req: Request, res: Response) => {
    await storage.incrementContentViews(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/sessions/:sessionId/:contentId", async (req: Request, res: Response) => {
    const session = await storage.getSession(req.params.sessionId, req.params.contentId);
    res.json(session || null);
  });

  app.post("/api/sessions", async (req: Request, res: Response) => {
    try {
      const data = insertUserSessionSchema.parse(req.body);
      const session = await storage.createSession(data);
      res.json(session);
    } catch {
      res.status(400).json({ error: "Invalid session data" });
    }
  });

  app.patch("/api/sessions/:id", async (req: Request, res: Response) => {
    try {
      const data = updateSessionSchema.parse(req.body);
      const session = await storage.updateSession(req.params.id, data);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      res.json(session);
    } catch {
      res.status(400).json({ error: "Invalid session data" });
    }
  });

  app.post("/api/contents/:id/unlock", async (req: Request, res: Response) => {
    await storage.incrementContentUnlocks(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/settings", async (_req: Request, res: Response) => {
    const settings = await storage.getAllSettings();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value || "";
    });
    res.json(settingsMap);
  });

  app.get("/api/settings/:key", async (req: Request, res: Response) => {
    const setting = await storage.getSetting(req.params.key);
    res.json(setting ? { value: setting.value } : { value: "" });
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        console.log("[AUTH] Login attempt with invalid input");
        res.status(400).json({ error: "Email and password required" });
        return;
      }

      const { email, password } = parseResult.data;

      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        console.log(`[AUTH] Admin not found for email: ${email}`);
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const valid = await bcrypt.compare(password, admin.password_hash);
      if (!valid) {
        console.log(`[AUTH] Password mismatch for email: ${email}`);
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const role = await storage.getAdminRole(admin.id);
      if (!role || role.role !== "admin") {
        console.log(`[AUTH] Role mismatch for admin: ${admin.id}, role: ${role?.role}`);
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      req.session.user = { id: admin.id, email: admin.email };

      // Explicitly save session before responding - critical for Railway's reverse proxy
      req.session.save((err) => {
        if (err) {
          console.error("[AUTH] Session save error:", err);
          res.status(500).json({ error: "Failed to create session" });
          return;
        }
        console.log(`[AUTH] Login successful for: ${email}, session saved`);
        res.json({ id: admin.id, email: admin.email });
      });
    } catch (error) {
      console.error("[AUTH] Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: "Failed to logout" });
        return;
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      // Guard against missing session object
      if (!req.session) {
        console.log("[AUTH] /me called without session object");
        res.status(401).json({ error: "No session" });
        return;
      }

      // Check if user is logged in
      if (!req.session.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      // Verify role is still valid
      const role = await storage.getAdminRole(req.session.user.id);
      if (role && role.role === "admin") {
        res.json({ loggedIn: true, user: req.session.user });
      } else {
        // Role no longer valid, destroy session
        req.session.destroy((err) => {
          if (err) console.error("[AUTH] Session destroy error:", err);
        });
        res.status(401).json({ error: "Not authenticated" });
      }
    } catch (error) {
      console.error("[AUTH] /me error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/contents", requireAdmin, async (_req: Request, res: Response) => {
    const contents = await storage.getAllContents();
    res.json(contents);
  });

  app.post("/api/admin/contents", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertContentSchema.parse(req.body);
      const content = await storage.createContent(data);
      res.json(content);
    } catch {
      res.status(400).json({ error: "Invalid content data" });
    }
  });

  app.patch("/api/admin/contents/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertContentSchema.partial();
      const data = partialSchema.parse(req.body);
      const content = await storage.updateContent(req.params.id, data);
      if (!content) {
        res.status(404).json({ error: "Content not found" });
        return;
      }
      res.json(content);
    } catch {
      res.status(400).json({ error: "Invalid content data" });
    }
  });

  app.delete("/api/admin/contents/:id", requireAdmin, async (req: Request, res: Response) => {
    const deleted = await storage.deleteContent(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Content not found" });
      return;
    }
    res.json({ success: true });
  });

  app.get("/api/admin/settings", requireAdmin, async (_req: Request, res: Response) => {
    const settings = await storage.getAllSettings();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value || "";
    });
    res.json(settingsMap);
  });

  app.post("/api/admin/settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = settingSchema.parse(req.body);
      const setting = await storage.upsertSetting(data.key, data.value || "");
      res.json(setting);
    } catch {
      res.status(400).json({ error: "Key required" });
    }
  });

  app.post("/api/admin/settings/bulk", requireAdmin, async (req: Request, res: Response) => {
    try {
      const settingsSchema = z.record(z.string(), z.string());
      const settings = settingsSchema.parse(req.body);
      const results: unknown[] = [];
      for (const [key, value] of Object.entries(settings)) {
        const setting = await storage.upsertSetting(key, value || "");
        results.push(setting);
      }
      res.json(results);
    } catch {
      res.status(400).json({ error: "Invalid settings data" });
    }
  });

  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
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
