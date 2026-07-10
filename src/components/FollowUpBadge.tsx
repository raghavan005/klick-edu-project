// ─── FollowUpBadge ────────────────────────────────────────────────────────────
// Shows follow-up status inline in the leads table row.
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";
import { AlertTriangle, Clock, CalendarCheck } from "lucide-react";

type FollowUpStatus = "overdue" | "due_today" | "upcoming" | "no_followup" | null;

interface Props {
  status:          FollowUpStatus;
  followUpDate?:   string | null;
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch { return ""; }
}

export default function FollowUpBadge({ status, followUpDate }: Props) {
  if (!status || status === "no_followup") return null;

  const date = followUpDate ? formatShortDate(followUpDate) : "";

  if (status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
        <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
        Overdue {date && `· ${date}`}
      </span>
    );
  }

  if (status === "due_today") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        <Clock className="w-2.5 h-2.5 shrink-0" />
        Due Today
      </span>
    );
  }

  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
        <CalendarCheck className="w-2.5 h-2.5 shrink-0" />
        {date || "Upcoming"}
      </span>
    );
  }

  return null;
}
