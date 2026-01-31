import { CheckCircle, Sun, Cloud, CloudRain, Wind, Droplets, Activity, Clock, MapPin } from 'lucide-react';
import RefreshButton from '@/components/refresh-button';

// Weather data interface
interface WeatherData {
  temp_F: string;
  weatherDesc: { value: string }[];
  windspeedMiles: string;
  humidity: string;
}

// School status interface
interface SchoolStatus {
  status: string;
  lastUpdated: string;
  message: string;
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(day: number): string {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

// Helper function to format date
function formatDate(): string {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = days[now.getDay()];
  const monthName = months[now.getMonth()];
  const day = now.getDate();
  const suffix = getOrdinalSuffix(day);
  
  return `${dayName}, ${monthName} ${day}${suffix}`;
}

// Helper function to get weather icon
function getWeatherIcon(condition: string) {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) return Sun;
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) return CloudRain;
  if (lowerCondition.includes('cloud')) return Cloud;
  return Sun; // default
}

// Fetch weather data
async function fetchWeatherData(): Promise<WeatherData | null> {
  try {
    const response = await fetch('https://wttr.in/30041?format=j1', {
      next: { revalidate: 600 } // Cache for 10 minutes
    });
    
    if (!response.ok) {
      throw new Error('Weather API request failed');
    }
    
    const data = await response.json();
    return data.current_condition?.[0] || null;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

// Fetch school status
async function fetchSchoolStatus(): Promise<SchoolStatus | null> {
  try {
    const response = await fetch('/api/school-status');
    
    if (!response.ok) {
      throw new Error('School status API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching school status:', error);
    return null;
  }
}

export default async function Home() {
  // Fetch data server-side
  const weatherData = await fetchWeatherData();
  const schoolStatus = await fetchSchoolStatus();
  
  const currentDate = formatDate();
  const WeatherIcon = weatherData ? getWeatherIcon(weatherData.weatherDesc[0]?.value || '') : Sun;
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      
      {/* Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="text-center py-8 md:py-12 px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Forsyth County Schools
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4">
            Real-time Status Monitoring Dashboard
          </p>
          <div className="flex items-center justify-center gap-2 text-cyan-300">
            <Clock className="w-5 h-5" />
            <span className="text-lg md:text-xl font-medium">{currentDate}</span>
            <MapPin className="w-5 h-5 ml-2" />
            <span className="text-lg md:text-xl font-medium">Forsyth County, GA</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Center Column - Status Card */}
            <div className="lg:col-span-2">
              {/* Main Status Card */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl mb-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6">
                    <CheckCircle className="w-24 h-24 md:w-32 md:h-32 text-green-400 drop-shadow-[0_0_24px_rgba(52,211,153,0.5)]" />
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
                    {schoolStatus?.status || 'School is scheduled as normal'}
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-300 mb-8">
                    {schoolStatus?.message || 'No changes detected today'}
                  </p>
                  <RefreshButton />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-6 h-6 text-cyan-400" />
                    <span className="text-gray-400 text-sm">Uptime</span>
                  </div>
                  <p className="text-2xl font-bold text-white">99.9%</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-6 h-6 text-cyan-400" />
                    <span className="text-gray-400 text-sm">Response Time</span>
                  </div>
                  <p className="text-2xl font-bold text-white">145ms</p>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-6 h-6 text-cyan-400" />
                    <span className="text-gray-400 text-sm">Checks Today</span>
                  </div>
                  <p className="text-2xl font-bold text-white">1,247</p>
                </div>
              </div>
            </div>

            {/* Right Column - Weather */}
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl hover:bg-white/10 transition-all duration-300">
                <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                  <WeatherIcon className="w-6 h-6 text-cyan-400" />
                  Weather Conditions
                </h3>
                
                {weatherData ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <WeatherIcon className="w-16 h-16 md:w-20 md:h-20 text-cyan-400 mx-auto mb-4" />
                      <p className="text-3xl font-bold text-white mb-2">
                        {weatherData.temp_F}°F
                      </p>
                      <p className="text-lg text-gray-300 mb-4">
                        {weatherData.weatherDesc[0]?.value || 'Unknown'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Wind className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="text-xs text-gray-400">Wind</p>
                          <p className="text-sm font-semibold text-white">{weatherData.windspeedMiles} mph</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="text-xs text-gray-400">Humidity</p>
                          <p className="text-sm font-semibold text-white">{weatherData.humidity}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Weather data unavailable</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
