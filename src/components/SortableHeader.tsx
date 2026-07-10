// ─── SortableHeader ───────────────────────────────────────────────────────────
// A <th> that shows sort direction and toggles on click.
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface SortableHeaderProps {
  label:      string;
  field:      string;
  sortBy:     string;
  sortOrder:  "asc" | "desc";
  onSort:     (field: string) => void;
  className?: string;
}

export default function SortableHeader({
  label, field, sortBy, sortOrder, onSort, className = "",
}: SortableHeaderProps) {
  const isActive = sortBy === field;

  return (
    <th
      onClick={() => onSort(field)}
      className={`px-4 sm:px-6 py-3.5 text-left cursor-pointer select-none group ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
          isActive
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
        }`}>
          {label}
        </span>
        <span className={`transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`}>
          {isActive
            ? sortOrder === "asc"
              ? <ArrowUp   className={`w-3 h-3 text-indigo-600 dark:text-indigo-400`} />
              : <ArrowDown className={`w-3 h-3 text-indigo-600 dark:text-indigo-400`} />
            : <ArrowUpDown className="w-3 h-3 text-slate-400" />
          }
        </span>
      </div>
    </th>
  );
}
