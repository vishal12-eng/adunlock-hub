import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { api } from '@/lib/api';

interface PopunderSettings {
  enabled: boolean;
  code: string;
  frequencyMinutes: number;
}

interface PopunderContextValue {
  isReady: boolean;
  settings: PopunderSettings;
  canShowPopunder: () => boolean;
  triggerPopunder: () => boolean;
}

const POPUNDER_LAST_SHOWN_KEY = 'adnexus_popunder_last_shown';

const PopunderContext = createContext<PopunderContextValue | null>(null);

export function PopunderProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PopunderSettings>({
    enabled: false,
    code: '',
    frequencyMinutes: 30
  });
  const [isReady, setIsReady] = useState(false);
  const settingsLoadedRef = useRef(false);
  const triggerLockRef = useRef(false);

  useEffect(() => {
    if (settingsLoadedRef.current) return;
    
    async function loadSettings() {
      try {
        const data = await api.getSettings();
        setSettings({
          enabled: data.popunder_enabled === 'true',
          code: data.popunder_code || '',
          frequencyMinutes: parseInt(data.popunder_frequency_minutes || '30', 10)
        });
        settingsLoadedRef.current = true;
        setIsReady(true);
      } catch (error) {
        console.error('Failed to load popunder settings:', error);
        setIsReady(true);
      }
    }
    
    loadSettings();
  }, []);

  const canShowPopunder = useCallback((): boolean => {
    if (!settings.enabled || !settings.code) {
      return false;
    }

    const lastShown = sessionStorage.getItem(POPUNDER_LAST_SHOWN_KEY);
    if (!lastShown) {
      return true;
    }

    const lastShownTime = parseInt(lastShown, 10);
    const now = Date.now();
    const frequencyMs = settings.frequencyMinutes * 60 * 1000;

    return (now - lastShownTime) >= frequencyMs;
  }, [settings]);

  const triggerPopunder = useCallback((): boolean => {
    if (triggerLockRef.current) {
      return false;
    }

    if (!canShowPopunder()) {
      return false;
    }

    triggerLockRef.current = true;

    try {
      sessionStorage.setItem(POPUNDER_LAST_SHOWN_KEY, Date.now().toString());

      const popunderWindow = window.open('about:blank', '_blank', 'noopener,noreferrer');
      
      if (popunderWindow) {
        popunderWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Loading...</title>
          </head>
          <body>
            ${settings.code}
          </body>
          </html>
        `);
        popunderWindow.document.close();
        
        window.focus();
        
        setTimeout(() => {
          triggerLockRef.current = false;
        }, 1000);
        
        return true;
      }
    } catch (error) {
      console.error('Popunder blocked or failed:', error);
    }

    setTimeout(() => {
      triggerLockRef.current = false;
    }, 100);

    return false;
  }, [settings, canShowPopunder]);

  const value: PopunderContextValue = {
    isReady,
    settings,
    canShowPopunder,
    triggerPopunder
  };

  return (
    <PopunderContext.Provider value={value}>
      {children}
    </PopunderContext.Provider>
  );
}

export function usePopunder(): PopunderContextValue {
  const context = useContext(PopunderContext);
  
  if (!context) {
    return {
      isReady: false,
      settings: { enabled: false, code: '', frequencyMinutes: 30 },
      canShowPopunder: () => false,
      triggerPopunder: () => false
    };
  }
  
  return context;
}
