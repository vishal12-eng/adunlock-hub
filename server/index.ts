import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";
import { registerRoutes } from "./routes.js";
import { storage } from "./storage.js";
import path from "path";
import { fileURLToPath } from "url";
import { isPrivateRoute } from "./seo.js";
registerRoutes(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);
const isProduction = process.env.NODE_ENV === "production";

// CRITICAL: Trust Render's reverse proxy for secure cookies
app.set("trust proxy", 1);

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
  
  next();
});

app.use(express.json());

const PgStore = connectPgSimple(session);

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

// Session configuration optimized for Render (same-origin deployment)
// Frontend and backend are served from the SAME domain, so sameSite: "lax" works
app.use(
  session({
    name: "adnexus.sid",
    store: new PgStore({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    },
  })
);

async function startServer() {
  try {
    console.log(`Starting server in ${isProduction ? "production" : "development"} mode...`);
    console.log(`PORT: ${PORT}`);
    console.log(`DATABASE_URL configured: ${!!process.env.DATABASE_URL}`);
    console.log(`SESSION_SECRET configured: ${!!process.env.SESSION_SECRET}`);
    
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
