import { Router } from "express";

import { authenticationMiddleware } from "../../../middleware/authentication_middleware.js";
import AuthController from "../controller/auth_controller";

const AuthRouter = Router();

AuthRouter.get("/me", authenticationMiddleware, AuthController.CurrentUserController);
AuthRouter.post(
  "/login",
  AuthController.LoginController,
);
AuthRouter.post("/logout", AuthController.LogoutController);

export default AuthRouter;