import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { UserRole } from "../../users/model/user_model.js";
import AuthEntity from "../models/auth_model.js";
import AuthRepository from "../repository/auth_repository.js";

export default class AuthService {
  static async GetCurrentUser(user_generated_id: string) {
    const user = await AuthRepository.FindActiveUserProfile(user_generated_id);

    if (!user) {
      throw new Error("Authenticated user not found");
    }

    const role = (user.role as string) === "DOCTER" ? UserRole.DOCTOR : user.role;

    if (!Object.values(UserRole).includes(role)) {
      throw new Error("Invalid user role");
    }

    return {
      id: user.user_generated_id,
      name: user.name,
      role,
    };
  }

  static async LoginService(authData: AuthEntity) {
    if (!authData.user_id || !authData.password) {
      throw new Error("user_id and password are required");
    }

    const user = await AuthRepository.FindUserByCredentials(authData);

    if (!user || !(await bcrypt.compare(authData.password, user.passwordHash))) {
      throw new Error("Invalid user_id or password");
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const role = (user.role as string) === "DOCTER" ? UserRole.DOCTOR : user.role;

    if (!Object.values(UserRole).includes(role)) {
      throw new Error("Invalid user role");
    }

    await AuthRepository.UpdateLastLogin(user.user_generated_id, role);

    const token = jwt.sign(
      {
        user_generated_id: user.user_generated_id,
        user_id: user.user_id,
        role,
      },
      secret,
      {
        expiresIn: "1d",
      },
    );

    return {
      token,
    };
  }
}