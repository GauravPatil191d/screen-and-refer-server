import { PatientSex } from "../../patient/model/patient_model.js";
import type { AiSummaryData, DoctorReviewData } from "../../../Doctor/model/doctor_model.js";

export enum ScreeningStatus {
  DRAFT = "DRAFT",
  COMPLETED = "COMPLETED",
}

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export interface ScreeningData {
  screeningId: string;
  patientId: string;
  createdBy: string;
  ageAtScreening: number;
  sexAtScreening: PatientSex;
  status: ScreeningStatus;
  configVersion: string;
  answers: Record<string, boolean>;
  inactiveAnswers: Record<string, {
    value: boolean;
    status: "INACTIVE";
    inactiveReason: "CONDITION_NO_LONGER_MATCHES";
    recordedAt: Date;
  }>;
  startedAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  riskLevel?: RiskLevel;
  systemRisk?: RiskLevel;
  finalRisk?: RiskLevel;
  reviewAction?: DoctorReviewData["action"];
  reviewedBy?: string;
  reviewedAt?: Date;
  overrideReason?: string;
  review?: DoctorReviewData;
  aiSummary?: AiSummaryData;
  doctorReviewStatus: "PENDING" | "REVIEWED";
}

export default class ScreeningEntity implements ScreeningData {
  screeningId: string;
  patientId: string;
  createdBy: string;
  ageAtScreening: number;
  sexAtScreening: PatientSex;
  status: ScreeningStatus;
  configVersion: string;
  answers: Record<string, boolean>;
  inactiveAnswers: ScreeningData["inactiveAnswers"];
  startedAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  riskLevel?: RiskLevel;
  systemRisk?: RiskLevel;
  finalRisk?: RiskLevel;
  reviewAction?: DoctorReviewData["action"];
  reviewedBy?: string;
  reviewedAt?: Date;
  overrideReason?: string;
  review?: DoctorReviewData;
  aiSummary?: AiSummaryData;
  doctorReviewStatus: "PENDING" | "REVIEWED";

  constructor(screening: ScreeningData) {
    this.screeningId = screening.screeningId;
    this.patientId = screening.patientId;
    this.createdBy = screening.createdBy;
    this.ageAtScreening = screening.ageAtScreening;
    this.sexAtScreening = screening.sexAtScreening;
    this.status = screening.status;
    this.configVersion = screening.configVersion;
    this.answers = screening.answers;
    this.inactiveAnswers = screening.inactiveAnswers;
    this.startedAt = screening.startedAt;
    this.updatedAt = screening.updatedAt;
    this.submittedAt = screening.submittedAt;
    this.riskLevel = screening.riskLevel;
    this.systemRisk = screening.systemRisk;
    this.finalRisk = screening.finalRisk;
    this.reviewAction = screening.reviewAction;
    this.reviewedBy = screening.reviewedBy;
    this.reviewedAt = screening.reviewedAt;
    this.overrideReason = screening.overrideReason;
    this.review = screening.review;
    this.aiSummary = screening.aiSummary;
    this.doctorReviewStatus = screening.doctorReviewStatus;
  }
}