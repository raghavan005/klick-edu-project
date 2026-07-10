// ─── Activity Repository ──────────────────────────────────────────────────────

import { prisma } from "../lib/prisma.js";

export const activityRepository = {

  async create(data: {
    leadId:       string;
    activityType: string;
    description:  string;
    performedBy:  string;
  }) {
    return prisma.leadActivity.create({ data });
  },

  async findByLeadId(leadId: string, limit = 50) {
    return prisma.leadActivity.findMany({
      where:   { leadId },
      orderBy: { createdAt: "desc" },
      take:    limit,
    });
  },

  async findRecent(limit = 20) {
    return prisma.leadActivity.findMany({
      orderBy: { createdAt: "desc" },
      take:    limit,
      include: { lead: { select: { fullName: true } } },
    });
  },
};
