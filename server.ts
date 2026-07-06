import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Lead, LeadStatus, Note } from "./src/types";

// In-memory Mock Database
let leads: Lead[] = [
  {
    id: "lead_1",
    name: "Arjun Mehta",
    mobile: "9876543210",
    email: "arjun.mehta@example.com",
    status: "New",
    assignedEmployee: "Aarti Desai",
    createdDate: "2026-06-15",
    address: "Flat 402, Sunset Heights, Mumbai, India",
    courseInterested: "Full Stack Web Development",
    leadSource: "Google Ads",
    notes: [
      {
        id: "note_1_1",
        content: "Expressed strong interest in React and Node.js. Requested callback after 5 PM.",
        createdDate: "2026-06-15T10:30:00Z",
        createdBy: "Aarti Desai"
      }
    ]
  },
  {
    id: "lead_2",
    name: "Priya Sharma",
    mobile: "8765432109",
    email: "sarah.j@example.com",
    status: "Contacted",
    assignedEmployee: "Bala Murugan",
    createdDate: "2026-06-18",
    address: "742 Evergreen Terrace, Springfield",
    courseInterested: "UI/UX Design",
    leadSource: "LinkedIn Referral",
    notes: [
      {
        id: "note_2_1",
        content: "Sent brochure. Priya asked about self-paced learning options.",
        createdDate: "2026-06-18T14:15:00Z",
        createdBy: "Bala Murugan"
      },
      {
        id: "note_2_2",
        content: "Followed up. She is reviewing the syllabus with her manager.",
        createdDate: "2026-06-20T11:00:00Z",
        createdBy: "Bala Murugan"
      }
    ]
  },
  {
    id: "lead_3",
    name: "Rohan Sharma",
    mobile: "7654321098",
    email: "rohan.sharma@example.com",
    status: "Qualified",
    assignedEmployee: "Aarti Desai",
    createdDate: "2026-06-20",
    address: "Sector 15, Vashi, Navi Mumbai",
    courseInterested: "Data Science & AI",
    leadSource: "Organic Search",
    notes: [
      {
        id: "note_3_1",
        content: "Cleared the technical aptitude test. Confirmed background in statistics.",
        createdDate: "2026-06-21T09:00:00Z",
        createdBy: "Aarti Desai"
      }
    ]
  },
  {
    id: "lead_4",
    name: "Neha Gupta",
    mobile: "6543210987",
    email: "emily.watson@example.com",
    status: "Proposal",
    assignedEmployee: "Chitra Iyer",
    createdDate: "2026-06-22",
    address: "12 Baker St, London",
    courseInterested: "Cloud Architecture",
    leadSource: "Direct Visit",
    notes: [
      {
        id: "note_4_1",
        content: "Shared detailed pricing and batch schedule for July cohort.",
        createdDate: "2026-06-22T16:45:00Z",
        createdBy: "Chitra Iyer"
      }
    ]
  },
  {
    id: "lead_5",
    name: "Aditya Nair",
    mobile: "9988776655",
    email: "aditya.n@example.com",
    status: "Won",
    assignedEmployee: "Deepak Kumar",
    createdDate: "2026-06-24",
    address: "Kochi, Kerala, India",
    courseInterested: "Cybersecurity Professional",
    leadSource: "Facebook Campaign",
    notes: [
      {
        id: "note_5_1",
        content: "Paid the admission deposit. Registered for the weekend batch starting July 11.",
        createdDate: "2026-06-24T12:00:00Z",
        createdBy: "Deepak Kumar"
      }
    ]
  },
  {
    id: "lead_6",
    name: "Sneha Reddy",
    mobile: "5432109876",
    email: "jessica.t@example.com",
    status: "Lost",
    assignedEmployee: "Eshaan Verma",
    createdDate: "2026-06-25",
    address: "88 Maple Drive, Boston",
    courseInterested: "Full Stack Web Development",
    leadSource: "Google Ads",
    notes: [
      {
        id: "note_6_1",
        content: "Decided to join an offline university degree instead. Closed.",
        createdDate: "2026-06-26T15:30:00Z",
        createdBy: "Eshaan Verma"
      }
    ]
  },
  {
    id: "lead_7",
    name: "Vikram Malhotra",
    mobile: "9123456789",
    email: "vikram.m@example.com",
    status: "New",
    assignedEmployee: "Chitra Iyer",
    createdDate: "2026-06-27",
    address: "GK-II, New Delhi, India",
    courseInterested: "Data Science & AI",
    leadSource: "LinkedIn Referral",
    notes: []
  },
  {
    id: "lead_8",
    name: "Pooja Patel",
    mobile: "8123456789",
    email: "sofia.r@example.com",
    status: "Contacted",
    assignedEmployee: "Deepak Kumar",
    createdDate: "2026-06-28",
    address: "Paseo de la Castellana, Madrid",
    courseInterested: "UI/UX Design",
    leadSource: "Facebook Campaign",
    notes: [
      {
        id: "note_8_1",
        content: "Called and had a brief chat. She requested evening batches.",
        createdDate: "2026-06-28T14:00:00Z",
        createdBy: "Deepak Kumar"
      }
    ]
  },
  {
    id: "lead_9",
    name: "Pranav Patil",
    mobile: "7123456789",
    email: "pranav.p@example.com",
    status: "Qualified",
    assignedEmployee: "Eshaan Verma",
    createdDate: "2026-06-29",
    address: "Kothrud, Pune, India",
    courseInterested: "Cloud Architecture",
    leadSource: "Direct Visit",
    notes: [
      {
        id: "note_9_1",
        content: "Cleared evaluation. Has 2 years of prior IT support experience.",
        createdDate: "2026-06-29T11:00:00Z",
        createdBy: "Eshaan Verma"
      }
    ]
  },
  {
    id: "lead_10",
    name: "Anjali Deshmukh",
    mobile: "6123456789",
    email: "chloe.b@example.com",
    status: "Proposal",
    assignedEmployee: "Bala Murugan",
    createdDate: "2026-06-30",
    address: "42 Wallaby Way, Sydney",
    courseInterested: "Cybersecurity Professional",
    leadSource: "Google Ads",
    notes: [
      {
        id: "note_10_1",
        content: "Customized quote sent for corporate training discount.",
        createdDate: "2026-06-30T17:00:00Z",
        createdBy: "Bala Murugan"
      }
    ]
  },
  {
    id: "lead_11",
    name: "Vivek Johar",
    mobile: "9234567890",
    email: "karan.j@example.com",
    status: "New",
    assignedEmployee: "Aarti Desai",
    createdDate: "2026-07-01",
    address: "Bandra West, Mumbai",
    courseInterested: "Full Stack Web Development",
    leadSource: "Organic Search",
    notes: []
  },
  {
    id: "lead_12",
    name: "Vivek Martinez",
    mobile: "8234567890",
    email: "olivia.m@example.com",
    status: "Contacted",
    assignedEmployee: "Bala Murugan",
    createdDate: "2026-07-01",
    address: "Broadway St, New York",
    courseInterested: "UI/UX Design",
    leadSource: "LinkedIn Referral",
    notes: [
      {
        id: "note_12_1",
        content: "Left a voicemail. Will retry tomorrow morning.",
        createdDate: "2026-07-01T09:30:00Z",
        createdBy: "Bala Murugan"
      }
    ]
  },
  {
    id: "lead_13",
    name: "Vivek Roy",
    mobile: "7234567890",
    email: "ananya.r@example.com",
    status: "Qualified",
    assignedEmployee: "Chitra Iyer",
    createdDate: "2026-07-02",
    address: "Salt Lake, Kolkata, India",
    courseInterested: "Data Science & AI",
    leadSource: "Direct Visit",
    notes: [
      {
        id: "note_13_1",
        content: "Highly qualified. Completed pre-requisite python basic test.",
        createdDate: "2026-07-02T13:45:00Z",
        createdBy: "Chitra Iyer"
      }
    ]
  },
  {
    id: "lead_14",
    name: "Vivek Dupont",
    mobile: "6234567890",
    email: "lucas.d@example.com",
    status: "Proposal",
    assignedEmployee: "Deepak Kumar",
    createdDate: "2026-07-02",
    address: "Rue de Rivoli, Paris",
    courseInterested: "Cloud Architecture",
    leadSource: "Google Ads",
    notes: [
      {
        id: "note_14_1",
        content: "Syllabus, pricing, and FAQ document sent.",
        createdDate: "2026-07-02T15:00:00Z",
        createdBy: "Deepak Kumar"
      }
    ]
  },
  {
    id: "lead_15",
    name: "Vivek Sen",
    mobile: "9345678901",
    email: "sid.sen@example.com",
    status: "Won",
    assignedEmployee: "Eshaan Verma",
    createdDate: "2026-07-03",
    address: "Jayanagar, Bengaluru, India",
    courseInterested: "Cybersecurity Professional",
    leadSource: "Facebook Campaign",
    notes: [
      {
        id: "note_15_1",
        content: "Confirmed admission. Document verification complete.",
        createdDate: "2026-07-03T11:15:00Z",
        createdBy: "Eshaan Verma"
      }
    ]
  },
  {
    id: "lead_16",
    name: "Vivek Andersen",
    mobile: "8345678901",
    email: "mia.a@example.com",
    status: "Lost",
    assignedEmployee: "Aarti Desai",
    createdDate: "2026-07-03",
    address: "Copenhagen, Denmark",
    courseInterested: "UI/UX Design",
    leadSource: "Organic Search",
    notes: [
      {
        id: "note_16_1",
        content: "Budget issues. Cannot afford the course fee at the moment.",
        createdDate: "2026-07-03T16:20:00Z",
        createdBy: "Aarti Desai"
      }
    ]
  },
  {
    id: "lead_17",
    name: "Vivek Das",
    mobile: "7345678901",
    email: "kabir.das@example.com",
    status: "New",
    assignedEmployee: "Bala Murugan",
    createdDate: "2026-07-04",
    address: "Varanasi, UP, India",
    courseInterested: "Full Stack Web Development",
    leadSource: "Google Ads",
    notes: []
  },
  {
    id: "lead_18",
    name: "Vivek Mueller",
    mobile: "6345678901",
    email: "alex.m@example.com",
    status: "Contacted",
    assignedEmployee: "Chitra Iyer",
    createdDate: "2026-07-04",
    address: "Munich, Germany",
    courseInterested: "Cloud Architecture",
    leadSource: "LinkedIn Referral",
    notes: []
  },
  {
    id: "lead_19",
    name: "Vivek Krishnan",
    mobile: "9456789012",
    email: "meera.k@example.com",
    status: "Qualified",
    assignedEmployee: "Deepak Kumar",
    createdDate: "2026-07-04",
    address: "Adyar, Chennai, India",
    courseInterested: "Data Science & AI",
    leadSource: "Direct Visit",
    notes: [
      {
        id: "note_19_1",
        content: "Completed math/stat background assessment. Eligible for scholarship.",
        createdDate: "2026-07-04T14:30:00Z",
        createdBy: "Deepak Kumar"
      }
    ]
  },
  {
    id: "lead_20",
    name: "Vivek Kim",
    mobile: "8456789012",
    email: "daniel.kim@example.com",
    status: "Proposal",
    assignedEmployee: "Eshaan Verma",
    createdDate: "2026-07-05",
    address: "Gangnam-gu, Seoul, South Korea",
    courseInterested: "Full Stack Web Development",
    leadSource: "Facebook Campaign",
    notes: []
  },
  {
    id: "lead_21",
    name: "Vivek Akhtar",
    mobile: "7456789012",
    email: "zoya.a@example.com",
    status: "New",
    assignedEmployee: "Aarti Desai",
    createdDate: "2026-07-05",
    address: "Juhu, Mumbai, India",
    courseInterested: "UI/UX Design",
    leadSource: "Organic Search",
    notes: []
  },
  {
    id: "lead_22",
    name: "Vivek Turner",
    mobile: "6456789012",
    email: "will.turner@example.com",
    status: "Contacted",
    assignedEmployee: "Bala Murugan",
    createdDate: "2026-07-05",
    address: "Port Royal, Jamaica",
    courseInterested: "Cybersecurity Professional",
    leadSource: "Direct Visit",
    notes: [
      {
        id: "note_22_1",
        content: "Spoke briefly, scheduled a tech-call demo next week.",
        createdDate: "2026-07-05T09:15:00Z",
        createdBy: "Bala Murugan"
      }
    ]
  },
  {
    id: "lead_23",
    name: "Vivek Kamath",
    mobile: "9567890123",
    email: "nikhil.k@example.com",
    status: "Qualified",
    assignedEmployee: "Chitra Iyer",
    createdDate: "2026-07-05",
    address: "Indiranagar, Bengaluru, India",
    courseInterested: "Data Science & AI",
    leadSource: "LinkedIn Referral",
    notes: []
  },
  {
    id: "lead_24",
    name: "Vivek Qureshi",
    mobile: "8567890123",
    email: "fiona.g@example.com",
    status: "Proposal",
    assignedEmployee: "Deepak Kumar",
    createdDate: "2026-07-05",
    address: "South Side, Chicago",
    courseInterested: "Full Stack Web Development",
    leadSource: "Google Ads",
    notes: []
  },
  {
    id: "lead_25",
    name: "Vivek Sunak",
    mobile: "7567890123",
    email: "rishi.s@example.com",
    status: "Won",
    assignedEmployee: "Eshaan Verma",
    createdDate: "2026-07-05",
    address: "Richmond, Yorkshire, UK",
    courseInterested: "Cloud Architecture",
    leadSource: "Organic Search",
    notes: [
      {
        id: "note_25_1",
        content: "Syllabus reviewed. Full tuition fee paid upfront.",
        createdDate: "2026-07-05T11:00:00Z",
        createdBy: "Eshaan Verma"
      }
    ]
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get stats of leads
  app.get("/api/leads/stats", (req, res) => {
    try {
      const stats = {
        total: leads.length,
        New: leads.filter(l => l.status === "New").length,
        Contacted: leads.filter(l => l.status === "Contacted").length,
        Qualified: leads.filter(l => l.status === "Qualified").length,
        Proposal: leads.filter(l => l.status === "Proposal").length,
        Won: leads.filter(l => l.status === "Won").length,
        Lost: leads.filter(l => l.status === "Lost").length,
      };
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // API Route: Get filtered, searched, and paginated leads
  app.get("/api/leads", (req, res) => {
    try {
      const { search, status, assignedEmployee, startDate, endDate, page, limit } = req.query;

      let filteredLeads = [...leads];

      // 1. Search filter (Name, Mobile, Email)
      if (search) {
        const searchStr = String(search).toLowerCase();
        filteredLeads = filteredLeads.filter(
          (lead) =>
            lead.name.toLowerCase().includes(searchStr) ||
            lead.mobile.includes(searchStr) ||
            lead.email.toLowerCase().includes(searchStr)
        );
      }

      // 2. Status filter
      if (status && status !== "All") {
        filteredLeads = filteredLeads.filter(
          (lead) => lead.status === status
        );
      }

      // 3. Assigned Employee filter
      if (assignedEmployee && assignedEmployee !== "All") {
        filteredLeads = filteredLeads.filter(
          (lead) => lead.assignedEmployee === assignedEmployee
        );
      }

      // 4. Date Range filter (Created Date)
      if (startDate) {
        filteredLeads = filteredLeads.filter(
          (lead) => lead.createdDate >= String(startDate)
        );
      }
      if (endDate) {
        filteredLeads = filteredLeads.filter(
          (lead) => lead.createdDate <= String(endDate)
        );
      }

      // Sort by createdDate desc, then id desc
      filteredLeads.sort((a, b) => {
        const dateCompare = b.createdDate.localeCompare(a.createdDate);
        if (dateCompare !== 0) return dateCompare;
        return b.id.localeCompare(a.id);
      });

      // Pagination calculation
      const totalCount = filteredLeads.length;
      const parsedPage = parseInt(String(page)) || 1;
      const parsedLimit = parseInt(String(limit)) || 10;
      const totalPages = Math.ceil(totalCount / parsedLimit) || 1;
      const currentPage = Math.max(1, Math.min(parsedPage, totalPages));

      const startIndex = (currentPage - 1) * parsedLimit;
      const endIndex = startIndex + parsedLimit;
      const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

      res.json({
        leads: paginatedLeads,
        totalCount,
        totalPages,
        currentPage,
        limit: parsedLimit
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // API Route: Get single lead details
  app.get("/api/leads/:id", (req, res) => {
    try {
      const lead = leads.find((l) => l.id === req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // API Route: Update a lead
  app.put("/api/leads/:id", (req, res) => {
    try {
      const { name, mobile, email, status, assignedEmployee } = req.body;

      // Simple server-side validation
      if (!name || !mobile || !email || !status || !assignedEmployee) {
        return res.status(400).json({ error: "All fields (Name, Mobile, Email, Status, Assigned Employee) are required" });
      }

      const index = leads.findIndex((l) => l.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Lead not found" });
      }

      leads[index] = {
        ...leads[index],
        name,
        mobile,
        email,
        status: status as LeadStatus,
        assignedEmployee
      };

      res.json(leads[index]);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // API Route: Add a note to a lead
  app.post("/api/leads/:id/notes", (req, res) => {
    try {
      const { content, createdBy } = req.body;
      if (!content || !createdBy) {
        return res.status(400).json({ error: "Content and Created By are required fields" });
      }

      const index = leads.findIndex((l) => l.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Lead not found" });
      }

      const newNote: Note = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        content,
        createdDate: new Date().toISOString(),
        createdBy
      };

      leads[index].notes.push(newNote);
      res.status(210).json(leads[index]); // Return updated lead or the specific note
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // API Route: Edit a note
  app.put("/api/leads/:id/notes/:noteId", (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required to edit note" });
      }

      const leadIndex = leads.findIndex((l) => l.id === req.params.id);
      if (leadIndex === -1) {
        return res.status(404).json({ error: "Lead not found" });
      }

      const noteIndex = leads[leadIndex].notes.findIndex((n) => n.id === req.params.noteId);
      if (noteIndex === -1) {
        return res.status(404).json({ error: "Note not found" });
      }

      leads[leadIndex].notes[noteIndex].content = content;
      // Also update the note's timestamp
      leads[leadIndex].notes[noteIndex].createdDate = new Date().toISOString();

      res.json(leads[leadIndex]);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // API Route: Delete a note
  app.delete("/api/leads/:id/notes/:noteId", (req, res) => {
    try {
      const leadIndex = leads.findIndex((l) => l.id === req.params.id);
      if (leadIndex === -1) {
        return res.status(404).json({ error: "Lead not found" });
      }

      const noteIndex = leads[leadIndex].notes.findIndex((n) => n.id === req.params.noteId);
      if (noteIndex === -1) {
        return res.status(404).json({ error: "Note not found" });
      }

      leads[leadIndex].notes.splice(noteIndex, 1);
      res.json(leads[leadIndex]);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
