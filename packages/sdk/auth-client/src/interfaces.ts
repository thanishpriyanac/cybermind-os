export interface LoginParams {
  tenantSlug: string;
  email: string;
  passwordPlain: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshParams {
  sessionId: string;
  refreshToken: string;
}

export interface JwksResponse {
  keys: Array<{
    kty: string;
    alg: string;
    use: string;
    kid: string;
    x5c: string[];
  }>;
}

export interface UserContext {
  userId: string;
  tenantId: string;
  email: string;
}
