export enum UserRole {
  DOCTER = "DOCTER",
  HEALTH_WORKER = "HEALTH_WORKER",
}

export interface UserData {
  user_generated_id: string;
  user_id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default class UserEntity implements UserData {
  user_generated_id: string;
  user_id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: UserData) {
    this.user_generated_id = user.user_generated_id;
    this.user_id = user.user_id;
    this.name = user.name;
    this.email = user.email;
    this.passwordHash = user.passwordHash;
    this.role = user.role;
    this.isActive = user.isActive;
    this.lastLoginAt = user.lastLoginAt;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}