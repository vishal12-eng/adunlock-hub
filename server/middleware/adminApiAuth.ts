import type { Request, Response, NextFunction } from "express";

/**
 * Middleware for API token-based authentication.
 * This is separate from session-based admin auth and used for external automation (n8n).
 * 
 * Expects: Authorization: Bearer <ADMIN_API_TOKEN>
 */
export function requireApiToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    res.status(401).json({ 
      error: "unauthorized", 
      message: "Authorization header required" 
    });
    return;
  }

  const [scheme, token] = authHeader.split(" ");
  
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    res.status(401).json({ 
      error: "unauthorized", 
      message: "Invalid authorization format. Use: Bearer <token>" 
    });
    return;
  }

  const validToken = process.env.ADMIN_API_TOKEN;
  
  if (!validToken) {
    console.error("[API AUTH] ADMIN_API_TOKEN environment variable is not set");
    res.status(500).json({ 
      error: "server_error", 
      message: "API authentication not configured" 
    });
    return;
  }

  if (token !== validToken) {
    res.status(403).json({ 
      error: "forbidden", 
      message: "Invalid API token" 
    });
    return;
  }

  next();
}
