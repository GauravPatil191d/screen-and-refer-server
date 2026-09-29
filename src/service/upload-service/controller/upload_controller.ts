import { Request, Response } from "express";

import UploadService from "../service/upload_service.js";

export default class UploadController {
  static async UploadMediaController(
    req: Request,
    res: Response,
  ) {
    try {
      if (!req.file) {
        throw new Error("Media file is required");
      }

      const result =
        await UploadService.UploadMediaService(
          req.file,
        );

      return res.status(200).json({
        success: true,
        message: "Media uploaded successfully",
        data: {
          url: result.secure_url,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Media upload failed",
      });
    }
  }
}