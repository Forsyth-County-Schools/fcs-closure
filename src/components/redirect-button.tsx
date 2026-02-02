'use client';

import { useState } from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import RedirectNotification from './redirect-notification';

interface RedirectButtonProps {
  url: string;
  message?: string;
}

export default function RedirectButton({ 
  url, 
  message = "Redirecting you to the district's official weather closure page..." 
}: RedirectButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const handleRedirect = () => {
    setShowConfirmation(true);
  };

  const confirmRedirect = () => {
    setShowConfirmation(false);
    setShowNotification(true);
  };

  const cancelRedirect = () => {
    setShowConfirmation(false);
  };

  const handleNotificationComplete = () => {
    setShowNotification(false);
  };

  return (
    <>
      {showNotification && (
        <RedirectNotification
          show={showNotification}
          url={url}
          message={message}
          onComplete={handleNotificationComplete}
        />
      )}

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Leaving This Site
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {message}
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  You will be redirected to:
                  <br />
                  <span className="font-mono text-xs break-all">{url}</span>
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelRedirect}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRedirect}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={handleRedirect}
        className="group relative px-5 py-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 hover:from-blue-400 hover:via-purple-400 hover:to-indigo-400 text-white font-black text-sm rounded-xl shadow-2xl hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] hover:scale-105 transition-all duration-500 flex items-center gap-2 tracking-wide uppercase"
      >
        {/* Button glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-xl blur-xl group-hover:from-blue-500/40 group-hover:via-purple-500/40 group-hover:to-indigo-500/40 transition-all duration-500" />
        
        {/* Button content */}
        <div className="relative flex items-center gap-2">
          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />
          <span>Visit District Site</span>
        </div>
      </button>
    </>
  );
}
