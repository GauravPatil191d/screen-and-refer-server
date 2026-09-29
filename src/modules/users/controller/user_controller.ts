import { Request, Response } from "express";

import { UserData } from "../model/user_model.js";
import UserService from "../service/user_service.js";

function publicUser(user: UserData) {
  const { passwordHash: _passwordHash, ...publicData } = user;

  return publicData;
}

export default class UserController {
  static async CreateUser(req: Request, res: Response) {
    try {
      const user = await UserService.CreateUser(req.body);

      return res.status(201).json({ success: true, data: publicUser(user) });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to create user",
      });
    }
  }

  static async GetUsers(req: Request, res: Response) {
    try {
      const users = await UserService.GetUsers(req.authenticatedUser!.role);

      return res.status(200).json({
        success: true,
        data: users.map(publicUser),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to get users",
      });
    }
  }

  static async GetUserById(req: Request, res: Response) {
    try {
      const user = await UserService.GetUserByGeneratedId(
        req.body.user_generated_id,
        req.authenticatedUser!.role,
      );

      return res.status(200).json({ success: true, data: publicUser(user) });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : "User not found",
      });
    }
  }

  static async UpdateUser(req: Request, res: Response) {
    try {
      const { user_generated_id, ...updates } = req.body;
      const user = await UserService.UpdateUser(
        user_generated_id,
        req.authenticatedUser!.role,
        updates,
      );

      return res.status(200).json({ success: true, data: publicUser(user) });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to update user",
      });
    }
  }

  static async DeleteUser(req: Request, res: Response) {
    try {
      await UserService.DeleteUser(
        req.body.user_generated_id,
        req.authenticatedUser!.role,
      );

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : "Unable to delete user",
      });
    }
  }
}