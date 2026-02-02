'use client';

import { CheckCircle, XCircle, Sun, Cloud, CloudRain, Wind, Droplets, Clock, MapPin, Smartphone, Bell, BellOff, Mail, BellRing, MessageCircle, Heart, Share2, ExternalLink, Eye, Gauge, Thermometer, CloudSnow, Zap, RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  requestNotificationPermission, 
  sendFCSNotification, 
  areNotificationsSupported,
  getNotificationPermission,
  isServerSide
} from '@/lib/notification-service';
import { 
  getDeviceInfo, 
  getDeviceStyles, 
  isMobileDevice 
} from '@/lib/device-detection';
import { 
  isWeatherData, 
  toWeatherDataRecord 
} from '@/lib/type-guards';
import { 
  formatDate, 
  formatTime 
} from '@/lib/date-utils';
import { 
  getWeatherIcon,
  type WeatherIconComponent 
} from '@/lib/weather-utils';
import RedirectButton from '@/components/redirect-button';

// Weather data interface
interface WeatherData {
  temp_f: number;
  temp_c: number;
  feelslike_f: number;
  feelslike_c: number;
  condition: { text: string; icon: string; code: number };
  wind_mph: number;
  wind_kph: number;
  wind_degree: number;
  wind_dir: string;
  humidity: number;
  pressure_mb: number;
  pressure_in: number;
  vis_km: number;
  vis_miles: number;
  uv: number;
  gust_mph: number;
  gust_kph: number;
  precip_in: number;
  precip_mm: number;
  cloud: number;
  is_day: number;
  last_updated: string;
  last_updated_epoch: number;
  windchill_f?: number;
  windchill_c?: number;
  heatindex_f?: number;
  heatindex_c?: number;
  dewpoint_f?: number;
  dewpoint_c?: number;
}

// School status interface
interface SchoolStatus {
  isOpen?: boolean;
  status: string;
  lastUpdated: string;
  message: string;
  announcement?: string;
}


export default function MobilePage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(30);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [lastKnownStatus, setLastKnownStatus] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo());
  const [showAutoRefresh, setShowAutoRefresh] = useState(!isMobileDevice());

  const currentDate = formatDate();
  const [WeatherIcon, setWeatherIcon] = useState<WeatherIconComponent>(() => Sun);
  
  // Update weather icon when weather data changes
  useEffect(() => {
    if (weatherData && weatherData.condition?.text) {
      setWeatherIcon(getWeatherIcon(weatherData.condition.text));
    } else {
      setWeatherIcon(Sun);
    }
  }, [weatherData]);


  // Send desktop notification for status changes
  const sendDesktopNotification = useCallback(async (message: string) => {
    if (!notificationEnabled || !areNotificationsSupported() || isServerSide()) return;
    
    try {
      const weatherDataRecord = toWeatherDataRecord(weatherData);
      const success = await sendFCSNotification(message, weatherDataRecord);
      if (success) {
        console.log('✅ Desktop notification sent successfully');
      } else {
        console.log('❌ Desktop notification failed');
      }
    } catch (error) {
      console.error('Error sending desktop notification:', error);
    }
  }, [notificationEnabled, weatherData]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch weather data
      try {
        const weatherResponse = await fetch('/api/weather');
        if (weatherResponse.ok) {
          const weatherJson = await weatherResponse.json();
          setWeatherData(weatherJson.current);
        } else {
          console.error('Weather API failed:', weatherResponse.status);
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }

      // Fetch school status
      const schoolResponse = await fetch('/api/status');
      if (schoolResponse.ok) {
        const schoolJson = await schoolResponse.json();
        setSchoolStatus(schoolJson);
        
        // Check for status changes and send alerts if needed
        const currentStatus = schoolJson.message || '';
        setLastKnownStatus(prevStatus => {
          // Only send alerts if status actually changed and it's an active alert
          if (schoolJson.isOpen === false && currentStatus !== prevStatus) {
            // Send desktop notification
            sendDesktopNotification(currentStatus);
          }
          return currentStatus;
        });
      }

      
      setLastRefresh(new Date());
      setCountdown(30);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [sendDesktopNotification]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update device info on mount and handle resize
  useEffect(() => {
    if (!isServerSide()) {
      setDeviceInfo(getDeviceInfo());
      setShowAutoRefresh(!isMobileDevice());
      
      // Update device info on resize
      const handleResize = () => {
        setDeviceInfo(getDeviceInfo());
        setShowAutoRefresh(!isMobileDevice());
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Request notification permission on mount (client-side only)
  useEffect(() => {
    if (!isServerSide() && areNotificationsSupported()) {
      requestNotificationPermission();
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData(); // Refresh when countdown reaches 0
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchData]);

  const deviceStyles = useMemo(() => getDeviceStyles(), [deviceInfo]);
  const isMobile = deviceInfo.isMobile || (typeof window !== 'undefined' && window.innerWidth < 768);
  const isTablet = deviceInfo.isTablet || (typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024);

  
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Deep charcoal background with subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
      
      {/* Digital grid pattern - responsive */}
      <div className={`fixed inset-0 bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:${isMobile ? '1rem' : '2rem'}_${isMobile ? '1rem' : '2rem'}] opacity-10`} />
      
      {/* Vibrant neon accent overlays - responsive sizes */}
      <div className={`fixed top-0 left-1/4 ${isMobile ? 'w-32 h-32' : 'w-64 h-64'} bg-green-500/10 rounded-full blur-2xl animate-pulse`} />
      <div className={`absolute bottom-0 right-1/4 ${isMobile ? 'w-32 h-32' : 'w-64 h-64'} bg-cyan-500/10 rounded-full blur-2xl animate-pulse`} style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10">
        {/* Responsive Header */}
        <header className={`text-center ${isMobile ? 'py-1' : 'py-2'} ${isMobile ? 'px-2 py-1' : 'px-3 py-2'}`}>
          {/* Logo */}
          <div className="flex justify-center mb-1">
            <img 
              src="/logo.webp" 
              alt="Forsyth County Schools Logo" 
              className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`}
            />
          </div>
          
          <div className="flex items-center justify-center gap-1 mb-1">
            <Smartphone className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} text-cyan-400`} />
            <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-cyan-400 font-medium`}>
              {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'} View
            </span>
          </div>
          
          <h1 className={`${isMobile ? 'text-sm' : 'text-base'} font-black mb-1 tracking-tight`}>
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              FORSYTH
            </span>
          </h1>
          <h2 className={`${isMobile ? 'text-xs' : 'text-sm'} font-black mb-1 tracking-tight text-cyan-400`}>
            COUNTY SCHOOLS
          </h2>
          
          <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400 mb-1 uppercase tracking-wider`}>
            Real-time Status
          </div>
          
          <div className={`flex items-center justify-center ${isMobile ? 'gap-1' : 'gap-1'} text-cyan-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            <Clock className={isMobile ? 'w-2 h-2' : 'w-3 h-3'} />
            <span>{currentDate}</span>
            <MapPin className={isMobile ? 'w-2 h-2' : 'w-3 h-3'} />
            <span>Forsyth County, GA</span>
          </div>
        </header>

        {/* Main Content */}
        <main className={isMobile ? "px-2 py-1 pb-2" : "px-3 py-2 pb-3"}>
          <div className="grid grid-cols-1 gap-2">
            {/* Status Card */}
            <div className="h-full">
              <div className="relative group h-full">
                {/* Glowing border effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-blue-500/20 rounded-2xl blur-lg group-hover:from-green-500/30 group-hover:via-cyan-500/30 group-hover:to-blue-500/30 transition-all duration-500" />
                
                <div className={`relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl ${isMobile ? 'p-2' : 'p-3'} shadow-2xl h-full ${schoolStatus?.isOpen === false ? 'bg-[linear-gradient(45deg,_rgba(239,68,68,0.1)_25%,_transparent_25%),_linear-gradient(-45deg,_rgba(239,68,68,0.1)_25%,_transparent_25%),_linear-gradient(45deg,_transparent_75%,_rgba(239,68,68,0.1)_75%),_linear-gradient(-45deg,_transparent_75%,_rgba(239,68,68,0.1)_75%)] bg-[length:16px_16px]' : ''}`}>
                {/* Inner glow */}
                {schoolStatus?.isOpen === false ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-rose-500/5 rounded-xl" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-cyan-500/5 rounded-xl" />
                )}
                
                <div className="relative h-full flex flex-col justify-between">
                  {/* Glowing checkmark */}
                  <div className="flex items-center justify-center mb-2">
                    <div className="relative">
                      {schoolStatus?.isOpen === false ? (
                        <>
                          <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse" />
                          <XCircle className={`relative ${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-red-400 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]`} />
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl animate-pulse" />
                          <CheckCircle className={`relative ${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-green-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]`} />
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Bold status text */}
                  <h2 className={`${isMobile ? 'text-sm' : 'text-base'} font-black mb-1 tracking-tight text-center`}>
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
                  
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-300 mb-2 font-light text-center`}>
                    {schoolStatus?.message || 'All operations proceeding normally'}
                  </p>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button 
                      onClick={fetchData}
                      disabled={loading}
                      className={`flex-1 ${isMobile ? 'px-2 py-1' : 'px-3 py-2'} bg-gradient-to-r from-green-500 via-cyan-500 to-blue-500 hover:from-green-400 hover:via-cyan-400 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-700 text-white font-black ${isMobile ? 'text-xs' : 'text-xs'} rounded-lg shadow-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all duration-500 flex items-center justify-center gap-1 tracking-wide uppercase`}
                    >
                      <Clock className={isMobile ? 'w-2 h-2' : 'w-3 h-3'} />
                      {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                    
                    <div className="flex-1">
                      <RedirectButton 
                        url="https://www.forsyth.k12.ga.us/district-services/communications/inclement-weather-closure"
                        message="Redirecting you to the district's official weather closure page."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Card */}
            <div className="h-full">
              <div className="relative group h-full">
                {/* Glowing border */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-xl blur-lg group-hover:from-cyan-500/30 group-hover:via-blue-500/30 group-hover:to-purple-500/30 transition-all duration-500" />
                
                <div className={`relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl ${isMobile ? 'p-2' : 'p-3'} shadow-2xl h-full`}>
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-xl" />
                
                <div className="relative h-full flex flex-col">
                  <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold mb-2 text-white flex items-center ${isMobile ? 'gap-1' : 'gap-2'} tracking-wide`}>
                    <WeatherIcon className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]`} />
                    Weather
                  </h3>
                  
                  {weatherData ? (
                    <div className={`${isMobile ? 'gap-2' : 'gap-4'} flex-1 flex flex-col`}>
                      {/* Weather icon and temperature */}
                      <div className="text-center">
                        <div className="relative inline-block mb-1">
                          <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
                          <WeatherIcon className={`relative ${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-cyan-400`} />
                        </div>
                        <p className={`${isMobile ? 'text-sm' : 'text-base'} font-black mb-1 tracking-tight`}>
                          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            {weatherData.temp_f}°F
                          </span>
                        </p>
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-300 font-light mb-1`}>
                          Feels like {weatherData.feelslike_f}°F
                        </p>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-300 font-light`}>
                          {weatherData.condition?.text || 'Unknown'}
                        </p>
                      </div>
                      
                      {/* Enhanced weather details grid */}
                      <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <Wind className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Wind</p>
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-white`}>{weatherData.wind_mph} mph {weatherData.wind_dir}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Droplets className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Humidity</p>
                            <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.humidity}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Visibility</p>
                            <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.vis_miles} mi</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Gauge className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Pressure</p>
                            <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.pressure_in} in</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">UV Index</p>
                            <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.uv}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cloud className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Cloud Cover</p>
                            <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.cloud}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CloudSnow className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Precipitation</p>
                            <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.precip_in}"</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Thermometer className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Wind Gust</p>
                            <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.gust_mph} mph</p>
                          </div>
                        </div>
                        {weatherData.windchill_f && (
                          <div className="flex items-center gap-2">
                            <Thermometer className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-blue-400`} />
                            <div>
                              <p className="text-xs text-gray-400 uppercase">Wind Chill</p>
                              <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.windchill_f}°F</p>
                            </div>
                          </div>
                        )}
                        {weatherData.heatindex_f && weatherData.heatindex_f > weatherData.temp_f && (
                          <div className="flex items-center gap-2">
                            <Thermometer className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-orange-400`} />
                            <div>
                              <p className="text-xs text-gray-400 uppercase">Heat Index</p>
                              <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.heatindex_f}°F</p>
                            </div>
                          </div>
                        )}
                        {weatherData.dewpoint_f && (
                          <div className="flex items-center gap-2">
                            <Droplets className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-300`} />
                            <div>
                              <p className="text-xs text-gray-400 uppercase">Dew Point</p>
                              <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.dewpoint_f}°F</p>
                            </div>
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 flex-1 flex items-center justify-center">
                      <Cloud className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-gray-400 mx-auto mb-2`} />
                      <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-400`}>Weather data unavailable</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
          </div>

          {/* Auto-refresh Status - Only show on desktop/tablet */}
          {showAutoRefresh && (
            <div className="fixed bottom-2 left-2 right-2">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-2 py-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-300">Auto-refresh active</span>
                  </div>
                  <div className="text-xs text-cyan-400 font-mono">
                    {countdown}s
                  </div>
                </div>
                
                {/* Desktop Notification Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Desktop Alerts</span>
                  <button
                    onClick={() => setNotificationEnabled(!notificationEnabled)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      notificationEnabled && areNotificationsSupported() && getNotificationPermission() === 'granted'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}
                    disabled={!areNotificationsSupported()}
                  >
                    <BellRing className="w-2 h-2" />
                    {notificationEnabled && areNotificationsSupported() && getNotificationPermission() === 'granted' ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Last refresh info */}
          <div className="text-center mt-2">
            <p className={isMobile ? "text-xs text-gray-500" : "text-xs text-gray-500"}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
