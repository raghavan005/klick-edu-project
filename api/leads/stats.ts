import type { VercelRequest, VercelResponse } from "@vercel/node";
import { leads } from "../_data";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  res.json({
    total:     leads.length,
    New:       leads.filter(l => l.status === "New").length,
    Contacted: leads.filter(l => l.status === "Contacted").length,
    Qualified: leads.filter(l => l.status === "Qualified").length,
    Proposal:  leads.filter(l => l.status === "Proposal").length,
    Won:       leads.filter(l => l.status === "Won").length,
    Lost:      leads.filter(l => l.status === "Lost").length,
  });
}
