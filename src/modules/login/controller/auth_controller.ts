import { Request, Response } from "express";

import AuthEntity from "../models/auth_model.js";
import AuthService from "../service/auth_service.js";

export default class AuthController {
  static async LoginController(req: Request, res: Response) {
    try {
      const { user_id, password } = req.body;

      if (!user_id || !password) {
        throw new Error("user_id and password are required");
      }

      const authData = new AuthEntity(user_id, password);

      const result =
        await AuthService.LoginService(authData);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Login failed",
      });
    }
  }
}