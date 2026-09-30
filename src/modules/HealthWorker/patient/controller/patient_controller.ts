import { Request, Response } from "express";
import { MongoServerError } from "mongodb";

import PatientService from "../service/patient_service.js";

function isDuplicatePhone(error: unknown) {
  return error instanceof MongoServerError && error.code === 11000;
}

export default class PatientController {
  static async CreatePatient(req: Request, res: Response) {
    try {
      const patient = await PatientService.CreatePatient(
        req.body,
        req.authenticatedUser!.user_generated_id,
      );

      return res.status(201).json({ success: true, data: patient });
    } catch (error) {
      return res.status(isDuplicatePhone(error) ? 409 : 400).json({
        success: false,
        message: isDuplicatePhone(error)
          ? "An active patient already uses this phone number"
          : error instanceof Error
            ? error.message
            : "Unable to create patient",
      });
    }
  }

  static async GetPatients(req: Request, res: Response) {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);

      if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: "page must be positive and limit must be between 1 and 100",
        });
      }

      const result = await PatientService.GetPatients(
        req.authenticatedUser!.role,
        req.authenticatedUser!.user_generated_id,
        page,
        limit,
        typeof req.query.search === "string" ? req.query.search : undefined,
      );

      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to get patients",
      });
    }
  }

  static async GetPatientById(req: Request, res: Response) {
    try {
      const patient = await PatientService.GetPatientById(
        String(req.params.patientId),
        req.authenticatedUser!.role,
        req.authenticatedUser!.user_generated_id,
      );

      return res.status(200).json({ success: true, data: patient });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : "Patient not found",
      });
    }
  }

  static async UpdatePatient(req: Request, res: Response) {
    try {
      const patient = await PatientService.UpdatePatient(
        String(req.params.patientId),
        req.authenticatedUser!.role,
        req.authenticatedUser!.user_generated_id,
        req.body,
      );

      return res.status(200).json({ success: true, data: patient });
    } catch (error) {
      return res.status(isDuplicatePhone(error) ? 409 : 400).json({
        success: false,
        message: isDuplicatePhone(error)
          ? "An active patient already uses this phone number"
          : error instanceof Error
            ? error.message
            : "Unable to update patient",
      });
    }
  }

  static async DeletePatient(req: Request, res: Response) {
    try {
      await PatientService.DeletePatient(
        String(req.params.patientId),
        req.authenticatedUser!.role,
        req.authenticatedUser!.user_generated_id,
      );

      return res.status(200).json({ success: true, message: "Patient deleted" });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to delete patient",
      });
    }
  }
}