// ─── CreateLeadModal ──────────────────────────────────────────────────────────
// Wraps LeadForm in a modal for creating a new lead.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { motion } from "motion/react";
import { X, UserPlus } from "lucide-react";
import LeadForm, { type LeadFormValues } from "./LeadForm";
import { createLead, formValuesToPayload } from "../lib/leadApi";
import type { ExtendedLegacyLead } from "../types";

interface CreateLeadModalProps {
  onClose:   () => void;
  onCreated: (lead: ExtendedLegacyLead) => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function CreateLeadModal({ onClose, onCreated, showToast }: CreateLeadModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: LeadFormValues) => {
    setIsSubmitting(true);
    try {
      const created = await createLead(formValuesToPayload(data));
      showToast(`Lead "${created.name}" created successfully!`, "success");
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create lead.";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col skeuo-panel rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-b from-slate-50 dark:from-slate-800 to-slate-100 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">New Lead</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Fill in the details to add a lead to the pipeline.</p>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <LeadForm
            mode="create"
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </motion.div>
    </div>
  );
}
