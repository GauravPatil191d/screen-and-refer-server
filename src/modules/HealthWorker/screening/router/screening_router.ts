import { NextFunction, Request, Response, Router } from "express";

import { authenticationMiddleware } from "../../../../middleware/authentication_middleware.js";
import { UserRole } from "../../../users/model/user_model.js";
import ScreeningController from "../controller/screening_controller.js";

const ScreeningRouter = Router();

function healthWorkerOnly(req: Request, res: Response, next: NextFunction) {
  if (req.authenticatedUser?.role !== UserRole.HEALTH_WORKER) {
    return res.status(403).json({ success: false, message: "Health worker access required" });
  }

  return next();
}

ScreeningRouter.use(authenticationMiddleware);
ScreeningRouter.get("/config", ScreeningController.GetConfig);
ScreeningRouter.post(
  "/patients/:patientId",
  healthWorkerOnly,
  ScreeningController.StartScreening,
);
ScreeningRouter.get("/:screeningId", ScreeningController.GetScreening);
ScreeningRouter.patch(
  "/:screeningId",
  healthWorkerOnly,
  ScreeningController.SaveDraft,
);
ScreeningRouter.post(
  "/:screeningId/submit",
  healthWorkerOnly,
  ScreeningController.SubmitScreening,
);

export default ScreeningRouter;