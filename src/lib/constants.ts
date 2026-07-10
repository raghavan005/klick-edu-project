// ─── Application Constants ────────────────────────────────────────────────────

export const LEAD_STATUSES = [
  "New", "Contacted", "Qualified", "Proposal", "Won", "Lost",
] as const;

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export const LEAD_SOURCES = [
  "Google_Ads", "LinkedIn_Referral", "Organic_Search",
  "Facebook_Campaign", "Direct_Visit", "Referral",
  "Cold_Call", "Email_Campaign", "Other",
] as const;

export const STUDY_PREFERENCES = [
  "Online", "Offline", "Hybrid", "Self_Paced",
] as const;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE     = 100;
