import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import AuthEntity from "../models/auth_model.js";
import AuthRepository from "../repository/auth_repository.js";

export default class AuthService {
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

    await AuthRepository.UpdateLastLogin(user.user_generated_id);

    const token = jwt.sign(
      {
        user_generated_id: user.user_generated_id,
        user_id: user.user_id,
        role: user.role,
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