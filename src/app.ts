// ─── Express App Factory ──────────────────────────────────────────────────────
// Creates and configures the Express app with all API routes.
// Used by both the dev server (server.ts) and the Vercel handler (api/index.ts).
// Vite middleware is NOT added here — that is dev-server only.
// ──────────────────────────────────────────────────────────────────────────────

import express     from "express";
import { ZodError } from "zod";

import { leadService }      from "./services/lead.service.js";
import { noteService }      from "./services/note.service.js";
import { dashboardService } from "./services/dashboard.service.js";
import { employeeService }  from "./services/employee.service.js";
import { authService }      from "./services/auth.service.js";
import {
  requireAuth,
  requireAdmin,
  scopeToEmployee,
} from "./middleware/auth.middleware.js";
import {
  leadsQuerySchema,
  createLeadSchema,
  updateLeadSchema,
  createNoteSchema,
  updateNoteSchema,
} from "./lib/validations.js";
import type { Lead, LegacyLead, LegacyLeadsResponse } from "./types.js";

// ─── Legacy Adapter ───────────────────────────────────────────────────────────

function toLegacy(lead: Lead): LegacyLead & Record<string, unknown> {
  const addressParts = [lead.city, lead.state, lead.country].filter(Boolean);
  return {
    id:               lead.id,
    name:             lead.fullName,
    mobile:           lead.phone,
    email:            lead.email,
    status:           lead.status,
    assignedEmployee: lead.assignedEmployee?.name ?? "Unassigned",
    createdDate:      lead.createdAt.split("T")[0],
    address:          addressParts.join(", "),
    courseInterested: lead.courseInterest,
    leadSource:       lead.leadSource.replace(/_/g, " "),
    notes: (lead.notes ?? []).map((n) => ({
      id: n.id, content: n.content, createdDate: n.createdAt, createdBy: n.createdBy,
    })),
    fullName:           lead.fullName,
    phone:              lead.phone,
    country:            lead.country,
    state:              lead.state,
    district:           lead.district,
    city:               lead.city,
    leadSourceRaw:      lead.leadSource,
    courseInterest:     lead.courseInterest,
    studyPreference:    lead.studyPreference,
    preferredCountry:   lead.preferredCountry,
    stage:              lead.stage,
    subStage:           lead.subStage,
    priority:           lead.priority,
    nextFollowUpDate:   lead.nextFollowUpDate,
    lastContactedDate:  lead.lastContactedDate,
    remarks:            lead.remarks,
    assignedEmployeeId: lead.assignedEmployeeId,
    createdAt:          lead.createdAt,
    updatedAt:          lead.updatedAt,
    activities:         lead.activities,
    followUpStatus:     lead.followUpStatus,
  };
}

// ─── Error handler ────────────────────────────────────────────────────────────

function handleError(res: express.Response, err: unknown, context: string) {
  if (err instanceof Error &&
      (err.message === "request aborted" || err.name === "BadRequestError")) return;
  if (err instanceof ZodError) {
    return res.status(422).json({ error: "Validation failed", details: err.flatten().fieldErrors });
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("not found"))                    return res.status(404).json({ error: err.message });
    if (msg.includes("already exists") || msg.includes("unique")) return res.status(409).json({ error: err.message });
    if (msg.includes("admin access"))                 return res.status(403).json({ error: err.message });
  }
  console.error(`[${context}]`, err);
  return res.status(500).json({ error: "Internal server error" });
}

// ─── App Factory ──────────────────────────────────────────────────────────────

export function createApp() {
  const app = express();
  app.use(express.json());

  // ── Auth ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.message === "Invalid email or password.")
        return res.status(401).json({ error: err.message });
      handleError(res, err, "POST /api/auth/login");
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const profile = await authService.getProfile(req.user!.userId);
      if (!profile) return res.status(401).json({ error: "User not found." });
      res.json(profile);
    } catch (err) { handleError(res, err, "GET /api/auth/me"); }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.json({ message: "Logged out successfully." });
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────
  app.get("/api/leads/stats", requireAuth, async (_req, res) => {
    try {
      const stats = await dashboardService.getStats();
      res.json({
        total:     stats.totalLeads,
        New:       stats.byStatus.New,
        Contacted: stats.byStatus.Contacted,
        Qualified: stats.byStatus.Qualified,
        Proposal:  stats.byStatus.Proposal,
        Won:       stats.byStatus.Won,
        Lost:      stats.byStatus.Lost,
      });
    } catch (err) { handleError(res, err, "GET /api/leads/stats"); }
  });

  app.get("/api/dashboard", requireAuth, async (_req, res) => {
    try {
      const data = await dashboardService.getDashboard();
      res.json(data);
    } catch (err) { handleError(res, err, "GET /api/dashboard"); }
  });

  app.get("/api/employees", requireAuth, async (_req, res) => {
    try {
      res.json(await employeeService.getAllEmployees());
    } catch (err) { handleError(res, err, "GET /api/employees"); }
  });

  // ── Leads list ────────────────────────────────────────────────────────────
  app.get("/api/leads", requireAuth, scopeToEmployee, async (req, res) => {
    try {
      const rawQuery = { ...req.query } as Record<string, string>;
      if (rawQuery.assignedEmployee && rawQuery.assignedEmployee !== "All" && !rawQuery.assignedEmployeeId) {
        const employees = await employeeService.getAllEmployees();
        const match = employees.find(e => e.name.toLowerCase() === rawQuery.assignedEmployee.toLowerCase());
        if (match) rawQuery.assignedEmployeeId = match.id;
        delete rawQuery.assignedEmployee;
      } else if (rawQuery.assignedEmployee === "All") {
        delete rawQuery.assignedEmployee;
      }
      const query  = leadsQuerySchema.parse(rawQuery);
      const result = await leadService.getLeads(query);
      const legacy: LegacyLeadsResponse = {
        leads: result.leads.map(toLegacy),
        totalCount: result.totalCount, totalPages: result.totalPages,
        currentPage: result.currentPage, limit: result.limit,
      };
      res.json(legacy);
    } catch (err) { handleError(res, err, "GET /api/leads"); }
  });

  app.get("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const lead = await leadService.getLeadById(req.params.id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      if (req.user!.role === "STAFF" && req.user!.employeeId &&
          lead.assignedEmployeeId !== req.user!.employeeId)
        return res.status(403).json({ error: "Access denied." });
      res.json(toLegacy(lead));
    } catch (err) { handleError(res, err, "GET /api/leads/:id"); }
  });

  app.post("/api/leads", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = createLeadSchema.parse(req.body);
      const lead = await leadService.createLead(data, req.user!.name);
      res.status(201).json(toLegacy(lead));
    } catch (err) { handleError(res, err, "POST /api/leads"); }
  });

  app.put("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const mapped: Record<string, unknown> = { ...body };
      if (body.name   !== undefined && body.fullName === undefined) { mapped.fullName = body.name;   delete mapped.name; }
      if (body.mobile !== undefined && body.phone    === undefined) { mapped.phone    = body.mobile; delete mapped.mobile; }
      if (body.courseInterested !== undefined && body.courseInterest === undefined) {
        mapped.courseInterest = body.courseInterested; delete mapped.courseInterested;
      }
      if (body.assignedEmployee !== undefined && typeof body.assignedEmployee === "string" &&
          body.assignedEmployeeId === undefined) {
        const employees = await employeeService.getAllEmployees();
        const match = employees.find(e => e.name.toLowerCase() === (body.assignedEmployee as string).toLowerCase());
        if (match) mapped.assignedEmployeeId = match.id;
        delete mapped.assignedEmployee;
      }
      if (req.user!.role === "STAFF") {
        const allowed: Record<string, unknown> = {};
        for (const f of ["status","stage","subStage","remarks","nextFollowUpDate","lastContactedDate"]) {
          if (mapped[f] !== undefined) allowed[f] = mapped[f];
        }
        const data = updateLeadSchema.parse(allowed);
        return res.json(toLegacy(await leadService.updateLead(req.params.id, data, req.user!.name)));
      }
      const data = updateLeadSchema.parse(mapped);
      res.json(toLegacy(await leadService.updateLead(req.params.id, data, req.user!.name)));
    } catch (err) { handleError(res, err, "PUT /api/leads/:id"); }
  });

  app.delete("/api/leads/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await leadService.deleteLead(req.params.id, req.user!.name);
      res.status(204).send();
    } catch (err) { handleError(res, err, "DELETE /api/leads/:id"); }
  });

  // ── Bulk ──────────────────────────────────────────────────────────────────
  app.post("/api/leads/bulk/delete", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { ids } = req.body as { ids?: unknown };
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "ids must be a non-empty array." });
      if (ids.length > 100) return res.status(400).json({ error: "Cannot bulk-delete more than 100 leads at once." });
      const count = await leadService.bulkDelete(ids as string[], req.user!.name);
      res.json({ deleted: count });
    } catch (err) { handleError(res, err, "POST /api/leads/bulk/delete"); }
  });

  app.post("/api/leads/bulk/status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { ids, status } = req.body as { ids?: unknown; status?: unknown };
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "ids must be a non-empty array." });
      if (typeof status !== "string") return res.status(400).json({ error: "status must be a string." });
      const valid = ["New","Contacted","Qualified","Proposal","Won","Lost"];
      if (!valid.includes(status)) return res.status(400).json({ error: `Invalid status. Must be one of: ${valid.join(", ")}` });
      const count = await leadService.bulkUpdateStatus(ids as string[], status, req.user!.name);
      res.json({ updated: count, status });
    } catch (err) { handleError(res, err, "POST /api/leads/bulk/status"); }
  });

  app.post("/api/leads/bulk/assign", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { ids, employeeId } = req.body as { ids?: unknown; employeeId?: unknown };
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "ids must be a non-empty array." });
      const count = await leadService.bulkAssign(ids as string[], employeeId as string | null, req.user!.name);
      res.json({ updated: count });
    } catch (err) { handleError(res, err, "POST /api/leads/bulk/assign"); }
  });

  // ── Notes ─────────────────────────────────────────────────────────────────
  app.post("/api/leads/:id/notes", requireAuth, async (req, res) => {
    try {
      const data = createNoteSchema.parse(req.body);
      await noteService.addNote(req.params.id, data);
      const lead = await leadService.getLeadById(req.params.id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      res.status(201).json(toLegacy(lead));
    } catch (err) { handleError(res, err, "POST /api/leads/:id/notes"); }
  });

  app.put("/api/leads/:id/notes/:noteId", requireAuth, async (req, res) => {
    try {
      const data = updateNoteSchema.parse(req.body);
      await noteService.updateNote(req.params.noteId, req.params.id, data);
      const lead = await leadService.getLeadById(req.params.id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      res.json(toLegacy(lead));
    } catch (err) { handleError(res, err, "PUT /api/leads/:id/notes/:noteId"); }
  });

  app.delete("/api/leads/:id/notes/:noteId", requireAuth, async (req, res) => {
    try {
      await noteService.deleteNote(req.params.noteId, req.params.id);
      const lead = await leadService.getLeadById(req.params.id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      res.json(toLegacy(lead));
    } catch (err) { handleError(res, err, "DELETE /api/leads/:id/notes/:noteId"); }
  });

  app.put("/api/notes/:noteId", requireAuth, async (req, res) => {
    try {
      const { leadId } = req.body as { leadId?: string };
      if (!leadId) return res.status(400).json({ error: "leadId is required" });
      const data = updateNoteSchema.parse(req.body);
      res.json(await noteService.updateNote(req.params.noteId, leadId, data));
    } catch (err) { handleError(res, err, "PUT /api/notes/:noteId"); }
  });

  app.delete("/api/notes/:noteId", requireAuth, async (req, res) => {
    try {
      const { leadId } = req.query as { leadId?: string };
      if (!leadId) return res.status(400).json({ error: "leadId query param required" });
      await noteService.deleteNote(req.params.noteId, leadId);
      res.status(204).send();
    } catch (err) { handleError(res, err, "DELETE /api/notes/:noteId"); }
  });

  return app;
}
