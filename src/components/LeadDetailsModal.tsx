import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Phone, Mail, MapPin, BookOpen, Share2, User, FileText, Trash2, Edit2, Check, CornerDownRight } from "lucide-react";
import { Lead, Note } from "../types";

interface LeadDetailsModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdateLead: (updatedLead: Lead) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function LeadDetailsModal({ lead, onClose, onUpdateLead, showToast }: LeadDetailsModalProps) {
  const [notes, setNotes] = useState<Note[]>(lead.notes || []);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [createdBy, setCreatedBy] = useState("System User");
  
  // Note edit states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null);

  // Add a new note (Optimistic Update)
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !createdBy.trim()) return;

    const optimisticNote: Note = {
      id: `opt_${Date.now()}`,
      content: newNoteContent.trim(),
      createdDate: new Date().toISOString(),
      createdBy: createdBy.trim(),
    };

    const previousNotes = [...notes];
    const updatedNotes = [...notes, optimisticNote];

    // Optimistically update states
    setNotes(updatedNotes);
    onUpdateLead({ ...lead, notes: updatedNotes });
    setNewNoteContent("");
    showToast("Adding note...", "info");

    try {
      const response = await fetch(`/api/leads/${lead.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: optimisticNote.content, createdBy: optimisticNote.createdBy }),
      });

      if (!response.ok) {
        throw new Error("Failed to add note on server");
      }

      const updatedLead = await response.json();
      setNotes(updatedLead.notes);
      onUpdateLead(updatedLead);
      showToast("Note added successfully!", "success");
    } catch (err: any) {
      // Rollback on failure
      setNotes(previousNotes);
      onUpdateLead({ ...lead, notes: previousNotes });
      showToast("Failed to add note. Rollback applied.", "error");
    }
  };

  // Delete a note (Optimistic Update)
  const executeDeleteNote = async (noteId: string) => {
    const previousNotes = [...notes];
    const updatedNotes = notes.filter((n) => n.id !== noteId);

    // Optimistically update states
    setNotes(updatedNotes);
    onUpdateLead({ ...lead, notes: updatedNotes });
    showToast("Deleting note...", "info");

    try {
      const response = await fetch(`/api/leads/${lead.id}/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note on server");
      }

      const updatedLead = await response.json();
      setNotes(updatedLead.notes);
      onUpdateLead(updatedLead);
      showToast("Note deleted successfully!", "success");
    } catch (err: any) {
      // Rollback on failure
      setNotes(previousNotes);
      onUpdateLead({ ...lead, notes: previousNotes });
      showToast("Failed to delete note. Rollback applied.", "error");
    }
  };

  // Start editing note
  const startEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditNoteContent(note.content);
  };

  // Save edited note (Optimistic Update)
  const handleSaveEditNote = async (noteId: string) => {
    if (!editNoteContent.trim()) return;

    const previousNotes = [...notes];
    const updatedNotes = notes.map((n) =>
      n.id === noteId ? { ...n, content: editNoteContent.trim(), createdDate: new Date().toISOString() } : n
    );

    // Optimistically update states
    setNotes(updatedNotes);
    onUpdateLead({ ...lead, notes: updatedNotes });
    setEditingNoteId(null);
    showToast("Saving note edits...", "info");

    try {
      const response = await fetch(`/api/leads/${lead.id}/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editNoteContent.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update note on server");
      }

      const updatedLead = await response.json();
      setNotes(updatedLead.notes);
      onUpdateLead(updatedLead);
      showToast("Note edits saved successfully!", "success");
    } catch (err: any) {
      // Rollback on failure
      setNotes(previousNotes);
      onUpdateLead({ ...lead, notes: previousNotes });
      showToast("Failed to edit note. Rollback applied.", "error");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "New":
        return "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50";
      case "Contacted":
        return "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50";
      case "Qualified":
        return "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50";
      case "Proposal":
        return "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50";
      case "Won":
        return "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50";
      case "Lost":
        return "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/50";
      default:
        return "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        id="lead-details-modal-container"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col skeuo-panel rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-linear-to-b from-slate-50 dark:from-slate-800 to-slate-100 dark:to-slate-900 shadow-xs">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(lead.status)} mb-2`}>
              {lead.status}
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">{lead.name}</h2>
          </div>
          <button
            id="close-details-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 active:bg-slate-100 dark:active:bg-slate-500 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Lead Info (7 cols) */}
          <div className="md:col-span-5 space-y-6">
            <div className="skeuo-inset p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Lead Specifications
              </h3>
              
              <div className="space-y-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-400 dark:text-slate-500 text-xs">Mobile Number</div>
                    <div className="text-slate-900 dark:text-slate-50 font-medium">{lead.mobile}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  <div className="break-all">
                    <div className="text-slate-400 dark:text-slate-500 text-xs">Email Address</div>
                    <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:underline font-medium">
                      {lead.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BookOpen className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-400 dark:text-slate-500 text-xs">Course Interested</div>
                    <div className="text-slate-900 dark:text-slate-50 font-medium">{lead.courseInterested || "N/A"}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Share2 className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-400 dark:text-slate-500 text-xs">Lead Source</div>
                    <div className="text-slate-900 dark:text-slate-50 font-medium">{lead.leadSource || "N/A"}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-400 dark:text-slate-500 text-xs">Assigned Employee</div>
                    <div className="text-slate-900 dark:text-slate-50 font-medium">{lead.assignedEmployee || "Unassigned"}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-400 dark:text-slate-500 text-xs">Created Date</div>
                    <div className="text-slate-900 dark:text-slate-50 font-medium">{lead.createdDate}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-slate-400 dark:text-slate-500 text-xs">Address</div>
                    <div className="text-slate-700 dark:text-slate-200 leading-relaxed text-xs">{lead.address || "No address provided"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Notes Section (5 cols) */}
          <div className="md:col-span-7 flex flex-col h-full space-y-4">
            <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 backdrop-blur-xs rounded-2xl p-5 flex-1 flex flex-col overflow-hidden max-h-[500px] shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
                <span>Notes Log</span>
                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs">
                  {notes.length}
                </span>
              </h3>

              {error && (
                <div className="p-3 mb-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              {/* Notes List with Timeline */}
              <div className="flex-1 overflow-y-auto pr-1 mb-4">
                {notes.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 py-12">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm">No notes logged for this lead yet.</p>
                  </div>
                ) : (
                  <div className="relative pl-5 border-l-2 border-slate-200 dark:border-slate-700/80 space-y-6 py-2 ml-2">
                    {(() => {
                      // Timeline Header Calculator
                      const getTimelineHeader = (dateStr: string) => {
                        try {
                          const today = new Date();
                          const noteDate = new Date(dateStr);

                          const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          const noteDateOnly = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate());

                          const diffTime = todayDateOnly.getTime() - noteDateOnly.getTime();
                          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                          if (diffDays === 0) return "Today";
                          if (diffDays === 1) return "Yesterday";
                          
                          return noteDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          });
                        } catch {
                          return "Earlier";
                        }
                      };

                      const sortedNotes = [...notes].sort((a, b) => b.createdDate.localeCompare(a.createdDate));
                      
                      // Group notes by header
                      const timelineGroups: { [key: string]: Note[] } = {};
                      sortedNotes.forEach((note) => {
                        const header = getTimelineHeader(note.createdDate);
                        if (!timelineGroups[header]) {
                          timelineGroups[header] = [];
                        }
                        timelineGroups[header].push(note);
                      });

                      // Unique sorted headers
                      const orderedHeaders: string[] = [];
                      sortedNotes.forEach((note) => {
                        const header = getTimelineHeader(note.createdDate);
                        if (!orderedHeaders.includes(header)) {
                          orderedHeaders.push(header);
                        }
                      });

                      return orderedHeaders.map((header) => (
                        <div key={header} className="space-y-3 relative">
                          {/* Timeline node dot */}
                          <div className="absolute -left-[28px] top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-800 shadow-xs" />
                          
                          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                            {header}
                          </h4>

                          <div className="space-y-3">
                            {timelineGroups[header].map((note) => (
                              <div key={note.id} className="p-3.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl space-y-2 relative group hover:shadow-xs transition-all">
                                {editingNoteId === note.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editNoteContent}
                                      onChange={(e) => setEditNoteContent(e.target.value)}
                                      className="w-full text-sm p-2 skeuo-input rounded-xl focus:outline-hidden focus:skeuo-input-focus"
                                      rows={3}
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setEditingNoteId(null)}
                                        className="px-2.5 py-1 text-xs skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-md text-slate-600 dark:text-slate-300 dark:text-slate-600"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditNote(note.id)}
                                        className="px-2.5 py-1 text-xs skeuo-button-primary hover:skeuo-button-primary-hover active:skeuo-button-primary-active rounded-md flex items-center gap-1"
                                      >
                                        <Check className="w-3.5 h-3.5" /> Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="text-slate-700 dark:text-slate-200 text-sm whitespace-pre-wrap break-all leading-relaxed font-medium">
                                      {note.content}
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                                      <div>
                                        <span>By <strong className="text-slate-600 dark:text-slate-300 font-bold">{note.createdBy}</strong></span>
                                        <span className="mx-1.5">•</span>
                                        <span>{formatDate(note.createdDate)}</span>
                                      </div>
                                      <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={() => startEditNote(note)}
                                          className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 p-1 rounded-md bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 cursor-pointer transition-all"
                                          title="Edit Note"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteNoteId(note.id)}
                                          className="text-slate-500 dark:text-slate-400 hover:text-red-600 p-1 rounded-md bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 cursor-pointer transition-all"
                                          title="Delete Note"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="sr-only">Note Content</label>
                    <textarea
                      placeholder="Add a new internal note..."
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 skeuo-input rounded-xl focus:outline-hidden focus:skeuo-input-focus"
                      rows={2}
                    />
                  </div>
                  <div className="flex flex-col justify-between gap-1.5">
                    <div>
                      <label className="sr-only">Author</label>
                      <input
                        type="text"
                        placeholder="Author"
                        value={createdBy}
                        onChange={(e) => setCreatedBy(e.target.value)}
                        required
                        className="w-full text-[11px] px-2 py-1.5 skeuo-input rounded-lg focus:outline-hidden focus:skeuo-input-focus font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading || !newNoteContent.trim() || !createdBy.trim()}
                      className="w-full py-1.5 skeuo-button-primary hover:skeuo-button-primary-hover active:skeuo-button-primary-active rounded-md font-semibold text-xs tracking-wide cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? "Saving..." : "Add Note"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-linear-to-b from-slate-50 dark:from-slate-800 to-slate-100 dark:to-slate-900 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </motion.div>

      {/* Custom Confirmation Dialog */}
      <AnimatePresence>
        {confirmDeleteNoteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">Delete Note</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                    Are you sure you want to delete this internal note? This action is permanent.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteNoteId(null)}
                  className="px-3.5 py-1.5 text-xs skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-lg font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = confirmDeleteNoteId;
                    setConfirmDeleteNoteId(null);
                    executeDeleteNote(id);
                  }}
                  className="px-3.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
