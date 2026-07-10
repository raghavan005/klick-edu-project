import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  Search, User, Plus, RefreshCw, ArrowRight, Command,
  Mail, Inbox,
} from "lucide-react";
import { useLiquidGlass } from "../hooks/useLiquidGlass";
import { useTheme } from "../context/ThemeContext";
import { useEmployees } from "../hooks/useEmployees";
import { LEAD_STATUSES, PRIORITIES } from "../lib/constants";
import type { LegacyLead } from "../types";

import { authFetch } from "../lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommandAction {
  id:       string;
  label:    string;
  hint?:    string;
  icon:     React.ReactNode;
  run:      () => void;
}

interface CommandPaletteProps {
  onClose:          () => void;
  onNavigateLead:   (leadId: string) => void;
  onApplyFilter:    (patch: Record<string, any>) => void;
  onNewLead:        () => void;
  onRefresh:        () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
// Only mounted while open — liquid glass + overlay are removed from DOM on close.

export default function CommandPalette({
  onClose,
  onNavigateLead,
  onApplyFilter,
  onNewLead,
  onRefresh,
}: CommandPaletteProps) {
  const panelRef  = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  const [query, setQuery]           = useState("");
  const [debounced, setDebounced]   = useState("");
  const [leads, setLeads]           = useState<LegacyLead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected]     = useState(0);

  const { resolved: theme } = useTheme();
  const { data: employees = [] } = useEmployees();

  useLiquidGlass(
    panelRef,
    { scale: -100, chroma: 5, blur: 10, saturate: 1.7, fallbackBlur: 24 },
    theme,
  );

  const staticActions: CommandAction[] = useMemo(() => [
    {
      id: "new-lead",
      label: "Create a new lead",
      hint: "Opens the form to add a new contact",
      icon: <Plus className="w-4 h-4 text-indigo-400" />,
      run: () => { onClose(); onNewLead(); },
    },
  ], [onClose, onNewLead]);

  const leadActions: CommandAction[] = useMemo(
    () => leads.map((lead) => ({
      id:    `lead-${lead.id}`,
      label: lead.name,
      hint:  `Go to View Details (${lead.status})`,
      icon:  <User className="w-4 h-4 text-sky-400" />,
      run:   () => { onClose(); onNavigateLead(lead.id); },
    })),
    [leads, onClose, onNavigateLead],
  );

  const smartFilters: CommandAction[] = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    if (!term) return [];
    
    const matchedFilters: CommandAction[] = [];
    
    // Check Statuses
    const matchedStatus = LEAD_STATUSES.find(s => s.toLowerCase().includes(term));
    if (matchedStatus) {
      matchedFilters.push({
        id: `filter-status-${matchedStatus}`,
        label: `Filter table by Status: ${matchedStatus}`,
        hint: "Closes popup and sets status filter",
        icon: <Search className="w-4 h-4 text-amber-400" />,
        run: () => { onClose(); onApplyFilter({ status: matchedStatus }); },
      });
    }

    // Check Priorities
    const matchedPriority = PRIORITIES.find(p => p.toLowerCase().includes(term));
    if (matchedPriority) {
      matchedFilters.push({
        id: `filter-priority-${matchedPriority}`,
        label: `Filter table by Priority: ${matchedPriority}`,
        hint: "Closes popup and sets priority filter",
        icon: <Search className="w-4 h-4 text-amber-400" />,
        run: () => { onClose(); onApplyFilter({ priority: matchedPriority }); },
      });
    }

    // Check Assignees
    const matchedEmployee = employees.find(e => e.name.toLowerCase().includes(term));
    if (matchedEmployee) {
      matchedFilters.push({
        id: `filter-assignee-${matchedEmployee.id}`,
        label: `Filter table by Assignee: ${matchedEmployee.name}`,
        hint: "Closes popup and sets assignee filter",
        icon: <Search className="w-4 h-4 text-amber-400" />,
        run: () => { onClose(); onApplyFilter({ assignedEmployeeId: matchedEmployee.id }); },
      });
    }

    return matchedFilters;
  }, [debounced, employees, onClose, onApplyFilter]);

  const items: CommandAction[] = useMemo(() => {
    const list = [...staticActions];
    list.push(...smartFilters);
    list.push(...leadActions);
    return list;
  }, [staticActions, smartFilters, leadActions]);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch matching leads
  useEffect(() => {
    if (!debounced.trim()) {
      setLeads([]);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const params = new URLSearchParams({
      search: debounced.trim(),
      status: "All",
      page:   "1",
      limit:  "8",
    });

    authFetch(`/api/leads?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setLeads(data.leads ?? []);
      })
      .catch(() => { if (!cancelled) setLeads([]); })
      .finally(() => { if (!cancelled) setIsSearching(false); });

    return () => { cancelled = true; };
  }, [debounced]);

  // Reset selection when items change
  useEffect(() => { setSelected(0); }, [items.length, debounced]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const runSelected = useCallback(() => {
    const item = items[selected];
    if (item) item.run();
  }, [items, selected]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, items.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        runSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, items.length, runSelected]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector(`[data-cmd-idx="${selected}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="command-palette-overlay fixed inset-0 z-[500] flex items-start justify-center px-4 pt-[12vh] sm:pt-[15vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -12 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="w-full max-w-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Liquid glass search panel */}
        <div
          ref={panelRef}
          className="liquid-glass-panel overflow-hidden"
        >
          {/* Search input row */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200/80 dark:border-white/10">
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search leads, filter the table, or create a new lead..."
              className="flex-1 bg-transparent text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none min-w-0"
              autoComplete="off"
              spellCheck={false}
            />
            {isSearching && (
              <div className="w-4 h-4 border-2 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 shrink-0">
              esc
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[min(50vh,360px)] overflow-y-auto py-2">
            {items.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400 dark:text-slate-500">
                <Inbox className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No results</p>
              </div>
            ) : (
              <ul className="px-2 space-y-0.5">
                {items.map((item, idx) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-cmd-idx={idx}
                      onClick={item.run}
                      onMouseEnter={() => setSelected(idx)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        selected === idx
                          ? "bg-indigo-50 dark:bg-white/15 text-indigo-900 dark:text-white"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8"
                      }`}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate">{item.label}</span>
                        {item.hint && (
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.hint}</span>
                        )}
                      </span>
                      {selected === idx && (
                        <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-slate-200/80 dark:border-white/10 text-[10px] text-slate-500 dark:text-slate-500">
            <span className="flex items-center gap-3">
              <span><kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-white/10 border border-slate-200/80 dark:border-transparent">↑↓</kbd> navigate</span>
              <span><kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-white/10 border border-slate-200/80 dark:border-transparent">↵</kbd> select</span>
            </span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-500">
              <Command className="w-3 h-3" />K to open
            </span>
          </div>
        </div>

        {/* Lead preview chips when searching */}
        {leads.length > 0 && debounced.trim() && (
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {leads.slice(0, 4).map((lead) => (
              <span
                key={lead.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100/90 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10"
              >
                <Mail className="w-3 h-3 opacity-60" />
                {lead.email}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
