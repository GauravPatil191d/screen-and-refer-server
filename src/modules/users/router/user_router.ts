import { Router } from "express";

import { authenticationMiddleware } from "../../../middleware/authentication_middleware.js";
import UserController from "../controller/user_controller.js";

const UserRouter = Router();

UserRouter.post("/create-user", UserController.CreateUser);
UserRouter.post("/get-users", authenticationMiddleware, UserController.GetUsers);
UserRouter.post("/get-user", authenticationMiddleware, UserController.GetUserById);
UserRouter.post("/update-user", authenticationMiddleware, UserController.UpdateUser);
UserRouter.post("/delete-user", authenticationMiddleware, UserController.DeleteUser);

export default UserRouter;