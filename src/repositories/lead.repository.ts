// ─── Lead Repository ──────────────────────────────────────────────────────────

import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { LeadsQueryInput, CreateLeadInput, UpdateLeadInput } from "../lib/validations.js";

const leadInclude = {
  assignedEmployee: true,
  notes: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.LeadInclude;

export type LeadWithRelations = Prisma.LeadGetPayload<{
  include: {
    assignedEmployee: true;
    notes: true;
  };
}>;

// ─── Query Builders (each concern isolated) ───────────────────────────────────

function buildSearchClause(search?: string): Prisma.LeadWhereInput {
  if (!search?.trim()) return {};
  const term = search.trim();
  return {
    OR: [
      { fullName: { contains: term, mode: "insensitive" } },
      { email:    { contains: term, mode: "insensitive" } },
      { phone:    { contains: term } },
      { city:     { contains: term, mode: "insensitive" } },
    ],
  };
}

function buildFilterClauses(query: LeadsQueryInput): Prisma.LeadWhereInput {
  const clauses: Prisma.LeadWhereInput[] = [];

  if (query.status && query.status !== "All")
    clauses.push({ status: query.status as Prisma.EnumLeadStatusFilter });

  if (query.stage && query.stage !== "All")
    clauses.push({ stage: query.stage });

  if (query.subStage && query.subStage !== "All")
    clauses.push({ subStage: query.subStage });

  if (query.leadSource && query.leadSource !== "All")
    clauses.push({ leadSource: query.leadSource as Prisma.EnumLeadSourceFilter });

  if (query.priority && query.priority !== "All")
    clauses.push({ priority: query.priority as Prisma.EnumPriorityFilter });

  if (query.studyPreference && query.studyPreference !== "All")
    clauses.push({ studyPreference: query.studyPreference as Prisma.EnumStudyPreferenceFilter });

  if (query.country)
    clauses.push({ country: { contains: query.country, mode: "insensitive" } });

  if (query.assignedEmployeeId && query.assignedEmployeeId !== "All")
    clauses.push({ assignedEmployeeId: query.assignedEmployeeId });

  return clauses.length > 0 ? { AND: clauses } : {};
}

function buildDateClause(startDate?: string, endDate?: string): Prisma.LeadWhereInput {
  if (!startDate && !endDate) return {};
  const createdAt: Prisma.DateTimeFilter = {};
  if (startDate) createdAt.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    createdAt.lte = end;
  }
  return { createdAt };
}

function buildFollowUpClause(followUpStatus?: string): Prisma.LeadWhereInput {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  switch (followUpStatus) {
    case "overdue":
      return {
        nextFollowUpDate: { lt: todayStart },
        status:           { notIn: ["Won", "Lost"] },
      };
    case "due_today":
      return {
        nextFollowUpDate: { gte: todayStart, lte: todayEnd },
        status:           { notIn: ["Won", "Lost"] },
      };
    case "upcoming":
      return {
        nextFollowUpDate: { gt: todayEnd },
        status:           { notIn: ["Won", "Lost"] },
      };
    case "no_followup":
      return { nextFollowUpDate: null };
    default:
      return {};
  }
}

function buildOrderBy(sortBy?: string, sortOrder?: string): Prisma.LeadOrderByWithRelationInput[] {
  const dir = (sortOrder === "asc" ? "asc" : "desc") as Prisma.SortOrder;

  switch (sortBy) {
    case "fullName":         return [{ fullName:         dir }, { id: "desc" }];
    case "priority":         return [{ priority:         dir }, { createdAt: "desc" }];
    case "stage":            return [{ stage:            dir }, { createdAt: "desc" }];
    case "nextFollowUpDate": return [{ nextFollowUpDate: dir }, { createdAt: "desc" }];
    case "status":           return [{ status:           dir }, { createdAt: "desc" }];
    case "lastContactedDate":return [{ lastContactedDate:dir }, { createdAt: "desc" }];
    default:                 return [{ createdAt:        dir }, { id: "desc" }];
  }
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const leadRepository = {

  async findMany(query: LeadsQueryInput) {
    // Build all WHERE clauses independently, then merge with AND
    const searchClause    = buildSearchClause(query.search);
    const filterClauses   = buildFilterClauses(query);
    const dateClause      = buildDateClause(query.startDate, query.endDate);
    const followUpClause  = buildFollowUpClause(query.followUpStatus);

    const where: Prisma.LeadWhereInput = {
      AND: [searchClause, filterClauses, dateClause, followUpClause].filter(
        (c) => Object.keys(c).length > 0
      ),
    };

    const orderBy = buildOrderBy(query.sortBy, query.sortOrder);
    const skip    = (query.page - 1) * query.limit;

    const [leads, totalCount] = await prisma.$transaction([
      prisma.lead.findMany({ where, include: leadInclude, orderBy, skip, take: query.limit }),
      prisma.lead.count({ where }),
    ]);

    return { leads, totalCount };
  },

  async findById(id: string) {
    return prisma.lead.findUnique({
      where:   { id },
      include: {
        ...leadInclude,
        activities: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
  },

  async create(data: CreateLeadInput): Promise<LeadWithRelations> {
    return prisma.lead.create({
      data: {
        fullName:           data.fullName,
        email:              data.email,
        phone:              data.phone,
        country:            data.country ?? "India",
        state:              data.state,
        district:           data.district,
        city:               data.city,
        leadSource:         data.leadSource ?? "Google_Ads",
        courseInterest:     data.courseInterest,
        studyPreference:    (data.studyPreference ?? "Online") as import("@prisma/client").$Enums.StudyPreference,
        preferredCountry:   data.preferredCountry,
        stage:              data.stage ?? "New",
        subStage:           data.subStage ?? "Not_Contacted",
        priority:           data.priority ?? "Medium",
        status:             data.status ?? "New",
        nextFollowUpDate:   data.nextFollowUpDate  ? new Date(data.nextFollowUpDate)  : null,
        lastContactedDate:  data.lastContactedDate ? new Date(data.lastContactedDate) : null,
        remarks:            data.remarks,
        assignedEmployeeId: data.assignedEmployeeId,
      },
      include: leadInclude,
    });
  },

  async update(id: string, data: UpdateLeadInput): Promise<LeadWithRelations> {
    const updateData: Prisma.LeadUncheckedUpdateInput = {
      ...(data.fullName           !== undefined && { fullName:           data.fullName }),
      ...(data.email              !== undefined && { email:              data.email }),
      ...(data.phone              !== undefined && { phone:              data.phone }),
      ...(data.country            !== undefined && { country:            data.country }),
      ...(data.state              !== undefined && { state:              data.state }),
      ...(data.district           !== undefined && { district:           data.district }),
      ...(data.city               !== undefined && { city:               data.city }),
      ...(data.leadSource         !== undefined && { leadSource:         data.leadSource as Prisma.EnumLeadSourceFieldUpdateOperationsInput | import("@prisma/client").$Enums.LeadSource }),
      ...(data.courseInterest     !== undefined && { courseInterest:     data.courseInterest }),
      ...(data.studyPreference    !== undefined && { studyPreference:    data.studyPreference as import("@prisma/client").$Enums.StudyPreference }),
      ...(data.preferredCountry   !== undefined && { preferredCountry:   data.preferredCountry }),
      ...(data.stage              !== undefined && { stage:              data.stage }),
      ...(data.subStage           !== undefined && { subStage:           data.subStage }),
      ...(data.priority           !== undefined && { priority:           data.priority as import("@prisma/client").$Enums.Priority }),
      ...(data.status             !== undefined && { status:             data.status as import("@prisma/client").$Enums.LeadStatus }),
      ...(data.assignedEmployeeId !== undefined && { assignedEmployeeId: data.assignedEmployeeId }),
      ...(data.remarks            !== undefined && { remarks:            data.remarks }),
      ...(data.nextFollowUpDate   !== undefined && {
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
      }),
      ...(data.lastContactedDate  !== undefined && {
        lastContactedDate: data.lastContactedDate ? new Date(data.lastContactedDate) : null,
      }),
    };
    return prisma.lead.update({
      where:   { id },
      data:    updateData,
      include: leadInclude,
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.lead.delete({ where: { id } });
  },

  async exists(id: string): Promise<boolean> {
    const r = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
    return r !== null;
  },

  // ─── Aggregation helpers ────────────────────────────────────────────────────

  async countByStatus() {
    return prisma.lead.groupBy({ by: ["status"], _count: { id: true } });
  },

  async countCreatedToday(): Promise<number> {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return prisma.lead.count({ where: { createdAt: { gte: start } } });
  },

  async countCreatedThisWeek(): Promise<number> {
    const now = new Date(); const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    start.setHours(0, 0, 0, 0);
    return prisma.lead.count({ where: { createdAt: { gte: start } } });
  },

  /** Count leads whose follow-up is due (today or past) and not Won/Lost. */
  async countPendingFollowUps(): Promise<number> {
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    return prisma.lead.count({
      where: {
        nextFollowUpDate: { lte: todayEnd },
        status:           { notIn: ["Won", "Lost"] },
      },
    });
  },

  /** Bulk delete multiple leads by IDs. Returns count deleted. */
  async deleteMany(ids: string[]): Promise<number> {
    const result = await prisma.lead.deleteMany({ where: { id: { in: ids } } });
    return result.count;
  },

  /** Bulk update status on multiple leads. Returns count updated. */
  async updateManyStatus(ids: string[], status: string): Promise<number> {
    const result = await prisma.lead.updateMany({
      where: { id: { in: ids } },
      data:  { status: status as import("@prisma/client").$Enums.LeadStatus, updatedAt: new Date() },
    });
    return result.count;
  },

  /** Bulk assign multiple leads to an employee. Returns count updated. */
  async updateManyEmployee(ids: string[], employeeId: string | null): Promise<number> {
    const result = await prisma.lead.updateMany({
      where: { id: { in: ids } },
      data:  { assignedEmployeeId: employeeId, updatedAt: new Date() },
    });
    return result.count;
  },

  /** Count leads whose follow-up date is strictly in the past (not today). */
  async countOverdueFollowUps(): Promise<number> {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    return prisma.lead.count({
      where: {
        nextFollowUpDate: { lt: todayStart },
        status:           { notIn: ["Won", "Lost"] },
      },
    });
  },

  /** Count leads whose follow-up is due today. */
  async countDueTodayFollowUps(): Promise<number> {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    return prisma.lead.count({
      where: {
        nextFollowUpDate: { gte: start, lte: end },
        status:           { notIn: ["Won", "Lost"] },
      },
    });
  },
};
