'use client';

import { RefreshCw } from 'lucide-react';

export default function RefreshButton() {
  return (
    <button 
      onClick={() => window.location.reload()}
      className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-3"
    >
      <RefreshCw className="w-5 h-5" />
      Refresh Status
    </button>
  );
}
