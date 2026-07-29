export interface AssetCreateParams {
  assetCategory: string;
  uniqueIdentifier: string;
  hostname?: string;
  primaryIp?: string;
  operatingSystem?: string;
}

export interface AssetResponse {
  id: string;
  tenantId: string;
  assetCategory: string;
  uniqueIdentifier: string;
  [key: string]: any;
}

export interface AssetRelationshipParams {
  targetAssetId: string;
  type: string;
}

export class CybermindAssetClient {
  private readonly baseUrl: string;

  constructor(options: { baseUrl: string }) {
    this.baseUrl = options.baseUrl; // E.g. http://gateway:3000/api/v1/asset
  }

  private async fetchWrapper<T>(endpoint: string, method: string, token: string, body?: any): Promise<T> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Asset API Error: ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  async createAsset(token: string, params: AssetCreateParams): Promise<AssetResponse> {
    return this.fetchWrapper<AssetResponse>('/assets', 'POST', token, params);
  }

  async getAsset(token: string, assetId: string): Promise<AssetResponse> {
    return this.fetchWrapper<AssetResponse>(`/assets/${assetId}`, 'GET', token);
  }

  async searchAssets(token: string, filters: Record<string, string>): Promise<AssetResponse[]> {
    const queryParams = new URLSearchParams(filters).toString();
    return this.fetchWrapper<AssetResponse[]>(`/assets/search?${queryParams}`, 'GET', token);
  }

  async addRelationship(token: string, sourceAssetId: string, params: AssetRelationshipParams): Promise<any> {
    return this.fetchWrapper<any>(`/assets/${sourceAssetId}/relationships`, 'POST', token, params);
  }

  async getRelationships(token: string, assetId: string): Promise<any> {
    return this.fetchWrapper<any>(`/assets/${assetId}/relationships`, 'GET', token);
  }
}
