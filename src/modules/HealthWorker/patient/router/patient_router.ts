import { NextFunction, Request, Response, Router } from "express";

import { authenticationMiddleware } from "../../../../middleware/authentication_middleware.js";
import { UserRole } from "../../../users/model/user_model.js";
import PatientController from "../controller/patient_controller.js";

const PatientRouter = Router();

function healthWorkerOnly(req: Request, res: Response, next: NextFunction) {
	if (req.authenticatedUser?.role !== UserRole.HEALTH_WORKER) {
		return res.status(403).json({
			success: false,
			message: "Health worker access required",
		});
	}

	return next();
}

PatientRouter.use(authenticationMiddleware);
PatientRouter.post("/", healthWorkerOnly, PatientController.CreatePatient);
PatientRouter.get("/", PatientController.GetPatients);
PatientRouter.get("/:patientId", PatientController.GetPatientById);
PatientRouter.patch("/:patientId", healthWorkerOnly, PatientController.UpdatePatient);
PatientRouter.delete("/:patientId", healthWorkerOnly, PatientController.DeletePatient);

export default PatientRouter;