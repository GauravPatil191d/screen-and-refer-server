import { randomUUID } from "node:crypto";
import { getClient } from "../../../config/db.js";
import { PatientData } from "../../HealthWorker/patient/model/patient_model.js";
import {
  ScreeningData,
  ScreeningStatus,
  RiskLevel,
} from "../../HealthWorker/screening/model/screening_model.js";
import {
  AiSummaryData,
  DoctorReviewAction,
  DoctorReviewData,
  DoctorScreeningListItem,
  DoctorScreeningQuery,
  ScreeningAuditData,
} from "../model/doctor_model.js";

export default class DoctorRepository {
  private static async collections() {
    const client = await getClient();
    const database = client.db("master");
    const screenings = database.collection<ScreeningData>("screenings");
    const patients = database.collection<PatientData>("patients");
    const auditLogs = database.collection<ScreeningAuditData>("screening_audit_logs");

    await auditLogs.createIndex(
      { auditId: 1 },
      { unique: true, name: "screening_audit_id_unique" },
    );
    await auditLogs.createIndex(
      { screeningId: 1, createdAt: -1 },
      { name: "screening_audit_history" },
    );

    return { client, screenings, patients, auditLogs };
  }

  static async GetScreenings(query: DoctorScreeningQuery) {
    const { screenings } = await this.collections();
    const match: Record<string, unknown> = {
      status: query.status ?? ScreeningStatus.COMPLETED,
    };

    if (query.riskLevel) {
      match.effectiveSystemRisk = query.riskLevel;
    }

    if (query.search) {
      const escapedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(escapedSearch, "i");
      let phoneSearch = query.search.replace(/\D/g, "");

      if (phoneSearch.length === 12 && phoneSearch.startsWith("91")) {
        phoneSearch = phoneSearch.slice(2);
      } else if (phoneSearch.length === 11 && phoneSearch.startsWith("0")) {
        phoneSearch = phoneSearch.slice(1);
      }

      const searchConditions: Record<string, unknown>[] = [
        { "patient.name": pattern },
        { screeningId: pattern },
      ];

      if (phoneSearch) {
        searchConditions.push({ "patient.phone": { $regex: phoneSearch } });
      }

      match.$or = searchConditions;
    }

    const [result] = await screenings.aggregate<{
      data: DoctorScreeningListItem[];
      total: { count: number }[];
    }>([
      {
        $lookup: {
          from: "patients",
          localField: "patientId",
          foreignField: "patientId",
          as: "patient",
        },
      },
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          sortAt: { $ifNull: ["$submittedAt", "$startedAt"] },
          effectiveSystemRisk: { $ifNull: ["$systemRisk", "$riskLevel"] },
        },
      },
      { $match: match },
      {
        $facet: {
          data: [
            { $sort: { sortAt: -1, _id: -1 } },
            { $skip: (query.page - 1) * query.limit },
            { $limit: query.limit },
            {
              $project: {
                _id: 0,
                screeningId: 1,
                patientId: 1,
                patientName: "$patient.name",
                patientPhone: "$patient.phone",
                ageAtScreening: 1,
                sexAtScreening: 1,
                systemRisk: "$effectiveSystemRisk",
                finalRisk: { $ifNull: ["$finalRisk", "$effectiveSystemRisk"] },
                riskLevel: "$effectiveSystemRisk",
                status: 1,
                doctorReviewStatus: 1,
                startedAt: 1,
                submittedAt: 1,
                createdBy: 1,
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ]).toArray();

    const total = result?.total[0]?.count ?? 0;

    return {
      data: result?.data ?? [],
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  static async GetScreening(screeningId: string) {
    const { screenings, patients } = await this.collections();
    const screening = await screenings.findOne({ screeningId });

    if (!screening) {
      return null;
    }

    const patient = await patients.findOne({ patientId: screening.patientId });

    if (!patient) {
      return null;
    }

    const systemRisk = screening.systemRisk ?? screening.riskLevel;
    const normalizedScreening = {
      ...screening,
      systemRisk,
      finalRisk: screening.finalRisk ?? systemRisk,
    };

    return {
      screening: normalizedScreening,
      patient,
      review: screening.review ?? null,
      aiSummary: screening.aiSummary ?? null,
    };
  }

  static async ReviewScreening(
    screeningId: string,
    doctorId: string,
    action: DoctorReviewAction,
    overrideRisk?: RiskLevel,
    reason?: string,
  ) {
    const { client, screenings, auditLogs } = await this.collections();
    const session = client.startSession();
    let updatedScreening: ScreeningData | null = null;

    try {
      await session.withTransaction(async () => {
        const screening = await screenings.findOne(
          { screeningId, status: ScreeningStatus.COMPLETED },
          { session },
        );

        if (!screening) {
          throw new Error("Completed screening not found");
        }

        const systemRisk = screening.systemRisk ?? screening.riskLevel;

        if (!systemRisk) {
          throw new Error("Screening has no system risk to review");
        }

        const oldRiskLevel = screening.finalRisk ?? systemRisk;
        const finalRisk = action === "ACCEPT" ? systemRisk : overrideRisk!;
        const reviewedAt = new Date();
        const review: DoctorReviewData = {
          action,
          systemRisk,
          finalRisk,
          reviewedBy: doctorId,
          reviewedAt,
          ...(action === "OVERRIDE" ? { overrideReason: reason } : {}),
        };
        const update: Record<string, unknown> = {
          $set: {
            systemRisk,
            finalRisk,
            reviewAction: action,
            reviewedBy: doctorId,
            reviewedAt,
            review,
            doctorReviewStatus: "REVIEWED",
            updatedAt: reviewedAt,
            ...(action === "OVERRIDE" ? { overrideReason: reason } : {}),
          },
        };

        if (action === "ACCEPT") {
          update.$unset = { overrideReason: "" };
        }

        const result = await screenings.findOneAndUpdate(
          { screeningId, status: ScreeningStatus.COMPLETED },
          update,
          { returnDocument: "after", session },
        );
        updatedScreening = result;

        if (!updatedScreening) {
          throw new Error("Screening could not be reviewed");
        }

        await auditLogs.insertOne(
          {
            auditId: randomUUID(),
            screeningId,
            doctorId,
            action,
            oldRiskLevel,
            newRiskLevel: finalRisk,
            ...(action === "OVERRIDE" ? { reason } : {}),
            createdAt: reviewedAt,
          },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    return updatedScreening;
  }

  static async GetAuditHistory(screeningId: string) {
    const { auditLogs, screenings } = await this.collections();
    const screeningExists = await screenings.findOne({ screeningId }, { projection: { _id: 1 } });

    if (!screeningExists) {
      return null;
    }

    return auditLogs.find({ screeningId }).sort({ createdAt: -1 }).toArray();
  }

  static async SaveAiSummary(screeningId: string, aiSummary: AiSummaryData) {
    const { screenings } = await this.collections();

    return screenings.findOneAndUpdate(
      { screeningId, status: ScreeningStatus.COMPLETED },
      { $set: { aiSummary, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  }
}