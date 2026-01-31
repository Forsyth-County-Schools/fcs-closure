import { Sun, Cloud, CloudRain } from 'lucide-react';

export type WeatherIconComponent = typeof Sun;

// Weather icon selection utility
export function getWeatherIcon(condition: string): WeatherIconComponent {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
    return Sun;
  }
  
  if (lowerCondition.includes('rain') || 
      lowerCondition.includes('shower') || 
      lowerCondition.includes('drizzle')) {
    return CloudRain;
  }
  
  if (lowerCondition.includes('cloud') || 
      lowerCondition.includes('overcast') || 
      lowerCondition.includes('mist') || 
      lowerCondition.includes('fog')) {
    return Cloud;
  }
  
  // Default to sun for unknown conditions
  return Sun;
}

// Weather condition classification
export function classifyWeatherCondition(condition: string): 'clear' | 'cloudy' | 'rainy' | 'unknown' {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
    return 'clear';
  }
  
  if (lowerCondition.includes('rain') || 
      lowerCondition.includes('shower') || 
      lowerCondition.includes('drizzle')) {
    return 'rainy';
  }
  
  if (lowerCondition.includes('cloud') || 
      lowerCondition.includes('overcast') || 
      lowerCondition.includes('mist') || 
      lowerCondition.includes('fog')) {
    return 'cloudy';
  }
  
  return 'unknown';
}

// Get weather description for accessibility
export function getWeatherDescription(condition: string): string {
  const classification = classifyWeatherCondition(condition);
  
  switch (classification) {
    case 'clear':
      return 'Clear skies';
    case 'cloudy':
      return 'Cloudy conditions';
    case 'rainy':
      return 'Rainy weather';
    default:
      return 'Unknown weather conditions';
  }
}
