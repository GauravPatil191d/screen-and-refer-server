import { getClient } from "../../../config/db.js";
import AuthEntity from "../models/auth_model.js";
import { UserData } from "../../users/model/user_model.js";

export default class AuthRepository {
  static async FindUserByCredentials(authData: AuthEntity) {
    const client = await getClient();

    return client
      .db("master")
      .collection<UserData>("users")
      .findOne({ user_id: authData.user_id, isActive: true });
  }

  static async UpdateLastLogin(user_generated_id: string) {
    const client = await getClient();

    return client.db("master").collection<UserData>("users").updateOne(
      { user_generated_id },
      { $set: { lastLoginAt: new Date(), updatedAt: new Date() } },
    );
  }
}