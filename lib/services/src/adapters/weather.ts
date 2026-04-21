import { ServiceAdapter } from "../base.js";

export interface WeatherConditions {
  location: string;
  temperature: number;
  temperatureUnit: "C" | "F";
  humidity: number;
  description: string;
  windSpeed: number;
  windDirection: string;
  timestamp: string;
}

export interface WeatherForecastDay {
  date: string;
  high: number;
  low: number;
  description: string;
  precipitationChance: number;
}

const MOCK_CONDITIONS: WeatherConditions = {
  location: "San Francisco, CA",
  temperature: 18,
  temperatureUnit: "C",
  humidity: 72,
  description: "Partly cloudy",
  windSpeed: 15,
  windDirection: "W",
  timestamp: new Date().toISOString(),
};

const MOCK_FORECAST: WeatherForecastDay[] = [
  { date: "2026-03-26", high: 19, low: 12, description: "Sunny", precipitationChance: 5 },
  { date: "2026-03-27", high: 17, low: 11, description: "Partly cloudy", precipitationChance: 15 },
  { date: "2026-03-28", high: 15, low: 10, description: "Light rain", precipitationChance: 65 },
  { date: "2026-03-29", high: 16, low: 11, description: "Overcast", precipitationChance: 30 },
  { date: "2026-03-30", high: 20, low: 13, description: "Sunny", precipitationChance: 0 },
];

export class WeatherAdapter extends ServiceAdapter {
  readonly name = "weather";
  readonly description = "Weather current conditions and forecasts";
  readonly requiredEnvVars = ["WEATHER_API_KEY"];

  protected override async performHealthCheck(): Promise<void> {
    const apiKey = process.env["WEATHER_API_KEY"];
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=London`,
    );
    if (!response.ok) throw new Error(`Weather API returned ${response.status}`);
  }

  async getCurrentConditions(
    location: string,
  ): Promise<WeatherConditions> {
    if (!this.isLive) {
      return { ...MOCK_CONDITIONS, location, timestamp: new Date().toISOString() };
    }

    const apiKey = process.env["WEATHER_API_KEY"]!;
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`,
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json() as {
      main: { temp: number; humidity: number };
      weather: Array<{ description: string }>;
      wind: { speed: number; deg: number };
      name: string;
    };

    const degToDir = (deg: number) => {
      const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      return dirs[Math.round(deg / 45) % 8]!;
    };

    return {
      location: data.name,
      temperature: Math.round(data.main.temp),
      temperatureUnit: "C",
      humidity: data.main.humidity,
      description: data.weather[0]?.description ?? "Unknown",
      windSpeed: Math.round(data.wind.speed * 3.6),
      windDirection: degToDir(data.wind.deg),
      timestamp: new Date().toISOString(),
    };
  }

  async getForecast(
    _location: string,
    _days?: number,
  ): Promise<WeatherForecastDay[]> {
    if (!this.isLive) {
      return [...MOCK_FORECAST];
    }

    const apiKey = process.env["WEATHER_API_KEY"]!;
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(_location)}&appid=${apiKey}&units=metric&cnt=${(_days ?? 5) * 8}`,
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json() as {
      list: Array<{
        dt_txt: string;
        main: { temp_max: number; temp_min: number };
        weather: Array<{ description: string }>;
        pop: number;
      }>;
    };

    const dayMap = new Map<string, WeatherForecastDay>();
    for (const item of data.list) {
      const date = item.dt_txt.split(" ")[0]!;
      const existing = dayMap.get(date);
      if (!existing) {
        dayMap.set(date, {
          date,
          high: Math.round(item.main.temp_max),
          low: Math.round(item.main.temp_min),
          description: item.weather[0]?.description ?? "",
          precipitationChance: Math.round(item.pop * 100),
        });
      } else {
        existing.high = Math.max(existing.high, Math.round(item.main.temp_max));
        existing.low = Math.min(existing.low, Math.round(item.main.temp_min));
      }
    }

    return Array.from(dayMap.values()).slice(0, _days ?? 5);
  }
}
