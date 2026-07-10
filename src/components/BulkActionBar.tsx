// ─── BulkActionBar ────────────────────────────────────────────────────────────
// Floating bar that appears when leads are selected.
// Shows count, bulk-status dropdown, bulk-assign, and bulk-delete.
// ADMIN only — hidden from STAFF.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, UserCheck, Tag, X, CheckSquare, ChevronDown, AlertTriangle } from "lucide-react";
import { LEAD_STATUSES } from "../lib/constants";
import { useEmployees } from "../hooks/useEmployees";

interface BulkActionBarProps {
  selectedIds:   Set<string>;
  onClearSelect: () => void;
  onBulkStatus:  (status: string) => Promise<void>;
  onBulkAssign:  (employeeId: string | null) => Promise<void>;
  onBulkDelete:  () => Promise<void>;
}

export default function BulkActionBar({
  selectedIds, onClearSelect, onBulkStatus, onBulkAssign, onBulkDelete,
}: BulkActionBarProps) {
  const { data: employees = [] } = useEmployees();
  const [isBusy, setIsBusy]                 = useState(false);
  const [confirmDelete, setConfirmDelete]   = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  const count = selectedIds.size;
  if (count === 0) return null;

  const run = async (fn: () => Promise<void>) => {
    setIsBusy(true);
    try { await fn(); } finally { setIsBusy(false); }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="bulk-bar"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-2
                   bg-slate-900 dark:bg-slate-800 text-white rounded-2xl px-4 py-3
                   shadow-2xl border border-slate-700 dark:border-slate-600 min-w-max"
      >
        {/* Count badge */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
          <CheckSquare className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold">{count} selected</span>
          <button type="button" onClick={onClearSelect}
            className="ml-1 text-slate-400 hover:text-white cursor-pointer transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bulk status */}
        <div className="relative">
          <button type="button"
            onClick={() => { setShowStatusMenu((v) => !v); setShowAssignMenu(false); }}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
                       bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600
                       border border-slate-700 cursor-pointer transition-colors disabled:opacity-50"
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            Set Status
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <AnimatePresence>
            {showStatusMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-2 left-0 w-40 bg-slate-800 dark:bg-slate-700
                           rounded-xl border border-slate-700 shadow-xl py-1 z-10"
              >
                {LEAD_STATUSES.map((s) => (
                  <button key={s} type="button"
                    onClick={() => { setShowStatusMenu(false); run(() => onBulkStatus(s)); }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold
                               hover:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bulk assign */}
        <div className="relative">
          <button type="button"
            onClick={() => { setShowAssignMenu((v) => !v); setShowStatusMenu(false); }}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
                       bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600
                       border border-slate-700 cursor-pointer transition-colors disabled:opacity-50"
          >
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
            Assign
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <AnimatePresence>
            {showAssignMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full mb-2 left-0 w-48 bg-slate-800 dark:bg-slate-700
                           rounded-xl border border-slate-700 shadow-xl py-1 z-10"
              >
                <button type="button"
                  onClick={() => { setShowAssignMenu(false); run(() => onBulkAssign(null)); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-400
                             hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  — Unassigned
                </button>
                {employees.map((e) => (
                  <button key={e.id} type="button"
                    onClick={() => { setShowAssignMenu(false); run(() => onBulkAssign(e.id)); }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold
                               hover:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer transition-colors"
                  >
                    {e.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bulk delete */}
        {!confirmDelete ? (
          <button type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold
                       bg-rose-600 hover:bg-rose-700 border border-rose-500
                       cursor-pointer transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold text-amber-300 whitespace-nowrap">Delete {count}?</span>
            <button type="button"
              onClick={() => { setConfirmDelete(false); run(onBulkDelete); }}
              disabled={isBusy}
              className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-rose-600
                         hover:bg-rose-700 cursor-pointer transition-colors disabled:opacity-50"
            >
              Yes
            </button>
            <button type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-700
                         hover:bg-slate-600 cursor-pointer transition-colors"
            >
              No
            </button>
          </div>
        )}

        {/* Busy spinner */}
        {isBusy && (
          <svg className="animate-spin w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
