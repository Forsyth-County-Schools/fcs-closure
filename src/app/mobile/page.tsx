'use client';

import { CheckCircle, Sun, Cloud, CloudRain, Wind, Droplets, Clock, MapPin, Smartphone, Bell, BellOff, Mail, BellRing, MessageCircle, Heart, Share2, ExternalLink, Eye, Gauge, Thermometer, CloudSnow, Zap } from 'lucide-react';
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
  status: string;
  lastUpdated: string;
  message: string;
}

// Facebook post interface
interface FacebookPost {
  id: string;
  message: string;
  created_time: string;
  full_picture: string;
  permalink_url: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
}


export default function MobilePage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus | null>(null);
  const [facebookPosts, setFacebookPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(30);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
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

  // Send SMS notification for status changes
  const sendSMSAlert = useCallback(async (message: string) => {
    if (!smsEnabled) return;
    
    try {
      const response = await fetch('/api/sms-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (response.ok) {
        console.log('✅ SMS alert sent successfully via Twilio');
      } else {
        console.log('❌ SMS alert failed');
      }
    } catch (error) {
      console.error('Error sending SMS alert:', error);
    }
  }, [smsEnabled]);

  // Send email notification for status changes
  const sendEmailAlert = useCallback(async (message: string) => {
    if (!emailEnabled) return;
    
    try {
      const weatherDataRecord = toWeatherDataRecord(weatherData);
      const response = await fetch('/api/email-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, weatherData: weatherDataRecord }),
      });
      
      if (response.ok) {
        console.log('✅ Email alert sent successfully via Mailjet');
      } else {
        console.log('❌ Email alert failed');
      }
    } catch (error) {
      console.error('Error sending email alert:', error);
    }
  }, [emailEnabled, weatherData]);

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
      const weatherResponse = await fetch(`https://api.weatherapi.com/v1/current.json?key=b15c56de27784749aac160754263101&q=30041&aqi=no`);
      if (weatherResponse.ok) {
        const weatherJson = await weatherResponse.json();
        setWeatherData(weatherJson.current);
      }

      // Fetch school status
      const schoolResponse = await fetch('/api/status');
      if (schoolResponse.ok) {
        const schoolJson = await schoolResponse.json();
        setSchoolStatus(schoolJson);
        
        // Check for status changes and send alerts if needed
        const currentStatus = schoolJson.message || '';
        setLastKnownStatus(prevStatus => {
          // Only send alerts if status actually changed and it's not the default message
          if (currentStatus !== prevStatus && currentStatus !== 'No changes detected for Monday, February 2nd') {
            // Send SMS, email, and desktop alerts
            sendSMSAlert(currentStatus);
            sendEmailAlert(currentStatus);
            sendDesktopNotification(currentStatus);
          }
          return currentStatus;
        });
      }

      // Fetch Facebook posts
      const facebookResponse = await fetch('/api/facebook-posts');
      if (facebookResponse.ok) {
        const facebookJson = await facebookResponse.json();
        if (facebookJson.success && facebookJson.data) {
          setFacebookPosts(facebookJson.data);
        }
      }
      
      setLastRefresh(new Date());
      setCountdown(30);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [sendSMSAlert, sendEmailAlert, sendDesktopNotification]);

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
        // Force re-render to update responsive styles
        window.dispatchEvent(new Event('resize'));
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

  // Add window resize listener for responsive updates
  useEffect(() => {
    const handleResponsiveUpdate = () => {
      // Trigger re-render when window size changes
      const newIsMobile = window.innerWidth < 768;
      const newIsTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      // Update state if responsive status changed
      if (newIsMobile !== isMobile || newIsTablet !== isTablet) {
        // This will trigger a re-render with new responsive values
        setDeviceInfo(prev => ({
          ...prev,
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight
        }));
      }
    };

    window.addEventListener('resize', handleResponsiveUpdate);
    return () => window.removeEventListener('resize', handleResponsiveUpdate);
  }, [isMobile, isTablet]);
  
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
        <header className={`text-center ${isMobile ? 'py-4' : 'py-6'} ${isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.webp" 
              alt="Forsyth County Schools Logo" 
              className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'}`}
            />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Smartphone className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-cyan-400`} />
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-cyan-400 font-medium`}>
              {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'} View
            </span>
          </div>
          
          <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-black mb-2 tracking-tight`}>
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              FORSYTH
            </span>
          </h1>
          <h2 className={`${isMobile ? 'text-base' : 'text-xl'} font-black mb-4 tracking-tight text-cyan-400`}>
            COUNTY SCHOOLS
          </h2>
          
          <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-400 mb-3 uppercase tracking-wider`}>
            Real-time Status
          </div>
          
          <div className={`flex items-center justify-center ${isMobile ? 'gap-2' : 'gap-4'} text-cyan-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <Clock className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
            <span>{currentDate}</span>
            <MapPin className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
            <span>Forsyth County, GA</span>
          </div>
        </header>

        {/* Main Content */}
        <main className={isMobile ? "px-4 py-3 pb-6" : "px-6 py-4 pb-6"}>
          <div className="grid grid-cols-1 gap-4">
            {/* Status Card */}
            <div className="h-full">
              <div className="relative group h-full">
                {/* Glowing border effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-blue-500/20 rounded-2xl blur-lg group-hover:from-green-500/30 group-hover:via-cyan-500/30 group-hover:to-blue-500/30 transition-all duration-500" />
                
                <div className={`relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl ${isMobile ? 'p-4' : 'p-6'} shadow-2xl h-full`}>
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-cyan-500/5 rounded-2xl" />
                
                <div className="relative h-full flex flex-col justify-between">
                  {/* Glowing checkmark */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl animate-pulse" />
                      <CheckCircle className={`relative ${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-green-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]`} />
                    </div>
                  </div>
                  
                  {/* Bold status text */}
                  <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-black mb-3 tracking-tight text-center`}>
                    <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      SCHOOL IS ON SCHEDULE
                    </span>
                  </h2>
                  
                  <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-300 mb-4 font-light text-center`}>
                    {schoolStatus?.message || 'All operations proceeding normally'}
                  </p>
                  
                  {/* Refresh button */}
                  <button 
                    onClick={fetchData}
                    disabled={loading}
                    className={`w-full ${isMobile ? 'px-4 py-2' : 'px-6 py-3'} bg-gradient-to-r from-green-500 via-cyan-500 to-blue-500 hover:from-green-400 hover:via-cyan-400 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-700 text-white font-black ${isMobile ? 'text-xs' : 'text-sm'} rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all duration-500 flex items-center justify-center gap-2 tracking-wide uppercase`}
                  >
                    <Clock className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                    {loading ? 'Refreshing...' : 'Refresh Now'}
                  </button>
                </div>
              </div>
            </div>

            {/* Weather Card */}
            <div className="h-full">
              <div className="relative group h-full">
                {/* Glowing border */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-lg group-hover:from-cyan-500/30 group-hover:via-blue-500/30 group-hover:to-purple-500/30 transition-all duration-500" />
                
                <div className={`relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl ${isMobile ? 'p-4' : 'p-6'} shadow-2xl h-full`}>
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-2xl" />
                
                <div className="relative h-full flex flex-col">
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold mb-4 text-white flex items-center ${isMobile ? 'gap-2' : 'gap-4'} tracking-wide`}>
                    <WeatherIcon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]`} />
                    Weather
                  </h3>
                  
                  {weatherData ? (
                    <div className={`${isMobile ? 'gap-3' : 'gap-6'} flex-1 flex flex-col justify-between`}>
                      {/* Weather icon and temperature */}
                      <div className="text-center">
                        <div className="relative inline-block mb-2">
                          <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
                          <WeatherIcon className={`relative ${isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-cyan-400`} />
                        </div>
                        <p className={`${isMobile ? 'text-xl' : 'text-3xl'} font-black mb-1 tracking-tight`}>
                          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            {weatherData.temp_f}°F
                          </span>
                        </p>
                        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-300 font-light mb-1`}>
                          Feels like {weatherData.feelslike_f}°F
                        </p>
                        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-300 font-light`}>
                          {weatherData.condition?.text || 'Unknown'}
                        </p>
                      </div>
                      
                      {/* Enhanced weather details grid */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <Wind className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Wind</p>
                            <p className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.wind_mph} mph {weatherData.wind_dir}</p>
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
                  ) : (
                    <div className="text-center py-6 flex-1 flex items-center justify-center">
                      <Cloud className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-gray-400 mx-auto mb-2`} />
                      <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-400`}>Weather data unavailable</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Facebook Posts Card */}
            <div className="h-full">
              <div className="relative group h-full">
                {/* Glowing border */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-lg group-hover:from-blue-500/30 group-hover:via-purple-500/30 group-hover:to-pink-500/30 transition-all duration-500" />
                
                <div className={`relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl ${isMobile ? 'p-4' : 'p-6'} shadow-2xl h-full`}>
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl" />
                  
                  <div className="relative h-full flex flex-col">
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold mb-4 text-white flex items-center ${isMobile ? 'gap-2' : 'gap-4'} tracking-wide`}>
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                        <div className={`relative ${isMobile ? 'w-4 h-4' : 'w-5 h-5'} bg-blue-600 rounded-full flex items-center justify-center`}>
                          <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-white`}>f</span>
                        </div>
                      </div>
                      Facebook Updates
                    </h3>
                    
                    {facebookPosts.length > 0 ? (
                      <div className="space-y-4 flex-1 overflow-y-auto">
                        {facebookPosts.map((post) => (
                          <div key={post.id} className="bg-white/5 rounded-xl p-3 border border-white/10 hover:bg-white/10 transition-all duration-300">
                            {/* Post image */}
                            {post.full_picture && (
                              <div className="mb-3 rounded-lg overflow-hidden">
                                <img 
                                  src={post.full_picture} 
                                  alt="Facebook post" 
                                  className="w-full h-32 object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            {/* Post message */}
                            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-200 mb-3 line-clamp-3`}>
                              {post.message}
                            </p>
                            
                            {/* Post engagement */}
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  <span>{post.likes_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3" />
                                  <span>{post.comments_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Share2 className="w-3 h-3" />
                                  <span>{post.shares_count}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* View on Facebook link */}
                            <a 
                              href={post.permalink_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View on Facebook
                            </a>
                            
                            {/* Post time */}
                            <div className="mt-2 text-xs text-gray-500">
                              {new Date(post.created_time).toLocaleDateString()} at {new Date(post.created_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 flex-1 flex items-center justify-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl" />
                          <div className={`relative ${isMobile ? 'w-8 h-8' : 'w-12 h-12'} bg-blue-600 rounded-full flex items-center justify-center`}>
                            <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-white`}>f</span>
                          </div>
                        </div>
                        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-400 mt-2`}>Loading Facebook posts...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Auto-refresh Status - Only show on desktop/tablet */}
          {showAutoRefresh && (
            <div className="fixed bottom-4 left-4 right-4">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-300">Auto-refresh active</span>
                  </div>
                  <div className="text-xs text-cyan-400 font-mono">
                    {countdown}s
                  </div>
                </div>
                
                {/* SMS Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">SMS Alerts</span>
                  <button
                    onClick={() => setSmsEnabled(!smsEnabled)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      smsEnabled 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}
                  >
                    {smsEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                    {smsEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                
                {/* Email Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Email Alerts</span>
                  <button
                    onClick={() => setEmailEnabled(!emailEnabled)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      emailEnabled 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    {emailEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                
                {/* Desktop Notification Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Desktop Alerts</span>
                  <button
                    onClick={() => setNotificationEnabled(!notificationEnabled)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      notificationEnabled && areNotificationsSupported() && getNotificationPermission() === 'granted'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}
                    disabled={!areNotificationsSupported()}
                  >
                    <BellRing className="w-3 h-3" />
                    {notificationEnabled && areNotificationsSupported() && getNotificationPermission() === 'granted' ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Last refresh info */}
          <div className="text-center mt-4">
            <p className={isMobile ? "text-sm text-gray-500" : "text-base text-gray-500"}>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
