import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Phone, Mail, MapPin, BookOpen, Share2, User,
  Calendar, FileText, Edit2, Trash2, Check, AlertCircle,
  Inbox, Flag, Clock, Activity, Plus, Star, Briefcase,
} from "lucide-react";
import type { ExtendedLegacyLead } from "../types";
import LeadEditModal from "../components/LeadEditModal";
import DeleteLeadDialog from "../components/DeleteLeadDialog";
import { fetchLead, deleteLead, updateLead } from "../lib/leadApi";
import {
  formatSubStage, formatLeadSource, formatStudyPreference, STAGE_CONFIG, STAGE_NAMES,
  getSubStagesFor, getDefaultSubStage, type StageName,
} from "../lib/stageConfig";
import ThemeToggle from "../components/ThemeToggle";

import { authFetch } from "../lib/auth";

interface NoteItem {
  id: string;
  content: string;
  createdDate: string;
  createdBy: string;
}

const STATUS_STYLE: Record<string, string> = {
  New:       "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/50",
  Contacted: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50",
  Qualified: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50",
  Proposal:  "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50",
  Won:       "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50",
  Lost:      "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/50",
};

const PRIORITY_STYLE: Record<string, string> = {
  Low:    "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  Medium: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  High:   "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  Urgent: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
};

function formatDate(d: string, withTime = true) {
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  } catch { return d; }
}

function formatDateOnly(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch { return d; }
}

function getTimelineHeader(dateStr: string) {
  try {
    const today = new Date();
    const nd    = new Date(dateStr);
    const diff  = Math.round(
      (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
       new Date(nd.getFullYear(), nd.getMonth(), nd.getDate()).getTime()) / 86400000
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return nd.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  } catch { return "Earlier"; }
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="text-slate-900 dark:text-slate-50 font-medium mt-0.5 break-words">{value || "—"}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp} className="skeuo-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-indigo-500">{icon}</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<ExtendedLegacyLead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  
  const [isEditingPipeline, setIsEditingPipeline] = useState(false);
  const [editStage, setEditStage] = useState<StageName>("New");
  const [editSubStage, setEditSubStage] = useState("");

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [createdBy, setCreatedBy] = useState("System User");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);

  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const toastId = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id: toastId, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 4000);
  }, []);

  const loadLead = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLead(id);
      setLead(data);
      setNotes(data.notes || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load lead");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadLead(); }, [loadLead]);

  const startEditingPipeline = () => {
    setEditStage((lead?.stage as StageName) ?? "New");
    setEditSubStage(lead?.subStage ?? "Not_Contacted");
    setIsEditingPipeline(true);
  };

  const savePipeline = async () => {
    if (!lead) return;
    try {
      showToast("Updating pipeline...", "info");
      const updated = await updateLead(lead.id, { stage: editStage, subStage: editSubStage });
      setLead(updated);
      setIsEditingPipeline(false);
      showToast("Pipeline updated!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update pipeline.", "error");
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    try {
      await deleteLead(lead.id);
      showToast(`Lead "${lead.name}" deleted successfully!`, "success");
      navigate("/");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to delete lead.", "error");
      throw err;
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !newNoteContent.trim() || !createdBy.trim()) return;

    const optimisticNote: NoteItem = {
      id: `opt_${Date.now()}`,
      content: newNoteContent.trim(),
      createdDate: new Date().toISOString(),
      createdBy: createdBy.trim(),
    };

    const previousNotes = [...notes];
    setNotes([...notes, optimisticNote]);
    setNewNoteContent("");
    setNoteError(null);
    setNoteLoading(true);
    showToast("Adding note...", "info");

    try {
      const response = await authFetch(`/api/leads/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: optimisticNote.content, createdBy: optimisticNote.createdBy }),
      });
      if (!response.ok) throw new Error("Failed to add note");
      const updatedLead = await response.json();
      setLead(updatedLead);
      setNotes(updatedLead.notes);
      showToast("Note added successfully!", "success");
    } catch {
      setNotes(previousNotes);
      setNoteError("Failed to add note. Please try again.");
      showToast("Failed to add note.", "error");
    } finally {
      setNoteLoading(false);
    }
  };

  const executeDeleteNote = async (noteId: string) => {
    if (!lead) return;
    const previousNotes = [...notes];
    setNotes(notes.filter((n) => n.id !== noteId));
    setNoteLoading(true);
    showToast("Deleting note...", "info");

    try {
      const response = await authFetch(`/api/leads/${lead.id}/notes/${noteId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete note");
      const updatedLead = await response.json();
      setLead(updatedLead);
      setNotes(updatedLead.notes);
      showToast("Note deleted successfully!", "success");
    } catch {
      setNotes(previousNotes);
      setNoteError("Failed to delete note.");
      showToast("Failed to delete note.", "error");
    } finally {
      setNoteLoading(false);
    }
  };

  const handleSaveEditNote = async (noteId: string) => {
    if (!lead || !editNoteContent.trim()) return;
    const previousNotes = [...notes];
    const updatedNotes = notes.map((n) =>
      n.id === noteId ? { ...n, content: editNoteContent.trim() } : n
    );
    setNotes(updatedNotes);
    setEditingNoteId(null);
    setNoteLoading(true);
    showToast("Saving note edits...", "info");

    try {
      const response = await authFetch(`/api/leads/${lead.id}/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editNoteContent.trim() }),
      });
      if (!response.ok) throw new Error("Failed to update note");
      const updatedLead = await response.json();
      setLead(updatedLead);
      setNotes(updatedLead.notes);
      showToast("Note saved!", "success");
    } catch {
      setNotes(previousNotes);
      setNoteError("Failed to save note edits.");
      showToast("Failed to edit note.", "error");
    } finally {
      setNoteLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-slate-400 text-sm font-medium">Loading lead details…</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <p className="text-slate-600 dark:text-slate-300 font-medium">{error || "Lead not found"}</p>
        <button onClick={() => navigate("/")}
          className="px-4 py-2 skeuo-button rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
          Back to Lead List
        </button>
      </div>
    );
  }

  const stageLabel = lead.stage && STAGE_CONFIG[lead.stage as StageName]
    ? STAGE_CONFIG[lead.stage as StageName].label
    : lead.stage;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </button>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLE[lead.status] ?? ""}`}>
              {lead.status}
            </span>
            {lead.priority && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${PRIORITY_STYLE[lead.priority] ?? ""}`}>
                {lead.priority} Priority
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-slate-50">{lead.name}</h1>
          <p className="text-xs text-slate-400 font-mono">ID: {lead.id}</p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Personal Information */}
          <SectionCard title="Personal Information" icon={<User className="w-3.5 h-3.5" />}>
            <div className="space-y-3">
              <InfoRow icon={<User className="w-4 h-4" />} label="Full Name" value={lead.fullName ?? lead.name} />
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Email"
                value={<a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline">{lead.email}</a>} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={lead.phone ?? lead.mobile} />
            </div>
          </SectionCard>

          {/* Location */}
          <SectionCard title="Location" icon={<MapPin className="w-3.5 h-3.5" />}>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Country" value={lead.country} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="State" value={lead.state} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="District" value={lead.district} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="City" value={lead.city} />
            </div>
          </SectionCard>

          {/* Lead Details */}
          <SectionCard title="Lead Details" icon={<Briefcase className="w-3.5 h-3.5" />}>
            <div className="space-y-3">
              <InfoRow icon={<Share2 className="w-4 h-4" />} label="Lead Source"
                value={formatLeadSource(lead.leadSourceRaw ?? lead.leadSource)} />
              <InfoRow icon={<User className="w-4 h-4" />} label="Assigned Employee" value={lead.assignedEmployee} />
              <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Course Interest"
                value={lead.courseInterest ?? lead.courseInterested} />
              <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Study Preference"
                value={lead.studyPreference ? formatStudyPreference(lead.studyPreference) : "—"} />
              {lead.studyPreference === "Abroad" && (
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Preferred Country" value={lead.preferredCountry} />
              )}
            </div>
          </SectionCard>

          {/* Sales Pipeline */}
          <SectionCard 
            title="Sales Pipeline" 
            icon={<Flag className="w-3.5 h-3.5" />}
            action={!isEditingPipeline ? <button onClick={startEditingPipeline} className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer">Edit</button> : null}
          >
            {isEditingPipeline ? (
               <div className="space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wide">Stage</label>
                      <select 
                         className="w-full text-sm p-2 skeuo-input rounded-xl focus:outline-hidden"
                         value={editStage}
                         onChange={(e) => {
                           const s = e.target.value as StageName;
                           setEditStage(s);
                           setEditSubStage(getDefaultSubStage(s));
                         }}
                      >
                         {STAGE_NAMES.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase tracking-wide">Sub-stage</label>
                      <select 
                         className="w-full text-sm p-2 skeuo-input rounded-xl focus:outline-hidden"
                         value={editSubStage}
                         onChange={(e) => setEditSubStage(e.target.value)}
                      >
                         {getSubStagesFor(editStage).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                 </div>
                 <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button onClick={() => setIsEditingPipeline(false)} className="px-3 py-1.5 text-xs skeuo-button hover:skeuo-button-hover rounded-md cursor-pointer">Cancel</button>
                    <button onClick={savePipeline} className="px-3 py-1.5 text-xs skeuo-button-primary hover:skeuo-button-primary-hover rounded-md cursor-pointer">Save Stage</button>
                 </div>
               </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={<Flag className="w-4 h-4" />} label="Stage" value={stageLabel} />
                <InfoRow icon={<Flag className="w-4 h-4" />} label="Sub-stage"
                  value={lead.subStage ? formatSubStage(lead.subStage) : "—"} />
                <InfoRow icon={<Star className="w-4 h-4" />} label="Priority" value={lead.priority} />
                <InfoRow icon={<Flag className="w-4 h-4" />} label="Status" value={lead.status} />
              </div>
            )}
          </SectionCard>

          {/* Follow-up */}
          <SectionCard title="Follow-up Information" icon={<Clock className="w-3.5 h-3.5" />}>
            <div className="space-y-3">
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Next Follow-up"
                value={formatDateOnly(lead.nextFollowUpDate)} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Last Contacted"
                value={formatDateOnly(lead.lastContactedDate)} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Created"
                value={lead.createdDate} />
            </div>
          </SectionCard>

          {/* Remarks */}
          {lead.remarks && (
            <SectionCard title="Remarks" icon={<FileText className="w-3.5 h-3.5" />}>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{lead.remarks}</p>
            </SectionCard>
          )}

          {/* Activity Timeline Placeholder */}
          <SectionCard title="Activity Timeline" icon={<Activity className="w-3.5 h-3.5" />}>
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 dark:text-slate-500">
              <Activity className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm font-medium">Activity timeline coming soon</p>
              <p className="text-xs mt-1">
                {lead.activities?.length ?? 0} activit{(lead.activities?.length ?? 0) === 1 ? "y" : "ies"} logged
              </p>
            </div>
          </SectionCard>
        </motion.div>

        {/* Notes Section */}
        <motion.div variants={fadeUp} initial="hidden" animate="show"
          className="skeuo-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Notes
            </h3>
            <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-bold">
              {notes.length}
            </span>
          </div>

          {noteError && (
            <div className="p-3 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {noteError}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto pr-1">
            {notes.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400 dark:text-slate-500">
                <Inbox className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">No notes logged yet.</p>
              </div>
            ) : (
              <div className="relative pl-5 border-l-2 border-slate-200 dark:border-slate-700 space-y-6 py-2 ml-2">
                {(() => {
                  const sorted = [...notes].sort((a, b) => b.createdDate.localeCompare(a.createdDate));
                  const groups: Record<string, NoteItem[]> = {};
                  const headers: string[] = [];
                  sorted.forEach((note) => {
                    const h = getTimelineHeader(note.createdDate);
                    if (!groups[h]) { groups[h] = []; headers.push(h); }
                    groups[h].push(note);
                  });
                  return headers.map((header) => (
                    <div key={header} className="space-y-3 relative">
                      <div className="absolute -left-[28px] top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-800" />
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{header}</h4>
                      {groups[header].map((note) => (
                        <div key={note.id} className="p-3.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl group">
                          {editingNoteId === note.id ? (
                            <div className="space-y-2">
                              <textarea value={editNoteContent} onChange={(e) => setEditNoteContent(e.target.value)}
                                className="w-full text-sm p-2 skeuo-input rounded-xl" rows={3} />
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setEditingNoteId(null)}
                                  className="px-2.5 py-1 text-xs skeuo-button rounded-md cursor-pointer">Cancel</button>
                                <button type="button" onClick={() => handleSaveEditNote(note.id)}
                                  className="px-2.5 py-1 text-xs skeuo-button-primary rounded-md flex items-center gap-1 cursor-pointer">
                                  <Check className="w-3.5 h-3.5" /> Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{note.content}</p>
                              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
                                <span>By <strong className="text-slate-600 dark:text-slate-300">{note.createdBy}</strong> • {formatDate(note.createdDate)}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button type="button" onClick={() => { setEditingNoteId(note.id); setEditNoteContent(note.content); }}
                                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button type="button" onClick={() => setConfirmDeleteNoteId(note.id)}
                                    className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 text-rose-500 cursor-pointer">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          <form onSubmit={handleAddNote} className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <textarea placeholder="Add a new internal note…" value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)} required rows={2}
                  className="w-full text-sm p-2.5 skeuo-input rounded-xl" />
              </div>
              <div className="flex flex-col gap-2">
                <input type="text" placeholder="Author" value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)} required
                  className="w-full text-xs px-2 py-1.5 skeuo-input rounded-lg" />
                <button type="submit" disabled={noteLoading || !newNoteContent.trim()}
                  className="w-full py-2 skeuo-button-primary rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> {noteLoading ? "Saving…" : "Add Note"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showEdit && (
          <LeadEditModal
            lead={lead}
            onClose={() => setShowEdit(false)}
            onSave={(updated) => { setLead(updated); setNotes(updated.notes || []); }}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDelete && (
          <DeleteLeadDialog
            leadName={lead.name}
            onConfirm={handleDelete}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDeleteNoteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Delete Note</h4>
                  <p className="text-xs text-slate-500 mt-1">This action is permanent.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmDeleteNoteId(null)}
                  className="px-3.5 py-1.5 text-xs skeuo-button rounded-lg font-semibold cursor-pointer">Cancel</button>
                <button type="button" onClick={() => { const nid = confirmDeleteNoteId; setConfirmDeleteNoteId(null); executeDeleteNote(nid); }}
                  className="px-3.5 py-1.5 text-xs bg-red-600 text-white rounded-lg font-bold cursor-pointer">Yes, Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div key={toast.id} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
              className={`p-4 rounded-xl shadow-2xl border pointer-events-auto bg-white dark:bg-slate-800 text-xs font-bold ${
                toast.type === "success" ? "border-emerald-200" : toast.type === "error" ? "border-rose-200" : "border-indigo-200"
              }`}>
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
