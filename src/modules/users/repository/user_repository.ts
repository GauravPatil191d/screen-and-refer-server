import { getClient } from "../../../config/db.js";
import { UserData, UserRole } from "../model/user_model.js";

export default class UserRepository {
  private static async collection() {
    const client = await getClient();

    return client.db("master").collection<UserData>("users");
  }

  static async CreateUser(user: UserData) {
    const users = await this.collection();
    await users.insertOne(user);

    return user;
  }

  static async GetUsers(role: UserRole) {
    const users = await this.collection();

    return users.find({ isActive: true, role }).toArray();
  }

  static async GetUserByGeneratedId(user_generated_id: string, role: UserRole) {
    const users = await this.collection();

    return users.findOne({ user_generated_id, isActive: true, role });
  }

  static async GetUserByUserId(user_id: string) {
    const users = await this.collection();

    return users.findOne({ user_id });
  }

  static async UpdateUser(
    user_generated_id: string,
    role: UserRole,
    updates: Partial<Pick<UserData, "name" | "email" | "passwordHash" | "role">>,
  ) {
    const users = await this.collection();

    return users.findOneAndUpdate(
      { user_generated_id, isActive: true, role },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
  }

  static async SoftDeleteUser(user_generated_id: string, role: UserRole) {
    const users = await this.collection();

    return users.updateOne(
      { user_generated_id, isActive: true, role },
      { $set: { isActive: false, updatedAt: new Date() } },
    );
  }
}