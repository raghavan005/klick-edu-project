import React, { useState } from "react";
import { motion } from "motion/react";
import { X, User, Phone, Mail, AlertTriangle, CheckCircle } from "lucide-react";
import { Lead, LeadStatus } from "../types";

interface LeadEditModalProps {
  lead: Lead;
  onClose: () => void;
  onSave: (updatedLead: Lead) => void;
}

const STATUS_OPTIONS: LeadStatus[] = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];
const EMPLOYEE_OPTIONS = ["Aarti Desai", "Bala Murugan", "Chitra Iyer", "Deepak Kumar", "Eshaan Verma"];

export default function LeadEditModal({ lead, onClose, onSave }: LeadEditModalProps) {
  // Form fields state
  const [name, setName] = useState(lead.name);
  const [mobile, setMobile] = useState(lead.mobile);
  const [email, setEmail] = useState(lead.email);
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [assignedEmployee, setAssignedEmployee] = useState(lead.assignedEmployee);

  // Validation / Loading States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Name Validation
    if (!name.trim()) {
      newErrors.name = "Lead Name is required.";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    // Mobile Validation
    const cleanedMobile = mobile.replace(/\s+/g, "");
    if (!mobile.trim()) {
      newErrors.mobile = "Mobile Number is required.";
    } else if (!/^\+?[0-9]{7,15}$/.test(cleanedMobile)) {
      newErrors.mobile = "Invalid format. Use 7-15 digits (plus sign allowed).";
    }

    // Email Validation
    if (!email.trim()) {
      newErrors.email = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Status Validation
    if (!status) {
      newErrors.status = "Lead Status is required.";
    }

    // Employee Validation
    if (!assignedEmployee) {
      newErrors.assignedEmployee = "Assigned Employee is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Trigger optimistic update on parent and close immediately!
    onSave({
      ...lead,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      status,
      assignedEmployee,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        id="lead-edit-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg skeuo-panel rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-linear-to-b from-slate-50 dark:from-slate-800 to-slate-100 dark:to-slate-900 shadow-xs">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">Edit Lead Information</h2>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-0.5">ID: {lead.id}</p>
          </div>
          <button
            id="close-edit-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 active:bg-slate-100 dark:active:bg-slate-500 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {submitError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Lead Name */}
          <div className="space-y-1.5">
            <label htmlFor="edit-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Lead Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                }}
                className={`w-full text-sm pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 skeuo-input rounded-xl focus:outline-hidden focus:skeuo-input-focus transition-all ${
                  errors.name ? "border-red-400 focus:ring-red-500/20" : ""
                }`}
                placeholder="Enter lead's full name"
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs font-medium">{errors.name}</p>}
          </div>

          {/* Mobile Number */}
          <div className="space-y-1.5">
            <label htmlFor="edit-mobile" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                id="edit-mobile"
                type="text"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: "" }));
                }}
                className={`w-full text-sm pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 skeuo-input rounded-xl focus:outline-hidden focus:skeuo-input-focus transition-all ${
                  errors.mobile ? "border-red-400 focus:ring-red-500/20" : ""
                }`}
                placeholder="e.g. +919876543210 or 9876543210"
              />
            </div>
            {errors.mobile && <p className="text-red-500 text-xs font-medium">{errors.mobile}</p>}
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="edit-email" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                className={`w-full text-sm pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 skeuo-input rounded-xl focus:outline-hidden focus:skeuo-input-focus transition-all ${
                  errors.email ? "border-red-400 focus:ring-red-500/20" : ""
                }`}
                placeholder="e.g. name@example.com"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs font-medium">{errors.email}</p>}
          </div>

          {/* Grid for Status and Assigned Employee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Lead Status */}
            <div className="space-y-1.5">
              <label htmlFor="edit-status" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Lead Status <span className="text-red-500">*</span>
              </label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as LeadStatus);
                  if (errors.status) setErrors((prev) => ({ ...prev, status: "" }));
                }}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-slate-800 skeuo-input rounded-xl focus:outline-hidden focus:skeuo-input-focus"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors.status && <p className="text-red-500 text-xs font-medium">{errors.status}</p>}
            </div>

            {/* Assigned Employee */}
            <div className="space-y-1.5">
              <label htmlFor="edit-employee" className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Assigned Employee <span className="text-red-500">*</span>
              </label>
              <select
                id="edit-employee"
                value={assignedEmployee}
                onChange={(e) => {
                  setAssignedEmployee(e.target.value);
                  if (errors.assignedEmployee) setErrors((prev) => ({ ...prev, assignedEmployee: "" }));
                }}
                className="w-full text-sm px-3 py-2 bg-white dark:bg-slate-800 skeuo-input rounded-xl focus:outline-hidden focus:skeuo-input-focus"
              >
                {EMPLOYEE_OPTIONS.map((emp) => (
                  <option key={emp} value={emp}>
                    {emp}
                  </option>
                ))}
              </select>
              {errors.assignedEmployee && <p className="text-red-500 text-xs font-medium">{errors.assignedEmployee}</p>}
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 skeuo-button-primary hover:skeuo-button-primary-hover active:skeuo-button-primary-active rounded-xl text-sm font-bold tracking-wide cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
