// ─── Vercel Serverless Handler ────────────────────────────────────────────────
// All /api/* requests are routed here by vercel.json.
// We reuse the same Express app as the dev server — no logic duplication.
// ──────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createApp } from "../src/app.js";

// Create the app once and reuse across invocations (warm start)
const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Delegate to Express — it handles routing internally
  return app(req as any, res as any);
}
