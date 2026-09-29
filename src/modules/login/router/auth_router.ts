import { Router } from "express";

import AuthController from "../controller/auth_controller";

const AuthRouter = Router();

AuthRouter.post(
  "/login",
  AuthController.LoginController,
);

export default AuthRouter;