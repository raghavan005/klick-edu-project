// ─── StudyPreference Enum Migration ───────────────────────────────────────────
// Maps legacy values (Online, Offline, Hybrid, Self_Paced) → India / Abroad
// before Prisma can apply the new enum via `db:push`.
//
// Run: npm run db:migrate-study-preference
// Then: npm run db:push
// ──────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEGACY_VALUES = ["Online", "Offline", "Hybrid", "Self_Paced"] as const;

async function getEnumLabels(): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
    SELECT e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'StudyPreference'
    ORDER BY e.enumsortorder
  `;
  return rows.map((r) => r.enumlabel);
}

async function main() {
  console.log("🔍  Checking StudyPreference enum…\n");

  const labels = await getEnumLabels();

  if (labels.length === 0) {
    console.log("ℹ️  StudyPreference enum not found — run `npm run db:push` on a fresh database.");
    return;
  }

  const hasLegacy = LEGACY_VALUES.some((v) => labels.includes(v));
  const isDone    = labels.includes("India") && labels.includes("Abroad") && !hasLegacy;

  if (isDone) {
    console.log("✅  StudyPreference already uses India / Abroad. Nothing to do.");
    return;
  }

  console.log(`   Current values: ${labels.join(", ")}`);
  console.log("🔄  Migrating existing lead data…\n");

  // Clean up a partial failed db:push (Prisma leaves StudyPreference_new behind)
  await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "StudyPreference_new"`);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "leads" ALTER COLUMN "studyPreference" DROP DEFAULT
  `);

  // Convert enum column → text so we can rewrite values freely
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "leads"
      ALTER COLUMN "studyPreference" TYPE text
      USING "studyPreference"::text
  `);

  // Map legacy study modes → India; keep Abroad when already set
  await prisma.$executeRawUnsafe(`
    UPDATE "leads"
    SET "studyPreference" = CASE
      WHEN "studyPreference" IN ('Online', 'Offline', 'Hybrid', 'Self_Paced') THEN 'India'
      WHEN "studyPreference" = 'Abroad' THEN 'Abroad'
      WHEN "studyPreference" = 'India'  THEN 'India'
      ELSE 'India'
    END
  `);

  // Replace old enum type with the new one
  await prisma.$executeRawUnsafe(`DROP TYPE "StudyPreference"`);
  await prisma.$executeRawUnsafe(`CREATE TYPE "StudyPreference" AS ENUM ('India', 'Abroad')`);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "leads"
      ALTER COLUMN "studyPreference" TYPE "StudyPreference"
      USING "studyPreference"::"StudyPreference"
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "leads"
      ALTER COLUMN "studyPreference" SET DEFAULT 'India'::"StudyPreference"
  `);

  const updated = await getEnumLabels();
  const count   = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM "leads"
  `;

  console.log(`✅  Migration complete.`);
  console.log(`   New enum values: ${updated.join(", ")}`);
  console.log(`   Leads updated:   ${count[0]?.count ?? 0}`);
  console.log("\n👉  Next step: npm run db:push");
}

main()
  .catch((err) => {
    console.error("❌  Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
