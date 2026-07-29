export interface ConnectorCreateParams {
  name: string;
  description?: string;
  connectorType: string;
  configPayload: any;
  secretEngine?: string;
  secretReference?: string;
  scheduleMode?: string;
  cronExpression?: string;
}

export class CybermindConnectorClient {
  private readonly baseUrl: string;

  constructor(options: { baseUrl: string }) {
    this.baseUrl = options.baseUrl; // e.g. http://gateway:3000/api/v1/connector
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
      throw new Error(`Connector API Error: ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  async createConnector(token: string, params: ConnectorCreateParams): Promise<any> {
    return this.fetchWrapper<any>('/connectors', 'POST', token, params);
  }

  async validateConnector(token: string, connectorId: string): Promise<any> {
    return this.fetchWrapper<any>(`/connectors/${connectorId}/validate`, 'POST', token);
  }

  async runConnector(token: string, connectorId: string): Promise<any> {
    return this.fetchWrapper<any>(`/connectors/${connectorId}/run`, 'POST', token);
  }

  async pauseConnector(token: string, connectorId: string): Promise<any> {
    return this.fetchWrapper<any>(`/connectors/${connectorId}/pause`, 'POST', token);
  }

  async resumeConnector(token: string, connectorId: string): Promise<any> {
    return this.fetchWrapper<any>(`/connectors/${connectorId}/resume`, 'POST', token);
  }

  async getExecutionHistory(token: string, connectorId: string): Promise<any[]> {
    return this.fetchWrapper<any[]>(`/connectors/${connectorId}/executions`, 'GET', token);
  }
}
