import { get, post } from "../api";
import type { AuthStatus, User } from "@/types/auth";

const AUTH_BASE = "/v1/auth";

export async function getAuthStatus(): Promise<AuthStatus> {
  return get<AuthStatus>(`${AUTH_BASE}/status`);
}

export async function getCurrentUser(): Promise<User> {
  return get<User>(`${AUTH_BASE}/me`);
}

export async function logout(): Promise<void> {
  await post(`${AUTH_BASE}/logout`);
}

export async function refreshToken(): Promise<void> {
  await post(`${AUTH_BASE}/refresh`);
}

export function getGitHubLoginUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  return `${apiBaseUrl}/v1/auth/github/login`;
}
