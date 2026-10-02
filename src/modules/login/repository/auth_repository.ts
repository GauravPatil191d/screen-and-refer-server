import { getClient } from "../../../config/db.js";
import { UserRole } from "../../users/model/user_model.js";
import AuthEntity from "../models/auth_model.js";
import { UserData } from "../../users/model/user_model.js";

export default class AuthRepository {
  static async FindActiveUserProfile(user_generated_id: string) {
    const client = await getClient();

    return client.db("master").collection<UserData>("users").findOne(
      { user_generated_id, isActive: true },
      {
        projection: {
          _id: 0,
          user_generated_id: 1,
          user_id: 1,
          name: 1,
          email: 1,
          role: 1,
          isActive: 1,
          lastLoginAt: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    );
  }

  static async FindUserByCredentials(authData: AuthEntity) {
    const client = await getClient();

    return client
      .db("master")
      .collection<UserData>("users")
      .findOne({ user_id: authData.user_id, isActive: true });
  }

  static async UpdateLastLogin(user_generated_id: string, role: UserRole) {
    const client = await getClient();

    return client.db("master").collection<UserData>("users").updateOne(
      { user_generated_id },
      { $set: { role, lastLoginAt: new Date(), updatedAt: new Date() } },
    );
  }
}