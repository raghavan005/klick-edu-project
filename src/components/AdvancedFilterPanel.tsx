// ─── AdvancedFilterPanel ──────────────────────────────────────────────────────
// Collapsible advanced filter panel. Renders all server-side filter fields.
// Calls setFilters from useLeadFilters — no local state, URL is the truth.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Filter, ChevronDown, ChevronUp, X, Calendar, Search,
  AlertTriangle, Clock, CheckCircle2,
} from "lucide-react";
import type { LeadFilters } from "../hooks/useLeadFilters";
import { useEmployees }        from "../hooks/useEmployees";
import { LEAD_STATUSES, LEAD_SOURCES, PRIORITIES, STUDY_PREFERENCES } from "../lib/constants";
import { STAGE_NAMES, STAGE_CONFIG, getSubStagesFor, type StageName } from "../lib/stageConfig";

const sel  = "w-full px-3 py-2 skeuo-input rounded-xl text-xs focus:outline-none focus:skeuo-input-focus font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800";
const lbl  = "block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1";
const inp  = "w-full px-3 py-2 skeuo-input rounded-xl text-xs focus:outline-none focus:skeuo-input-focus text-slate-900 dark:text-slate-50 placeholder-slate-400";

const FOLLOW_UP_OPTIONS = [
  { value: "all",         label: "All",             icon: null },
  { value: "overdue",     label: "Overdue",         icon: "red"   },
  { value: "due_today",   label: "Due Today",       icon: "amber" },
  { value: "upcoming",    label: "Upcoming",        icon: "blue"  },
  { value: "no_followup", label: "No Follow-up",   icon: "slate" },
] as const;

interface Props {
  filters:       LeadFilters;
  setFilters:    (patch: Partial<LeadFilters>) => void;
  resetFilters:  () => void;
  hasActive:     boolean;
  activeCount:   number;
}

export default function AdvancedFilterPanel({
  filters, setFilters, resetFilters, hasActive, activeCount,
}: Props) {
  const [open, setOpen] = useState(false);
  const { data: employees = [] } = useEmployees();

  // Stage → sub-stage dependency
  const currentStage     = STAGE_NAMES.includes(filters.stage as StageName)
    ? (filters.stage as StageName) : null;
  const subStageOptions  = currentStage ? getSubStagesFor(currentStage) : [];

  return (
    <div className="skeuo-card rounded-2xl overflow-hidden">
      {/* ── Toolbar row ── */}
      <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">

        {/* Search */}
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Search name, email, phone, city…"
            className="w-full pl-9 pr-8 py-2 skeuo-input rounded-xl text-sm focus:outline-none focus:skeuo-input-focus text-slate-900 dark:text-slate-50 placeholder-slate-400"
          />
          {filters.search && (
            <button type="button" onClick={() => setFilters({ search: "" })}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick status */}
        <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value })}
          className="w-full sm:w-36 px-3 py-2 skeuo-input rounded-xl text-sm focus:outline-none focus:skeuo-input-focus text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800">
          <option value="All">All Statuses</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Quick employee */}
        <select value={filters.assignedEmployeeId}
          onChange={(e) => setFilters({ assignedEmployeeId: e.target.value })}
          className="w-full sm:w-44 px-3 py-2 skeuo-input rounded-xl text-sm focus:outline-none focus:skeuo-input-focus text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800">
          <option value="All">All Assignees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        {/* Follow-up quick filter */}
        <select value={filters.followUpStatus}
          onChange={(e) => setFilters({ followUpStatus: e.target.value })}
          className="w-full sm:w-40 px-3 py-2 skeuo-input rounded-xl text-sm focus:outline-none focus:skeuo-input-focus text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800">
          {FOLLOW_UP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Advanced toggle */}
        <button type="button" onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            open || hasActive
              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700"
              : "skeuo-button hover:skeuo-button-hover text-slate-600 dark:text-slate-300"
          }`}>
          <Filter className="w-3.5 h-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="bg-indigo-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {hasActive && (
          <button type="button" onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-rose-200 dark:border-rose-800 cursor-pointer whitespace-nowrap transition-colors">
            <X className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {/* ── Expandable advanced panel ── */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="advanced"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-6 pb-5 pt-1 border-t border-slate-100 dark:border-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">

                {/* Stage */}
                <div>
                  <label className={lbl}>Stage</label>
                  <select value={filters.stage}
                    onChange={(e) => setFilters({ stage: e.target.value, subStage: "All" })}
                    className={sel}>
                    <option value="All">All Stages</option>
                    {STAGE_NAMES.map((s) => (
                      <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>

                {/* Sub-stage */}
                <div>
                  <label className={lbl}>Sub-stage</label>
                  <select value={filters.subStage}
                    onChange={(e) => setFilters({ subStage: e.target.value })}
                    disabled={!currentStage}
                    className={sel}>
                    <option value="All">All Sub-stages</option>
                    {subStageOptions.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className={lbl}>Priority</label>
                  <select value={filters.priority}
                    onChange={(e) => setFilters({ priority: e.target.value })}
                    className={sel}>
                    <option value="All">All Priorities</option>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Lead Source */}
                <div>
                  <label className={lbl}>Lead Source</label>
                  <select value={filters.leadSource}
                    onChange={(e) => setFilters({ leadSource: e.target.value })}
                    className={sel}>
                    <option value="All">All Sources</option>
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>

                {/* Study Preference */}
                <div>
                  <label className={lbl}>Study Preference</label>
                  <select value={filters.studyPreference}
                    onChange={(e) => setFilters({ studyPreference: e.target.value })}
                    className={sel}>
                    <option value="All">All Preferences</option>
                    {STUDY_PREFERENCES.map((p) => (
                      <option key={p} value={p}>{p.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className={lbl}>Country</label>
                  <input type="text" value={filters.country}
                    onChange={(e) => setFilters({ country: e.target.value })}
                    placeholder="e.g. India"
                    className={inp} />
                </div>

                {/* Date added from */}
                <div>
                  <label className={lbl}>Date Added From</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input type="date" value={filters.startDate}
                      onChange={(e) => setFilters({ startDate: e.target.value })}
                      className={`${inp} pl-8`} />
                  </div>
                </div>

                {/* Date added to */}
                <div>
                  <label className={lbl}>Date Added To</label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input type="date" value={filters.endDate}
                      onChange={(e) => setFilters({ endDate: e.target.value })}
                      className={`${inp} pl-8`} />
                  </div>
                </div>

                {/* Follow-up status (full) */}
                <div>
                  <label className={lbl}>Follow-up Status</label>
                  <select value={filters.followUpStatus}
                    onChange={(e) => setFilters({ followUpStatus: e.target.value })}
                    className={sel}>
                    {FOLLOW_UP_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Active filter chips */}
              {hasActive && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">Active:</span>
                  {filters.status !== "All" && <Chip label={`Status: ${filters.status}`} onRemove={() => setFilters({ status: "All" })} />}
                  {filters.stage  !== "All" && <Chip label={`Stage: ${filters.stage}`}   onRemove={() => setFilters({ stage: "All", subStage: "All" })} />}
                  {filters.subStage !== "All" && <Chip label={`Sub-stage: ${filters.subStage.replace(/_/g, " ")}`} onRemove={() => setFilters({ subStage: "All" })} />}
                  {filters.priority !== "All" && <Chip label={`Priority: ${filters.priority}`} onRemove={() => setFilters({ priority: "All" })} />}
                  {filters.leadSource !== "All" && <Chip label={`Source: ${filters.leadSource.replace(/_/g, " ")}`} onRemove={() => setFilters({ leadSource: "All" })} />}
                  {filters.studyPreference !== "All" && <Chip label={`Study: ${filters.studyPreference}`} onRemove={() => setFilters({ studyPreference: "All" })} />}
                  {filters.country && <Chip label={`Country: ${filters.country}`} onRemove={() => setFilters({ country: "" })} />}
                  {filters.assignedEmployeeId !== "All" && <Chip label="Employee filter" onRemove={() => setFilters({ assignedEmployeeId: "All" })} />}
                  {filters.startDate && <Chip label={`From: ${filters.startDate}`} onRemove={() => setFilters({ startDate: "" })} />}
                  {filters.endDate   && <Chip label={`To: ${filters.endDate}`}     onRemove={() => setFilters({ endDate: "" })} />}
                  {filters.followUpStatus !== "all" && <Chip label={`Follow-up: ${filters.followUpStatus.replace(/_/g, " ")}`} onRemove={() => setFilters({ followUpStatus: "all" })} />}
                  {filters.search && <Chip label={`"${filters.search}"`} onRemove={() => setFilters({ search: "" })} />}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
      {label}
      <button type="button" onClick={onRemove} className="cursor-pointer hover:text-indigo-900 dark:hover:text-indigo-100">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}
