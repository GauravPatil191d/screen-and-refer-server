import { Request, Response } from "express";

import ScreeningService from "../service/screening_service.js";

export default class ScreeningController {
  static GetConfig(_req: Request, res: Response) {
    return res.status(200).json({ success: true, data: ScreeningService.GetConfig() });
  }

  static async StartScreening(req: Request, res: Response) {
    try {
      const screening = await ScreeningService.StartScreening(
        String(req.params.patientId),
        req.authenticatedUser!.user_generated_id,
      );

      return res.status(201).json({ success: true, data: screening });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to start screening",
      });
    }
  }

  static async GetScreening(req: Request, res: Response) {
    try {
      const screening = await ScreeningService.GetScreening(
        String(req.params.screeningId),
        req.authenticatedUser!.role,
        req.authenticatedUser!.user_generated_id,
      );

      return res.status(200).json({ success: true, data: screening });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : "Screening not found",
      });
    }
  }

  static async SaveDraft(req: Request, res: Response) {
    try {
      const screening = await ScreeningService.SaveDraft(
        String(req.params.screeningId),
        req.authenticatedUser!.user_generated_id,
        req.body.answers,
      );

      return res.status(200).json({ success: true, data: screening });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to save screening",
      });
    }
  }

  static async SubmitScreening(req: Request, res: Response) {
    try {
      const result = await ScreeningService.SubmitScreening(
        String(req.params.screeningId),
        req.authenticatedUser!.user_generated_id,
      );

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to submit screening",
      });
    }
  }
}