import type { VercelRequest, VercelResponse } from "@vercel/node";
import { leads } from "../../../_data";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { id, noteId } = req.query as { id: string; noteId: string };

  const leadIndex = leads.findIndex(l => l.id === id);
  if (leadIndex === -1) return res.status(404).json({ error: "Lead not found" });

  const noteIndex = leads[leadIndex].notes.findIndex(n => n.id === noteId);
  if (noteIndex === -1) return res.status(404).json({ error: "Note not found" });

  // ── PUT /api/leads/:id/notes/:noteId ────────────────────────────────────────
  if (req.method === "PUT") {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    leads[leadIndex].notes[noteIndex].content    = content;
    leads[leadIndex].notes[noteIndex].createdDate = new Date().toISOString();
    return res.json(leads[leadIndex]);
  }

  // ── DELETE /api/leads/:id/notes/:noteId ─────────────────────────────────────
  if (req.method === "DELETE") {
    leads[leadIndex].notes.splice(noteIndex, 1);
    return res.json(leads[leadIndex]);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
