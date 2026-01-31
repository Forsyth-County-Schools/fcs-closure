import { CheckCircle, Sun, Cloud, CloudRain, Wind, Droplets, Clock, MapPin, Smartphone, Bell, BellOff, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower') || lowerCondition.includes('drizzle')) return CloudRain;
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast') || lowerCondition.includes('mist') || lowerCondition.includes('fog')) return Cloud;
  return Sun; // default
}

export default function MobilePage() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(30);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [lastKnownStatus, setLastKnownStatus] = useState<string>('');

  const currentDate = formatDate();
  const WeatherIcon = weatherData ? getWeatherIcon(weatherData.condition?.text || '') : Sun;

  // Send SMS notification for status changes
  const sendSMSAlert = async (message: string) => {
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
  };

  // Send email notification for status changes
  const sendEmailAlert = async (message: string) => {
    if (!emailEnabled) return;
    
    try {
      const response = await fetch('/api/email-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, weatherData }),
      });
      
      if (response.ok) {
        console.log('✅ Email alert sent successfully via SendGrid');
      } else {
        console.log('❌ Email alert failed');
      }
    } catch (error) {
      console.error('Error sending email alert:', error);
    }
  };

  // Fetch data function
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch weather data
      const weatherResponse = await fetch(`https://api.weatherapi.com/v1/current.json?key=b15c56de27784749aac160754263101&q=30041&aqi=no`);
      if (weatherResponse.ok) {
        const weatherJson = await weatherResponse.json();
        setWeatherData(weatherJson.current);
      }

      // Fetch school status
      const schoolResponse = await fetch('http://localhost:3000/api/school-status');
      if (schoolResponse.ok) {
        const schoolJson = await schoolResponse.json();
        setSchoolStatus(schoolJson);
        
        // Check for status changes and send alerts if needed
        const currentStatus = schoolJson.message || '';
        if (currentStatus !== lastKnownStatus && currentStatus !== 'No changes detected for Monday, February 2nd') {
          // Send both SMS and email alerts
          sendSMSAlert(currentStatus);
          sendEmailAlert(currentStatus);
          setLastKnownStatus(currentStatus);
        }
      }
      
      setLastRefresh(new Date());
      setCountdown(30);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Deep charcoal background with subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
      
      {/* Digital grid pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-10" />
      
      {/* Vibrant neon accent overlays */}
      <div className="fixed inset-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10">
        {/* Mobile Header */}
        <header className="text-center py-6 px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-cyan-400 font-medium">Mobile View</span>
          </div>
          
          <h1 className="text-3xl font-black mb-2 tracking-tight">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              FORSYTH
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              SCHOOLS
            </span>
          </h1>
          
          <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
            Real-time Status
          </div>
          
          <div className="flex items-center justify-center gap-3 text-cyan-400 text-xs">
            <Clock className="w-4 h-4" />
            <span>{currentDate}</span>
            <MapPin className="w-4 h-4" />
            <span>Forsyth County, GA</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 pb-6">
          {/* Status Card */}
          <div className="mb-4">
            <div className="relative group">
              {/* Glowing border effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-blue-500/20 rounded-2xl blur-lg group-hover:from-green-500/30 group-hover:via-cyan-500/30 group-hover:to-blue-500/30 transition-all duration-500" />
              
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-cyan-500/5 rounded-2xl" />
                
                <div className="relative">
                  {/* Glowing checkmark */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/30 rounded-full blur-xl animate-pulse" />
                      <CheckCircle className="relative w-16 h-16 text-green-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)]" />
                    </div>
                  </div>
                  
                  {/* Bold status text */}
                  <h2 className="text-2xl font-black mb-3 tracking-tight text-center">
                    <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      SCHOOL IS ON SCHEDULE
                    </span>
                  </h2>
                  
                  <p className="text-sm text-gray-300 mb-4 font-light text-center">
                    {schoolStatus?.message || 'All operations proceeding normally'}
                  </p>
                  
                  {/* Refresh button */}
                  <button 
                    onClick={fetchData}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 via-cyan-500 to-blue-500 hover:from-green-400 hover:via-cyan-400 hover:to-blue-400 disabled:from-gray-600 disabled:to-gray-700 text-white font-black text-sm rounded-xl shadow-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all duration-500 flex items-center justify-center gap-2 tracking-wide uppercase"
                  >
                    <Clock className="w-4 h-4" />
                    {loading ? 'Refreshing...' : 'Refresh Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Card */}
          <div className="mb-4">
            <div className="relative group">
              {/* Glowing border */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-lg group-hover:from-cyan-500/30 group-hover:via-blue-500/30 group-hover:to-purple-500/30 transition-all duration-500" />
              
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-2xl" />
                
                <div className="relative">
                  <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2 tracking-wide">
                    <WeatherIcon className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
                    Weather
                  </h3>
                  
                  {weatherData ? (
                    <div className="space-y-4">
                      {/* Weather icon and temperature */}
                      <div className="text-center">
                        <div className="relative inline-block mb-2">
                          <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl" />
                          <WeatherIcon className="relative w-12 h-12 text-cyan-400" />
                        </div>
                        <p className="text-3xl font-black mb-1 tracking-tight">
                          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            {weatherData.temp_f}°F
                          </span>
                        </p>
                        <p className="text-sm text-gray-300 font-light">
                          {weatherData.condition?.text || 'Unknown'}
                        </p>
                      </div>
                      
                      {/* Weather details */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <Wind className="w-4 h-4 text-cyan-400" />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Wind</p>
                            <p className="text-sm font-bold text-white">{weatherData.wind_mph} mph</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-cyan-400" />
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Humidity</p>
                            <p className="text-sm font-bold text-white">{weatherData.humidity}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Weather data unavailable</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Auto-refresh Status */}
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
            </div>
          </div>

          {/* Last refresh info */}
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
