// ─── Dev Server ───────────────────────────────────────────────────────────────
// Wraps the shared Express app (src/app.ts) with Vite HMR middleware for local development.
// Production on Vercel uses api/index.ts instead.
// ──────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createApp } from "./src/app.js";

async function startServer() {
  const app  = createApp();
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for HMR during development
    const vite = await createViteServer({
      server:  { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const { default: express } = await import("express");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀  CRM server running at http://localhost:${PORT}`);
    console.log(`   Database: Supabase PostgreSQL (Prisma)\n`);
  });
}

startServer();
