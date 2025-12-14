import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";
import { registerRoutes } from "./routes.js";
import { storage } from "./storage.js";
import path from "path";
import { fileURLToPath } from "url";
import { isPrivateRoute } from "./seo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);
const isProduction = process.env.NODE_ENV === "production";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://adnexus.app";

// CORS middleware for cross-origin requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [FRONTEND_URL, "https://adnexus.app", "http://localhost:5000", "http://localhost:3000"];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    // Same-origin requests don't have Origin header
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_URL);
  }
  
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
  res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  const isPrivate = isPrivateRoute(req.path);
  
  if (isPrivate) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
  }
  
  if (isProduction && req.headers["x-forwarded-proto"] !== "https") {
    if (isPrivate) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.redirect(301, `https://${req.headers.host}${req.url}`);
    return;
  }
  
  next();
});

app.use(express.json());

app.set("trust proxy", 1);

const PgStore = connectPgSimple(session);

app.use(
  session({
    name: "adnexus.sid",
    store: new PgStore({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "content-locker-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

async function startServer() {
  try {
    console.log(`Starting server in ${isProduction ? "production" : "development"} mode...`);
    console.log(`PORT: ${PORT}`);
    console.log(`DATABASE_URL configured: ${!!process.env.DATABASE_URL}`);
    
    await storage.seedDefaultAdmin();
    registerRoutes(app);

    app.use((req, res, next) => {
      if (req.method === "GET" && isPrivateRoute(req.path)) {
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
      }
      next();
    });

    if (isProduction) {
      // In production, __dirname is dist/server/server, so we go up 2 levels to reach dist
      const distPath = path.resolve(__dirname, "../../");
      console.log(`Serving static files from: ${distPath}`);
      app.use(express.static(distPath, {
        maxAge: "1d",
        etag: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      }));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      // Dynamic import for Vite - only in development
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${isProduction ? "production" : "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
