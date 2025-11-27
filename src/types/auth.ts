// types/auth.ts
export interface GoogleAuthRequest {
  email: string;
  fullName: string;
  phone: string;
  password: string;
  cpassword: string;
  countryCode: string;
  country: string;
}

export interface GoogleTokenRequest {
  code: string;
}

export interface AuthResponse {
  msg: string;
  message?: string;
  id?: string;
  name?: string;
  email?: string;
  picture?: string;
  error?: string;
}

export interface UserData {
  isEmailVerified: boolean;
  uniqueId: string;
  email: string;
  fullName: string;
  phone: string;
  password: string;
  cpassword: string;
  countryCode: string;
  country: string;
}

export interface NotesData {
  uniqueId: string;
  email: string;
}
export interface GoogleTokenRequest {
  code: string;
}

export interface GooglePayload {
  email: string;
  name: string;
  picture: string;
  [key: string]: any;
}