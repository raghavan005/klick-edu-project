export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';

export interface Note {
  id: string;
  content: string;
  createdDate: string;
  createdBy: string;
}

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email: string;
  status: LeadStatus;
  assignedEmployee: string;
  createdDate: string; // ISO String or YYYY-MM-DD
  address: string;
  courseInterested: string;
  leadSource: string;
  notes: Note[];
}

export interface LeadsResponse {
  leads: Lead[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}
