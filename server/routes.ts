import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage.js";
import { insertContentSchema, insertUserSessionSchema, insertSmartlinkSchema, type Smartlink } from "../shared/schema.js";
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

const adStartSchema = z.object({
  session_id: z.string().min(1),
  content_id: z.string().uuid(),
  user_session_id: z.string().uuid(),
});

const adCompleteSchema = z.object({
  token: z.string().min(1),
});

const MIN_AD_TIME_SECONDS = 12;
const AD_COOLDOWN_SECONDS = 15;
const TOKEN_EXPIRY_SECONDS = 300;

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string().optional(),
});

function selectWeightedSmartlink(links: Smartlink[], excludeIds: string[]): Smartlink | null {
  const available = links.filter(l => !excludeIds.includes(l.id));
  if (available.length === 0) {
    if (links.length === 0) return null;
    return links[Math.floor(Math.random() * links.length)];
  }

  const totalWeight = available.reduce((sum, l) => sum + l.weight, 0);
  let random = Math.random() * totalWeight;

  for (const link of available) {
    random -= link.weight;
    if (random <= 0) {
      return link;
    }
  }

  return available[available.length - 1];
}

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
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

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

  app.get("/api/smartlink", async (_req: Request, res: Response) => {
    try {
      const activeLinks = await storage.getActiveSmartlinks();
      
      if (activeLinks.length > 0) {
        const selected = selectWeightedSmartlink(activeLinks, []);
        if (selected) {
          res.json({ url: selected.url, id: selected.id });
          return;
        }
      }

      const fallbackSetting = await storage.getSetting("adsterra_smartlink");
      if (fallbackSetting?.value) {
        res.json({ url: fallbackSetting.value, id: null });
        return;
      }

      res.json({ url: null, id: null });
    } catch (error) {
      console.error("[SMARTLINK] Error:", error);
      res.status(500).json({ error: "Failed to get smartlink" });
    }
  });

  app.post("/api/ad/start", async (req: Request, res: Response) => {
    try {
      const data = adStartSchema.parse(req.body);
      
      const lastCompleted = await storage.getLastCompletedAdAttempt(data.session_id, data.content_id);
      if (lastCompleted && lastCompleted.completed_at) {
        const timeSinceCompletion = (Date.now() - new Date(lastCompleted.completed_at).getTime()) / 1000;
        if (timeSinceCompletion < AD_COOLDOWN_SECONDS) {
          const waitTime = Math.ceil(AD_COOLDOWN_SECONDS - timeSinceCompletion);
          res.status(429).json({ 
            error: "cooldown", 
            message: `Please wait ${waitTime} seconds before watching another ad`,
            wait_seconds: waitTime
          });
          return;
        }
      }

      const activeLinks = await storage.getActiveSmartlinks();
      let selectedLink: Smartlink | null = null;
      let smartlinkUrl: string | null = null;

      if (activeLinks.length > 0) {
        const recentIds = await storage.getRecentSmartlinkIds(data.session_id, data.content_id, 3);
        selectedLink = selectWeightedSmartlink(activeLinks, recentIds);
        if (selectedLink) {
          smartlinkUrl = selectedLink.url;
        }
      }

      if (!smartlinkUrl) {
        const fallbackSetting = await storage.getSetting("adsterra_smartlink");
        if (fallbackSetting?.value) {
          smartlinkUrl = fallbackSetting.value;
        }
      }

      if (!smartlinkUrl) {
        res.status(400).json({ error: "no_smartlink", message: "No ad service configured" });
        return;
      }

      const attempt = await storage.createAdAttempt(
        data.session_id, 
        data.content_id, 
        data.user_session_id,
        selectedLink?.id
      );
      
      res.json({ 
        token: attempt.token,
        started_at: attempt.started_at,
        min_time_seconds: MIN_AD_TIME_SECONDS,
        smartlink_url: smartlinkUrl,
        smartlink_id: selectedLink?.id || null
      });
    } catch (error) {
      console.error("[AD] Start error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/ad/complete", async (req: Request, res: Response) => {
    try {
      const data = adCompleteSchema.parse(req.body);
      
      const attempt = await storage.getAdAttemptByToken(data.token);
      
      if (!attempt) {
        res.status(404).json({ error: "invalid_token", message: "Invalid or expired ad token" });
        return;
      }

      if (attempt.used) {
        res.status(400).json({ error: "token_used", message: "This ad has already been counted" });
        return;
      }

      const tokenAge = (Date.now() - new Date(attempt.started_at).getTime()) / 1000;
      if (tokenAge > TOKEN_EXPIRY_SECONDS) {
        res.status(400).json({ error: "token_expired", message: "Ad token has expired. Please start a new ad." });
        return;
      }

      const timeElapsed = (Date.now() - new Date(attempt.started_at).getTime()) / 1000;
      if (timeElapsed < MIN_AD_TIME_SECONDS) {
        const remainingTime = Math.ceil(MIN_AD_TIME_SECONDS - timeElapsed);
        res.status(400).json({ 
          error: "too_fast", 
          message: `Please watch the ad for ${remainingTime} more seconds`,
          remaining_seconds: remainingTime
        });
        return;
      }

      await storage.markAdAttemptUsed(data.token);

      const session = await storage.getSession(attempt.session_id, attempt.content_id);
      if (!session) {
        res.status(404).json({ error: "session_not_found", message: "Session not found" });
        return;
      }

      const newAdsWatched = session.ads_watched + 1;
      const isCompleted = newAdsWatched >= session.ads_required;

      const updatedSession = await storage.updateSession(session.id, {
        ads_watched: newAdsWatched,
        completed: isCompleted,
      });

      if (isCompleted) {
        await storage.incrementContentUnlocks(attempt.content_id);
      }

      res.json({ 
        success: true, 
        session: updatedSession,
        completed: isCompleted
      });
    } catch (error) {
      console.error("[AD] Complete error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
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
      if (!req.session) {
        console.log("[AUTH] /me called without session object");
        res.status(401).json({ error: "No session" });
        return;
      }

      if (!req.session.user) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      const role = await storage.getAdminRole(req.session.user.id);
      if (role && role.role === "admin") {
        res.json({ loggedIn: true, user: req.session.user });
      } else {
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

  app.get("/api/admin/smartlinks", requireAdmin, async (_req: Request, res: Response) => {
    const links = await storage.getAllSmartlinks();
    res.json(links);
  });

  app.post("/api/admin/smartlinks", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertSmartlinkSchema.parse(req.body);
      const link = await storage.createSmartlink(data);
      res.json(link);
    } catch (error) {
      console.error("[SMARTLINK] Create error:", error);
      res.status(400).json({ error: "Invalid smartlink data" });
    }
  });

  app.patch("/api/admin/smartlinks/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const partialSchema = insertSmartlinkSchema.partial();
      const data = partialSchema.parse(req.body);
      const link = await storage.updateSmartlink(req.params.id, data);
      if (!link) {
        res.status(404).json({ error: "Smartlink not found" });
        return;
      }
      res.json(link);
    } catch {
      res.status(400).json({ error: "Invalid smartlink data" });
    }
  });

  app.delete("/api/admin/smartlinks/:id", requireAdmin, async (req: Request, res: Response) => {
    const deleted = await storage.deleteSmartlink(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Smartlink not found" });
      return;
    }
    res.json({ success: true });
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
