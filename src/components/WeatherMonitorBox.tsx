'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface WeatherStatus {
  status: string;
  lastUpdated: string;
  isMonitoring: boolean;
  lastCheck: string;
}

interface WeatherMonitorBoxProps {
  compact?: boolean;
  className?: string;
}

export default function WeatherMonitorBox({ compact = false, className = "" }: WeatherMonitorBoxProps) {
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>({
    status: 'Loading...',
    lastUpdated: 'Never',
    isMonitoring: false,
    lastCheck: 'Never'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const extractTimestamp = (status: string): string => {
    // Extract "As of [date] at [time]" and the first few words of the status
    const timestampMatch = status.match(/As of[^,]*,/);
    const statusStart = status.match(/Due to[^.]*/);
    
    if (timestampMatch && statusStart) {
      return `${timestampMatch[0]} ${statusStart[0]}`;
    } else if (timestampMatch) {
      return timestampMatch[0];
    }
    return 'Status not available';
  };

  const fetchWeatherStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/fcs-weather');
      const data = await response.json();
      
      if (data.success) {
        const now = new Date();
        setWeatherStatus({
          status: data.status,
          lastUpdated: now.toISOString(),
          isMonitoring: true,
          lastCheck: now.toLocaleString()
        });
      } else {
        throw new Error(data.message || 'Failed to fetch status');
      }
    } catch (error) {
      setWeatherStatus(prev => ({
        ...prev,
        status: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date().toLocaleString()
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeatherStatus();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchWeatherStatus, 10 * 1000);
    return () => clearInterval(interval);
  }, []);

  const timestamp = extractTimestamp(weatherStatus.status);

  return (
    <div className={`relative group ${className}`}>
      {/* Glowing border effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-pink-500/20 to-orange-500/20 rounded-3xl blur-xl group-hover:from-red-500/30 group-hover:via-pink-500/30 group-hover:to-orange-500/30 transition-all duration-500" />
      
      <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl hover:bg-black/50 transition-all duration-500">
        {/* Inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-pink-500/5 rounded-3xl" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-2xl animate-pulse" />
              <AlertTriangle className="relative w-5 h-5 text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.6)]" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white flex items-center gap-2 tracking-wide">
                FCS Weather Status
              </h3>
              <p className="text-xs text-gray-300 mt-1 font-light tracking-wide">
                {timestamp}
              </p>
            </div>
          </div>
          <button
            onClick={fetchWeatherStatus}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-50 transition-all duration-300"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
