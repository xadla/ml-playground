import api from '@/api/client';
import type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  UserProfile,
  VerifyEmailResponse,
  MessageResponse,
} from '@/types/auth';

export async function signup(data: SignupRequest): Promise<SignupResponse> {
  const response = await api.post<SignupResponse>('/auth/signup', data);
  return response.data;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const response = await api.get<VerifyEmailResponse>('/auth/verify-email', {
    params: { token },
  });
  return response.data;
}

export async function resendVerification(email: string): Promise<MessageResponse> {
  const response = await api.post<MessageResponse>('/auth/resend-verification', { email });
  return response.data;
}

export async function getMe(): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/auth/me');
  return response.data;
}
