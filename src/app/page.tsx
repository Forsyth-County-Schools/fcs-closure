'use client';

import { CheckCircle, XCircle, Sun, Cloud, CloudRain, Wind, Droplets, Clock, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import RefreshButton from '@/components/refresh-button';
import RedirectButton from '@/components/redirect-button';
import WeatherMonitorBox from '@/components/WeatherMonitorBox';
import { formatDate } from '@/lib/date-utils';
import { getWeatherIcon } from '@/lib/weather-utils';

// Weather data interface
interface WeatherData {
  temp_f: number;
  condition: { text: string; icon: string };
  wind_mph: number;
  humidity: number;
}

// School status interface
interface SchoolStatus {
  isOpen?: boolean;
  status: string;
  lastUpdated: string;
  message: string;
  announcement?: string;
}

// Fetch weather data from client side
async function fetchWeatherData(): Promise<WeatherData | null> {
  try {
    console.log('🌤️ Client: Fetching weather from public endpoint');
    const response = await fetch('/api/weather');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Client: Weather API request failed', {
        status: response.status,
        statusText: response.statusText,
        bodyPreview: errorText.slice(0, 300),
      });
      throw new Error(`Weather API request failed (${response.status}): ${errorText.slice(0, 100)}`);
    }
    
    const data = await response.json();
    console.log('✅ Client: Weather data received', {
      location: data.location?.name,
      temp_f: data.current?.temp_f,
      condition: data.current?.condition?.text,
    });
    return data.current || null;
  } catch (error) {
    console.error('💥 Client: Error fetching weather data', error);
    return null;
  }
}

// Fetch school status from client side
async function fetchSchoolStatus(): Promise<SchoolStatus | null> {
  try {
    const response = await fetch('/api/status');
    
    if (!response.ok) {
      throw new Error('School status API request failed');
    }
    
    return await response.json();
  } catch {
    // Silently handle school status errors to prevent page crashes
    return null;
  }
}

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastKnownStatus, setLastKnownStatus] = useState<string>('');
  
  const currentDate = formatDate();
  const weatherIconName = weatherData ? weatherData.condition?.text || '' : '';
  const WeatherIcon = weatherIconName ? getWeatherIcon(weatherIconName) : Sun;
  
  // Fetch data on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Don't show loading state for background updates
        const [weather, status] = await Promise.all([
          fetchWeatherData(),
          fetchSchoolStatus()
        ]);
        setWeatherData(weather);
        setSchoolStatus(status);
        
        // Check for status changes
        if (status && status.message && status.isOpen === false) {
          const currentStatus = status.message;
          setLastKnownStatus(prevStatus => {
            if (currentStatus !== prevStatus) {
              console.log('🚨 School status changed:', currentStatus);
            }
            return currentStatus;
          });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    }
    
    // Initial load
    loadData();
    
    // Auto-refresh entire page every 10 seconds in background
    const interval = setInterval(loadData, 10 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Deep charcoal background with subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
      
      {/* Digital grid pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-10" />
      
      {/* Vibrant neon accent overlays */}
      <div className="fixed inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="text-center py-6 px-4">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.webp" 
              alt="Forsyth County Schools Logo" 
              className="w-14 h-14 md:w-20 md:h-24 lg:w-24 lg:h-24"
            />
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              FORSYTH COUNTY
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              SCHOOLS
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-400 mb-4 font-light tracking-wide uppercase">
            Real-time Status Monitoring Dashboard
          </p>
          <div className="flex items-center justify-center gap-2 text-cyan-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm md:text-base font-light tracking-wider">{currentDate}</span>
            <MapPin className="w-4 h-4 ml-2" />
            <span className="text-sm md:text-base font-light tracking-wider">Forsyth County, GA</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Status Card */}
            <div className="h-full">
              {/* Main Status Card - High-Fidelity Glassmorphism */}
              <div className="relative group h-full">
                {/* Glowing border effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:from-green-500/30 group-hover:via-cyan-500/30 group-hover:to-blue-500/30 transition-all duration-500" />
                
                <div className={`relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-7 shadow-2xl hover:bg-black/50 transition-all duration-500 h-full overflow-hidden ${schoolStatus?.isOpen === false ? 'bg-[linear-gradient(45deg,_rgba(239,68,68,0.1)_25%,_transparent_25%),_linear-gradient(-45deg,_rgba(239,68,68,0.1)_25%,_transparent_25%),_linear-gradient(45deg,_transparent_75%,_rgba(239,68,68,0.1)_75%),_linear-gradient(-45deg,_transparent_75%,_rgba(239,68,68,0.1)_75%)] bg-[length:20px_20px]' : ''}`}>
                  {/* Inner glow */}
                  {schoolStatus?.isOpen === false ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-rose-500/5 rounded-3xl" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-cyan-500/5 rounded-3xl" />
                  )}
                  
                  <div className="relative h-full flex flex-col items-center justify-center text-center">
                    {/* Status Icon */}
                    <div className="mb-4 relative">
                      {schoolStatus?.isOpen === false ? (
                        <>
                          <div className="absolute inset-0 bg-red-500/30 rounded-full blur-2xl animate-pulse" />
                          <XCircle className="relative w-16 h-16 md:w-24 md:h-24 text-red-400 drop-shadow-[0_0_40px_rgba(239,68,68,0.8)]" />
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl animate-pulse" />
                          <CheckCircle className="relative w-16 h-16 md:w-24 md:h-24 text-green-400 drop-shadow-[0_0_40px_rgba(52,211,153,0.8)]" />
                        </>
                      )}
                    </div>
                    
                    {/* Bold status text */}
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-4 tracking-tight">
                      {schoolStatus?.isOpen === false ? (
                        <span className="bg-gradient-to-r from-red-400 via-rose-400 to-pink-400 bg-clip-text text-transparent">
                          SCHOOL IS CLOSED
                        </span>
                      ) : (
                        <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                          SCHOOL IS ON SCHEDULE
                        </span>
                      )}
                    </h2>
                    
                    <p className="text-base md:text-lg text-gray-300 mb-5 font-light tracking-wide">
                      {schoolStatus?.message || 'All operations proceeding normally'}
                    </p>
                    
                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <RefreshButton />
                      <RedirectButton 
                        url="https://www.forsyth.k12.ga.us/district-services/communications/inclement-weather-closure"
                        message="Redirecting you to the district's official weather closure page where you can find detailed information about school closures and delays."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Card */}
            <div className="h-full">
              {/* Weather Card - High-Fidelity Design */}
              <div className="relative group h-full">
                {/* Glowing border */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:from-cyan-500/30 group-hover:via-blue-500/30 group-hover:to-purple-500/30 transition-all duration-500" />
                
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl hover:bg-black/50 transition-all duration-500 h-full">
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-3xl" />
                  
                  <div className="relative h-full flex flex-col">
                    <h3 className="text-base font-bold mb-4 text-white flex items-center gap-2 tracking-wide">
                      <WeatherIcon className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]" />
                      Weather Conditions
                    </h3>
                    
                    {weatherData ? (
                      <div className="space-y-4 flex-1 flex flex-col justify-center">
                        {/* Weather icon and temperature */}
                        <div className="text-center">
                          <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl" />
                            <WeatherIcon className="relative w-12 h-12 md:w-16 md:h-16 text-cyan-400" />
                          </div>
                          <p className="text-2xl md:text-3xl font-black mb-2 tracking-tight">
                            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                              {weatherData.temp_f}°F
                            </span>
                          </p>
                          <p className="text-base text-gray-300 font-light tracking-wide">
                            {weatherData.condition?.text || 'Unknown'}
                          </p>
                        </div>
                        
                        {/* Weather details */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-3">
                            <Wind className="w-4 h-4 text-cyan-400" />
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider">Wind</p>
                              <p className="text-base font-bold text-white">{weatherData.wind_mph} mph</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Droplets className="w-4 h-4 text-cyan-400" />
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider">Humidity</p>
                              <p className="text-base font-bold text-white">{weatherData.humidity}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 flex-1 flex items-center justify-center">
                        <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Weather data unavailable</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* FCS Weather Monitor Box */}
          <div className="mt-6">
            <WeatherMonitorBox compact />
          </div>

          {/* Backlinks Section */}
          <div className="mt-2 flex gap-1 justify-center opacity-0 hover:opacity-30 transition-opacity">
            <a
              href="https://www.forsyth.k12.ga.us"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-200 hover:text-blue-400 dark:text-gray-800 dark:hover:text-blue-300 transition-colors"
            >
              FCS
            </a>
            
            <a
              href="https://www.weather.gov/ffc/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-200 hover:text-green-400 dark:text-gray-800 dark:hover:text-green-300 transition-colors"
            >
              Weather
            </a>
            
            <a
              href="/backlinks"
              className="text-xs text-gray-200 hover:text-purple-400 dark:text-gray-800 dark:hover:text-purple-300 transition-colors"
            >
              More
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
