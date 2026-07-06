import PixelCard from './components/PixelCard';
import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit, 
  Briefcase, 
  Tag, 
  X,
  Plus,
  AlertCircle,
  Inbox,
  Copy,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  Info, Sun, Moon
} from "lucide-react";
import { Lead, LeadStatus, LeadsResponse } from "./types";
import LeadDetailsModal from "./components/LeadDetailsModal";
import LeadEditModal from "./components/LeadEditModal";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from "motion/react";

const STATUS_LIST: (LeadStatus | "All")[] = ["All", "New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];
const EMPLOYEE_LIST = ["All", "Aarti Desai", "Bala Murugan", "Chitra Iyer", "Deepak Kumar", "Eshaan Verma"];

// ─── Shared animation variants ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0,  transition: { type: "spring", stiffness: 260, damping: 24 } },
};

const fadeDown = {
  hidden: { opacity: 0, y: -16 },
  show:   { opacity: 1, y: 0,  transition: { type: "spring", stiffness: 300, damping: 28 } },
};

const staggerContainer = (stagger = 0.07, delayStart = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delayStart } },
});

const cardVariant = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1,
    transition: { type: "spring", stiffness: 220, damping: 22 } },
};

const rowVariant = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0, transition: { type: "spring", stiffness: 280, damping: 26 } },
  exit:   { opacity: 0, x: 12, transition: { duration: 0.18 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  show:   { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 320, damping: 22 } },
};

// Animated counter component
function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
    const unsub = rounded.on("change", setDisplay);
    return () => { controls.stop(); unsub(); };
  }, [value]);

  return <>{display}</>;
}

export default function App() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") || window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);
  // Query state parameters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | "All">("All");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard Stats State
  const [stats, setStats] = useState({
    total: 0,
    New: 0,
    Contacted: 0,
    Qualified: 0,
    Proposal: 0,
    Won: 0,
    Lost: 0,
  });

  // Toast State
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);

  // Active Quick Action Dropdown State
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Modal active states
  const [selectedLeadForView, setSelectedLeadForView] = useState<Lead | null>(null);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);

  // Helper to trigger floating toast alerts
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Helper to copy strings to clipboard
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, "success");
  };

  // Debounce the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when other filters change
  useEffect(() => {
    setPage(1);
  }, [selectedStatus, selectedEmployee, startDate, endDate]);

  // Fetch dashboard stats from back-end
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/leads/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load pipeline stats", err);
    }
  };

  // Fetch leads on query criteria changes
  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        search: debouncedSearch,
        status: selectedStatus,
        assignedEmployee: selectedEmployee,
        startDate,
        endDate,
        page: String(page),
        limit: String(limit),
      });

      const response = await fetch(`/api/leads?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load leads from the REST API.");
      }

      const data: LeadsResponse = await response.json();
      setLeads(data.leads);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      setPage(data.currentPage);
      
      // Load stats in background too
      fetchStats();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching data.");
      showToast("Failed to load leads data.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [debouncedSearch, selectedStatus, selectedEmployee, startDate, endDate, page, limit]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedStatus("All");
    setSelectedEmployee("All");
    setStartDate("");
    setEndDate("");
    setPage(1);
    showToast("Search filters reset.", "info");
  };

  // Handle lead update with fully optimistic updates and rollback on failure
  const handleLeadUpdated = async (updatedLead: Lead) => {
    // Close edit modal immediately for instant interface response!
    if (selectedLeadForEdit && selectedLeadForEdit.id === updatedLead.id) {
      setSelectedLeadForEdit(null);
    }

    const previousLeads = [...leads];
    const previousStats = { ...stats };
    const oldLead = leads.find((l) => l.id === updatedLead.id);

    // Apply immediate local state update
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );

    if (selectedLeadForView && selectedLeadForView.id === updatedLead.id) {
      setSelectedLeadForView(updatedLead);
    }

    // Adjust dashboard stats state locally for instant UI changes
    if (oldLead && oldLead.status !== updatedLead.status) {
      setStats((prev) => ({
        ...prev,
        [oldLead.status]: Math.max(0, prev[oldLead.status] - 1),
        [updatedLead.status]: (prev[updatedLead.status] || 0) + 1,
      }));
    }

    showToast(`Saving updates for ${updatedLead.name}...`, "info");

    try {
      const response = await fetch(`/api/leads/${updatedLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedLead.name,
          mobile: updatedLead.mobile,
          email: updatedLead.email,
          status: updatedLead.status,
          assignedEmployee: updatedLead.assignedEmployee,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to synchronize lead updates with server.");
      }

      const savedLead = await response.json();
      // Ensure local state is strictly in sync with final server-side data
      setLeads((prev) =>
        prev.map((l) => (l.id === updatedLead.id ? savedLead : l))
      );
      if (selectedLeadForView && selectedLeadForView.id === updatedLead.id) {
        setSelectedLeadForView(savedLead);
      }
      showToast(`Lead "${updatedLead.name}" updated successfully!`, "success");
      fetchStats(); // Update dashboard stats count from the server to guarantee consistency
    } catch (err: any) {
      // Rollback!
      setLeads(previousLeads);
      setStats(previousStats);
      if (selectedLeadForView && selectedLeadForView.id === updatedLead.id) {
        setSelectedLeadForView(oldLead || null);
      }
      showToast(`Failed to update lead: Rollback applied.`, "error");
    }
  };

  // Status Badge Rendering with colorful dot
  const renderStatusBadge = (status: LeadStatus) => {
    let bgClass = "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700";
    let dotClass = "bg-slate-400";

    switch (status) {
      case "New":
        bgClass = "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-700/50";
        dotClass = "bg-sky-500 animate-pulse";
        break;
      case "Contacted":
        bgClass = "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-700/50";
        dotClass = "bg-amber-500";
        break;
      case "Qualified":
        bgClass = "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-700/50";
        dotClass = "bg-purple-500";
        break;
      case "Proposal":
        bgClass = "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-700/50";
        dotClass = "bg-indigo-500";
        break;
      case "Won":
        bgClass = "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-700/50";
        dotClass = "bg-emerald-500";
        break;
      case "Lost":
        bgClass = "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-700/50";
        dotClass = "bg-rose-500";
        break;
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${bgClass} shadow-3xs`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 flex flex-col font-sans">
      
      {/* Upper Brand Bar */}
      <motion.header
        variants={fadeDown}
        initial="hidden"
        animate="show"
        className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40 shadow-xs"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.1 }}
          >
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50 leading-none">ERP Portal</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Sales & Lead Pipeline</p>
            </div>
          </motion.div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.15 }}
          >
            <motion.button
              onClick={() => setIsDark(!isDark)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, rotate: 180 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="p-2 skeuo-button hover:skeuo-button-hover active:skeuo-button-active dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isDark ? "sun" : "moon"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{   rotate:  90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <div className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full font-mono font-medium text-slate-600 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              REST API Connected
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Module Title & Subheader */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          variants={staggerContainer(0.1, 0.2)}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp}>
            <h2 className="text-2xl font-black text-slate-950 dark:text-slate-50 tracking-tight">Lead Management Module</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Track, filter, and log customer acquisition lifecycles.</p>
          </motion.div>
          <motion.button
            variants={fadeUp}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            id="refresh-leads-btn"
            onClick={fetchLeads}
            disabled={isLoading}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 text-sm skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-lg font-semibold text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
          >
            <motion.span
              animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
              transition={isLoading ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }}
            >
              <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </motion.span>
            {isLoading ? "Fetching..." : "Force Refresh"}
          </motion.button>
        </motion.div>

        {/* Dashboard Summary Cards */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-6 gap-4"
          variants={staggerContainer(0.07, 0.3)}
          initial="hidden"
          animate="show"
        >
          {/* Total Leads Card */}
          <motion.div variants={cardVariant} whileHover={{ y: -4, scale: 1.03 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="lg:col-span-1">
            <PixelCard colors={isDark ? "#0f172a,#1e293b,#334155" : "#f8fafc,#f1f5f9,#e2e8f0"} className="h-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-slate-200/50 dark:shadow-black/30 group hover:shadow-xl hover:bg-white/60 dark:hover:bg-slate-700/50 transition-all duration-200">
              <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-center border border-white/80 dark:border-slate-700/60">
                <Briefcase className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total</span>
                <h4 className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1"><AnimatedNumber value={stats.total} /></h4>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Full Pipeline Volume</p>
            </PixelCard>
          </motion.div>

          {/* New Leads Card */}
          <motion.div variants={cardVariant} whileHover={{ y: -4, scale: 1.03 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="lg:col-span-1">
            <PixelCard colors={isDark ? "#0c4a6e,#075985,#0369a1" : "#e0f2fe,#bae6fd,#7dd3fc"} className="h-full bg-sky-50/40 dark:bg-sky-900/20 backdrop-blur-md border border-sky-200/60 dark:border-sky-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-sky-100/50 dark:shadow-black/30 group hover:shadow-xl hover:bg-sky-50/70 dark:hover:bg-sky-900/30 transition-all duration-200">
              <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-sky-100/70 dark:bg-sky-900/60 backdrop-blur-sm flex items-center justify-center border border-sky-200/80 dark:border-sky-500/30">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-sky-400 dark:text-sky-500 uppercase tracking-wider">New</span>
                <h4 className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1"><AnimatedNumber value={stats.New} /></h4>
              </div>
              <p className="text-[10px] text-sky-500/70 dark:text-sky-400/60 mt-2 font-medium">Awaiting Contact</p>
            </PixelCard>
          </motion.div>

          {/* Contacted Card */}
          <motion.div variants={cardVariant} whileHover={{ y: -4, scale: 1.03 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="lg:col-span-1">
            <PixelCard colors={isDark ? "#78350f,#92400e,#b45309" : "#fef3c7,#fde68a,#fcd34d"} className="h-full bg-amber-50/40 dark:bg-amber-900/20 backdrop-blur-md border border-amber-200/60 dark:border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-amber-100/50 dark:shadow-black/30 group hover:shadow-xl hover:bg-amber-50/70 dark:hover:bg-amber-900/30 transition-all duration-200">
              <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-amber-100/70 dark:bg-amber-900/60 backdrop-blur-sm flex items-center justify-center border border-amber-200/80 dark:border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 dark:text-amber-500 uppercase tracking-wider">Contacted</span>
                <h4 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1"><AnimatedNumber value={stats.Contacted} /></h4>
              </div>
              <p className="text-[10px] text-amber-500/70 dark:text-amber-400/60 mt-2 font-medium">In Active Outreach</p>
            </PixelCard>
          </motion.div>

          {/* Qualified Card */}
          <motion.div variants={cardVariant} whileHover={{ y: -4, scale: 1.03 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="lg:col-span-1">
            <PixelCard colors={isDark ? "#581c87,#6b21a8,#7e22ce" : "#f3e8ff,#e9d5ff,#d8b4fe"} className="h-full bg-purple-50/40 dark:bg-purple-900/20 backdrop-blur-md border border-purple-200/60 dark:border-purple-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-purple-100/50 dark:shadow-black/30 group hover:shadow-xl hover:bg-purple-50/70 dark:hover:bg-purple-900/30 transition-all duration-200">
              <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-purple-100/70 dark:bg-purple-900/60 backdrop-blur-sm flex items-center justify-center border border-purple-200/80 dark:border-purple-500/30">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-purple-400 dark:text-purple-500 uppercase tracking-wider">Qualified</span>
                <h4 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1"><AnimatedNumber value={stats.Qualified} /></h4>
              </div>
              <p className="text-[10px] text-purple-500/70 dark:text-purple-400/60 mt-2 font-medium">Qualified Leads</p>
            </PixelCard>
          </motion.div>

          {/* Won Card */}
          <motion.div variants={cardVariant} whileHover={{ y: -4, scale: 1.03 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="lg:col-span-1">
            <PixelCard colors={isDark ? "#064e3b,#065f46,#047857" : "#d1fae5,#a7f3d0,#6ee7b7"} className="h-full bg-emerald-50/40 dark:bg-emerald-900/20 backdrop-blur-md border border-emerald-200/60 dark:border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-emerald-100/50 dark:shadow-black/30 group hover:shadow-xl hover:bg-emerald-50/70 dark:hover:bg-emerald-900/30 transition-all duration-200">
              <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-emerald-100/70 dark:bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center border border-emerald-200/80 dark:border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 dark:text-emerald-500 uppercase tracking-wider">Won</span>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1"><AnimatedNumber value={stats.Won} /></h4>
              </div>
              <p className="text-[10px] text-emerald-500/70 dark:text-emerald-400/60 mt-2 font-medium">Successful Deals</p>
            </PixelCard>
          </motion.div>

          {/* Lost Card */}
          <motion.div variants={cardVariant} whileHover={{ y: -4, scale: 1.03 }} transition={{ type: "spring", stiffness: 300, damping: 22 }} className="lg:col-span-1">
            <PixelCard colors={isDark ? "#881337,#9f1239,#be123c" : "#ffe4e6,#fecdd3,#fda4af"} className="h-full bg-rose-50/40 dark:bg-rose-900/20 backdrop-blur-md border border-rose-200/60 dark:border-rose-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-lg shadow-rose-100/50 dark:shadow-black/30 group hover:shadow-xl hover:bg-rose-50/70 dark:hover:bg-rose-900/30 transition-all duration-200">
              <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-rose-100/70 dark:bg-rose-900/60 backdrop-blur-sm flex items-center justify-center border border-rose-200/80 dark:border-rose-500/30">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-400 dark:text-rose-500 uppercase tracking-wider">Lost</span>
                <h4 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1"><AnimatedNumber value={stats.Lost} /></h4>
              </div>
              <p className="text-[10px] text-rose-500/70 dark:text-rose-400/60 mt-2 font-medium">Unconverted Closures</p>
            </PixelCard>
          </motion.div>
        </motion.div>

        {/* Filters Toolbar Card */}
        <motion.div
          className="skeuo-card rounded-2xl p-6 space-y-4"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.55 }}
        >
          
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Search & Filter Criteria</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Search Input (5 cols) */}
            <div className="md:col-span-5 relative">
              <label htmlFor="toolbar-search" className="sr-only">Search leads</label>
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                id="toolbar-search"
                type="text"
                placeholder="Search Lead Name, Mobile or Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 skeuo-input rounded-xl text-sm focus:outline-hidden focus:skeuo-input-focus transition-all font-medium text-slate-900 dark:text-slate-50 placeholder-slate-400 dark:placeholder-slate-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Status Dropdown (2 cols) */}
            <div className="md:col-span-2">
              <label htmlFor="toolbar-status" className="sr-only">Status Filter</label>
              <select
                id="toolbar-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as LeadStatus | "All")}
                className="w-full px-3 py-2.5 skeuo-input rounded-xl text-sm focus:outline-hidden focus:skeuo-input-focus font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
              >
                <option value="All">All Statuses</option>
                {STATUS_LIST.filter(s => s !== "All").map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Employee Dropdown (2 cols) */}
            <div className="md:col-span-3">
              <label htmlFor="toolbar-employee" className="sr-only">Employee Filter</label>
              <select
                id="toolbar-employee"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2.5 skeuo-input rounded-xl text-sm focus:outline-hidden focus:skeuo-input-focus font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
              >
                <option value="All">All Assignees</option>
                {EMPLOYEE_LIST.filter(e => e !== "All").map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>

            {/* Reset Button (2 cols) */}
            <div className="md:col-span-2 flex items-end">
              <button
                id="reset-filters-btn"
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2.5 skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>

          </div>

          {/* Date Range Subgrid */}
          <div className="pt-2 grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Start Date */}
            <div className="md:col-span-3 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase shrink-0">From:</span>
              <div className="relative w-full">
                <Calendar className="absolute left-3 top-2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  aria-label="Start Date Filter"
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 skeuo-input rounded-lg text-xs focus:outline-hidden focus:skeuo-input-focus font-semibold text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="md:col-span-3 flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase shrink-0">To:</span>
              <div className="relative w-full">
                <Calendar className="absolute left-3 top-2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  aria-label="End Date Filter"
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 skeuo-input rounded-lg text-xs focus:outline-hidden focus:skeuo-input-focus font-semibold text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Current Applied Filters Summary */}
            <div className="md:col-span-6 flex items-center justify-end flex-wrap gap-2 text-xs">
              {(debouncedSearch || selectedStatus !== "All" || selectedEmployee !== "All" || startDate || endDate) && (
                <span className="text-indigo-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                  Active Filters Applied
                </span>
              )}
            </div>

          </div>

        </motion.div>

        {/* Error Alert States */}
        <AnimatePresence>
        {error && (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-red-800 text-sm">REST API Synchronisation Error</h4>
              <p className="text-xs text-red-700 mt-1">{error}</p>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                type="button" 
                onClick={fetchLeads} 
                className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold cursor-pointer"
              >
                Retry Request
              </motion.button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Data List Container */}
        <motion.div
          className="skeuo-card rounded-2xl overflow-hidden"
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.65 }}
        >
          
          {/* Main Table Layer for Desktop / Tablet */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-linear-to-b from-slate-50 dark:from-slate-800 to-slate-100 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="px-6 py-4">Lead Name</th>
                  <th className="px-6 py-4">Mobile Number</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Lead Status</th>
                  <th className="px-6 py-4">Assigned Employee</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                
                {isLoading ? (
                  // Skeleton loader rows
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-40"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-28"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-12 ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  // Empty state row
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="max-w-xs mx-auto flex flex-col items-center">
                        <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">No Leads Found</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                          We couldn't find any leads matching your active search terms or filters.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-4 px-3.5 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Real leads
                  leads.map((lead, idx) => (
                    <motion.tr
                      key={lead.id}
                      variants={rowVariant}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      transition={{ delay: idx * 0.04 }}
                      whileHover={{ backgroundColor: "rgba(99,102,241,0.03)" }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-50">
                        {lead.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">
                        <div className="flex items-center gap-1.5 group/copy">
                          <span>{lead.mobile}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(lead.mobile, "Mobile Number")}
                            className="opacity-0 group-hover/copy:opacity-100 hover:text-indigo-600 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer text-slate-400 dark:text-slate-500"
                            title="Copy Mobile"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 break-all font-semibold">
                        <div className="flex items-center gap-1.5 group/copy">
                          <span>{lead.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(lead.email, "Email Address")}
                            className="opacity-0 group-hover/copy:opacity-100 hover:text-indigo-600 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer text-slate-400 dark:text-slate-500"
                            title="Copy Email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderStatusBadge(lead.status)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-bold">
                        {lead.assignedEmployee || "Unassigned"}
                      </td>
                      <td className="px-6 py-4 text-slate-400 dark:text-slate-500 text-xs font-mono">
                        {lead.createdDate}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* Quick Action Dropdown Menu */}
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(activeDropdownId === lead.id ? null : lead.id);
                            }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 border border-slate-200 dark:border-slate-700 rounded-lg shadow-3xs cursor-pointer transition-all"
                            title="Actions Menu"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {activeDropdownId === lead.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveDropdownId(null)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.92, y: -6 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: -6 }}
                                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 z-40 py-1.5 origin-top-right"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    navigate(`/leads/${lead.id}`);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold cursor-pointer text-left"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                  View Details & Notes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    setSelectedLeadForEdit(lead);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold cursor-pointer text-left"
                                >
                                  <Edit className="w-3.5 h-3.5 text-amber-500" />
                                  Edit Information
                                </button>
                                <hr className="my-1 border-slate-100 dark:border-slate-700" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    handleCopy(lead.mobile, "Mobile Number");
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold cursor-pointer text-left"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                  Copy Mobile Number
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    handleCopy(lead.email, "Email Address");
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold cursor-pointer text-left"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                  Copy Email Address
                                </button>
                              </motion.div>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}

              </tbody>
            </table>
          </div>

          {/* Card List Layer for Mobile / Touch Screens */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-700">
            {isLoading ? (
              // Mobile skeleton cards
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="p-5 animate-pulse space-y-3 bg-white dark:bg-slate-800">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-24"></div>
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-14"></div>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-sm w-36"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-sm w-48"></div>
                  <div className="pt-2 flex justify-between">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-20"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-sm w-12"></div>
                  </div>
                </div>
              ))
            ) : leads.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center bg-white dark:bg-slate-800">
                <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">No Leads Found</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">
                  We couldn't find any leads matching your active criteria.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-3.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              // Real Mobile Cards
              leads.map((lead, idx) => (
                <motion.div
                  key={lead.id}
                  variants={rowVariant}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 space-y-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-50 text-sm">{lead.name}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Created on {lead.createdDate}</p>
                    </div>
                    {renderStatusBadge(lead.status)}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{lead.mobile}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(lead.mobile, "Mobile Number")}
                        className="text-indigo-600 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-0.5 rounded text-[10px] cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 max-w-[80%]">
                        <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(lead.email, "Email Address")}
                        className="text-indigo-600 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-0.5 rounded text-[10px] cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>Assignee: <strong className="text-slate-700 dark:text-slate-200">{lead.assignedEmployee || "Unassigned"}</strong></span>
                    </div>
                  </div>

                  {/* Mobile Actions Panel */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                      {lead.notes?.length || 0} note(s) logged
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="flex items-center gap-1 text-xs border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedLeadForEdit(lead)}
                        className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-lg font-bold cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer Controls / Pagination (If not loading and leads exist) */}
          {!isLoading && leads.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              
              {/* Show Limit selector and total indicators */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <span>Show</span>
                <select
                  value={limit}
                  aria-label="Records per page"
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 skeuo-input rounded-md focus:outline-hidden text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
                >
                  <option value={10}>10 records</option>
                  <option value={25}>25 records</option>
                  <option value={50}>50 records</option>
                </select>
                <span>of {totalCount} total leads found</span>
              </div>

              {/* Dynamic Page Numbers and arrows */}
              <div className="flex items-center justify-center sm:justify-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </motion.button>
                
                <div className="flex items-center gap-1.5 text-xs">
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = pageNum === page;
                    return (
                      <motion.button
                        key={pageNum}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-indigo-600 text-white scale-105"
                            : "skeuo-button hover:skeuo-button-hover active:skeuo-button-active text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 skeuo-button hover:skeuo-button-hover active:skeuo-button-active rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>

            </motion.div>
          )}

        </motion.div>

      </main>

      {/* Floating details / edit modals */}
      <AnimatePresence>
        {selectedLeadForView && (
          <LeadDetailsModal
            lead={selectedLeadForView}
            onClose={() => setSelectedLeadForView(null)}
            onUpdateLead={handleLeadUpdated}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedLeadForEdit && (
          <LeadEditModal
            lead={selectedLeadForEdit}
            onClose={() => setSelectedLeadForEdit(null)}
            onSave={handleLeadUpdated}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0,  scale: 1, transition: { type: "spring", stiffness: 320, damping: 26 } }}
              exit={{   opacity: 0, x: 60, scale: 0.88, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl shadow-2xl flex items-start gap-3 border pointer-events-auto bg-white dark:bg-slate-800 ${
                toast.type === "success"
                  ? "border-emerald-200 dark:border-emerald-800"
                  : toast.type === "error"
                  ? "border-rose-200 dark:border-rose-800"
                  : "border-indigo-200 dark:border-indigo-800"
              }`}
            >
              <motion.span
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
              >
                {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
                {toast.type === "error"   && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
                {toast.type === "info"    && <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />}
              </motion.span>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-950 dark:text-slate-50 leading-relaxed">{toast.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dynamic footer bar */}
      <motion.footer
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }}
        className="mt-auto bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium"
      >
        <div className="max-w-7xl mx-auto px-4">
          &copy; {new Date().getFullYear()} Enterprise Resource Planning (ERP). All rights reserved.
        </div>
      </motion.footer>

    </div>
  );
}
