import fetch from 'node-fetch';
import type { Envelope } from './envelope.js';

const API_BASE_URL = process.env.A11OY_API_BASE_URL || 'http://localhost:80';
const API_KEY = process.env.A11OY_API_KEY || '';

export class A11oyClient {
  private tenant: string;

  constructor(tenant: string = 'default') {
    this.tenant = tenant;
  }

  setTenant(tenant: string) {
    this.tenant = tenant;
  }

  private async request<T>(path: string, options: any = {}): Promise<Envelope<T>> {
    const url = `${API_BASE_URL}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Tenant-ID': this.tenant,
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();
      return data as Envelope<T>;
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'FETCH_ERROR',
          message: error.message,
        },
        meta: {
          requestId: 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async get<T>(path: string) {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body?: any) {
    return this.request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const client = new A11oyClient();
