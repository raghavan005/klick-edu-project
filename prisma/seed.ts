// ─── Prisma Seed ──────────────────────────────────────────────────────────────
// Seeds: 5 Employees + 30 Leads with realistic data
// Run: npm run db:seed
// ──────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Static Seed Data ─────────────────────────────────────────────────────────

const employees = [
  { name: "Aarti Desai",  email: "aarti.desai@crm.internal",  role: "TEAM_LEAD" as const },
  { name: "Bala Murugan", email: "bala.murugan@crm.internal", role: "SALES_REP" as const },
  { name: "Chitra Iyer",  email: "chitra.iyer@crm.internal",  role: "SALES_REP" as const },
  { name: "Deepak Kumar", email: "deepak.kumar@crm.internal", role: "SALES_REP" as const },
  { name: "Eshaan Verma", email: "eshaan.verma@crm.internal", role: "MANAGER"   as const },
];

const courses = [
  "Full Stack Web Development",
  "Data Science & AI",
  "UI/UX Design",
  "Cloud Architecture",
  "Cybersecurity Professional",
  "Mobile App Development",
  "DevOps Engineering",
];

const locations = [
  { city: "Mumbai",    state: "Maharashtra", district: "Mumbai City"     },
  { city: "Pune",      state: "Maharashtra", district: "Pune"            },
  { city: "Bengaluru", state: "Karnataka",   district: "Bengaluru Urban" },
  { city: "Chennai",   state: "Tamil Nadu",  district: "Chennai"         },
  { city: "Delhi",     state: "Delhi",       district: "New Delhi"       },
  { city: "Hyderabad", state: "Telangana",   district: "Hyderabad"       },
  { city: "Kolkata",   state: "West Bengal", district: "Kolkata"         },
  { city: "Jaipur",    state: "Rajasthan",   district: "Jaipur"          },
  { city: "Ahmedabad", state: "Gujarat",     district: "Ahmedabad"       },
  { city: "Kochi",     state: "Kerala",      district: "Ernakulam"       },
];

const leadProfiles = [
  { fullName: "Arjun Mehta",     email: "arjun.mehta@example.com",     phone: "9876543210" },
  { fullName: "Priya Sharma",    email: "priya.sharma@example.com",    phone: "8765432109" },
  { fullName: "Rohan Verma",     email: "rohan.verma@example.com",     phone: "7654321098" },
  { fullName: "Neha Gupta",      email: "neha.gupta@example.com",      phone: "6543210987" },
  { fullName: "Aditya Nair",     email: "aditya.nair@example.com",     phone: "9988776655" },
  { fullName: "Sneha Reddy",     email: "sneha.reddy@example.com",     phone: "5432109876" },
  { fullName: "Vikram Malhotra", email: "vikram.malhotra@example.com", phone: "9123456789" },
  { fullName: "Pooja Patel",     email: "pooja.patel@example.com",     phone: "8123456789" },
  { fullName: "Pranav Patil",    email: "pranav.patil@example.com",    phone: "7123456789" },
  { fullName: "Anjali Deshmukh", email: "anjali.deshmukh@example.com", phone: "6123456789" },
  { fullName: "Vivek Johar",     email: "vivek.johar@example.com",     phone: "9234567890" },
  { fullName: "Meera Krishnan",  email: "meera.krishnan@example.com",  phone: "8234567890" },
  { fullName: "Ananya Roy",      email: "ananya.roy@example.com",      phone: "7234567890" },
  { fullName: "Kabir Das",       email: "kabir.das@example.com",       phone: "6234567890" },
  { fullName: "Siddharth Sen",   email: "siddharth.sen@example.com",   phone: "9345678901" },
  { fullName: "Ishaan Ahuja",    email: "ishaan.ahuja@example.com",    phone: "8345678901" },
  { fullName: "Zoya Akhtar",     email: "zoya.akhtar@example.com",     phone: "7345678901" },
  { fullName: "Ravi Chandran",   email: "ravi.chandran@example.com",   phone: "6345678901" },
  { fullName: "Shruti Bose",     email: "shruti.bose@example.com",     phone: "9456789012" },
  { fullName: "Nikhil Kamath",   email: "nikhil.kamath@example.com",   phone: "8456789012" },
  { fullName: "Divya Menon",     email: "divya.menon@example.com",     phone: "7456789012" },
  { fullName: "Harsh Pandey",    email: "harsh.pandey@example.com",    phone: "6456789012" },
  { fullName: "Tanya Kapoor",    email: "tanya.kapoor@example.com",    phone: "9567890123" },
  { fullName: "Faizan Qureshi",  email: "faizan.qureshi@example.com",  phone: "8567890123" },
  { fullName: "Ritika Singh",    email: "ritika.singh@example.com",    phone: "7567890123" },
  { fullName: "Karan Joshi",     email: "karan.joshi@example.com",     phone: "9678901234" },
  { fullName: "Nandini Pillai",  email: "nandini.pillai@example.com",  phone: "8678901234" },
  { fullName: "Akash Bhatt",     email: "akash.bhatt@example.com",     phone: "7678901234" },
  { fullName: "Simran Sethi",    email: "simran.sethi@example.com",    phone: "6678901234" },
  { fullName: "Yash Trivedi",    email: "yash.trivedi@example.com",    phone: "9789012345" },
];

const statusPool = [
  "New", "New", "New",
  "Contacted", "Contacted", "Contacted",
  "Qualified", "Qualified",
  "Proposal", "Proposal",
  "Won", "Won",
  "Lost",
] as const;

const stageMap: Record<string, { stage: string; subStages: readonly string[] }> = {
  New:       { stage: "New",       subStages: ["Not_Contacted", "Trying_to_Reach"] },
  Contacted: { stage: "Contacted", subStages: ["Interested", "Needs_Info", "Call_Back_Later"] },
  Qualified: { stage: "Qualified", subStages: ["Counselling_Done", "Documents_Requested"] },
  Proposal:  { stage: "Application", subStages: ["Documents_Pending", "Application_Submitted", "Under_Review"] },
  Won:       { stage: "Converted", subStages: ["Enrolled", "Travel_Confirmed"] },
  Lost:      { stage: "Lost",      subStages: ["Not_Interested", "Budget_Issue", "Chose_Competitor", "Unresponsive"] },
};

const priorities = ["Low", "Medium", "Medium", "High", "High", "Urgent"] as const;

const sources = [
  "Google_Ads", "Google_Ads",
  "LinkedIn_Referral", "LinkedIn_Referral",
  "Organic_Search", "Facebook_Campaign",
  "Direct_Visit", "Referral", "Cold_Call", "Email_Campaign",
] as const;

const studyPrefs = ["Online", "Online", "Online", "Hybrid", "Offline", "Self_Paced"] as const;

const noteTemplates = [
  (n: string) => `${n} expressed strong interest. Requested a detailed brochure and follow-up call.`,
  (n: string) => `Spoke with ${n}. Comparing with 2 other programs. Will revert in 3 days.`,
  (n: string) => `${n} completed the online assessment. Score: 78%. Eligible for the advanced batch.`,
  (n: string) => `Sent the detailed course syllabus and pricing to ${n}. Awaiting confirmation.`,
  (n: string) => `${n} raised a concern about batch timings. Offered weekend batch option.`,
  (n: string) => `Demo session conducted for ${n}. Positive feedback on the curriculum.`,
  (n: string) => `${n} requested a corporate group discount. Escalated to senior team.`,
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Starting seed...\n");

  // Wipe existing data in dependency order
  await prisma.leadActivity.deleteMany();
  await prisma.leadNote.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.employee.deleteMany();
  console.log("🧹  Cleared existing data");

  // ── Employees ───────────────────────────────────────────────────────────────
  const createdEmployees = await Promise.all(
    employees.map((e) => prisma.employee.create({ data: e }))
  );
  console.log(`👥  Created ${createdEmployees.length} employees`);

  // ── Leads ────────────────────────────────────────────────────────────────────
  for (let i = 0; i < leadProfiles.length; i++) {
    const profile   = leadProfiles[i];
    const employee  = randomFrom(createdEmployees);
    const status    = statusPool[i % statusPool.length];
    const location  = randomFrom(locations);
    const course    = randomFrom(courses);
    const createdAt = daysAgo(Math.floor(Math.random() * 60) + 1);

    let nextFollowUpDate: Date | null  = null;
    let lastContactedDate: Date | null = null;

    if (["Contacted", "Qualified", "Proposal"].includes(status)) {
      lastContactedDate = daysAgo(Math.floor(Math.random() * 7) + 1);
      nextFollowUpDate  = daysFromNow(Math.floor(Math.random() * 10) + 1);
    } else if (["Won", "Lost"].includes(status)) {
      lastContactedDate = daysAgo(Math.floor(Math.random() * 14) + 1);
    } else {
      nextFollowUpDate = daysFromNow(Math.floor(Math.random() * 5) + 1);
    }

    const stageInfo = stageMap[status];
    const subStage  = randomFrom(stageInfo.subStages);

    const lead = await prisma.lead.create({
      data: {
        fullName:          profile.fullName,
        email:             profile.email,
        phone:             profile.phone,
        country:           "India",
        state:             location.state,
        district:          location.district,
        city:              location.city,
        leadSource:        randomFrom(sources),
        courseInterest:    course,
        studyPreference:   randomFrom(studyPrefs),
        preferredCountry:  Math.random() > 0.6 ? "Canada" : null,
        stage:             stageInfo.stage,
        subStage,
        priority:          randomFrom(priorities),
        status,
        nextFollowUpDate,
        lastContactedDate,
        remarks:           status === "Lost" ? "Lead decided not to proceed at this time." : null,
        createdAt,
        assignedEmployeeId: employee.id,
      },
    });

    // Notes (skip some New leads)
    if (status !== "New" || Math.random() > 0.4) {
      const noteCount = Math.floor(Math.random() * 2) + 1;
      for (let n = 0; n < noteCount; n++) {
        const template    = randomFrom(noteTemplates);
        const firstName   = profile.fullName.split(" ")[0];
        const noteCreated = new Date(createdAt.getTime() + (n + 1) * 24 * 60 * 60 * 1000);
        await prisma.leadNote.create({
          data: {
            leadId:    lead.id,
            content:   template(firstName),
            createdBy: employee.name,
            createdAt: noteCreated,
          },
        });
      }
    }

    // Activities
    await prisma.leadActivity.create({
      data: {
        leadId:       lead.id,
        activityType: "lead_created",
        description:  `Lead "${profile.fullName}" was created and assigned to ${employee.name}.`,
        performedBy:  "System",
        createdAt,
      },
    });

    if (status !== "New") {
      await prisma.leadActivity.create({
        data: {
          leadId:       lead.id,
          activityType: "status_change",
          description:  `Status updated to ${status}.`,
          performedBy:  employee.name,
          createdAt:    new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  const [leads, notes, activities] = await Promise.all([
    prisma.lead.count(),
    prisma.leadNote.count(),
    prisma.leadActivity.count(),
  ]);

  console.log(`📋  Created ${leads} leads`);
  console.log(`📝  Created ${notes} notes`);
  console.log(`📊  Created ${activities} activities`);
  console.log("\n✅  Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
