import { Filter } from "mongodb";

import { getClient } from "../../../../config/db.js";
import { UserRole } from "../../../users/model/user_model.js";
import { PatientData } from "../model/patient_model.js";

const collectionName = "patients";

export default class PatientRepository {
  private static async collection() {
    const client = await getClient();
    const patients = client.db("master").collection<PatientData>(collectionName);

    await patients.createIndex(
      { phone: 1 },
      {
        unique: true,
        partialFilterExpression: { isDeleted: false },
        name: "active_patient_phone_unique",
      },
    );

    await patients.createIndex(
      { createdBy: 1, createdAt: -1 },
      { name: "patient_owner_created_at" },
    );

    return patients;
  }

  static async CreatePatient(patient: PatientData) {
    const patients = await this.collection();
    await patients.insertOne(patient);

    return patient;
  }

  static async GetPatients(
    role: UserRole,
    userId: string,
    page: number,
    limit: number,
    search?: string,
  ) {
    const patients = await this.collection();
    const filter: Filter<PatientData> = { isDeleted: false };

    if (role === UserRole.HEALTH_WORKER) {
      filter.createdBy = userId;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const namePattern = new RegExp(escapedSearch, "i");
      let phoneDigits = search.replace(/\D/g, "");

      if (phoneDigits.length === 12 && phoneDigits.startsWith("91")) {
        phoneDigits = phoneDigits.slice(2);
      } else if (phoneDigits.length === 11 && phoneDigits.startsWith("0")) {
        phoneDigits = phoneDigits.slice(1);
      }
      const searchConditions: Filter<PatientData>[] = [
        { name: namePattern },
      ];

      if (phoneDigits) {
        searchConditions.push({ phone: { $regex: phoneDigits } });
      }

      filter.$or = searchConditions;
    }

    const [data, total] = await Promise.all([
      patients
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      patients.countDocuments(filter),
    ]);

    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  static async GetPatientById(
    patientId: string,
    role: UserRole,
    userId: string,
  ) {
    const patients = await this.collection();
    const filter: Filter<PatientData> = { patientId, isDeleted: false };

    if (role === UserRole.HEALTH_WORKER) {
      filter.createdBy = userId;
    }

    return patients.findOne(filter);
  }

  static async UpdatePatient(
    patientId: string,
    role: UserRole,
    userId: string,
    updates: Partial<Pick<PatientData, "name" | "email" | "phone" | "dob" | "sex" | "bloodGroup">>,
  ) {
    const patients = await this.collection();
    const filter: Filter<PatientData> = { patientId, isDeleted: false };

    if (role === UserRole.HEALTH_WORKER) {
      filter.createdBy = userId;
    }

    return patients.findOneAndUpdate(
      filter,
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  }

  static async SoftDeletePatient(
    patientId: string,
    role: UserRole,
    userId: string,
  ) {
    const patients = await this.collection();
    const filter: Filter<PatientData> = { patientId, isDeleted: false };

    if (role === UserRole.HEALTH_WORKER) {
      filter.createdBy = userId;
    }

    const now = new Date();

    return patients.updateOne(filter, {
      $set: {
        isDeleted: true,
        deletedAt: now,
        deletedBy: userId,
        updatedAt: now,
      },
    });
  }
}