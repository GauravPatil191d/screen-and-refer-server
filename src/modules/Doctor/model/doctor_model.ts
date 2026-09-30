import { RiskLevel, ScreeningStatus } from "../../HealthWorker/screening/model/screening_model.js";

export type DoctorReviewAction = "ACCEPT" | "OVERRIDE";

export interface DoctorReviewData {
  action: DoctorReviewAction;
  systemRisk: RiskLevel;
  finalRisk: RiskLevel;
  reviewedBy: string;
  reviewedAt: Date;
  overrideReason?: string;
}

export interface AiSummaryData {
  english: string;
  marathi: string;
  generatedAt: Date;
  model: string;
}

export interface DoctorScreeningListItem {
  screeningId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  ageAtScreening: number;
  sexAtScreening: string;
  systemRisk?: RiskLevel;
  finalRisk?: RiskLevel;
  riskLevel?: RiskLevel;
  status: ScreeningStatus;
  doctorReviewStatus: "PENDING" | "REVIEWED";
  startedAt: Date;
  submittedAt?: Date;
  createdBy: string;
}

export interface ScreeningAuditData {
  auditId: string;
  screeningId: string;
  doctorId: string;
  action: DoctorReviewAction;
  oldRiskLevel: RiskLevel;
  newRiskLevel: RiskLevel;
  reason?: string;
  createdAt: Date;
}

export interface DoctorScreeningQuery {
  page: number;
  limit: number;
  search?: string;
  riskLevel?: RiskLevel;
  status?: ScreeningStatus;
}