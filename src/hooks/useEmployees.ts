import { useQuery } from "@tanstack/react-query";
import { authFetch, getToken } from "../lib/auth";
import type { Employee } from "../types";

async function fetchEmployees(): Promise<Employee[]> {
  const res = await authFetch("/api/employees");
  if (!res.ok) throw new Error("Failed to load employees");
  return res.json();
}

export function useEmployees() {
  const hasToken = !!getToken();

  return useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn:  fetchEmployees,
    enabled:  hasToken,
    staleTime: 1000 * 60 * 10,
  });
}
