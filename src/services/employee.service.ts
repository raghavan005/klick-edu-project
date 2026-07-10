// ─── Employee Service ─────────────────────────────────────────────────────────

import { employeeRepository } from "../repositories/employee.repository.js";
import type { Employee } from "../types.js";

function serialize(e: {
  id: string; name: string; email: string;
  role: string; createdAt: Date; updatedAt: Date;
}): Employee {
  return {
    id:        e.id,
    name:      e.name,
    email:     e.email,
    role:      e.role as Employee["role"],
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export const employeeService = {

  async getAllEmployees(): Promise<Employee[]> {
    const rows = await employeeRepository.findAll();
    return rows.map(serialize);
  },
};
