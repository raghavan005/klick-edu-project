// ─── Seed Auth Users ──────────────────────────────────────────────────────────
// Creates test credentials for Admin and Staff roles.
// Run: npx tsx prisma/seed-users.ts
// ──────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const users = [
  {
    name:     "Admin User",
    email:    "admin@crm.local",
    password: "Admin@123",
    role:     "ADMIN" as const,
  },
  {
    name:     "Aarti Desai",
    email:    "aarti@crm.local",
    password: "Staff@123",
    role:     "STAFF" as const,
  },
  {
    name:     "Bala Murugan",
    email:    "bala@crm.local",
    password: "Staff@123",
    role:     "STAFF" as const,
  },
  {
    name:     "Chitra Iyer",
    email:    "chitra@crm.local",
    password: "Staff@123",
    role:     "STAFF" as const,
  },
  {
    name:     "Deepak Kumar",
    email:    "deepak@crm.local",
    password: "Staff@123",
    role:     "STAFF" as const,
  },
  {
    name:     "Eshaan Verma",
    email:    "eshaan@crm.local",
    password: "Staff@123",
    role:     "STAFF" as const,
  },
];

async function main() {
  console.log("🔐  Seeding auth users...\n");

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);

    // Link staff users to their corresponding Employee record
    let employeeId: string | undefined;
    if (u.role === "STAFF") {
      const emp = await prisma.employee.findFirst({
        where: { name: { contains: u.name.split(" ")[0], mode: "insensitive" } },
      });
      if (emp) employeeId = emp.id;
    }

    await prisma.user.upsert({
      where:  { email: u.email },
      update: { passwordHash, role: u.role, name: u.name, employeeId },
      create: { name: u.name, email: u.email, passwordHash, role: u.role, employeeId },
    });

    console.log(`   ✓ ${u.role.padEnd(5)} — ${u.email}  (password: ${u.password})`);
  }

  console.log("\n✅  Auth users seeded!\n");
  console.log("Test credentials:");
  console.log("  Admin : admin@crm.local   / Admin@123");
  console.log("  Staff : aarti@crm.local   / Staff@123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
