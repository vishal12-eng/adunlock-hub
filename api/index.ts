import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "../server/db";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";
import { isPrivateRoute } from "../server/seo";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const PgStore = connectPgSimple(session);

app.set("trust proxy", 1);

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
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

(async () => {
  await storage.seedDefaultAdmin();
  await registerRoutes(app);
})();

const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath, {
  maxAge: "1d",
  etag: true,
}));

app.use((req, res, next) => {
  if (req.method === "GET" && isPrivateRoute(req.path)) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, nofollow">
  <title>404 Not Found</title>
</head>
<body>
  <h1>404 Not Found</h1>
  <p>The requested URL was not found on this server.</p>
</body>
</html>`);
    return;
  }
  next();
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

export default app;
