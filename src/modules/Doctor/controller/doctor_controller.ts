import { Request, Response } from "express";

import {
  RiskLevel,
  ScreeningStatus,
} from "../../HealthWorker/screening/model/screening_model.js";

import DoctorService from "../service/doctor_service.js";

export default class DoctorController {
  static async GetScreenings(
    req: Request,
    res: Response,
  ) {
    const page = Number(
      req.query.page ?? 1,
    );

    const limit = Number(
      req.query.limit ?? 10,
    );

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "page must be positive and limit must be between 1 and 100",
      });
    }

    const riskLevel =
      req.query.riskLevel;

    if (
      riskLevel !== undefined &&
      !Object.values(RiskLevel).includes(
        String(riskLevel) as RiskLevel,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid riskLevel",
      });
    }

    const status =
      req.query.status;

    if (
      status !== undefined &&
      !Object.values(ScreeningStatus).includes(
        String(status) as ScreeningStatus,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    try {
      const result =
        await DoctorService.GetScreenings({
          page,
          limit,
          search:
            typeof req.query.search === "string"
              ? req.query.search
              : undefined,
          riskLevel:
            riskLevel as
              | RiskLevel
              | undefined,
          status:
            status as
              | ScreeningStatus
              | undefined,
        });

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(
        "Doctor GetScreenings error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Unable to get screenings",
      });
    }
  }

  static async GetScreening(
    req: Request,
    res: Response,
  ) {
    try {
      const data =
        await DoctorService.GetScreening(
          String(req.params.screeningId),
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Screening not found",
      });
    }
  }

  static async ReviewScreening(
    req: Request,
    res: Response,
  ) {
    try {
      const data =
        await DoctorService.ReviewScreening(
          String(req.params.screeningId),

          req.authenticatedUser!
            .user_generated_id,

          req.body,
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to review screening";

      const notFound =
        message.includes("not found");

      return res
        .status(notFound ? 404 : 400)
        .json({
          success: false,
          message,
        });
    }
  }

  static async GetAuditHistory(
    req: Request,
    res: Response,
  ) {
    try {
      const data =
        await DoctorService.GetAuditHistory(
          String(req.params.screeningId),
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to get audit history",
      });
    }
  }

  static async GenerateSummary(
    req: Request,
    res: Response,
  ) {
    try {
      const data =
        await DoctorService.GenerateSummary(
          String(req.params.screeningId),
        );

      // AI failure intentionally returns 200
      // with available:false so the main
      // doctor workflow remains functional.
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Screening not found",
      });
    }
  }
}