import { Filter } from "mongodb";

import { getClient } from "../../../../config/db.js";
import { UserRole } from "../../../users/model/user_model.js";
import { ScreeningData, ScreeningStatus } from "../model/screening_model.js";

export default class ScreeningRepository {
  private static async collection() {
    const client = await getClient();
    const screenings = client.db("master").collection<ScreeningData>("screenings");

    await screenings.createIndex(
      { screeningId: 1 },
      { unique: true, name: "screening_id_unique" },
    );
    await screenings.createIndex(
      { patientId: 1, startedAt: -1 },
      { name: "screening_patient_started_at" },
    );
    await screenings.createIndex(
      { createdBy: 1, startedAt: -1 },
      { name: "screening_owner_started_at" },
    );

    return screenings;
  }

  static async CreateScreening(screening: ScreeningData) {
    const screenings = await this.collection();
    await screenings.insertOne(screening);

    return screening;
  }

  static async GetScreening(screeningId: string, role: UserRole, userId: string) {
    const screenings = await this.collection();
    const filter: Filter<ScreeningData> = { screeningId };

    if (role === UserRole.HEALTH_WORKER) {
      filter.createdBy = userId;
    }

    return screenings.findOne(filter);
  }

  static async UpdateDraftAnswers(
    screeningId: string,
    userId: string,
    answers: ScreeningData["answers"],
    inactiveAnswers: ScreeningData["inactiveAnswers"],
    ageAtScreening: number,
    sexAtScreening: ScreeningData["sexAtScreening"],
  ) {
    const screenings = await this.collection();

    return screenings.findOneAndUpdate(
      { screeningId, createdBy: userId, status: ScreeningStatus.DRAFT },
      {
        $set: {
          answers,
          inactiveAnswers,
          ageAtScreening,
          sexAtScreening,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );
  }

  static async CompleteScreening(
    screeningId: string,
    userId: string,
    answers: ScreeningData["answers"],
    inactiveAnswers: ScreeningData["inactiveAnswers"],
    ageAtScreening: number,
    sexAtScreening: ScreeningData["sexAtScreening"],
    riskLevel: NonNullable<ScreeningData["riskLevel"]>,
  ) {
    const screenings = await this.collection();
    const now = new Date();

    return screenings.findOneAndUpdate(
      { screeningId, createdBy: userId, status: ScreeningStatus.DRAFT },
      {
        $set: {
          answers,
          inactiveAnswers,
          ageAtScreening,
          sexAtScreening,
          riskLevel,
          systemRisk: riskLevel,
          finalRisk: riskLevel,
          status: ScreeningStatus.COMPLETED,
          submittedAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );
  }
}