import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { api } from '@/lib/api';
import { popunderManager } from '@/lib/PopunderManager';

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
  triggerPopunderSafe: (event: React.MouseEvent | MouseEvent) => boolean;
}

const PopunderContext = createContext<PopunderContextValue | null>(null);

export function PopunderProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PopunderSettings>({
    enabled: false,
    code: '',
    frequencyMinutes: 30
  });
  const [isReady, setIsReady] = useState(false);
  const settingsLoadedRef = useRef(false);

  useEffect(() => {
    if (settingsLoadedRef.current) return;
    
    async function loadSettings() {
      try {
        const data = await api.getSettings();
        const loadedSettings = {
          enabled: data.popunder_enabled === 'true',
          code: data.popunder_code || '',
          frequencyMinutes: parseInt(data.popunder_frequency_minutes || '30', 10)
        };
        setSettings(loadedSettings);
        popunderManager.setConfig(loadedSettings);
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
    return popunderManager.canShowPopunder();
  }, []);

  const triggerPopunder = useCallback((): boolean => {
    return popunderManager.triggerPopunder();
  }, []);

  const triggerPopunderSafe = useCallback((event: React.MouseEvent | MouseEvent): boolean => {
    return popunderManager.triggerPopunderSafe(event);
  }, []);

  const value: PopunderContextValue = {
    isReady,
    settings,
    canShowPopunder,
    triggerPopunder,
    triggerPopunderSafe
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
      triggerPopunder: () => false,
      triggerPopunderSafe: () => false
    };
  }
  
  return context;
}
