// ─── Note Repository ──────────────────────────────────────────────────────────

import { prisma } from "../lib/prisma.js";
import type { CreateNoteInput, UpdateNoteInput } from "../lib/validations.js";

export const noteRepository = {

  async findByLeadId(leadId: string) {
    return prisma.leadNote.findMany({
      where:   { leadId },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.leadNote.findUnique({ where: { id } });
  },

  async create(leadId: string, data: CreateNoteInput) {
    return prisma.leadNote.create({
      data: { leadId, content: data.content, createdBy: data.createdBy },
    });
  },

  async update(id: string, data: UpdateNoteInput) {
    return prisma.leadNote.update({
      where: { id },
      data:  { content: data.content },
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.leadNote.delete({ where: { id } });
  },

  async belongsToLead(noteId: string, leadId: string): Promise<boolean> {
    const n = await prisma.leadNote.findFirst({
      where:  { id: noteId, leadId },
      select: { id: true },
    });
    return n !== null;
  },
};
