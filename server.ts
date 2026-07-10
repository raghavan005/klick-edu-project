// ─── CRM Express Server ───────────────────────────────────────────────────────
// Express + Prisma backend. Auth: JWT (ADMIN / STAFF roles).
// ──────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import express                from "express";
import path                   from "path";
import { createServer as createViteServer } from "vite";
import { ZodError }           from "zod";

import { leadService }        from "./src/services/lead.service.js";
import { noteService }        from "./src/services/note.service.js";
import { dashboardService }   from "./src/services/dashboard.service.js";
import { employeeService }    from "./src/services/employee.service.js";
import { authService }        from "./src/services/auth.service.js";
import {
  requireAuth,
  requireAdmin,
  scopeToEmployee,
} from "./src/middleware/auth.middleware.js";

import {
  leadsQuerySchema,
  createLeadSchema,
  updateLeadSchema,
  createNoteSchema,
  updateNoteSchema,
} from "./src/lib/validations.js";

import type { Lead, LegacyLead, LegacyLeadsResponse } from "./src/types.js";

// ─── Legacy Adapter ───────────────────────────────────────────────────────────
// Converts the new Lead shape → the old shape the UI still expects.
// This lives only in the server layer; the UI never needs to change.

function toLegacy(lead: Lead): LegacyLead {
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
      id:          n.id,
      content:     n.content,
      createdDate: n.createdAt,
      createdBy:   n.createdBy,
    })),
    // ── Extended fields for new UI (Stage 2+) ──
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
  } as LegacyLead & Record<string, unknown>;
}

// ─── Error Handler Helper ─────────────────────────────────────────────────────

function handleError(res: express.Response, err: unknown, context: string) {
  // Client disconnected before the server finished — not an application error
  if (err instanceof Error && (err.message === "request aborted" || err.name === "BadRequestError")) {
    return; // silently ignore
  }
  if (err instanceof ZodError) {
    return res.status(422).json({
      error:   "Validation failed",
      details: err.flatten().fieldErrors,
    });
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    if (msg.includes("already exists") || msg.includes("unique")) {
      return res.status(409).json({ error: err.message });
    }
  }
  console.error(`[${context}]`, err);
  return res.status(500).json({ error: "Internal server error" });
}

// ─── Server ───────────────────────────────────────────────────────────────────

async function startServer() {
  const app  = express();
  const PORT = 3000; // Trigger dev server restart

  app.use(express.json());

  // ── POST /api/auth/login ────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    console.log("[DEBUG] /api/auth/login hit with body:", req.body);
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.message === "Invalid email or password.") {
        return res.status(401).json({ error: err.message });
      }
      console.error("[POST /api/auth/login]", err);
      res.status(500).json({ error: "Internal server error." });
    }
  });

  // ── GET /api/auth/me ────────────────────────────────────────────────────────
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const profile = await authService.getProfile(req.user!.userId);
      if (!profile) return res.status(401).json({ error: "User not found." });
      res.json(profile);
    } catch (err) {
      handleError(res, err, "GET /api/auth/me");
    }
  });

  // ── GET /api/auth/logout ────────────────────────────────────────────────────
  // Stateless JWT — client just drops the token. This is a convenience endpoint.
  app.post("/api/auth/logout", (_req, res) => {
    res.json({ message: "Logged out successfully." });
  });

  // ── GET /api/leads/stats ────────────────────────────────────────────────────
  // Dashboard summary cards — returns counts per status.
  app.get("/api/leads/stats", requireAuth, async (_req, res) => {
    try {
      const stats = await dashboardService.getStats();
      // Return flat shape matching the old /api/leads/stats contract
      res.json({
        total:     stats.totalLeads,
        New:       stats.byStatus.New,
        Contacted: stats.byStatus.Contacted,
        Qualified: stats.byStatus.Qualified,
        Proposal:  stats.byStatus.Proposal,
        Won:       stats.byStatus.Won,
        Lost:      stats.byStatus.Lost,
      });
    } catch (err) {
      handleError(res, err, "GET /api/leads/stats");
    }
  });

  // ── GET /api/dashboard ──────────────────────────────────────────────────────
  app.get("/api/dashboard", requireAuth, async (_req, res) => {
    try {
      const data = await dashboardService.getDashboard();
      res.json(data);
    } catch (err) {
      handleError(res, err, "GET /api/dashboard");
    }
  });

  // ── GET /api/employees ──────────────────────────────────────────────────────
  app.get("/api/employees", requireAuth, async (_req, res) => {
    try {
      const employees = await employeeService.getAllEmployees();
      res.json(employees);
    } catch (err) {
      handleError(res, err, "GET /api/employees");
    }
  });

  // ── GET /api/leads ──────────────────────────────────────────────────────────
  // STAFF: scopeToEmployee injects their employeeId so they only see own leads.
  // ADMIN: sees everything.
  app.get("/api/leads", requireAuth, scopeToEmployee, async (req, res) => {
    try {
      const rawQuery = { ...req.query } as Record<string, string>;

      if (rawQuery.assignedEmployee && rawQuery.assignedEmployee !== "All" && !rawQuery.assignedEmployeeId) {
        const employees = await employeeService.getAllEmployees();
        const match = employees.find(
          (e) => e.name.toLowerCase() === rawQuery.assignedEmployee.toLowerCase(),
        );
        if (match) rawQuery.assignedEmployeeId = match.id;
        delete rawQuery.assignedEmployee;
      } else if (rawQuery.assignedEmployee === "All") {
        delete rawQuery.assignedEmployee;
      }

      const query  = leadsQuerySchema.parse(rawQuery);
      const result = await leadService.getLeads(query);

      const legacy: LegacyLeadsResponse = {
        leads:       result.leads.map(toLegacy),
        totalCount:  result.totalCount,
        totalPages:  result.totalPages,
        currentPage: result.currentPage,
        limit:       result.limit,
      };

      res.json(legacy);
    } catch (err) {
      handleError(res, err, "GET /api/leads");
    }
  });

  // ── GET /api/leads/export ───────────────────────────────────────────────────
  app.get("/api/leads/export", requireAuth, scopeToEmployee, async (req, res) => {
    try {
      const rawQuery = { ...req.query } as Record<string, string>;

      if (rawQuery.assignedEmployee && rawQuery.assignedEmployee !== "All" && !rawQuery.assignedEmployeeId) {
        const employees = await employeeService.getAllEmployees();
        const match = employees.find(
          (e) => e.name.toLowerCase() === rawQuery.assignedEmployee.toLowerCase(),
        );
        if (match) rawQuery.assignedEmployeeId = match.id;
        delete rawQuery.assignedEmployee;
      } else if (rawQuery.assignedEmployee === "All") {
        delete rawQuery.assignedEmployee;
      }

      const query  = leadsQuerySchema.parse(rawQuery);
      
      // Override limit to max for export (bypassing Zod's max(100) rule)
      query.limit = 10000;
      query.page = 1;

      const result = await leadService.getLeads(query);
      const leads = result.leads.map(toLegacy);

      if (leads.length === 0) {
        return res.status(404).send("No leads found matching criteria.");
      }

      // CSV Fields
      const fields = [
        "id", "name", "email", "mobile", "status", "stage", "subStage",
        "priority", "leadSource", "country", "studyPreference",
        "createdDate", "lastContacted", "nextFollowUpDate", "followUpStatus", "assignedEmployeeName"
      ];

      let csv = fields.join(",") + "\n";
      for (const lead of leads) {
        const row = fields.map(f => {
          let val = (lead as any)[f];
          if (val === null || val === undefined) val = "";
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csv += row.join(",") + "\n";
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="leads_export.csv"');
      res.send(csv);
    } catch (err) {
      handleError(res, err, "GET /api/leads/export");
    }
  });

  // ── GET /api/leads/:id ──────────────────────────────────────────────────────
  app.get("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const lead = await leadService.getLeadById(req.params.id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });

      // STAFF can only view their own leads
      if (req.user!.role === "STAFF" && req.user!.employeeId &&
          lead.assignedEmployeeId !== req.user!.employeeId) {
        return res.status(403).json({ error: "Access denied." });
      }

      res.json(toLegacy(lead));
    } catch (err) {
      handleError(res, err, "GET /api/leads/:id");
    }
  });

  // ── POST /api/leads ─────────────────────────────────────────────────────────
  // ADMIN only: STAFF cannot create leads
  app.post("/api/leads", requireAuth, requireAdmin, async (req, res) => {
    try {
      const data = createLeadSchema.parse(req.body);
      const lead = await leadService.createLead(data, req.user!.name);
      res.status(201).json(toLegacy(lead));
    } catch (err) {
      handleError(res, err, "POST /api/leads");
    }
  });

  // ── PUT /api/leads/:id ──────────────────────────────────────────────────────
  // STAFF: can update status, stage, subStage, remarks, follow-up dates only.
  // ADMIN: can update all fields.
  app.put("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const mapped: Record<string, unknown> = { ...body };

      // Legacy field mapping
      if (body.name   !== undefined && body.fullName === undefined) { mapped.fullName = body.name;   delete mapped.name;   }
      if (body.mobile !== undefined && body.phone    === undefined) { mapped.phone    = body.mobile; delete mapped.mobile; }
      if (body.courseInterested !== undefined && body.courseInterest === undefined) {
        mapped.courseInterest = body.courseInterested; delete mapped.courseInterested;
      }
      if (body.assignedEmployee !== undefined && typeof body.assignedEmployee === "string" &&
          body.assignedEmployeeId === undefined) {
        const employees = await employeeService.getAllEmployees();
        const match = employees.find((e) => e.name.toLowerCase() === (body.assignedEmployee as string).toLowerCase());
        if (match) mapped.assignedEmployeeId = match.id;
        delete mapped.assignedEmployee;
      }

      // STAFF: restrict to allowed fields only
      if (req.user!.role === "STAFF") {
        const allowed: Record<string, unknown> = {};
        const staffFields = ["status", "stage", "subStage", "remarks", "nextFollowUpDate", "lastContactedDate"];
        for (const f of staffFields) {
          if (mapped[f] !== undefined) allowed[f] = mapped[f];
        }
        const data    = updateLeadSchema.parse(allowed);
        const updated = await leadService.updateLead(req.params.id, data, req.user!.name);
        return res.json(toLegacy(updated));
      }

      const data    = updateLeadSchema.parse(mapped);
      const updated = await leadService.updateLead(req.params.id, data, req.user!.name);
      res.json(toLegacy(updated));
    } catch (err) {
      handleError(res, err, "PUT /api/leads/:id");
    }
  });

  // ── DELETE /api/leads/:id ───────────────────────────────────────────────────
  // ADMIN only
  app.delete("/api/leads/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await leadService.deleteLead(req.params.id, req.user!.name);
      res.status(204).send();
    } catch (err) {
      handleError(res, err, "DELETE /api/leads/:id");
    }
  });

  // ── POST /api/leads/bulk/delete ──────────────────────────────────────────────
  // ADMIN only. Body: { ids: string[] }
  app.post("/api/leads/bulk/delete", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { ids } = req.body as { ids?: unknown };
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "ids must be a non-empty array." });
      }
      if (ids.length > 100) {
        return res.status(400).json({ error: "Cannot bulk-delete more than 100 leads at once." });
      }
      const count = await leadService.bulkDelete(ids as string[], req.user!.name);
      res.json({ deleted: count });
    } catch (err) {
      handleError(res, err, "POST /api/leads/bulk/delete");
    }
  });

  // ── POST /api/leads/bulk/status ──────────────────────────────────────────────
  // ADMIN only. Body: { ids: string[], status: LeadStatus }
  app.post("/api/leads/bulk/status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { ids, status } = req.body as { ids?: unknown; status?: unknown };
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "ids must be a non-empty array." });
      }
      if (typeof status !== "string") {
        return res.status(400).json({ error: "status must be a string." });
      }
      const validStatuses = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }
      const count = await leadService.bulkUpdateStatus(ids as string[], status, req.user!.name);
      res.json({ updated: count, status });
    } catch (err) {
      handleError(res, err, "POST /api/leads/bulk/status");
    }
  });

  // ── POST /api/leads/bulk/assign ──────────────────────────────────────────────
  // ADMIN only. Body: { ids: string[], employeeId: string | null }
  app.post("/api/leads/bulk/assign", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { ids, employeeId } = req.body as { ids?: unknown; employeeId?: unknown };
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "ids must be a non-empty array." });
      }
      const count = await leadService.bulkAssign(
        ids as string[],
        employeeId as string | null,
        req.user!.name,
      );
      res.json({ updated: count });
    } catch (err) {
      handleError(res, err, "POST /api/leads/bulk/assign");
    }
  });

  // ── POST /api/leads/:id/notes ───────────────────────────────────────────────
  app.post("/api/leads/:id/notes", requireAuth, async (req, res) => {
    try {
      const data = createNoteSchema.parse(req.body);
      await noteService.addNote(req.params.id, data);
      const lead = await leadService.getLeadById(req.params.id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      res.status(201).json(toLegacy(lead));
    } catch (err) {
      handleError(res, err, "POST /api/leads/:id/notes");
    }
  });

  // ── PUT /api/notes/:noteId ──────────────────────────────────────────────────
  app.put("/api/notes/:noteId", requireAuth, async (req, res) => {
    try {
      const { leadId } = req.body as { leadId?: string };
      if (!leadId) return res.status(400).json({ error: "leadId is required" });
      const data = updateNoteSchema.parse(req.body);
      const note = await noteService.updateNote(req.params.noteId, leadId, data);
      res.json(note);
    } catch (err) {
      handleError(res, err, "PUT /api/notes/:noteId");
    }
  });

  // ── PUT /api/leads/:id/notes/:noteId ────────────────────────────────────────
  app.put("/api/leads/:id/notes/:noteId", requireAuth, async (req, res) => {
    try {
      const data = updateNoteSchema.parse(req.body);
      await noteService.updateNote(req.params.noteId, req.params.id, data);
      const lead = await leadService.getLeadById(req.params.id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      res.json(toLegacy(lead));
    } catch (err) {
      handleError(res, err, "PUT /api/leads/:id/notes/:noteId");
    }
  });

  // ── DELETE /api/notes/:noteId ───────────────────────────────────────────────
  app.delete("/api/notes/:noteId", requireAuth, async (req, res) => {
    try {
      const { leadId } = req.query as { leadId?: string };
      if (!leadId) return res.status(400).json({ error: "leadId query param required" });
      await noteService.deleteNote(req.params.noteId, leadId);
      res.status(204).send();
    } catch (err) {
      handleError(res, err, "DELETE /api/notes/:noteId");
    }
  });

  // ── DELETE /api/leads/:id/notes/:noteId ─────────────────────────────────────
  app.delete("/api/leads/:id/notes/:noteId", requireAuth, async (req, res) => {
    try {
      await noteService.deleteNote(req.params.noteId, req.params.id);
      const lead = await leadService.getLeadById(req.params.id);
      if (!lead) return res.status(404).json({ error: "Lead not found" });
      res.json(toLegacy(lead));
    } catch (err) {
      handleError(res, err, "DELETE /api/leads/:id/notes/:noteId");
    }
  });

  // ── Vite / Static ───────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server:  { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀  CRM server running at http://localhost:${PORT}`);
    console.log(`   Database: Supabase PostgreSQL (Prisma)\n`);
  });
}

startServer();
