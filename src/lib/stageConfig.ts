// ─── Stage → Sub-stage Configuration ─────────────────────────────────────────
// Defines the complete CRM pipeline with dependent sub-stage options.
// Used in LeadForm to drive the stage/sub-stage dropdown dependency.
// ──────────────────────────────────────────────────────────────────────────────

export type StageName =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Application"
  | "Admission"
  | "Converted"
  | "Lost";

export interface SubStageOption {
  value: string;
  label: string;
}

export interface StageConfig {
  label:     string;
  subStages: SubStageOption[];
}

export const STAGE_CONFIG: Record<StageName, StageConfig> = {
  New: {
    label: "New",
    subStages: [
      { value: "Not_Contacted",     label: "Not Contacted" },
      { value: "Trying_to_Reach",   label: "Trying to Reach" },
    ],
  },
  Contacted: {
    label: "Contacted",
    subStages: [
      { value: "Interested",        label: "Interested" },
      { value: "Needs_Info",        label: "Needs Info" },
      { value: "Call_Back_Later",   label: "Call Back Later" },
    ],
  },
  Qualified: {
    label: "Qualified",
    subStages: [
      { value: "Counselling_Done",      label: "Counselling Done" },
      { value: "Documents_Requested",   label: "Documents Requested" },
    ],
  },
  Application: {
    label: "Application",
    subStages: [
      { value: "Documents_Pending",     label: "Documents Pending" },
      { value: "Application_Submitted", label: "Application Submitted" },
      { value: "Under_Review",          label: "Under Review" },
    ],
  },
  Admission: {
    label: "Admission",
    subStages: [
      { value: "Offer_Letter_Received", label: "Offer Letter Received" },
      { value: "Payment_Pending",       label: "Payment Pending" },
      { value: "Visa_in_Process",       label: "Visa in Process" },
    ],
  },
  Converted: {
    label: "Converted",
    subStages: [
      { value: "Enrolled",            label: "Enrolled" },
      { value: "Travel_Confirmed",    label: "Travel Confirmed" },
    ],
  },
  Lost: {
    label: "Lost",
    subStages: [
      { value: "Not_Interested",      label: "Not Interested" },
      { value: "Budget_Issue",        label: "Budget Issue" },
      { value: "Chose_Competitor",    label: "Chose Competitor" },
      { value: "Unresponsive",        label: "Unresponsive" },
      { value: "Requirements_Changing", label: "Requirements Changing" },
    ],
  },
};

export const STAGE_NAMES = Object.keys(STAGE_CONFIG) as StageName[];

/** Returns the first sub-stage for a given stage (used as reset default). */
export function getDefaultSubStage(stage: StageName): string {
  return STAGE_CONFIG[stage].subStages[0].value;
}

/** Returns all sub-stage values for a given stage. */
export function getSubStagesFor(stage: StageName): SubStageOption[] {
  return STAGE_CONFIG[stage]?.subStages ?? [];
}

/** Returns true if the given sub-stage is valid for the given stage. */
export function isValidSubStage(stage: StageName, subStage: string): boolean {
  return STAGE_CONFIG[stage]?.subStages.some((s) => s.value === subStage) ?? false;
}

// ─── Label helpers ─────────────────────────────────────────────────────────────

export function formatLeadSource(source: string): string {
  return source.replace(/_/g, " ");
}

export function formatStudyPreference(pref: string): string {
  return pref.replace(/_/g, " ");
}

export function formatSubStage(subStage: string): string {
  return subStage.replace(/_/g, " ");
}
