export interface LoginData {
  user_id: string;
  password: string;
}

export default class AuthEntity implements LoginData {
  user_id: string;
  password: string;

  constructor(user_id: string, password: string) {
    this.user_id = user_id;
    this.password = password;
  }
}