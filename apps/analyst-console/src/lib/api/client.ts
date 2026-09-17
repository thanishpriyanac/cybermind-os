import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Centralized API Base URL Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-cybermind.vellprint.in';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach Auth, Tenant, and Correlation Request IDs
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
  }

  // Inject Unique Correlation Request ID for log tracing
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  config.headers['x-request-id'] = requestId;

  return config;
});

// Response Interceptor: Uniform Error Handling with Request ID reporting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestId = error.config?.headers?.['x-request-id'] || 'unknown';
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';

    console.error(`[API Error] [ReqID: ${requestId}] [Status: ${status}]:`, message);

    return Promise.reject({
      status,
      message,
      requestId,
      raw: error,
    });
  }
);

// Helper for SSE (Server-Sent Events) AI Streaming
export async function streamAiResponse({
  endpoint,
  payload,
  onToken,
  onError,
  onComplete,
  signal,
}: {
  endpoint: string;
  payload: any;
  onToken: (token: string) => void;
  onError: (err: any) => void;
  onComplete: () => void;
  signal?: AbortSignal;
}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
        'x-request-id': `req_sse_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`SSE stream connection failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') {
            onComplete();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            const tokenText = parsed.text || parsed.content || parsed.delta || '';
            if (tokenText) onToken(tokenText);
          } catch {
            onToken(dataStr);
          }
        }
      }
    }
    onComplete();
  } catch (err) {
    if (onError) onError(err);
  }
}
