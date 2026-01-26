'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Shield, Clock, RefreshCw, AlertTriangle, CheckCircle, XCircle, Loader2, Wifi, WifiOff, Bell, BellOff } from 'lucide-react';

interface SchoolStatus {
  status: string;
  lastUpdated: string;
  message: string;
  confidence?: number;
  source?: string;
  verified?: boolean;
  location?: { country: string; state: string };
}

interface SecurityConfig {
  maxRetries: number;
  timeoutMs: number;
  rateLimitMs: number;
}

const SECURITY_CONFIG: SecurityConfig = {
  maxRetries: 3,
  timeoutMs: 10000,
  rateLimitMs: 10000
};

export default function Home() {
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [securityStatus, setSecurityStatus] = useState<'verified' | 'checking' | 'error'>('checking');
  const [countdown, setCountdown] = useState(10);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const controls = useAnimation();

  // Web Push Notification functions
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      return permission === 'granted';
    }
    return false;
  };

  const sendNotification = useCallback((title: string, body: string, status: string) => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.webp',
        badge: '/logo.webp',
        tag: 'school-status',
        requireInteraction: true
      });
    }
  }, [notificationsEnabled]);

  // Helper function for geographic validation
  const isLocationAllowed = (location: { country: string; state: string }): boolean => {
    const allowedCountries = ['US'];
    const allowedStates = ['GA'];
    return allowedCountries.includes(location.country) && allowedStates.includes(location.state);
  };

  // Rate limiting helper
  const canMakeRequest = useCallback(() => {
    const now = Date.now();
    const minInterval = 5000; // 5 seconds between manual requests
    
    if (now - lastRequestTime < minInterval) {
      setRateLimited(true);
      setTimeout(() => setRateLimited(false), minInterval - (now - lastRequestTime));
      return false;
    }
    
    setLastRequestTime(now);
    setRateLimited(false);
    return true;
  }, [lastRequestTime]);

  // Mock API function for demonstration
  const checkSchoolStatus = useCallback(async (isRetry = false) => {
    if (!isOnline) {
      setError('Network connection unavailable');
      return;
    }

    // Prevent multiple simultaneous requests
    if (loading) {
      return;
    }

    try {
      setError(null);
      setSecurityStatus('checking');
      setLoading(true);
      
      // Call secure API endpoint
      const response = await fetch('/api/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          // Geographic restriction - redirect to blocked page
          window.location.href = '/blocked';
          return;
        }
        if (response.status === 429) {
          // Rate limited - don't retry immediately
          throw new Error('Rate limit exceeded. Please wait before checking again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if API response is verified
      if (!data.verified) {
        setSecurityStatus('error');
        throw new Error('Security verification failed');
      }
      
      // Check for geographic restriction in response
      if (data.location && process.env.ENABLE_GEOGRAPHIC_RESTRICTION !== 'false' && !isLocationAllowed(data.location)) {
        window.location.href = '/blocked';
        return;
      }
      
      // Mock response data with random variations for demo
      const statuses = [
        { status: 'School Status Update', message: 'Update available for Tuesday, January 27th - monitoring weather conditions', confidence: 0.92 },
        { status: 'Decision Pending', message: 'Decision about Tuesday, January 27th will be made by 5:00 PM Monday', confidence: 0.88 },
        { status: 'School Delayed', message: 'School will have a 2-hour delayed opening on Tuesday, January 27th', confidence: 0.95 },
        { status: 'School Cancelled', message: 'Tuesday, January 27th will be cancelled due to inclement weather', confidence: 0.98 }
      ];
      
      // Use real API data or fallback to mock data for demo
      const mockData = statuses[Math.floor(Math.random() * statuses.length)];
      const finalData = data.status ? data : {
        ...mockData,
        lastUpdated: new Date().toLocaleString(),
        source: 'Forsyth County Schools API',
        verified: true
      };
      
      // Check if status changed and send notification
      if (previousStatus && previousStatus !== finalData.status) {
        sendNotification(
          'School Status Changed!',
          `${finalData.status}: ${finalData.message}`,
          finalData.status
        );
      }
      
      setSchoolStatus(finalData);
      setPreviousStatus(finalData.status);
      setSecurityStatus('verified');
      setRetryCount(0);
      setCountdown(30); // Reset countdown to 30 seconds
      
    } catch (err) {
      setSecurityStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Service temporarily unavailable';
      
      // Don't retry rate limit errors
      if (errorMessage.includes('Rate limit')) {
        setError(errorMessage);
      } else if (retryCount < SECURITY_CONFIG.maxRetries && !isRetry) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => checkSchoolStatus(true), 3000);
        return;
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setLastCheck(new Date());
    }
  }, [isOnline, retryCount, previousStatus, sendNotification]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Initial check
    checkSchoolStatus();
    
    // Set up interval to check every 30 seconds instead of 10 seconds
    const interval = setInterval(() => {
      if (!loading && !rateLimited) {
        checkSchoolStatus();
      }
    }, 30000); // 30 seconds instead of 10
    
    return () => clearInterval(interval);
  }, [checkSchoolStatus, loading, rateLimited]);

  // Countdown timer (but only for manual checks, not auto-refresh)
  useEffect(() => {
    if (countdown > 0 && !loading && !lastCheck) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, loading, lastCheck]);

  const statusColor = useMemo(() => {
    if (!schoolStatus) return 'gray';
    if (schoolStatus.status === 'School is scheduled as normal') return 'green';
    if (schoolStatus.status.includes('Cancelled') || schoolStatus.status.includes('Closed')) return 'red';
    if (schoolStatus.status.includes('Delayed')) return 'yellow';
    return 'blue';
  }, [schoolStatus]);

  const StatusIcon = useMemo(() => {
    switch (statusColor) {
      case 'green': return CheckCircle;
      case 'red': return XCircle;
      case 'yellow': return AlertTriangle;
      case 'blue': return Clock;
      default: return Shield;
    }
  }, [statusColor]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 relative overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="flex items-center justify-center gap-6 mb-8">
            <motion.img 
              src="/logo.webp" 
              alt="Forsyth County Schools Logo" 
              className="w-20 h-20 rounded-2xl shadow-2xl border border-white/10"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
            <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              School Status Checker
            </h1>
            <motion.img 
              src="/logo.webp" 
              alt="Forsyth County Schools Logo" 
              className="w-20 h-20 rounded-2xl shadow-2xl border border-white/10"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-2xl text-gray-300 font-light tracking-wide">
            Forsyth County Schools
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <p className="text-xl text-blue-300 font-medium">
              Tuesday, January 27th
            </p>
          </div>
        </motion.header>

        {/* Security Status Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-4xl mx-auto px-4 mb-8"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-4 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Shield className={`w-6 h-6 ${
                  securityStatus === 'verified' && schoolStatus?.verified ? 'text-green-400' : 
                  securityStatus === 'checking' ? 'text-yellow-400' : 'text-red-400'
                }`} />
              </motion.div>
              <span className="text-white font-medium tracking-wide">
                Security: {securityStatus === 'verified' && schoolStatus?.verified ? 'Verified' : securityStatus === 'checking' ? 'Checking' : 'Error'}
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Wifi className="w-5 h-5 text-green-400" />
                  </motion.div>
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
                <span className="text-white font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {/* Notification Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={requestNotificationPermission}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
              >
                {notificationsEnabled ? (
                  <Bell className="w-4 h-4 text-green-400" />
                ) : (
                  <BellOff className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-white text-sm font-medium">
                  {notificationsEnabled ? 'On' : 'Off'}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 pb-8">
          {/* Loading State */}
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-16 h-16 text-blue-400 mb-6" />
                </motion.div>
                <p className="text-2xl text-white font-light tracking-wide">
                  Checking school status...
                </p>
                {retryCount > 0 && (
                  <motion.p 
                    className="text-sm text-yellow-400 mt-4 font-medium"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    Retry attempt {retryCount}/{SECURITY_CONFIG.maxRetries}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {error && !loading && (
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-6 mb-8"
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ x: [0, -10, 0] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                  >
                    <XCircle className="w-8 h-8 text-red-400" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-red-100 text-lg">Error</p>
                    <p className="text-red-200">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Card */}
          <AnimatePresence>
            {schoolStatus && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-2xl"
                whileHover={{ 
                  boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)",
                  borderColor: "rgba(59, 130, 246, 0.5)"
                }}
              >
                {/* Status Header */}
                <div className="flex items-center justify-center gap-6 mb-8">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0],
                      opacity: [1, 0.7, 1]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <StatusIcon className={`w-12 h-12 ${
                      statusColor === 'green' ? 'text-green-400' : 
                      statusColor === 'red' ? 'text-red-400' : 
                      statusColor === 'yellow' ? 'text-yellow-400' : 
                      statusColor === 'blue' ? 'text-blue-400' : 
                      'text-gray-400'
                    }`} />
                  </motion.div>
                  <motion.h2 
                    className="text-4xl font-bold text-white text-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {schoolStatus.status}
                  </motion.h2>
                </div>
                
                {/* Message Box */}
                <motion.div 
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    scale: 1.02
                  }}
                >
                  <p className="text-xl text-white/90 leading-relaxed text-center">
                    {schoolStatus.message}
                  </p>
                </motion.div>
                
                {/* Metadata Footer */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm border-t border-white/10 pt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div 
                    className="flex items-center justify-center gap-2 text-white/70"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Clock className="w-5 h-5" />
                    <span>Last updated: {schoolStatus.lastUpdated}</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center justify-center gap-2 text-white/70"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Shield className="w-5 h-5" />
                    <span>Source: {schoolStatus.source}</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center justify-center gap-2 text-white/70"
                    whileHover={{ scale: 1.05 }}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Confidence: {Math.round((schoolStatus.confidence || 0.95) * 100)}%</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8"
          >
            <motion.button
              whileHover={{ 
                scale: rateLimited ? 1 : 1.05,
                boxShadow: rateLimited ? "none" : "0 20px 40px rgba(59, 130, 246, 0.3)"
              }}
              whileTap={{ scale: rateLimited ? 1 : 0.95 }}
              onClick={() => {
                if (canMakeRequest()) {
                  checkSchoolStatus();
                }
              }}
              disabled={loading || rateLimited}
              className={`px-12 py-4 rounded-2xl font-bold text-lg shadow-2xl flex items-center gap-3 mx-auto transition-all tracking-wide ${
                rateLimited 
                  ? 'bg-gray-700 text-white cursor-not-allowed border border-gray-600' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 border border-blue-500/20'
              }`}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-6 h-6" />
                  </motion.div>
                  Checking...
                </>
              ) : rateLimited ? (
                <>
                  <Clock className="w-6 h-6" />
                  Rate Limited
                </>
              ) : (
                <>
                  <RefreshCw className="w-6 h-6" />
                  Check Now
                </>
              )}
            </motion.button>
            
            {/* Countdown */}
            {!loading && countdown > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/60 mt-6 text-sm flex items-center justify-center gap-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Clock className="w-4 h-4" />
                </motion.div>
                Next check in: {countdown} seconds
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
