'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <WifiOff className="w-10 h-10 text-muted-foreground" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-8">
          It looks like you've lost your internet connection.
          Please check your connection and try again.
        </p>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>

        {/* Tips */}
        <div className="mt-12 text-left bg-muted/30 rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-3">While you're offline:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Your recent bookings are saved locally</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Access codes for active sessions are available</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>New bookings will sync when you're back online</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
