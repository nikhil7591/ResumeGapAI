export type Plan = "free" | "pro";

export interface User {
  id: string;
  email: string;
  plan: Plan;
  subscription_status: string | null;
  access_token?: string;
}

export interface InterviewPrepItem {
  gap: string;
  question: string;
  answer_outline: string;
}

export interface Review {
  id: string;
  created_at: string;
  resume_text: string;
  jd_text: string;
  match_score: number;
  gaps: string[];
  weak_areas: string[];
  strengths: string[];
  suggestions: string[];
  summary: string;
  plan_at_time: Plan;
  ats_score: number;
  readability_score: number;
  keyword_match_score: number;
  impact_score: number;
  interview_prep: InterviewPrepItem[];
}

export interface ReviewListItem {
  id: string;
  created_at: string;
  match_score: number;
  summary: string;
  plan_at_time: Plan;
}

export interface Usage {
  used_today: number;
  limit: number;
  plan: Plan;
}

export interface BillingStatus {
  plan: Plan;
  subscription_status: string | null;
}
