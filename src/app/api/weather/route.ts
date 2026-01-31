import { NextRequest, NextResponse } from 'next/server';

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self';",
};

export async function GET(request: NextRequest) {
  try {
    const weatherApiKey = process.env.WEATHER_KEY;
    
    if (!weatherApiKey) {
      return NextResponse.json(
        { error: 'Weather API key not configured' },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }

    // Fetch weather data from WeatherAPI
    const weatherResponse = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=30041&aqi=no`
    );

    if (!weatherResponse.ok) {
      console.error('Weather API failed:', weatherResponse.status);
      return NextResponse.json(
        { error: 'Weather data unavailable' },
        { status: 502, headers: SECURITY_HEADERS }
      );
    }

    const weatherData = await weatherResponse.json();
    
    return NextResponse.json(weatherData, {
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
