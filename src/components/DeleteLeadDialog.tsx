// ─── DeleteLeadDialog ─────────────────────────────────────────────────────────
// Confirmation dialog before permanently deleting a lead.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteLeadDialogProps {
  leadName:  string;
  onConfirm: () => Promise<void>;
  onCancel:  () => void;
}

export default function DeleteLeadDialog({ leadName, onConfirm, onCancel }: DeleteLeadDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">Delete Lead</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              You are about to permanently delete{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">"{leadName}"</span>{" "}
              along with all their notes and activities. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-xs skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-xl font-semibold text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-60 transition-colors"
          >
            {isDeleting ? (
              <><svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg> Deleting…</>
            ) : (
              <><Trash2 className="w-3.5 h-3.5" /> Yes, Delete</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
