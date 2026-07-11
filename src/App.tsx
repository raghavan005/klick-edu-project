import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  User,
  Phone,
  Mail,
  Eye,
  Edit,
  X,
  Plus,
  AlertCircle,
  Inbox,
  Copy,
  MoreHorizontal,
  Download,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
  Command,
  ChevronLeft,
  ChevronRight,
  Search,
  LogOut,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import CommandPalette from "./components/CommandPalette";
import ThemeToggle from "./components/ThemeToggle";
import { LegacyLead, LeadStatus, LegacyLeadsResponse, ExtendedLegacyLead } from "./types";
import LeadDetailsModal from "./components/LeadDetailsModal";
import LeadEditModal from "./components/LeadEditModal";
import CreateLeadModal from "./components/CreateLeadModal";
import DeleteLeadDialog from "./components/DeleteLeadDialog";
import DashboardSection from "./components/dashboard/DashboardSection";
import AdvancedFilterPanel from "./components/AdvancedFilterPanel";
import SortableHeader from "./components/SortableHeader";
import FollowUpBadge from "./components/FollowUpBadge";
import BulkActionBar from "./components/BulkActionBar";
import { useEmployees } from "./hooks/useEmployees";
import { useLeadFilters } from "./hooks/useLeadFilters";
import { useAuth } from "./context/AuthContext";
import {
  deleteLead,
  bulkDeleteLeads,
  bulkUpdateStatus,
  bulkAssignLeads,
} from "./lib/leadApi";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";

import { authFetch } from "./lib/auth";

// ─── Shared animation variants ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

const fadeDown = {
  hidden: { opacity: 0, y: -16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } },
};

const staggerContainer = (stagger = 0.07, delayStart = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delayStart } },
});

const rowVariant = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 280, damping: 26 } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.18 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 320, damping: 22 } },
};

// ─── UserMenu ─────────────────────────────────────────────────────────────────

function UserMenu() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2.5 py-1.5 skeuo-button hover:skeuo-button-hover rounded-xl cursor-pointer transition-all"
      >
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-white">
            {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
            {user.name.split(" ")[0]}
          </div>
          <div className={`text-[10px] font-bold ${isAdmin ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {user.role}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">
                      {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">{user.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                  </div>
                </div>
              </div>

              {/* Role badge */}
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold ${
                  isAdmin
                    ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                }`}>
                  <ShieldCheck className="w-3 h-3" />
                  {isAdmin ? "Administrator" : "Staff Member"}
                </div>
                {!isAdmin && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                    You can view and update leads assigned to you.
                  </p>
                )}
              </div>

              {/* Logout */}
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => { setOpen(false); logout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const { user, isAdmin }  = useAuth();     // user must be set before any API call

  // ── URL-persisted filter state ──────────────────────────────────────────────
  const { filters, setFilters, resetFilters, hasActiveFilters } = useLeadFilters();

  // Count how many non-default filters are active (for the badge on the Filters button)
  const activeFilterCount = [
    filters.status !== "All",
    filters.stage  !== "All",
    filters.subStage !== "All",
    filters.leadSource !== "All",
    filters.priority !== "All",
    filters.studyPreference !== "All",
    filters.country !== "",
    filters.assignedEmployeeId !== "All",
    filters.startDate !== "",
    filters.endDate !== "",
    filters.followUpStatus !== "all",
    filters.search !== "",
  ].filter(Boolean).length;

  // Tab state
  const [currentTab, setCurrentTab] = useState<"dashboard" | "leads">("dashboard");


  // Data state
  const [leads, setLeads]           = useState<LegacyLead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Toast state
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);

  // Modal / dropdown state
  const [activeDropdownId, setActiveDropdownId]     = useState<string | null>(null);
  const [selectedLeadForView, setSelectedLeadForView] = useState<LegacyLead | null>(null);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<ExtendedLegacyLead | null>(null);
  const [showCreateModal, setShowCreateModal]         = useState(false);
  const [leadToDelete, setLeadToDelete]               = useState<ExtendedLegacyLead | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen]   = useState(false);

  // ── Bulk selection (ADMIN only) ─────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toggle a single row
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Select / deselect all visible leads
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allIds = leads.map((l) => l.id);
      const allSelected = allIds.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(allIds);
    });
  }, [leads]);

  // Clear selection (called after bulk action completes)
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Deselect leads that are no longer in the current page after a refresh
  useEffect(() => {
    const pageIds = new Set(leads.map((l) => l.id));
    setSelectedIds((prev) => new Set([...prev].filter((id) => pageIds.has(id))));
  }, [leads]);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied!`, "success");
  };

  useEffect(() => {
    const handleSwitchTab = (e: CustomEvent<any>) => {
      setCurrentTab("leads");
      if (e.detail) {
        setFilters(e.detail);
      }
    };
    window.addEventListener("switch-to-leads-tab", handleSwitchTab as EventListener);
    return () => window.removeEventListener("switch-to-leads-tab", handleSwitchTab as EventListener);
  }, [setFilters]);

  const refreshDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }, [queryClient]);

  // ── Sort toggle helper ──────────────────────────────────────────────────────
  const handleSort = useCallback((field: string) => {
    setFilters((prev) => ({
      sortBy:    field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "desc" ? "asc" : "desc",
      page:      1,
    }));
  }, [setFilters]);

  // ── Fetch leads ─────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    // Don't fire until authenticated — avoids 401 on first render
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search)                          params.set("search",             filters.search);
      if (filters.status !== "All")                params.set("status",             filters.status);
      if (filters.stage  !== "All")                params.set("stage",              filters.stage);
      if (filters.subStage !== "All")              params.set("subStage",           filters.subStage);
      if (filters.leadSource !== "All")            params.set("leadSource",         filters.leadSource);
      if (filters.priority !== "All")              params.set("priority",           filters.priority);
      if (filters.studyPreference !== "All")       params.set("studyPreference",    filters.studyPreference);
      if (filters.country)                         params.set("country",            filters.country);
      if (filters.assignedEmployeeId !== "All")    params.set("assignedEmployeeId", filters.assignedEmployeeId);
      if (filters.startDate)                       params.set("startDate",          filters.startDate);
      if (filters.endDate)                         params.set("endDate",            filters.endDate);
      if (filters.followUpStatus !== "all")        params.set("followUpStatus",     filters.followUpStatus);
      if (filters.sortBy !== "createdAt")          params.set("sortBy",             filters.sortBy);
      if (filters.sortOrder !== "desc")            params.set("sortOrder",          filters.sortOrder);
      params.set("page",  String(filters.page));
      params.set("limit", String(filters.limit));

      const res = await authFetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load leads.");
      const data: LegacyLeadsResponse = await res.json();
      setLeads(data.leads);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      // Sync page from server (clamps to valid range)
      if (data.currentPage !== filters.page) {
        setFilters({ page: data.currentPage });
      }
    } catch (err: any) {
      setError(err.message);
      showToast("Failed to load leads.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [filters, setFilters, showToast, user]);

  // Re-fetch whenever filters or auth state changes
  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ── CRUD callbacks ──────────────────────────────────────────────────────────
  const handleLeadUpdated = useCallback((updatedLead: ExtendedLegacyLead) => {
    setLeads((prev) => prev.map((l) => l.id === updatedLead.id ? updatedLead : l));
    if (selectedLeadForView?.id === updatedLead.id) setSelectedLeadForView(updatedLead);
    refreshDashboard();
  }, [selectedLeadForView, refreshDashboard]);

  const handleLeadCreated = useCallback((_created: ExtendedLegacyLead) => {
    fetchLeads();
    refreshDashboard();
  }, [fetchLeads, refreshDashboard]);

  const handleLeadDeleted = useCallback(async () => {
    if (!leadToDelete) return;
    const deleted = leadToDelete;
    const prev = [...leads];
    setLeads((l) => l.filter((x) => x.id !== deleted.id));
    setLeadToDelete(null);
    try {
      await deleteLead(deleted.id);
      showToast(`Lead "${deleted.name}" deleted.`, "success");
      refreshDashboard();
    } catch (err: unknown) {
      setLeads(prev);
      showToast(err instanceof Error ? err.message : "Failed to delete lead.", "error");
      throw err;
    }
  }, [leadToDelete, leads, showToast, refreshDashboard]);

  // ── Bulk action handlers ─────────────────────────────────────────────────────

  const handleBulkDelete = useCallback(async () => {
    const ids = leads.map(l => l.id);
    // Optimistic removal
    setLeads([]);
        try {
      const { deleted } = await bulkDeleteLeads(ids);
      showToast(`${deleted} lead${deleted !== 1 ? "s" : ""} deleted.`, "success");
      fetchLeads();
      refreshDashboard();
    } catch (err: unknown) {
      fetchLeads(); // re-fetch to restore
      showToast(err instanceof Error ? err.message : "Bulk delete failed.", "error");
    }
  }, [leads, showToast, fetchLeads, refreshDashboard]);

  const handleBulkStatus = useCallback(async (status: string) => {
    const ids = leads.map(l => l.id);
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => ({ ...l, status: status as LeadStatus }))
    );
        try {
      const { updated } = await bulkUpdateStatus(ids, status);
      showToast(`${updated} lead${updated !== 1 ? "s" : ""} set to "${status}".`, "success");
      refreshDashboard();
    } catch (err: unknown) {
      fetchLeads();
      showToast(err instanceof Error ? err.message : "Bulk status update failed.", "error");
    }
  }, [leads, showToast, fetchLeads, refreshDashboard]);

  const handleBulkAssign = useCallback(async (employeeId: string | null) => {
    const ids = leads.map(l => l.id);
        try {
      const { updated } = await bulkAssignLeads(ids, employeeId);
      showToast(`${updated} lead${updated !== 1 ? "s" : ""} reassigned.`, "success");
      fetchLeads();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Bulk assign failed.", "error");
    }
  }, [leads, showToast, fetchLeads]);

  const handleExport = useCallback(async () => {
    try {
      showToast("Exporting leads...", "info");
      const params = new URLSearchParams();
      if (filters.search)                          params.set("search",             filters.search);
      if (filters.status !== "All")                params.set("status",             filters.status);
      if (filters.stage !== "All")                 params.set("stage",              filters.stage);
      if (filters.subStage !== "All")              params.set("subStage",           filters.subStage);
      if (filters.priority !== "All")              params.set("priority",           filters.priority);
      if (filters.leadSource !== "All")            params.set("leadSource",         filters.leadSource);
      if (filters.studyPreference !== "All")       params.set("studyPreference",    filters.studyPreference);
      if (filters.country)                         params.set("country",            filters.country);
      if (filters.assignedEmployeeId !== "All")    params.set("assignedEmployeeId", filters.assignedEmployeeId);
      if (filters.startDate)                       params.set("startDate",          filters.startDate);
      if (filters.endDate)                         params.set("endDate",            filters.endDate);
      if (filters.followUpStatus !== "all")        params.set("followUpStatus",     filters.followUpStatus);
      if (filters.sortBy !== "createdAt")          params.set("sortBy",             filters.sortBy);
      if (filters.sortOrder !== "desc")            params.set("sortOrder",          filters.sortOrder);
      
      const res = await authFetch(`/api/leads/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export leads");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "leads_export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Export complete.", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Export failed.", "error");
    }
  }, [filters, showToast]);

  // ── Status badge ─────────────────────────────────────────────────────────────
  const renderStatusBadge = (status: LeadStatus) => {
    const map: Record<string, { bg: string; dot: string }> = {
      New:       { bg: "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-700/50",         dot: "bg-sky-500 animate-pulse" },
      Contacted: { bg: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-700/50", dot: "bg-amber-500" },
      Qualified: { bg: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-700/50", dot: "bg-purple-500" },
      Proposal:  { bg: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-700/50", dot: "bg-indigo-500" },
      Won:       { bg: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-700/50", dot: "bg-emerald-500" },
      Lost:      { bg: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-700/50", dot: "bg-rose-500" },
    };
    const { bg = "bg-slate-50 text-slate-700 border-slate-200", dot = "bg-slate-400" } = map[status] ?? {};
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${bg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 flex flex-col font-sans">

      {/* Upper Brand Bar */}
      <motion.header
        variants={fadeDown}
        initial="hidden"
        animate="show"
        className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-xs"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.1 }}
          >
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 leading-none">ERP Portal</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Sales & Lead Pipeline</p>
            </div>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.15 }}
          >
            <ThemeToggle />
            <motion.button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-lg font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
              title="Open command palette (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Search…</span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </motion.button>
            <div className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full font-mono font-medium text-slate-600 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              REST API Connected
            </div>
            <UserMenu />
          </motion.div>
        </div>
      </motion.header>

      {/* Main Container */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Module Title & Subheader */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          variants={staggerContainer(0.1, 0.2)}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp}>
            <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50 tracking-tight">Lead Management Module</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Track, filter, and log customer acquisition lifecycles.</p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {isAdmin && leads.length > 0 && (
              <div className="relative">
                <motion.button
                  variants={fadeUp}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setActiveDropdownId(activeDropdownId === "bulk" ? null : "bulk")}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-lg font-bold cursor-pointer text-slate-700 dark:text-slate-200"
                >
                  <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Bulk Actions ({leads.length})
                </motion.button>
                <AnimatePresence>
                  {activeDropdownId === "bulk" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 sm:left-0 mt-2 w-48 sm:w-56 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                    >
                      <div className="p-1">
                        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Update Status</div>
                        {["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"].map((status) => (
                          <button
                            key={status}
                            onClick={() => { setActiveDropdownId(null); handleBulkStatus(status); }}
                            className="w-full text-left px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            Set to {status}
                          </button>
                        ))}
                        <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                        <button
                          onClick={() => { setActiveDropdownId(null); handleBulkDelete(); }}
                          className="w-full text-left px-3 py-1.5 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors cursor-pointer flex items-center justify-between"
                        >
                          Delete Page
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <motion.button
              variants={fadeUp}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-lg font-bold cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Export
            </motion.button>
            <motion.button
              variants={fadeUp}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm skeuo-button-primary hover:skeuo-button-primary-hover active:skeuo-button-primary-active rounded-lg font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              New
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              id="refresh-leads-btn"
              onClick={fetchLeads}
              disabled={isLoading}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-lg font-semibold text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
            >
              <motion.span
                animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
                transition={isLoading ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }}
              >
                <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </motion.span>
              {isLoading ? "Fetching..." : "Force Refresh"}
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-6 border-b border-slate-200 dark:border-slate-700 mb-6 px-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button
            onClick={() => setCurrentTab("dashboard")}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 cursor-pointer ${
              currentTab === "dashboard"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            Analytics Dashboard
          </button>
          <button
            onClick={() => setCurrentTab("leads")}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 cursor-pointer ${
              currentTab === "leads"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            Leads Management
          </button>
        </div>

        {currentTab === "dashboard" && (
          <DashboardSection />
        )}

        {currentTab === "leads" && (
          <>
            {/* Advanced Filter Panel — replaces old toolbar */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
          <AdvancedFilterPanel
            filters={filters}
            setFilters={setFilters}
            resetFilters={() => { resetFilters(); showToast("Filters reset.", "info"); }}
            hasActive={hasActiveFilters}
            activeCount={activeFilterCount}
          />
        </motion.div>

        {/* Error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-800 dark:text-red-300 text-sm">Failed to load leads</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{error}</p>
                <button type="button" onClick={fetchLeads}
                  className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold cursor-pointer">
                  Retry
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lead table */}
        <motion.div
          className="skeuo-card rounded-2xl overflow-hidden"
          variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.55 }}
        >
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-b from-slate-50 dark:from-slate-800 to-slate-100 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700">
                  {/* Checkbox — ADMIN only */}
                  {isAdmin && (
                    <th className="pl-4 pr-2 py-3.5 w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all leads on this page"
                        checked={leads.length > 0 && leads.every((l) => selectedIds.has(l.id))}
                        ref={(el) => {
                          if (el) el.indeterminate = selectedIds.size > 0 && !leads.every((l) => selectedIds.has(l.id));
                        }}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded accent-indigo-600 cursor-pointer"
                      />
                    </th>
                  )}
                  <SortableHeader label="Lead Name"    field="fullName"         sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={handleSort} />
                  <th className="px-4 sm:px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mobile</th>
                  <th className="px-4 sm:px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</th>
                  <SortableHeader label="Status"       field="status"           sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={handleSort} />
                  <SortableHeader label="Priority"     field="priority"         sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={handleSort} />
                  <SortableHeader label="Stage"        field="stage"            sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={handleSort} />
                  <th className="px-4 sm:px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assignee</th>
                  <SortableHeader label="Created"      field="createdAt"        sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={handleSort} />
                  <SortableHeader label="Follow-up"    field="nextFollowUpDate" sortBy={filters.sortBy} sortOrder={filters.sortOrder} onSort={handleSort} />
                  <th className="px-4 sm:px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      {Array.from({ length: 10 }).map((__, ci) => (
                        <td key={ci} className="px-4 sm:px-6 py-4">
                          <div className={`h-4 bg-slate-200 dark:bg-slate-700 rounded ${ci === 9 ? "ml-auto w-12" : "w-24"}`} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  // Empty state row
                  <tr>
                    <td colSpan={isAdmin ? 11 : 10} className="px-6 py-16 text-center">
                      <div className="max-w-xs mx-auto flex flex-col items-center">
                        <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">No Leads Found</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                          We couldn't find any leads matching your active search terms or filters.
                        </p>
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-4 px-3.5 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Real leads
                  leads.map((lead, idx) => {
                    const extLead = lead as ExtendedLegacyLead & Record<string, any>;
                    return (
                    <motion.tr
                      key={lead.id}
                      variants={rowVariant}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      transition={{ delay: idx * 0.04 }}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        selectedIds.has(lead.id) ? "bg-indigo-50/40 dark:bg-indigo-900/10" :
                        extLead.followUpStatus === "overdue"   ? "bg-rose-50/30 dark:bg-rose-900/10" :
                        extLead.followUpStatus === "due_today" ? "bg-amber-50/30 dark:bg-amber-900/10" : ""
                      }`}
                    >
                      {/* Checkbox — ADMIN only */}
                      {isAdmin && (
                        <td className="pl-4 pr-2 py-3.5 w-10" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Select ${lead.name}`}
                            checked={selectedIds.has(lead.id)}
                            onChange={() => toggleSelect(lead.id)}
                            className="w-3.5 h-3.5 rounded accent-indigo-600 cursor-pointer"
                          />
                        </td>
                      )}
                      {/* Lead Name */}
                      <td className="px-4 sm:px-6 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-slate-50 text-sm leading-tight">{lead.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{lead.createdDate}</div>
                      </td>
                      {/* Mobile */}
                      <td className="px-4 sm:px-6 py-3.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <div className="flex items-center gap-1 group/copy">
                          <span>{lead.mobile}</span>
                          <button type="button" onClick={() => handleCopy(lead.mobile, "Mobile")}
                            className="opacity-0 group-hover/copy:opacity-100 p-0.5 rounded hover:text-indigo-600 cursor-pointer transition-opacity">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-4 sm:px-6 py-3.5 text-slate-500 dark:text-slate-400 text-xs">
                        <div className="flex items-center gap-1 group/copy max-w-[160px]">
                          <span className="truncate">{lead.email}</span>
                          <button type="button" onClick={() => handleCopy(lead.email, "Email")}
                            className="opacity-0 group-hover/copy:opacity-100 p-0.5 rounded hover:text-indigo-600 cursor-pointer transition-opacity shrink-0">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-4 sm:px-6 py-3.5">{renderStatusBadge(lead.status)}</td>
                      {/* Priority */}
                      <td className="px-4 sm:px-6 py-3.5">
                        {extLead.priority && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            extLead.priority === "Urgent" ? "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800" :
                            extLead.priority === "High"   ? "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800" :
                            extLead.priority === "Medium" ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                                                            "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                          }`}>{extLead.priority}</span>
                        )}
                      </td>
                      {/* Stage */}
                      <td className="px-4 sm:px-6 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <div>{extLead.stage || "—"}</div>
                        {extLead.subStage && extLead.subStage !== "Not_Contacted" && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {extLead.subStage.replace(/_/g, " ")}
                          </div>
                        )}
                      </td>
                      {/* Assignee */}
                      <td className="px-4 sm:px-6 py-3.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                        {lead.assignedEmployee || "—"}
                      </td>
                      {/* Created */}
                      <td className="px-4 sm:px-6 py-3.5 text-[11px] text-slate-400 dark:text-slate-500 font-mono whitespace-nowrap">
                        {lead.createdDate}
                      </td>
                      {/* Follow-up */}
                      <td className="px-4 sm:px-6 py-3.5">
                        <FollowUpBadge
                          status={extLead.followUpStatus ?? null}
                          followUpDate={extLead.nextFollowUpDate}
                        />
                      </td>
                      {/* Actions */}
                      <td className="px-4 sm:px-6 py-3.5 text-right">
                        <div className="relative inline-block text-left">
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); setActiveDropdownId(activeDropdownId === lead.id ? null : lead.id); }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer transition-all">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {activeDropdownId === lead.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: -6 }}
                                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 z-40 py-1.5 origin-top-right"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    navigate(`/leads/${lead.id}`);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold cursor-pointer text-left"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                  View Details & Notes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    setSelectedLeadForEdit(lead as ExtendedLegacyLead);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold cursor-pointer text-left"
                                >
                                  <Edit className="w-3.5 h-3.5 text-amber-500" />
                                  Edit Information
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    setLeadToDelete(lead as ExtendedLegacyLead);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-semibold cursor-pointer text-left"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete Lead
                                </button>
                                <hr className="my-1 border-slate-100 dark:border-slate-700" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    handleCopy(lead.mobile, "Mobile Number");
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold cursor-pointer text-left"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                  Copy Mobile Number
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    handleCopy(lead.email, "Email Address");
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold cursor-pointer text-left"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                  Copy Email Address
                                </button>
                              </motion.div>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                    );
                  })
                )}

              </tbody>
            </table>
          </div>

          {/* Card List Layer for Mobile / Touch Screens */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {isLoading ? (
              // Mobile skeleton cards
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="p-5 animate-pulse space-y-3 bg-white dark:bg-slate-800">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-24"></div>
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-14"></div>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-sm w-36"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-sm w-48"></div>
                  <div className="pt-2 flex justify-between">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-20"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-12"></div>
                  </div>
                </div>
              ))
            ) : leads.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center bg-white dark:bg-slate-800">
                <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">No Leads Found</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
                  We couldn't find any leads matching your active criteria.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              // Real Mobile Cards
              leads.map((lead, idx) => (
                <motion.div
                  key={lead.id}
                  variants={rowVariant}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 space-y-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-50 text-sm">{lead.name}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Created on {lead.createdDate}</p>
                    </div>
                    {renderStatusBadge(lead.status)}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{lead.mobile}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(lead.mobile, "Mobile Number")}
                        className="text-indigo-600 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-0.5 rounded text-[10px] cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 max-w-[80%]">
                        <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(lead.email, "Email Address")}
                        className="text-indigo-600 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-0.5 rounded text-[10px] cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>Assignee: <strong className="text-slate-700 dark:text-slate-200">{lead.assignedEmployee || "Unassigned"}</strong></span>
                    </div>
                  </div>

                  {/* Mobile Actions Panel */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                      {lead.notes?.length || 0} note(s) logged
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="flex items-center gap-1 text-xs border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedLeadForEdit(lead as ExtendedLegacyLead)}
                        className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg font-bold cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer Controls / Pagination (If not loading and leads exist) */}
          {!isLoading && leads.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >

              {/* Show Limit selector and total indicators */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <span>Show</span>
                <select
                  value={filters.limit}
                  aria-label="Records per page"
                  onChange={(e) => setFilters({ limit: Number(e.target.value), page: 1 })}
                  className="px-2 py-1 skeuo-input rounded-md focus:outline-hidden text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                >
                  <option value={10}>10 records</option>
                  <option value={25}>25 records</option>
                  <option value={50}>50 records</option>
                </select>
                <span>of {totalCount} total leads</span>
              </div>

              {/* Page navigation */}
              <div className="flex items-center justify-center sm:justify-end gap-1.5">
                <button type="button"
                  onClick={() => setFilters({ page: Math.max(1, filters.page - 1) })}
                  disabled={filters.page === 1}
                  className="p-1.5 skeuo-button hover:skeuo-button-hover rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 text-xs">
                  {(() => {
                    // Show at most 7 page buttons with ellipsis
                    const pages: (number | "…")[] = [];
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      const cur = filters.page;
                      pages.push(1);
                      if (cur > 3) pages.push("…");
                      for (let i = Math.max(2, cur - 1); i <= Math.min(totalPages - 1, cur + 1); i++) pages.push(i);
                      if (cur < totalPages - 2) pages.push("…");
                      pages.push(totalPages);
                    }
                    return pages.map((p, i) =>
                      p === "…" ? (
                        <span key={`e${i}`} className="w-7 text-center text-slate-400">…</span>
                      ) : (
                        <button key={p} type="button"
                          onClick={() => setFilters({ page: p as number })}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg font-bold text-xs cursor-pointer transition-all ${
                            p === filters.page
                              ? "bg-indigo-600 text-white"
                              : "skeuo-button hover:skeuo-button-hover text-slate-600 dark:text-slate-300"
                          }`}>
                          {p}
                        </button>
                      )
                    );
                  })()}
                </div>

                <button type="button"
                  onClick={() => setFilters({ page: Math.min(totalPages, filters.page + 1) })}
                  disabled={filters.page === totalPages}
                  className="p-1.5 skeuo-button hover:skeuo-button-hover rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          )}
        </motion.div>
        </>
      )}

      </main>

      {/* Bulk action bar — ADMIN only, shows when rows are selected */}
      {isAdmin && (
        <BulkActionBar
          selectedIds={selectedIds}
          onClearSelect={clearSelection}
          onBulkStatus={handleBulkStatus}
          onBulkAssign={handleBulkAssign}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* Floating details / edit modals */}
      <AnimatePresence>
        {selectedLeadForView && (
          <LeadDetailsModal
            lead={selectedLeadForView}
            onClose={() => setSelectedLeadForView(null)}
            onUpdateLead={handleLeadUpdated}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedLeadForEdit && (
          <LeadEditModal
            lead={selectedLeadForEdit}
            onClose={() => setSelectedLeadForEdit(null)}
            onSave={handleLeadUpdated}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <CreateLeadModal
            onClose={() => setShowCreateModal(false)}
            onCreated={handleLeadCreated}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {leadToDelete && (
          <DeleteLeadDialog
            leadName={leadToDelete.name}
            onConfirm={handleLeadDeleted}
            onCancel={() => setLeadToDelete(null)}
          />
        )}
      </AnimatePresence>

      {/* Command palette — only mounted while open (zero perf cost when closed) */}
      {commandPaletteOpen && (
        <CommandPalette
          onClose={() => setCommandPaletteOpen(false)}
          onNavigateLead={(id) => navigate(`/leads/${id}`)}
          onApplyFilter={(patch) => {
            setFilters({ ...patch, page: 1 });
            setCurrentTab("leads");
          }}
          onNewLead={() => setShowCreateModal(true)}
          onRefresh={fetchLeads}
        />
      )}

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 26 } }}
              exit={{ opacity: 0, x: 60, scale: 0.88, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl shadow-2xl flex items-start gap-3 border pointer-events-auto bg-white dark:bg-slate-800 ${toast.type === "success"
                ? "border-emerald-200 dark:border-emerald-800"
                : toast.type === "error"
                  ? "border-rose-200 dark:border-rose-800"
                  : "border-indigo-200 dark:border-indigo-800"
                }`}
            >
              <motion.span
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
              >
                {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
                {toast.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
                {toast.type === "info" && <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />}
              </motion.span>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-950 dark:text-slate-50 leading-relaxed">{toast.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dynamic footer bar */}
      <motion.footer
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }}
        className="mt-auto bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium"
      >
        <div className="w-full px-4">
          &copy; {new Date().getFullYear()} Enterprise Resource Planning (ERP). All rights reserved.
        </div>
      </motion.footer>

    </div>
  );
}
