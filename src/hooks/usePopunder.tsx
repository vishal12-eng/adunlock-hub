import { createContext, useContext, useCallback, ReactNode } from 'react';
import { popunderManager } from '@/lib/PopunderManager';

interface PopunderContextValue {
  triggerPopunder: () => boolean;
  triggerPopunderSafe: (event: React.MouseEvent | MouseEvent) => boolean;
}

const PopunderContext = createContext<PopunderContextValue | null>(null);

export function PopunderProvider({ children }: { children: ReactNode }) {
  const triggerPopunder = useCallback((): boolean => {
    return popunderManager.triggerPopunder();
  }, []);

  const triggerPopunderSafe = useCallback((event: React.MouseEvent | MouseEvent): boolean => {
    return popunderManager.triggerPopunderSafe(event);
  }, []);

  const value: PopunderContextValue = {
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
      triggerPopunder: () => false,
      triggerPopunderSafe: () => false
    };
  }
  
  return context;
}
