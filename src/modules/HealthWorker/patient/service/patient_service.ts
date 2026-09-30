import { randomUUID } from "node:crypto";

import { UserRole } from "../../../users/model/user_model.js";
import PatientEntity, {
  BloodGroup,
  PatientData,
  PatientSex,
} from "../model/patient_model.js";
import PatientRepository from "../repository/patient_repository.js";

type NewPatient = Pick<PatientData, "name" | "phone" | "dob" | "sex" | "bloodGroup"> & {
  email?: string;
};
type PatientUpdates = Partial<NewPatient>;

function normalizePhone(phone: string) {
  let digits = phone.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error("Phone must be a valid 10-digit Indian mobile number");
  }

  return digits;
}

function parseDateOfBirth(dob: string | Date) {
  const parsedDob = dob instanceof Date ? dob : new Date(dob);

  if (Number.isNaN(parsedDob.getTime()) || parsedDob > new Date()) {
    throw new Error("A valid date of birth is required");
  }

  return parsedDob;
}

export default class PatientService {
  static async CreatePatient(input: NewPatient, userId: string) {
    if (
      typeof input.name !== "string" ||
      !input.name.trim() ||
      typeof input.phone !== "string" ||
      !input.dob ||
      !Object.values(PatientSex).includes(input.sex as PatientSex) ||
      !Object.values(BloodGroup).includes(input.bloodGroup as BloodGroup)
    ) {
      throw new Error("Name, phone, dob, sex, and bloodGroup are required");
    }

    if (input.email !== undefined && typeof input.email !== "string") {
      throw new Error("Email must be a string");
    }

    const now = new Date();
    const patient = new PatientEntity({
      patientId: randomUUID(),
      name: input.name,
      email: input.email,
      phone: normalizePhone(input.phone),
      dob: parseDateOfBirth(input.dob),
      sex: input.sex,
      bloodGroup: input.bloodGroup,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    });

    return PatientRepository.CreatePatient(patient);
  }

  static async GetPatients(
    role: UserRole,
    userId: string,
    page: number,
    limit: number,
    search?: string,
  ) {
    return PatientRepository.GetPatients(role, userId, page, limit, search);
  }

  static async GetPatientById(patientId: string, role: UserRole, userId: string) {
    const patient = await PatientRepository.GetPatientById(patientId, role, userId);

    if (!patient) {
      throw new Error("Patient not found");
    }

    return patient;
  }

  static async UpdatePatient(
    patientId: string,
    role: UserRole,
    userId: string,
    input: PatientUpdates,
  ) {
    const updates: PatientUpdates = {};

    if (input.name !== undefined) {
      if (typeof input.name !== "string" || !input.name.trim()) {
        throw new Error("Name must be a non-empty string");
      }

      updates.name = input.name;
    }

    if (input.email !== undefined) {
      if (typeof input.email !== "string") {
        throw new Error("Email must be a string");
      }

      updates.email = input.email;
    }

    if (input.phone !== undefined) {
      if (typeof input.phone !== "string") {
        throw new Error("Phone must be a string");
      }

      updates.phone = normalizePhone(input.phone);
    }

    if (input.dob !== undefined) {
      updates.dob = parseDateOfBirth(input.dob);
    }

    if (input.sex !== undefined) {
      if (!Object.values(PatientSex).includes(input.sex as PatientSex)) {
        throw new Error("Invalid sex");
      }

      updates.sex = input.sex;
    }

    if (input.bloodGroup !== undefined) {
      if (!Object.values(BloodGroup).includes(input.bloodGroup as BloodGroup)) {
        throw new Error("Invalid blood group");
      }

      updates.bloodGroup = input.bloodGroup;
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("At least one patient field is required");
    }

    const patient = await PatientRepository.UpdatePatient(
      patientId,
      role,
      userId,
      updates,
    );

    if (!patient) {
      throw new Error("Patient not found");
    }

    return patient;
  }

  static async DeletePatient(patientId: string, role: UserRole, userId: string) {
    const result = await PatientRepository.SoftDeletePatient(patientId, role, userId);

    if (result.matchedCount === 0) {
      throw new Error("Patient not found");
    }
  }
}