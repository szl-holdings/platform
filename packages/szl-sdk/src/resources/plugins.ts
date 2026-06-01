import type { HttpClient } from '../http.js';
import type { PaginationOptions, Plugin } from '../types.js';

export class PluginsResource {
  constructor(private readonly http: HttpClient) {}

  async list(options: PaginationOptions & { category?: string; published?: boolean } = {}): Promise<Plugin[]> {
    return this.http.get('/plugins', options);
  }

  async get(id: number): Promise<Plugin & { installationCount: number }> {
    return this.http.get(`/plugins/${id}`);
  }

  async install(options: { pluginId: number; config?: Record<string, unknown> }): Promise<unknown> {
    return this.http.post('/plugins/install', options);
  }

  async listInstallations(): Promise<unknown[]> {
    return this.http.get('/plugins/installations');
  }

  async getCapabilities(): Promise<{ capabilities: unknown[]; contract: unknown }> {
    return this.http.get('/plugins/capabilities');
  }
}
