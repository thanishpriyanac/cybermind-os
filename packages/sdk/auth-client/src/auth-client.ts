import { LoginParams, AuthResponse, RefreshParams, JwksResponse, UserContext } from './interfaces';

export class CybermindAuthClient {
  private readonly baseUrl: string;
  private currentAccessToken: string | null = null;
  private currentRefreshToken: string | null = null;

  constructor(options: { baseUrl: string }) {
    this.baseUrl = options.baseUrl;
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.currentAccessToken = accessToken;
    this.currentRefreshToken = refreshToken;
  }

  getAccessToken(): string | null {
    return this.currentAccessToken;
  }

  async login(params: LoginParams): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantSlug: params.tenantSlug,
        email: params.email,
        password: params.passwordPlain,
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = (await response.json()) as AuthResponse;
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async refresh(params: RefreshParams): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.statusText}`);
    }

    const data = (await response.json()) as AuthResponse;
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async getJwks(): Promise<JwksResponse> {
    const response = await fetch(`${this.baseUrl}/auth/.well-known/jwks.json`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
    }

    return (await response.json()) as JwksResponse;
  }

  async me(): Promise<UserContext> {
    if (!this.currentAccessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.baseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.currentAccessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user context: ${response.statusText}`);
    }

    return (await response.json()) as UserContext;
  }
}
