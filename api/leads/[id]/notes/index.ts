import type { VercelRequest, VercelResponse } from "@vercel/node";
import { leads } from "../../../_data";
import { Note } from "../../../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query as { id: string };
  const { content, createdBy } = req.body;

  if (!content || !createdBy) {
    return res.status(400).json({ error: "Content and Created By are required" });
  }

  const index = leads.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: "Lead not found" });

  const newNote: Note = {
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    content,
    createdDate: new Date().toISOString(),
    createdBy,
  };

  leads[index].notes.push(newNote);
  res.status(201).json(leads[index]);
}
