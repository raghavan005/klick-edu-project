import React from "react";
import {
  Briefcase, Calendar, CalendarDays, CalendarCheck, CheckCircle, Clock, AlertTriangle, XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PixelCard from "../PixelCard";
import { useTheme } from "../../context/ThemeContext";
import type { DashboardMetrics } from "../../types";
import { useNavigate } from "react-router-dom";

import { authFetch } from "../../lib/auth";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = React.useState(value);
  React.useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) { setDisplay(value); return; }
    const steps = 16;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(Math.round(start + (diff * step) / steps));
      if (step >= steps) clearInterval(timer);
    }, 35);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

interface DashboardCardsProps {
  metrics: DashboardMetrics;
}

const CARDS = [
  { key: "totalLeads",        label: "Total Leads",         sub: "Pipeline volume",     icon: Briefcase,      color: "slate" },
  { key: "newToday",          label: "New Today",           sub: "Added today",         icon: Calendar,       color: "sky" },
  { key: "newThisWeek",       label: "New This Week",       sub: "This week",           icon: CalendarDays,   color: "indigo" },
  { key: "convertedLeads",    label: "Converted",           sub: "Won deals",           icon: CheckCircle,    color: "emerald" },
  { key: "pendingFollowUps",  label: "Pending Follow-ups", sub: "Due / overdue",       icon: Clock,          color: "amber" },
  { key: "overdueFollowUps",  label: "Overdue",            sub: "Past due date",       icon: AlertTriangle,  color: "rose" },
  { key: "dueTodayFollowUps", label: "Due Today",          sub: "Follow up today",     icon: CalendarCheck,  color: "orange" },
  { key: "lostLeads",         label: "Lost Leads",         sub: "Unconverted",         icon: XCircle,        color: "rose" },
] as const;

const COLOR_MAP: Record<string, { dark: string; light: string; bg: string; border: string; text: string; textDark: string }> = {
  slate:   { dark: "#0f172a,#1e293b,#334155", light: "#f8fafc,#f1f5f9,#e2e8f0", bg: "bg-white/40 dark:bg-slate-800/40", border: "border-white/60 dark:border-white/10", text: "text-slate-900 dark:text-slate-50", textDark: "text-slate-400" },
  sky:     { dark: "#0c4a6e,#075985,#0369a1", light: "#e0f2fe,#bae6fd,#7dd3fc", bg: "bg-sky-50/40 dark:bg-sky-900/20", border: "border-sky-200/60 dark:border-sky-500/20", text: "text-sky-600 dark:text-sky-400", textDark: "text-sky-500" },
  indigo:  { dark: "#312e81,#3730a3,#4338ca", light: "#e0e7ff,#c7d2fe,#a5b4fc", bg: "bg-indigo-50/40 dark:bg-indigo-900/20", border: "border-indigo-200/60 dark:border-indigo-500/20", text: "text-indigo-600 dark:text-indigo-400", textDark: "text-indigo-500" },
  emerald: { dark: "#064e3b,#065f46,#047857", light: "#d1fae5,#a7f3d0,#6ee7b7", bg: "bg-emerald-50/40 dark:bg-emerald-900/20", border: "border-emerald-200/60 dark:border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", textDark: "text-emerald-500" },
  amber:   { dark: "#78350f,#92400e,#b45309", light: "#fef3c7,#fde68a,#fcd34d", bg: "bg-amber-50/40 dark:bg-amber-900/20", border: "border-amber-200/60 dark:border-amber-500/20", text: "text-amber-600 dark:text-amber-400", textDark: "text-amber-500" },
  rose:    { dark: "#881337,#9f1239,#be123c", light: "#ffe4e6,#fecdd3,#fda4af", bg: "bg-rose-50/40 dark:bg-rose-900/20", border: "border-rose-200/60 dark:border-rose-500/20", text: "text-rose-600 dark:text-rose-400", textDark: "text-rose-500" },
  orange:  { dark: "#7c2d12,#9a3412,#c2410c", light: "#ffedd5,#fed7aa,#fdba74", bg: "bg-orange-50/40 dark:bg-orange-900/20", border: "border-orange-200/60 dark:border-orange-500/20", text: "text-orange-600 dark:text-orange-400", textDark: "text-orange-500" },
};

const MetricCard: React.FC<{ card: typeof CARDS[number]; value: number; colors: any; isDark: boolean }> = ({ card, value, colors, isDark }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [leadsData, setLeadsData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isHovered && !leadsData && !isLoading && value > 0) {
      setIsLoading(true);
      const params = new URLSearchParams({ limit: "5", page: "1" });
      if (card.key === "totalLeads") params.set("status", "All");
      else if (card.key === "newToday") {
        const d = new Date().toISOString().split("T")[0];
        params.set("startDate", d);
        params.set("endDate", d);
      } else if (card.key === "newThisWeek") {
        const d = new Date();
        const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
        const mon = new Date(d.setDate(diff)).toISOString().split("T")[0];
        params.set("startDate", mon);
      } else if (card.key === "convertedLeads") params.set("status", "Won");
      else if (card.key === "lostLeads") params.set("status", "Lost");
      else if (card.key === "pendingFollowUps") params.set("followUpStatus", "all");
      else if (card.key === "overdueFollowUps") params.set("followUpStatus", "overdue");
      else if (card.key === "dueTodayFollowUps") params.set("followUpStatus", "due_today");

      authFetch(`/api/leads?${params.toString()}`)
        .then(res => res.json())
        .then(data => { setLeadsData(data); setIsLoading(false); })
        .catch(() => setIsLoading(false));
    }
  }, [isHovered, card.key, leadsData, isLoading, value]);

  const handleClick = () => {
    if (value === 1 && leadsData?.leads?.[0]) {
       navigate(`/leads/${leadsData.leads[0].id}`);
    } else {
       const filters: any = {};
       if (card.key === "totalLeads") filters.status = "All";
       else if (card.key === "newToday") {
         const d = new Date().toISOString().split("T")[0];
         filters.startDate = d; filters.endDate = d;
       } else if (card.key === "newThisWeek") {
         const d = new Date();
         const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
         filters.startDate = new Date(d.setDate(diff)).toISOString().split("T")[0];
       } else if (card.key === "convertedLeads") filters.status = "Won";
       else if (card.key === "lostLeads") filters.status = "Lost";
       else if (card.key === "pendingFollowUps") filters.followUpStatus = "all";
       else if (card.key === "overdueFollowUps") filters.followUpStatus = "overdue";
       else if (card.key === "dueTodayFollowUps") filters.followUpStatus = "due_today";

       window.dispatchEvent(new CustomEvent("switch-to-leads-tab", { detail: filters }));
    }
  };

  const Icon = card.icon;

  return (
    <motion.div
      className="min-w-0 h-full relative"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <PixelCard
        glass
        colors={isDark ? colors.dark : colors.light}
        className={`h-full min-h-[6.5rem] sm:min-h-[7.5rem] liquid-glass-kpi-card--${card.color} border ${colors.border} rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-md group hover:shadow-lg transition-shadow cursor-pointer`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider leading-tight ${colors.textDark}`}>
            {card.label}
          </span>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/70 dark:bg-slate-900/60 flex items-center justify-center border border-white/80 dark:border-slate-700/60 shrink-0">
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.color === "slate" ? "text-slate-600 dark:text-slate-300" : colors.text}`} />
          </div>
        </div>
        <div>
          <h4 className={`text-xl sm:text-2xl font-black leading-none ${colors.text}`}>
            <AnimatedNumber value={value} />
          </h4>
          <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium truncate">
            {card.sub}
          </p>
        </div>
      </PixelCard>

      <AnimatePresence>
        {isHovered && value > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 left-1/2 -translate-x-1/2 bottom-[105%] mb-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 pointer-events-none"
          >
             <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-1 px-1">Recent Leads</h5>
             {isLoading ? (
               <div className="text-xs text-slate-500 px-1 py-1">Loading leads...</div>
             ) : leadsData?.leads?.length > 0 ? (
               <ul className="space-y-1">
                 {leadsData.leads.slice(0, 5).map((l: any) => (
                   <li key={l.id} className="text-xs bg-slate-50 dark:bg-slate-700/50 p-1.5 rounded-lg flex flex-col border border-slate-100 dark:border-slate-600/50">
                     <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{l.name || l.fullName}</span>
                     <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate mt-0.5">Assigned to: {l.assignedEmployee?.name || 'Unassigned'}</span>
                   </li>
                 ))}
                 {value > 5 && (
                   <li className="text-[9px] text-center text-slate-400 font-bold mt-1 bg-slate-50 dark:bg-slate-900/40 p-1 rounded-md">
                     + {value - 5} more leads
                   </li>
                 )}
               </ul>
             ) : (
               <div className="text-xs text-slate-500 px-1 py-1">No leads found</div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DashboardCards({ metrics }: DashboardCardsProps) {
  const { isDark } = useTheme();
  const safe = metrics ?? {
    totalLeads: 0, newToday: 0, newThisWeek: 0,
    convertedLeads: 0, lostLeads: 0, pendingFollowUps: 0,
    overdueFollowUps: 0, dueTodayFollowUps: 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {CARDS.map((card) => {
        const colors = COLOR_MAP[card.color];
        const value  = safe[card.key] ?? 0;

        return (
          <MetricCard
            key={card.key}
            card={card}
            value={value}
            colors={colors}
            isDark={isDark}
          />
        );
      })}
    </div>
  );
}

export function DashboardCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="min-h-[6.5rem] sm:min-h-[7.5rem] rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
      ))}
    </div>
  );
}
