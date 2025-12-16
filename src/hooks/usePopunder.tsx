import { createContext, useContext, useCallback, ReactNode } from 'react';
import { popunderManager } from '@/lib/PopunderManager';

interface PopunderContextValue {
  canShowPopunder: () => boolean;
  triggerPopunder: () => boolean;
  triggerPopunderSafe: (event: React.MouseEvent | MouseEvent) => boolean;
}

const PopunderContext = createContext<PopunderContextValue | null>(null);

export function PopunderProvider({ children }: { children: ReactNode }) {
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
      canShowPopunder: () => false,
      triggerPopunder: () => false,
      triggerPopunderSafe: () => false
    };
  }
  
  return context;
}
