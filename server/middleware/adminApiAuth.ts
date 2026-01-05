import { Request, Response, NextFunction } from "express";

export function adminApiAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token || token !== process.env.ADMIN_API_TOKEN) {
        return res.status(401).json({ error: "Unauthorized" });
          }

            next();
            }