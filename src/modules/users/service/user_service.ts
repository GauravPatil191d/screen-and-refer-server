import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";

import UserEntity, { UserData, UserRole } from "../model/user_model.js";
import UserRepository from "../repository/user_repository.js";

type NewUser = Pick<UserData, "user_id" | "name" | "email" | "role"> & {
  password: string;
};
type UserUpdates = Partial<Pick<UserData, "name" | "email" | "role">> & {
  password?: string;
};

export default class UserService {
  static async CreateUser(user: NewUser) {
    const { user_id, name, email, password, role } = user;

    if (!user_id || !name || !email || !password || !role) {
      throw new Error("user_id, name, email, password, and role are required");
    }

    if (!Object.values(UserRole).includes(role)) {
      throw new Error("Invalid user role");
    }

    if (await UserRepository.GetUserByUserId(user_id)) {
      throw new Error("user_id is already in use");
    }

    const now = new Date();
    const newUser = new UserEntity({
      user_generated_id: randomUUID(),
      user_id,
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return UserRepository.CreateUser(newUser);
  }

  static async GetUsers(role: UserRole) {
    return UserRepository.GetUsers(role);
  }

  static async GetUserByGeneratedId(user_generated_id: string, role: UserRole) {
    const user = await UserRepository.GetUserByGeneratedId(user_generated_id, role);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  static async UpdateUser(
    user_generated_id: string,
    role: UserRole,
    updates: UserUpdates,
  ) {
    const safeUpdates: Partial<
      Pick<UserData, "name" | "email" | "passwordHash" | "role">
    > = {};

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string") {
        throw new Error("Name must be a string");
      }

      safeUpdates.name = updates.name;
    }

    if (updates.email !== undefined) {
      if (typeof updates.email !== "string") {
        throw new Error("Email must be a string");
      }

      safeUpdates.email = updates.email;
    }

    if (updates.password !== undefined) {
      if (typeof updates.password !== "string" || !updates.password) {
        throw new Error("password must be a non-empty string");
      }

      safeUpdates.passwordHash = await bcrypt.hash(updates.password, 10);
    }

    if (updates.role !== undefined) {
      if (!Object.values(UserRole).includes(updates.role)) {
        throw new Error("Invalid user role");
      }

      safeUpdates.role = updates.role;
    }

    if (Object.keys(safeUpdates).length === 0) {
      throw new Error("At least one user field is required");
    }

    const user = await UserRepository.UpdateUser(
      user_generated_id,
      role,
      safeUpdates,
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  static async DeleteUser(user_generated_id: string, role: UserRole) {
    const result = await UserRepository.SoftDeleteUser(user_generated_id, role);

    if (result.matchedCount === 0) {
      throw new Error("User not found");
    }
  }
}