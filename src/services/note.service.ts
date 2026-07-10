// ─── Note Service ─────────────────────────────────────────────────────────────

import { noteRepository }     from "../repositories/note.repository.js";
import { leadRepository }     from "../repositories/lead.repository.js";
import { activityRepository } from "../repositories/activity.repository.js";
import type { CreateNoteInput, UpdateNoteInput } from "../lib/validations.js";
import type { Note } from "../types.js";

function serializeNote(n: {
  id: string; leadId: string; content: string;
  createdBy: string; createdAt: Date; updatedAt: Date;
}): Note {
  return {
    id:          n.id,
    leadId:      n.leadId,
    content:     n.content,
    createdBy:   n.createdBy,
    createdAt:   n.createdAt.toISOString(),
    updatedAt:   n.updatedAt.toISOString(),
    createdDate: n.createdAt.toISOString(), // legacy alias
  };
}

export const noteService = {

  async addNote(leadId: string, data: CreateNoteInput): Promise<Note> {
    const exists = await leadRepository.exists(leadId);
    if (!exists) throw new Error("Lead not found");

    const note = await noteRepository.create(leadId, data);

    await activityRepository.create({
      leadId,
      activityType: "note_added",
      description:  `Note added by ${data.createdBy}.`,
      performedBy:  data.createdBy,
    });

    return serializeNote(note);
  },

  async updateNote(noteId: string, leadId: string, data: UpdateNoteInput): Promise<Note> {
    const belongs = await noteRepository.belongsToLead(noteId, leadId);
    if (!belongs) throw new Error("Note not found");

    const note = await noteRepository.update(noteId, data);

    await activityRepository.create({
      leadId,
      activityType: "note_updated",
      description:  "A note was edited.",
      performedBy:  "System",
    });

    return serializeNote(note);
  },

  async deleteNote(noteId: string, leadId: string): Promise<void> {
    const belongs = await noteRepository.belongsToLead(noteId, leadId);
    if (!belongs) throw new Error("Note not found");

    await noteRepository.delete(noteId);

    await activityRepository.create({
      leadId,
      activityType: "note_deleted",
      description:  "A note was deleted.",
      performedBy:  "System",
    });
  },
};
