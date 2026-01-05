import { Router, Request, Response } from "express";
import { storage } from "../storage.js";
import { insertContentSchema } from "../../shared/schema.js";
import { z } from "zod";

const router = Router();

/**
 * CREATE CONTENT (n8n)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const data = insertContentSchema.parse(req.body);
    const content = await storage.createContent(data);
    res.status(201).json({ success: true, content });
  } catch (err) {
    console.error("[API] CREATE CONTENT ERROR:", err);
    res.status(400).json({ error: "Invalid content data" });
  }
});

/**
 * GET ALL CONTENT
 */
router.get("/", async (_req: Request, res: Response) => {
  const contents = await storage.getAllContents();
  res.json(contents);
});

/**
 * UPDATE CONTENT
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const partialSchema = insertContentSchema.partial();
    const data = partialSchema.parse(req.body);

    const content = await storage.updateContent(req.params.id, data);
    if (!content) {
      res.status(404).json({ error: "Content not found" });
      return;
    }

    res.json({ success: true, content });
  } catch {
    res.status(400).json({ error: "Invalid update data" });
  }
});

/**
 * DELETE CONTENT
 */
router.delete("/:id", async (req: Request, res: Response) => {
  const deleted = await storage.deleteContent(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Content not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
