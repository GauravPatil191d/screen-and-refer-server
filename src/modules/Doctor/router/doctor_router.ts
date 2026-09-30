import { NextFunction, Request, Response, Router } from "express";

import { authenticationMiddleware } from "../../../middleware/authentication_middleware.js";
import { UserRole } from "../../users/model/user_model.js";
import DoctorController from "../controller/doctor_controller.js";

const DoctorRouter = Router();

function doctorOnly(req: Request, res: Response, next: NextFunction) {
  if (req.authenticatedUser?.role !== UserRole.DOCTOR) {
    return res.status(403).json({ success: false, message: "Doctor access required" });
  }

  return next();
}

DoctorRouter.use(authenticationMiddleware, doctorOnly);
DoctorRouter.get("/screenings", DoctorController.GetScreenings);
DoctorRouter.get("/screenings/:screeningId", DoctorController.GetScreening);
DoctorRouter.post("/screenings/:screeningId/review", DoctorController.ReviewScreening);
DoctorRouter.get("/screenings/:screeningId/audit", DoctorController.GetAuditHistory);
DoctorRouter.post("/screenings/:screeningId/summary", DoctorController.GenerateSummary);

export default DoctorRouter;