import { Router, Request, Response } from "express";
import { db } from "../db";

const router = Router();

/**
 * CREATE CONTENT
 * POST /api/admin/content
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      thumbnail_url,
      file_url,
      redirect_url,
      ads_required,
      status,
    } = req.body;

    if (!title || !thumbnail_url || !file_url) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await db.query(
      `
      INSERT INTO contents
      (title, description, thumbnail_url, file_url, redirect_url, ads_required, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        title,
        description || "",
        thumbnail_url,
        file_url,
        redirect_url || null,
        ads_required || 0,
        status || "active",
      ]
    );

    return res.status(201).json({
      success: true,
      content_id: result.insertId,
    });
  } catch (err) {
    console.error("CREATE CONTENT ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET ALL CONTENT (ADMIN)
 * GET /api/admin/content
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const rows = await db.query(`SELECT * FROM contents ORDER BY id DESC`);
    return res.json(rows);
  } catch (err) {
    console.error("GET CONTENT ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * UPDATE CONTENT
 * PUT /api/admin/content/:id
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    const keys = Object.keys(fields);
    if (keys.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updates = keys.map((k) => `${k} = ?`).join(", ");
    const values = keys.map((k) => fields[k]);

    await db.query(
      `UPDATE contents SET ${updates} WHERE id = ?`,
      [...values, id]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("UPDATE CONTENT ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE CONTENT
 * DELETE /api/admin/content/:id
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM contents WHERE id = ?`, [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE CONTENT ERROR:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
