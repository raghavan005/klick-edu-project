import type { VercelRequest, VercelResponse } from "@vercel/node";
import { dashboardService } from "../src/services/dashboard.service.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = await dashboardService.getDashboard();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
