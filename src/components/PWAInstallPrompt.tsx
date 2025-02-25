import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallPromptProps {
  language?: 'en' | 'es';
}

const PWAInstallPrompt = ({ language = 'en' }: PWAInstallPromptProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStackBlitz] = useState(() => window.location.hostname.includes('stackblitz.io'));

  useEffect(() => {
    // Don't show prompt on StackBlitz
    if (isStackBlitz) return;

    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) return;

    // Check if previously dismissed
    const isDismissed = localStorage.getItem('pwaPromptDismissed');
    if (isDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStackBlitz]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwaPromptDismissed', 'true');
  };

  // Don't render anything on StackBlitz
  if (isStackBlitz || !showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 animate-fade-in">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-blue-700 rounded-full transition-colors"
      >
        <X size={20} />
      </button>
      
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 bg-blue-700 rounded-full">
          <Download size={24} />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">
            {language === 'es' 
              ? 'Instalar VÍGIA'
              : 'Install VÍGIA'}
          </h3>
          <p className="text-blue-100 text-sm mb-3">
            {language === 'es'
              ? 'Instala la aplicación para un acceso más rápido y mejor rendimiento.'
              : 'Install the app for faster access and better performance.'}
          </p>
          <button
            onClick={handleInstall}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            {language === 'es' ? 'Instalar' : 'Install'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;