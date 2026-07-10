// ─── LeadEditModal ────────────────────────────────────────────────────────────
// Wraps LeadForm in a modal for editing an existing lead.

import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Edit2 } from "lucide-react";
import LeadForm, { type LeadFormValues } from "./LeadForm";
import { formValuesToPayload, updateLead } from "../lib/leadApi";
import type { ExtendedLegacyLead } from "../types";

interface LeadEditModalProps {
  lead:      ExtendedLegacyLead;
  onClose:   () => void;
  onSave:    (updatedLead: ExtendedLegacyLead) => void;
  showToast?: (msg: string, type: "success" | "error" | "info") => void;
}

export default function LeadEditModal({ lead, onClose, onSave, showToast }: LeadEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: Partial<LeadFormValues> = {
    fullName:           lead.fullName   ?? lead.name   ?? "",
    email:              lead.email                     ?? "",
    phone:              lead.phone      ?? lead.mobile ?? "",
    country:            lead.country                   ?? "India",
    state:              lead.state                     ?? "",
    district:           lead.district                  ?? "",
    city:               lead.city                      ?? "",
    leadSource:         lead.leadSourceRaw ?? "Google_Ads",
    assignedEmployeeId: lead.assignedEmployeeId        ?? "",
    courseInterest:     lead.courseInterest ?? lead.courseInterested ?? "",
    studyPreference:    lead.studyPreference           ?? "India",
    preferredCountry:   lead.preferredCountry          ?? "",
    stage:              lead.stage                     ?? "New",
    subStage:           lead.subStage                  ?? "Not_Contacted",
    priority:           lead.priority                  ?? "Medium",
    status:             lead.status                    ?? "New",
    nextFollowUpDate:   lead.nextFollowUpDate
      ? new Date(lead.nextFollowUpDate).toISOString().split("T")[0] : "",
    lastContactedDate:  lead.lastContactedDate
      ? new Date(lead.lastContactedDate).toISOString().split("T")[0] : "",
    remarks:            lead.remarks                   ?? "",
  };

  const handleSubmit = async (data: LeadFormValues) => {
    setIsSubmitting(true);
    showToast?.(`Saving updates for ${data.fullName}...`, "info");

    try {
      const saved = await updateLead(lead.id, formValuesToPayload(data));
      showToast?.(`Lead "${saved.name}" updated successfully!`, "success");
      onSave(saved);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update lead.";
      showToast?.(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        id="lead-edit-modal-container"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col skeuo-panel rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-b from-slate-50 dark:from-slate-800 to-slate-100 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Edit2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                Edit Lead
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ID: <span className="font-mono">{lead.id}</span>
              </p>
            </div>
          </div>
          <button
            id="close-edit-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <LeadForm
            mode="edit"
            defaultValues={defaultValues}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </motion.div>
    </div>
  );
}
