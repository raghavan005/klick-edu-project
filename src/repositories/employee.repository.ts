// ─── Employee Repository ──────────────────────────────────────────────────────

import { prisma } from "../lib/prisma.js";

export const employeeRepository = {

  async findAll() {
    return prisma.employee.findMany({ orderBy: { name: "asc" } });
  },

  async findById(id: string) {
    return prisma.employee.findUnique({ where: { id } });
  },
};
