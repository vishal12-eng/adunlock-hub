import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { registerRoutes } from "./routes";
import { storage } from "./storage";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { isPrivateRoute } from "./seo";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  const isPrivate = isPrivateRoute(req.path);
  
  if (isPrivate) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
  }
  
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    if (isPrivate) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
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
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

async function startServer() {
  await storage.seedDefaultAdmin();
  await registerRoutes(app);

  app.use((req, res, next) => {
    if (req.method === "GET" && isPrivateRoute(req.path)) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    }
    next();
  });

  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "../dist");
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
