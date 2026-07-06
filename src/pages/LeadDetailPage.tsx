import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Phone, Mail, MapPin, BookOpen, Share2, User,
  Calendar, FileText, Edit2, Trash2, Check, AlertCircle,
  Inbox, ChevronRight
} from "lucide-react";
import { Lead, Note } from "../types";
import LeadEditModal from "../components/LeadEditModal";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const STATUS_STYLE: Record<string, string> = {
  New:       "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/50",
  Contacted: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50",
  Qualified: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50",
  Proposal:  "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50",
  Won:       "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50",
  Lost:      "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/50",
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  // Notes state
  const [newNoteContent, setNewNoteContent] = useState("");
  const [createdBy, setCreatedBy] = useState("System User");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const tid = Date.now().toString();
    setToasts(p => [...p, { id: tid, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== tid)), 3500);
  };

  // ── Fetch lead ──────────────────────────────────────────────────────────────
  const fetchLead = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) throw new Error(res.status === 404 ? "Lead not found." : "Failed to load lead.");
      setLead(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLead(); }, [id]);

  // ── Notes API ───────────────────────────────────────────────────────────────
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !createdBy.trim() || !lead) return;

    const optimistic: Note = {
      id: `opt_${Date.now()}`,
      content: newNoteContent.trim(),
      createdDate: new Date().toISOString(),
      createdBy: createdBy.trim(),
    };
    const prev = lead.notes ? [...lead.notes] : [];
    setLead({ ...lead, notes: [...prev, optimistic] });
    setNewNoteContent("");

    try {
      const res = await fetch(`/api/leads/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: optimistic.content, createdBy: optimistic.createdBy }),
      });
      if (!res.ok) throw new Error();
      setLead(await res.json());
      showToast("Note added!", "success");
    } catch {
      setLead({ ...lead, notes: prev });
      showToast("Failed to add note.", "error");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!lead) return;
    const prev = [...lead.notes];
    setLead({ ...lead, notes: lead.notes.filter(n => n.id !== noteId) });
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/leads/${id}/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setLead(await res.json());
      showToast("Note deleted.", "success");
    } catch {
      setLead({ ...lead, notes: prev });
      showToast("Failed to delete note.", "error");
    }
  };

  const handleSaveEditNote = async (noteId: string) => {
    if (!editNoteContent.trim() || !lead) return;
    const prev = [...lead.notes];
    setLead({ ...lead, notes: lead.notes.map(n => n.id === noteId ? { ...n, content: editNoteContent.trim() } : n) });
    setEditingNoteId(null);
    try {
      const res = await fetch(`/api/leads/${id}/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editNoteContent.trim() }),
      });
      if (!res.ok) throw new Error();
      setLead(await res.json());
      showToast("Note updated!", "success");
    } catch {
      setLead({ ...lead, notes: prev });
      showToast("Failed to update note.", "error");
    }
  };

  const handleLeadUpdated = (updated: Lead) => {
    setLead(updated);
    setShowEdit(false);
    showToast(`Lead "${updated.name}" updated!`, "success");
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return d; }
  };

  const getTimelineHeader = (dateStr: string) => {
    try {
      const today = new Date();
      const nd = new Date(dateStr);
      const diff = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - new Date(nd.getFullYear(), nd.getMonth(), nd.getDate()).getTime()) / 86400000);
      if (diff === 0) return "Today";
      if (diff === 1) return "Yesterday";
      return nd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return "Earlier"; }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error || !lead) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <p className="text-slate-700 dark:text-slate-200 font-semibold text-sm">{error || "Lead not found."}</p>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>
      </div>
    );
  }

  const sortedNotes = [...(lead.notes || [])].sort((a, b) => b.createdDate.localeCompare(a.createdDate));
  const groupedNotes: Record<string, Note[]> = {};
  const orderedHeaders: string[] = [];
  sortedNotes.forEach(n => {
    const h = getTimelineHeader(n.createdDate);
    if (!groupedNotes[h]) { groupedNotes[h] = []; orderedHeaders.push(h); }
    groupedNotes[h].push(n);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">

      {/* ── Header bar ── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-xs"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </motion.button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{lead.name}</span>
          <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLE[lead.status] || ""}`}>
            {lead.status}
          </span>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Lead
          </motion.button>
        </div>
      </motion.header>

      {/* ── Main content ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          variants={stagger} initial="hidden" animate="show"
        >

          {/* ── Left: Lead Specifications ── */}
          <motion.div variants={fadeUp} className="lg:col-span-5">
            <div className="skeuo-card rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Lead Specifications
              </h3>

              {[
                { icon: <Phone className="w-4 h-4" />, label: "Mobile Number",    value: lead.mobile },
                { icon: <Mail  className="w-4 h-4" />, label: "Email Address",
                  value: <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline font-medium">{lead.email}</a> },
                { icon: <BookOpen className="w-4 h-4" />, label: "Course Interested",  value: lead.courseInterested || "N/A" },
                { icon: <Share2   className="w-4 h-4" />, label: "Lead Source",         value: lead.leadSource || "N/A" },
                { icon: <User     className="w-4 h-4" />, label: "Assigned Employee",   value: lead.assignedEmployee || "Unassigned" },
                { icon: <Calendar className="w-4 h-4" />, label: "Created Date",        value: lead.createdDate },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 text-sm">
                  <span className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0">{icon}</span>
                  <div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{label}</div>
                    <div className="text-slate-900 dark:text-slate-50 font-semibold">{value}</div>
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-3 text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">Address</div>
                  <div className="text-slate-700 dark:text-slate-200 text-xs leading-relaxed">{lead.address || "No address provided"}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Right: Notes ── */}
          <motion.div variants={fadeUp} className="lg:col-span-7 flex flex-col gap-4">
            <div className="skeuo-card rounded-2xl p-5 flex flex-col" style={{ minHeight: 420 }}>
              {/* Notes header */}
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Notes Log</h3>
                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-bold">
                  {(lead.notes || []).length}
                </span>
              </div>

              {/* Notes list */}
              <div className="flex-1 overflow-y-auto pr-1 mb-4" style={{ maxHeight: 340 }}>
                {sortedNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
                    <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm">No notes logged yet.</p>
                  </div>
                ) : (
                  <div className="relative pl-5 border-l-2 border-slate-200 dark:border-slate-700 space-y-5 py-1 ml-2">
                    {orderedHeaders.map(header => (
                      <div key={header} className="space-y-3 relative">
                        <div className="absolute -left-[28px] top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-800 shadow-xs" />
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">{header}</h4>
                        <AnimatePresence>
                          {groupedNotes[header].map(note => (
                            <motion.div
                              key={note.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 26 }}
                              className="p-3.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl space-y-2 group hover:shadow-xs transition-all"
                            >
                              {editingNoteId === note.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editNoteContent}
                                    onChange={e => setEditNoteContent(e.target.value)}
                                    className="w-full text-sm p-2 skeuo-input rounded-xl focus:outline-hidden focus:skeuo-input-focus"
                                    rows={3}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setEditingNoteId(null)}
                                      className="px-2.5 py-1 text-xs skeuo-button hover:skeuo-button-hover rounded-md text-slate-600 dark:text-slate-300 cursor-pointer">
                                      Cancel
                                    </button>
                                    <button type="button" onClick={() => handleSaveEditNote(note.id)}
                                      className="px-2.5 py-1 text-xs skeuo-button-primary hover:skeuo-button-primary-hover rounded-md flex items-center gap-1 cursor-pointer">
                                      <Check className="w-3.5 h-3.5" /> Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-slate-700 dark:text-slate-200 text-sm whitespace-pre-wrap break-words leading-relaxed font-medium">{note.content}</p>
                                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700">
                                    <span>By <strong className="text-slate-600 dark:text-slate-300 font-bold">{note.createdBy}</strong> · {formatDate(note.createdDate)}</span>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button type="button" onClick={() => { setEditingNoteId(note.id); setEditNoteContent(note.content); }}
                                        className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-md cursor-pointer transition-all" title="Edit">
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button type="button" onClick={() => setConfirmDeleteId(note.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-md cursor-pointer transition-all" title="Delete">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add note form */}
              <form onSubmit={handleAddNote} className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="sr-only">Note Content</label>
                    <textarea
                      placeholder="Add a new internal note..."
                      value={newNoteContent}
                      onChange={e => setNewNoteContent(e.target.value)}
                      required
                      rows={2}
                      className="w-full text-xs p-2.5 skeuo-input rounded-xl focus:outline-hidden focus:skeuo-input-focus"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      placeholder="Author"
                      value={createdBy}
                      onChange={e => setCreatedBy(e.target.value)}
                      required
                      className="w-full text-[11px] px-2 py-1.5 skeuo-input rounded-lg focus:outline-hidden focus:skeuo-input-focus font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={!newNoteContent.trim() || !createdBy.trim()}
                      className="w-full py-1.5 skeuo-button-primary hover:skeuo-button-primary-hover active:skeuo-button-primary-active rounded-md font-semibold text-xs cursor-pointer disabled:opacity-50"
                    >
                      Add Note
                    </motion.button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* ── Edit Modal ── */}
      <AnimatePresence>
        {showEdit && (
          <LeadEditModal lead={lead} onClose={() => setShowEdit(false)} onSave={handleLeadUpdated} />
        )}
      </AnimatePresence>

      {/* ── Delete confirmation ── */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">Delete Note</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Are you sure? This action is permanent.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setConfirmDeleteId(null)}
                  className="px-3.5 py-1.5 text-xs skeuo-button hover:skeuo-button-hover rounded-lg font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={() => handleDeleteNote(confirmDeleteId)}
                  className="px-3.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold cursor-pointer">
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 max-w-xs pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.88 }}
              className={`p-3 rounded-xl shadow-xl flex items-center gap-2 border pointer-events-auto bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 ${
                t.type === "success" ? "border-emerald-200 dark:border-emerald-800"
                : t.type === "error" ? "border-rose-200 dark:border-rose-800"
                : "border-indigo-200 dark:border-indigo-800"
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
