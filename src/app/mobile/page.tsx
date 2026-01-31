'use client';

import { CheckCircle, Sun, Cloud, CloudRain, Wind, Droplets, Clock, MapPin, Smartphone, Bell, BellOff, Mail, BellRing } from 'lucide-react';
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
  condition: { text: string; icon: string };
  wind_mph: number;
  humidity: number;
}

// School status interface
interface SchoolStatus {
  status: string;
  lastUpdated: string;
  message: string;
}


export default function MobilePage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus | null>(null);
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
  const isMobile = deviceInfo.isMobile;
  const isTablet = deviceInfo.isTablet;
  
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Deep charcoal background with subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
      
      {/* Digital grid pattern - responsive */}
      <div className={`fixed inset-0 bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:${deviceInfo.isMobile ? '1rem' : '2rem'}_${deviceInfo.isMobile ? '1rem' : '2rem'}] opacity-10`} />
      
      {/* Vibrant neon accent overlays - responsive sizes */}
      <div className={`fixed top-0 left-1/4 ${deviceInfo.isMobile ? 'w-32 h-32' : 'w-64 h-64'} bg-green-500/10 rounded-full blur-2xl animate-pulse`} />
      <div className={`absolute bottom-0 right-1/4 ${deviceInfo.isMobile ? 'w-32 h-32' : 'w-64 h-64'} bg-cyan-500/10 rounded-full blur-2xl animate-pulse`} style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10">
        {/* Responsive Header */}
        <header className={`text-center ${deviceInfo.isMobile ? 'py-4' : 'py-6'} ${deviceInfo.isMobile ? 'px-4 py-3' : 'px-6 py-4'}`}>
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.webp" 
              alt="Forsyth County Schools Logo" 
              className={`${deviceInfo.isMobile ? 'w-16 h-16' : 'w-20 h-20'}`}
            />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Smartphone className={`${deviceInfo.isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-cyan-400`} />
            <span className={`${deviceInfo.isMobile ? 'text-xs' : 'text-sm'} text-cyan-400 font-medium`}>
              {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'} View
            </span>
          </div>
          
          <h1 className={`${deviceInfo.isMobile ? 'text-2xl' : 'text-3xl'} font-black mb-2 tracking-tight`}>
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              FORSYTH
            </span>
          </h1>
          <h2 className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'} font-black mb-4 tracking-tight text-cyan-400`}>
            COUNTY SCHOOLS
          </h2>
          
          <div className={`${deviceInfo.isMobile ? 'text-xs' : 'text-sm'} text-gray-400 mb-3 uppercase tracking-wider`}>
            Real-time Status
          </div>
          
          <div className={`flex items-center justify-center ${deviceInfo.isMobile ? 'gap-2' : 'gap-4'} text-cyan-400 ${deviceInfo.isMobile ? 'text-xs' : 'text-sm'}`}>
            <Clock className={deviceInfo.isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
            <span>{currentDate}</span>
            <MapPin className={deviceInfo.isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
            <span>Forsyth County, GA</span>
          </div>
        </header>

        {/* Main Content */}
        <main className={deviceInfo.isMobile ? "px-4 py-3 pb-6" : "px-6 py-4 pb-6"}>
          <div className="grid grid-cols-1 gap-4">
            {/* Status Card */}
            <div className="h-full">
              <div className="relative group h-full">
                {/* Glowing border effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-blue-500/20 rounded-2xl blur-lg group-hover:from-green-500/30 group-hover:via-cyan-500/30 group-hover:to-blue-500/30 transition-all duration-500" />
                
                <div className={`relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl ${deviceInfo.isMobile ? 'p-4' : 'p-6'} shadow-2xl h-full`}>
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-cyan-500/5 rounded-2xl" />
                
                <div className="relative h-full flex flex-col justify-between">
                  {/* Glowing checkmark */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl animate-pulse" />
                      <CheckCircle className={`relative ${deviceInfo.isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-green-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]`} />
                    </div>
                  </div>
                  
                  {/* Bold status text */}
                  <h2 className={`${deviceInfo.isMobile ? 'text-2xl' : 'text-3xl'} font-black mb-3 tracking-tight text-center`}>
                    <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      SCHOOL IS ON SCHEDULE
                    </span>
                  </h2>
                  
                  <p className={`${deviceInfo.isMobile ? 'text-sm' : 'text-base'} text-gray-300 mb-4 font-light text-center`}>
                    {schoolStatus?.message || 'All operations proceeding normally'}
                  </p>
                  
                  {/* Refresh button */}
                  <button 
                    onClick={fetchData}
                    disabled={loading}
                    className={`w-full ${deviceInfo.isMobile ? 'px-4 py-2' : 'px-6 py-3'} bg-gradient-to-r from-green-500 via-cyan-500 to-blue-500 hover:from-green-400 hover:via-cyan-400 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-700 text-white font-black ${deviceInfo.isMobile ? 'text-xs' : 'text-sm'} rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all duration-500 flex items-center justify-center gap-2 tracking-wide uppercase`}
                  >
                    <Clock className={deviceInfo.isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
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
                
                <div className={`relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl ${deviceInfo.isMobile ? 'p-4' : 'p-6'} shadow-2xl h-full`}>
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-2xl" />
                
                <div className="relative h-full flex flex-col">
                  <h3 className={`${deviceInfo.isMobile ? 'text-base' : 'text-lg'} font-bold mb-4 text-white flex items-center ${deviceInfo.isMobile ? 'gap-2' : 'gap-4'} tracking-wide`}>
                    <WeatherIcon className={`${deviceInfo.isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]`} />
                    Weather
                  </h3>
                  
                  {weatherData ? (
                    <div className={`${deviceInfo.isMobile ? 'gap-3' : 'gap-6'} flex-1 flex flex-col justify-center`}>
                      {/* Weather icon and temperature */}
                      <div className="text-center">
                        <div className="relative inline-block mb-2">
                          <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
                          <WeatherIcon className={`relative ${deviceInfo.isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-cyan-400`} />
                        </div>
                        <p className={`${deviceInfo.isMobile ? 'text-2xl' : 'text-3xl'} font-black mb-1 tracking-tight`}>
                          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            {weatherData.temp_f}°F
                          </span>
                        </p>
                        <p className={`${deviceInfo.isMobile ? 'text-sm' : 'text-base'} text-gray-300 font-light`}>
                          {weatherData.condition?.text || 'Unknown'}
                        </p>
                      </div>
                      
                      {/* Weather details */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <Wind className={`${deviceInfo.isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Wind</p>
                            <p className={`${deviceInfo.isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.wind_mph} mph</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Droplets className={`${deviceInfo.isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Humidity</p>
                            <p className={`${deviceInfo.isMobile ? 'text-sm' : 'text-base'} font-bold text-white`}>{weatherData.humidity}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 flex-1 flex items-center justify-center">
                      <Cloud className={`${deviceInfo.isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-gray-400 mx-auto mb-2`} />
                      <p className={`${deviceInfo.isMobile ? 'text-sm' : 'text-base'} text-gray-400`}>Weather data unavailable</p>
                    </div>
                  )}
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
