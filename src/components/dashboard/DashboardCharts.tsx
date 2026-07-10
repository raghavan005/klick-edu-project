import React from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { DashboardData } from "../../types";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useTheme } from "../../context/ThemeContext";
import GlassChartCard from "./GlassChartCard";

const CHART_HEIGHT = 248;
const PIE_CY = "38%";
const LEGEND_HEIGHT = 36;
const STAGE_COLORS = ["#6366f1", "#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#f43f5e", "#64748b"];
const PRIORITY_COLORS: Record<string, string> = {
  Hot:  "#ef4444",
  Warm: "#f59e0b",
  Cold: "#3b82f6",
};

// Custom label renderer — keeps labels inside the chart area
function PriorityLabel({
  cx, cy, midAngle, innerRadius, outerRadius, name, value,
}: any) {
  // Skip tiny slices to avoid label clutter
  if (value === 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
      fill={PRIORITY_COLORS[name] ?? "#94a3b8"}
    >
      {`${name}: ${value}`}
    </text>
  );
}

function chartStyles(isDark: boolean) {
  return {
    gridStroke: isDark ? "rgba(148, 163, 184, 0.25)" : "rgba(148, 163, 184, 0.35)",
    tickStyle: { fill: isDark ? "#94a3b8" : "#64748b", fontSize: 11 },
    tooltipStyle: {
      contentStyle: {
        background: isDark ? "#1e293b" : "#ffffff",
        border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
        borderRadius: 8,
        fontSize: 12,
        boxShadow: isDark ? "none" : "0 4px 12px rgba(15, 23, 42, 0.08)",
      },
      labelStyle: { color: isDark ? "#e2e8f0" : "#334155" },
      itemStyle:  { color: isDark ? "#c7d2fe" : "#4f46e5" },
    },
    legendStyle: { fontSize: 11, paddingTop: 8, color: isDark ? "#94a3b8" : "#64748b" },
  };
}

interface DashboardChartsProps {
  data: Pick<DashboardData, "pipeline" | "leadSources" | "weeklyLeads" | "priority">;
}

function ChartArea({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full" style={{ height: CHART_HEIGHT }}>
      <ResponsiveContainer
        width="100%"
        height={CHART_HEIGHT}
        initialDimension={{ width: 400, height: CHART_HEIGHT }}
        debounce={120}
      >
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div
      className="flex items-center justify-center text-xs sm:text-sm text-slate-400 dark:text-slate-500 text-center px-4"
      style={{ height: CHART_HEIGHT }}
    >
      {message}
    </div>
  );
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  const { pipeline, leadSources, weeklyLeads, priority } = data;
  const isMobile = useIsMobile();
  const { isDark } = useTheme();
  const styles = chartStyles(isDark);
  const pieRadius  = isMobile ? 56 : 68;
  const donutInner = isMobile ? 34 : 42;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
      <GlassChartCard title="Lead Stage Distribution">
        {pipeline.length === 0 ? (
          <EmptyChart message="No stage data available" />
        ) : (
          <ChartArea>
            <PieChart margin={{ top: 16, right: 24, bottom: 0, left: 24 }}>
              <Pie
                data={pipeline}
                dataKey="count"
                nameKey="stage"
                cx="50%"
                cy={PIE_CY}
                outerRadius={pieRadius}
                paddingAngle={2}
                labelLine={false}
                label={isMobile ? false : ({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
                  if (!value) return null;
                  const RADIAN = Math.PI / 180;
                  const r = outerRadius * 1.28;
                  const x = cx + r * Math.cos(-midAngle * RADIAN);
                  const y = cy + r * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central"
                      fontSize={10} fontWeight={600} fill="#6366f1">
                      {name}
                    </text>
                  );
                }}
              >
                {pipeline.map((_, i) => (
                  <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip {...styles.tooltipStyle} />
              <Legend verticalAlign="bottom" height={LEGEND_HEIGHT} wrapperStyle={styles.legendStyle} />
            </PieChart>
          </ChartArea>
        )}
      </GlassChartCard>

      <GlassChartCard title="Lead Sources">
        {leadSources.length === 0 ? (
          <EmptyChart message="No source data available" />
        ) : (
          <ChartArea>
            <BarChart
              data={leadSources}
              layout={isMobile ? "vertical" : "horizontal"}
              margin={isMobile
                ? { top: 4, right: 12, left: 4, bottom: 4 }
                : { top: 8, right: 12, left: 0, bottom: 56 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
              {isMobile ? (
                <>
                  <XAxis type="number" allowDecimals={false} tick={styles.tickStyle} />
                  <YAxis type="category" dataKey="source" width={80} tick={{ ...styles.tickStyle, fontSize: 9 }} />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey="source"
                    tick={{ ...styles.tickStyle, fontSize: 10 }}
                    angle={-25}
                    textAnchor="end"
                    height={52}
                    interval={0}
                  />
                  <YAxis allowDecimals={false} tick={styles.tickStyle} />
                </>
              )}
              <Tooltip {...styles.tooltipStyle} />
              <Bar dataKey="count" name="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartArea>
        )}
      </GlassChartCard>

      <GlassChartCard title="Weekly Lead Creation">
        {weeklyLeads.every((w) => w.count === 0) ? (
          <EmptyChart message="No leads created in recent weeks" />
        ) : (
          <ChartArea>
            <LineChart
              data={weeklyLeads}
              margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
              <XAxis
                dataKey="week"
                tick={{ ...styles.tickStyle, fontSize: isMobile ? 9 : 11 }}
                interval={isMobile ? 1 : 0}
              />
              <YAxis allowDecimals={false} tick={styles.tickStyle} width={32} />
              <Tooltip {...styles.tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                name="Leads"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: isMobile ? 3 : 4, fill: "#6366f1" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartArea>
        )}
      </GlassChartCard>

      <GlassChartCard title="Priority Distribution">
        {priority.every((p) => p.count === 0) ? (
          <EmptyChart message="No priority data available" />
        ) : (
          <ChartArea>
            <PieChart margin={{ top: 16, right: 24, bottom: 0, left: 24 }}>
              <Pie
                data={priority.filter((p) => p.count > 0)}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy={PIE_CY}
                innerRadius={donutInner}
                outerRadius={pieRadius}
                paddingAngle={3}
                labelLine={false}
                label={isMobile ? false : <PriorityLabel />}
              >
                {priority.filter((p) => p.count > 0).map((p) => (
                  <Cell
                    key={p.label}
                    fill={PRIORITY_COLORS[p.label] ?? "#94a3b8"}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                {...styles.tooltipStyle}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend
                verticalAlign="bottom"
                height={LEGEND_HEIGHT}
                wrapperStyle={styles.legendStyle}
                formatter={(value) => (
                  <span style={{ color: PRIORITY_COLORS[value] ?? "#94a3b8", fontWeight: 600 }}>
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ChartArea>
        )}
      </GlassChartCard>
    </div>
  );
}

export function DashboardChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="min-h-[19.5rem] rounded-xl sm:rounded-2xl liquid-glass-chart-card bg-slate-200/60 dark:bg-slate-700/40 animate-pulse" />
      ))}
    </div>
  );
}
