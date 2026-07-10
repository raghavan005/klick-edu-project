// ─── Shared Application Types ─────────────────────────────────────────────────
// Client-facing types consumed by React components AND the Express server.
// ──────────────────────────────────────────────────────────────────────────────

export type LeadStatus      = "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
export type LeadStage       = string;   // free-form — driven by stageConfig.ts
export type LeadSubStage    = string;   // free-form — driven by stageConfig.ts
export type Priority        = "Low" | "Medium" | "High" | "Urgent";
export type LeadSource      = "Google_Ads" | "LinkedIn_Referral" | "Organic_Search" | "Facebook_Campaign" | "Direct_Visit" | "Referral" | "Cold_Call" | "Email_Campaign" | "Other";
export type StudyPreference = "India" | "Abroad";
export type EmployeeRole    = "SALES_REP" | "TEAM_LEAD" | "MANAGER" | "ADMIN";

// ─── Entity Types ─────────────────────────────────────────────────────────────

export interface Employee {
  id:        string;
  name:      string;
  email:     string;
  role:      EmployeeRole;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id:        string;
  leadId:    string;
  content:   string;
  createdBy: string;
  createdAt: string;  // ISO string
  updatedAt: string;
  // Legacy alias kept so existing components don't break
  createdDate?: string;
}

export interface LeadActivity {
  id:           string;
  leadId:       string;
  activityType: string;
  description:  string;
  performedBy:  string;
  createdAt:    string;
}

export interface Lead {
  id:                 string;
  fullName:           string;
  email:              string;
  phone:              string;
  country:            string;
  state:              string | null;
  district:           string | null;
  city:               string | null;
  leadSource:         LeadSource;
  courseInterest:     string;
  studyPreference:    StudyPreference;
  preferredCountry:   string | null;
  stage:              LeadStage;
  subStage:           LeadSubStage;
  priority:           Priority;
  status:             LeadStatus;
  nextFollowUpDate:   string | null;
  lastContactedDate:  string | null;
  remarks:            string | null;
  // ── Computed follow-up status (set by service layer) ──────────────────────
  followUpStatus:     "overdue" | "due_today" | "upcoming" | "no_followup" | null;
  createdAt:          string;
  updatedAt:          string;
  assignedEmployeeId: string | null;
  assignedEmployee:   Employee | null;
  notes:              Note[];
  activities?:        LeadActivity[];
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface LeadsResponse {
  leads:       Lead[];
  totalCount:  number;
  totalPages:  number;
  currentPage: number;
  limit:       number;
}

export interface DashboardStats {
  totalLeads:       number;
  newToday:         number;
  newThisWeek:      number;
  converted:        number;
  pendingFollowUps: number;
  byStatus: {
    New:       number;
    Contacted: number;
    Qualified: number;
    Proposal:  number;
    Won:       number;
    Lost:      number;
  };
}

export interface DashboardMetrics {
  totalLeads:        number;
  newToday:          number;
  newThisWeek:       number;
  convertedLeads:    number;
  lostLeads:         number;
  pendingFollowUps:  number;
  overdueFollowUps:  number;
  dueTodayFollowUps: number;
}

export interface StageCount {
  stage: string;
  count: number;
}

export interface SourceCount {
  source: string;
  count: number;
}

export interface PriorityBucket {
  label: "Hot" | "Warm" | "Cold";
  count: number;
}

export interface EmployeeLeadCount {
  employeeId:   string | null;
  employeeName: string;
  count:        number;
}

export interface WeeklyLeadCount {
  week:  string;
  count: number;
}

export interface UpcomingFollowUp {
  leadId:           string;
  leadName:         string;
  assignedEmployee: string;
  nextFollowUpDate: string;
  priority:         string;
  daysRemaining:    number;
  isOverdue:        boolean;
}

export interface DashboardData {
  metrics:            DashboardMetrics;
  pipeline:           StageCount[];
  leadSources:        SourceCount[];
  priority:           PriorityBucket[];
  employees:          EmployeeLeadCount[];
  weeklyLeads:        WeeklyLeadCount[];
  recentActivity:     LeadActivity[];
  upcomingFollowUps:  UpcomingFollowUp[];
}

// ─── Legacy shape — used by existing UI components (App.tsx, modals, etc.) ───
// The components still reference `lead.name`, `lead.mobile`, etc.
// The API adapter in server.ts converts Lead → LegacyLead for backward compat.

export interface LegacyLead {
  id:               string;
  name:             string;
  mobile:           string;
  email:            string;
  status:           LeadStatus;
  assignedEmployee: string;
  createdDate:      string;
  address:          string;
  courseInterested: string;
  leadSource:       string;
  notes: {
    id:          string;
    content:     string;
    createdDate: string;
    createdBy:   string;
  }[];
}

/** Legacy lead shape plus extended fields returned by the API adapter. */
export interface ExtendedLegacyLead extends LegacyLead {
  fullName?:           string;
  phone?:              string;
  country?:            string;
  state?:              string | null;
  district?:           string | null;
  city?:               string | null;
  leadSourceRaw?:      string;
  courseInterest?:     string;
  studyPreference?:    StudyPreference;
  preferredCountry?:   string | null;
  stage?:              string;
  subStage?:           string;
  priority?:           string;
  nextFollowUpDate?:   string | null;
  lastContactedDate?:  string | null;
  remarks?:            string | null;
  assignedEmployeeId?: string | null;
  createdAt?:          string;
  updatedAt?:          string;
  activities?:         LeadActivity[];
}

export interface LegacyLeadsResponse {
  leads:       LegacyLead[];
  totalCount:  number;
  totalPages:  number;
  currentPage: number;
  limit:       number;
}
