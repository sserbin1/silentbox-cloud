'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-12 bg-[#09090B]">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-6">
          <WifiOff className="w-10 h-10 text-zinc-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-zinc-400 mb-8">
          It looks like you've lost your internet connection.
          Please check your connection and try again.
        </p>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/30 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>

        {/* Tips */}
        <div className="mt-12 text-left bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="font-semibold text-zinc-200 mb-3">While you're offline:</h3>
          <ul className="space-y-2 text-sm text-zinc-500">
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span>Your recent bookings are saved locally</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span>Access codes for active sessions are available</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span>New bookings will sync when you're back online</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
