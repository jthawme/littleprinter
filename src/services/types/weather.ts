import { SaveCanvasObject } from '../../utils/drawing';

export interface WeatherOptions {
  lat: number;
  lon: number;
}

export interface WeatherType {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface DailyItem {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_deg: number;
  weather: WeatherType[];
  clouds: number;
  rain: number;
  uvi: number;
}

export interface WeatherItem {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  daily: DailyItem[];
}

export interface WeatherService {
  name: string;
  run: (options: WeatherOptions) => Promise<SaveCanvasObject>;
}
