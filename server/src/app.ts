import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";
import { publicRoutes } from "./routes/public.js";
import { adminRoutes } from "./routes/admin.js";
import { contactRoutes } from "./routes/contact.js";
import { telegramRoutes } from "./routes/telegram.js";
import { botAdminRoutes } from "./routes/bot-admin.js";

function allowedOrigins(): string[] {
  const fromEnv = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const site = process.env.WEBSITE_BASE_URL?.trim();
  const webapp = process.env.WEBAPP_URL?.trim();
  return [
    ...fromEnv,
    ...(site ? [site] : []),
    ...(webapp ? [webapp] : []),
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
  ];
}

function shouldServeWeb() {
  return (
    process.env.SERVE_WEB === "1" ||
    process.env.SERVE_WEB === "true" ||
    process.env.NODE_ENV === "production"
  );
}

export function createApp() {
  const app = new Hono();
  const origins = allowedOrigins();

  app.use("*", logger());
  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return origins[0] ?? "*";
        return origins.includes(origin) ? origin : origins[0] ?? "";
      },
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true, service: "senay-api" }));
  app.use("/uploads/*", serveStatic({ root: "./public" }));

  // Client-agnostic public API (website + Telegram)
  app.route("/api", publicRoutes);

  // Contact form + admin inbox (paths match live admin bundle)
  app.route("/api/contact", contactRoutes);

  // Telegram bot specific API (WebApp auth, menus, messages)
  app.route("/api/telegram", telegramRoutes);

  // Admin CMS API
  app.route("/api/admin", adminRoutes);
  app.route("/api/admin/bot", botAdminRoutes);

  // Production: serve Vite build (site + /st-hq admin assets) from ./public/site
  if (shouldServeWeb()) {
    const siteRoot = "./public/site";
    app.use("/*", serveStatic({ root: siteRoot }));

    app.get("*", (c) => {
      const url = new URL(c.req.url);
      if (url.pathname.startsWith("/api") || url.pathname.startsWith("/uploads")) {
        return c.notFound();
      }

      const stHqLogin = path.join(siteRoot, "st-hq", "login.html");
      if (
        (url.pathname === "/st-hq/login" || url.pathname === "/st-hq/login/") &&
        existsSync(stHqLogin)
      ) {
        return c.html(readFileSync(stHqLogin, "utf-8"));
      }

      const stHqIndex = path.join(siteRoot, "st-hq", "index.html");
      if (url.pathname === "/st-hq" || url.pathname.startsWith("/st-hq/")) {
        if (existsSync(stHqIndex)) return c.html(readFileSync(stHqIndex, "utf-8"));
      }

      const indexHtml = path.join(siteRoot, "index.html");
      if (existsSync(indexHtml)) return c.html(readFileSync(indexHtml, "utf-8"));
      return c.notFound();
    });
  }

  return app;
}
