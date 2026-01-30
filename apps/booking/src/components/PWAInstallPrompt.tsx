'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissed = dismissedDate
      ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    // Don't show if dismissed within 7 days
    if (daysSinceDismissed < 7) return;

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after delay
      setTimeout(() => {
        if (!standalone) setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show iOS prompt after delay
    if (iOS && !standalone) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 p-4 z-50 safe-area-bottom">
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-3">
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Install Silentbox</h3>
              <p className="text-xs opacity-90">Add to home screen for quick access</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isIOS ? (
            // iOS Instructions
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Install this app on your iPhone:
              </p>
              <ol className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium">1</span>
                  <span>Tap the <strong>Share</strong> button in Safari</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium">2</span>
                  <span>Select <strong>"Add to Home Screen"</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium">3</span>
                  <span>Tap <strong>"Add"</strong> to confirm</span>
                </li>
              </ol>
              <button
                onClick={handleDismiss}
                className="w-full mt-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Got it
              </button>
            </div>
          ) : (
            // Android/Chrome Install
            <div className="space-y-3">
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Quick access from home screen</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Works offline</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Push notifications</span>
                </li>
              </ul>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Not now
                </button>
                <button
                  onClick={handleInstall}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Install
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
