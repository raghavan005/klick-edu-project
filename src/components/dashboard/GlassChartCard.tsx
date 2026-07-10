import React from "react";

interface GlassChartCardProps {
  title: string;
  children: React.ReactNode;
}

/** Analytics chart container — CSS frosted glass (no SVG filters for scroll perf). */
export default function GlassChartCard({ title, children }: GlassChartCardProps) {
  return (
    <div className="liquid-glass-chart-card relative isolate flex h-full min-h-[19.5rem] flex-col rounded-xl sm:rounded-2xl p-4 sm:p-5 min-w-0">
      <h3 className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 min-h-[1rem]">
        {title}
      </h3>
      <div className="flex flex-1 min-h-0 flex-col justify-center">
        {children}
      </div>
    </div>
  );
}
