// ─── useDashboard Hook ────────────────────────────────────────────────────────

import { useQuery } from "@tanstack/react-query";
import { authFetch, getToken } from "../lib/auth";
import type { DashboardData, DashboardStats } from "../types";

function isDashboardData(payload: unknown): payload is DashboardData {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return (
    p.metrics !== null &&
    typeof p.metrics === "object" &&
    Array.isArray(p.pipeline) &&
    Array.isArray(p.leadSources) &&
    Array.isArray(p.recentActivity)
  );
}

function fromLegacyStats(stats: DashboardStats): DashboardData {
  return {
    metrics: {
      totalLeads:        stats.totalLeads,
      newToday:          stats.newToday,
      newThisWeek:       stats.newThisWeek,
      convertedLeads:    stats.converted,
      lostLeads:         stats.byStatus.Lost,
      pendingFollowUps:  stats.pendingFollowUps,
      overdueFollowUps:  0,
      dueTodayFollowUps: 0,
    },
    pipeline:          [],
    leadSources:       [],
    priority:          [
      { label: "Hot",  count: 0 },
      { label: "Warm", count: 0 },
      { label: "Cold", count: 0 },
    ],
    employees:         [],
    weeklyLeads:       [],
    recentActivity:    [],
    upcomingFollowUps: [],
  };
}

function parseDashboardPayload(payload: unknown): DashboardData {
  if (isDashboardData(payload)) return payload;
  if (payload && typeof payload === "object" && "totalLeads" in payload) {
    return fromLegacyStats(payload as DashboardStats);
  }
  throw new Error("Dashboard API returned an unexpected response.");
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await authFetch("/api/dashboard");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `Dashboard API error (${res.status})`);
  }
  return parseDashboardPayload(await res.json());
}

export function useDashboard() {
  // Only fetch when a token exists — prevents 401 before auth is restored
  const hasToken = !!getToken();

  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn:  fetchDashboard,
    enabled:  hasToken,
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, err) => {
      // Don't retry on 401 — that gets handled by authFetch
      if (err instanceof Error && err.message.includes("401")) return false;
      return failureCount < 2;
    },
  });
}
