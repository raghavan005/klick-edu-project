

import { authFetch } from "./auth";
import type { LeadFormValues } from "../components/LeadForm";
import type { ExtendedLegacyLead, LegacyLeadsResponse } from "../types";

export function formValuesToPayload(data: LeadFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...data };

  if (data.nextFollowUpDate) {
    payload.nextFollowUpDate = new Date(`${data.nextFollowUpDate}T00:00:00`).toISOString();
  } else {
    payload.nextFollowUpDate = null;
  }

  if (data.lastContactedDate) {
    payload.lastContactedDate = new Date(`${data.lastContactedDate}T00:00:00`).toISOString();
  } else {
    payload.lastContactedDate = null;
  }

  if (payload.assignedEmployeeId === "") payload.assignedEmployeeId = null;

  for (const key of Object.keys(payload)) {
    if (payload[key] === "") payload[key] = null;
  }

  return payload;
}

export async function fetchLeads(params: URLSearchParams): Promise<LegacyLeadsResponse> {
  const res = await authFetch(`/api/leads?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load leads.");
  return res.json();
}

export async function fetchLead(id: string): Promise<ExtendedLegacyLead> {
  const res = await authFetch(`/api/leads/${id}`);
  if (!res.ok) throw new Error("Lead not found.");
  return res.json();
}

export async function createLead(payload: Record<string, unknown>): Promise<ExtendedLegacyLead> {
  const res = await authFetch("/api/leads", {
    method: "POST",
    body:   JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Failed to create lead.");
  }
  return res.json();
}

export async function updateLead(id: string, payload: Record<string, unknown>): Promise<ExtendedLegacyLead> {
  const res = await authFetch(`/api/leads/${id}`, {
    method: "PUT",
    body:   JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Failed to update lead.");
  }
  return res.json();
}

export async function deleteLead(id: string): Promise<void> {
  const res = await authFetch(`/api/leads/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Failed to delete lead.");
  }
}

// ─── Bulk API ─────────────────────────────────────────────────────────────────

export async function bulkDeleteLeads(ids: string[]): Promise<{ deleted: number }> {
  const res = await authFetch("/api/leads/bulk/delete", {
    method: "POST",
    body:   JSON.stringify({ ids }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Bulk delete failed.");
  }
  return res.json();
}

export async function bulkUpdateStatus(
  ids: string[],
  status: string,
): Promise<{ updated: number; status: string }> {
  const res = await authFetch("/api/leads/bulk/status", {
    method: "POST",
    body:   JSON.stringify({ ids, status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Bulk status update failed.");
  }
  return res.json();
}

export async function bulkAssignLeads(
  ids: string[],
  employeeId: string | null,
): Promise<{ updated: number }> {
  const res = await authFetch("/api/leads/bulk/assign", {
    method: "POST",
    body:   JSON.stringify({ ids, employeeId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Bulk assign failed.");
  }
  return res.json();
}
