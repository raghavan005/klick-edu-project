// ─── Zod Validation Schemas ───────────────────────────────────────────────────

import { z } from "zod";
import {
  LEAD_STATUSES, PRIORITIES, LEAD_SOURCES, STUDY_PREFERENCES,
} from "./constants.js";
import { STAGE_NAMES, isValidSubStage, type StageName } from "./stageConfig.js";

const stageSubStageRefine = <T extends { stage?: string; subStage?: string }>(schema: z.ZodType<T>) =>
  schema.refine(
    (data) => {
      if (!data.stage || !data.subStage) return true;
      if (!STAGE_NAMES.includes(data.stage as StageName)) return false;
      return isValidSubStage(data.stage as StageName, data.subStage);
    },
    { message: "Sub-stage is not valid for the selected stage", path: ["subStage"] },
  );

// ─── Lead ─────────────────────────────────────────────────────────────────────

const baseLeadSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required" })
    .min(2, "Full name must be at least 2 characters")
    .max(100)
    .trim(),

  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),

  phone: z
    .string({ required_error: "Phone number is required" })
    .regex(/^\+?[0-9]{7,15}$/, "Phone must be 7–15 digits (+ prefix allowed)")
    .trim(),

  country:           z.string().min(1).default("India"),
  state:             z.string().optional().nullable(),
  district:          z.string().optional().nullable(),
  city:              z.string().optional().nullable(),
  leadSource:        z.enum(LEAD_SOURCES).default("Google_Ads"),
  courseInterest:    z.string().min(2, "Course interest is required").max(200).trim(),
  studyPreference:   z.enum(STUDY_PREFERENCES).default("Online"),
  preferredCountry:  z.string().optional().nullable(),
  stage:             z.enum(STAGE_NAMES as [StageName, ...StageName[]]).default("New"),
  subStage:          z.string().default("Not_Contacted"),
  priority:          z.enum(PRIORITIES).default("Medium"),
  status:            z.enum(LEAD_STATUSES).default("New"),
  assignedEmployeeId: z.string().optional().nullable(),
  nextFollowUpDate:  z.string().datetime({ offset: true }).optional().nullable(),
  lastContactedDate: z.string().datetime({ offset: true }).optional().nullable(),
  remarks:           z.string().max(2000).optional().nullable(),
});

export const createLeadSchema = stageSubStageRefine(baseLeadSchema);

export const updateLeadSchema = stageSubStageRefine(baseLeadSchema.partial());

// ─── Note ─────────────────────────────────────────────────────────────────────

export const createNoteSchema = z.object({
  content: z
    .string({ required_error: "Note content is required" })
    .min(1, "Note cannot be empty")
    .max(5000)
    .trim(),
  createdBy: z
    .string({ required_error: "Author is required" })
    .min(1)
    .max(100)
    .trim(),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
});

// ─── Query Params ─────────────────────────────────────────────────────────────

export const SORT_FIELDS = [
  "fullName", "createdAt", "priority", "stage", "nextFollowUpDate", "status", "lastContactedDate",
] as const;

export const SORT_ORDERS = ["asc", "desc"] as const;

export const FOLLOW_UP_STATUSES = ["all", "overdue", "due_today", "upcoming", "no_followup"] as const;

export const leadsQuerySchema = z.object({
  // ── Search ─────────────────────────────────────────────────────────────────
  search:              z.string().optional(),

  // ── Status / Stage filters ─────────────────────────────────────────────────
  status:              z.enum([...LEAD_STATUSES, "All"] as [string, ...string[]]).optional(),
  stage:               z.string().optional(),
  subStage:            z.string().optional(),

  // ── Lead attribute filters ─────────────────────────────────────────────────
  leadSource:          z.enum([...LEAD_SOURCES, "All"] as [string, ...string[]]).optional(),
  priority:            z.enum([...PRIORITIES, "All"] as [string, ...string[]]).optional(),
  studyPreference:     z.enum([...STUDY_PREFERENCES, "All"] as [string, ...string[]]).optional(),
  country:             z.string().optional(),

  // ── Employee filter ────────────────────────────────────────────────────────
  assignedEmployeeId:  z.string().optional(),
  assignedEmployee:    z.string().optional(),   // legacy name-string fallback

  // ── Date range filters ─────────────────────────────────────────────────────
  startDate:           z.string().optional(),   // lead createdAt >= startDate
  endDate:             z.string().optional(),   // lead createdAt <= endDate

  // ── Follow-up automation filter ────────────────────────────────────────────
  followUpStatus:      z.enum(FOLLOW_UP_STATUSES).optional().default("all"),

  // ── Sort ───────────────────────────────────────────────────────────────────
  sortBy:              z.enum(SORT_FIELDS).optional().default("createdAt"),
  sortOrder:           z.enum(SORT_ORDERS).optional().default("desc"),

  // ── Pagination ─────────────────────────────────────────────────────────────
  page:                z.coerce.number().int().positive().default(1),
  limit:               z.coerce.number().int().positive().max(100).default(10),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateLeadInput  = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput  = z.infer<typeof updateLeadSchema>;
export type CreateNoteInput  = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput  = z.infer<typeof updateNoteSchema>;
export type LeadsQueryInput  = z.infer<typeof leadsQuerySchema>;
