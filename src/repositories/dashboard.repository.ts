// ─── Dashboard Repository ─────────────────────────────────────────────────────
// Read-only aggregation queries for the CRM dashboard.

import { prisma } from "../lib/prisma.js";

export const dashboardRepository = {

  async countByStage() {
    return prisma.lead.groupBy({
      by:    ["stage"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
  },

  async countByLeadSource() {
    return prisma.lead.groupBy({
      by:    ["leadSource"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
  },

  async countByPriority() {
    return prisma.lead.groupBy({
      by:    ["priority"],
      _count: { id: true },
    });
  },

  async countByEmployee() {
    return prisma.lead.groupBy({
      by:    ["assignedEmployeeId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });
  },

  /** Leads created in the last 8 calendar weeks (Mon–Sun buckets). */
  async getWeeklyLeadCounts(weeks = 8) {
    const now = new Date();
    const day = now.getDay();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    startOfThisWeek.setHours(0, 0, 0, 0);

    const start = new Date(startOfThisWeek);
    start.setDate(start.getDate() - (weeks - 1) * 7);

    const leads = await prisma.lead.findMany({
      where:   { createdAt: { gte: start } },
      select:  { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const buckets: { weekStart: string; label: string; count: number }[] = [];
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const label = weekStart.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      buckets.push({ weekStart: weekStart.toISOString(), label, count: 0 });
    }

    for (const lead of leads) {
      const created = lead.createdAt.getTime();
      for (let i = weeks - 1; i >= 0; i--) {
        const weekStart = new Date(start);
        weekStart.setDate(start.getDate() + i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        if (created >= weekStart.getTime() && created < weekEnd.getTime()) {
          buckets[i].count++;
          break;
        }
      }
    }

    return buckets;
  },

  async getUpcomingFollowUps(limit = 10) {
    return prisma.lead.findMany({
      where: {
        nextFollowUpDate: { not: null },
        status:           { notIn: ["Won", "Lost"] },
      },
      select: {
        id:               true,
        fullName:         true,
        priority:         true,
        nextFollowUpDate: true,
        assignedEmployee: { select: { name: true } },
      },
      orderBy: { nextFollowUpDate: "asc" },
      take:    limit,
    });
  },

  async findRecentActivities(limit = 10) {
    return prisma.leadActivity.findMany({
      orderBy: { createdAt: "desc" },
      take:    limit,
    });
  },

  async getEmployeeNames(ids: string[]) {
    if (ids.length === 0) return [];
    return prisma.employee.findMany({
      where:  { id: { in: ids } },
      select: { id: true, name: true },
    });
  },
};
