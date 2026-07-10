// ─── Lead Service ─────────────────────────────────────────────────────────────

import { leadRepository }     from "../repositories/lead.repository.js";
import { activityRepository } from "../repositories/activity.repository.js";
import { employeeRepository } from "../repositories/employee.repository.js";
import type { CreateLeadInput, UpdateLeadInput, LeadsQueryInput } from "../lib/validations.js";
import type { Lead, LeadsResponse } from "../types.js";
import { DEFAULT_PAGE_SIZE } from "../lib/constants.js";

// ─── Follow-up status computation (pure, server-side) ────────────────────────

function computeFollowUpStatus(
  nextFollowUpDate: Date | null,
  status: string,
): Lead["followUpStatus"] {
  if (status === "Won" || status === "Lost") return null;
  if (!nextFollowUpDate) return "no_followup";
  const now        = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  if (nextFollowUpDate < todayStart) return "overdue";
  if (nextFollowUpDate <= todayEnd)  return "due_today";
  return "upcoming";
}

// ─── Serialiser ───────────────────────────────────────────────────────────────
// Converts a Prisma model (Dates) into the JSON-safe client type.

type AnyLeadRow = Awaited<ReturnType<typeof leadRepository.findById>> |
                  Awaited<ReturnType<typeof leadRepository.create>>   |
                  Awaited<ReturnType<typeof leadRepository.update>>;

function serializeLead(lead: NonNullable<AnyLeadRow>): Lead {
  return {
    id:                 lead.id,
    fullName:           lead.fullName,
    email:              lead.email,
    phone:              lead.phone,
    country:            lead.country,
    state:              lead.state,
    district:           lead.district,
    city:               lead.city,
    leadSource:         lead.leadSource         as Lead["leadSource"],
    courseInterest:     lead.courseInterest,
    studyPreference:    lead.studyPreference     as Lead["studyPreference"],
    preferredCountry:   lead.preferredCountry,
    stage:              lead.stage               as Lead["stage"],
    subStage:           lead.subStage            as Lead["subStage"],
    priority:           lead.priority            as Lead["priority"],
    status:             lead.status              as Lead["status"],
    nextFollowUpDate:   lead.nextFollowUpDate?.toISOString()  ?? null,
    lastContactedDate:  lead.lastContactedDate?.toISOString() ?? null,
    remarks:            lead.remarks,
    followUpStatus:     computeFollowUpStatus(lead.nextFollowUpDate ?? null, lead.status),
    createdAt:          lead.createdAt.toISOString(),
    updatedAt:          lead.updatedAt.toISOString(),
    assignedEmployeeId: lead.assignedEmployeeId,
    assignedEmployee: lead.assignedEmployee
      ? {
          id:        lead.assignedEmployee.id,
          name:      lead.assignedEmployee.name,
          email:     lead.assignedEmployee.email,
          role:      lead.assignedEmployee.role as Lead["assignedEmployee"]["role"],
          createdAt: lead.assignedEmployee.createdAt.toISOString(),
          updatedAt: lead.assignedEmployee.updatedAt.toISOString(),
        }
      : null,
    notes: (lead.notes ?? []).map((n) => ({
      id:          n.id,
      leadId:      n.leadId,
      content:     n.content,
      createdBy:   n.createdBy,
      createdAt:   n.createdAt.toISOString(),
      updatedAt:   n.updatedAt.toISOString(),
      createdDate: n.createdAt.toISOString(), // legacy alias
    })),
    activities: ("activities" in lead && Array.isArray((lead as any).activities))
      ? (lead as any).activities.map((a: any) => ({
          id:           a.id,
          leadId:       a.leadId,
          activityType: a.activityType,
          description:  a.description,
          performedBy:  a.performedBy,
          createdAt:    a.createdAt.toISOString(),
        }))
      : undefined,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const leadService = {

  async getLeads(rawQuery: Partial<LeadsQueryInput>): Promise<LeadsResponse> {
    const query: LeadsQueryInput = {
      page:  rawQuery.page  ?? 1,
      limit: rawQuery.limit ?? DEFAULT_PAGE_SIZE,
      ...rawQuery,
    };

    const { leads, totalCount } = await leadRepository.findMany(query);
    const totalPages  = Math.ceil(totalCount / query.limit) || 1;
    const currentPage = Math.max(1, Math.min(query.page, totalPages));

    return {
      leads:       leads.map(serializeLead),
      totalCount,
      totalPages,
      currentPage,
      limit: query.limit,
    };
  },

  async getLeadById(id: string): Promise<Lead | null> {
    const lead = await leadRepository.findById(id);
    return lead ? serializeLead(lead) : null;
  },

  async createLead(data: CreateLeadInput, performedBy = "System"): Promise<Lead> {
    if (data.assignedEmployeeId) {
      const emp = await employeeRepository.findById(data.assignedEmployeeId);
      if (!emp) throw new Error("Assigned employee not found");
    }

    const lead = await leadRepository.create(data);

    await activityRepository.create({
      leadId:       lead.id,
      activityType: "lead_created",
      description:  `Lead "${lead.fullName}" was created.`,
      performedBy,
    });

    return serializeLead(lead);
  },

  async updateLead(id: string, data: UpdateLeadInput, performedBy = "System"): Promise<Lead> {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new Error("Lead not found");

    if (data.assignedEmployeeId && data.assignedEmployeeId !== existing.assignedEmployeeId) {
      const emp = await employeeRepository.findById(data.assignedEmployeeId);
      if (!emp) throw new Error("Assigned employee not found");
    }

    const updated = await leadRepository.update(id, data);

    // Log status change
    if (data.status && data.status !== existing.status) {
      await activityRepository.create({
        leadId:       id,
        activityType: "status_change",
        description:  `Status changed from "${existing.status}" to "${data.status}".`,
        performedBy,
      });
    }

    // Log stage change
    if (data.stage && data.stage !== existing.stage) {
      await activityRepository.create({
        leadId:       id,
        activityType: "stage_change",
        description:  `Stage changed from "${existing.stage}" to "${data.stage}".`,
        performedBy,
      });
    }

    // Log sub-stage change
    if (data.subStage && data.subStage !== existing.subStage) {
      await activityRepository.create({
        leadId:       id,
        activityType: "substage_change",
        description:  `Sub-stage changed from "${existing.subStage.replace(/_/g, " ")}" to "${data.subStage.replace(/_/g, " ")}".`,
        performedBy,
      });
    }

    // Log employee reassignment
    if (
      data.assignedEmployeeId !== undefined &&
      data.assignedEmployeeId !== existing.assignedEmployeeId
    ) {
      const newEmpName = updated.assignedEmployee?.name ?? "Unassigned";
      const oldEmpName = existing.assignedEmployee?.name ?? "Unassigned";
      await activityRepository.create({
        leadId:       id,
        activityType: "employee_changed",
        description:  `Assigned employee changed from "${oldEmpName}" to "${newEmpName}".`,
        performedBy,
      });
    }

    // Log priority change
    if (data.priority && data.priority !== existing.priority) {
      await activityRepository.create({
        leadId:       id,
        activityType: "priority_change",
        description:  `Priority changed from "${existing.priority}" to "${data.priority}".`,
        performedBy,
      });
    }

    // Log follow-up date change
    if (data.nextFollowUpDate !== undefined) {
      const oldDate = existing.nextFollowUpDate?.toISOString().split("T")[0] ?? "none";
      const newDate = data.nextFollowUpDate ? new Date(data.nextFollowUpDate).toISOString().split("T")[0] : "none";
      if (oldDate !== newDate) {
        await activityRepository.create({
          leadId:       id,
          activityType: "followup_updated",
          description:  `Next follow-up date changed from "${oldDate}" to "${newDate}".`,
          performedBy,
        });
      }
    }

    // Log last contacted date change
    if (data.lastContactedDate !== undefined) {
      const oldDate = existing.lastContactedDate?.toISOString().split("T")[0] ?? "none";
      const newDate = data.lastContactedDate ? new Date(data.lastContactedDate).toISOString().split("T")[0] : "none";
      if (oldDate !== newDate) {
        await activityRepository.create({
          leadId:       id,
          activityType: "last_contacted_updated",
          description:  `Last contacted date changed from "${oldDate}" to "${newDate}".`,
          performedBy,
        });
      }
    }

    // Log general update (always — summarises any field change)
    await activityRepository.create({
      leadId:       id,
      activityType: "lead_updated",
      description:  `Lead "${updated.fullName}" was updated.`,
      performedBy,
    });

    return serializeLead(updated);
  },

  async deleteLead(id: string, performedBy = "System"): Promise<void> {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new Error("Lead not found");

    await activityRepository.create({
      leadId:       id,
      activityType: "lead_deleted",
      description:  `Lead "${existing.fullName}" was deleted.`,
      performedBy,
    });

    await leadRepository.delete(id);
  },

  // ── Bulk Operations ────────────────────────────────────────────────────────

  async bulkDelete(ids: string[], performedBy = "System"): Promise<number> {
    if (ids.length === 0) return 0;
    // Log before deleting (activities cascade with leads)
    await activityRepository.create({
      leadId:       ids[0],
      activityType: "bulk_delete",
      description:  `Bulk delete of ${ids.length} lead(s) by ${performedBy}.`,
      performedBy,
    }).catch(() => {}); // non-blocking — if first lead is already gone, skip
    const count = await leadRepository.deleteMany(ids);
    return count;
  },

  async bulkUpdateStatus(
    ids: string[],
    status: string,
    performedBy = "System",
  ): Promise<number> {
    if (ids.length === 0) return 0;
    const count = await leadRepository.updateManyStatus(ids, status);
    // Log one activity per lead (batched as individual inserts)
    await Promise.all(
      ids.map((leadId) =>
        activityRepository.create({
          leadId,
          activityType: "status_change",
          description:  `Status updated to "${status}" via bulk action by ${performedBy}.`,
          performedBy,
        }).catch(() => {})
      )
    );
    return count;
  },

  async bulkAssign(
    ids: string[],
    employeeId: string | null,
    performedBy = "System",
  ): Promise<number> {
    if (ids.length === 0) return 0;
    const count = await leadRepository.updateManyEmployee(ids, employeeId);
    await Promise.all(
      ids.map((leadId) =>
        activityRepository.create({
          leadId,
          activityType: "employee_changed",
          description:  `Lead reassigned via bulk action by ${performedBy}.`,
          performedBy,
        }).catch(() => {})
      )
    );
    return count;
  },
};
