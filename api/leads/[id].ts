import type { VercelRequest, VercelResponse } from "@vercel/node";
import { leads } from "../_data";
import { LeadStatus } from "../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string };
  const index = leads.findIndex(l => l.id === id);

  // ── GET /api/leads/:id ──────────────────────────────────────────────────────
  if (req.method === "GET") {
    if (index === -1) return res.status(404).json({ error: "Lead not found" });
    return res.json(leads[index]);
  }

  // ── PUT /api/leads/:id ──────────────────────────────────────────────────────
  if (req.method === "PUT") {
    const { name, mobile, email, status, assignedEmployee } = req.body;
    if (!name || !mobile || !email || !status || !assignedEmployee) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (index === -1) return res.status(404).json({ error: "Lead not found" });

    leads[index] = { ...leads[index], name, mobile, email, status: status as LeadStatus, assignedEmployee };
    return res.json(leads[index]);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
