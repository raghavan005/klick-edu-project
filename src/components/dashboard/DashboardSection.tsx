import React from "react";
import { RefreshCw, AlertCircle, BarChart3 } from "lucide-react";
import { motion } from "motion/react";
import { useDashboard } from "../../hooks/useDashboard";
import DashboardCards, { DashboardCardsSkeleton } from "./DashboardCards";
import DashboardCharts, { DashboardChartsSkeleton } from "./DashboardCharts";
import RecentActivityWidget, { RecentActivitySkeleton } from "./RecentActivityWidget";
import UpcomingFollowUpsWidget, { UpcomingFollowUpsSkeleton } from "./UpcomingFollowUpsWidget";

function SectionBlock({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 min-w-0">
      {title && (
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-0.5">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

export default function DashboardSection() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard();

  return (
    <section className="skeuo-card rounded-2xl p-4 sm:p-6 space-y-5 sm:space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 shrink-0">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-slate-50 tracking-tight truncate">
              CRM Dashboard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Pipeline overview and team activity
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-xl font-semibold text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 shrink-0 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Refreshing…" : "Refresh Dashboard"}
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-5 sm:gap-6">
          <SectionBlock title="Key metrics">
            <DashboardCardsSkeleton />
          </SectionBlock>
          <SectionBlock title="Analytics">
            <DashboardChartsSkeleton />
          </SectionBlock>
          <SectionBlock title="Activity & follow-ups">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
              <RecentActivitySkeleton />
              <UpcomingFollowUpsSkeleton />
            </div>
          </SectionBlock>
        </div>
      )}

      {isError && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 sm:p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-red-800 dark:text-red-300 text-sm">Dashboard failed to load</h4>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1 break-words">
              {error instanceof Error ? error.message : "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        </motion.div>
      )}

      {!isLoading && !isError && data?.metrics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-5 sm:gap-6"
        >
          <SectionBlock title="Key metrics">
            <DashboardCards metrics={data.metrics} />
          </SectionBlock>

          <SectionBlock title="Analytics">
            <DashboardCharts
              data={{
                pipeline:    data.pipeline,
                leadSources: data.leadSources,
                weeklyLeads: data.weeklyLeads,
                priority:    data.priority,
              }}
            />
          </SectionBlock>

          <SectionBlock title="Activity & follow-ups">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 items-stretch">
              <RecentActivityWidget activities={data.recentActivity} />
              <UpcomingFollowUpsWidget followUps={data.upcomingFollowUps} />
            </div>
          </SectionBlock>
        </motion.div>
      )}
    </section>
  );
}
