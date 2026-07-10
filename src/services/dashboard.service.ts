// ─── Dashboard Service ────────────────────────────────────────────────────────

import { leadRepository }     from "../repositories/lead.repository.js";
import { dashboardRepository }  from "../repositories/dashboard.repository.js";
import type {
  DashboardStats,
  DashboardData,
  PriorityBucket,
  UpcomingFollowUp,
} from "../types.js";
import { formatLeadSource } from "../lib/stageConfig.js";

function mapPriorityToBuckets(
  groups: { priority: string; _count: { id: number } }[],
): PriorityBucket[] {
  const counts = { Hot: 0, Warm: 0, Cold: 0 };

  for (const g of groups) {
    switch (g.priority) {
      case "Urgent":
      case "High":
        counts.Hot += g._count.id;
        break;
      case "Medium":
        counts.Warm += g._count.id;
        break;
      case "Low":
        counts.Cold += g._count.id;
        break;
    }
  }

  return [
    { label: "Hot",  count: counts.Hot },
    { label: "Warm", count: counts.Warm },
    { label: "Cold", count: counts.Cold },
  ];
}

function daysRemaining(followUpDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(followUpDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export const dashboardService = {

  async getStats(): Promise<DashboardStats> {
    const [statusGroups, newToday, newThisWeek, pendingFollowUps] = await Promise.all([
      leadRepository.countByStatus(),
      leadRepository.countCreatedToday(),
      leadRepository.countCreatedThisWeek(),
      leadRepository.countPendingFollowUps(),
    ]);

    const byStatus: DashboardStats["byStatus"] = {
      New: 0, Contacted: 0, Qualified: 0, Proposal: 0, Won: 0, Lost: 0,
    };

    let totalLeads = 0;
    let converted  = 0;

    for (const group of statusGroups) {
      const count = group._count.id;
      byStatus[group.status as keyof typeof byStatus] = count;
      totalLeads += count;
      if (group.status === "Won") converted = count;
    }

    return { totalLeads, newToday, newThisWeek, converted, pendingFollowUps, byStatus };
  },

  async getDashboard(): Promise<DashboardData> {
    const [
      statusGroups,
      newToday,
      newThisWeek,
      pendingFollowUps,
      overdueFollowUps,
      dueTodayFollowUps,
      stageGroups,
      sourceGroups,
      priorityGroups,
      employeeGroups,
      weeklyBuckets,
      recentActivities,
      upcomingRaw,
    ] = await Promise.all([
      leadRepository.countByStatus(),
      leadRepository.countCreatedToday(),
      leadRepository.countCreatedThisWeek(),
      leadRepository.countPendingFollowUps(),
      leadRepository.countOverdueFollowUps(),
      leadRepository.countDueTodayFollowUps(),
      dashboardRepository.countByStage(),
      dashboardRepository.countByLeadSource(),
      dashboardRepository.countByPriority(),
      dashboardRepository.countByEmployee(),
      dashboardRepository.getWeeklyLeadCounts(8),
      dashboardRepository.findRecentActivities(10),
      dashboardRepository.getUpcomingFollowUps(10),
    ]);

    let totalLeads    = 0;
    let convertedLeads = 0;
    let lostLeads     = 0;

    for (const group of statusGroups) {
      totalLeads += group._count.id;
      if (group.status === "Won")  convertedLeads = group._count.id;
      if (group.status === "Lost") lostLeads      = group._count.id;
    }

    const employeeIds = employeeGroups
      .map((g) => g.assignedEmployeeId)
      .filter((id): id is string => id !== null);

    const employeeNames = await dashboardRepository.getEmployeeNames(employeeIds);
    const nameMap = new Map(employeeNames.map((e) => [e.id, e.name]));

    const employees = employeeGroups.map((g) => ({
      employeeId:   g.assignedEmployeeId,
      employeeName: g.assignedEmployeeId
        ? (nameMap.get(g.assignedEmployeeId) ?? "Unknown")
        : "Unassigned",
      count: g._count.id,
    }));

    const upcomingFollowUps: UpcomingFollowUp[] = upcomingRaw
      .filter((l) => l.nextFollowUpDate !== null)
      .map((l) => {
        const days = daysRemaining(l.nextFollowUpDate!);
        return {
          leadId:           l.id,
          leadName:         l.fullName,
          assignedEmployee: l.assignedEmployee?.name ?? "Unassigned",
          nextFollowUpDate: l.nextFollowUpDate!.toISOString(),
          priority:         l.priority,
          daysRemaining:    days,
          isOverdue:        days < 0,
        };
      });

    return {
      metrics: {
        totalLeads,
        newToday,
        newThisWeek,
        convertedLeads,
        lostLeads,
        pendingFollowUps,
        overdueFollowUps,
        dueTodayFollowUps,
      },
      pipeline: stageGroups.map((g) => ({
        stage: g.stage,
        count: g._count.id,
      })),
      leadSources: sourceGroups.map((g) => ({
        source: formatLeadSource(g.leadSource),
        count:  g._count.id,
      })),
      priority: mapPriorityToBuckets(priorityGroups),
      employees,
      weeklyLeads: weeklyBuckets.map((b) => ({
        week:  b.label,
        count: b.count,
      })),
      recentActivity: recentActivities.map((a) => ({
        id:           a.id,
        leadId:       a.leadId,
        activityType: a.activityType,
        description:  a.description,
        performedBy:  a.performedBy,
        createdAt:    a.createdAt.toISOString(),
      })),
      upcomingFollowUps,
    };
  },
};
