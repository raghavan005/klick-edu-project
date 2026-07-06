import type { VercelRequest, VercelResponse } from "@vercel/node";
import { leads, type LeadStatus } from "../_data";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string };
  const index = leads.findIndex(l => l.id === id);

  if (req.method === "GET") {
    if (index === -1) return res.status(404).json({ error: "Lead not found" });
    return res.json(leads[index]);
  }

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
