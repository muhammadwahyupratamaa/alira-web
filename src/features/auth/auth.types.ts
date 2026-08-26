export interface User {
  id: string;
  email: string;
  currency: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export type RegisterInput = LoginInput;
