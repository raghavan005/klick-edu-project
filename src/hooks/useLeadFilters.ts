// ─── useLeadFilters ───────────────────────────────────────────────────────────
// Persists all filter + sort + pagination state in the URL query string.
// Reading from URL on mount means Back / Forward / Refresh all restore state.
// ──────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

export interface LeadFilters {
  search:          string;
  status:          string;
  stage:           string;
  subStage:        string;
  leadSource:      string;
  priority:        string;
  studyPreference: string;
  country:         string;
  assignedEmployeeId: string;
  startDate:       string;
  endDate:         string;
  followUpStatus:  string;
  sortBy:          string;
  sortOrder:       "asc" | "desc";
  page:            number;
  limit:           number;
}

const DEFAULTS: LeadFilters = {
  search:             "",
  status:             "All",
  stage:              "All",
  subStage:           "All",
  leadSource:         "All",
  priority:           "All",
  studyPreference:    "All",
  country:            "",
  assignedEmployeeId: "All",
  startDate:          "",
  endDate:            "",
  followUpStatus:     "all",
  sortBy:             "createdAt",
  sortOrder:          "desc",
  page:               1,
  limit:              10,
};

function readFilters(params: URLSearchParams): LeadFilters {
  return {
    search:             params.get("search")             ?? DEFAULTS.search,
    status:             params.get("status")             ?? DEFAULTS.status,
    stage:              params.get("stage")              ?? DEFAULTS.stage,
    subStage:           params.get("subStage")           ?? DEFAULTS.subStage,
    leadSource:         params.get("leadSource")         ?? DEFAULTS.leadSource,
    priority:           params.get("priority")           ?? DEFAULTS.priority,
    studyPreference:    params.get("studyPreference")    ?? DEFAULTS.studyPreference,
    country:            params.get("country")            ?? DEFAULTS.country,
    assignedEmployeeId: params.get("assignedEmployeeId") ?? DEFAULTS.assignedEmployeeId,
    startDate:          params.get("startDate")          ?? DEFAULTS.startDate,
    endDate:            params.get("endDate")            ?? DEFAULTS.endDate,
    followUpStatus:     params.get("followUpStatus")     ?? DEFAULTS.followUpStatus,
    sortBy:             params.get("sortBy")             ?? DEFAULTS.sortBy,
    sortOrder:          (params.get("sortOrder") as "asc" | "desc") ?? DEFAULTS.sortOrder,
    page:               Number(params.get("page"))       || DEFAULTS.page,
    limit:              Number(params.get("limit"))      || DEFAULTS.limit,
  };
}

function filtersToParams(f: LeadFilters): Record<string, string> {
  const out: Record<string, string> = {};
  const d = DEFAULTS;
  if (f.search)                       out.search             = f.search;
  if (f.status !== d.status)          out.status             = f.status;
  if (f.stage  !== d.stage)           out.stage              = f.stage;
  if (f.subStage !== d.subStage)      out.subStage           = f.subStage;
  if (f.leadSource !== d.leadSource)  out.leadSource         = f.leadSource;
  if (f.priority !== d.priority)      out.priority           = f.priority;
  if (f.studyPreference !== d.studyPreference) out.studyPreference = f.studyPreference;
  if (f.country)                      out.country            = f.country;
  if (f.assignedEmployeeId !== d.assignedEmployeeId) out.assignedEmployeeId = f.assignedEmployeeId;
  if (f.startDate)                    out.startDate          = f.startDate;
  if (f.endDate)                      out.endDate            = f.endDate;
  if (f.followUpStatus !== d.followUpStatus) out.followUpStatus = f.followUpStatus;
  if (f.sortBy !== d.sortBy)          out.sortBy             = f.sortBy;
  if (f.sortOrder !== d.sortOrder)    out.sortOrder          = f.sortOrder;
  if (f.page !== d.page)              out.page               = String(f.page);
  if (f.limit !== d.limit)            out.limit              = String(f.limit);
  return out;
}

export function useLeadFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFiltersState] = useState<LeadFilters>(() => readFilters(searchParams));

  // Debounced search — update URL only after 350ms idle
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync to URL whenever filters change
  const setFilters = useCallback((updater: Partial<LeadFilters> | ((prev: LeadFilters) => Partial<LeadFilters>)) => {
    setFiltersState((prev) => {
      const patch = typeof updater === "function" ? updater(prev) : updater;
      const next  = { ...prev, ...patch };
      // Any filter change resets to page 1 (unless page itself is being set)
      if (!("page" in patch)) next.page = 1;
      return next;
    });
  }, []);

  // Flush filter state → URL (debounce search only, everything else is instant)
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchParams(filtersToParams(filters), { replace: true });
    }, filters.search !== (readFilters(searchParams).search) ? 350 : 0);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULTS);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const hasActiveFilters =
    filters.search             !== DEFAULTS.search             ||
    filters.status             !== DEFAULTS.status             ||
    filters.stage              !== DEFAULTS.stage              ||
    filters.subStage           !== DEFAULTS.subStage           ||
    filters.leadSource         !== DEFAULTS.leadSource         ||
    filters.priority           !== DEFAULTS.priority           ||
    filters.studyPreference    !== DEFAULTS.studyPreference    ||
    filters.country            !== DEFAULTS.country            ||
    filters.assignedEmployeeId !== DEFAULTS.assignedEmployeeId ||
    filters.startDate          !== DEFAULTS.startDate          ||
    filters.endDate            !== DEFAULTS.endDate            ||
    filters.followUpStatus     !== DEFAULTS.followUpStatus;

  return { filters, setFilters, resetFilters, hasActiveFilters };
}
