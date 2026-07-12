export interface SignupRequest {
  email: string;
  password: string;
}

export interface SignupResponse {
  message: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

export interface VerifyEmailResponse {
  message: string;
  access_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}
