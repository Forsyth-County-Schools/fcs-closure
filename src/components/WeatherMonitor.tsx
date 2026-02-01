'use client';

import { useState, useEffect } from 'react';
import { Cloud, AlertTriangle, CheckCircle, Clock, RefreshCw, Bell, Settings } from 'lucide-react';
import AutoRefreshManager from './AutoRefreshManager';
import { autoRefreshMonitor } from '@/lib/auto-refresh-monitor';

interface WeatherStatus {
  status: string;
  lastUpdated: string;
  isMonitoring: boolean;
  lastCheck: string;
  updateCount: number;
}

export default function WeatherMonitor() {
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>({
    status: 'Loading...',
    lastUpdated: 'Never',
    isMonitoring: false,
    lastCheck: 'Never',
    updateCount: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAutoRefresh, setShowAutoRefresh] = useState(false);

  // Handle auto-refresh updates
  const handleAutoRefreshUpdate = (status: string, timestamp: Date) => {
    setWeatherStatus(prev => ({
      status,
      lastUpdated: timestamp.toISOString(),
      isMonitoring: true,
      lastCheck: timestamp.toLocaleString(),
      updateCount: prev.updateCount + 1
    }));
    
    // Show notification (you could customize this)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FCS Weather Update', {
        body: 'New weather status update detected!',
        icon: '/favicon.ico'
      });
    }
  };

  // Fetch current status from API
  const fetchWeatherStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/fcs-weather');
      const data = await response.json();
      
      if (data.success) {
        const now = new Date();
        setWeatherStatus(prev => ({
          status: data.status,
          lastUpdated: now.toISOString(),
          isMonitoring: true,
          lastCheck: now.toLocaleString(),
          updateCount: prev.updateCount + (prev.status !== data.status ? 1 : 0)
        }));
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
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Set up auto-refresh state sync
    const updateFromMonitor = () => {
      const monitorState = autoRefreshMonitor.getState();
      setWeatherStatus(prev => ({
        ...prev,
        isMonitoring: monitorState.isMonitoring,
        updateCount: monitorState.updateCount
      }));
    };

    const interval = setInterval(updateFromMonitor, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (weatherStatus.status.toLowerCase().includes('canceled') || 
        weatherStatus.status.toLowerCase().includes('closed')) {
      return <AlertTriangle className="w-6 h-6 text-red-500" />;
    } else if (weatherStatus.status.toLowerCase().includes('delayed')) {
      return <Clock className="w-6 h-6 text-yellow-500" />;
    } else {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
  };

  const getStatusColor = () => {
    if (weatherStatus.status.toLowerCase().includes('canceled') || 
        weatherStatus.status.toLowerCase().includes('closed')) {
      return 'border-red-200 bg-red-50';
    } else if (weatherStatus.status.toLowerCase().includes('delayed')) {
      return 'border-yellow-200 bg-yellow-50';
    } else {
      return 'border-green-200 bg-green-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Cloud className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Forsyth County Schools Weather Monitor</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAutoRefresh(!showAutoRefresh)}
            className={`p-2 ${showAutoRefresh ? 'text-blue-600 bg-blue-100' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} rounded-lg transition-colors`}
            title="Auto-Refresh Manager"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={fetchWeatherStatus}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-3">Monitoring Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check Interval
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Every 5 minutes</option>
                <option>Every 15 minutes</option>
                <option>Every 30 minutes</option>
                <option>Every hour</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Notifications
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Refresh Manager */}
      {showAutoRefresh && (
        <div className="mb-6">
          <AutoRefreshManager onUpdate={handleAutoRefreshUpdate} />
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current Status */}
        <div className={`lg:col-span-2 p-6 border-2 rounded-lg ${getStatusColor()}`}>
          <div className="flex items-start gap-4">
            {getStatusIcon()}
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">Current Status</h2>
              <p className="text-gray-700 leading-relaxed">{weatherStatus.status}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Last Updated: {weatherStatus.lastUpdated}
                </span>
                {weatherStatus.isMonitoring && (
                  <span className="flex items-center gap-1 text-green-600">
                    <Bell className="w-4 h-4" />
                    Monitoring Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Monitoring Info */}
        <div className="space-y-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="font-semibold mb-3">Monitoring Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${weatherStatus.isMonitoring ? 'text-green-600' : 'text-gray-500'}`}>
                  {weatherStatus.isMonitoring ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Check:</span>
                <span className="text-sm">{weatherStatus.lastCheck}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Updates Found:</span>
                <span className="font-medium">{weatherStatus.updateCount}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-900">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Start Monitoring
              </button>
              <button className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
                View History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Source Information */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1">Information Source</h3>
            <p className="text-sm text-gray-600">
              Monitoring: <a 
                href="https://www.forsyth.k12.ga.us/district-services/communications/inclement-weather-closure" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Forsyth County Schools Official Weather Page
              </a>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Auto-refresh every 5 minutes</p>
            <p className="text-xs text-gray-500">Next check: Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
