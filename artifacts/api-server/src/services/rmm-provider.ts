import { logger } from '../lib/logger';

export interface NormalizedDevice {
  providerDeviceId: string;
  hostname: string;
  clientName: string;
  ipAddress: string;
  os: string;
  type: 'server' | 'workstation' | 'network' | 'printer' | 'mobile' | 'firewall';
  status: 'online' | 'warning' | 'critical' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  agentVersion?: string;
  patchStatus?: string;
  patchesPending: number;
  lastSeen: Date;
  alerts: number;
  threats: number;
  services?: Array<{ name: string; status: string }>;
}

export interface NormalizedTicket {
  providerTicketId: string;
  subject: string;
  description?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  psaUrl?: string;
}

export interface RemoteActionResult {
  success: boolean;
  jobId?: string;
  output?: string;
  errorMessage?: string;
}

export interface RmmProviderConfig {
  provider: string;
  authType: 'api_key' | 'oauth2' | 'basic';
  baseUrl?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  companyId?: string;
}

export interface IRmmProvider {
  name: string;
  getDevices(): Promise<NormalizedDevice[]>;
  getDeviceById(id: string): Promise<NormalizedDevice | null>;
  restartService(deviceId: string, serviceName: string): Promise<RemoteActionResult>;
  rebootDevice(deviceId: string, forced?: boolean): Promise<RemoteActionResult>;
  runScript(
    deviceId: string,
    script: string,
    scriptType?: 'powershell' | 'bash',
  ): Promise<RemoteActionResult>;
  killProcess(deviceId: string, processId: number): Promise<RemoteActionResult>;
  createTicket(data: Partial<NormalizedTicket>): Promise<NormalizedTicket | null>;
  closeTicket(ticketId: string, note?: string): Promise<boolean>;
  testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}

export class NinjaOneProvider implements IRmmProvider {
  name = 'NinjaOne';
  private config: RmmProviderConfig;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: RmmProviderConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return this.config.baseUrl ?? 'https://app.ninjarmm.com';
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - 30_000) return this.token;
    if (this.config.authType === 'oauth2' && this.config.clientId && this.config.clientSecret) {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'monitoring management control',
      });
      const resp = await fetch(`${this.baseUrl}/ws/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: AbortSignal.timeout(10_000),
      });
      if (!resp.ok) throw new Error(`NinjaOne OAuth failed: ${resp.status}`);
      const data = (await resp.json()) as { access_token: string; expires_in: number };
      this.token = data.access_token;
      this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
      return this.token;
    }
    if (this.config.apiKey) return this.config.apiKey;
    throw new Error('No valid auth config for NinjaOne');
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const resp = await fetch(`${this.baseUrl}/v2${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers ?? {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) throw new Error(`NinjaOne API ${path} → ${resp.status}`);
    return resp.json() as Promise<T>;
  }

  async getDevices(): Promise<NormalizedDevice[]> {
    try {
      const devices =
        await this.fetch<
          Array<{
            id: number;
            systemName: string;
            ipAddresses: string[];
            os?: { name: string; platform: string };
            nodeClass: string;
            online: boolean;
            lastContact?: string;
            approval?: string;
            agentVersion?: string;
            cpuUsage?: number;
            memoryUsage?: number;
            diskUsage?: number;
          }>
        >('/devices?pageSize=200');
      return devices.map((d) => ({
        providerDeviceId: String(d.id),
        hostname: d.systemName ?? 'Unknown',
        clientName: '',
        ipAddress: d.ipAddresses?.[0] ?? '',
        os: d.os?.name ?? d.os?.platform ?? 'Unknown',
        type: this.inferDeviceType(d.nodeClass),
        status: d.online ? 'online' : 'offline',
        cpu: d.cpuUsage ?? 0,
        memory: d.memoryUsage ?? 0,
        disk: d.diskUsage ?? 0,
        agentVersion: d.agentVersion,
        patchesPending: 0,
        lastSeen: d.lastContact ? new Date(d.lastContact) : new Date(),
        alerts: 0,
        threats: 0,
      }));
    } catch (err) {
      logger.warn({ err, provider: 'ninjaone' }, 'Failed to fetch NinjaOne devices');
      return [];
    }
  }

  async getDeviceById(id: string): Promise<NormalizedDevice | null> {
    try {
      const d = await this.fetch<{
        id: number;
        systemName: string;
        ipAddresses: string[];
        os?: { name: string };
        online: boolean;
        lastContact?: string;
        agentVersion?: string;
        cpuUsage?: number;
        memoryUsage?: number;
        diskUsage?: number;
        nodeClass: string;
      }>(`/device/${id}`);
      return {
        providerDeviceId: String(d.id),
        hostname: d.systemName,
        clientName: '',
        ipAddress: d.ipAddresses?.[0] ?? '',
        os: d.os?.name ?? '',
        type: this.inferDeviceType(d.nodeClass),
        status: d.online ? 'online' : 'offline',
        cpu: d.cpuUsage ?? 0,
        memory: d.memoryUsage ?? 0,
        disk: d.diskUsage ?? 0,
        agentVersion: d.agentVersion,
        patchesPending: 0,
        lastSeen: d.lastContact ? new Date(d.lastContact) : new Date(),
        alerts: 0,
        threats: 0,
      };
    } catch {
      return null;
    }
  }

  async restartService(deviceId: string, serviceName: string): Promise<RemoteActionResult> {
    try {
      const result = await this.fetch<{ jobId: string }>(
        `/device/${deviceId}/windows-service/${encodeURIComponent(serviceName)}/restart`,
        { method: 'POST' },
      );
      return { success: true, jobId: result.jobId };
    } catch (err) {
      return { success: false, errorMessage: String(err) };
    }
  }

  async rebootDevice(deviceId: string, forced = false): Promise<RemoteActionResult> {
    try {
      await this.fetch(`/device/${deviceId}/reboot/${forced ? 'forced' : 'normal'}`, {
        method: 'POST',
      });
      return { success: true };
    } catch (err) {
      return { success: false, errorMessage: String(err) };
    }
  }

  async runScript(
    deviceId: string,
    script: string,
    scriptType: 'powershell' | 'bash' = 'powershell',
  ): Promise<RemoteActionResult> {
    try {
      const result = await this.fetch<{ jobId: string }>(`/device/${deviceId}/script/run`, {
        method: 'POST',
        body: JSON.stringify({ type: scriptType, script }),
      });
      return { success: true, jobId: result.jobId };
    } catch (err) {
      return { success: false, errorMessage: String(err) };
    }
  }

  async killProcess(deviceId: string, processId: number): Promise<RemoteActionResult> {
    try {
      await this.fetch(`/device/${deviceId}/processes/${processId}`, { method: 'DELETE' });
      return { success: true };
    } catch (err) {
      return { success: false, errorMessage: String(err) };
    }
  }

  async createTicket(_data: Partial<NormalizedTicket>): Promise<NormalizedTicket | null> {
    return null;
  }

  async closeTicket(_ticketId: string, _note?: string): Promise<boolean> {
    return false;
  }

  async testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      await this.getToken();
      await this.fetch('/devices?pageSize=1');
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, error: String(err) };
    }
  }

  private inferDeviceType(nodeClass: string): NormalizedDevice['type'] {
    const nc = (nodeClass ?? '').toLowerCase();
    if (nc.includes('server')) return 'server';
    if (nc.includes('network') || nc.includes('switch') || nc.includes('router')) return 'network';
    if (nc.includes('firewall')) return 'firewall';
    if (nc.includes('mobile') || nc.includes('ios') || nc.includes('android')) return 'mobile';
    if (nc.includes('printer')) return 'printer';
    return 'workstation';
  }
}

export class ConnectWiseAutomateProvider implements IRmmProvider {
  name = 'ConnectWise Automate';
  private config: RmmProviderConfig;

  constructor(config: RmmProviderConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return this.config.baseUrl ?? '';
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const auth = Buffer.from(
      `${this.config.username ?? ''}:${this.config.password ?? this.config.apiKey ?? ''}`,
    ).toString('base64');
    const resp = await fetch(`${this.baseUrl}/cwa/api/v1${path}`, {
      ...options,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers ?? {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) throw new Error(`ConnectWise Automate ${path} → ${resp.status}`);
    return resp.json() as Promise<T>;
  }

  async getDevices(): Promise<NormalizedDevice[]> {
    try {
      const devices =
        await this.fetch<
          Array<{
            Id: number;
            ComputerName: string;
            LastIPAddress: string;
            OperatingSystemName: string;
            ComputerClass: string;
            Status: number;
            LastContact: string;
            Memory?: number;
            CPUFrequency?: number;
          }>
        >('/computers?pagesize=200');
      return devices.map((d) => ({
        providerDeviceId: String(d.Id),
        hostname: d.ComputerName,
        clientName: '',
        ipAddress: d.LastIPAddress ?? '',
        os: d.OperatingSystemName ?? 'Unknown',
        type: this.inferDeviceType(d.ComputerClass),
        status: d.Status === 1 ? 'online' : 'offline',
        cpu: 0,
        memory: 0,
        disk: 0,
        patchesPending: 0,
        lastSeen: d.LastContact ? new Date(d.LastContact) : new Date(),
        alerts: 0,
        threats: 0,
      }));
    } catch (err) {
      logger.warn({ err, provider: 'connectwise_automate' }, 'Failed to fetch CW Automate devices');
      return [];
    }
  }

  async getDeviceById(id: string): Promise<NormalizedDevice | null> {
    try {
      const d = await this.fetch<{
        Id: number;
        ComputerName: string;
        LastIPAddress: string;
        OperatingSystemName: string;
        ComputerClass: string;
        Status: number;
        LastContact: string;
      }>(`/computers/${id}`);
      return {
        providerDeviceId: String(d.Id),
        hostname: d.ComputerName,
        clientName: '',
        ipAddress: d.LastIPAddress ?? '',
        os: d.OperatingSystemName ?? '',
        type: this.inferDeviceType(d.ComputerClass),
        status: d.Status === 1 ? 'online' : 'offline',
        cpu: 0,
        memory: 0,
        disk: 0,
        patchesPending: 0,
        lastSeen: new Date(d.LastContact ?? Date.now()),
        alerts: 0,
        threats: 0,
      };
    } catch {
      return null;
    }
  }

  async restartService(deviceId: string, serviceName: string): Promise<RemoteActionResult> {
    try {
      await this.fetch(
        `/computers/${deviceId}/services/${encodeURIComponent(serviceName)}/restart`,
        { method: 'POST' },
      );
      return { success: true };
    } catch (err) {
      return { success: false, errorMessage: String(err) };
    }
  }

  async rebootDevice(deviceId: string, _forced?: boolean): Promise<RemoteActionResult> {
    try {
      await this.fetch(`/computers/${deviceId}/reboot`, { method: 'POST' });
      return { success: true };
    } catch (err) {
      return { success: false, errorMessage: String(err) };
    }
  }

  async runScript(
    deviceId: string,
    script: string,
    _scriptType?: string,
  ): Promise<RemoteActionResult> {
    try {
      const result = await this.fetch<{ Id: number }>(`/computers/${deviceId}/runscript`, {
        method: 'POST',
        body: JSON.stringify({ Script: script }),
      });
      return { success: true, jobId: String(result.Id) };
    } catch (err) {
      return { success: false, errorMessage: String(err) };
    }
  }

  async killProcess(_deviceId: string, _processId: number): Promise<RemoteActionResult> {
    return { success: false, errorMessage: 'Not supported by CW Automate API' };
  }

  async createTicket(_data: Partial<NormalizedTicket>): Promise<NormalizedTicket | null> {
    return null;
  }

  async closeTicket(_ticketId: string, _note?: string): Promise<boolean> {
    return false;
  }

  async testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      await this.fetch('/computers?pagesize=1');
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, error: String(err) };
    }
  }

  private inferDeviceType(cls: string): NormalizedDevice['type'] {
    const c = (cls ?? '').toLowerCase();
    if (c.includes('server')) return 'server';
    if (c.includes('network')) return 'network';
    if (c.includes('firewall')) return 'firewall';
    return 'workstation';
  }
}

export class ConnectWiseManageProvider implements IRmmProvider {
  name = 'ConnectWise Manage';
  private config: RmmProviderConfig;

  constructor(config: RmmProviderConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return this.config.baseUrl ?? '';
  }

  private get authHeader(): string {
    const creds = `${this.config.companyId ?? ''}+${this.config.clientId ?? ''}:${this.config.clientSecret ?? this.config.apiKey ?? ''}`;
    return `Basic ${Buffer.from(creds).toString('base64')}`;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const resp = await fetch(`${this.baseUrl}/v4_6_release/apis/3.0${path}`, {
      ...options,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        clientId: this.config.clientId ?? '',
        Accept: 'application/json',
        ...(options.headers ?? {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) throw new Error(`ConnectWise Manage ${path} → ${resp.status}`);
    return resp.json() as Promise<T>;
  }

  async getDevices(): Promise<NormalizedDevice[]> {
    return [];
  }

  async getDeviceById(_id: string): Promise<NormalizedDevice | null> {
    return null;
  }

  async restartService(_deviceId: string, _serviceName: string): Promise<RemoteActionResult> {
    return {
      success: false,
      errorMessage: 'ConnectWise Manage is a PSA — use RMM for remote actions',
    };
  }

  async rebootDevice(_deviceId: string, _forced?: boolean): Promise<RemoteActionResult> {
    return {
      success: false,
      errorMessage: 'ConnectWise Manage is a PSA — use RMM for remote actions',
    };
  }

  async runScript(
    _deviceId: string,
    _script: string,
    _scriptType?: string,
  ): Promise<RemoteActionResult> {
    return {
      success: false,
      errorMessage: 'ConnectWise Manage is a PSA — use RMM for remote actions',
    };
  }

  async killProcess(_deviceId: string, _processId: number): Promise<RemoteActionResult> {
    return { success: false, errorMessage: 'Not applicable for PSA provider' };
  }

  async createTicket(data: Partial<NormalizedTicket>): Promise<NormalizedTicket | null> {
    try {
      const ticket = await this.fetch<{
        id: number;
        summary: string;
        status: { name: string };
        priority: { name: string };
        dateEntered: string;
        _info: { lastUpdated: string };
      }>('/service/tickets', {
        method: 'POST',
        body: JSON.stringify({
          summary: data.subject,
          initialDescription: data.description,
          priority: { name: this.mapPriority(data.priority ?? 'medium') },
          board: { name: 'Service Desk' },
        }),
      });
      return {
        providerTicketId: String(ticket.id),
        subject: ticket.summary,
        priority: data.priority ?? 'medium',
        status: 'open',
        createdAt: new Date(ticket.dateEntered),
        updatedAt: new Date(ticket._info?.lastUpdated ?? Date.now()),
        psaUrl: `${this.baseUrl}/v4_6_release/services/system_io/router/openrecord.rails?locale=en_US&recid=${ticket.id}&rectype=ServiceTicket`,
      };
    } catch (err) {
      logger.warn({ err }, 'Failed to create ConnectWise Manage ticket');
      return null;
    }
  }

  async closeTicket(ticketId: string, note?: string): Promise<boolean> {
    try {
      if (note) {
        await this.fetch(`/service/tickets/${ticketId}/notes`, {
          method: 'POST',
          body: JSON.stringify({ text: note, detailDescriptionFlag: true }),
        });
      }
      await this.fetch(`/service/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify([{ op: 'replace', path: '/status', value: { name: 'Closed' } }]),
      });
      return true;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      await this.fetch('/system/info');
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, error: String(err) };
    }
  }

  private mapPriority(p: string): string {
    if (p === 'critical') return 'Priority 1 - Critical';
    if (p === 'high') return 'Priority 2 - High';
    if (p === 'medium') return 'Priority 3 - Medium';
    return 'Priority 4 - Low';
  }
}

export class HaloPsaProvider implements IRmmProvider {
  name = 'HaloPSA';
  private config: RmmProviderConfig;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: RmmProviderConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return this.config.baseUrl ?? '';
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - 30_000) return this.token;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.config.clientId ?? '',
      client_secret: this.config.clientSecret ?? '',
      scope: 'all',
    });
    const resp = await fetch(`${this.baseUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) throw new Error(`HaloPSA OAuth failed: ${resp.status}`);
    const data = (await resp.json()) as { access_token: string; expires_in: number };
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return this.token;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const resp = await fetch(`${this.baseUrl}/api${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers ?? {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) throw new Error(`HaloPSA ${path} → ${resp.status}`);
    return resp.json() as Promise<T>;
  }

  async getDevices(): Promise<NormalizedDevice[]> {
    return [];
  }

  async getDeviceById(_id: string): Promise<NormalizedDevice | null> {
    return null;
  }

  async restartService(_deviceId: string, _serviceName: string): Promise<RemoteActionResult> {
    return { success: false, errorMessage: 'HaloPSA is a PSA — use RMM for remote actions' };
  }

  async rebootDevice(_deviceId: string, _forced?: boolean): Promise<RemoteActionResult> {
    return { success: false, errorMessage: 'HaloPSA is a PSA — use RMM for remote actions' };
  }

  async runScript(
    _deviceId: string,
    _script: string,
    _scriptType?: string,
  ): Promise<RemoteActionResult> {
    return { success: false, errorMessage: 'HaloPSA is a PSA — use RMM for remote actions' };
  }

  async killProcess(_deviceId: string, _processId: number): Promise<RemoteActionResult> {
    return { success: false, errorMessage: 'Not applicable for PSA provider' };
  }

  async createTicket(data: Partial<NormalizedTicket>): Promise<NormalizedTicket | null> {
    try {
      const ticket = await this.fetch<{
        id: number;
        summary: string;
        dateoccurred: string;
        lastmodified: string;
      }>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          summary: data.subject,
          details: data.description,
          tickettype_id: 1,
          priority_id: this.mapPriority(data.priority ?? 'medium'),
        }),
      });
      return {
        providerTicketId: String(ticket.id),
        subject: ticket.summary,
        priority: data.priority ?? 'medium',
        status: 'open',
        createdAt: new Date(ticket.dateoccurred ?? Date.now()),
        updatedAt: new Date(ticket.lastmodified ?? Date.now()),
        psaUrl: `${this.baseUrl}/ticket/${ticket.id}`,
      };
    } catch (err) {
      logger.warn({ err }, 'Failed to create HaloPSA ticket');
      return null;
    }
  }

  async closeTicket(ticketId: string, note?: string): Promise<boolean> {
    try {
      await this.fetch(`/tickets`, {
        method: 'POST',
        body: JSON.stringify([
          {
            id: parseInt(ticketId),
            status_id: 9,
            ...(note ? { note_txt: note } : {}),
          },
        ]),
      });
      return true;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      await this.getToken();
      await this.fetch('/tickets?page_size=1');
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, error: String(err) };
    }
  }

  private mapPriority(p: string): number {
    if (p === 'critical') return 1;
    if (p === 'high') return 2;
    if (p === 'medium') return 3;
    return 4;
  }
}

export class DattoRmmProvider implements IRmmProvider {
  name = 'Datto RMM';
  private config: RmmProviderConfig;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(config: RmmProviderConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return this.config.baseUrl ?? 'https://pinotage-api.centrastage.net';
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - 30_000) return this.token;
    const body = new URLSearchParams({ grant_type: 'client_credentials' });
    const creds = Buffer.from(
      `${this.config.apiKey ?? ''}:${this.config.clientSecret ?? ''}`,
    ).toString('base64');
    const resp = await fetch(`${this.baseUrl}/auth/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${creds}`,
      },
      body: body.toString(),
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) throw new Error(`Datto OAuth failed: ${resp.status}`);
    const data = (await resp.json()) as { access_token: string; expires_in: number };
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    return this.token;
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const resp = await fetch(`${this.baseUrl}/api/v2${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) throw new Error(`Datto RMM API ${path} → ${resp.status}`);
    return resp.json() as Promise<T>;
  }

  async getDevices(): Promise<NormalizedDevice[]> {
    try {
      const data = await this.fetch<{ devices?: Array<Record<string, unknown>> }>(
        '/account/devices?max=200',
      );
      const devices = data.devices ?? [];
      return devices.map((d: Record<string, unknown>) => ({
        providerDeviceId: String(d.uid ?? d.id ?? ''),
        hostname: String(d.hostname ?? 'Unknown'),
        clientName: String(d.siteName ?? ''),
        ipAddress: String(d.intIpAddress ?? d.extIpAddress ?? ''),
        os: String(d.operatingSystem ?? 'Unknown'),
        type: this.inferType(String(d.deviceType ?? '')),
        status: d.online ? ('online' as const) : ('offline' as const),
        cpu: Number(d.cpuUtilization ?? d.cpuUsage ?? 0),
        memory: Number(d.memoryUtilization ?? d.ramUsage ?? 0),
        disk: Number(d.diskUtilization ?? d.diskUsage ?? 0),
        patchesPending: Number(d.patchesMissing ?? 0),
        lastSeen: new Date(String(d.lastSeen ?? new Date().toISOString())),
        alerts: Number(d.openAlertCount ?? 0),
        threats: Number(d.antivirusThreats ?? 0),
      }));
    } catch (err) {
      logger.error({ err }, 'Datto RMM getDevices failed');
      return [];
    }
  }

  async getDeviceById(id: string): Promise<NormalizedDevice | null> {
    try {
      const d = await this.fetch<Record<string, unknown>>(`/device/${id}`);
      return {
        providerDeviceId: String(d.uid ?? id),
        hostname: String(d.hostname ?? 'Unknown'),
        clientName: String(d.siteName ?? ''),
        ipAddress: String(d.intIpAddress ?? ''),
        os: String(d.operatingSystem ?? 'Unknown'),
        type: this.inferType(String(d.deviceType ?? '')),
        status: d.online ? 'online' : 'offline',
        cpu: Number(d.cpuUtilization ?? d.cpuUsage ?? 0),
        memory: Number(d.memoryUtilization ?? d.ramUsage ?? 0),
        disk: Number(d.diskUtilization ?? d.diskUsage ?? 0),
        patchesPending: Number(d.patchesMissing ?? 0),
        lastSeen: d.lastSeen ? new Date(String(d.lastSeen)) : new Date(),
        alerts: Number(d.openAlertCount ?? 0),
        threats: Number(d.antivirusThreats ?? 0),
      };
    } catch {
      return null;
    }
  }

  async restartService(deviceId: string, serviceName: string): Promise<RemoteActionResult> {
    return this.runScript(deviceId, `Restart-Service -Name '${serviceName}' -Force`, 'powershell');
  }

  async rebootDevice(deviceId: string): Promise<RemoteActionResult> {
    return this.runScript(deviceId, 'Restart-Computer -Force', 'powershell');
  }

  async runScript(
    deviceId: string,
    script: string,
    _scriptType?: 'powershell' | 'bash',
  ): Promise<RemoteActionResult> {
    try {
      const result = await this.fetch<{ uid?: string }>(`/device/${deviceId}/quickjob`, {
        method: 'POST',
        body: JSON.stringify({ jobName: 'RMM Remote Action', command: script }),
      });
      return { success: true, jobId: String(result.uid ?? ''), output: 'Job submitted' };
    } catch (err) {
      return { success: false, errorMessage: String(err) };
    }
  }

  async killProcess(deviceId: string, processId: number): Promise<RemoteActionResult> {
    return this.runScript(deviceId, `Stop-Process -Id ${processId} -Force`, 'powershell');
  }

  async createTicket(): Promise<NormalizedTicket | null> {
    return null;
  }
  async closeTicket(): Promise<boolean> {
    return false;
  }

  async testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      await this.fetch('/account/devices?max=1');
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, error: String(err) };
    }
  }

  private inferType(deviceType: string): NormalizedDevice['type'] {
    const lower = deviceType.toLowerCase();
    if (lower.includes('server')) return 'server';
    if (lower.includes('network') || lower.includes('switch') || lower.includes('router'))
      return 'network';
    if (lower.includes('printer')) return 'printer';
    if (lower.includes('firewall')) return 'firewall';
    return 'workstation';
  }
}

export class AutotaskPsaProvider implements IRmmProvider {
  name = 'Autotask PSA';
  private config: RmmProviderConfig;

  constructor(config: RmmProviderConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return this.config.baseUrl ?? 'https://webservices.autotask.net/ATServicesRest';
  }

  private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ApiIntegrationCode: this.config.companyId ?? '',
      UserName: this.config.username ?? this.config.apiKey ?? '',
      Secret: this.config.password ?? this.config.clientSecret ?? '',
    };
    const resp = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers ?? {}) },
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) throw new Error(`Autotask API ${path} → ${resp.status}`);
    return resp.json() as Promise<T>;
  }

  async getDevices(): Promise<NormalizedDevice[]> {
    try {
      const data = await this.fetch<{ items?: Array<Record<string, unknown>> }>(
        '/V1.0/ConfigurationItems/query',
        {
          method: 'POST',
          body: JSON.stringify({
            Filter: [{ field: 'isActive', op: 'eq', value: true }],
            MaxRecords: 200,
          }),
        },
      );
      const items = data.items ?? [];
      return items.map((d: Record<string, unknown>) => ({
        providerDeviceId: String(d.id ?? ''),
        hostname: String(d.referenceTitle ?? d.referenceNumber ?? 'Unknown'),
        clientName: String(d.companyName ?? ''),
        ipAddress: String(d.ipAddress ?? ''),
        os: String(d.operatingSystem ?? 'Unknown'),
        type: 'workstation' as const,
        status: d.isActive ? ('online' as const) : ('offline' as const),
        cpu: 0,
        memory: 0,
        disk: 0,
        patchesPending: 0,
        lastSeen: new Date(String(d.lastActivityDate ?? new Date().toISOString())),
        alerts: 0,
        threats: 0,
      }));
    } catch (err) {
      logger.error({ err }, 'Autotask getDevices failed');
      return [];
    }
  }

  async getDeviceById(id: string): Promise<NormalizedDevice | null> {
    try {
      const d = await this.fetch<{ item?: Record<string, unknown> }>(
        `/V1.0/ConfigurationItems/${id}`,
      );
      const item = d.item ?? {};
      return {
        providerDeviceId: String(item.id ?? id),
        hostname: String(item.referenceTitle ?? 'Unknown'),
        clientName: String(item.companyName ?? ''),
        ipAddress: String(item.ipAddress ?? ''),
        os: String(item.operatingSystem ?? 'Unknown'),
        type: 'workstation',
        status: item.isActive ? 'online' : 'offline',
        cpu: 0,
        memory: 0,
        disk: 0,
        patchesPending: 0,
        lastSeen: new Date(),
        alerts: 0,
        threats: 0,
      };
    } catch {
      return null;
    }
  }

  async restartService(): Promise<RemoteActionResult> {
    return {
      success: false,
      errorMessage:
        'Autotask PSA does not support remote service management directly. Use the integrated RMM (Datto) for remote actions.',
    };
  }

  async rebootDevice(): Promise<RemoteActionResult> {
    return {
      success: false,
      errorMessage:
        'Autotask PSA does not support remote device management directly. Use the integrated RMM (Datto) for remote actions.',
    };
  }

  async runScript(): Promise<RemoteActionResult> {
    return {
      success: false,
      errorMessage:
        'Autotask PSA does not support remote script execution. Use the integrated RMM (Datto) for remote actions.',
    };
  }

  async killProcess(): Promise<RemoteActionResult> {
    return {
      success: false,
      errorMessage:
        'Autotask PSA does not support remote process management. Use the integrated RMM (Datto) for remote actions.',
    };
  }

  async createTicket(data: Partial<NormalizedTicket>): Promise<NormalizedTicket | null> {
    try {
      const priorityMap: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };
      const body = {
        title: data.subject ?? 'Auto-generated ticket',
        description: data.description ?? '',
        priority: priorityMap[data.priority ?? 'medium'] ?? 3,
        status: 1,
      };
      const result = await this.fetch<{ item?: { id: number } }>('/V1.0/Tickets', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!result.item) return null;
      return {
        providerTicketId: String(result.item.id),
        subject: data.subject ?? '',
        description: data.description,
        priority: data.priority ?? 'medium',
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (err) {
      logger.error({ err }, 'Autotask createTicket failed');
      return null;
    }
  }

  async closeTicket(ticketId: string, note?: string): Promise<boolean> {
    try {
      await this.fetch(`/V1.0/Tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 5, resolution: note ?? 'Resolved via auto-healing' }),
      });
      return true;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      await this.fetch('/V1.0/Companies/query', {
        method: 'POST',
        body: JSON.stringify({
          Filter: [{ field: 'isActive', op: 'eq', value: true }],
          MaxRecords: 1,
        }),
      });
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, error: String(err) };
    }
  }
}

export function createRmmProvider(config: RmmProviderConfig): IRmmProvider | null {
  switch (config.provider) {
    case 'ninjaone':
      return new NinjaOneProvider(config);
    case 'connectwise_automate':
      return new ConnectWiseAutomateProvider(config);
    case 'connectwise_manage':
      return new ConnectWiseManageProvider(config);
    case 'halopsa':
      return new HaloPsaProvider(config);
    case 'datto_rmm':
      return new DattoRmmProvider(config);
    case 'autotask_psa':
      return new AutotaskPsaProvider(config);
    default:
      logger.warn({ provider: config.provider }, 'Unknown RMM provider type');
      return null;
  }
}

const providerCache = new Map<number, { provider: IRmmProvider; config: RmmProviderConfig }>();

export function getCachedProvider(connectorId: number): IRmmProvider | null {
  return providerCache.get(connectorId)?.provider ?? null;
}

export function setCachedProvider(
  connectorId: number,
  config: RmmProviderConfig,
): IRmmProvider | null {
  const provider = createRmmProvider(config);
  if (provider) providerCache.set(connectorId, { provider, config });
  return provider;
}

export function clearProviderCache(connectorId: number): void {
  providerCache.delete(connectorId);
}

export function getProviderCount(): number {
  return providerCache.size;
}
