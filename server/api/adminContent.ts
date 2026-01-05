import type { Express, Request, Response } from "express";
import { storage } from "../storage.js";
import { insertContentSchema } from "../../shared/schema.js";
import { requireApiToken } from "../middleware/adminApiAuth.js";
import { z } from "zod";

/**
 * n8n-compatible content upload schema.
 * Maps Google Sheets columns to content fields.
 */
const n8nContentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullish().transform(v => v || null),
  thumbnail_url: z.string().nullish().transform(v => v || null),
  file_url: z.string().nullish().transform(v => v || null),
  redirect_url: z.string().nullish().transform(v => v || null),
  ads_required: z.union([
    z.number().int().min(1),
    z.string().transform(v => parseInt(v, 10) || 3)
  ]).default(3),
  status: z.string().default("active"),
});

/**
 * Check for duplicate content by title to prevent re-uploads.
 */
async function contentExistsByTitle(title: string): Promise<boolean> {
  const existing = await storage.getAllContents();
  return existing.some(c => c.title.toLowerCase().trim() === title.toLowerCase().trim());
}

/**
 * Register API routes for n8n automation.
 * These endpoints use token-based auth, separate from session-based admin panel.
 */
export function registerAdminContentApi(app: Express): void {
  /**
   * GET /api/v1/content
   * List all content (for n8n to check existing uploads)
   */
  app.get("/api/v1/content", requireApiToken, async (_req: Request, res: Response) => {
    try {
      const contents = await storage.getAllContents();
      res.json({
        success: true,
        data: contents,
        count: contents.length
      });
    } catch (error) {
      console.error("[API] GET /api/v1/content error:", error);
      res.status(500).json({ 
        success: false,
        error: "server_error", 
        message: "Failed to fetch content" 
      });
    }
  });

  /**
   * GET /api/v1/content/:id
   * Get single content by ID
   */
  app.get("/api/v1/content/:id", requireApiToken, async (req: Request, res: Response) => {
    try {
      const content = await storage.getContentById(req.params.id);
      if (!content) {
        res.status(404).json({ 
          success: false,
          error: "not_found", 
          message: "Content not found" 
        });
        return;
      }
      res.json({ success: true, data: content });
    } catch (error) {
      console.error("[API] GET /api/v1/content/:id error:", error);
      res.status(500).json({ 
        success: false,
        error: "server_error", 
        message: "Failed to fetch content" 
      });
    }
  });

  /**
   * POST /api/v1/content
   * Create new content (main endpoint for n8n uploads)
   */
  app.post("/api/v1/content", requireApiToken, async (req: Request, res: Response) => {
    try {
      // Parse and validate input
      const parseResult = n8nContentSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        res.status(400).json({ 
          success: false,
          error: "validation_error", 
          message: "Invalid content data",
          details: parseResult.error.errors
        });
        return;
      }

      const data = parseResult.data;

      // Check for duplicates to prevent re-uploads
      const exists = await contentExistsByTitle(data.title);
      if (exists) {
        res.status(409).json({ 
          success: false,
          error: "duplicate", 
          message: `Content with title "${data.title}" already exists`
        });
        return;
      }

      // Map to insertContentSchema format
      const contentData = {
        title: data.title,
        description: data.description,
        thumbnail_url: data.thumbnail_url,
        file_url: data.file_url,
        redirect_url: data.redirect_url,
        required_ads: typeof data.ads_required === 'number' ? data.ads_required : 3,
        status: data.status,
      };

      // Validate with existing schema
      const validated = insertContentSchema.parse(contentData);
      const content = await storage.createContent(validated);

      console.log(`[API] Content created: ${content.id} - ${content.title}`);
      
      res.status(201).json({ 
        success: true,
        data: content,
        message: "Content created successfully"
      });
    } catch (error) {
      console.error("[API] POST /api/v1/content error:", error);
      res.status(500).json({ 
        success: false,
        error: "server_error", 
        message: "Failed to create content" 
      });
    }
  });

  /**
   * PUT /api/v1/content/:id
   * Update existing content
   */
  app.put("/api/v1/content/:id", requireApiToken, async (req: Request, res: Response) => {
    try {
      const parseResult = n8nContentSchema.partial().safeParse(req.body);
      
      if (!parseResult.success) {
        res.status(400).json({ 
          success: false,
          error: "validation_error", 
          message: "Invalid content data",
          details: parseResult.error.errors
        });
        return;
      }

      const data = parseResult.data;
      
      // Build update object
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.thumbnail_url !== undefined) updateData.thumbnail_url = data.thumbnail_url;
      if (data.file_url !== undefined) updateData.file_url = data.file_url;
      if (data.redirect_url !== undefined) updateData.redirect_url = data.redirect_url;
      if (data.ads_required !== undefined) {
        updateData.required_ads = typeof data.ads_required === 'number' ? data.ads_required : 3;
      }
      if (data.status !== undefined) updateData.status = data.status;

      const content = await storage.updateContent(req.params.id, updateData);
      
      if (!content) {
        res.status(404).json({ 
          success: false,
          error: "not_found", 
          message: "Content not found" 
        });
        return;
      }

      console.log(`[API] Content updated: ${content.id}`);
      
      res.json({ 
        success: true,
        data: content,
        message: "Content updated successfully"
      });
    } catch (error) {
      console.error("[API] PUT /api/v1/content/:id error:", error);
      res.status(500).json({ 
        success: false,
        error: "server_error", 
        message: "Failed to update content" 
      });
    }
  });

  /**
   * DELETE /api/v1/content/:id
   * Delete content
   */
  app.delete("/api/v1/content/:id", requireApiToken, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteContent(req.params.id);
      
      if (!deleted) {
        res.status(404).json({ 
          success: false,
          error: "not_found", 
          message: "Content not found" 
        });
        return;
      }

      console.log(`[API] Content deleted: ${req.params.id}`);
      
      res.json({ 
        success: true,
        message: "Content deleted successfully"
      });
    } catch (error) {
      console.error("[API] DELETE /api/v1/content/:id error:", error);
      res.status(500).json({ 
        success: false,
        error: "server_error", 
        message: "Failed to delete content" 
      });
    }
  });

  /**
   * POST /api/v1/content/check-duplicate
   * Check if content with given title exists (for n8n pre-check)
   */
  app.post("/api/v1/content/check-duplicate", requireApiToken, async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      
      if (!title || typeof title !== 'string') {
        res.status(400).json({ 
          success: false,
          error: "validation_error", 
          message: "Title is required" 
        });
        return;
      }

      const exists = await contentExistsByTitle(title);
      
      res.json({ 
        success: true,
        exists,
        message: exists ? "Content already exists" : "Content does not exist"
      });
    } catch (error) {
      console.error("[API] POST /api/v1/content/check-duplicate error:", error);
      res.status(500).json({ 
        success: false,
        error: "server_error", 
        message: "Failed to check duplicate" 
      });
    }
  });

  console.log("[API] Admin Content API routes registered at /api/v1/content");
}
