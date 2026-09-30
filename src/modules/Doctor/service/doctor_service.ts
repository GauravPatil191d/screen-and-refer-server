import { RiskLevel, ScreeningStatus } from "../../HealthWorker/screening/model/screening_model.js";
import { screeningConfig } from "../../HealthWorker/screening/config/screening_config.js";
import {
  DoctorReviewAction,
  DoctorScreeningQuery,
} from "../model/doctor_model.js";
import DoctorRepository from "../repository/doctor_repository.js";
import GeminiSummaryService from "./gemini_summary_service.js";

const unavailableSummary = {
  available: false,
  message: "AI summary is currently unavailable.",
};

export default class DoctorService {
  static async GetScreenings(query: DoctorScreeningQuery) {
    return DoctorRepository.GetScreenings(query);
  }

  static async GetScreening(screeningId: string) {
    const result = await DoctorRepository.GetScreening(screeningId);

    if (!result) {
      throw new Error("Screening not found");
    }

    return result;
  }

  static async ReviewScreening(
    screeningId: string,
    doctorId: string,
    input: { action?: unknown; riskLevel?: unknown; reason?: unknown },
  ) {
    if (input.action !== "ACCEPT" && input.action !== "OVERRIDE") {
      throw new Error("action must be ACCEPT or OVERRIDE");
    }

    let riskLevel: RiskLevel | undefined;
    let reason: string | undefined;

    if (input.action === "OVERRIDE") {
      if (!Object.values(RiskLevel).includes(input.riskLevel as RiskLevel)) {
        throw new Error("A valid riskLevel is required for OVERRIDE");
      }

      if (typeof input.reason !== "string" || !input.reason.trim()) {
        throw new Error("A non-empty reason is required for OVERRIDE");
      }

      riskLevel = input.riskLevel as RiskLevel;
      reason = input.reason.trim();
    }

    const review = await DoctorRepository.ReviewScreening(
      screeningId,
      doctorId,
      input.action as DoctorReviewAction,
      riskLevel,
      reason,
    );

    if (!review) {
      throw new Error("Completed screening not found");
    }

    return review;
  }

  static async GetAuditHistory(screeningId: string) {
    const auditHistory = await DoctorRepository.GetAuditHistory(screeningId);

    if (!auditHistory) {
      throw new Error("Screening not found");
    }

    return auditHistory;
  }

  static async GenerateSummary(screeningId: string) {
    const result = await DoctorRepository.GetScreening(screeningId);

    if (!result) {
      throw new Error("Screening not found");
    }

    if (result.screening.status !== ScreeningStatus.COMPLETED) {
      throw new Error("A screening must be completed before generating a summary");
    }

    if (result.aiSummary) {
      return { available: true, ...result.aiSummary };
    }

    try {
      const systemRisk = result.screening.systemRisk ?? result.screening.riskLevel;

      if (!systemRisk) {
        throw new Error("Screening has no system risk");
      }

      const answerById = result.screening.answers;
      const input = {
        ageAtScreening: result.screening.ageAtScreening,
        sexAtScreening: result.screening.sexAtScreening,
        systemRisk,
        answers: screeningConfig.questions
          .filter((question) => !question.source && typeof answerById[question.id] === "boolean")
          .map((question) => ({
            question: question.text,
            answer: answerById[question.id],
          })),
      };
      const summary = await GeminiSummaryService.Generate(input);
      const saved = await DoctorRepository.SaveAiSummary(screeningId, summary);

      if (!saved) {
        throw new Error("Screening summary could not be saved");
      }

      return { available: true, ...summary };
    } catch {
      return unavailableSummary;
    }
  }
}