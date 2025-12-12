export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  github_username: string | null;
}

export interface AuthStatus {
  authenticated: boolean;
  user: User | null;
}
