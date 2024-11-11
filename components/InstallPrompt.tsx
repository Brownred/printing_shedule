/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useState, useEffect } from 'react';
import { Bell, X, Download, Share2, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const LOCAL_STORAGE_KEY = 'pwa_installed';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installationStatus, setInstallationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check if app is already installed (from local storage)
    const isInstalled = localStorage.getItem(LOCAL_STORAGE_KEY) === 'true';
    
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Also check if the app is launched in standalone mode
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
      }
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Only show prompt if not already installed
    const timer = setTimeout(() => {
      setShowPrompt(!isInstalled);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) return;

    if (deferredPrompt) {
      try {
        const result = await (deferredPrompt as any).prompt();
        if (result.outcome === 'accepted') {
          setInstallationStatus('success');
          setDeferredPrompt(null);
          // Save installation state to local storage
          localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
          setTimeout(() => setShowPrompt(false), 2000);
        }
      } catch (err) {
        setInstallationStatus('error');
        console.error(err);
      }
    }
  };

  // Handle manual iOS installation completion
  const handleIOSInstallDismiss = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50 animate-in slide-in-from-bottom duration-700">
      <Alert className="relative bg-white shadow-xl border-gray-200 border-2 rounded-xl">
        <Bell className="h-4 w-4 text-gray-500" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-4 h-8 w-8 hover:bg-gray-50 text-gray-500"
          onClick={isIOS ? handleIOSInstallDismiss : () => setShowPrompt(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <AlertTitle className="text-lg font-semibold text-gray-700">
          Install MMU Printing Press
        </AlertTitle>

        <AlertDescription className="mt-3">
          {isIOS ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Get the full MMU Printing experience! Follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  Tap <Share2 className="h-4 w-4 text-gray-500" /> share button
                </li>
                <li className="flex items-center gap-2">
                  Select <Plus className="h-4 w-4 text-gray-500" /> &apos;Add to Home Screen&apos;
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Get instant access and offline features with our app!
              </p>
              <Button
                className="w-full bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                onClick={handleInstallClick}
                disabled={installationStatus !== 'idle'}
              >
                <Download className="mr-2 h-4 w-4" />
                {installationStatus === 'success' ? '📃 Successfully Installed!' :
                 installationStatus === 'error' ? 'Try Again' :
                 'Install Nailedit App'}
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default InstallPrompt;