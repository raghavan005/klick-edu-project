"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, MapPin, BookOpen, Briefcase, Calendar, Flag } from "lucide-react";

import { useEmployees } from "../hooks/useEmployees";
import {
  STAGE_NAMES, getSubStagesFor, getDefaultSubStage,
  isValidSubStage, formatLeadSource, formatStudyPreference,
  type StageName,
} from "../lib/stageConfig";
import { LEAD_SOURCES, PRIORITIES, STUDY_PREFERENCES, LEAD_STATUSES } from "../lib/constants";

// ─── Form Schema (client-side) ────────────────────────────────────────────────

const leadFormSchema = z.object({
  fullName:          z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  email:             z.string().email("Please enter a valid email").toLowerCase().trim(),
  phone:             z.string().regex(/^\+?[0-9]{7,15}$/, "Phone: 7–15 digits, + prefix allowed"),
  country:           z.string().min(1, "Country is required").default("India"),
  state:             z.string().optional(),
  district:          z.string().optional(),
  city:              z.string().optional(),
  leadSource:        z.string().default("Google_Ads"),
  assignedEmployeeId: z.string().optional().nullable(),
  courseInterest:    z.string().min(2, "Course interest is required").max(200).trim(),
  studyPreference:   z.string().default("India"),
  preferredCountry:  z.string().optional(),
  stage:             z.string().default("New"),
  subStage:          z.string().default("Not_Contacted"),
  priority:          z.string().default("Medium"),
  status:            z.string().default("New"),
  nextFollowUpDate:  z.string().optional(),
  lastContactedDate: z.string().optional(),
  remarks:           z.string().max(2000).optional(),
}).refine(
  (data) => {
    if (!STAGE_NAMES.includes(data.stage as StageName)) return false;
    return isValidSubStage(data.stage as StageName, data.subStage);
  },
  { message: "Sub-stage is not valid for the selected stage", path: ["subStage"] },
);

export type LeadFormValues = z.infer<typeof leadFormSchema>;

// ─── Props ───────────────────────────────────────────────────────────────────

interface LeadFormProps {
  mode:        "create" | "edit";
  defaultValues?: Partial<LeadFormValues>;
  isSubmitting?: boolean;
  onSubmit:    (data: LeadFormValues) => void;
  onCancel:    () => void;
}

// ─── Field helpers ────────────────────────────────────────────────────────────

const labelClass = "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";
const inputClass =
  "w-full px-3 py-2 skeuo-input rounded-xl text-sm focus:outline-none focus:skeuo-input-focus transition-all text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500";
const selectClass =
  "w-full px-3 py-2 skeuo-input rounded-xl text-sm focus:outline-none focus:skeuo-input-focus font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800";
const errorClass = "text-rose-500 text-xs font-medium mt-0.5";
const errorInputClass = "border-rose-400 focus:ring-rose-500/20";

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">
      <span className="text-indigo-500">{icon}</span>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h3>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LeadForm({ mode, defaultValues, isSubmitting, onSubmit, onCancel }: LeadFormProps) {
  const { data: employees = [], isLoading: empLoading } = useEmployees();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      country:        "India",
      leadSource:     "Google_Ads",
      studyPreference: "India",
      stage:          "New",
      subStage:       "Not_Contacted",
      priority:       "Medium",
      status:         "New",
      ...defaultValues,
    },
  });

  const watchedStage         = watch("stage") as StageName;
  const watchedSubStage      = watch("subStage");
  const watchedStudyPref     = watch("studyPreference");

  // ── Stage → Sub-stage dependency ──────────────────────────────────────────
  useEffect(() => {
    const validStage = STAGE_NAMES.includes(watchedStage as StageName)
      ? (watchedStage as StageName)
      : "New";

    const isCurrentSubStageValid = isValidSubStage(validStage, watchedSubStage);
    if (!isCurrentSubStageValid) {
      setValue("subStage", getDefaultSubStage(validStage), { shouldValidate: true });
    }
  }, [watchedStage, watchedSubStage, setValue]);

  const currentStage    = STAGE_NAMES.includes(watchedStage as StageName) ? (watchedStage as StageName) : "New";
  const subStageOptions = getSubStagesFor(currentStage);
  const showPreferredCountry = watchedStudyPref === "Abroad";

  const courseOptions = [
    "Full Stack Web Development",
    "Data Science & AI",
    "UI/UX Design",
    "Cloud Architecture",
    "Cybersecurity Professional",
    "Mobile App Development",
    "DevOps Engineering",
    "Other",
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* ── Personal Information ─────────────────────────────────────────── */}
      <div>
        <SectionHeader icon={<User className="w-3.5 h-3.5" />} title="Personal Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="sm:col-span-2">
            <label className={labelClass}>Full Name <span className="text-rose-500">*</span></label>
            <input {...register("fullName")} placeholder="e.g. Arjun Mehta"
              className={`${inputClass} ${errors.fullName ? errorInputClass : ""}`} />
            {errors.fullName && <p className={errorClass}>{errors.fullName.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Email <span className="text-rose-500">*</span></label>
            <input {...register("email")} type="email" placeholder="name@example.com"
              className={`${inputClass} ${errors.email ? errorInputClass : ""}`} />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Phone <span className="text-rose-500">*</span></label>
            <input {...register("phone")} placeholder="+919876543210"
              className={`${inputClass} ${errors.phone ? errorInputClass : ""}`} />
            {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
          </div>

        </div>
      </div>

      {/* ── Location ─────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader icon={<MapPin className="w-3.5 h-3.5" />} title="Location" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

          <div>
            <label className={labelClass}>Country</label>
            <input {...register("country")} placeholder="India"
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>State</label>
            <input {...register("state")} placeholder="Maharashtra"
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>District</label>
            <input {...register("district")} placeholder="Mumbai City"
              className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>City</label>
            <input {...register("city")} placeholder="Mumbai"
              className={inputClass} />
          </div>

        </div>
      </div>

      {/* ── Lead Information ─────────────────────────────────────────────── */}
      <div>
        <SectionHeader icon={<Briefcase className="w-3.5 h-3.5" />} title="Lead Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label className={labelClass}>Lead Source</label>
            <select {...register("leadSource")} className={selectClass}>
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>{formatLeadSource(s)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Assigned Employee</label>
            <select {...register("assignedEmployeeId")} className={selectClass}
              disabled={empLoading}>
              <option value="">— Unassigned —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Course Interest <span className="text-rose-500">*</span></label>
            <select {...register("courseInterest")}
              className={`${selectClass} ${errors.courseInterest ? errorInputClass : ""}`}>
              <option value="">— Select course —</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.courseInterest && <p className={errorClass}>{errors.courseInterest.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Study Preference</label>
            <select {...register("studyPreference")} className={selectClass}>
              {STUDY_PREFERENCES.map((p) => (
                <option key={p} value={p}>{formatStudyPreference(p)}</option>
              ))}
            </select>
          </div>

          {showPreferredCountry && (
            <div className="sm:col-span-2">
              <label className={labelClass}>Preferred Country</label>
              <input {...register("preferredCountry")} placeholder="e.g. Canada, UK, Australia"
                className={inputClass} />
            </div>
          )}

        </div>
      </div>

      {/* ── Sales Pipeline ───────────────────────────────────────────────── */}
      <div>
        <SectionHeader icon={<Flag className="w-3.5 h-3.5" />} title="Sales Pipeline" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

          <div>
            <label className={labelClass}>Stage</label>
            <select {...register("stage")} className={selectClass}>
              {STAGE_NAMES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Sub-stage</label>
            <select {...register("subStage")} className={selectClass}>
              {subStageOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Priority</label>
            <select {...register("priority")} className={selectClass}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select {...register("status")} className={selectClass}>
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* ── Follow-up ────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader icon={<Calendar className="w-3.5 h-3.5" />} title="Follow-up" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label className={labelClass}>Next Follow-up Date</label>
            <input {...register("nextFollowUpDate")} type="date"
              className={`${inputClass} ${errors.nextFollowUpDate ? errorInputClass : ""}`} />
            {errors.nextFollowUpDate && <p className={errorClass}>{errors.nextFollowUpDate.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Last Contacted Date</label>
            <input {...register("lastContactedDate")} type="date"
              className={inputClass} />
          </div>

        </div>
      </div>

      {/* ── Remarks ──────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader icon={<BookOpen className="w-3.5 h-3.5" />} title="Additional" />
        <div>
          <label className={labelClass}>Remarks</label>
          <textarea {...register("remarks")} rows={3}
            placeholder="Internal notes about this lead…"
            className={`${inputClass} resize-none`} />
          {errors.remarks && <p className={errorClass}>{errors.remarks.message}</p>}
        </div>
      </div>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button type="button" onClick={onCancel} disabled={isSubmitting}
          className="px-4 py-2 skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="px-5 py-2 skeuo-button-primary hover:skeuo-button-primary-hover active:skeuo-button-primary-active rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2 disabled:opacity-60">
          {isSubmitting ? (
            <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg> Saving…</>
          ) : (
            mode === "create" ? "Create Lead" : "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
}
