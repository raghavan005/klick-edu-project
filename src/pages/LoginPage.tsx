// ─── LoginPage ────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { Navigate }        from "react-router-dom";
import { motion }          from "motion/react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, LogIn } from "lucide-react";
import { useAuth }         from "../context/AuthContext";

export default function LoginPage() {
  const { login, user, isLoading: authLoading } = useAuth();

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setIsLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      // login() sets user in context → the `if (user) return <Navigate to="/" />` above
      // handles the redirect once React re-renders with the new auth state.
    } catch (err: any) {
      setError(err.message ?? "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="w-full max-w-sm"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 mb-4">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            CRM Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="skeuo-card rounded-2xl p-6 space-y-5">

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-4 py-2.5 skeuo-input rounded-xl text-sm focus:outline-none focus:skeuo-input-focus text-slate-900 dark:text-slate-50 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 skeuo-input rounded-xl text-sm focus:outline-none focus:skeuo-input-focus text-slate-900 dark:text-slate-50 placeholder-slate-400"
                />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !email || !password}
              className="w-full py-2.5 skeuo-button-primary hover:skeuo-button-primary-hover active:skeuo-button-primary-active rounded-xl text-sm font-bold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 mt-1"
            >
              {isLoading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>Signing in…</>
              ) : (
                <><LogIn className="w-4 h-4" />Sign in</>
              )}
            </button>
          </div>
        </div>

        {/* Test credentials hint */}
        <div className="mt-5 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Test Credentials
          </p>
          <div className="space-y-1.5">
            {[
              { role: "Admin", email: "admin@crm.local",  pass: "Admin@123", color: "text-indigo-600 dark:text-indigo-400" },
              { role: "Staff", email: "aarti@crm.local",  pass: "Staff@123", color: "text-emerald-600 dark:text-emerald-400" },
            ].map((c) => (
              <button
                key={c.email}
                type="button"
                onClick={() => { setEmail(c.email); setPassword(c.pass); setError(null); }}
                className="w-full text-left flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
              >
                <span className={`text-[11px] font-bold ${c.color}`}>{c.role}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono group-hover:text-slate-600 dark:group-hover:text-slate-300">
                  {c.email}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
            Click a row to auto-fill credentials
          </p>
        </div>
      </motion.div>
    </div>
  );
}
