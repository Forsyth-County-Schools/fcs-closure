'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';

interface RedirectNotificationProps {
  show: boolean;
  url: string;
  message?: string;
  onComplete?: () => void;
}

export default function RedirectNotification({ 
  show, 
  url, 
  message = "Redirecting to district website...",
  onComplete 
}: RedirectNotificationProps) {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    if (!show) return;

    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = ((duration - remaining) / duration) * 100;
      
      setProgress(progressPercent);
      setTimeLeft(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        clearInterval(interval);
        // Secure redirect
        window.location.replace(url);
        onComplete?.();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [show, url, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-in slide-in-from-right duration-300">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                Redirecting
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {timeLeft}s remaining
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {message}
        </p>

        {/* URL display */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 mb-3">
          <p className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all">
            {url}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Cancel button */}
        <button
          onClick={() => {
            setProgress(0);
            setTimeLeft(0);
            onComplete?.();
          }}
          className="mt-3 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Cancel redirect
        </button>
      </div>
    </div>
  );
}
