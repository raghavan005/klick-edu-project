import React from "react";
import { 
  Activity, Inbox, Plus, Edit2, RefreshCw, UserCheck, 
  AlertTriangle, Calendar, Phone, Trash2, FileText, CheckCircle 
} from "lucide-react";
import type { LeadActivity } from "../../types";

const ACTION_MAP: Record<string, { label: string; bg: string; text: string; Icon: any }> = {
  lead_created:           { label: "Created Lead",         bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", Icon: Plus },
  lead_updated:           { label: "Updated Lead",         bg: "bg-indigo-100 dark:bg-indigo-900/30",   text: "text-indigo-600 dark:text-indigo-400",   Icon: Edit2 },
  status_change:          { label: "Status Changed",       bg: "bg-amber-100 dark:bg-amber-900/30",     text: "text-amber-600 dark:text-amber-400",     Icon: RefreshCw },
  stage_change:           { label: "Stage Changed",        bg: "bg-purple-100 dark:bg-purple-900/30",   text: "text-purple-600 dark:text-purple-400",   Icon: RefreshCw },
  substage_change:        { label: "Sub-stage Changed",    bg: "bg-violet-100 dark:bg-violet-900/30",   text: "text-violet-600 dark:text-violet-400",   Icon: RefreshCw },
  employee_changed:       { label: "Reassigned",           bg: "bg-sky-100 dark:bg-sky-900/30",         text: "text-sky-600 dark:text-sky-400",         Icon: UserCheck },
  priority_change:        { label: "Priority Changed",     bg: "bg-orange-100 dark:bg-orange-900/30",   text: "text-orange-600 dark:text-orange-400",   Icon: AlertTriangle },
  followup_updated:       { label: "Follow-up Set",        bg: "bg-cyan-100 dark:bg-cyan-900/30",       text: "text-cyan-600 dark:text-cyan-400",       Icon: Calendar },
  last_contacted_updated: { label: "Contacted",            bg: "bg-teal-100 dark:bg-teal-900/30",       text: "text-teal-600 dark:text-teal-400",       Icon: Phone },
  lead_deleted:           { label: "Deleted Lead",         bg: "bg-rose-100 dark:bg-rose-900/30",       text: "text-rose-600 dark:text-rose-400",       Icon: Trash2 },
  note_added:             { label: "Added Note",           bg: "bg-blue-100 dark:bg-blue-900/30",       text: "text-blue-600 dark:text-blue-400",       Icon: FileText },
  note_deleted:           { label: "Deleted Note",         bg: "bg-rose-100 dark:bg-rose-900/30",       text: "text-rose-600 dark:text-rose-400",       Icon: Trash2 },
  note_updated:           { label: "Edited Note",          bg: "bg-indigo-100 dark:bg-indigo-900/30",   text: "text-indigo-600 dark:text-indigo-400",   Icon: Edit2 },
};

function getActionInfo(type: string) {
  return ACTION_MAP[type] ?? {
    label: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-300",
    Icon: Activity
  };
}

function formatTimeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  } catch { return iso; }
}

interface RecentActivityWidgetProps {
  activities: LeadActivity[];
}

export default function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col min-w-0 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-2 shrink-0">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Activity Feed
        </h3>
        {activities.length > 0 && (
          <span className="ml-auto text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
            {activities.length} recent
          </span>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
          <Inbox className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm font-medium">No recent activity</p>
        </div>
      ) : (
        <div className="relative pl-3">
          {/* Timeline track */}
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-100 dark:bg-slate-800" />
          
          <ul className="space-y-4">
            {activities.map((a, idx) => {
              const { label, bg, text, Icon } = getActionInfo(a.activityType);
              
              return (
                <li key={a.id} className="relative flex gap-4 group">
                  {/* Icon */}
                  <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-4 border-white dark:border-slate-900 ${bg} ${text}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        <span className={text}>{label}</span>
                        <span className="text-slate-400 dark:text-slate-500 mx-1.5 font-normal">by</span>
                        {a.performedBy}
                      </p>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0 mt-0.5">
                        {formatTimeAgo(a.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                      {a.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function RecentActivitySkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 min-w-0">
      <div className="flex items-center gap-3 pb-4">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
      <div className="pl-3 space-y-4 relative">
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-100 dark:bg-slate-800" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 relative">
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-900 shrink-0 z-10 animate-pulse" />
            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 h-16 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
