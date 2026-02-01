// Type guard utilities for weather data

export interface WeatherData {
  temp_f: number;
  condition: { text: string; icon: string };
  wind_mph: number;
  humidity: number;
}

export interface SchoolStatus {
  isOpen?: boolean;
  status: string;
  lastUpdated: string;
  message: string;
  announcement?: string;
}

// Type guard for WeatherData
export function isWeatherData(obj: unknown): obj is WeatherData {
  if (!obj || typeof obj !== 'object') return false;
  
  const data = obj as Record<string, unknown>;
  return (
    typeof data.temp_f === 'number' &&
    typeof data.wind_mph === 'number' &&
    typeof data.humidity === 'number' &&
    data.condition !== null &&
    typeof data.condition === 'object' &&
    typeof (data.condition as Record<string, unknown>).text === 'string' &&
    typeof (data.condition as Record<string, unknown>).icon === 'string'
  );
}

// Type guard for SchoolStatus
export function isSchoolStatus(obj: unknown): obj is SchoolStatus {
  if (!obj || typeof obj !== 'object') return false;
  
  const data = obj as Record<string, unknown>;
  return (
    (data.isOpen === undefined || typeof data.isOpen === 'boolean') &&
    typeof data.status === 'string' &&
    typeof data.lastUpdated === 'string' &&
    typeof data.message === 'string' &&
    (data.announcement === undefined || typeof data.announcement === 'string')
  );
}

// Safe conversion function
export function toWeatherDataRecord(weatherData: WeatherData | null | undefined): Record<string, unknown> | undefined {
  if (!weatherData || !isWeatherData(weatherData)) return undefined;
  
  return {
    temp_f: weatherData.temp_f,
    wind_mph: weatherData.wind_mph,
    humidity: weatherData.humidity,
    condition: {
      text: weatherData.condition.text,
      icon: weatherData.condition.icon
    }
  };
}
