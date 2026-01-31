import { NextRequest, NextResponse } from 'next/server';

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src * 'unsafe-eval'; style-src 'self'; connect-src 'self' https://api.weatherapi.com https://www.weatherapi.com;",
};

export async function GET(request: NextRequest) {
  console.log('🌤️ Weather API: Request received');
  
  try {
    const weatherApiKey = process.env.WEATHER_KEY;
    
    if (!weatherApiKey) {
      console.error('❌ Weather API: WEATHER_KEY not configured');
      return NextResponse.json(
        { error: 'Weather API key not configured' },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }

    console.log('🔑 Weather API: Key found, fetching from WeatherAPI.com');
    
    // Fetch weather data from WeatherAPI
    const weatherResponse = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=30041&aqi=no`
    );

    console.log(`📡 Weather API: Response status ${weatherResponse.status}`);

    if (!weatherResponse.ok) {
      console.error('❌ Weather API: Failed to fetch data', weatherResponse.status);
      return NextResponse.json(
        { error: 'Weather data unavailable' },
        { status: 502, headers: SECURITY_HEADERS }
      );
    }

    const weatherData = await weatherResponse.json();
    console.log('✅ Weather API: Data received', {
      location: weatherData.location?.name,
      temp_f: weatherData.current?.temp_f,
      condition: weatherData.current?.condition?.text,
      wind_mph: weatherData.current?.wind_mph,
      humidity: weatherData.current?.humidity,
    });
    
    return NextResponse.json(weatherData, {
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    console.error('💥 Weather API: Unexpected error', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
