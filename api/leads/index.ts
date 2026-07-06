import type { VercelRequest, VercelResponse } from "@vercel/node";
import { leads } from "../_data";
import { LeadStatus } from "../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { search, status, assignedEmployee, startDate, endDate, page, limit } = req.query;

  let filtered = [...leads];

  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(l =>
      l.name.toLowerCase().includes(s) ||
      l.mobile.includes(s) ||
      l.email.toLowerCase().includes(s)
    );
  }
  if (status && status !== "All") {
    filtered = filtered.filter(l => l.status === (status as LeadStatus));
  }
  if (assignedEmployee && assignedEmployee !== "All") {
    filtered = filtered.filter(l => l.assignedEmployee === assignedEmployee);
  }
  if (startDate) filtered = filtered.filter(l => l.createdDate >= String(startDate));
  if (endDate)   filtered = filtered.filter(l => l.createdDate <= String(endDate));

  filtered.sort((a, b) => {
    const d = b.createdDate.localeCompare(a.createdDate);
    return d !== 0 ? d : b.id.localeCompare(a.id);
  });

  const totalCount  = filtered.length;
  const parsedPage  = parseInt(String(page))  || 1;
  const parsedLimit = parseInt(String(limit)) || 10;
  const totalPages  = Math.ceil(totalCount / parsedLimit) || 1;
  const currentPage = Math.max(1, Math.min(parsedPage, totalPages));
  const start = (currentPage - 1) * parsedLimit;

  res.json({
    leads: filtered.slice(start, start + parsedLimit),
    totalCount,
    totalPages,
    currentPage,
    limit: parsedLimit,
  });
}
