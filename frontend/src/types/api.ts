export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Error body returned by the API
export interface ApiErrorBody {
  message: string;
  details?: Record<string, string[] | undefined>;
}
