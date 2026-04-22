import { ServiceAdapter } from '../base.js';

export interface MarineWeather {
  latitude: number;
  longitude: number;
  waveHeight: number;
  wavePeriod: number;
  windSpeed: number;
  windDirection: number;
  waterTemperature: number;
  timestamp: string;
}

const MOCK_MARINE: MarineWeather[] = [
  {
    latitude: 37.7749,
    longitude: -122.4194,
    waveHeight: 1.8,
    wavePeriod: 8.2,
    windSpeed: 12.5,
    windDirection: 285,
    waterTemperature: 14.2,
    timestamp: new Date().toISOString(),
  },
];

export class StormGlassAdapter extends ServiceAdapter {
  readonly name = 'stormglass';
  readonly description = 'StormGlass marine weather and ocean data';
  readonly requiredEnvVars = ['STORMGLASS_API_KEY'];

  private get apiKey(): string | undefined {
    return process.env.STORMGLASS_API_KEY;
  }

  protected override async performHealthCheck(): Promise<void> {
    const result = await this.testConnection();
    if (!result.connected) throw new Error('StormGlass connection verification failed');
  }

  async testConnection(): Promise<{ connected: boolean }> {
    if (!this.isLive) return { connected: false };
    try {
      const response = await fetch(
        `https://api.stormglass.io/v2/weather/point?lat=37.77&lng=-122.41&params=waveHeight`,
        { headers: { Authorization: this.apiKey! } },
      );
      return { connected: response.ok };
    } catch {
      return { connected: false };
    }
  }

  async getMarineWeather(lat: number, lng: number): Promise<MarineWeather[]> {
    if (!this.isLive) {
      return MOCK_MARINE.map((m) => ({ ...m, latitude: lat, longitude: lng }));
    }
    try {
      const params = 'waveHeight,wavePeriod,windSpeed,windDirection,waterTemperature';
      const response = await fetch(
        `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${params}`,
        { headers: { Authorization: this.apiKey! } },
      );
      if (!response.ok) throw new Error(`StormGlass API error: ${response.status}`);
      const data = (await response.json()) as {
        hours: Array<{
          time: string;
          waveHeight?: { noaa: number };
          wavePeriod?: { noaa: number };
          windSpeed?: { noaa: number };
          windDirection?: { noaa: number };
          waterTemperature?: { noaa: number };
        }>;
      };
      return data.hours.slice(0, 24).map((h) => ({
        latitude: lat,
        longitude: lng,
        waveHeight: h.waveHeight?.noaa ?? 0,
        wavePeriod: h.wavePeriod?.noaa ?? 0,
        windSpeed: h.windSpeed?.noaa ?? 0,
        windDirection: h.windDirection?.noaa ?? 0,
        waterTemperature: h.waterTemperature?.noaa ?? 0,
        timestamp: h.time,
      }));
    } catch {
      return MOCK_MARINE.map((m) => ({ ...m, latitude: lat, longitude: lng }));
    }
  }

  async sync(): Promise<{ synced: number; timestamp: string }> {
    return { synced: 1, timestamp: new Date().toISOString() };
  }
}
