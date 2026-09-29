import { Router } from "express";
import multer from "multer";

import UploadController from "../controller/upload_controller.js";

const UploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

UploadRouter.post(
  "/media",
  upload.single("media"),
  UploadController.UploadMediaController,
);

export default UploadRouter;