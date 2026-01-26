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
  const [loading, setLoading] = useState(false);
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

  // Rate limiting helper
  const canMakeRequest = useCallback(() => {
    const now = Date.now();
    const minInterval = 2000; // 2 seconds between manual requests (reduced from 5)
    
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
      const response = await fetch('/api/school-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - don't retry immediately
          throw new Error('Rate limit exceeded. Please wait before checking again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate that the API response has the required structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid API response format');
      }
      
      // Use the real API data with fallback defaults for safety
      const finalData: SchoolStatus = {
        status: data.status || 'Unknown Status',
        message: data.message || 'Unable to retrieve status information',
        lastUpdated: data.lastUpdated || new Date().toLocaleString(),
        confidence: data.confidence || 0.5,
        source: data.source || 'Forsyth County Schools API',
        verified: data.verified !== false, // Default to true unless explicitly false
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
      setSecurityStatus(finalData.verified ? 'verified' : 'checking');
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
    
    // Set up interval to check every 30 seconds
    const interval = setInterval(() => {
      checkSchoolStatus();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run once on mount

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-8 md:py-12"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-6 px-4">
            <motion.img 
              src="/logo.webp" 
              alt="Forsyth County Schools Logo" 
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-2xl border border-white/10 bg-white/5"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ duration: 0.3 }}
            />
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 drop-shadow-lg">
              School Status Checker
            </h1>
            <motion.img 
              src="/logo.webp" 
              alt="Forsyth County Schools Logo" 
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-2xl border border-white/10 bg-white/5 hidden md:block"
              whileHover={{ scale: 1.05, rotate: -5 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 font-light tracking-wide mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Forsyth County Schools
          </motion.p>
          <motion.div 
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Clock className="w-5 h-5 text-cyan-400" />
            <p className="text-lg md:text-xl text-cyan-300 font-medium">
              Tuesday, January 27th
            </p>
          </motion.div>
        </motion.header>

        {/* Security Status Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-5xl mx-auto px-4 mb-6"
        >
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl px-6 md:px-8 py-4 md:py-5 flex flex-col md:flex-row items-center justify-between shadow-2xl gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ 
                  rotate: securityStatus === 'checking' ? 360 : 0,
                  scale: securityStatus === 'verified' ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
              >
                <Shield className={`w-6 h-6 ${
                  securityStatus === 'verified' && schoolStatus?.verified ? 'text-emerald-400' : 
                  securityStatus === 'checking' ? 'text-amber-400' : 'text-red-400'
                }`} />
              </motion.div>
              <span className="text-white font-semibold tracking-wide text-sm md:text-base">
                Security: {securityStatus === 'verified' && schoolStatus?.verified ? '✓ Verified' : securityStatus === 'checking' ? 'Checking...' : '⚠ Error'}
              </span>
            </div>
            
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Wifi className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
                <span className="text-white font-medium text-sm md:text-base">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {/* Notification Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={requestNotificationPermission}
                className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/20 backdrop-blur-sm"
              >
                {notificationsEnabled ? (
                  <Bell className="w-4 h-4 text-emerald-400" />
                ) : (
                  <BellOff className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-white text-xs md:text-sm font-medium">
                  {notificationsEnabled ? 'On' : 'Off'}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 pb-8">
          {/* Loading State */}
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-16 md:py-20"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="mb-6"
                >
                  <Loader2 className="w-16 h-16 md:w-20 md:h-20 text-cyan-400" />
                </motion.div>
                <p className="text-xl md:text-2xl text-white font-light tracking-wide">
                  Checking school status...
                </p>
                {retryCount > 0 && (
                  <motion.p 
                    className="text-sm text-amber-400 mt-4 font-medium"
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
                className="bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-3xl p-6 mb-8 shadow-xl"
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
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/30 rounded-3xl p-6 md:p-8 shadow-2xl mb-6"
              >
                {/* Status Header */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-6 md:mb-8">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.15, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <StatusIcon className={`w-14 h-14 md:w-16 md:h-16 ${
                      statusColor === 'green' ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 
                      statusColor === 'red' ? 'text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.5)]' : 
                      statusColor === 'yellow' ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]' : 
                      statusColor === 'blue' ? 'text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]' : 
                      'text-gray-400'
                    }`} />
                  </motion.div>
                  <motion.h2 
                    className="text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {schoolStatus.status}
                  </motion.h2>
                </div>
                
                {/* Message Box */}
                <motion.div 
                  className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6 md:mb-8 border border-white/20 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ 
                    scale: 1.01,
                    borderColor: "rgba(255, 255, 255, 0.3)"
                  }}
                >
                  <p className="text-lg md:text-xl text-white/95 leading-relaxed text-center font-light">
                    {schoolStatus.message}
                  </p>
                </motion.div>
                
                {/* Metadata Footer */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm border-t border-white/20 pt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div 
                    className="flex items-center justify-center gap-2 text-white/80 bg-white/5 rounded-xl p-3 border border-white/10"
                    whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span className="font-medium">Last updated: {schoolStatus.lastUpdated}</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center justify-center gap-2 text-white/80 bg-white/5 rounded-xl p-3 border border-white/10"
                    whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="font-medium">Source: {schoolStatus.source}</span>
                  </motion.div>
                  <motion.div 
                    className="flex items-center justify-center gap-2 text-white/80 bg-white/5 rounded-xl p-3 border border-white/10"
                    whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="font-medium">Confidence: {Math.round((schoolStatus.confidence || 0.95) * 100)}%</span>
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
            className="text-center mt-6"
          >
            <motion.button
              whileHover={{ 
                scale: rateLimited ? 1 : 1.05,
                boxShadow: rateLimited ? "none" : "0 20px 50px rgba(34, 211, 238, 0.4)"
              }}
              whileTap={{ scale: rateLimited ? 1 : 0.98 }}
              onClick={() => {
                if (canMakeRequest()) {
                  checkSchoolStatus();
                }
              }}
              disabled={loading || rateLimited}
              className={`px-10 md:px-14 py-4 md:py-5 rounded-2xl font-bold text-base md:text-lg shadow-2xl flex items-center gap-3 mx-auto transition-all tracking-wide ${
                rateLimited 
                  ? 'bg-gray-700/50 text-white/60 cursor-not-allowed border border-gray-600/50 backdrop-blur-sm' 
                  : 'bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 border border-cyan-500/30 backdrop-blur-sm'
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
                  <span>Checking...</span>
                </>
              ) : rateLimited ? (
                <>
                  <Clock className="w-6 h-6" />
                  <span>Rate Limited</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-6 h-6" />
                  <span>Check Now</span>
                </>
              )}
            </motion.button>
            
            {/* Countdown */}
            {!loading && countdown > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/70 mt-6 text-sm md:text-base flex items-center justify-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 mx-auto w-fit border border-white/10"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Clock className="w-4 h-4 text-cyan-400" />
                </motion.div>
                <span className="font-medium">Next check in: <span className="text-cyan-300 font-bold">{countdown} seconds</span></span>
              </motion.div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
