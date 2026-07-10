import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Inbox, AlertTriangle, Clock, ChevronRight, User } from "lucide-react";
import type { UpcomingFollowUp } from "../../types";

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  } catch { return iso; }
}

function getUrgencyInfo(days: number): { label: string; color: string; bg: string; icon: any } {
  if (days < 0) return { label: `${Math.abs(days)}d Overdue`, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-900/30", icon: AlertTriangle };
  if (days === 0) return { label: "Due Today", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", icon: Clock };
  if (days === 1) return { label: "Tomorrow", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-900/30", icon: Calendar };
  return { label: `In ${days} days`, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", icon: Calendar };
}

function priorityColor(priority: string): string {
  if (priority === "Urgent") return "text-rose-600 bg-rose-100 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800";
  if (priority === "High")   return "text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800";
  if (priority === "Medium") return "text-amber-600 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800";
  return "text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700";
}

interface UpcomingFollowUpsWidgetProps {
  followUps: UpcomingFollowUp[];
}

export default function UpcomingFollowUpsWidget({ followUps }: UpcomingFollowUpsWidgetProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col min-w-0 shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-2 shrink-0">
        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
          <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Upcoming Follow-ups
        </h3>
        {followUps.length > 0 && (
          <span className="ml-auto text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
            {followUps.length} pending
          </span>
        )}
      </div>

      {followUps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-500">
          <Inbox className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm font-medium">No pending follow-ups</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {followUps.map((f) => {
            const urgency = getUrgencyInfo(f.daysRemaining);
            const UrgencyIcon = urgency.icon;

            return (
              <li key={f.leadId}>
                <button
                  type="button"
                  onClick={() => navigate(`/leads/${f.leadId}`)}
                  className="w-full text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl p-3 sm:p-3.5 transition-all group flex flex-col gap-2 relative overflow-hidden"
                >
                  {/* Left accent border based on urgency if overdue/today */}
                  {(f.daysRemaining <= 0) && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${f.daysRemaining < 0 ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  )}

                  <div className="flex justify-between items-start gap-2 w-full">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {f.leadName}
                      </h4>
                    </div>
                    {/* Urgency Badge */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold shrink-0 ${urgency.bg} ${urgency.color}`}>
                      <UrgencyIcon className="w-3 h-3" />
                      {urgency.label}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 opacity-70" />
                      <span className="truncate max-w-[120px]">{f.assignedEmployee}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 opacity-70" />
                      {formatShortDate(f.nextFollowUpDate)}
                    </span>
                    
                    <span className={`ml-auto text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${priorityColor(f.priority)}`}>
                      {f.priority}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function UpcomingFollowUpsSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 min-w-0 h-full">
      <div className="flex items-center gap-3 pb-4 mb-2">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-3.5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
            <div className="flex gap-4">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
